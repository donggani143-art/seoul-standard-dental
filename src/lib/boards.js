import { getDb } from '@/lib/db';

export const RESERVED_BOARD_SLUGS = new Set(['notice', 'event']);

export const BOARD_TYPE_LABELS = {
  notice: '공지사항',
  event: '이벤트',
  board: '게시판',
};

function buildVisibilityClause(alias = 'b') {
  return `(${alias}.is_published = 1
    AND (${alias}.start_date IS NULL OR ${alias}.start_date = '' OR date(${alias}.start_date) <= date('now'))
    AND (${alias}.end_date IS NULL OR ${alias}.end_date = '' OR date(${alias}.end_date) >= date('now')))`;
}

function buildBoardSelect() {
  return `
    SELECT
      b.*,
      g.slug AS group_slug,
      g.name AS group_name,
      g.description AS group_description,
      g.members_only AS members_only,
      g.blocked_grades AS blocked_grades
    FROM boards b
    LEFT JOIN board_groups g ON g.id = b.board_group_id
  `;
}

function parseList(value) {
  if (Array.isArray(value)) return value;
  try {
    const v = JSON.parse(value || '[]');
    return Array.isArray(v) ? v : [];
  } catch {
    return [];
  }
}

/**
 * 게시판 그룹의 등급 차단목록에 현재 로그인 회원의 등급이 포함되면 true.
 * - blocked_grades(JSON 등급명 배열)가 비었으면 false
 * - 비로그인(patient 없음)은 등급이 없으므로 false (members_only가 별도 처리)
 */
export async function isGradeBlocked(group, patient) {
  if (!group || !patient) return false;
  const blocked = parseList(group.blocked_grades);
  if (blocked.length === 0) return false;
  const db = await getDb();
  const row = await db.get('SELECT grade FROM patients WHERE id = ?', [patient.id]);
  return blocked.includes(row?.grade || '');
}

