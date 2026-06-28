import DynamicHtml from '@/components/DynamicHtml';
import JsonLd from '@/components/JsonLd';
import PageScript from '@/components/PageScript';
import { buildMetadata, buildPageJsonLd } from '@/lib/seo';
import { getPageDesign } from '@/lib/pageDesign';

export async function generateMetadata() {
  return buildMetadata('about-hospital');
}

export default async function HospitalPage() {
  const [pageJsonLd, design] = await Promise.all([
    buildPageJsonLd('about-hospital'),
    getPageDesign('about'),
  ]);

  return (
    <main className="mx-auto max-w-7xl px-4 pb-20 pt-32">
      <JsonLd data={pageJsonLd} />
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
