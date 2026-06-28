// 리셀러 계정·배정 관리 API (super_admin only)
// GET   /api/admin/resellers          → 리셀러 목록 (배정 업체 수 포함)
// PUT   /api/admin/resellers          → 리셀러 배정 업체 갱신 { accountId, hospitalIds: number[] }

import { NextResponse } from 'next/server';
import {
  getAdminRequestSession,
  isAdminApiRequest,
} from '@/lib/adminAuth';
import {
  listResellerAccountsWithCounts,
  listResellerAssignments,
  setResellerHospitalIds,
} from '@/lib/resellerAssignments';

function isSuperAdmin(request) {
  if (!isAdminApiRequest(request)) return false;
  const session = getAdminRequestSession(request);
  return session?.role === 'super_admin';
}

export async function GET(request) {
  if (!isSuperAdmin(request)) {
    return NextResponse.json({ error: '슈퍼관리자 권한이 필요합니다.' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const accountId = Number(searchParams.get('accountId') || 0);

    if (accountId) {
      const assignments = await listResellerAssignments(accountId);
      return NextResponse.json({ accountId, assignments });
    }

    const resellers = await listResellerAccountsWithCounts();
    return NextResponse.json({ resellers });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(request) {
  if (!isSuperAdmin(request)) {
    return NextResponse.json({ error: '슈퍼관리자 권한이 필요합니다.' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const accountId = Number(body.accountId || 0);
    const hospitalIds = Array.isArray(body.hospitalIds) ? body.hospitalIds : [];

    if (!accountId) {
      return NextResponse.json({ error: 'accountId가 필요합니다.' }, { status: 400 });
    }

    const applied = await setResellerHospitalIds(accountId, hospitalIds);
    return NextResponse.json({ success: true, accountId, hospitalIds: applied });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
