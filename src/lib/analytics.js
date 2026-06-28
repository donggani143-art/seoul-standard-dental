/**
 * 트래픽 분석 유틸 - 유입 채널 / 디바이스 / 국가 매핑
 */

// IP별 국가 캐시 (메모리, 24시간 TTL)
const countryCache = new Map();
const CACHE_TTL = 24 * 60 * 60 * 1000;

const REFERRER_RULES = [
  { pattern: /google\./i, source: 'Google' },
  { pattern: /naver\./i, source: 'Naver' },
  { pattern: /daum\.|kakao\./i, source: 'Daum/Kakao' },
  { pattern: /bing\./i, source: 'Bing' },
  { pattern: /yahoo\./i, source: 'Yahoo' },
  { pattern: /facebook\./i, source: 'Facebook' },
  { pattern: /instagram\./i, source: 'Instagram' },
  { pattern: /youtube\./i, source: 'YouTube' },
  { pattern: /twitter\.|x\.com/i, source: 'X(Twitter)' },
  { pattern: /linkedin\./i, source: 'LinkedIn' },
  { pattern: /pf\.kakao\./i, source: 'KakaoChannel' },
];

export function classifyReferrer(referrer, currentHost) {
  if (!referrer) return 'Direct';

  try {
    const url = new URL(referrer);
    const host = url.hostname.toLowerCase();

    // 자기 사이트 내 이동
    if (currentHost && host === currentHost.toLowerCase()) return 'Internal';

    for (const rule of REFERRER_RULES) {
      if (rule.pattern.test(host)) return rule.source;
    }

    return host;
  } catch {
    return 'Direct';
  }
}

export function classifyDevice(userAgent) {
  if (!userAgent) return 'desktop';
  const ua = userAgent.toLowerCase();
  if (/mobi|android|iphone|ipod|blackberry|windows phone/.test(ua)) return 'mobile';
  if (/ipad|tablet/.test(ua)) return 'tablet';
  return 'desktop';
}

export async function lookupCountry(ip) {
  if (!ip || ip === '::1' || ip === '127.0.0.1' || ip.startsWith('192.168.') || ip.startsWith('10.')) {
    return 'Local';
  }

  const cached = countryCache.get(ip);
  if (cached && Date.now() - cached.at < CACHE_TTL) return cached.country;

  try {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 3000);
    const res = await fetch(`http://ip-api.com/json/${ip}?fields=country`, { signal: ctrl.signal });
    clearTimeout(timer);
    const data = await res.json();
    const country = data?.country || 'Unknown';
    countryCache.set(ip, { country, at: Date.now() });
    return country;
  } catch {
    return 'Unknown';
  }
}

export function getClientIp(request) {
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) return forwarded.split(',')[0].trim();
  const real = request.headers.get('x-real-ip');
  if (real) return real;
  return '';
}
