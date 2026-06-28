import { NextResponse } from 'next/server';
import { requireSalesAuth } from '@/lib/salesAuth';
import { getDb } from '@/lib/db';
import { ensurePlatformSchema } from '@/lib/platform';

const VALID_SERVICES = new Set([
  'hp_move', 'hp_opt', 'hp_new', 'monthly', 'backlink', 'google_ai', 'web_top',
  'multi_lang', 'web_post', 'quote', 'contract_doc', 'deposit',
]);

// GET — 본인 거래처들의 services 통합 조회 (대시보드용)
export async function GET(request) {
  const auth = requireSalesAuth(request);
  if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status });
  const { session } = auth;

  try {
    await ensurePlatformSchema();
    const db = await getDb();
    const whereOwn = session.role === 'super_admin' ? '' : 'WHERE p.reseller_account_id = ?';
    const params = session.role === 'super_admin' ? [] : [session.accountId];
    const rows = await db.all(
      `
        SELECT s.prospect_id, s.service_key, s.is_active, s.memo
        FROM sales_service_status s
        JOIN sales_prospects p ON p.id = s.prospect_id
        ${whereOwn}
      `,
      params
    );
    // prospect_id → { service_key: { is_active, memo } }
    const result = {};
    for (const r of rows) {
      if (!result[r.prospect_id]) result[r.prospect_id] = {};
      result[r.prospect_id][r.service_key] = { is_active: !!r.is_active, memo: r.memo || '' };
    }
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// PATCH — 단일 토글 (body: { prospect_id, service_key, is_active })
export async function PATCH(request) {
  const auth = requireSalesAuth(request);
  if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status });
  const { session } = auth;

  try {
    const body = await request.json();
    const pid = Number(body.prospect_id);
    const sk = String(body.service_key || '');
    const active = body.is_active ? 1 : 0;
    if (!Number.isFinite(pid)) return NextResponse.json({ error: 'prospect_id 오류' }, { status: 400 });
    if (!VALID_SERVICES.has(sk)) return NextResponse.json({ error: '잘못된 service_key' }, { status: 400 });

    await ensurePlatformSchema();
    const db = await getDb();
    // 본인 거래처 확인
    const own = await db.get('SELECT reseller_account_id FROM sales_prospects WHERE id = ?', [pid]);
    if (!own) return NextResponse.json({ error: '거래처를 찾을 수 없습니다.' }, { status: 404 });
    if (session.role !== 'super_admin' && own.reseller_account_id !== session.accountId) {
      return NextResponse.json({ error: '접근 권한이 없습니다.' }, { status: 403 });
    }

    await db.run(
      `INSERT INTO sales_service_status (prospect_id, service_key, is_active, started_at, completed_at)
       VALUES (?, ?, ?,
         CASE WHEN ? = 1 THEN COALESCE((SELECT started_at FROM sales_service_status WHERE prospect_id=? AND service_key=?), date('now')) ELSE '' END,
         '')
       ON CONFLICT(prospect_id, service_key) DO UPDATE SET
         is_active = excluded.is_active,
         started_at = CASE WHEN excluded.is_active = 1 AND (sales_service_status.started_at IS NULL OR sales_service_status.started_at = '') THEN date('now') ELSE sales_service_status.started_at END,
         completed_at = CASE WHEN excluded.is_active = 0 THEN date('now') ELSE '' END,
         updated_at = CURRENT_TIMESTAMP`,
      [pid, sk, active, active, pid, sk]
    );
    await db.run('UPDATE sales_prospects SET updated_at = CURRENT_TIMESTAMP WHERE id = ?', [pid]);
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
