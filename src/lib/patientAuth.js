import crypto from 'crypto';

export const PATIENT_SESSION_COOKIE = 'patient_session';
const SESSION_SECRET_PREFIX = 'patient:';
const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 30; // 30 days

function getSecret() {
  const base = process.env.ADMIN_SESSION_SECRET || process.env.ADMIN_PASSWORD || 'wonju-patient-secret';
  return SESSION_SECRET_PREFIX + base;
}

function encodeBase64Url(value) {
  return Buffer.from(value).toString('base64url');
}

function decodeBase64Url(value) {
  return Buffer.from(String(value || ''), 'base64url').toString('utf8');
}

function signPayload(encoded) {
  return crypto.createHmac('sha256', getSecret()).update(encoded).digest('base64url');
}

export function createPatientSessionToken(patient) {
  const payload = JSON.stringify({
    id: patient.id,
    email: patient.email,
    name: patient.name,
    hospitalId: patient.hospital_id,
    exp: Date.now() + SESSION_MAX_AGE_SECONDS * 1000,
  });
  const encoded = encodeBase64Url(payload);
  const sig = signPayload(encoded);
  return `${encoded}.${sig}`;
}

export function decodePatientSessionToken(token) {
  if (!token || typeof token !== 'string') return null;
  const [encoded, sig] = token.split('.');
  if (!encoded || !sig) return null;

  const expected = signPayload(encoded);
  const sigBuf = Buffer.from(sig);
  const expBuf = Buffer.from(expected);
  if (sigBuf.length !== expBuf.length || !crypto.timingSafeEqual(sigBuf, expBuf)) return null;

  try {
    const data = JSON.parse(decodeBase64Url(encoded));
    if (data.exp && data.exp < Date.now()) return null;
    return data;
  } catch {
    return null;
  }
}

export function getPatientSession(request) {
  const cookie = request.cookies.get(PATIENT_SESSION_COOKIE)?.value;
  return decodePatientSessionToken(cookie);
}

export function getPatientCookieOptions(request) {
  const isSecure = (request?.headers?.get?.('x-forwarded-proto') || '').includes('https');
  return {
    httpOnly: true,
    secure: isSecure,
    sameSite: 'lax',
    path: '/',
    maxAge: SESSION_MAX_AGE_SECONDS,
  };
}

export async function hashPassword(password) {
  return new Promise((resolve, reject) => {
    const salt = crypto.randomBytes(16).toString('hex');
    crypto.scrypt(password, salt, 64, (err, derived) => {
      if (err) reject(err);
      resolve(`${salt}:${derived.toString('hex')}`);
    });
  });
}

export async function verifyPassword(password, hash) {
  return new Promise((resolve, reject) => {
    const [salt, key] = hash.split(':');
    if (!salt || !key) return resolve(false);
    crypto.scrypt(password, salt, 64, (err, derived) => {
      if (err) reject(err);
      resolve(crypto.timingSafeEqual(Buffer.from(key, 'hex'), derived));
    });
  });
}
