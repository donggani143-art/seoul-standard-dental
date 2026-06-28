import { NextResponse } from 'next/server';
import { getAdminRequestSession, isAdminApiRequest } from '@/lib/adminAuth';
import { getBoardById, isGradeBlocked } from '@/lib/boards';
import { getDb } from '@/lib/db';
import { sanitizeRichHtml } from '@/lib/html';
import { getPatientSession } from '@/lib/patientAuth';

/**
 * 수정 권한 병원 스코프 결정.
 * - hospital_admin 세션 → 본인 hospital_id 강제 (body 무시 = 타 병원 위장 차단)
 * - super_admin → impersonate 대상 (없으면 null)
 * - API 토큰 인증(세션 없음) → body.hospital_id (지정 시 그 병원으로 스코프)
 */
function resolveScopeHospitalId(request, body) {
  const session = getAdminRequestSession(request);
  if (session) {
    if (session.role === 'super_admin') return session.impersonateHospitalId ?? null;
    return session.hospitalId ?? null;
  }
  const raw = body?.hospital_id;
  return raw != null && raw !== '' ? Number(raw) : null;
}

export async function GET(request, { params }) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const includeDrafts = searchParams.get('includeDrafts') === '1';
    const isAdmin = isAdminApiRequest(request);

    if (includeDrafts && !isAdmin) {
      return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 });
    }

    const board = await getBoardById(id, { includeDrafts });

    if (!board) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    // 회원 전용 게시판: 비관리자 + 비로그인(또는 다른 병원 회원)이면 차단
    if (!isAdmin) {
      const patient = getPatientSession(request);
      if (board.members_only && (!patient || (board.hospital_id && patient.hospitalId !== board.hospital_id))) {
        return NextResponse.json(
          { error: '회원 전용 게시판입니다. 로그인 후 이용해 주세요.', code: 'MEMBERS_ONLY' },
          { status: 401 }
        );
      }
      // 등급 차단: 로그인 회원의 등급이 차단목록에 있으면 차단
      if (await isGradeBlocked(board, patient)) {
        return NextResponse.json(
          { error: '이 게시판을 볼 권한이 없습니다.', code: 'GRADE_RESTRICTED' },
          { status: 403 }
        );
      }
    }

    return NextResponse.json(board);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

/**
 * 기존 게시글 부분 수정 (내부 링크 자동화 등).
 * 보낸 필드만 갱신하고 나머지는 그대로 보존한다.
 *
 * 인증: 관리자 세션 또는 API 토큰(Authorization: Bearer).
 * 수정 가능 필드: content, title, is_published, start_date, end_date, board_group_id
 * 스코프: hospital_admin은 본인 병원만 / 토큰 인증은 body.hospital_id 로 병원 한정 권장.
 */
async function updateBoard(request, { params }) {
  if (!isAdminApiRequest(request)) {
    return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 });
  }

  try {
    const { id } = await params;
    if (!id) {
      return NextResponse.json({ error: 'post_id가 필요합니다.' }, { status: 400 });
    }

    let body;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: '요청 본문(JSON)이 올바르지 않습니다.' }, { status: 400 });
    }

    const hospitalId = resolveScopeHospitalId(request, body);

    // 보낸 필드만 부분 갱신
    const sets = [];
    const values = [];

    if (body.content !== undefined) {
      const content = sanitizeRichHtml(body.content);
      if (!content.trim()) {
        return NextResponse.json({ error: 'content가 비어 있습니다.' }, { status: 400 });
      }
      sets.push('content = ?');
      values.push(content);
    }
    if (body.title !== undefined) {
      const title = String(body.title || '').trim();
      if (!title) {
        return NextResponse.json({ error: 'title이 비어 있습니다.' }, { status: 400 });
      }
      sets.push('title = ?');
      values.push(title);
    }
    if (body.is_published !== undefined) {
      sets.push('is_published = ?');
      values.push(body.is_published === false || body.is_published === 0 || body.is_published === '0' ? 0 : 1);
    }
    if (body.start_date !== undefined) {
      sets.push('start_date = ?');
      values.push(String(body.start_date || ''));
    }
    if (body.end_date !== undefined) {
      sets.push('end_date = ?');
      values.push(String(body.end_date || ''));
    }
    if (body.board_group_id !== undefined) {
      sets.push('board_group_id = ?');
      values.push(body.board_group_id ? Number(body.board_group_id) : null);
    }

    if (sets.length === 0) {
      return NextResponse.json(
        { error: '수정할 필드가 없습니다. content, title, is_published, start_date, end_date, board_group_id 중 하나 이상을 보내주세요.' },
        { status: 400 }
      );
    }

    sets.push('updated_at = CURRENT_TIMESTAMP');

    const db = await getDb();
    const hospitalClause = hospitalId !== null ? 'AND hospital_id = ?' : '';
    const sqlParams = [...values, id, ...(hospitalId !== null ? [hospitalId] : [])];

    const result = await db.run(
      `UPDATE boards SET ${sets.join(', ')} WHERE id = ? ${hospitalClause}`,
      sqlParams
    );

    if (!result.changes) {
      // 대상 없음 또는 병원 스코프 불일치(타 병원 글)
      return NextResponse.json(
        { error: '해당 게시글을 찾을 수 없거나 수정 권한이 없습니다.' },
        { status: 404 }
      );
    }

    const updated = await getBoardById(id, { includeDrafts: true, hospitalId });
    return NextResponse.json({ success: true, id: Number(id), changes: result.changes, post: updated });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PATCH(request, ctx) {
  return updateBoard(request, ctx);
}

export async function PUT(request, ctx) {
  return updateBoard(request, ctx);
}
