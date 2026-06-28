import { notFound, redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import DynamicHtml from '@/components/DynamicHtml';
import CommunityDetailPage from '@/components/community/CommunityDetailPage';
import PageScript from '@/components/PageScript';
import { getBoardListHref, isGradeBlocked, renderAttachmentsHtml, RESERVED_BOARD_SLUGS, resolveBoardContext } from '@/lib/boards';
import { getCurrentHospital } from '@/lib/hospitalContext';
import { stripHtml } from '@/lib/html';
import { getPageDesign, renderTemplate } from '@/lib/pageDesign';
import { decodePatientSessionToken, PATIENT_SESSION_COOKIE } from '@/lib/patientAuth';

export async function generateMetadata({ params }) {
  const { boardSlug, id } = await params;

  if (RESERVED_BOARD_SLUGS.has(boardSlug)) {
    return { title: '게시판' };
  }

  // 테넌트 스코프: 현재 병원 컨텍스트 없이는 다른 병원 글을 노출하지 않음(fail-closed)
  const hospital = await getCurrentHospital();
  const hospitalId = hospital?.hospitalId ?? null;
  const context = hospitalId ? await resolveBoardContext(boardSlug, id, { hospitalId }) : null;

  if (!context) {
    return { title: '게시판' };
  }

  return {
    title: `${context.post.title} | ${context.group.name}`,
    description: stripHtml(context.post.content).slice(0, 140) || `${context.group.name} 게시글 상세보기`,
  };
}

export default async function CommunityBoardDetailPage({ params }) {
  const { boardSlug, id } = await params;

  if (RESERVED_BOARD_SLUGS.has(boardSlug)) {
    notFound();
  }

  // 테넌트 스코프: 병원 컨텍스트가 없으면 차단(fail-closed)
  const hospital = await getCurrentHospital();
  const hospitalId = hospital?.hospitalId ?? null;
  if (!hospitalId) {
    notFound();
  }

  const [context, design] = await Promise.all([
    resolveBoardContext(boardSlug, id, { hospitalId }),
    getPageDesign(`board-${boardSlug}-detail`),
  ]);

  if (!context) {
    notFound();
  }

  // 접근 게이팅: 회원 전용 + 등급 차단
  {
    const cookieStore = await cookies();
    const token = cookieStore.get(PATIENT_SESSION_COOKIE)?.value;
    const patient = decodePatientSessionToken(token);
    if (context.group?.members_only) {
      const groupHospitalId = context.group.hospital_id ?? null;
      const sameHospital = patient && (!groupHospitalId || patient.hospitalId === groupHospitalId);
      if (!sameHospital) {
        const next = encodeURIComponent(`/community/${boardSlug}/${id}`);
        redirect(`/login?next=${next}`);
      }
    }
    if (patient && (await isGradeBlocked(context.group, patient))) {
      redirect('/');
    }
  }

  const listHref = getBoardListHref('board', context.group.slug);
  // 본문 뒤에 첨부파일 다운로드 목록을 덧붙임(기본·커스텀 디자인 양쪽에서 표시)
  const contentWithAttachments = context.post.content + renderAttachmentsHtml(context.post.attachments);

  if (design?.content) {
    const rendered = renderTemplate(design, {
      post: {
        title: context.post.title,
        content: contentWithAttachments,
        date: new Date(context.post.created_at).toLocaleDateString('ko-KR'),
        rawDate: context.post.created_at,
        boardLabel: context.group.name,
        listHref,
        listLabel: `${context.group.name} 목록으로`,
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
      boardLabel={context.group.name}
      title={context.post.title}
      content={contentWithAttachments}
      createdAt={context.post.created_at}
      listHref={listHref}
      listLabel={`${context.group.name} 목록으로`}
    />
  );
}
