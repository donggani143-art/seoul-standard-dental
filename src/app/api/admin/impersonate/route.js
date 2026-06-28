import { NextResponse } from 'next/server';
import { ADMIN_IMPERSONATE_COOKIE, canAccessSuperAdmin, getAdminRequestSession } from '@/lib/adminAuth';

function makeRedirect(request, path) {
  const host = request.headers.get('x-forwarded-host') || request.headers.get('host') || new URL(request.url).host;
  const proto = request.headers.get('x-forwarded-proto') || (request.url.startsWith('https') ? 'https' : 'http');
  const url = new URL(path, `${proto}://${host}`);
  return NextResponse.redirect(url);
}

export async function GET(request) {
  const session = getAdminRequestSession(request);
  if (!canAccessSuperAdmin(session)) {
    return NextResponse.json({ error: '슈퍼관리자 권한이 필요합니다.' }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const rawId = searchParams.get('hospitalId');
  const clear = searchParams.get('clear') === '1';
  const redirectTo = searchParams.get('redirect') || '/admin?module=dashboard';

  const cookieOptions = {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
  };

  if (clear || !rawId) {
    const response = makeRedirect(request, '/admin?module=hospitals');
    response.cookies.set(ADMIN_IMPERSONATE_COOKIE, '', { ...cookieOptions, maxAge: 0 });
    return response;
  }

  const hospitalId = Number(rawId);
  if (!Number.isFinite(hospitalId) || hospitalId <= 0) {
    return NextResponse.json({ error: 'hospitalId가 필요합니다.' }, { status: 400 });
  }

  const response = makeRedirect(request, redirectTo);
  response.cookies.set(ADMIN_IMPERSONATE_COOKIE, String(hospitalId), {
    ...cookieOptions,
    maxAge: 60 * 60 * 12,
  });
  return response;
}
