// AI 크롤링 월간 리포트 데이터 집계 (슈퍼관리자 전용).
// created_at 은 UTC(CURRENT_TIMESTAMP)로 저장 → KST(+9h) 기준 달력 월로 집계한다.

// 봇 → AI 제품 매핑 (마케팅 해석용: "어떤 AI가 우리 사이트를 봤나")
export const AI_PRODUCTS = [
  { key: 'openai', label: 'ChatGPT · OpenAI', bots: ['GPTBot', 'OAI-SearchBot', 'ChatGPT-User'] },
  { key: 'anthropic', label: 'Claude · Anthropic', bots: ['ClaudeBot', 'Claude-SearchBot', 'Claude-User', 'anthropic-ai'] },
  { key: 'perplexity', label: 'Perplexity', bots: ['PerplexityBot', 'Perplexity-User'] },
  { key: 'google', label: 'Gemini · Google', bots: ['Google-Extended', 'GoogleOther'] },
  { key: 'other_ai', label: '기타 AI', bots: ['Bytespider', 'Amazonbot', 'Applebot-Extended', 'CCBot', 'cohere-ai', 'DuckAssistBot', 'YouBot', 'Diffbot', 'Meta-ExternalAgent', 'Timpibot', 'Kangaroo', 'PetalBot'] },
];

const KIND_LABEL = { crawler: 'AI 크롤러', assistant: 'AI 실시간 답변', other: '기타 봇/도구' };

function pad2(n) { return String(n).padStart(2, '0'); }

// 'YYYY-MM' 유효성
export function isValidMonth(month) {
  return /^\d{4}-(0[1-9]|1[0-2])$/.test(String(month || ''));
}

export function prevMonth(month) {
  const [y, m] = month.split('-').map(Number);
  return m === 1 ? `${y - 1}-12` : `${y}-${pad2(m - 1)}`;
}

export function monthLabelKo(month) {
  const [y, m] = month.split('-').map(Number);
  return `${y}년 ${m}월`;
}

// KST 기준 월/일 추출식 (SQLite)
const M = "strftime('%Y-%m', datetime(@col, '+9 hours'))";
const D = "strftime('%Y-%m-%d', datetime(@col, '+9 hours'))";
const monthExpr = (col) => M.replace('@col', col);
const dayExpr = (col) => D.replace('@col', col);

/**
 * 월간 리포트 데이터 집계.
 * @param {*} db sqlite 핸들
 * @param {{ month: string, hospitalId?: number|null }} opts
 */
export async function buildAiCrawlReport(db, { month, hospitalId = null }) {
  const prev = prevMonth(month);
  const hf = hospitalId ? 'AND hospital_id = ?' : '';
  const hp = hospitalId ? [hospitalId] : [];
  const mE = monthExpr('created_at');

  const [curRow, prevRow, byKindRows, byBotRows, dailyRows] = await Promise.all([
    db.get(`SELECT COUNT(*) AS c FROM ai_crawls WHERE ${mE} = ? ${hf}`, [month, ...hp]),
    db.get(`SELECT COUNT(*) AS c FROM ai_crawls WHERE ${mE} = ? ${hf}`, [prev, ...hp]),
    db.all(`SELECT kind, COUNT(*) AS c FROM ai_crawls WHERE ${mE} = ? ${hf} GROUP BY kind`, [month, ...hp]),
    db.all(`SELECT bot, kind, COUNT(*) AS c FROM ai_crawls WHERE ${mE} = ? ${hf} GROUP BY bot, kind ORDER BY c DESC`, [month, ...hp]),
    db.all(`SELECT ${dayExpr('created_at')} AS day, COUNT(*) AS c FROM ai_crawls WHERE ${mE} = ? ${hf} GROUP BY day ORDER BY day ASC`, [month, ...hp]),
  ]);

  const total = curRow?.c ?? 0;
  const prevTotal = prevRow?.c ?? 0;
  const momPct = prevTotal > 0 ? Math.round(((total - prevTotal) / prevTotal) * 1000) / 10 : null;

  // kind 합계
  const byKind = { crawler: 0, assistant: 0, other: 0 };
  for (const r of byKindRows) if (r.kind in byKind) byKind[r.kind] = r.c;
  const aiTotal = byKind.crawler + byKind.assistant; // 사람 답변에 영향 주는 'AI' 합계

  // 봇별
  const byBot = byBotRows.map((r) => ({ bot: r.bot, kind: r.kind, count: r.c }));

  // AI 제품별 가시성
  const botCount = {};
  for (const r of byBotRows) botCount[r.bot] = (botCount[r.bot] || 0) + r.c;
  const byProduct = AI_PRODUCTS.map((p) => ({
    key: p.key,
    label: p.label,
    count: p.bots.reduce((s, b) => s + (botCount[b] || 0), 0),
  })).filter((p) => p.count > 0).sort((a, b) => b.count - a.count);

  // 일별 추이
  const daily = dailyRows.map((r) => ({ day: r.day, count: r.c }));

  let hospital = null;
  let hospitals = [];
  if (hospitalId) {
    hospital = await db.get('SELECT id, name, slug FROM hospitals WHERE id = ?', [hospitalId]);
  } else {
    const mA = monthExpr('a.created_at');
    const [perHospital, perHospitalBot] = await Promise.all([
      db.all(
        `SELECT a.hospital_id, h.name AS hospital_name, h.slug AS hospital_slug,
                COUNT(*) AS total, MAX(a.created_at) AS last_seen,
                SUM(CASE WHEN a.kind IN ('crawler','assistant') THEN 1 ELSE 0 END) AS ai_total
         FROM ai_crawls a LEFT JOIN hospitals h ON h.id = a.hospital_id
         WHERE ${mA} = ? GROUP BY a.hospital_id ORDER BY total DESC`,
        [month]
      ),
      db.all(
        `SELECT a.hospital_id, a.bot, COUNT(*) AS c
         FROM ai_crawls a WHERE ${mA} = ? GROUP BY a.hospital_id, a.bot ORDER BY c DESC`,
        [month]
      ),
    ]);
    const botsByHospital = {};
    for (const r of perHospitalBot) (botsByHospital[r.hospital_id] ||= []).push({ bot: r.bot, count: r.c });
    hospitals = perHospital.map((h) => ({
      hospital_id: h.hospital_id,
      hospital_name: h.hospital_name || `(미식별 #${h.hospital_id ?? '-'})`,
      hospital_slug: h.hospital_slug || null,
      total: h.total,
      ai_total: h.ai_total ?? 0,
      last_seen: h.last_seen,
      bots: botsByHospital[h.hospital_id] || [],
    }));
  }

  return {
    month,
    monthLabel: monthLabelKo(month),
    prevMonth: prev,
    scope: hospitalId ? 'hospital' : 'platform',
    hospital: hospital ? { id: hospital.id, name: hospital.name, slug: hospital.slug } : null,
    total,
    prevTotal,
    momPct,
    aiTotal,
    byKind,
    kindLabel: KIND_LABEL,
    byBot,
    byProduct,
    daily,
    hospitals,
    generatedAt: new Date().toISOString(),
  };
}