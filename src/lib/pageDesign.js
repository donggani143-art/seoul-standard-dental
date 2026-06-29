import { getDb } from '@/lib/db';
import { ensurePlatformSchema } from '@/lib/platform';
import { getCurrentHospital } from '@/lib/hospitalContext';
import { getStaticSeoulStandardPage } from '@/lib/staticSeoulStandard';

export async function getPageDesign(slug) {
  const staticPage = getStaticSeoulStandardPage(slug);
  if (staticPage) return staticPage;

  try {
    await ensurePlatformSchema();
    const db = await getDb();
    const hospital = await getCurrentHospital();

    if (!hospital?.hospitalId) return null;

    return db.get(
      'SELECT content, custom_css, custom_js FROM pages WHERE slug = ? AND hospital_id = ? AND is_published = 1',
      [slug, hospital.hospitalId]
    );
  } catch {
    return null;
  }
}

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
