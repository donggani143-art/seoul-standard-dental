import { NextResponse } from 'next/server';
import { getAdminRequestSession, isAdminApiRequest } from '@/lib/adminAuth';
import { getDb } from '@/lib/db';
import { getBoardGroups, RESERVED_BOARD_SLUGS } from '@/lib/boards';
import { getCurrentHospital } from '@/lib/hospitalContext';
import { ensureCustomBoardPages } from '@/lib/defaultPages';

function normalizeSlug(value) {
  return String(value || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/-{2,}/g, '-');
}

function normalizeBlockedGrades(value) {
  const arr = Array.isArray(value) ? value : [];
  const cleaned = [...new Set(arr.map((x) => String(x || '').trim()).filter(Boolean))].slice(0, 50);
  return JSON.stringify(cleaned);
}

/**
 * 세션에서 병원 ID 추출.
 * - super_admin 또는 API 토큰 인증(세션 없음) → null (필터 없음)
 * - hospital_admin → session.hospitalId
 */
function getSessionHospitalId(request) {
  const session = getAdminRequestSession(request);
  if (!session) return null;
  if (session.role === 'super_admin') return session.impersonateHospitalId ?? null;
  return session.hospitalId ?? null;
}

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const includeInactive = searchParams.get('includeInactive') === '1';

  if (includeInactive && !isAdminApiRequest(request)) {
    return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 });
  }

  let hospitalId;
  if (isAdminApiRequest(request)) {
    hospitalId = getSessionHospitalId(request);
  } else {
    const hospital = await getCurrentHospital();
    hospitalId = hospital?.hospitalId ?? null;
    if (!hospitalId) return NextResponse.json([]);
  }

  try {
    const groups = await getBoardGroups({ includeInactive, hospitalId });
    return NextResponse.json(groups);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  if (!isAdminApiRequest(request)) {
    return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 });
  }

  const hospitalId = getSessionHospitalId(request);

  try {
    const { name, slug, description, is_active, members_only, sort_order, blocked_grades } = await request.json();
    const normalizedSlug = normalizeSlug(slug);

    if (!name || !normalizedSlug || RESERVED_BOARD_SLUGS.has(normalizedSlug)) {
      return NextResponse.json({ error: 'Invalid board group' }, { status: 400 });
    }

    const db = await getDb();
    const result = await db.run(
      `
        INSERT INTO board_groups (name, slug, description, is_active, members_only, sort_order, hospital_id, blocked_grades)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `,
      [name, normalizedSlug, description || '', is_active === false ? 0 : 1, members_only ? 1 : 0, Number(sort_order || 0), hospitalId, normalizeBlockedGrades(blocked_grades)]
    );

    // 게시판 그룹 생성 시, 목록/상세 페이지 디자인 자동 생성 (notice 템플릿 기반)
    if (hospitalId) {
      await ensureCustomBoardPages(db, hospitalId, normalizedSlug, name);
    }

    return NextResponse.json({ success: true, id: result.lastID, slug: normalizedSlug });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(request) {
  if (!isAdminApiRequest(request)) {
    return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 });
  }

  const hospitalId = getSessionHospitalId(request);

  try {
    const { id, name, slug, description, is_active, members_only, sort_order, blocked_grades } = await request.json();
    const normalizedSlug = normalizeSlug(slug);

    if (!id || !name || !normalizedSlug || RESERVED_BOARD_SLUGS.has(normalizedSlug)) {
      return NextResponse.json({ error: 'Invalid board group' }, { status: 400 });
    }

    const db = await getDb();

    const hospitalClause = hospitalId !== null ? 'AND hospital_id = ?' : '';
    const params = [
      name, normalizedSlug, description || '', is_active === false ? 0 : 1, members_only ? 1 : 0, Number(sort_order || 0), normalizeBlockedGrades(blocked_grades),
      id,
      ...(hospitalId !== null ? [hospitalId] : []),
    ];

    const result = await db.run(
      `
        UPDATE board_groups
        SET name = ?, slug = ?, description = ?, is_active = ?, members_only = ?, sort_order = ?, blocked_grades = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ? ${hospitalClause}
      `,
      params
    );

    return NextResponse.json({ success: true, id, slug: normalizedSlug, changes: result.changes });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request) {
  if (!isAdminApiRequest(request)) {
    return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');

  if (!id) {
    return NextResponse.json({ error: 'id가 필요합니다.' }, { status: 400 });
  }

  const hospitalId = getSessionHospitalId(request);

  try {
    const db = await getDb();

    const hospitalClause = hospitalId !== null ? 'AND hospital_id = ?' : '';
    const params = hospitalId !== null ? [id, hospitalId] : [id];

    // 해당 그룹의 게시글 연결 해제 후 삭제 (본인 병원 게시글만 — 타 병원 데이터 영향 차단)
    const unlinkParams = hospitalId !== null ? [id, hospitalId] : [id];
    await db.run(`UPDATE boards SET board_group_id = NULL WHERE board_group_id = ? ${hospitalClause}`, unlinkParams);
    const deleteResult = await db.run(`DELETE FROM board_groups WHERE id = ? ${hospitalClause}`, params);

    return NextResponse.json({
      success: true,
      id,
      deletedGroups: deleteResult.changes,
    });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
