import DynamicHtml from '@/components/DynamicHtml';
import CommunityListPage from '@/components/community/CommunityListPage';
import PageScript from '@/components/PageScript';
import { listBoards } from '@/lib/boards';
import { getCurrentHospital } from '@/lib/hospitalContext';
import { buildMetadata, buildPageJsonLd } from '@/lib/seo';
import { getPageDesign } from '@/lib/pageDesign';

export async function generateMetadata() {
  return buildMetadata('notice');
}

export default async function NoticePage() {
  const hospital = await getCurrentHospital();
  const hospitalId = hospital?.hospitalId ?? null;

  const [pageJsonLd, notices, design] = await Promise.all([
    buildPageJsonLd('notice'),
    hospitalId ? listBoards({ type: 'notice', hospitalId }) : [],
    getPageDesign('notice'),
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
      title="공지사항"
      description="업체 소식과 운영 변경 사항을 확인해 보세요."
      posts={notices}
      emptyMessage="등록된 공지사항이 없습니다."
    />
  );
}
