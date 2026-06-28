import DynamicHtml from '@/components/DynamicHtml';
import JsonLd from '@/components/JsonLd';
import PageScript from '@/components/PageScript';
import { buildMetadata, buildPageJsonLd } from '@/lib/seo';
import { getPageDesign } from '@/lib/pageDesign';

export async function generateMetadata() {
  return buildMetadata('implant');
}

export default async function ImplantPage() {
  const [pageJsonLd, design] = await Promise.all([
    buildPageJsonLd('implant'),
    getPageDesign('implant'),
  ]);

  if (!design?.content) {
    return (
      <main className="max-w-7xl mx-auto px-4 pt-32 pb-32">
        <p className="py-32 text-center text-zinc-400">페이지 콘텐츠가 없습니다.</p>
      </main>
    );
  }

  // 콘텐츠는 자체 풀폭 섹션 구조를 가지므로 래퍼 없이 전체 폭으로 렌더 ([...slug]와 동일)
  return (
    <>
      <JsonLd data={pageJsonLd} />
      {design.custom_css && <style dangerouslySetInnerHTML={{ __html: design.custom_css }} />}
      <DynamicHtml html={design.content} />
      {design.custom_js && <PageScript js={design.custom_js} />}
    </>
  );
}
