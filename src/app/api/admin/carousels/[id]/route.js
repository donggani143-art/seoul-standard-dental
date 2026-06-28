// 단일 캐러셀: 상세 조회 + 본체 수정 + 삭제

import { NextResponse } from 'next/server';
import { getAdminRequestSession, getScopedHospitalId, isAdminApiRequest } from '@/lib/adminAuth';
import { deleteCarousel, getCarouselWithItems, updateCarousel } from '@/lib/naverCarousel';

function requireSession(request) {
  if (!isAdminApiRequest(request)) return null;
  return getAdminRequestSession(request);
}

async function resolveScope(request) {
  const session = requireSession(request);
  if (!session) return { error: NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 }) };
  if (session.role === 'reseller') {
    return { error: NextResponse.json({ error: '접근 권한이 없습니다.' }, { status: 403 }) };
  }
  const hospitalId = getScopedHospitalId(session);
  if (!hospitalId) {
    return { error: NextResponse.json({ error: '업체를 식별할 수 없습니다.' }, { status: 400 }) };
  }
  return { session, hospitalId };
}

export async function GET(request, { params }) {
  const { error, hospitalId } = await resolveScope(request);
  if (error) return error;

  const resolved = await params;
  const id = Number(resolved.id || 0);
  if (!id) return NextResponse.json({ error: 'id가 필요합니다.' }, { status: 400 });

  try {
    const carousel = await getCarouselWithItems({ carouselId: id, hospitalId });
    if (!carousel) return NextResponse.json({ error: '캐러셀을 찾을 수 없습니다.' }, { status: 404 });
    return NextResponse.json({ carousel });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function PUT(request, { params }) {
  const { error, hospitalId } = await resolveScope(request);
  if (error) return error;

  const resolved = await params;
  const id = Number(resolved.id || 0);
  if (!id) return NextResponse.json({ error: 'id가 필요합니다.' }, { status: 400 });

  try {
    const body = await request.json();
    const carousel = await updateCarousel({
      id,
      hospitalId,
      title: body.title,
      pageSlug: body.pageSlug,
      itemType: body.itemType,
      isActive: body.isActive,
      sortOrder: body.sortOrder,
    });
    return NextResponse.json({ success: true, carousel });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 400 });
  }
}

export async function DELETE(request, { params }) {
  const { error, hospitalId } = await resolveScope(request);
  if (error) return error;

  const resolved = await params;
  const id = Number(resolved.id || 0);
  if (!id) return NextResponse.json({ error: 'id가 필요합니다.' }, { status: 400 });

  try {
    const changes = await deleteCarousel({ id, hospitalId });
    return NextResponse.json({ success: true, changes });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
