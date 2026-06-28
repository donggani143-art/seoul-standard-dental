import { NextResponse } from 'next/server';
import { requireSalesAuth, assertOwnedProspect } from '@/lib/salesAuth';
import { getDb } from '@/lib/db';
import { ensurePlatformSchema } from '@/lib/platform';
import { encryptSecret, decryptSecret, isSalesCryptoReady } from '@/lib/salesCrypto';

// kind 화이트리스트
const KINDS = ['domain', 'hosting', 'admin', 'ftp', 'seo', 'mail'];

export async function GET(request, { params }) {
  const auth = requireSalesAuth(request);
  if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status });
  const { id } = await params;
  const pid = Number(id);
  if (!Number.isFinite(pid)) return NextResponse.json({ error: 'id 오류' }, { status: 400 });
  const guard = await assertOwnedProspect(auth.session, pid);
  if (guard.error) return NextResponse.json({ error: guard.error }, { status: guard.status });

  if (!isSalesCryptoReady()) {
    return NextResponse.json({
      error: 'SALES_CRED_SECRET 환경변수가 설정되지 않았습니다. 관리자에게 문의하세요.',
      code: 'NO_SECRET',
    }, { status: 503 });
  }

  await ensurePlatformSchema();
  const db = await getDb();
  const rows = await db.all(
    'SELECT kind, provider, account_id, account_pw_enc, url, note, updated_at FROM sales_credentials WHERE prospect_id = ?',
    [pid]
  );
  // 비밀번호 복호화 — 본인 리셀러 또는 슈퍼관리자
  const result = {};
  for (const k of KINDS) result[k] = { provider: '', account_id: '', account_pw: '', url: '', note: '' };
  for (const r of rows) {
    if (!KINDS.includes(r.kind)) continue;
    let pw = '';
    try { pw = r.account_pw_enc ? decryptSecret(r.account_pw_enc) : ''; }
    catch { pw = ''; }
    result[r.kind] = {
      provider: r.provider || '',
      account_id: r.account_id || '',
      account_pw: pw,
      url: r.url || '',
      note: r.note || '',
      updated_at: r.updated_at,
    };
  }
  return NextResponse.json(result);
}

export async function PUT(request, { params }) {
  const auth = requireSalesAuth(request);
  if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status });
  const { id } = await params;
  const pid = Number(id);
  if (!Number.isFinite(pid)) return NextResponse.json({ error: 'id 오류' }, { status: 400 });
  const guard = await assertOwnedProspect(auth.session, pid);
  if (guard.error) return NextResponse.json({ error: guard.error }, { status: guard.status });

  if (!isSalesCryptoReady()) {
    return NextResponse.json({
      error: 'SALES_CRED_SECRET 환경변수가 설정되지 않아 저장할 수 없습니다.',
      code: 'NO_SECRET',
    }, { status: 503 });
  }

  try {
    const body = await request.json();
    // body: { [kind]: { provider, account_id, account_pw, url, note } }
    await ensurePlatformSchema();
    const db = await getDb();
    for (const kind of KINDS) {
      const data = body[kind];
      if (!data || typeof data !== 'object') continue;
      const pwEnc = data.account_pw ? encryptSecret(String(data.account_pw)) : '';
      await db.run(
        `INSERT INTO sales_credentials (prospect_id, kind, provider, account_id, account_pw_enc, url, note, updated_by_account_id)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)
         ON CONFLICT(prospect_id, kind) DO UPDATE SET
           provider = excluded.provider,
           account_id = excluded.account_id,
           account_pw_enc = excluded.account_pw_enc,
           url = excluded.url,
           note = excluded.note,
           updated_at = CURRENT_TIMESTAMP,
           updated_by_account_id = excluded.updated_by_account_id`,
        [pid, kind, String(data.provider || ''), String(data.account_id || ''), pwEnc, String(data.url || ''), String(data.note || ''), auth.session.accountId]
      );
    }
    await db.run('UPDATE sales_prospects SET updated_at = CURRENT_TIMESTAMP WHERE id = ?', [pid]);
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
