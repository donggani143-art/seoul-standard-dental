// 네이버 검색 캐러셀(JSON-LD ItemList) 데이터 관리
// 업체별로 여러 캐러셀, 캐러셀당 여러 항목

import { getDb } from '@/lib/db';
import { ensurePlatformSchema } from '@/lib/platform';

const ALLOWED_ITEM_TYPES = new Set(['Article']); // MVP: Article 만

function sanitizeUrl(value) {
  return String(value || '').trim().slice(0, 500);
}
function sanitizeText(value, maxLen = 200) {
  return String(value || '').trim().slice(0, maxLen);
}

/**
 * 업체의 캐러셀 목록 + 각 캐러셀의 항목 수.
 */
export async function listCarousels({ hospitalId }) {
  if (!hospitalId) return [];
  await ensurePlatformSchema();
  const db = await getDb();
  return db.all(
    `SELECT c.id, c.hospital_id, c.title, c.page_slug, c.item_type,
            c.is_active, c.sort_order, c.created_at, c.updated_at,
            (SELECT COUNT(*) FROM naver_carousel_items i WHERE i.carousel_id = c.id) AS item_count
       FROM naver_carousels c
      WHERE c.hospital_id = ?
      ORDER BY c.sort_order, c.id`,
    [hospitalId]
  );
}

/**
 * 단일 캐러셀 + 항목 목록.
 */
export async function getCarouselWithItems({ carouselId, hospitalId }) {
  if (!carouselId || !hospitalId) return null;
  await ensurePlatformSchema();
  const db = await getDb();
  const carousel = await db.get(
    'SELECT * FROM naver_carousels WHERE id = ? AND hospital_id = ?',
    [carouselId, hospitalId]
  );
  if (!carousel) return null;
  const items = await db.all(
    `SELECT id, carousel_id, position, name, url, image_url, description, created_at
       FROM naver_carousel_items
      WHERE carousel_id = ?
      ORDER BY position, id`,
    [carouselId]
  );
  return { ...carousel, items };
}

/**
 * 캐러셀 생성 (빈 캐러셀).
 */
export async function createCarousel({ hospitalId, title = '', pageSlug = 'main', itemType = 'Article' }) {
  if (!hospitalId) throw new Error('hospital_id가 필요합니다.');
  await ensurePlatformSchema();
  const db = await getDb();
  const safeType = ALLOWED_ITEM_TYPES.has(itemType) ? itemType : 'Article';
  const result = await db.run(
    `INSERT INTO naver_carousels (hospital_id, title, page_slug, item_type)
     VALUES (?, ?, ?, ?)`,
    [hospitalId, sanitizeText(title, 100), sanitizeText(pageSlug, 60) || 'main', safeType]
  );
  return db.get('SELECT * FROM naver_carousels WHERE id = ?', [result.lastID]);
}

/**
 * 캐러셀 본체 수정 (제목, 활성, 정렬).
 */
export async function updateCarousel({ id, hospitalId, title, pageSlug, itemType, isActive, sortOrder }) {
  await ensurePlatformSchema();
  const db = await getDb();
  const existing = await db.get('SELECT id FROM naver_carousels WHERE id = ? AND hospital_id = ?', [id, hospitalId]);
  if (!existing) throw new Error('캐러셀을 찾을 수 없습니다.');

  const fields = [];
  const params = [];
  if (title !== undefined) { fields.push('title = ?'); params.push(sanitizeText(title, 100)); }
  if (pageSlug !== undefined) { fields.push('page_slug = ?'); params.push(sanitizeText(pageSlug, 60) || 'main'); }
  if (itemType !== undefined) {
    fields.push('item_type = ?');
    params.push(ALLOWED_ITEM_TYPES.has(itemType) ? itemType : 'Article');
  }
  if (isActive !== undefined) { fields.push('is_active = ?'); params.push(isActive ? 1 : 0); }
  if (sortOrder !== undefined) { fields.push('sort_order = ?'); params.push(Number(sortOrder) || 0); }
  if (!fields.length) return existing;

  fields.push('updated_at = CURRENT_TIMESTAMP');
  params.push(id, hospitalId);
  await db.run(`UPDATE naver_carousels SET ${fields.join(', ')} WHERE id = ? AND hospital_id = ?`, params);
  return db.get('SELECT * FROM naver_carousels WHERE id = ?', [id]);
}

