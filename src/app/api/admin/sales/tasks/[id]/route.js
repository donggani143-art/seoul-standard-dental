import { NextResponse } from 'next/server';
import { requireSalesAuth } from '@/lib/salesAuth';
import { getDb } from '@/lib/db';
import { ensurePlatformSchema } from '@/lib/platform';

async function loadAndAuth(id, session) {
  await ensurePlatformSchema();
  const db = await getDb();
  const row = await db.get(
    `SELECT t.*, p.reseller_account_id FROM sales_tasks t
     JOIN sales_prospects p ON p.id = t.prospect_id
     WHERE t.id = ?`,
    [id]
  );
  if (!row) return { error: '작업을 찾을 수 없습니다.', status: 404 };
  if (session.role !== 'super_admin' && row.reseller_account_id !== session.accountId) {
    return { error: '접근 권한이 없습니다.', status: 403 };
  }
  return { row, db };
}

export async function PATCH(request, { params }) {
  const auth = requireSalesAuth(request);
  if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status });
  const { id } = await params;
  const tid = Number(id);
  if (!Number.isFinite(tid)) return NextResponse.json({ error: 'id 오류' }, { status: 400 });

  const guard = await loadAndAuth(tid, auth.session);
  if (guard.error) return NextResponse.json({ error: guard.error }, { status: guard.status });
  const { db } = guard;

  try {
    const body = await request.json();
    const allowed = ['title', 'category_id', 'start_date', 'end_date', 'memo'];
    const sets = [];
    const params2 = [];
    for (const k of allowed) {
      if (body[k] === undefined) continue;
      if (k === 'category_id') {
        sets.push(`${k} = ?`);
        params2.push(body[k] ? Number(body[k]) : null);
      } else {
        sets.push(`${k} = ?`);
        params2.push(String(body[k] || ''));
      }
    }
    if (!sets.length) return NextResponse.json({ success: true, changes: 0 });
    sets.push('updated_at = CURRENT_TIMESTAMP');
    params2.push(tid);
    const result = await db.run(`UPDATE sales_tasks SET ${sets.join(', ')} WHERE id = ?`, params2);
    return NextResponse.json({ success: true, changes: result.changes });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  const auth = requireSalesAuth(request);
  if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status });
  const { id } = await params;
  const tid = Number(id);
  if (!Number.isFinite(tid)) return NextResponse.json({ error: 'id 오류' }, { status: 400 });

  const guard = await loadAndAuth(tid, auth.session);
  if (guard.error) return NextResponse.json({ error: guard.error }, { status: guard.status });
  const { db } = guard;

  try {
    const result = await db.run('DELETE FROM sales_tasks WHERE id = ?', [tid]);
    return NextResponse.json({ success: true, changes: result.changes });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
