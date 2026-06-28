import { NextResponse } from 'next/server';
import { canAccessSuperAdmin, getAdminRequestSession } from '@/lib/adminAuth';
import { exchangeCodeAndStore, verifyOAuthState } from '@/lib/googleDrive';

export const dynamic = 'force-dynamic';

function publicOrigin(request) {
  const proto = request.headers.get('x-forwarded-proto') || 'https';
  const host = request.headers.get('host');
  return `${proto}://${host}`;
}

function page(title, message, ok) {
  const color = ok ? '#16a34a' : '#dc2626';
  const html = `<!DOCTYPE html><html lang="ko"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${title}</title></head>
<body style="font-family:system-ui,sans-serif;background:#f5f3f0;display:flex;min-height:100vh;align-items:center;justify-content:center;margin:0">
<div style="background:#fff;border:1px solid #e6e3df;border-radius:16px;padding:40px;max-width:420px;text-align:center;box-shadow:0 2px 12px rgba(0,0,0,.06)">
<p style="font-size:44px;margin:0">${ok ? '✅' : '⚠️'}</p>
<h1 style="font-size:18px;color:${color};margin:16px 0 8px">${title}</h1>
<p style="font-size:14px;color:#555;line-height:1.6">${message}</p>
<a href="/admin" style="display:inline-block;margin-top:20px;background:#e8533f;color:#fff;text-decoration:none;padding:10px 20px;border-radius:10px;font-weight:700;font-size:14px">관리자로 돌아가기</a>
</div></body></html>`;
  return new NextResponse(html, { headers: { 'Content-Type': 'text/html; charset=utf-8' } });
}

// 구글 동의 후 콜백 — 인가 코드를 refresh_token으로 교환해 저장
export async function GET(request) {
  const session = getAdminRequestSession(request);
  if (!session) return NextResponse.redirect(new URL('/admin/login', request.url));
  if (!canAccessSuperAdmin(session)) return page('권한 없음', '슈퍼관리자만 구글 드라이브를 연결할 수 있습니다.', false);

  const url = new URL(request.url);
  const error = url.searchParams.get('error');
  const code = url.searchParams.get('code');
  if (error) return page('인증이 취소되었습니다', `구글에서 권한 동의가 취소되었습니다 (${error}).`, false);
  if (!code) return page('오류', '인가 코드를 받지 못했습니다.', false);
  // CSRF 방지: start 에서 발급한 서명 state 검증
  if (!verifyOAuthState(url.searchParams.get('state'))) {
    return page('요청 검증 실패', '잘못되었거나 만료된 요청입니다. 관리자에서 다시 연결을 시도해 주세요.', false);
  }

  try {
    const redirectUri = `${publicOrigin(request)}/api/admin/google-oauth/callback`;
    await exchangeCodeAndStore(code, redirectUri);
    return page('구글 드라이브 연결 완료', '이제 질문지에서 병원이 올린 파일이 이 구글 계정 드라이브의 "거래처명" 폴더로 자동 업로드됩니다.', true);
  } catch (e) {
    return page('연결 실패', e.message, false);
  }
}