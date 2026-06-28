import crypto from 'crypto';

// 영업관리 계정정보 암호화 — AES-256-GCM
// 키: SALES_CRED_SECRET 환경변수 (32바이트 권장)
// 형식: base64(iv).base64(authTag).base64(ciphertext)

const ALGO = 'aes-256-gcm';
const IV_LEN = 12;

function getKey() {
  const raw = process.env.SALES_CRED_SECRET || '';
  if (!raw) return null;
  // 임의 길이 시크릿을 SHA-256으로 32바이트 키로 정규화
  return crypto.createHash('sha256').update(raw, 'utf8').digest();
}

export function isSalesCryptoReady() {
  return Boolean(process.env.SALES_CRED_SECRET);
}

export function encryptSecret(plaintext) {
  const key = getKey();
  if (!key) throw new Error('SALES_CRED_SECRET 환경변수가 설정되지 않았습니다. 영업관리 계정정보는 암호화 키 없이 저장할 수 없습니다.');
  const text = String(plaintext ?? '');
  if (!text) return '';
  const iv = crypto.randomBytes(IV_LEN);
  const cipher = crypto.createCipheriv(ALGO, key, iv);
  const ct = Buffer.concat([cipher.update(text, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `${iv.toString('base64')}.${tag.toString('base64')}.${ct.toString('base64')}`;
}

export function decryptSecret(payload) {
  const key = getKey();
  if (!key) throw new Error('SALES_CRED_SECRET 환경변수가 설정되지 않았습니다.');
  const text = String(payload ?? '');
  if (!text) return '';
  const parts = text.split('.');
  if (parts.length !== 3) {
    // 형식이 맞지 않으면 마이그레이션 전 평문일 가능성 — 그대로 반환하지 않고 빈값 처리(안전)
    return '';
  }
  const [ivB64, tagB64, ctB64] = parts;
  try {
    const decipher = crypto.createDecipheriv(ALGO, key, Buffer.from(ivB64, 'base64'));
    decipher.setAuthTag(Buffer.from(tagB64, 'base64'));
    const pt = Buffer.concat([decipher.update(Buffer.from(ctB64, 'base64')), decipher.final()]);
    return pt.toString('utf8');
  } catch {
    return '';
  }
}

export function maskSecret(payload) {
  // 저장된 암호화 페이로드 존재 여부만 반환 (UI 표시용)
  return payload ? '••••••••' : '';
}
