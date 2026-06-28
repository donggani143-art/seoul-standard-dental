import { NextResponse } from 'next/server';
import { PATIENT_SESSION_COOKIE, getPatientCookieOptions } from '@/lib/patientAuth';

function clearAndRespond(request, body) {
  const response = NextResponse.json(body);
  // 로그인 시 사용한 쿠키 옵션과 동일하게 secure/sameSite/path를 맞춰 set 해야 브라우저가 같은 쿠키로 인식하고 삭제됨.
  response.cookies.set(PATIENT_SESSION_COOKIE, '', {
    ...getPatientCookieOptions(request),
    maxAge: 0,
    expires: new Date(0),
  });
  return response;
}

export async function POST(request) {
  return clearAndRespond(request, { ok: true });
}

// 폼 method=GET 또는 단순 링크로 호출되는 경우도 지원
export async function GET(request) {
  return clearAndRespond(request, { ok: true });
}