/**
 * 캐러셀 삭제 (항목 cascade).
 */
export async function deleteCarousel({ id, hospitalId }) {
  await ensurePlatformSchema();
  const db = await getDb();
  const result = await db.run(
    'DELETE FROM naver_carousels WHERE id = ? AND hospital_id = ?',
    [id, hospitalId]
  );
  return result.changes;
}

/**
 * 캐러셀 항목들을 통째로 교체 (리스트 갱신용).
 * @param {{carouselId: number, hospitalId: number, items: Array<{name, url, image_url, description}>}}
 */
export async function replaceCarouselItems({ carouselId, hospitalId, items }) {
  await ensurePlatformSchema();
  const db = await getDb();

  // 캐러셀 소유 확인
  const owns = await db.get(
    'SELECT id FROM naver_carousels WHERE id = ? AND hospital_id = ?',
    [carouselId, hospitalId]
  );
  if (!owns) throw new Error('캐러셀을 찾을 수 없습니다.');

  const list = Array.isArray(items) ? items : [];
  const sanitized = list.map((it, idx) => ({
    position: idx,
    name: sanitizeText(it.name, 200),
    url: sanitizeUrl(it.url),
    image_url: sanitizeUrl(it.image_url),
    description: sanitizeText(it.description, 500),
  }));

  await db.run('BEGIN');
  try {
    await db.run('DELETE FROM naver_carousel_items WHERE carousel_id = ?', [carouselId]);
    for (const it of sanitized) {
      await db.run(
        `INSERT INTO naver_carousel_items (carousel_id, position, name, url, image_url, description)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [carouselId, it.position, it.name, it.url, it.image_url, it.description]
      );
    }
    await db.run('UPDATE naver_carousels SET updated_at = CURRENT_TIMESTAMP WHERE id = ?', [carouselId]);
    await db.run('COMMIT');
  } catch (e) {
    await db.run('ROLLBACK');
    throw e;
  }
  return sanitized.length;
}

/**
 * 특정 페이지 슬러그에 노출되는 활성 캐러셀들 (JSON-LD 출력용).
 * 항목이 1개 이상 있는 캐러셀만 반환.
 */
export async function listActiveCarouselsForPage({ hospitalId, pageSlug }) {
  if (!hospitalId || !pageSlug) return [];
  await ensurePlatformSchema();
  const db = await getDb();
  const carousels = await db.all(
    `SELECT id, title, item_type FROM naver_carousels
      WHERE hospital_id = ? AND page_slug = ? AND is_active = 1
      ORDER BY sort_order, id`,
    [hospitalId, pageSlug]
  );
  const result = [];
  for (const c of carousels) {
    const items = await db.all(
      `SELECT position, name, url, image_url, description
         FROM naver_carousel_items
        WHERE carousel_id = ?
        ORDER BY position, id`,
      [c.id]
    );
    if (items.length > 0) result.push({ ...c, items });
  }
  return result;
}

/**
 * 캐러셀 → JSON-LD ItemList 객체로 변환 (Naver 캐러셀 스펙).
 */
export function carouselToJsonLd(carousel, baseUrl = '') {
  const items = (carousel.items || []).map((it, idx) => ({
    '@type': 'ListItem',
    position: idx + 1,
    url: it.url,
    item: {
      '@type': carousel.item_type || 'Article',
      ...(it.name ? { name: it.name } : {}),
      ...(it.url ? { url: it.url } : {}),
      ...(it.image_url ? { image: it.image_url.startsWith('http') ? it.image_url : (baseUrl + it.image_url) } : {}),
      ...(it.description ? { description: it.description } : {}),
    },
  }));
  return {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    ...(carousel.title ? { name: carousel.title } : {}),
    itemListElement: items,
  };
}
