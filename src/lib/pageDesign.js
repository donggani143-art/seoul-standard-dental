import { getDb } from '@/lib/db';
import { ensurePlatformSchema } from '@/lib/platform';
import { getCurrentHospital } from '@/lib/hospitalContext';

/**
 * 현재 병원의 특정 slug 페이지 디자인(content, custom_css) 조회.
 * 도메인 기반 병원 조회 실패 시(로컬 개발 환경 등) slug만으로 fallback 조회.
 *
 * @param {string} slug  PageDesignEditor 의 BUILTIN_PAGES slug 값
 * @returns {Promise<{ content: string, custom_css: string, custom_js: string } | null>}
 */
export async function getPageDesign(slug) {
  try {
    await ensurePlatformSchema();
    const db = await getDb();

    const hospital = await getCurrentHospital();
    let page;

    if (hospital?.hospitalId) {
      // 멀티테넌트: 도메인으로 병원 특정
      page = await db.get(
        `SELECT content, custom_css, custom_js FROM pages
         WHERE slug = ? AND hospital_id = ? AND is_published = 1`,
        [slug, hospital.hospitalId]
      );
    } else {
      // 병원 미식별: 데이터 없음 반환 (병원 간 데이터 혼선 방지)
      return null;
    }

    if (!page || (!page.content?.trim() && !page.custom_css?.trim())) return null;
    return page;
  } catch {
    return null;
  }
}

/**
 * 페이지 디자인 HTML 안의 템플릿 변수를 실제 데이터로 치환.
 * 예: {{post.title}} → 게시글 제목
 */
export function renderTemplate(design, vars = {}) {
  if (!design) return null;

  function replace(str) {
    if (!str) return str;
    return str.replace(/\{\{(\w+(?:\.\w+)*)\}\}/g, (_, key) => {
      const val = key.split('.').reduce((o, k) => o?.[k], vars);
      return val ?? '';
    });
  }

  return {
    content: replace(design.content),
    custom_css: replace(design.custom_css),
    custom_js: replace(design.custom_js),
  };
}
