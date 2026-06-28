// 단일 업체 정산 상세 + 삭제
// GET    /api/admin/billings/{hospitalId} — 정산 상세 + 메모 목록
// DELETE /api/admin/billings/{hospitalId} — super_admin only, 정산 본체 삭제

import { NextResponse } from 'next/server';
import { getAdminRequestSession, isAdminApiRequest } from '@/lib/adminAuth';
import { deleteBillingById, getBillingByHospitalId } from '@/lib/billing';
import { resellerCanAccessHospital } from '@/lib/resellerAssignments';

function requireSession(request) {
  if (!isAdminApiRequest(request)) return null;
  return getAdminRequestSession(request);
}

async function canAccess(session, hospitalId) {
  if (!session) return false;
  if (session.role === 'super_admin') return true;
  if (session.role === 'reseller') {
    return resellerCanAccessHospital(session.accountId, hospitalId);
  }
  return false;
}

export async function GET(request, { params }) {
  const session = requireSession(request);
  if (!session) return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 });

  const resolved = await params;
  const hospitalId = Number(resolved.hospitalId || 0);
  if (!hospitalId) return NextResponse.json({ error: 'hospitalId가 필요합니다.' }, { status: 400 });

  if (!(await canAccess(session, hospitalId))) {
    return NextResponse.json({ error: '접근 권한이 없습니다.' }, { status: 403 });
  }

  try {
    const billing = await getBillingByHospitalId(hospitalId);
    return NextResponse.json({ billing });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  const session = requireSession(request);
  if (!session) return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 });
  if (session.role !== 'super_admin') {
    return NextResponse.json({ error: '슈퍼관리자만 삭제할 수 있습니다.' }, { status: 403 });
  }

  const resolved = await params;
  const hospitalId = Number(resolved.hospitalId || 0);
  if (!hospitalId) return NextResponse.json({ error: 'hospitalId가 필요합니다.' }, { status: 400 });

  try {
    const billing = await getBillingByHospitalId(hospitalId);
    if (!billing) return NextResponse.json({ error: '정산 정보가 없습니다.' }, { status: 404 });
    const changes = await deleteBillingById(billing.id);
    return NextResponse.json({ success: true, changes });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
