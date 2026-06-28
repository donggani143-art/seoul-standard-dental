import { NextResponse } from 'next/server';
import { requireSalesAuth, ensureDefaultTaskCategories } from '@/lib/salesAuth';
import { listProspects, createProspect } from '@/lib/salesProspects';

export async function GET(request) {
  const auth = requireSalesAuth(request);
  if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status });
  const { session } = auth;

  try {
    if (session.role === 'reseller') {
      await ensureDefaultTaskCategories(session.accountId);
    }
    const rows = session.role === 'super_admin'
      ? await listProspects({ includeAll: true })
      : await listProspects({ resellerAccountId: session.accountId });
    return NextResponse.json(rows);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  const auth = requireSalesAuth(request);
  if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status });
  const { session } = auth;
  if (session.role !== 'reseller') {
    return NextResponse.json({ error: '리셀러 계정만 거래처를 추가할 수 있습니다.' }, { status: 403 });
  }

  try {
    const body = await request.json();
    const id = await createProspect({
      resellerAccountId: session.accountId,
      name: body.name,
      doctorName: body.doctor_name,
      phone: body.phone,
      addr: body.addr,
      memo: body.memo,
      category: body.category,
    });
    return NextResponse.json({ success: true, id });
  } catch (error) {
    const status = error.code === 'INVALID_NAME' || error.code === 'DUP_NAME' ? 400 : 500;
    return NextResponse.json({ error: error.message, code: error.code }, { status });
  }
}
