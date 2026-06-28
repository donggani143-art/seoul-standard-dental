// AI 크롤링 통계 API — 슈퍼관리자 전용 (업체 관리자/리셀러 접근 불가)
import { NextResponse } from 'next/server';
import { getAdminRequestSession, isAdminApiRequest } from '@/lib/adminAuth';
import { getDb } from '@/lib/db';
import { ensurePlatformSchema } from '@/lib/platform';

export async function GET(request) {
  if (!isAdminApiRequest(request)) {
    return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 });
  }
  const session = getAdminRequestSession(request);
  if (!session || session.role !== 'super_admin') {
    return NextResponse.json({ error: '접근 권한이 없습니다.' }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  let days = parseInt(searchParams.get('days') || '30', 10);
  if (!Number.isFinite(days) || days < 1) days = 30;
  if (days > 365) days = 365;

  try {
    await ensurePlatformSchema();
    const db = await getDb();
    const since = `-${days} days`;

    const [totals, byBot, perHospital, perHospitalBot, daily] = await Promise.all([
      db.get(
        `SELECT COUNT(*) AS total FROM ai_crawls WHERE created_at >= datetime('now', ?)`,
        [since]
      ),
      db.all(
        `SELECT bot, kind, COUNT(*) AS count
         FROM ai_crawls WHERE created_at >= datetime('now', ?)
         GROUP BY bot, kind ORDER BY count DESC`,
        [since]
      ),
      db.all(
        `SELECT a.hospital_id, h.name AS hospital_name, h.slug AS hospital_slug,
                COUNT(*) AS total, MAX(a.created_at) AS last_seen
         FROM ai_crawls a
         LEFT JOIN hospitals h ON h.id = a.hospital_id
         WHERE a.created_at >= datetime('now', ?)
         GROUP BY a.hospital_id
         ORDER BY total DESC`,
        [since]
      ),
      db.all(
        `SELECT hospital_id, bot, COUNT(*) AS count
         FROM ai_crawls WHERE created_at >= datetime('now', ?)
         GROUP BY hospital_id, bot ORDER BY count DESC`,
        [since]
      ),
      db.all(
        `SELECT date(created_at) AS day, COUNT(*) AS count
         FROM ai_crawls WHERE created_at >= datetime('now', ?)
         GROUP BY day ORDER BY day ASC`,
        [since]
      ),
    ]);

    const botsByHospital = {};
    for (const r of perHospitalBot) {
      (botsByHospital[r.hospital_id] ||= []).push({ bot: r.bot, count: r.count });
    }
    const hospitals = perHospital.map((h) => ({
      hospital_id: h.hospital_id,
      hospital_name: h.hospital_name || `(미식별 #${h.hospital_id ?? '-'})`,
      hospital_slug: h.hospital_slug || null,
      total: h.total,
      last_seen: h.last_seen,
      bots: botsByHospital[h.hospital_id] || [],
    }));

    return NextResponse.json({
      days,
      total: totals?.total ?? 0,
      byBot,
      hospitals,
      daily,
    });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
