import { headers } from 'next/headers';
import { getDb } from '@/lib/db';
import { getCurrentHospital } from '@/lib/hospitalContext';

// 도메인별 동적 생성 — 게시글 발행 시 즉시 반영되도록 캐시 비활성화
export const dynamic = 'force-dynamic';
export const revalidate = 0;

async function resolveBaseUrl(hospitalId) {
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

export default async function sitemap() {
  try {
    const hospital = await getCurrentHospital();
    const hospitalId = hospital?.hospitalId ?? null;
    const baseUrl = (await resolveBaseUrl(hospitalId)).replace(/\/+$/, '');

    if (!hospitalId) {
      return [{ url: baseUrl, lastModified: new Date(), changeFrequency: 'weekly', priority: 1 }];
    }

    const db = await getDb();

    // 1. seo_settings의 path 우선 (의도적으로 등록된 메타)
    const seoRows = await db.all(
      `SELECT slug, path, updated_at FROM seo_settings
       WHERE hospital_id = ? AND path IS NOT NULL AND path != ''
       ORDER BY CASE slug WHEN 'home' THEN 0 ELSE 1 END, path`,
      [hospitalId]
    );

    // 2. seo_settings에 없는 published page들 자동 보충 (헤더/푸터·로그인·마이페이지 같은 비공개 페이지 제외)
    const knownPaths = new Set(seoRows.map(r => r.path));
    const pageRows = await db.all(
      `SELECT slug, updated_at FROM pages
       WHERE hospital_id = ? AND is_published = 1
         AND slug NOT LIKE '\\_%' ESCAPE '\\'
         AND slug NOT LIKE '%-detail'
         AND slug NOT LIKE 'board-%'
         AND slug NOT IN ('login', 'register', 'mypage', 'main', 'notice', 'event')`,
      [hospitalId]
    );

    const all = [
      ...seoRows.map(r => ({
        url: r.path === '/' ? baseUrl : `${baseUrl}${r.path}`,
        lastModified: r.updated_at ? new Date(r.updated_at) : new Date(),
        changeFrequency: r.path === '/' ? 'weekly' : 'monthly',
        priority: r.path === '/' ? 1 : 0.8,
      })),
    ];

    for (const p of pageRows) {
      const path = `/${p.slug}`;
      if (knownPaths.has(path)) continue;
      all.push({
        url: `${baseUrl}${path}`,
        lastModified: p.updated_at ? new Date(p.updated_at) : new Date(),
        changeFrequency: 'monthly',
        priority: 0.7,
      });
    }

    // ── 커뮤니티 게시판: 목록 + 게시글 (포스팅 자동화로 발행된 글 자동 반영) ──
    const segs = new Set();
    for (const seg of ['notice', 'event']) {
      const exists = await db.get(
        'SELECT 1 FROM pages WHERE hospital_id = ? AND slug = ? AND is_published = 1',
        [hospitalId, seg]
      );
      if (exists) segs.add(seg);
    }
    const groups = await db.all('SELECT slug FROM board_groups WHERE hospital_id = ? AND is_active = 1', [hospitalId]);
    for (const g of groups) if (g.slug) segs.add(g.slug);
    for (const seg of segs) {
      all.push({
        url: `${baseUrl}/community/${seg}`,
        lastModified: new Date(),
        changeFrequency: 'weekly',
        priority: 0.7,
      });
    }

    // 발행된 게시글 상세 URL — /community/{seg}/{id}
    const posts = await db.all(
      `SELECT b.id, b.type, b.updated_at, g.slug AS gslug
       FROM boards b
       LEFT JOIN board_groups g ON g.id = b.board_group_id
       WHERE b.hospital_id = ? AND b.is_published = 1`,
      [hospitalId]
    );
    for (const p of posts) {
      const seg = p.type === 'board' ? p.gslug : p.type;
      if (!seg) continue;
      all.push({
        url: `${baseUrl}/community/${seg}/${p.id}`,
        lastModified: p.updated_at ? new Date(p.updated_at) : new Date(),
        changeFrequency: 'weekly',
        priority: 0.6,
      });
    }

    // 홈이 seo_settings에 없으면 추가
    if (!knownPaths.has('/')) {
      all.unshift({
        url: baseUrl,
        lastModified: new Date(),
        changeFrequency: 'weekly',
        priority: 1,
      });
    }

    return all;
  } catch (error) {
    return [{ url: 'https://example.com', lastModified: new Date() }];
  }
}
