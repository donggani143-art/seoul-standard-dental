import { NextResponse } from 'next/server';
import { ADMIN_SESSION_COOKIE, getAdminCookieOptions } from '@/lib/adminAuth';

export async function GET(request) {
  // 현재 요청 호스트를 우선 사용 (복수 admin 도메인 지원 — metacms.kr / metalink3.mycafe24.com 등)
  const proto = request.headers.get('x-forwarded-proto') || 'https';
  const host = request.headers.get('x-forwarded-host') || request.headers.get('host');
  const origin = host
    ? `${proto}://${host}`
    : (process.env.SITE_URL || process.env.NEXT_PUBLIC_SITE_URL || 'https://metacms.kr');
  const response = NextResponse.redirect(new URL('/admin', origin), { status: 303 });

  response.cookies.set(ADMIN_SESSION_COOKIE, '', {
    ...getAdminCookieOptions(request),
    maxAge: 0,
  });

  return response;
}
