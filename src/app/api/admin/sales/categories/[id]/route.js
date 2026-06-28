import { NextResponse } from 'next/server';
import { requireSalesAuth } from '@/lib/salesAuth';
import { getDb } from '@/lib/db';
import { ensurePlatformSchema } from '@/lib/platform';

async function loadAndAuth(id, session) {
  await ensurePlatformSchema();
  const db = await getDb();
  const row = await db.get('SELECT * FROM sales_task_categories WHERE id = ?', [id]);
  if (!row) return { error: '카테고리를 찾을 수 없습니다.', status: 404 };
  if (session.role !== 'super_admin' && row.reseller_account_id !== session.accountId) {
    return { error: '접근 권한이 없습니다.', status: 403 };
  }
  return { row, db };
}

export async function PATCH(request, { params }) {
  const auth = requireSalesAuth(request);
  if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status });
  const { id } = await params;
  const cid = Number(id);
  if (!Number.isFinite(cid)) return NextResponse.json({ error: 'id 오류' }, { status: 400 });

  const guard = await loadAndAuth(cid, auth.session);
  if (guard.error) return NextResponse.json({ error: guard.error }, { status: guard.status });
  const { db, row } = guard;

  try {
    const body = await request.json();
    const allowed = ['name', 'color', 'sort_order'];
    const sets = [];
    const params2 = [];
    for (const k of allowed) {
      if (body[k] === undefined) continue;
      if (k === 'sort_order') {
        sets.push(`${k} = ?`);
        params2.push(Number(body[k]) || 0);
      } else {
        const v = String(body[k] || '').trim();
        if (k === 'name' && !v) return NextResponse.json({ error: '카테고리명을 입력해 주세요.' }, { status: 400 });
        sets.push(`${k} = ?`);
        params2.push(v);
      }
    }
    if (!sets.length) return NextResponse.json({ success: true, changes: 0 });
    // name 중복 가드
    if (body.name && body.name !== row.name) {
      const dup = await db.get(
        'SELECT id FROM sales_task_categories WHERE reseller_account_id = ? AND name = ? AND id != ?',
        [row.reseller_account_id, body.name.trim(), cid]
      );
      if (dup) return NextResponse.json({ error: '이미 같은 이름의 카테고리가 있습니다.' }, { status: 400 });
    }
    params2.push(cid);
    const result = await db.run(`UPDATE sales_task_categories SET ${sets.join(', ')} WHERE id = ?`, params2);
    return NextResponse.json({ success: true, changes: result.changes });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  const auth = requireSalesAuth(request);
  if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status });
  const { id } = await params;
  const cid = Number(id);
  if (!Number.isFinite(cid)) return NextResponse.json({ error: 'id 오류' }, { status: 400 });

  const guard = await loadAndAuth(cid, auth.session);
  if (guard.error) return NextResponse.json({ error: guard.error }, { status: guard.status });
  const { db } = guard;

  try {
    // 카테고리 삭제 시 sales_tasks.category_id 는 ON DELETE SET NULL
    const result = await db.run('DELETE FROM sales_task_categories WHERE id = ?', [cid]);
    return NextResponse.json({ success: true, changes: result.changes });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
