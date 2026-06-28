import DynamicHtml from '@/components/DynamicHtml';
import { notFound, redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import CommunityListPage from '@/components/community/CommunityListPage';
import PageScript from '@/components/PageScript';
import { getBoardGroupBySlug, isGradeBlocked, listBoards, RESERVED_BOARD_SLUGS } from '@/lib/boards';
import { getCurrentHospital } from '@/lib/hospitalContext';
import { getPageDesign } from '@/lib/pageDesign';
import { decodePatientSessionToken, PATIENT_SESSION_COOKIE } from '@/lib/patientAuth';

export async function generateMetadata({ params }) {
  const { boardSlug } = await params;
  if (RESERVED_BOARD_SLUGS.has(boardSlug)) return { title: '커뮤니티' };
  const hospital = await getCurrentHospital();
  const hospitalId = hospital?.hospitalId ?? null;
  const group = hospitalId ? await getBoardGroupBySlug(boardSlug, { hospitalId }) : null;
  if (!group) return { title: '게시판' };
  return { title: `${group.name} | 게시판`, description: group.description || `${group.name} 게시판` };
}

export default async function CommunityBoardPage({ params }) {
  const { boardSlug } = await params;
  if (RESERVED_BOARD_SLUGS.has(boardSlug)) notFound();

  const hospital = await getCurrentHospital();
  const hospitalId = hospital?.hospitalId ?? null;
  if (!hospitalId) notFound();

  const group = await getBoardGroupBySlug(boardSlug, { hospitalId });
  if (!group) notFound();

  // 접근 게이팅: 회원 전용(비로그인 차단) + 등급 차단(특정 등급 열람 금지)
  {
    const cookieStore = await cookies();
    const token = cookieStore.get(PATIENT_SESSION_COOKIE)?.value;
    const patient = decodePatientSessionToken(token);
    if (group.members_only) {
      const sameHospital = patient && (!hospitalId || patient.hospitalId === hospitalId);
      if (!sameHospital) {
        const next = encodeURIComponent(`/community/${boardSlug}`);
        redirect(`/login?next=${next}`);
      }
    }
    if (patient && (await isGradeBlocked(group, patient))) {
      redirect('/');
    }
  }

  const [posts, design] = await Promise.all([
    hospitalId ? listBoards({ type: 'board', groupSlug: boardSlug, hospitalId }) : [],
    getPageDesign(`board-${boardSlug}`),
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
      title={group.name}
      description={group.description || `${group.name} 게시판입니다.`}
      posts={posts}
      emptyMessage="등록된 게시글이 없습니다."
    />
  );
}
