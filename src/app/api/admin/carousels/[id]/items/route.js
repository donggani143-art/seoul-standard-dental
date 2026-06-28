// 캐러셀 항목 일괄 교체
// PUT /api/admin/carousels/{id}/items  body: { items: [{name, url, image_url, description}, ...] }

import { NextResponse } from 'next/server';
import { getAdminRequestSession, getScopedHospitalId, isAdminApiRequest } from '@/lib/adminAuth';
import { replaceCarouselItems } from '@/lib/naverCarousel';

function requireSession(request) {
  if (!isAdminApiRequest(request)) return null;
  return getAdminRequestSession(request);
}

export async function PUT(request, { params }) {
  const session = requireSession(request);
  if (!session) return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 });
  if (session.role === 'reseller') {
    return NextResponse.json({ error: '접근 권한이 없습니다.' }, { status: 403 });
  }
  const hospitalId = getScopedHospitalId(session);
  if (!hospitalId) {
    return NextResponse.json({ error: '업체를 식별할 수 없습니다.' }, { status: 400 });
  }

  const resolved = await params;
  const id = Number(resolved.id || 0);
  if (!id) return NextResponse.json({ error: 'id가 필요합니다.' }, { status: 400 });

  try {
    const body = await request.json();
    const count = await replaceCarouselItems({
      carouselId: id,
      hospitalId,
      items: body.items,
    });
    return NextResponse.json({ success: true, itemCount: count });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 400 });
  }
}
