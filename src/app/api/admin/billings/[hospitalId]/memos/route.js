// 정산 메모 추가
// POST /api/admin/billings/{hospitalId}/memos { body }
// - super_admin: 모든 업체에 작성 가능
// - reseller: 본인에게 배정된 업체만 작성 가능
// - 정산 본체가 없으면 자동 생성 후 메모 추가 (super_admin만; reseller는 본체 없으면 거부)

import { NextResponse } from 'next/server';
import { getAdminRequestSession, isAdminApiRequest } from '@/lib/adminAuth';
import { addBillingMemo, getBillingByHospitalId, upsertBilling } from '@/lib/billing';
import { resellerCanAccessHospital } from '@/lib/resellerAssignments';

function requireSession(request) {
  if (!isAdminApiRequest(request)) return null;
  return getAdminRequestSession(request);
}

export async function POST(request, { params }) {
  const session = requireSession(request);
  if (!session) return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 });

  const resolved = await params;
  const hospitalId = Number(resolved.hospitalId || 0);
  if (!hospitalId) return NextResponse.json({ error: 'hospitalId가 필요합니다.' }, { status: 400 });

  // 권한 검증
  if (session.role === 'reseller') {
    const allowed = await resellerCanAccessHospital(session.accountId, hospitalId);
    if (!allowed) return NextResponse.json({ error: '담당 업체가 아닙니다.' }, { status: 403 });
  } else if (session.role !== 'super_admin') {
    return NextResponse.json({ error: '접근 권한이 없습니다.' }, { status: 403 });
  }

  try {
    const json = await request.json();
    const body = String(json.body || '').trim();
    if (!body) return NextResponse.json({ error: '메모 내용을 입력해 주세요.' }, { status: 400 });

    let billing = await getBillingByHospitalId(hospitalId);
    if (!billing) {
      if (session.role !== 'super_admin') {
        return NextResponse.json(
          { error: '정산 정보가 등록되어 있지 않습니다. 슈퍼관리자가 먼저 등록해야 합니다.' },
          { status: 400 }
        );
      }
      // super_admin이면 빈 본체를 자동 생성
      const created = await upsertBilling({ hospitalId });
      billing = { id: created.id };
    }

    const memo = await addBillingMemo({
      billingId: billing.id,
      accountId: session.accountId,
      role: session.role,
      body,
    });
    return NextResponse.json({ success: true, memo });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
