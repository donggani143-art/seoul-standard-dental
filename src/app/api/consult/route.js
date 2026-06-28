import { NextResponse } from 'next/server';
import { getAdminRequestSession, isAdminApiRequest } from '@/lib/adminAuth';
import { getDb } from '@/lib/db';
import { getDefaultHospital, ensurePlatformSchema } from '@/lib/platform';
import { getCurrentHospital } from '@/lib/hospitalContext';

export async function GET(request) {
  if (!isAdminApiRequest(request)) {
    return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 });
  }

  const session = getAdminRequestSession(request);
  const hospitalId = session?.role === 'super_admin'
    ? (session?.impersonateHospitalId ?? null)
    : (session?.hospitalId ?? null);

  try {
    await ensurePlatformSchema();
    const db = await getDb();
    const { searchParams } = new URL(request.url);
    const limit = Math.min(Number(searchParams.get('limit') || 200), 500);

    const hospitalClause = hospitalId !== null ? 'WHERE hospital_id = ?' : '';
    const params = hospitalId !== null ? [limit] : [limit];
    const rows = await db.all(
      `SELECT * FROM consultations ${hospitalId !== null ? 'WHERE hospital_id = ?' : ''} ORDER BY created_at DESC LIMIT ?`,
      hospitalId !== null ? [hospitalId, limit] : [limit]
    );
    return NextResponse.json(rows);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { category, name, phone, email, agreed } = body;

    // 서버 측 입력 검증
    if (!name?.trim()) {
      return NextResponse.json({ error: '이름을 입력해 주세요.' }, { status: 400 });
    }
    if (!phone?.trim()) {
      return NextResponse.json({ error: '연락처를 입력해 주세요.' }, { status: 400 });
    }
    if (!agreed) {
      return NextResponse.json({ error: '개인정보 수집 동의가 필요합니다.' }, { status: 400 });
    }

    await ensurePlatformSchema();
    const currentHospital = await getCurrentHospital();
    const hospitalId = currentHospital?.hospitalId ?? null;
    if (!hospitalId) {
      return NextResponse.json({ error: '업체를 식별할 수 없습니다.' }, { status: 400 });
    }

    const db = await getDb();
    await db.run(
      'INSERT INTO consultations (category, name, phone, email, agreed, hospital_id) VALUES (?, ?, ?, ?, ?, ?)',
      [
        category?.trim() || null,
        name.trim(),
        phone.trim(),
        email?.trim() || null,
        agreed ? 1 : 0,
        hospitalId,
      ]
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to save consultation:', error);
    return NextResponse.json({ success: false, error: '처리 중 오류가 발생했습니다.' }, { status: 500 });
  }
}

export async function DELETE(request) {
  if (!isAdminApiRequest(request)) {
    return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 });
  }

  const session = getAdminRequestSession(request);
  const hospitalId = session?.role === 'super_admin'
    ? (session?.impersonateHospitalId ?? null)
    : (session?.hospitalId ?? null);

  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');

  if (!id) {
    return NextResponse.json({ error: 'id가 필요합니다.' }, { status: 400 });
  }

  try {
    const db = await getDb();
    const hospitalClause = hospitalId !== null ? 'AND hospital_id = ?' : '';
    const params = hospitalId !== null ? [id, hospitalId] : [id];
    await db.run(`DELETE FROM consultations WHERE id = ? ${hospitalClause}`, params);
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
