import { NextResponse } from 'next/server';
import { requireSalesAuth, ensureDefaultTaskCategories } from '@/lib/salesAuth';
import { getDb } from '@/lib/db';
import { ensurePlatformSchema } from '@/lib/platform';

// GET — 본인 카테고리 (없으면 기본 7종 자동 시드)
export async function GET(request) {
  const auth = requireSalesAuth(request);
  if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status });
  const { session } = auth;

  try {
    await ensurePlatformSchema();
    const db = await getDb();
    if (session.role === 'super_admin') {
      const rows = await db.all('SELECT * FROM sales_task_categories ORDER BY reseller_account_id, sort_order, id');
      return NextResponse.json(rows);
    }
    await ensureDefaultTaskCategories(session.accountId);
    const rows = await db.all(
      'SELECT * FROM sales_task_categories WHERE reseller_account_id = ? ORDER BY sort_order, id',
      [session.accountId]
    );
    return NextResponse.json(rows);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST — 카테고리 추가
export async function POST(request) {
  const auth = requireSalesAuth(request);
  if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status });
  const { session } = auth;
  if (session.role !== 'reseller') {
    return NextResponse.json({ error: '리셀러 계정만 카테고리를 추가할 수 있습니다.' }, { status: 403 });
  }

  try {
    const body = await request.json();
    const name = String(body.name || '').trim();
    const color = String(body.color || '#1a6b4a');
    if (!name) return NextResponse.json({ error: '카테고리명을 입력해 주세요.' }, { status: 400 });

    await ensurePlatformSchema();
    const db = await getDb();
    const dup = await db.get(
      'SELECT id FROM sales_task_categories WHERE reseller_account_id = ? AND name = ?',
      [session.accountId, name]
    );
    if (dup) return NextResponse.json({ error: '이미 같은 이름의 카테고리가 있습니다.' }, { status: 400 });

    const maxRow = await db.get(
      'SELECT COALESCE(MAX(sort_order), -1) AS m FROM sales_task_categories WHERE reseller_account_id = ?',
      [session.accountId]
    );
    const nextOrder = (maxRow?.m ?? -1) + 1;

    const result = await db.run(
      `INSERT INTO sales_task_categories (reseller_account_id, name, color, sort_order)
       VALUES (?, ?, ?, ?)`,
      [session.accountId, name, color, nextOrder]
    );
    return NextResponse.json({ success: true, id: result.lastID });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
