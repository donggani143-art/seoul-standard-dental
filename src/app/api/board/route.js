import { NextResponse } from 'next/server';
import { getAdminRequestSession, isAdminApiRequest } from '@/lib/adminAuth';
import { getBoardGroupBySlug, isGradeBlocked, listBoards } from '@/lib/boards';
import { getDb } from '@/lib/db';
import { sanitizeRichHtml } from '@/lib/html';
import { getCurrentHospital } from '@/lib/hospitalContext';
import { getPatientSession } from '@/lib/patientAuth';

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

function normalizeAttachments(value) {
  let arr = value;
  if (typeof value === 'string') {
    try { arr = JSON.parse(value || '[]'); } catch { arr = []; }
  }
  if (!Array.isArray(arr)) return '[]';
  const cleaned = arr
    .filter((a) => a && typeof a.url === 'string' && a.url.trim())
    .slice(0, 20)
    .map((a) => ({
      name: String(a.name || '첨부파일').slice(0, 200),
      url: String(a.url).slice(0, 500),
      size: Number(a.size) || 0,
      type: String(a.type || '').slice(0, 100),
    }));
  return JSON.stringify(cleaned);
}

function normalizeBoardPayload(payload = {}) {
  return {
    id: payload.id,
    type: String(payload.type || ''),
    board_group_id: payload.type === 'board' ? Number(payload.board_group_id || 0) || null : null,
    title: String(payload.title || '').trim(),
    content: sanitizeRichHtml(payload.content),
    is_published: payload.is_published === false ? 0 : 1,
    start_date: String(payload.start_date || ''),
    end_date: String(payload.end_date || ''),
    attachments: normalizeAttachments(payload.attachments),
    hospital_id: payload.hospital_id != null && payload.hospital_id !== '' ? Number(payload.hospital_id) : null,
  };
}

// API 토큰 인증의 경우 body.hospital_id 를 받아 사용. hospital_admin 세션은 본인 hospital만.
// board_group_id 가 명시되면 그 그룹의 hospital_id 와 일치해야 함 (다른 병원 그룹에 잘못 쓰는 사고 방지).
async function resolveTargetHospitalId(request, payload) {
  const sessionHid = getSessionHospitalId(request);
  // 1) hospital_admin 세션 — 세션의 hospital_id 강제 (body 무시 = 본인 외 위장 차단)
  if (sessionHid !== null) return { hospitalId: sessionHid };
  // 2) 토큰 인증 또는 super_admin (impersonation 없음) — body.hospital_id 허용 (없으면 null)
  return { hospitalId: payload.hospital_id ?? null };
}

async function validateGroupAgainstHospital(payload, hospitalId) {
  if (!payload.board_group_id || hospitalId == null) return null;
  const db = await getDb();
  const g = await db.get('SELECT hospital_id FROM board_groups WHERE id = ?', [payload.board_group_id]);
  if (!g) return 'board_group_id가 존재하지 않습니다.';
  if (g.hospital_id != null && g.hospital_id !== hospitalId) {
    return `board_group_id(${payload.board_group_id})는 hospital_id=${g.hospital_id} 소속입니다. hospital_id 값과 일치하지 않습니다.`;
  }
  return null;
}

