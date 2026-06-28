// 결제 내역 자동 재생성 (super_admin only)
// POST  body: { month?: 'YYYY-MM' } — month 없으면 전체 재계산

import { NextResponse } from 'next/server';
import { getAdminRequestSession, isAdminApiRequest } from '@/lib/adminAuth';
import { generatePaymentsForMonth, regenerateAllPayments } from '@/lib/billingPayments';

export async function POST(request) {
  if (!isAdminApiRequest(request)) {
    return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 });
  }
  const session = getAdminRequestSession(request);
  if (session?.role !== 'super_admin') {
    return NextResponse.json({ error: '슈퍼관리자만 재계산할 수 있습니다.' }, { status: 403 });
  }

  try {
    const body = await request.json().catch(() => ({}));
    if (body?.month) {
      const result = await generatePaymentsForMonth({ month: body.month });
      return NextResponse.json({ success: true, ...result });
    }
    const result = await regenerateAllPayments();
    return NextResponse.json({ success: true, ...result });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
