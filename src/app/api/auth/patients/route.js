import { NextResponse } from 'next/server';
import { getAdminRequestSession, isAdminApiRequest } from '@/lib/adminAuth';
import { getDb } from '@/lib/db';
import { ensurePlatformSchema } from '@/lib/platform';

function getHospitalId(session) {
  if (!session) return null;
  if (session.role === 'super_admin') return session.impersonateHospitalId ?? null;
  return session.hospitalId ?? null;
}

export async function GET(request) {
  if (!isAdminApiRequest(request)) {
    return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 });
  }

  const session = getAdminRequestSession(request);
  const hospitalId = getHospitalId(session);

  try {
    await ensurePlatformSchema();
    const db = await getDb();

    const where = hospitalId !== null ? 'WHERE hospital_id = ?' : '';
    const params = hospitalId !== null ? [hospitalId] : [];

    const patients = await db.all(
      `SELECT id, hospital_id, email, name, phone, gender, address, grade, extras, created_at FROM patients ${where} ORDER BY created_at DESC`,
      params
    );
    return NextResponse.json(patients);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PATCH(request) {
  if (!isAdminApiRequest(request)) {
    return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 });
  }

  const session = getAdminRequestSession(request);
  const hospitalId = getHospitalId(session);

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: '잘못된 요청입니다.' }, { status: 400 });
  }

  // 일괄 등급 수정: { ids: [...], grade }
  if (Array.isArray(body?.ids)) {
    const ids = body.ids.map(Number).filter(Number.isFinite);
    if (ids.length === 0) {
      return NextResponse.json({ error: '선택된 회원이 없습니다.' }, { status: 400 });
    }
    const grade = String(body?.grade ?? '').trim().slice(0, 30);
    try {
      await ensurePlatformSchema();
      const db = await getDb();
      if (grade && hospitalId !== null) {
        const exists = await db.get('SELECT id FROM patient_grades WHERE hospital_id = ? AND name = ?', [hospitalId, grade]);
        if (!exists) return NextResponse.json({ error: '존재하지 않는 등급입니다.' }, { status: 400 });
      }
      const placeholders = ids.map(() => '?').join(',');
      const hospitalClause = hospitalId !== null ? 'AND hospital_id = ?' : '';
      const params = hospitalId !== null ? [grade, ...ids, hospitalId] : [grade, ...ids];
      const result = await db.run(`UPDATE patients SET grade = ? WHERE id IN (${placeholders}) ${hospitalClause}`, params);
      return NextResponse.json({ success: true, grade, updated: result.changes });
    } catch (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
  }

  const id = body?.id;
  if (!id) {
    return NextResponse.json({ error: 'id가 필요합니다.' }, { status: 400 });
  }

  try {
    await ensurePlatformSchema();
    const db = await getDb();

    const sets = [];
    const values = [];

    // 보낸 필드만 부분 갱신 (이메일=로그인ID는 변경 불가)
    if (body.name !== undefined) {
      const name = String(body.name || '').trim().slice(0, 100);
      if (!name) return NextResponse.json({ error: '이름은 비울 수 없습니다.' }, { status: 400 });
      sets.push('name = ?'); values.push(name);
    }
    if (body.phone !== undefined) { sets.push('phone = ?'); values.push(String(body.phone || '').trim().slice(0, 50)); }
    if (body.gender !== undefined) { sets.push('gender = ?'); values.push(String(body.gender || '').trim().slice(0, 20)); }
    if (body.address !== undefined) { sets.push('address = ?'); values.push(String(body.address || '').trim().slice(0, 300)); }
    if (body.extras !== undefined) {
      let extras = body.extras;
      if (typeof extras === 'string') { try { extras = JSON.parse(extras || '{}'); } catch { extras = {}; } }
      if (!extras || typeof extras !== 'object' || Array.isArray(extras)) extras = {};
      sets.push('extras = ?'); values.push(JSON.stringify(extras));
    }
    let grade;
    if (body.grade !== undefined) {
      grade = String(body.grade ?? '').trim().slice(0, 30);
      // 등급은 해제('') 이거나, 해당 업체에 정의된 등급명이어야 함
      if (grade && hospitalId !== null) {
        const exists = await db.get('SELECT id FROM patient_grades WHERE hospital_id = ? AND name = ?', [hospitalId, grade]);
        if (!exists) return NextResponse.json({ error: '존재하지 않는 등급입니다.' }, { status: 400 });
      }
      sets.push('grade = ?'); values.push(grade);
    }

    if (sets.length === 0) {
      return NextResponse.json({ error: '수정할 항목이 없습니다.' }, { status: 400 });
    }

    const hospitalClause = hospitalId !== null ? 'AND hospital_id = ?' : '';
    const sqlParams = [...values, id, ...(hospitalId !== null ? [hospitalId] : [])];
    const result = await db.run(`UPDATE patients SET ${sets.join(', ')} WHERE id = ? ${hospitalClause}`, sqlParams);

    if (!result.changes) {
      return NextResponse.json({ error: '해당 회원을 찾을 수 없거나 수정 권한이 없습니다.' }, { status: 404 });
    }
    return NextResponse.json({ success: true, grade });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request) {
  if (!isAdminApiRequest(request)) {
    return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 });
  }

  const session = getAdminRequestSession(request);
  const hospitalId = getHospitalId(session);

  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');

  if (!id) {
    return NextResponse.json({ error: 'id가 필요합니다.' }, { status: 400 });
  }

  try {
    await ensurePlatformSchema();
    const db = await getDb();

    const hospitalClause = hospitalId !== null ? 'AND hospital_id = ?' : '';
    const params = hospitalId !== null ? [id, hospitalId] : [id];

    await db.run(`DELETE FROM patients WHERE id = ? ${hospitalClause}`, params);
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
