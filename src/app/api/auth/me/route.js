import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import {
  createPatientSessionToken,
  getPatientCookieOptions,
  getPatientSession,
  hashPassword,
  PATIENT_SESSION_COOKIE,
  verifyPassword,
} from '@/lib/patientAuth';

export async function GET(request) {
  const session = getPatientSession(request);

  if (!session) {
    return NextResponse.json({ loggedIn: false });
  }

  const db = await getDb();
  const patient = await db.get(
    'SELECT id, email, name, phone, hospital_id, created_at FROM patients WHERE id = ?',
    [session.id]
  );

  if (!patient) {
    return NextResponse.json({ loggedIn: false });
  }

  return NextResponse.json({ loggedIn: true, patient });
}

export async function PUT(request) {
  const session = getPatientSession(request);
  if (!session) {
    return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 });
  }

  try {
    const { name, phone, email, currentPassword, newPassword } = await request.json();
    const db = await getDb();

    const patient = await db.get('SELECT * FROM patients WHERE id = ?', [session.id]);
    if (!patient) {
      return NextResponse.json({ error: '계정을 찾을 수 없습니다.' }, { status: 404 });
    }

    // 비밀번호 변경 요청 시 현재 비밀번호 확인
    if (newPassword) {
      if (!currentPassword) {
        return NextResponse.json({ error: '현재 비밀번호를 입력해 주세요.' }, { status: 400 });
      }
      if (newPassword.length < 4) {
        return NextResponse.json({ error: '새 비밀번호는 4자 이상이어야 합니다.' }, { status: 400 });
      }
      const valid = await verifyPassword(currentPassword, patient.password_hash);
      if (!valid) {
        return NextResponse.json({ error: '현재 비밀번호가 일치하지 않습니다.' }, { status: 401 });
      }
    }

    // 이메일 중복 체크 (변경 시)
    const newEmail = email?.trim().toLowerCase();
    if (newEmail && newEmail !== patient.email) {
      const dup = await db.get(
        'SELECT id FROM patients WHERE email = ? AND hospital_id = ? AND id != ?',
        [newEmail, patient.hospital_id, patient.id]
      );
      if (dup) {
        return NextResponse.json({ error: '이미 사용 중인 이메일입니다.' }, { status: 409 });
      }
    }

    const updates = [];
    const params = [];
    if (name?.trim()) { updates.push('name = ?'); params.push(name.trim()); }
    if (phone !== undefined) { updates.push('phone = ?'); params.push(phone?.trim() || ''); }
    if (newEmail) { updates.push('email = ?'); params.push(newEmail); }
    if (newPassword) { updates.push('password_hash = ?'); params.push(await hashPassword(newPassword)); }

    if (updates.length === 0) {
      return NextResponse.json({ error: '변경할 내용이 없습니다.' }, { status: 400 });
    }

    params.push(session.id);
    await db.run(`UPDATE patients SET ${updates.join(', ')} WHERE id = ?`, params);

    const updated = await db.get(
      'SELECT id, email, name, phone, hospital_id FROM patients WHERE id = ?',
      [session.id]
    );

    // 세션 재발급 (이메일/이름 변경 시)
    const response = NextResponse.json({ ok: true, patient: updated });
    const token = createPatientSessionToken(updated);
    response.cookies.set(PATIENT_SESSION_COOKIE, token, getPatientCookieOptions(request));
    return response;
  } catch (error) {
    return NextResponse.json({ error: error.message || '오류가 발생했습니다.' }, { status: 500 });
  }
}
