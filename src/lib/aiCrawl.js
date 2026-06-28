import { getDb } from '@/lib/db';
import { ensurePlatformSchema } from '@/lib/platform';

// LLM/AI 봇 User-Agent 분류 테이블.
// kind: 'crawler' = 학습/색인 크롤러, 'assistant' = 사용자 질문에 답하려 실시간 페치
const AI_BOTS = [
  { t: 'GPTBot', bot: 'GPTBot', kind: 'crawler' },                 // OpenAI 학습 크롤러
  { t: 'OAI-SearchBot', bot: 'OAI-SearchBot', kind: 'crawler' },   // OpenAI 검색 색인
  { t: 'ChatGPT-User', bot: 'ChatGPT-User', kind: 'assistant' },   // ChatGPT 실시간 페치
  { t: 'ClaudeBot', bot: 'ClaudeBot', kind: 'crawler' },           // Anthropic 크롤러
  { t: 'Claude-SearchBot', bot: 'Claude-SearchBot', kind: 'crawler' },
  { t: 'Claude-User', bot: 'Claude-User', kind: 'assistant' },
  { t: 'anthropic-ai', bot: 'anthropic-ai', kind: 'crawler' },
  { t: 'PerplexityBot', bot: 'PerplexityBot', kind: 'crawler' },
  { t: 'Perplexity-User', bot: 'Perplexity-User', kind: 'assistant' },
  { t: 'Google-Extended', bot: 'Google-Extended', kind: 'crawler' }, // Gemini 학습
  { t: 'GoogleOther', bot: 'GoogleOther', kind: 'crawler' },
  { t: 'Bytespider', bot: 'Bytespider', kind: 'crawler' },         // ByteDance/Doubao
  { t: 'Amazonbot', bot: 'Amazonbot', kind: 'crawler' },
  { t: 'Applebot-Extended', bot: 'Applebot-Extended', kind: 'crawler' },
  { t: 'CCBot', bot: 'CCBot', kind: 'crawler' },                   // Common Crawl (LLM 학습 소스)
  { t: 'cohere-ai', bot: 'cohere-ai', kind: 'crawler' },
  { t: 'DuckAssistBot', bot: 'DuckAssistBot', kind: 'assistant' },
  { t: 'YouBot', bot: 'YouBot', kind: 'crawler' },
  { t: 'Diffbot', bot: 'Diffbot', kind: 'crawler' },
  { t: 'Meta-ExternalAgent', bot: 'Meta-ExternalAgent', kind: 'crawler' },
  { t: 'meta-externalagent', bot: 'Meta-ExternalAgent', kind: 'crawler' },
  { t: 'Timpibot', bot: 'Timpibot', kind: 'crawler' },
  { t: 'Kangaroo Bot', bot: 'Kangaroo', kind: 'crawler' },
  { t: 'PetalBot', bot: 'PetalBot', kind: 'crawler' },             // Huawei (Pangu)
];

// 일반 검색/소셜/SEO 봇 (kind='other'). 식별 가능한 "크롤러"만 집계한다.
// 사람 브라우저(Mozilla/Chrome/Safari 단독)는 절대 매칭되지 않도록 비-브라우저 토큰만 사용.
// ⚠ 범용 HTTP 클라이언트·자동화 도구(curl, wget, python-requests, Go-http-client, node-fetch,
//   headless 브라우저 등)는 여기 넣지 않는다 — 대부분 취약점 스캐너·스크립트라
//   'AI 크롤링' 통계를 오염시키고(한 번 스캔에 수천 건) DB를 부풀린다. 미분류(null)=미집계.
//   보안 모니터링이 필요하면 Caddy 액세스 로그/fail2ban 등 별도 수단을 쓴다.
const OTHER_BOTS = [
  // 검색/소셜 크롤러
  { t: 'Googlebot', bot: 'Googlebot' },
  { t: 'bingbot', bot: 'bingbot' },
  { t: 'Slurp', bot: 'Yahoo Slurp' },
  { t: 'DuckDuckBot', bot: 'DuckDuckBot' },
  { t: 'YandexBot', bot: 'YandexBot' },
  { t: 'Baiduspider', bot: 'Baiduspider' },
  { t: 'NaverBot', bot: 'NaverBot' },
  { t: 'Yeti', bot: 'NaverYeti' },
  { t: 'Daum', bot: 'DaumBot' },
  { t: 'facebookexternalhit', bot: 'facebookexternalhit' },
  { t: 'Twitterbot', bot: 'Twitterbot' },
  { t: 'Slackbot', bot: 'Slackbot' },
  { t: 'Discordbot', bot: 'Discordbot' },
  { t: 'TelegramBot', bot: 'TelegramBot' },
  { t: 'WhatsApp', bot: 'WhatsApp' },
  { t: 'kakaotalk-scrap', bot: 'KakaoTalk' },
  { t: 'Applebot', bot: 'Applebot' },
  // SEO/분석 크롤러
  { t: 'AhrefsBot', bot: 'AhrefsBot' },
  { t: 'SemrushBot', bot: 'SemrushBot' },
  { t: 'MJ12bot', bot: 'MJ12bot' },
  { t: 'DotBot', bot: 'DotBot' },
  { t: 'archive.org_bot', bot: 'archive.org' },
];

/**
 * User-Agent 분류.
 * - AI 크롤러/어시스턴트 → { bot, kind: 'crawler'|'assistant' }
 * - 일반 봇/자동화 도구   → { bot, kind: 'other' }
 * - 일반 사용자(브라우저) → null (집계 제외)
 * @param {string} ua
 * @returns {{ bot: string, kind: string } | null}
 */
export function classifyAiBot(ua) {
  if (!ua) return null;
  for (const e of AI_BOTS) {
    if (ua.indexOf(e.t) !== -1) return { bot: e.bot, kind: e.kind };
  }
  for (const e of OTHER_BOTS) {
    if (ua.indexOf(e.t) !== -1) return { bot: e.bot, kind: 'other' };
  }
  return null;
}

/**
 * AI 봇 크롤링 1건 기록. 베스트 에포트 — 실패해도 페이지 렌더에 영향 없음.
 * AI 봇이 아니거나 병원 미식별이면 아무것도 안 함.
 */
export async function recordAiCrawl({ hospitalId, path, userAgent, ip }) {
  try {
    const hit = classifyAiBot(userAgent || '');
    if (!hit || !hospitalId) return;
    await ensurePlatformSchema();
    const db = await getDb();
    await db.run(
      'INSERT INTO ai_crawls (hospital_id, bot, kind, path, user_agent, ip) VALUES (?, ?, ?, ?, ?, ?)',
      [hospitalId, hit.bot, hit.kind, String(path || '').slice(0, 512), String(userAgent || '').slice(0, 512), String(ip || '').slice(0, 64)]
    );
  } catch {
    /* 통계 기록 실패는 무시 */
  }
}
