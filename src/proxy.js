import { NextResponse } from 'next/server';

// 관리 도메인 목록 (쉼표 구분 복수 지원)
// 예: ADMIN_DOMAINS="metacms.kr,metalink3.mycafe24.com,cms.mtlink.kr"
const ADMIN_DOMAIN_LIST = (process.env.ADMIN_DOMAINS || process.env.ADMIN_DOMAIN || process.env.SITE_URL || 'metacms.kr,localhost')
  .split(',')
  .map((d) => d.replace(/^https?:\/\//, '').replace(/\/+$/, '').trim().toLowerCase())
  .filter(Boolean);
const ADMIN_DOMAINS = new Set(ADMIN_DOMAIN_LIST);

// 서브도메인 미리보기 루트 — 모든 관리 도메인을 후보로 검사 ({slug}.metacms.kr / {slug}.metalink3... 동시 지원)
function extractSubdomain(host) {
  const normalized = host.split(':')[0].toLowerCase();
  for (const root of ADMIN_DOMAIN_LIST) {
    if (normalized === root) return null; // 관리 도메인 본체
    if (normalized.endsWith(`.${root}`)) {
      const sub = normalized.slice(0, -(root.length + 1));
      if (sub && !sub.includes('.')) return sub; // 단일 라벨만 서브도메인으로 인정
    }
  }
  return null;
}

// 공개 페이지 캐시 힌트(엣지/CDN용). 멀티테넌트라 캐시 키는 Host 포함 전제.
// - 로그인(어드민/환자 세션 쿠키) 또는 admin/api/q/share 경로는 캐시 금지(개인화·인증)
// - 그 외 익명 GET 공개 페이지만 짧게 캐시 + stale-while-revalidate
function applyCacheHeaders(request, response) {
  const p = request.nextUrl.pathname;
  const noStore =
    request.method !== 'GET' ||
    request.cookies.has('wonju_admin_session') ||
    request.cookies.has('patient_session') ||
    p.startsWith('/admin') ||
    p.startsWith('/api') ||
    p.startsWith('/q/') ||
    p.startsWith('/share/');

  response.headers.set(
    'Cache-Control',
    noStore ? 'private, no-store' : 'public, max-age=0, s-maxage=30, stale-while-revalidate=300'
  );
}

// 신뢰 헤더 주입: 클라이언트가 보낸 x-host/x-hospital-slug/x-pathname 는 제거하고,
// proxy(엣지)가 검증한 값만 '요청' 헤더로 주입한다(서버 컴포넌트 headers()가 읽는 값).
// 응답에만 set 하면 요청엔 안 들어가고, 인바운드를 strip 안 하면 클라이언트가
// x-hospital-slug 를 위조해 다른 테넌트 컨텍스트를 사칭(통계 오염 등)할 수 있다.
function nextWithTrustedHeaders(request, { pathname, host, hospitalSlug }) {
  const h = new Headers(request.headers);
  h.delete('x-hospital-slug');
  h.delete('x-host');
  h.delete('x-pathname');
  if (pathname != null) h.set('x-pathname', pathname);
  if (host != null) h.set('x-host', host);
  if (hospitalSlug != null) h.set('x-hospital-slug', hospitalSlug);
  const response = NextResponse.next({ request: { headers: h } });
  applyCacheHeaders(request, response);
  return response;
}

export function proxy(request) {
  const host = (request.headers.get('host') || '').toLowerCase();
  const pathname = request.nextUrl.pathname;
  const hostname = host.split(':')[0];
  const isAdminDomain = ADMIN_DOMAINS.has(hostname);
  const subdomain = extractSubdomain(host);

  // 서브도메인 미리보기: {slug}.metalink3.mycafe24.com → 해당 병원 사이트
  if (subdomain) {
    // 서브도메인에서는 /admin 차단
    if (pathname.startsWith('/admin')) {
      return NextResponse.redirect(new URL('/', request.url));
    }

    return nextWithTrustedHeaders(request, { pathname, host, hospitalSlug: subdomain });
  }

  // ⏸ TEMP-LANDING-OFF (2026-06-11, 협업 이슈로 임시 숨김): 랜딩 비노출 —
  //    루트·/site-landing·/landing 자산 전부 /admin 으로 보낸다.
  //    복원: 이 if 블록 한 개만 삭제하면 아래 원래 분기(루트→/site-landing)가 되살아난다.
  if (isAdminDomain && (pathname === '/' || pathname.startsWith('/site-landing') || pathname.startsWith('/landing'))) {
    return NextResponse.redirect(new URL('/admin', request.url));
  }

  // 관리 도메인 루트: 랜딩 페이지로 이동 (관리자 진입은 헤더의 "관리자 로그인" 버튼 → /admin)
  // 주의: 이 배포 환경(Caddy→http 내부서버)에서 NextResponse.rewrite 는 대상을 https://localhost:3000 외부
  // 프록시로 처리해 EPROTO 500 이 난다. 그래서 rewrite 가 아니라 redirect 로 /site-landing(랜딩 HTML 라우트)로 보낸다.
  if (isAdminDomain && pathname === '/') {
    return NextResponse.redirect(new URL('/site-landing', request.url));
  }
  // 공개 페이지(질문지/진행현황 공유)·랜딩(/site-landing 및 정적자산)은 관리 도메인에서도 접근 허용
  const isPublicShare = pathname.startsWith('/q/') || pathname.startsWith('/share/');
  if (isAdminDomain && !pathname.startsWith('/admin') && !pathname.startsWith('/api/') && !pathname.startsWith('/_next') && !pathname.startsWith('/site-landing') && !pathname.startsWith('/landing') && !pathname.startsWith('/fonts') && !isPublicShare) {
    return NextResponse.redirect(new URL('/admin', request.url));
  }

  // 치과 도메인: /admin 접근 차단
  if (!isAdminDomain && pathname.startsWith('/admin')) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  // 커스텀/관리 도메인: 호스트로만 테넌트 해석(x-hospital-slug 는 주입 안 함 → 사칭 차단)
  return nextWithTrustedHeaders(request, { pathname, host });
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon\\.ico|uploads).*)',
  ],
};
