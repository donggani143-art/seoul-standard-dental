import { NextResponse } from 'next/server';
import { requireSalesAuth } from '@/lib/salesAuth';
import { getDb } from '@/lib/db';
import { ensurePlatformSchema } from '@/lib/platform';

// GET — 본인 거래처들의 작업 조회 (기간 필터 옵션)
export async function GET(request) {
  const auth = requireSalesAuth(request);
  if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status });
  const { session } = auth;

  const { searchParams } = new URL(request.url);
  const from = searchParams.get('from') || '';
  const to = searchParams.get('to') || '';
  const prospectIdParam = searchParams.get('prospect_id');

  try {
    await ensurePlatformSchema();
    const db = await getDb();

    const conditions = [];
    const params = [];
    if (session.role !== 'super_admin') {
      conditions.push('p.reseller_account_id = ?');
      params.push(session.accountId);
    }
    if (prospectIdParam) {
      const pid = Number(prospectIdParam);
      if (Number.isFinite(pid)) {
        conditions.push('t.prospect_id = ?');
        params.push(pid);
      }
    }
    if (from) {
      conditions.push("(t.end_date IS NULL OR t.end_date = '' OR t.end_date >= ?)");
      params.push(from);
    }
    if (to) {
      conditions.push("(t.start_date IS NULL OR t.start_date = '' OR t.start_date <= ?)");
      params.push(to);
    }
    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

    const rows = await db.all(
      `
        SELECT t.*, p.name AS prospect_name, c.name AS category_name, c.color AS category_color
        FROM sales_tasks t
        JOIN sales_prospects p ON p.id = t.prospect_id
        LEFT JOIN sales_task_categories c ON c.id = t.category_id
        ${where}
        ORDER BY t.start_date ASC, t.id ASC
      `,
      params
    );
    return NextResponse.json(rows);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST — 작업 생성
export async function POST(request) {
  const auth = requireSalesAuth(request);
  if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status });
  const { session } = auth;

  try {
    const body = await request.json();
    const pid = Number(body.prospect_id);
    if (!Number.isFinite(pid)) return NextResponse.json({ error: 'prospect_id 필요' }, { status: 400 });

    await ensurePlatformSchema();
    const db = await getDb();
    // 본인 거래처 확인
    const own = await db.get('SELECT reseller_account_id FROM sales_prospects WHERE id = ?', [pid]);
    if (!own) return NextResponse.json({ error: '거래처를 찾을 수 없습니다.' }, { status: 404 });
    if (session.role !== 'super_admin' && own.reseller_account_id !== session.accountId) {
      return NextResponse.json({ error: '접근 권한이 없습니다.' }, { status: 403 });
    }

    const title = String(body.title || '').trim();
    if (!title) return NextResponse.json({ error: '작업명을 입력해 주세요.' }, { status: 400 });
    const categoryId = body.category_id ? Number(body.category_id) : null;
    const startDate = String(body.start_date || '');
    const endDate = String(body.end_date || '');
    const memo = String(body.memo || '');

    const result = await db.run(
      `INSERT INTO sales_tasks (prospect_id, title, category_id, start_date, end_date, memo, created_by_account_id)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [pid, title, categoryId, startDate, endDate, memo, session.accountId]
    );
    return NextResponse.json({ success: true, id: result.lastID });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
