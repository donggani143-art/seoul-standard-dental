// 정산 목록·등록 API
// GET   — super_admin: 전체, reseller: 배정된 업체만
// POST  — super_admin only, upsert (hospital_id UNIQUE)

import { NextResponse } from 'next/server';
import { getAdminRequestSession, isAdminApiRequest } from '@/lib/adminAuth';
import { listBillings, listBillingCandidates, upsertBillingWithAutoInvoice, resolveBillingHospitalForProspect } from '@/lib/billing';
import { getResellerHospitalIds } from '@/lib/resellerAssignments';

function requireSession(request) {
  if (!isAdminApiRequest(request)) return null;
  return getAdminRequestSession(request);
}

export async function GET(request) {
  const session = requireSession(request);
  if (!session) {
    return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 });
  }

  try {
    let scope = null;
    if (session.role === 'super_admin') {
      scope = null; // 전체
    } else if (session.role === 'reseller') {
      const ids = await getResellerHospitalIds(session.accountId);
      scope = ids;
    } else {
      return NextResponse.json({ error: '접근 권한이 없습니다.' }, { status: 403 });
    }
    const billings = await listBillings({ hospitalIds: scope });
    // 슈퍼관리자: 정산 미등록 업체(자동 채움 정보 포함)도 함께 — 누락 없이 유기적으로 등록
    if (session.role === 'super_admin') {
      const candidates = await listBillingCandidates();
      return NextResponse.json({ billings, candidates });
    }
    return NextResponse.json({ billings });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  const session = requireSession(request);
  if (!session) {
    return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 });
  }
  if (session.role !== 'super_admin') {
    return NextResponse.json({ error: '슈퍼관리자만 정산을 등록할 수 있습니다.' }, { status: 403 });
  }

  try {
    const body = await request.json();
    // 영업 거래처(prospectId) 선택 시: 연결된(또는 자동 생성한) 비공개 업체로 해석해 정산 등록
    const prospectId = Number(body.prospectId || 0) || undefined;
    let hospitalId = Number(body.hospitalId || 0);
    if (prospectId) {
      const resolved = await resolveBillingHospitalForProspect(prospectId);
      hospitalId = resolved.hospitalId;
    }
    if (!hospitalId) {
      return NextResponse.json({ error: '영업 거래처 또는 업체를 선택해 주세요.' }, { status: 400 });
    }
    const result = await upsertBillingWithAutoInvoice({
      hospitalId,
      prospectId,
      setupFee: body.setupFee,
      monthlyFee: body.monthlyFee,
      setupDate: body.setupDate,
      subscriptionStartDate: body.subscriptionStartDate,
      notes: body.notes,
      status: body.status,
      managerName: body.managerName,
      contractMonths: body.contractMonths,
      contractEndDate: body.contractEndDate,
      serviceOpenDate: body.serviceOpenDate,
      terminatedDate: body.terminatedDate,
      clientManagerName: body.clientManagerName,
      clientPhone: body.clientPhone,
      agencyName: body.agencyName,
      agencyManagerName: body.agencyManagerName,
      agencyPhone: body.agencyPhone,
      buildEndDate: body.buildEndDate,
      buildPaid: body.buildPaid,
      maintenancePaid: body.maintenancePaid,
    });
    return NextResponse.json({ success: true, ...result });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
