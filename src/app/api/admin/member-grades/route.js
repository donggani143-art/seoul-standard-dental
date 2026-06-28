import { NextResponse } from 'next/server';
import { getAdminRequestSession, isAdminApiRequest } from '@/lib/adminAuth';
import { getDb } from '@/lib/db';
import { ensurePlatformSchema } from '@/lib/platform';

function getHospitalId(session) {
  if (!session) return null;
  return session.role === 'super_admin' ? (session.impersonateHospitalId ?? null) : (session.hospitalId ?? null);
}

export async function GET(request) {
  if (!isAdminApiRequest(request)) {
    return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 });
  }
  const session = getAdminRequestSession(request);
  const hospitalId = getHospitalId(session);
  if (!hospitalId) {
    return NextResponse.json({ error: '업체 계정으로 로그인해 주세요.' }, { status: 400 });
  }

  await ensurePlatformSchema();
  const db = await getDb();
  const grades = await db.all(
    'SELECT id, name, color, sort_order FROM patient_grades WHERE hospital_id = ? ORDER BY sort_order ASC, id ASC',
    [hospitalId]
  );
  return NextResponse.json({ grades });
}

export async function PUT(request) {
  if (!isAdminApiRequest(request)) {
    return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 });
  }
  const session = getAdminRequestSession(request);
  const hospitalId = getHospitalId(session);
  if (!hospitalId) {
    return NextResponse.json({ error: '업체 계정으로 로그인해 주세요.' }, { status: 400 });
  }

  let payload;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: '잘못된 요청입니다.' }, { status: 400 });
  }
  const incoming = Array.isArray(payload?.grades) ? payload.grades : [];

  await ensurePlatformSchema();
  const db = await getDb();

  const existing = await db.all('SELECT id, name FROM patient_grades WHERE hospital_id = ?', [hospitalId]);
  const byId = new Map(existing.map((r) => [r.id, r]));
  const keepIds = new Set();
  const seenNames = new Set();
  let order = 10;

  for (const raw of incoming) {
    const name = String(raw?.name || '').trim().slice(0, 30);
    if (!name || seenNames.has(name)) continue;
    seenNames.add(name);
    const color = String(raw?.color || '').trim().slice(0, 20);
    const id = Number(raw?.id) || null;

    if (id && byId.has(id)) {
      const old = byId.get(id);
      await db.run(
        'UPDATE patient_grades SET name = ?, color = ?, sort_order = ? WHERE id = ? AND hospital_id = ?',
        [name, color, order, id, hospitalId]
      );
      if (old.name !== name) {
        // 등급명 변경 시 회원에 저장된 등급도 동기화
        await db.run('UPDATE patients SET grade = ? WHERE hospital_id = ? AND grade = ?', [name, hospitalId, old.name]);
      }
      keepIds.add(id);
    } else {
      await db.run(
        'INSERT INTO patient_grades (hospital_id, name, color, sort_order) VALUES (?, ?, ?, ?)',
        [hospitalId, name, color, order]
      );
    }
    order += 10;
  }

  // 목록에서 빠진 등급 = 삭제 → 해당 회원 등급 해제 후 삭제
  for (const row of existing) {
    if (!keepIds.has(row.id)) {
      await db.run("UPDATE patients SET grade = '' WHERE hospital_id = ? AND grade = ?", [hospitalId, row.name]);
      await db.run('DELETE FROM patient_grades WHERE id = ? AND hospital_id = ?', [row.id, hospitalId]);
    }
  }

  const grades = await db.all(
    'SELECT id, name, color, sort_order FROM patient_grades WHERE hospital_id = ? ORDER BY sort_order ASC, id ASC',
    [hospitalId]
  );
  return NextResponse.json({ grades });
}
