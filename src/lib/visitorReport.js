// 방문 통계(사람 방문자) 월간 집계 — page_views 기반.
// created_at 은 UTC(CURRENT_TIMESTAMP) 저장 → KST(+9h) 기준 달력 월로 집계.
// 통계 API(/api/analytics/stats)와 통합 PDF 리포트(/api/admin/ai-crawls/report)에서 공용으로 사용.

// KST(+9h) 기준 월 필터식 (SQLite)
export const MONTH_W = `strftime('%Y-%m', datetime(created_at, '+9 hours'))`;

export function isValidMonth(m) {
  return /^\d{4}-(0[1-9]|1[0-2])$/.test(String(m || ''));
}

export function prevMonthOf(m) {
  const [y, mo] = String(m).split('-').map(Number);
  return mo === 1 ? `${y - 1}-12` : `${y}-${String(mo - 1).padStart(2, '0')}`;
}

export function monthLabelKo(m) {
  const [y, mo] = String(m).split('-').map(Number);
  return `${y}년 ${mo}월`;
}

// 검색 유입 referrer 에서 검색어 추출(노출되는 경우만 — 대부분 엔진은 가림)
export function extractKeyword(ref) {
  try {
    const u = new URL(ref);
    for (const k of ['query', 'q', 'wd', 'keyword', 'search_query', 'text', 'word']) {
      const v = u.searchParams.get(k);
      if (v && v.trim()) return v.trim().slice(0, 60);
    }
  } catch { /* */ }
  return '';
}

// 한 달치 핵심 지표 (PV/UV/디바이스/체류시간/세션·이탈)
export async function monthMetrics(db, month, hFilter, hp) {
  const w = `${MONTH_W} = ? ${hFilter}`;
  const p = [month, ...hp];
  const [pvRow, uvRow, devRows, sessRow] = await Promise.all([
    db.get(`SELECT COUNT(*) c FROM page_views WHERE ${w}`, p),
    db.get(`SELECT COUNT(DISTINCT session_id) c FROM page_views WHERE ${w} AND session_id != ''`, p),
    db.all(`SELECT device, COUNT(*) c FROM page_views WHERE ${w} GROUP BY device`, p),
    db.get(`SELECT COUNT(*) sessions, AVG(cnt) pps, SUM(CASE WHEN cnt=1 THEN 1 ELSE 0 END) bounces
              FROM (SELECT COUNT(*) cnt FROM page_views WHERE ${w} AND session_id != '' GROUP BY session_id)`, p),
  ]);
  // 체류시간: 같은 세션 내 연속 페이지뷰 시간차 추정(1초~30분만, 이탈 idle 제외). 윈도우 함수 미지원 시 0.
  let avgDwell = 0;
  try {
    const dw = await db.get(
      `SELECT AVG(d) avg FROM (
         SELECT (strftime('%s', nxt) - strftime('%s', created_at)) d FROM (
           SELECT created_at, LEAD(created_at) OVER (PARTITION BY session_id ORDER BY created_at) nxt
           FROM page_views WHERE ${w} AND session_id != ''
         ) WHERE nxt IS NOT NULL
       ) WHERE d BETWEEN 1 AND 1800`, p);
    avgDwell = Math.round(dw?.avg || 0);
  } catch { avgDwell = 0; }

  const device = { mobile: 0, tablet: 0, desktop: 0 };
  devRows.forEach((r) => { if (r.device in device) device[r.device] = r.c; else device.desktop += r.c; });
  const sessions = sessRow?.sessions || 0;
  return {
    pv: pvRow?.c || 0,
    uv: uvRow?.c || 0,
    device,
    avgDwell,
    sessions,
    pagesPerSession: sessRow?.pps ? Math.round(sessRow.pps * 10) / 10 : 0,
    bounceRate: sessions ? Math.round((sessRow.bounces / sessions) * 100) : 0,
  };
}

/**
 * 방문 통계 월간 리포트(전월 대비 포함).
 * @param {*} db sqlite 핸들
 * @param {{ month: string, hospitalId?: number|null }} opts hospitalId=null → 플랫폼 전체 합계
 * @returns 통계 API month 모드 응답과 동일 형태 + monthLabel
 */
export async function buildVisitorMonthlyReport(db, { month, hospitalId = null }) {
  const m = isValidMonth(month) ? month : new Date().toISOString().slice(0, 7);
  const prev = prevMonthOf(m);
  const hFilter = hospitalId != null ? 'AND hospital_id = ?' : '';
  const hp = hospitalId != null ? [hospitalId] : [];
  const w = `${MONTH_W} = ? ${hFilter}`;

  const [current, previous, byPath, bySource, topRefRows, byDay] = await Promise.all([
    monthMetrics(db, m, hFilter, hp),
    monthMetrics(db, prev, hFilter, hp),
    db.all(`SELECT path, COUNT(*) count FROM page_views WHERE ${w} GROUP BY path ORDER BY count DESC LIMIT 12`, [m, ...hp]),
    db.all(`SELECT referrer_source source, COUNT(*) count FROM page_views WHERE ${w} GROUP BY referrer_source ORDER BY count DESC LIMIT 10`, [m, ...hp]),
    db.all(`SELECT referrer, COUNT(*) count FROM page_views WHERE ${w} AND referrer != '' AND referrer_source NOT IN ('Direct','Internal') GROUP BY referrer ORDER BY count DESC LIMIT 12`, [m, ...hp]),
    db.all(`SELECT date(datetime(created_at, '+9 hours')) day, COUNT(*) count FROM page_views WHERE ${w} GROUP BY day ORDER BY day ASC`, [m, ...hp]),
  ]);

  const topReferrers = topRefRows.map((r) => ({ referrer: r.referrer, count: r.count, keyword: extractKeyword(r.referrer) }));
  return {
    mode: 'month',
    month: m,
    monthLabel: monthLabelKo(m),
    prevMonth: prev,
    scope: hospitalId != null ? 'hospital' : 'platform',
    current, previous, byPath, bySource, topReferrers, byDay,
  };
}

/**
 * 모든 업체의 월간 방문 요약(한 쿼리) — AI 크롤링 표에 병합용.
 * @returns { [hospital_id]: { pv, uv, mobilePct } }
 */
export async function listVisitorByHospital(db, month) {
  const m = isValidMonth(month) ? month : new Date().toISOString().slice(0, 7);
  const rows = await db.all(
    `SELECT hospital_id,
            COUNT(*) pv,
            COUNT(DISTINCT CASE WHEN session_id != '' THEN session_id END) uv,
            SUM(CASE WHEN device = 'mobile' THEN 1 ELSE 0 END) mobile
     FROM page_views
     WHERE ${MONTH_W} = ?
     GROUP BY hospital_id`, [m]);
  const map = {};
  for (const r of rows) {
    map[r.hospital_id] = {
      pv: r.pv || 0,
      uv: r.uv || 0,
      mobilePct: r.pv ? Math.round((r.mobile / r.pv) * 100) : 0,
    };
  }
  return map;
}
