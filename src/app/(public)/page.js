export const dynamic = 'force-dynamic';

import DynamicHtml from '@/components/DynamicHtml';
import JsonLd from '@/components/JsonLd';
import PageScript from '@/components/PageScript';
import { getCurrentHospital } from '@/lib/hospitalContext';
import { carouselToJsonLd, listActiveCarouselsForPage } from '@/lib/naverCarousel';
import { buildMetadata, buildPageJsonLd } from '@/lib/seo';
import { getPageDesign } from '@/lib/pageDesign';

export async function generateMetadata() {
  return buildMetadata('home');
}

export default async function HomePage() {
  const [pageJsonLd, design, hospital] = await Promise.all([
    buildPageJsonLd('home'),
    getPageDesign('main'),
    getCurrentHospital(),
  ]);

  const carousels = hospital?.hospitalId
    ? await listActiveCarouselsForPage({ hospitalId: hospital.hospitalId, pageSlug: 'main' })
    : [];

  return (
    <main>
      <JsonLd data={pageJsonLd} />
      {carousels.map((c) => (
        <JsonLd key={`carousel-${c.id}`} data={carouselToJsonLd(c)} />
      ))}
      {design?.custom_css && (
        <style dangerouslySetInnerHTML={{ __html: design.custom_css }} />
      )}
      {design?.content ? (
        <DynamicHtml html={design.content} />
      ) : (
        <p className="py-32 text-center text-zinc-400">페이지 콘텐츠가 없습니다.</p>
      )}
      {design?.custom_js && <PageScript js={design.custom_js} />}
    </main>
  );
}
