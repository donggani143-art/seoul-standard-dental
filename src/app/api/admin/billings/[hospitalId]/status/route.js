// 정산 등록 상태 변경 (preparing → open → terminated)
// PUT /api/admin/billings/{hospitalId}/status  body: { status: 'preparing'|'open'|'terminated' }

import { NextResponse } from 'next/server';
import { getAdminRequestSession, isAdminApiRequest } from '@/lib/adminAuth';
import { changeBillingStatus } from '@/lib/billing';

export async function PUT(request, { params }) {
  if (!isAdminApiRequest(request)) {
    return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 });
  }
  const session = getAdminRequestSession(request);
  if (session?.role !== 'super_admin') {
    return NextResponse.json({ error: '슈퍼관리자만 상태를 변경할 수 있습니다.' }, { status: 403 });
  }

  const resolved = await params;
  const hospitalId = Number(resolved.hospitalId || 0);
  if (!hospitalId) return NextResponse.json({ error: 'hospitalId가 필요합니다.' }, { status: 400 });

  try {
    const body = await request.json();
    const result = await changeBillingStatus({ hospitalId, nextStatus: body.status });
    return NextResponse.json({ success: true, ...result });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
