import { NextResponse } from 'next/server';
import { requireSalesAuth, assertOwnedProspect } from '@/lib/salesAuth';
import { getDb } from '@/lib/db';
import { ensurePlatformSchema } from '@/lib/platform';

export async function GET(request, { params }) {
  const auth = requireSalesAuth(request);
  if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status });
  const { id } = await params;
  const pid = Number(id);
  if (!Number.isFinite(pid)) return NextResponse.json({ error: 'id 오류' }, { status: 400 });
  const guard = await assertOwnedProspect(auth.session, pid);
  if (guard.error) return NextResponse.json({ error: guard.error }, { status: guard.status });

  await ensurePlatformSchema();
  const db = await getDb();
  const rows = await db.all(
    'SELECT item_key, checked, checked_at FROM sales_checklist WHERE prospect_id = ?',
    [pid]
  );
  const map = {};
  rows.forEach((r) => { map[r.item_key] = { checked: !!r.checked, checked_at: r.checked_at }; });
  return NextResponse.json(map);
}

export async function POST(request, { params }) {
  const auth = requireSalesAuth(request);
  if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status });
  const { id } = await params;
  const pid = Number(id);
  if (!Number.isFinite(pid)) return NextResponse.json({ error: 'id 오류' }, { status: 400 });
  const guard = await assertOwnedProspect(auth.session, pid);
  if (guard.error) return NextResponse.json({ error: guard.error }, { status: guard.status });

  try {
    const { item_key, checked } = await request.json();
    if (!item_key) return NextResponse.json({ error: 'item_key 필요' }, { status: 400 });
    await ensurePlatformSchema();
    const db = await getDb();
    const isChecked = checked ? 1 : 0;
    await db.run(
      `INSERT INTO sales_checklist (prospect_id, item_key, checked, checked_at, checked_by_account_id)
       VALUES (?, ?, ?, CASE WHEN ? = 1 THEN CURRENT_TIMESTAMP ELSE NULL END, ?)
       ON CONFLICT(prospect_id, item_key) DO UPDATE SET
         checked = excluded.checked,
         checked_at = CASE WHEN excluded.checked = 1 THEN CURRENT_TIMESTAMP ELSE NULL END,
         checked_by_account_id = excluded.checked_by_account_id`,
      [pid, item_key, isChecked, isChecked, auth.session.accountId]
    );
    // 거래처 updated_at 갱신
    await db.run('UPDATE sales_prospects SET updated_at = CURRENT_TIMESTAMP WHERE id = ?', [pid]);
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
