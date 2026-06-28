// 결제 내역 목록 + 자동 재생성
// GET   /api/admin/billings/payments?year=&month=&paymentStatus=&search=
// POST  /api/admin/billings/payments/regenerate (별도 라우트)

import { NextResponse } from 'next/server';
import { getAdminRequestSession, isAdminApiRequest } from '@/lib/adminAuth';
import { listPayments } from '@/lib/billingPayments';
import { getResellerHospitalIds } from '@/lib/resellerAssignments';

export async function GET(request) {
  if (!isAdminApiRequest(request)) {
    return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 });
  }
  const session = getAdminRequestSession(request);
  if (!['super_admin', 'reseller'].includes(session?.role)) {
    return NextResponse.json({ error: '접근 권한이 없습니다.' }, { status: 403 });
  }

  try {
    const { searchParams } = new URL(request.url);
    let hospitalIds = null;
    if (session.role === 'reseller') {
      hospitalIds = await getResellerHospitalIds(session.accountId);
    }
    const result = await listPayments({
      hospitalIds,
      year: searchParams.get('year') || undefined,
      month: searchParams.get('month') || undefined,
      paymentStatus: searchParams.get('paymentStatus') || undefined,
      search: searchParams.get('search') || undefined,
    });
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
