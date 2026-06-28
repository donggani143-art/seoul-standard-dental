import { NextResponse } from 'next/server';
import { canAccessSuperAdmin, getAdminRequestSession } from '@/lib/adminAuth';
import { buildAuthUrl, getOAuthClient, signOAuthState } from '@/lib/googleDrive';

export const dynamic = 'force-dynamic';

function publicOrigin(request) {
  const proto = request.headers.get('x-forwarded-proto') || 'https';
  const host = request.headers.get('host');
  return `${proto}://${host}`;
}

// 관리자(운영자)가 본인 구글 계정으로 드라이브 연결을 시작 — 동의 화면으로 이동
export async function GET(request) {
  const session = getAdminRequestSession(request);
  if (!session) return NextResponse.redirect(new URL('/admin/login', request.url));
  // 플랫폼 공용 드라이브 연결은 슈퍼관리자 전용 (병원관리자/리셀러가 탈취 못 하도록)
  if (!canAccessSuperAdmin(session)) return NextResponse.redirect(new URL('/admin', request.url));
  if (!getOAuthClient()) {
    return NextResponse.json({ error: 'GOOGLE_OAUTH_CLIENT_ID/SECRET 환경변수가 설정되지 않았습니다.' }, { status: 503 });
  }
  const redirectUri = `${publicOrigin(request)}/api/admin/google-oauth/callback`;
  return NextResponse.redirect(buildAuthUrl(redirectUri, signOAuthState()));
}