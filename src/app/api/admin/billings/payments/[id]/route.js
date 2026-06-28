// 단일 결제 행 조회·결제처리·삭제
// GET     상세
// PUT     결제 처리 (입금/완료/실패) — body: { paidAmount, paidAt?, paymentMethod?, receiptUrl?, failureReason?, status? }
// DELETE  삭제

import { NextResponse } from 'next/server';
import { getAdminRequestSession, isAdminApiRequest } from '@/lib/adminAuth';
import { deletePayment, getPaymentById, settlePayment } from '@/lib/billingPayments';
import { resellerCanAccessHospital } from '@/lib/resellerAssignments';

export async function GET(request, { params }) {
  if (!isAdminApiRequest(request)) return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 });
  const session = getAdminRequestSession(request);
  const resolved = await params;
  const id = Number(resolved.id || 0);
  if (!id) return NextResponse.json({ error: 'id가 필요합니다.' }, { status: 400 });

  try {
    const row = await getPaymentById(id);
    if (!row) return NextResponse.json({ error: '결제 행을 찾을 수 없습니다.' }, { status: 404 });
    if (session.role === 'reseller') {
      const ok = await resellerCanAccessHospital(session.accountId, row.hospital_id);
      if (!ok) return NextResponse.json({ error: '접근 권한이 없습니다.' }, { status: 403 });
    } else if (session.role !== 'super_admin') {
      return NextResponse.json({ error: '접근 권한이 없습니다.' }, { status: 403 });
    }
    return NextResponse.json({ payment: row });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function PUT(request, { params }) {
  if (!isAdminApiRequest(request)) return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 });
  const session = getAdminRequestSession(request);
  if (session?.role !== 'super_admin') {
    return NextResponse.json({ error: '슈퍼관리자만 결제 처리할 수 있습니다.' }, { status: 403 });
  }
  const resolved = await params;
  const id = Number(resolved.id || 0);
  if (!id) return NextResponse.json({ error: 'id가 필요합니다.' }, { status: 400 });

  try {
    const body = await request.json();
    const result = await settlePayment({
      id,
      paidAmount: body.paidAmount,
      paidAt: body.paidAt,
      paymentMethod: body.paymentMethod,
      receiptUrl: body.receiptUrl,
      failureReason: body.failureReason,
      status: body.status,
    });
    return NextResponse.json({ success: true, ...result });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 400 });
  }
}

export async function DELETE(request, { params }) {
  if (!isAdminApiRequest(request)) return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 });
  const session = getAdminRequestSession(request);
  if (session?.role !== 'super_admin') {
    return NextResponse.json({ error: '슈퍼관리자만 삭제할 수 있습니다.' }, { status: 403 });
  }
  const resolved = await params;
  const id = Number(resolved.id || 0);
  if (!id) return NextResponse.json({ error: 'id가 필요합니다.' }, { status: 400 });

  try {
    const changes = await deletePayment({ id });
    return NextResponse.json({ success: true, changes });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
