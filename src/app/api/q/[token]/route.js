import { NextResponse } from 'next/server';
import { loadQuestionnaire, saveQuestionnaire, saveQuestionnaireDraft } from '@/lib/salesShare';

export const dynamic = 'force-dynamic';

function statusFor(error) {
  return error === 'NOT_FOUND' ? 404 : 403;
}

// GET — 토큰 검증 + 거래처명/기존 입력값 반환 (질문지 프리필용, 공개)
export async function GET(request, { params }) {
  const { token } = await params;
  try {
    const r = await loadQuestionnaire(token);
    if (r.error) return NextResponse.json({ error: r.error }, { status: statusFor(r.error) });
    return NextResponse.json(r);
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

// POST — 질문지 답변 제출 → 영업관리 데이터 동기화 (공개, 토큰이 인증 역할)
export async function POST(request, { params }) {
  const { token } = await params;
  try {
    const body = await request.json().catch(() => ({}));
    // 임시저장(초안): answers_json만 보존 (제출 전까지 입력값 유지)
    if (body && body.draft) {
      const r = await saveQuestionnaireDraft(token, body.answers || {});
      if (r.error) return NextResponse.json({ error: r.error }, { status: statusFor(r.error) });
      return NextResponse.json(r);
    }
    const r = await saveQuestionnaire(token, body);
    if (r.error) return NextResponse.json({ error: r.error }, { status: statusFor(r.error) });
    return NextResponse.json(r);
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}