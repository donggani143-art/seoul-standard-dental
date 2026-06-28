import { notFound } from 'next/navigation';
import DynamicHtml from '@/components/DynamicHtml';
import CommunityDetailPage from '@/components/community/CommunityDetailPage';
import PageScript from '@/components/PageScript';
import { getBoardById } from '@/lib/boards';
import { getCurrentHospital } from '@/lib/hospitalContext';
import { stripHtml } from '@/lib/html';
import { getPageDesign, renderTemplate } from '@/lib/pageDesign';

export async function generateMetadata({ params }) {
  const { id } = await params;
  const hospital = await getCurrentHospital();
  const hospitalId = hospital?.hospitalId ?? null;
  const post = hospitalId ? await getBoardById(id, { hospitalId }) : null;

  if (!post || post.type !== 'event') {
    return { title: '이벤트' };
  }

  return {
    title: `${post.title} | 이벤트`,
    description: stripHtml(post.content).slice(0, 140) || '이벤트 상세보기',
  };
}

export default async function EventDetailPage({ params }) {
  const { id } = await params;
  const hospital = await getCurrentHospital();
  const hospitalId = hospital?.hospitalId ?? null;
  const [post, design] = await Promise.all([
    hospitalId ? getBoardById(id, { hospitalId }) : null,
    getPageDesign('event-detail'),
  ]);

  if (!post || post.type !== 'event') {
    notFound();
  }

  if (design?.content) {
    const rendered = renderTemplate(design, {
      post: {
        title: post.title,
        content: post.content,
        date: new Date(post.created_at).toLocaleDateString('ko-KR'),
        rawDate: post.created_at,
        boardLabel: '이벤트',
        listHref: '/community/event',
        listLabel: '이벤트 목록으로',
      },
    });

    return (
      <>
        {rendered.custom_css && <style dangerouslySetInnerHTML={{ __html: rendered.custom_css }} />}
        <DynamicHtml html={rendered.content} />
        {rendered.custom_js && <PageScript js={rendered.custom_js} />}
      </>
    );
  }

  return (
    <CommunityDetailPage
      boardLabel="이벤트"
      title={post.title}
      content={post.content}
      createdAt={post.created_at}
      listHref="/community/event"
      listLabel="이벤트 목록으로"
    />
  );
}
