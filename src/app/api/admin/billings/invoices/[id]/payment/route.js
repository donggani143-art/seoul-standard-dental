// 결제 처리 — 입금액 갱신 + 상태 자동 추론
// POST /api/admin/billings/invoices/{id}/payment  body: { paidAmount, paidAt }

import { NextResponse } from 'next/server';
import { getAdminRequestSession, isAdminApiRequest } from '@/lib/adminAuth';
import { recordInvoicePayment } from '@/lib/billing';

export async function POST(request, { params }) {
  if (!isAdminApiRequest(request)) {
    return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 });
  }
  const session = getAdminRequestSession(request);
  if (session?.role !== 'super_admin') {
    return NextResponse.json({ error: '슈퍼관리자만 결제 처리할 수 있습니다.' }, { status: 403 });
  }

  const resolved = await params;
  const id = Number(resolved.id || 0);
  if (!id) return NextResponse.json({ error: 'id가 필요합니다.' }, { status: 400 });

  try {
    const body = await request.json();
    const result = await recordInvoicePayment({
      id,
      paidAmount: body.paidAmount,
      paidAt: body.paidAt,
    });
    return NextResponse.json({ success: true, ...result });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