function validateBoardPayload(payload) {
  const missing = [];
  if (!payload.type) missing.push('게시판 유형');
  if (!payload.title?.trim()) missing.push('제목');
  if (!payload.content?.trim() || payload.content.trim() === '<p>내용을 입력하세요.</p>') missing.push('내용');

  if (missing.length > 0) {
    return `다음 항목을 입력해 주세요: ${missing.join(', ')}`;
  }

  if (payload.type === 'board' && !payload.board_group_id) {
    return '커스텀 게시판은 게시판 그룹을 선택해야 합니다.';
  }

  return null;
}

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const type = searchParams.get('type');
  const groupSlug = searchParams.get('groupSlug');
  const includeDrafts = searchParams.get('includeDrafts') === '1';

  if ((type === 'all' || includeDrafts) && !isAdminApiRequest(request)) {
    return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 });
  }

  let hospitalId;
  const isAdmin = isAdminApiRequest(request);
  if (isAdmin) {
    hospitalId = getSessionHospitalId(request);
  } else {
    const hospital = await getCurrentHospital();
    hospitalId = hospital?.hospitalId ?? null;
    if (!hospitalId) return NextResponse.json([]);
  }

  try {
    // 회원 전용 게이팅: 공개 컨텍스트(관리자 아님)에서 특정 group을 조회 시,
    // 그 group이 members_only이고 환자 세션이 없거나 다른 병원이면 401 반환.
    if (!isAdmin && groupSlug) {
      const group = await getBoardGroupBySlug(groupSlug, { hospitalId });
      const patient = getPatientSession(request);
      if (group?.members_only) {
        if (!patient || (hospitalId && patient.hospitalId !== hospitalId)) {
          return NextResponse.json(
            { error: '회원 전용 게시판입니다. 로그인 후 이용해 주세요.', code: 'MEMBERS_ONLY' },
            { status: 401 }
          );
        }
      }
      if (group && (await isGradeBlocked(group, patient))) {
        return NextResponse.json(
          { error: '이 게시판을 볼 권한이 없습니다.', code: 'GRADE_RESTRICTED' },
          { status: 403 }
        );
      }
    }

    const rows =
      type === 'all'
        ? await listBoards({ includeDrafts: true, hospitalId })
        : await listBoards({ type: type || undefined, groupSlug: groupSlug || undefined, includeDrafts, hospitalId });

    return NextResponse.json(rows);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  if (!isAdminApiRequest(request)) {
    return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 });
  }

  try {
    const payload = normalizeBoardPayload(await request.json());
    const validationError = validateBoardPayload(payload);

    if (validationError) {
      return NextResponse.json({ error: validationError }, { status: 400 });
    }

    const { hospitalId } = await resolveTargetHospitalId(request, payload);
    const groupError = await validateGroupAgainstHospital(payload, hospitalId);
    if (groupError) return NextResponse.json({ error: groupError }, { status: 400 });

    const db = await getDb();

    const result = await db.run(
      `
        INSERT INTO boards (type, board_group_id, title, content, is_published, start_date, end_date, attachments, hospital_id)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
      [
        payload.type,
        payload.board_group_id,
        payload.title,
        payload.content,
        payload.is_published,
        payload.start_date,
        payload.end_date,
        payload.attachments,
        hospitalId,
      ]
    );

    return NextResponse.json({ success: true, id: result.lastID, hospital_id: hospitalId });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(request) {
  if (!isAdminApiRequest(request)) {
    return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 });
  }

  try {
    const payload = normalizeBoardPayload(await request.json());
    const validationError = !payload.id ? 'id가 필요합니다.' : validateBoardPayload(payload);

    if (validationError) {
      return NextResponse.json({ error: validationError }, { status: 400 });
    }

    const { hospitalId } = await resolveTargetHospitalId(request, payload);
    const groupError = await validateGroupAgainstHospital(payload, hospitalId);
    if (groupError) return NextResponse.json({ error: groupError }, { status: 400 });

    const db = await getDb();

    // hospital_admin은 자기 병원 게시글만 수정 가능 / 토큰 인증은 body.hospital_id 명시 시 그 병원만
    const hospitalClause = hospitalId !== null ? 'AND hospital_id = ?' : '';
    const params = [
      payload.type,
      payload.board_group_id,
      payload.title,
      payload.content,
      payload.is_published,
      payload.start_date,
      payload.end_date,
      payload.attachments,
      payload.id,
      ...(hospitalId !== null ? [hospitalId] : []),
    ];

    const result = await db.run(
      `
        UPDATE boards
        SET type = ?, board_group_id = ?, title = ?, content = ?, is_published = ?, start_date = ?,
            end_date = ?, attachments = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ? ${hospitalClause}
      `,
      params
    );

    return NextResponse.json({ success: true, id: payload.id, changes: result.changes, hospital_id: hospitalId });
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
  const bodyHidRaw = searchParams.get('hospital_id');

  if (!id) {
    return NextResponse.json({ error: 'id가 필요합니다.' }, { status: 400 });
  }

  const sessionHid = getSessionHospitalId(request);
  // 세션 우선, 토큰 인증의 경우 query param hospital_id 허용
  const hospitalId = sessionHid !== null
    ? sessionHid
    : (bodyHidRaw != null && bodyHidRaw !== '' ? Number(bodyHidRaw) : null);

  try {
    const db = await getDb();
    const hospitalClause = hospitalId !== null ? 'AND hospital_id = ?' : '';
    const params = hospitalId !== null ? [id, hospitalId] : [id];

    const result = await db.run(`DELETE FROM boards WHERE id = ? ${hospitalClause}`, params);
    return NextResponse.json({ success: true, id, changes: result.changes, hospital_id: hospitalId });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
