import { NextResponse } from 'next/server';
import { getAdminRequestSession, isAdminApiRequest } from '@/lib/adminAuth';
import { buildResellerSettlement, saveResellerRates, setSettlementStatus } from '@/lib/resellerSettlement';

export const dynamic = 'force-dynamic';

function requireSuper(request) {
  if (!isAdminApiRequest(request)) {
    return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 });
  }
  const session = getAdminRequestSession(request);
  if (!session || session.role !== 'super_admin') {
    return NextResponse.json({ error: '슈퍼관리자만 접근할 수 있습니다.' }, { status: 403 });
  }
  return null;
}

// GET ?month=YYYY-MM — 월별 리셀러 정산 집계
export async function GET(request) {
  const gate = requireSuper(request);
  if (gate) return gate;
  const { searchParams } = new URL(request.url);
  const month = searchParams.get('month') || new Date().toISOString().slice(0, 7);
  try {
    const data = await buildResellerSettlement({ month });
    return NextResponse.json(data);
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 400 });
  }
}

// PUT {action:'rates'|'status', ...}
export async function PUT(request) {
  const gate = requireSuper(request);
  if (gate) return gate;
  let body;
  try { body = await request.json(); } catch { return NextResponse.json({ error: '잘못된 요청입니다.' }, { status: 400 }); }

  try {
    if (body.action === 'rates') {
      const r = await saveResellerRates({ accountId: Number(body.account_id), buildPct: body.build_pct, monthlyPct: body.monthly_pct });
      return NextResponse.json({ success: true, ...r });
    }
    if (body.action === 'status') {
      const r = await setSettlementStatus({ accountId: Number(body.account_id), month: String(body.month || ''), status: String(body.status || ''), notes: body.notes });
      return NextResponse.json({ success: true, ...r });
    }
    return NextResponse.json({ error: 'action은 rates|status 만 가능합니다.' }, { status: 400 });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 400 });
  }
}
