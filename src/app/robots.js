import { headers } from 'next/headers';
import { getDb } from '@/lib/db';
import { getCurrentHospital } from '@/lib/hospitalContext';

// 도메인별 동적 생성 — 각 도메인의 Sitemap 경로를 캐시 없이 정확히 선언
export const dynamic = 'force-dynamic';
export const revalidate = 0;

async function resolveBaseUrl() {
  const hospital = await getCurrentHospital();
  const hospitalId = hospital?.hospitalId ?? null;

  if (hospitalId) {
    try {
      const db = await getDb();
      const primary = await db.get(
        `SELECT domain FROM hospital_domains
         WHERE hospital_id = ? AND status IN ('connected','pending')
         ORDER BY is_primary DESC, id ASC LIMIT 1`,
        [hospitalId]
      );
      if (primary?.domain) return `https://${primary.domain}`;
    } catch {}
  }

  try {
    const h = await headers();
    const host = h.get('x-forwarded-host') || h.get('host');
    const proto = h.get('x-forwarded-proto') || 'https';
    if (host) return `${proto}://${host}`;
  } catch {}

  return process.env.SITE_URL || process.env.NEXT_PUBLIC_SITE_URL || 'https://example.com';
}

export default async function robots() {
  const baseUrl = (await resolveBaseUrl()).replace(/\/+$/, '');
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/admin/', '/api/'],
    },
    sitemap: `${baseUrl}/sitemap.xml`,
    host: baseUrl,
  };
}
