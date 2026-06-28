import { NextResponse } from 'next/server';
import { getAdminRequestSession, isAdminApiRequest } from '@/lib/adminAuth';
import { getDb } from '@/lib/db';
import { ensurePlatformSchema } from '@/lib/platform';
import { buildVisitorMonthlyReport } from '@/lib/visitorReport';
import { buildAiCrawlReport, isValidMonth } from '@/lib/aiCrawlReport';

// 세션 병원 스코프.
// - 업체 관리자: 자기 병원 고정.
// - super_admin: ?hospitalId= 로 특정 업체 지정 가능(없으면 impersonate, 그래도 없으면 플랫폼 전체=null).
function resolveHospitalId(request, searchParams) {
  const session = getAdminRequestSession(request);
  if (!session) return null;
  if (session.role === 'super_admin') {
    const q = Number(searchParams.get('hospitalId') || 0);
    if (Number.isInteger(q) && q > 0) return q;
    return session.impersonateHospitalId ?? null;
  }
  return session.hospitalId ?? null;
}

export async function GET(request) {
  if (!isAdminApiRequest(request)) {
    return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 });
  }
  await ensurePlatformSchema();
  const db = await getDb();

  const { searchParams } = new URL(request.url);
  const hospitalId = resolveHospitalId(request, searchParams);
  const hFilter = hospitalId !== null ? 'AND hospital_id = ?' : '';
  const hp = hospitalId !== null ? [hospitalId] : [];

  const monthParam = searchParams.get('month');

  try {
    // ── 월간 리포트 모드 (공용 집계 함수 재사용) ──
    if (monthParam) {
      const report = await buildVisitorMonthlyReport(db, { month: monthParam, hospitalId });
      // AI 검색 노출(AI 크롤링) — 업체 스코프로 함께 제공 (P1: 업체 대시보드 노출)
      if (isValidMonth(monthParam)) {
        try {
          const ai = await buildAiCrawlReport(db, { month: monthParam, hospitalId });
          delete ai.hospitals; // 업체 화면엔 타 업체 목록 불필요(플랫폼 스코프일 때도 미노출)
          report.aiCrawl = ai;
        } catch { /* AI 통계 실패는 방문 통계를 막지 않음 */ }
      }
      return NextResponse.json(report);
    }

    // ── 기존 일 단위 모드(호환) ──
    const days = Math.max(1, Math.min(Number(searchParams.get('days') || 30), 365));
    const sinceClause = `created_at >= datetime('now', '-${days} days')`;
    const [totalRow, uniqueRow, bySource, byCountry, byDevice, byPath, byDay] = await Promise.all([
      db.get(`SELECT COUNT(*) as count FROM page_views WHERE ${sinceClause} ${hFilter}`, hp),
      db.get(`SELECT COUNT(DISTINCT session_id) as count FROM page_views WHERE ${sinceClause} ${hFilter} AND session_id != ''`, hp),
      db.all(`SELECT referrer_source as source, COUNT(*) as count FROM page_views WHERE ${sinceClause} ${hFilter} GROUP BY referrer_source ORDER BY count DESC LIMIT 10`, hp),
      db.all(`SELECT country, COUNT(*) as count FROM page_views WHERE ${sinceClause} ${hFilter} AND country != '' GROUP BY country ORDER BY count DESC LIMIT 10`, hp),
      db.all(`SELECT device, COUNT(*) as count FROM page_views WHERE ${sinceClause} ${hFilter} GROUP BY device ORDER BY count DESC`, hp),
      db.all(`SELECT path, COUNT(*) as count FROM page_views WHERE ${sinceClause} ${hFilter} GROUP BY path ORDER BY count DESC LIMIT 10`, hp),
      db.all(`SELECT date(created_at) as day, COUNT(*) as count FROM page_views WHERE ${sinceClause} ${hFilter} GROUP BY date(created_at) ORDER BY day ASC`, hp),
    ]);
    return NextResponse.json({
      totalViews: totalRow?.count || 0,
      uniqueVisitors: uniqueRow?.count || 0,
      bySource, byCountry, byDevice, byPath, byDay, days,
    });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
