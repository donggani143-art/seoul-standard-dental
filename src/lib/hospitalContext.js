import { headers } from 'next/headers';
import { getDb } from '@/lib/db';
import { ensurePlatformSchema } from '@/lib/platform';

const domainCache = new Map();
const CACHE_TTL_MS = 60_000;

function normalizeHost(host) {
  return String(host || '').split(':')[0].trim().toLowerCase();
}

export async function getHospitalFromHost(host) {
  const normalized = normalizeHost(host);
  if (!normalized) return null;

  const cached = domainCache.get(normalized);
  if (cached && Date.now() - cached.at < CACHE_TTL_MS) {
    return cached.value;
  }

  try {
    await ensurePlatformSchema();
    const db = await getDb();

    // www.example.com 은 등록된 apex(example.com)로도 매칭 — www 자동 지원
    // (Caddy on-demand TLS 발급 허용 + 테넌트 해석 둘 다 커버). 정확 매칭을 우선.
    const candidates = normalized.startsWith('www.')
      ? [normalized, normalized.slice(4)]
      : [normalized];
    const placeholders = candidates.map(() => '?').join(', ');

    const row = await db.get(
      `SELECT d.hospital_id, h.name AS hospital_name
       FROM hospital_domains d
       JOIN hospitals h ON h.id = d.hospital_id
       WHERE d.domain IN (${placeholders})
         AND d.status IN ('connected', 'pending')
         AND h.status = 'active'
       ORDER BY (d.domain = ?) DESC
       LIMIT 1`,
      [...candidates, normalized]
    );

    const result = row
      ? { hospitalId: row.hospital_id, hospitalName: row.hospital_name }
      : null;

    domainCache.set(normalized, { value: result, at: Date.now() });
    return result;
  } catch {
    return null;
  }
}

export async function getHospitalFromSlug(slug) {
  if (!slug) return null;

  const cacheKey = `slug:${slug}`;
  const cached = domainCache.get(cacheKey);
  if (cached && Date.now() - cached.at < CACHE_TTL_MS) {
    return cached.value;
  }

  try {
    await ensurePlatformSchema();
    const db = await getDb();

    // 서브도메인 미리보기는 draft 상태도 허용
    const row = await db.get(
      `SELECT id AS hospital_id, name AS hospital_name
       FROM hospitals
       WHERE slug = ? AND status = 'active'`,
      [slug]
    );

    const result = row
      ? { hospitalId: row.hospital_id, hospitalName: row.hospital_name }
      : null;

    domainCache.set(cacheKey, { value: result, at: Date.now() });
    return result;
  } catch {
    return null;
  }
}

export async function getCurrentHospital() {
  const headersList = await headers();

  // 1순위: 서브도메인 slug (미리보기)
  const slugHeader = headersList.get('x-hospital-slug');
  if (slugHeader) {
    return getHospitalFromSlug(slugHeader);
  }

  // 2순위: 도메인 매칭
  const host = headersList.get('x-host') || headersList.get('host') || '';
  return getHospitalFromHost(host);
}