const ATTACH_ICON = { hwp: '📝', pdf: '📕', jpg: '🖼️', jpeg: '🖼️', png: '🖼️', gif: '🖼️', webp: '🖼️' };
function humanSize(bytes) {
  const n = Number(bytes || 0);
  if (!n) return '';
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(0)} KB`;
  return `${(n / 1024 / 1024).toFixed(1)} MB`;
}
const escAttr = (s) => String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

/**
 * 게시글 첨부파일 목록을 다운로드 HTML 블록으로 렌더(sanitizeRichHtml 안전 마크업).
 * content 뒤에 덧붙이면 기본·커스텀 디자인 양쪽에서 표시된다.
 */
export function renderAttachmentsHtml(attachments) {
  const list = parseList(attachments).filter((a) => a && a.url);
  if (list.length === 0) return '';
  const items = list.map((a) => {
    const ext = String(a.name || '').split('.').pop().toLowerCase();
    const icon = ATTACH_ICON[ext] || '📎';
    const size = humanSize(a.size);
    return `<li style="margin:0"><a href="${escAttr(a.url)}" target="_blank" rel="noopener" download style="display:inline-flex;align-items:center;gap:8px;max-width:100%;padding:10px 14px;border:1px solid #e5e7eb;border-radius:10px;font-size:14px;color:#1f2937;text-decoration:none;background:#fafafa">${icon} <span style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${escAttr(a.name || '첨부파일')}</span>${size ? `<span style="color:#9ca3af;font-size:12px;flex:0 0 auto">(${size})</span>` : ''}</a></li>`;
  }).join('');
  return `<div class="board-attachments" style="margin-top:30px;border-top:1px solid #eef0f2;padding-top:18px"><div style="font-size:13px;font-weight:700;color:#6b7280;margin-bottom:11px">첨부파일 ${list.length}개</div><ul style="list-style:none;padding:0;margin:0;display:flex;flex-direction:column;gap:8px">${items}</ul></div>`;
}

export function getBoardHref(post) {
  if (!post) return '/community/notice';

  if (post.type === 'notice' || post.type === 'event') {
    return `/community/${post.type}/${post.id}`;
  }

  if (post.group_slug) {
    return `/community/${post.group_slug}/${post.id}`;
  }

  return '/community/board';
}

export function getBoardListHref(type, groupSlug) {
  if (type === 'notice' || type === 'event') {
    return `/community/${type}`;
  }

  if (groupSlug) {
    return `/community/${groupSlug}`;
  }

  return '/community/board';
}

/**
 * @param {{ includeInactive?: boolean, hospitalId?: number|null }} options
 * hospitalId null = 필터 없음 (슈퍼어드민 또는 퍼블릭), 숫자 = 해당 병원만
 */
export async function getBoardGroups({ includeInactive = false, hospitalId = null } = {}) {
  const db = await getDb();
  const conditions = [];
  const params = [];

  if (!includeInactive) {
    conditions.push('is_active = 1');
  }

  if (hospitalId !== null) {
    conditions.push('hospital_id = ?');
    params.push(hospitalId);
  }

  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

  return db.all(
    `
      SELECT *
      FROM board_groups
      ${where}
      ORDER BY sort_order ASC, created_at ASC, id ASC
    `,
    params
  );
}

/**
 * 회원 전용 그룹의 slug 목록 (hospital_id 기준).
 * 비공개 그룹도 포함되어야 임퍼스네이션/관리자 컨텍스트에서도 정확히 게이팅된다.
 */
export async function getMembersOnlyGroupSlugs({ hospitalId = null } = {}) {
  const db = await getDb();
  const conditions = ['members_only = 1'];
  const params = [];
  if (hospitalId !== null) {
    conditions.push('hospital_id = ?');
    params.push(hospitalId);
  }
  const rows = await db.all(
    `SELECT slug FROM board_groups WHERE ${conditions.join(' AND ')}`,
    params
  );
  return new Set(rows.map((r) => r.slug));
}

/**
 * @param {string} slug
 * @param {{ includeInactive?: boolean, hospitalId?: number|null }} options
 */
export async function getBoardGroupBySlug(slug, { includeInactive = false, hospitalId = null } = {}) {
  const db = await getDb();
  const conditions = ['slug = ?'];
  const params = [slug];

  if (!includeInactive) {
    conditions.push('is_active = 1');
  }

  if (hospitalId !== null) {
    conditions.push('hospital_id = ?');
    params.push(hospitalId);
  }

  return db.get(`SELECT * FROM board_groups WHERE ${conditions.join(' AND ')}`, params);
}

/**
 * @param {{ type?: string, groupSlug?: string, includeDrafts?: boolean, hospitalId?: number|null }} options
 */
export async function listBoards({ type, groupSlug, includeDrafts = false, hospitalId = null } = {}) {
  const db = await getDb();
  const params = [];
  const filters = [];

  if (type) {
    filters.push('b.type = ?');
    params.push(type);
  }

  if (groupSlug) {
    filters.push('g.slug = ?');
    params.push(groupSlug);
  }

  if (hospitalId !== null) {
    filters.push('b.hospital_id = ?');
    params.push(hospitalId);
  }

  if (!includeDrafts) {
    filters.push(buildVisibilityClause('b'));
  }

  const where = filters.length ? `WHERE ${filters.join(' AND ')}` : '';

  return db.all(
    `
      ${buildBoardSelect()}
      ${where}
      ORDER BY b.created_at DESC, b.id DESC
    `,
    params
  );
}

/**
 * @param {number|string} id
 * @param {{ includeDrafts?: boolean, hospitalId?: number|null }} options
 */
export async function getBoardById(id, { includeDrafts = false, hospitalId = null } = {}) {
  const db = await getDb();
  const filters = ['b.id = ?'];
  const params = [id];

  if (hospitalId !== null) {
    filters.push('b.hospital_id = ?');
    params.push(hospitalId);
  }

  if (!includeDrafts) {
    filters.push(buildVisibilityClause('b'));
  }

  return db.get(
    `
      ${buildBoardSelect()}
      WHERE ${filters.join(' AND ')}
      LIMIT 1
    `,
    params
  );
}

/**
 * @param {string} boardSlug
 * @param {number|string} boardId
 * @param {{ includeDrafts?: boolean, hospitalId?: number|null }} options
 */
export async function resolveBoardContext(boardSlug, boardId, { includeDrafts = false, hospitalId = null } = {}) {
  if (boardSlug === 'notice' || boardSlug === 'event') {
    const post = await getBoardById(boardId, { includeDrafts, hospitalId });

    if (!post || post.type !== boardSlug) {
      return null;
    }

    return { post, group: null };
  }

  const group = await getBoardGroupBySlug(boardSlug, { includeInactive: includeDrafts, hospitalId });

  if (!group) {
    return null;
  }

  const post = await getBoardById(boardId, { includeDrafts, hospitalId });

  if (!post || post.type !== 'board' || post.board_group_id !== group.id) {
    return null;
  }

  return { post, group };
}
