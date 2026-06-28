import { NextResponse } from 'next/server';
import {
  ADMIN_SESSION_COOKIE,
  createAdminSessionToken,
  getAdminCookieOptions,
} from '@/lib/adminAuth';
import { authenticateAdminAccount, ensurePlatformSchema } from '@/lib/platform';

const validModules = new Set(['consult', 'board', 'popup', 'seo']);

function getModuleQuery(module) {
  return validModules.has(module) ? `?module=${module}` : '';
}

function getExternalOrigin(request) {
  const siteUrl = process.env.SITE_URL || process.env.NEXT_PUBLIC_SITE_URL || '';

  if (siteUrl) {
    return siteUrl;
  }

  const forwardedProto = request.headers.get('x-forwarded-proto') || 'http';
  const forwardedHost = request.headers.get('x-forwarded-host') || request.headers.get('host') || '';

  if (forwardedHost) {
    return `${forwardedProto}://${forwardedHost}`;
  }

  return request.url;
}

function wantsJsonResponse(request) {
  const requestedWith = request.headers.get('x-requested-with') || '';
  const accept = request.headers.get('accept') || '';
  return requestedWith.toLowerCase() === 'xmlhttprequest' || accept.includes('application/json');
}

export async function POST(request) {
  await ensurePlatformSchema();

  const formData = await request.formData();
  const email = String(formData.get('email') || '');
  const password = String(formData.get('password') || '');
  const requestedModule = String(formData.get('module') || 'consult');
  const moduleQuery = getModuleQuery(requestedModule);
  const origin = getExternalOrigin(request);
  const expectsJson = wantsJsonResponse(request);

  const account = await authenticateAdminAccount(email, password);

  if (!account) {
    if (expectsJson) {
      return NextResponse.json(
        {
          ok: false,
          message: '이메일 또는 비밀번호가 올바르지 않습니다.',
        },
        { status: 200 }
      );
    }

    return NextResponse.redirect(
      new URL(`/admin${moduleQuery}${moduleQuery ? '&' : '?'}error=1`, origin),
      { status: 303 }
    );
  }

  // 모든 계정(슈퍼어드민 + 업체관리자 + 리셀러)에게 CMS 접근 허용
  const legacyCms = true;
  // super_admin → 업체 관리, reseller → 정산, hospital_admin → CMS 대시보드
  let redirectTo;
  if (account.role === 'super_admin') redirectTo = '/admin?module=hospitals';
  else if (account.role === 'reseller') redirectTo = '/admin?module=billing';
  else redirectTo = '/admin?module=dashboard';

  const response = expectsJson
    ? NextResponse.json({
        ok: true,
        redirectTo,
        message: '관리자 페이지로 이동합니다.',
      })
    : NextResponse.redirect(new URL(redirectTo, origin), { status: 303 });

  response.cookies.set(
    ADMIN_SESSION_COOKIE,
    createAdminSessionToken({
      ...account,
      legacyCms,
    }),
    getAdminCookieOptions(request)
  );

  return response;
}
