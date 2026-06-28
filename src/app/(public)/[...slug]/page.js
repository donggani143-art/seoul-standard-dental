import { notFound } from 'next/navigation';
import DynamicHtml from '@/components/DynamicHtml';
import PageScript from '@/components/PageScript';
import JsonLd from '@/components/JsonLd';
import { getPageDesign } from '@/lib/pageDesign';
import { getCurrentHospital } from '@/lib/hospitalContext';
import { buildMetadata, buildPageJsonLd } from '@/lib/seo';

// per-page EEAT JSON-LD(작성자·검수자·검수일) 활성화 병원. seo_settings에 author/reviewer_doctor_id 설정 시 작동.
const PER_PAGE_JSONLD_HOSPITALS = new Set([3, 33]);

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const slugStr = Array.isArray(slug) ? slug.join('/') : slug;
  return buildMetadata(slugStr, { title: slugStr });
}

export default async function CustomPage({ params }) {
  const { slug } = await params;
  const slugStr = Array.isArray(slug) ? slug.join('/') : slug;
  const [design, hospital] = await Promise.all([
    getPageDesign(slugStr),
    getCurrentHospital(),
  ]);

  if (!design?.content) {
    notFound();
  }

  const pageJsonLd =
    hospital && PER_PAGE_JSONLD_HOSPITALS.has(hospital.hospitalId)
      ? await buildPageJsonLd(slugStr, { title: slugStr })
      : null;

  return (
    <>
      {pageJsonLd && <JsonLd data={pageJsonLd} />}
      {design.custom_css && <style dangerouslySetInnerHTML={{ __html: design.custom_css }} />}
      <DynamicHtml html={design.content} />
      {design.custom_js && <PageScript js={design.custom_js} />}
    </>
  );
}
