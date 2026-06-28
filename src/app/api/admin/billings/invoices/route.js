// 월별 정산 청구 목록·등록
// GET  /api/admin/billings/invoices?year=YYYY&paymentStatus=unpaid|paid|partial
// POST /api/admin/billings/invoices  — upsert (super_admin only)

import { NextResponse } from 'next/server';
import { getAdminRequestSession, isAdminApiRequest } from '@/lib/adminAuth';
import { listInvoices, upsertInvoice } from '@/lib/billing';

function requireAuth(request) {
  if (!isAdminApiRequest(request)) return null;
  return getAdminRequestSession(request);
}

export async function GET(request) {
  const session = requireAuth(request);
  if (!session) return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 });
  // invoices 는 병원 무관 '플랫폼 전체 월별 정산 합계' 테이블이라 리셀러 단위 분해 불가
  // → 슈퍼관리자 전용 (리셀러는 배정 업체별 billings/payments 로만 조회)
  if (session.role !== 'super_admin') {
    return NextResponse.json({ error: '접근 권한이 없습니다.' }, { status: 403 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const year = searchParams.get('year');
    const paymentStatus = searchParams.get('paymentStatus');
    const invoices = await listInvoices({ year, paymentStatus });
    return NextResponse.json({ invoices });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  const session = requireAuth(request);
  if (!session) return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 });
  if (session.role !== 'super_admin') {
    return NextResponse.json({ error: '슈퍼관리자만 청구를 등록할 수 있습니다.' }, { status: 403 });
  }

  try {
    const body = await request.json();
    const result = await upsertInvoice({
      id: body.id || null,
      billingMonth: body.billingMonth,
      periodStart: body.periodStart,
      periodEnd: body.periodEnd,
      itemCount: body.itemCount,
      supplyAmount: body.supplyAmount,
      vat: body.vat,
      settlementAmount: body.settlementAmount ?? null,
      paidAmount: body.paidAmount,
      paymentStatus: body.paymentStatus ?? null,
      paidAt: body.paidAt,
      notes: body.notes,
    });
    return NextResponse.json({ success: true, ...result });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
