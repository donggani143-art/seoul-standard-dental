// 월별 청구 자동 재생성 (super_admin only)
// POST  body: { month?: 'YYYY-MM' }
// - month 있으면 단일 월 재생성
// - month 없으면 모든 영향 월 일괄 재생성

import { NextResponse } from 'next/server';
import { getAdminRequestSession, isAdminApiRequest } from '@/lib/adminAuth';
import { generateInvoiceForMonth, regenerateAllInvoices } from '@/lib/billing';

export async function POST(request) {
  if (!isAdminApiRequest(request)) {
    return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 });
  }
  const session = getAdminRequestSession(request);
  if (session?.role !== 'super_admin') {
    return NextResponse.json({ error: '슈퍼관리자만 자동 생성할 수 있습니다.' }, { status: 403 });
  }

  try {
    const body = await request.json().catch(() => ({}));
    const month = body?.month;
    if (month) {
      const result = await generateInvoiceForMonth({ month });
      return NextResponse.json({ success: true, ...result });
    }
    const result = await regenerateAllInvoices();
    return NextResponse.json({ success: true, ...result });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
