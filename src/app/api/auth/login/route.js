import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { ensurePlatformSchema } from '@/lib/platform';
import { getCurrentHospital } from '@/lib/hospitalContext';
import { verifyPassword, createPatientSessionToken, PATIENT_SESSION_COOKIE, getPatientCookieOptions } from '@/lib/patientAuth';

export async function POST(request) {
  try {
    const { email, password } = await request.json();

    if (!email?.trim() || !password) {
      return NextResponse.json({ error: '이메일과 비밀번호를 입력해 주세요.' }, { status: 400 });
    }

    await ensurePlatformSchema();
    const db = await getDb();

    const hospital = await getCurrentHospital();
    const hospitalId = hospital?.hospitalId ?? null;
    if (!hospitalId) {
      return NextResponse.json({ error: '업체를 식별할 수 없습니다.' }, { status: 400 });
    }

    const patient = await db.get(
      'SELECT * FROM patients WHERE email = ? AND hospital_id = ?',
      [email.trim().toLowerCase(), hospitalId]
    );

    if (!patient) {
      return NextResponse.json({ error: '이메일 또는 비밀번호가 올바르지 않습니다.' }, { status: 401 });
    }

    const valid = await verifyPassword(password, patient.password_hash);
    if (!valid) {
      return NextResponse.json({ error: '이메일 또는 비밀번호가 올바르지 않습니다.' }, { status: 401 });
    }

    const token = createPatientSessionToken(patient);

    const response = NextResponse.json({
      ok: true,
      patient: { id: patient.id, email: patient.email, name: patient.name },
    });

    response.cookies.set(PATIENT_SESSION_COOKIE, token, getPatientCookieOptions(request));
    return response;
  } catch (error) {
    return NextResponse.json({ error: error.message || '로그인 중 오류가 발생했습니다.' }, { status: 500 });
  }
}
