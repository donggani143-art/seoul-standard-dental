// 일정 캘린더 데이터 접근 (업체별). 모든 쿼리는 hospital_id 스코프.
import { getDb } from '@/lib/db';
import { ensurePlatformSchema } from '@/lib/platform';

const FIELDS = ['title', 'content', 'start_date', 'end_date', 'start_time', 'location', 'link_url', 'category', 'color', 'is_published'];

function normalizeDate(v) {
  const s = String(v || '').trim();
  return /^\d{4}-\d{2}-\d{2}$/.test(s) ? s : '';
}
function clean(input = {}) {
  return {
    title: String(input.title || '').trim().slice(0, 200),
    content: String(input.content || '').slice(0, 4000),
    start_date: normalizeDate(input.start_date),
    end_date: normalizeDate(input.end_date),
    start_time: String(input.start_time || '').trim().slice(0, 16),
    location: String(input.location || '').trim().slice(0, 300),
    link_url: String(input.link_url || '').trim().slice(0, 500),
    category: String(input.category || '').trim().slice(0, 60),
    color: /^#[0-9a-fA-F]{3,8}$/.test(String(input.color || '')) ? input.color : '#2563eb',
    is_published: input.is_published === 0 || input.is_published === false || input.is_published === '0' ? 0 : 1,
  };
}

/**
 * 일정 목록. hospitalId 필수. from/to(YYYY-MM-DD)로 기간 필터(start_date 또는 end_date가 범위와 겹치면 포함).
 */
export async function listCalendarEvents({ hospitalId, from, to, includeUnpublished = false } = {}) {
  if (!hospitalId) return [];
  await ensurePlatformSchema();
  const db = await getDb();
  const cond = ['hospital_id = ?'];
  const params = [hospitalId];
  if (!includeUnpublished) cond.push('is_published = 1');
  if (from) {
    // 일정이 from 이후에 끝나거나(종료일 있으면 종료일, 없으면 시작일) from 이후 시작
    cond.push("(COALESCE(NULLIF(end_date,''), start_date) >= ?)");
    params.push(from);
  }
  if (to) {
    cond.push('start_date <= ?');
    params.push(to);
  }
  return db.all(
    `SELECT * FROM calendar_events WHERE ${cond.join(' AND ')} ORDER BY start_date ASC, start_time ASC, id ASC`,
    params
  );
}

export async function getCalendarEvent(id, hospitalId) {
  await ensurePlatformSchema();
  const db = await getDb();
  return db.get('SELECT * FROM calendar_events WHERE id = ? AND hospital_id = ?', [id, hospitalId]);
}

export async function createCalendarEvent(hospitalId, input) {
  await ensurePlatformSchema();
  const db = await getDb();
  const v = clean(input);
  if (!v.title || !v.start_date) throw new Error('제목과 시작일은 필수입니다.');
  const res = await db.run(
    `INSERT INTO calendar_events (hospital_id, ${FIELDS.join(', ')})
     VALUES (?, ${FIELDS.map(() => '?').join(', ')})`,
    [hospitalId, ...FIELDS.map((f) => v[f])]
  );
  return getCalendarEvent(res.lastID, hospitalId);
}

export async function updateCalendarEvent(id, hospitalId, input) {
  await ensurePlatformSchema();
  const db = await getDb();
  const existing = await getCalendarEvent(id, hospitalId);
  if (!existing) return null;
  const v = clean({ ...existing, ...input });
  if (!v.title || !v.start_date) throw new Error('제목과 시작일은 필수입니다.');
  await db.run(
    `UPDATE calendar_events SET ${FIELDS.map((f) => `${f} = ?`).join(', ')}, updated_at = CURRENT_TIMESTAMP
     WHERE id = ? AND hospital_id = ?`,
    [...FIELDS.map((f) => v[f]), id, hospitalId]
  );
  return getCalendarEvent(id, hospitalId);
}

export async function deleteCalendarEvent(id, hospitalId) {
  await ensurePlatformSchema();
  const db = await getDb();
  const res = await db.run('DELETE FROM calendar_events WHERE id = ? AND hospital_id = ?', [id, hospitalId]);
  return res.changes > 0;
}