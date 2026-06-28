import DynamicHtml from '@/components/DynamicHtml';
import CommunityListPage from '@/components/community/CommunityListPage';
import PageScript from '@/components/PageScript';
import { listBoards } from '@/lib/boards';
import { getCurrentHospital } from '@/lib/hospitalContext';
import { buildMetadata, buildPageJsonLd } from '@/lib/seo';
import { getPageDesign } from '@/lib/pageDesign';

export async function generateMetadata() {
  return buildMetadata('event');
}

export default async function EventPage() {
  const hospital = await getCurrentHospital();
  const hospitalId = hospital?.hospitalId ?? null;

  const [pageJsonLd, events, design] = await Promise.all([
    buildPageJsonLd('event'),
    hospitalId ? listBoards({ type: 'event', hospitalId }) : [],
    getPageDesign('event'),
  ]);

  if (design?.content) {
    return (
      <>
        {design.custom_css && <style dangerouslySetInnerHTML={{ __html: design.custom_css }} />}
        <DynamicHtml html={design.content} />
        {design.custom_js && <PageScript js={design.custom_js} />}
      </>
    );
  }

  return (
    <CommunityListPage
      pageJsonLd={pageJsonLd}
      title="이벤트"
      description="현재 진행 중인 혜택과 프로모션 소식을 확인해 보세요."
      posts={events}
      emptyMessage="등록된 이벤트가 없습니다."
      highlight
    />
  );
}
