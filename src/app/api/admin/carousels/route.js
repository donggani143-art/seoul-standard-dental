// 네이버 캐러셀 목록·생성 API (업체 스코프)
// GET  /api/admin/carousels         — 현재 업체의 캐러셀 목록
// POST /api/admin/carousels         — 캐러셀 생성 (빈 캐러셀)

import { NextResponse } from 'next/server';
import { getAdminRequestSession, getScopedHospitalId, isAdminApiRequest } from '@/lib/adminAuth';
import { createCarousel, listCarousels } from '@/lib/naverCarousel';

function requireSession(request) {
  if (!isAdminApiRequest(request)) return null;
  return getAdminRequestSession(request);
}

export async function GET(request) {
  const session = requireSession(request);
  if (!session) return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 });
  if (session.role === 'reseller') {
    return NextResponse.json({ error: '접근 권한이 없습니다.' }, { status: 403 });
  }

  const hospitalId = getScopedHospitalId(session);
  if (!hospitalId) {
    return NextResponse.json({ error: '업체를 식별할 수 없습니다.' }, { status: 400 });
  }

  try {
    const carousels = await listCarousels({ hospitalId });
    return NextResponse.json({ carousels });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  const session = requireSession(request);
  if (!session) return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 });
  if (session.role === 'reseller') {
    return NextResponse.json({ error: '접근 권한이 없습니다.' }, { status: 403 });
  }

  const hospitalId = getScopedHospitalId(session);
  if (!hospitalId) {
    return NextResponse.json({ error: '업체를 식별할 수 없습니다.' }, { status: 400 });
  }

  try {
    const body = await request.json();
    const carousel = await createCarousel({
      hospitalId,
      title: body.title,
      pageSlug: body.pageSlug,
      itemType: body.itemType,
    });
    return NextResponse.json({ success: true, carousel });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
