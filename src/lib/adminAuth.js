import crypto from 'crypto';
import { getLegacyAdminPassword } from '@/lib/platform';

export const ADMIN_SESSION_COOKIE = 'wonju_admin_session';
export const ADMIN_IMPERSONATE_COOKIE = 'wonju_admin_impersonate';

const SESSION_SECRET = (() => {
  const secret = process.env.ADMIN_SESSION_SECRET || process.env.ADMIN_PASSWORD;
  if (!secret && process.env.NODE_ENV === 'production') {
    // eslint-disable-next-line no-console
    console.warn('[adminAuth] ADMIN_SESSION_SECRET is not set — using insecure fallback. Set this env var on the server.');
  }
  return secret || 'wonju-admin-session-secret';
})();
const SESSION_MAX_AGE_SECONDS = 60 * 60 * 12;
const ADMIN_API_TOKEN =
  process.env.ADMIN_API_TOKEN ||
  process.env.REST_API_TOKEN ||
  process.env.BOARD_API_TOKEN ||
  process.env.ADMIN_PASSWORD ||
  '';

function encodeBase64Url(value) {
  return Buffer.from(value).toString('base64url');
}

function decodeBase64Url(value) {
  return Buffer.from(String(value || ''), 'base64url').toString('utf8');
}

function signPayload(encodedPayload) {
  return crypto.createHmac('sha256', SESSION_SECRET).update(encodedPayload).digest('base64url');
}

function timingSafeMatch(left, right) {
  const leftBuffer = Buffer.from(String(left || ''));
  const rightBuffer = Buffer.from(String(right || ''));

  if (!leftBuffer.length || leftBuffer.length !== rightBuffer.length) {
    return false;
  }

  return crypto.timingSafeEqual(leftBuffer, rightBuffer);
}

function getRequestAdminApiToken(request) {
  const authorization = request.headers.get('authorization') || '';

  if (authorization.toLowerCase().startsWith('bearer ')) {
    return authorization.slice(7).trim();
  }

  return (
    request.headers.get('x-api-key') ||
    request.headers.get('x-admin-token') ||
    request.headers.get('x-board-token') ||
    ''
  ).trim();
}

export function verifyAdminPassword(password) {
  return String(password || '') === getLegacyAdminPassword();
}

export function createAdminSessionToken(account) {
  const expiresAt = Date.now() + SESSION_MAX_AGE_SECONDS * 1000;
  const payload = {
    aid: account.id,
    email: account.email,
    name: account.display_name,
    role: account.role,
    hid: account.hospital_id ?? null,
    legacyCms: Boolean(account.legacyCms),
    exp: expiresAt,
  };
  const encodedPayload = encodeBase64Url(JSON.stringify(payload));
  const signature = signPayload(encodedPayload);

  return `${encodedPayload}.${signature}`;
}

function decodeAdminSessionToken(token) {
  const [encodedPayload, signature] = String(token || '').split('.');

  if (!encodedPayload || !signature) {
    return null;
  }

  const expectedSignature = signPayload(encodedPayload);
  const actualBuffer = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expectedSignature);

  if (actualBuffer.length !== expectedBuffer.length) {
    return null;
  }

  if (!crypto.timingSafeEqual(actualBuffer, expectedBuffer)) {
    return null;
  }

  try {
    const payload = JSON.parse(decodeBase64Url(encodedPayload));

    if (!payload?.aid || !payload?.role || !payload?.exp || payload.exp < Date.now()) {
      return null;
    }

    return {
      accountId: payload.aid,
      email: payload.email,
      displayName: payload.name,
      role: payload.role,
      hospitalId: payload.hid,
      legacyCms: Boolean(payload.legacyCms),
      expiresAt: payload.exp,
    };
  } catch {
    return null;
  }
}

function parseImpersonateId(raw) {
  const n = Number(raw);
  return Number.isFinite(n) && n > 0 ? n : null;
}

function enrichWithImpersonation(session, impersonateRaw) {
  if (!session) return session;
  if (session.role !== 'super_admin') return session;
  const impersonateHospitalId = parseImpersonateId(impersonateRaw);
  if (!impersonateHospitalId) return session;
  return { ...session, impersonateHospitalId };
}

export function getAdminSessionFromCookieStore(cookieStore) {
  const session = decodeAdminSessionToken(cookieStore.get(ADMIN_SESSION_COOKIE)?.value);
  return enrichWithImpersonation(session, cookieStore.get(ADMIN_IMPERSONATE_COOKIE)?.value);
}

export function getAdminRequestSession(request) {
  const session = decodeAdminSessionToken(request.cookies.get(ADMIN_SESSION_COOKIE)?.value);
  return enrichWithImpersonation(session, request.cookies.get(ADMIN_IMPERSONATE_COOKIE)?.value);
}

// Hospital-scoped APIs의 표준 스코프 해석기
// - 일반 병원 관리자: 자신의 hospital_id
// - 슈퍼관리자(임퍼스네이션 중): 임퍼스네이션 대상 hospital_id
// - 슈퍼관리자(임퍼스네이션 없음): null (전체 조회)
export function getScopedHospitalId(session) {
  if (!session) return null;
  if (session.role === 'super_admin') {
    return session.impersonateHospitalId ?? null;
  }
  return session.hospitalId ?? null;
}

export function isAdminAuthenticated(cookieStore) {
  return Boolean(getAdminSessionFromCookieStore(cookieStore));
}

export function isAdminRequest(request) {
  const session = getAdminRequestSession(request);
  return Boolean(session?.legacyCms);
}

export function isAdminApiRequest(request) {
  if (isAdminRequest(request)) {
    return true;
  }

  if (!ADMIN_API_TOKEN) {
    return false;
  }

  const requestToken = getRequestAdminApiToken(request);
  return timingSafeMatch(requestToken, ADMIN_API_TOKEN);
}

export function canAccessSuperAdmin(session) {
  return session?.role === 'super_admin';
}

export function getAdminCookieOptions(request) {
  const forwardedProto = request.headers.get('x-forwarded-proto') || '';
  const siteUrl = process.env.SITE_URL || process.env.NEXT_PUBLIC_SITE_URL || '';

  return {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production' && (forwardedProto === 'https' || siteUrl.startsWith('https://')),
    path: '/',
    maxAge: SESSION_MAX_AGE_SECONDS,
  };
}
