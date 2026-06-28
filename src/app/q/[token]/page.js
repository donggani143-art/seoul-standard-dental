import { loadQuestionnaire } from '@/lib/salesShare';
import QuestionnaireForm from '@/components/QuestionnaireForm';

export const dynamic = 'force-dynamic';

export async function generateMetadata() {
  return { title: '병원 정보 입력 — 홈페이지 제작', robots: { index: false, follow: false } };
}

function ErrorPage({ title, message }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-base px-4 font-sans">
      <div className="w-full max-w-md rounded-2xl border border-line bg-white p-8 text-center shadow-sm">
        <p className="text-4xl">🔒</p>
        <h1 className="mt-4 text-lg font-black text-offblack">{title}</h1>
        <p className="mt-2 text-sm text-zinc-500">{message}</p>
      </div>
    </div>
  );
}

export default async function QuestionnairePage({ params }) {
  const { token } = await params;
  const data = await loadQuestionnaire(token);

  if (data.error === 'NOT_FOUND') return <ErrorPage title="링크를 찾을 수 없습니다" message="잘못된 주소이거나 삭제된 링크입니다." />;
  if (data.error === 'REVOKED') return <ErrorPage title="폐기된 링크입니다" message="이 링크는 담당자가 폐기했습니다. 새 링크를 요청해 주세요." />;
  if (data.error === 'EXPIRED') return <ErrorPage title="만료된 링크입니다" message="유효 기간이 지난 링크입니다. 새 링크를 요청해 주세요." />;

  return <QuestionnaireForm token={token} prospect={data.prospect} info={data.info || {}} answers={data.answers || {}} />;
}