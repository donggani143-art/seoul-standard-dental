import { NextResponse } from 'next/server';
import { requireSalesAuth, assertOwnedProspect } from '@/lib/salesAuth';
import { getDb } from '@/lib/db';
import { ensurePlatformSchema } from '@/lib/platform';

// 병원정보 + 계약/부가서비스 통합 (sales_clinic_info)
const FIELDS = ['subjects', 'strengths', 'refs', 'memo', 'multi', 'maint', 'seo', 'aeo', 'vat', 'files_text', 'answers_json'];

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
  const row = await db.get('SELECT * FROM sales_clinic_info WHERE prospect_id = ?', [pid]);
  const result = {};
  FIELDS.forEach((f) => { result[f] = (row && row[f]) || ''; });
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

  try {
    const body = await request.json();
    await ensurePlatformSchema();
    const db = await getDb();
    // 명시된 필드만
    const colNames = FIELDS.filter((f) => body[f] !== undefined);
    const values = colNames.map((f) => String(body[f] || ''));
    if (colNames.length === 0) {
      return NextResponse.json({ success: true, changes: 0 });
    }
    const placeholders = colNames.map(() => '?').join(', ');
    const updates = colNames.map((f) => `${f} = excluded.${f}`).join(', ');
    await db.run(
      `INSERT INTO sales_clinic_info (prospect_id, ${colNames.join(', ')})
       VALUES (?, ${placeholders})
       ON CONFLICT(prospect_id) DO UPDATE SET ${updates}, updated_at = CURRENT_TIMESTAMP`,
      [pid, ...values]
    );
    await db.run('UPDATE sales_prospects SET updated_at = CURRENT_TIMESTAMP WHERE id = ?', [pid]);
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
