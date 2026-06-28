// 업체별 월간 방문 요약 — 슈퍼관리자 전용. AI 크롤링 표에 방문 통계 병합용.
import { NextResponse } from 'next/server';
import { getAdminRequestSession, isAdminApiRequest } from '@/lib/adminAuth';
import { getDb } from '@/lib/db';
import { ensurePlatformSchema } from '@/lib/platform';
import { listVisitorByHospital, isValidMonth } from '@/lib/visitorReport';

export async function GET(request) {
  if (!isAdminApiRequest(request)) {
    return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 });
  }
  const session = getAdminRequestSession(request);
  if (!session || session.role !== 'super_admin') {
    return NextResponse.json({ error: '접근 권한이 없습니다.' }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const month = searchParams.get('month') || new Date().toISOString().slice(0, 7);
  if (!isValidMonth(month)) {
    return NextResponse.json({ error: '월 형식이 올바르지 않습니다. (YYYY-MM)' }, { status: 400 });
  }

  try {
    await ensurePlatformSchema();
    const db = await getDb();
    const byHospital = await listVisitorByHospital(db, month);
    return NextResponse.json({ month, byHospital });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
