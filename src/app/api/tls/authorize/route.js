import { NextResponse } from 'next/server';
import { getHospitalFromHost, getHospitalFromSlug } from '@/lib/hospitalContext';

// ── On-demand TLS 인증 게이트 ────────────────────────────────────────────────
// Caddy(on-demand_tls.ask) 또는 Cloudflare for SaaS 검증이 호출한다.
//   GET /api/tls/authorize?domain=<hostname>
// 200 → 해당 호스트는 우리 플랫폼이 서비스하는 도메인 (인증서 발급 허용)
// 403 → 모르는 도메인 (무분별한 인증서 발급 차단)
//
// 이 게이트가 있어야 임의 도메인으로 인증서가 남발되는 어뷰징을 막을 수 있다.
// 인증/세션 불필요(엣지가 비인증으로 호출). /api 라서 캐시도 BYPASS 된다.

// 관리 도메인 목록 (proxy.js 와 동일 규칙)
const ADMIN_ROOTS = (process.env.ADMIN_DOMAINS || process.env.ADMIN_DOMAIN || process.env.SITE_URL || 'metacms.kr')
  .split(',')
  .map((d) => d.replace(/^https?:\/\//, '').replace(/\/+$/, '').trim().toLowerCase())
  .filter(Boolean);
const ADMIN_ROOT_SET = new Set(ADMIN_ROOTS);

function normalizeDomain(value) {
  return String(value || '').split(':')[0].trim().toLowerCase().replace(/\.$/, '');
}

// 단일 라벨 서브도메인이면 slug 추출 (slug.metacms.kr → 'slug')
function extractSubdomainSlug(domain) {
  for (const root of ADMIN_ROOTS) {
    if (domain.endsWith(`.${root}`)) {
      const sub = domain.slice(0, -(root.length + 1));
      if (sub && !sub.includes('.')) return sub;
    }
  }
  return null;
}

function deny() {
  return new NextResponse('domain not authorized', { status: 403 });
}

export async function GET(request) {
  const domain = normalizeDomain(request.nextUrl.searchParams.get('domain'));
  if (!domain) {
    return new NextResponse('missing domain', { status: 400 });
  }

  // 1) 플랫폼 관리 도메인 (metacms.kr / cms.mtlink.kr / metalink3...)
  if (ADMIN_ROOT_SET.has(domain)) {
    return NextResponse.json({ ok: true, kind: 'admin' });
  }

  // 2) 관리 루트의 서브도메인 미리보기 (slug.metacms.kr) — 활성 병원 slug 여야 허용
  const slug = extractSubdomainSlug(domain);
  if (slug) {
    const hospital = await getHospitalFromSlug(slug);
    if (hospital) {
      return NextResponse.json({ ok: true, kind: 'subdomain', hospitalId: hospital.hospitalId });
    }
    return deny();
  }

  // 3) 거래처 커스텀 도메인 — hospital_domains 에 connected/pending 으로 등록 + 병원 active
  const hospital = await getHospitalFromHost(domain);
  if (hospital) {
    return NextResponse.json({ ok: true, kind: 'custom', hospitalId: hospital.hospitalId });
  }

  return deny();
}