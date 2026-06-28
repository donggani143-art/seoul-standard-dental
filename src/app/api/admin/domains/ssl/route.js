import tls from 'node:tls';
import { NextResponse } from 'next/server';
import { canAccessSuperAdmin, getAdminRequestSession } from '@/lib/adminAuth';
import { getDb } from '@/lib/db';
import { createActivityLog } from '@/lib/platform';

// 도메인 형식만 허용 (값 검증)
function isValidDomain(domain) {
  return /^[a-z0-9]([a-z0-9-]*[a-z0-9])?(\.[a-z0-9]([a-z0-9-]*[a-z0-9])?)+$/i.test(domain);
}

// 이 서버의 SSL은 Caddy On-Demand TLS 로 자동 발급된다(/api/tls/authorize 게이트).
// 따라서 certbot 을 돌리지 않고, Caddy 가 해당 도메인에 "유효한 공개 인증서"를 제공하는지만 확인한다.
// 127.0.0.1:443 으로 접속하되 SNI(servername)를 도메인으로 줘 Caddy 가 그 도메인 인증서를 내놓게 한다.
// 최초 핸드셰이크가 on-demand 발급을 트리거할 수 있어, 호출부에서 몇 차례 재시도한다.
function checkCert(domain, { host = '127.0.0.1', timeoutMs = 8000 } = {}) {
  return new Promise((resolve) => {
    let settled = false;
    const finish = (r) => {
      if (settled) return;
      settled = true;
      try { socket.destroy(); } catch {}
      resolve(r);
    };
    const socket = tls.connect(
      { host, port: 443, servername: domain, timeout: timeoutMs, ALPNProtocols: ['http/1.1'] },
      () => {
        const cert = socket.getPeerCertificate();
        finish({
          ok: socket.authorized === true,
          issuer: (cert && (cert.issuer?.O || cert.issuer?.CN)) || '',
          validTo: (cert && cert.valid_to) || '',
          reason: socket.authorizationError ? String(socket.authorizationError) : '',
        });
      }
    );
    socket.on('error', (e) => finish({ ok: false, reason: e?.message || 'tls error' }));
    socket.on('timeout', () => finish({ ok: false, reason: 'timeout' }));
  });
}

export async function POST(request) {
  const session = getAdminRequestSession(request);
  if (!session) {
    return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 });
  }

  try {
    const { domainId } = await request.json();
    if (!domainId) {
      return NextResponse.json({ error: '도메인 ID가 필요합니다.' }, { status: 400 });
    }

    const db = await getDb();

    // 권한 체크: super_admin은 모든 도메인, hospital_admin은 자기 병원만
    const whereClause = canAccessSuperAdmin(session)
      ? 'WHERE id = ?'
      : 'WHERE id = ? AND hospital_id = ?';
    const params = canAccessSuperAdmin(session) ? [domainId] : [domainId, session.hospitalId];

    const row = await db.get(
      `SELECT id, domain, hospital_id FROM hospital_domains ${whereClause}`,
      params
    );

    if (!row) {
      return NextResponse.json({ error: '도메인을 찾을 수 없습니다.' }, { status: 404 });
    }
    if (!isValidDomain(row.domain)) {
      return NextResponse.json({ error: '유효하지 않은 도메인 형식입니다.' }, { status: 400 });
    }

    await db.run(
      "UPDATE hospital_domains SET ssl_status = 'issuing', last_checked_at = CURRENT_TIMESTAMP WHERE id = ?",
      [row.id]
    );

    // Caddy 자동 발급 확인 (최초 핸드셰이크가 발급을 트리거할 수 있어 최대 4회 ≈ 10초 재시도)
    let result = null;
    for (let attempt = 0; attempt < 4; attempt += 1) {
      result = await checkCert(row.domain);
      if (result.ok) break;
      if (attempt < 3) await new Promise((r) => setTimeout(r, 2500));
    }

    if (result?.ok) {
      await db.run(
        "UPDATE hospital_domains SET ssl_status = 'active', ssl_enabled = 1, status = 'connected', verified_at = COALESCE(verified_at, CURRENT_TIMESTAMP), last_checked_at = CURRENT_TIMESTAMP WHERE id = ?",
        [row.id]
      );

      await createActivityLog({
        accountId: session.accountId,
        hospitalId: row.hospital_id,
        action: 'ssl_issue',
        entityType: 'hospital_domain',
        entityId: row.id,
        afterJson: { domain: row.domain, status: 'active', issuer: result.issuer },
        ipAddress: request.headers.get('x-forwarded-for') || '',
        userAgent: request.headers.get('user-agent') || '',
      });

      return NextResponse.json({
        success: true,
        message: `SSL이 정상 적용되어 있습니다. (자동 발급${result.issuer ? ` · ${result.issuer}` : ''})`,
      });
    }

    await db.run(
      "UPDATE hospital_domains SET ssl_status = 'failed', last_checked_at = CURRENT_TIMESTAMP WHERE id = ?",
      [row.id]
    );
    return NextResponse.json(
      {
        error:
          'SSL 확인에 실패했습니다. 도메인 DNS가 서버 IP(172.235.202.109)로 A 레코드 연결돼 있는지 확인해 주세요. 방금 연결했다면 1~2분 뒤 다시 시도해 주세요.',
        detail: result?.reason || '',
      },
      { status: 500 }
    );
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
