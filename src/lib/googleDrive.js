import crypto from 'crypto';
import { getSetting, setSetting } from '@/lib/appSettings';

// OAuth(사용자 계정) 기반 Google Drive 업로드
// - 파일 소유자 = 인증한 사용자(원장님) → 사용자 저장용량(5TB) 사용
// 환경변수:
//   GOOGLE_OAUTH_CLIENT_ID, GOOGLE_OAUTH_CLIENT_SECRET : OAuth 클라이언트
//   GDRIVE_PARENT_FOLDER_ID : 업로드 부모 폴더 ID
// 갱신토큰(refresh_token)은 app_settings('google_oauth_refresh_token')에 1회 저장됨

const DEFAULT_PARENT = '1jZg8MIRRybNDwzwMlM09ALwqpyQEMMAj';
const REFRESH_KEY = 'google_oauth_refresh_token';
export const OAUTH_SCOPE = 'https://www.googleapis.com/auth/drive';

export function getParentFolderId() {
  return process.env.GDRIVE_PARENT_FOLDER_ID || DEFAULT_PARENT;
}

export function getOAuthClient() {
  const clientId = process.env.GOOGLE_OAUTH_CLIENT_ID || '';
  const clientSecret = process.env.GOOGLE_OAUTH_CLIENT_SECRET || '';
  if (!clientId || !clientSecret) return null;
  return { clientId, clientSecret };
}

// CSRF 방지용 서명 state (stateless): "<ts>.<hmac>", 10분 유효
const OAUTH_STATE_TTL_MS = 10 * 60 * 1000;
function oauthStateSecret() {
  return process.env.ADMIN_SESSION_SECRET || process.env.ADMIN_API_TOKEN || 'wonju-oauth-state-secret';
}
export function signOAuthState() {
  const ts = String(Date.now());
  const sig = crypto.createHmac('sha256', oauthStateSecret()).update(ts).digest('hex');
  return `${ts}.${sig}`;
}
export function verifyOAuthState(state) {
  if (!state || typeof state !== 'string' || !state.includes('.')) return false;
  const [ts, sig] = state.split('.');
  const expected = crypto.createHmac('sha256', oauthStateSecret()).update(String(ts)).digest('hex');
  const a = Buffer.from(sig || '', 'utf8');
  const b = Buffer.from(expected, 'utf8');
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return false;
  const n = Number(ts);
  return Number.isFinite(n) && Date.now() - n >= 0 && Date.now() - n < OAUTH_STATE_TTL_MS;
}

export function buildAuthUrl(redirectUri, state) {
  const c = getOAuthClient();
  if (!c) throw new Error('OAuth 클라이언트가 설정되지 않았습니다.');
  const p = new URLSearchParams({
    client_id: c.clientId,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: OAUTH_SCOPE,
    access_type: 'offline',
    prompt: 'consent',
    include_granted_scopes: 'true',
  });
  if (state) p.set('state', state);
  return `https://accounts.google.com/o/oauth2/v2/auth?${p.toString()}`;
}

// 인가 코드 → refresh_token 교환 후 저장
export async function exchangeCodeAndStore(code, redirectUri) {
  const c = getOAuthClient();
  if (!c) throw new Error('OAuth 클라이언트가 설정되지 않았습니다.');
  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      code,
      client_id: c.clientId,
      client_secret: c.clientSecret,
      redirect_uri: redirectUri,
      grant_type: 'authorization_code',
    }),
  });
  const j = await res.json();
  if (!j.refresh_token) {
    throw new Error(`갱신토큰을 받지 못했습니다: ${j.error_description || j.error || '동의 화면에서 권한을 허용했는지 확인하세요'}`);
  }
  await setSetting(REFRESH_KEY, j.refresh_token);
  return true;
}

export async function hasRefreshToken() {
  const t = await getSetting(REFRESH_KEY);
  return !!t;
}

export async function isDriveReady() {
  return !!getOAuthClient() && (await hasRefreshToken());
}

async function getAccessToken() {
  const c = getOAuthClient();
  if (!c) throw new Error('OAuth 클라이언트가 설정되지 않았습니다.');
  const refresh = await getSetting(REFRESH_KEY);
  if (!refresh) throw new Error('구글 계정 인증이 필요합니다(갱신토큰 없음).');
  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: c.clientId,
      client_secret: c.clientSecret,
      refresh_token: refresh,
      grant_type: 'refresh_token',
    }),
  });
  const j = await res.json();
  if (!j.access_token) {
    // 갱신토큰이 만료/폐기된 경우: 죽은 토큰을 정리해 이후 isDriveReady()가 false 가 되도록 함(재인증 유도)
    if (j.error === 'invalid_grant') {
      try { await setSetting(REFRESH_KEY, ''); } catch { /* noop */ }
      const err = new Error('구글 드라이브 인증이 만료되었습니다. 관리자 재인증이 필요합니다.');
      err.code = 'AUTH_EXPIRED';
      throw err;
    }
    throw new Error(`Drive 인증 실패: ${j.error_description || j.error || 'unknown'}`);
  }
  return j.access_token;
}

// 부모 폴더 아래에서 name 폴더를 찾고, 없으면 생성
export async function findOrCreateFolder(name, parentId, token) {
  const accessToken = token || (await getAccessToken());
  const safeName = String(name || '거래처').replace(/['\\]/g, ' ').trim() || '거래처';
  const q = `mimeType='application/vnd.google-apps.folder' and name='${safeName}' and '${parentId}' in parents and trashed=false`;
  const sr = await fetch(
    `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(q)}&fields=files(id,webViewLink)&supportsAllDrives=true&includeItemsFromAllDrives=true`,
    { headers: { Authorization: `Bearer ${accessToken}` } }
  );
  const sj = await sr.json();
  if (Array.isArray(sj.files) && sj.files.length > 0) {
    return { id: sj.files[0].id, webViewLink: sj.files[0].webViewLink, token: accessToken };
  }
  const cr = await fetch('https://www.googleapis.com/drive/v3/files?fields=id,webViewLink&supportsAllDrives=true', {
    method: 'POST',
    headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: safeName, mimeType: 'application/vnd.google-apps.folder', parents: [parentId] }),
  });
  const cj = await cr.json();
  if (!cj.id) throw new Error(`폴더 생성 실패: ${cj.error?.message || 'unknown'}`);
  return { id: cj.id, webViewLink: cj.webViewLink, token: accessToken };
}

// 브라우저 직접 업로드용 resumable 세션 생성.
// 파일 본문이 앱 서버를 거치지 않으므로 대용량(GB급, 최대 5TB)도 가능.
// origin: 브라우저 Origin — 세션 생성 시 지정해야 이후 브라우저의 PUT에 CORS가 허용됨.
export async function createResumableSession({ folderId, filename, mimeType, fileSize, origin, token }) {
  const accessToken = token || (await getAccessToken());
  const headers = {
    Authorization: `Bearer ${accessToken}`,
    'Content-Type': 'application/json; charset=UTF-8',
    'X-Upload-Content-Type': mimeType || 'application/octet-stream',
  };
  const size = Number(fileSize);
  if (Number.isFinite(size) && size > 0) headers['X-Upload-Content-Length'] = String(size);
  if (origin) headers.Origin = origin;
  const res = await fetch(
    'https://www.googleapis.com/upload/drive/v3/files?uploadType=resumable&fields=id,name,webViewLink&supportsAllDrives=true',
    { method: 'POST', headers, body: JSON.stringify({ name: filename || 'file', parents: [folderId] }) }
  );
  if (!res.ok) {
    let msg = 'unknown';
    try { const j = await res.json(); msg = j.error?.message || msg; } catch { /* */ }
    throw new Error(`업로드 세션 생성 실패: ${msg}`);
  }
  const uploadUrl = res.headers.get('location');
  if (!uploadUrl) throw new Error('업로드 세션 URL을 받지 못했습니다.');
  return uploadUrl;
}

// 폴더에 파일 업로드 (multipart/related)
export async function uploadFileToFolder({ token, folderId, filename, mimeType, buffer }) {
  const boundary = 'mtlk' + crypto.randomBytes(10).toString('hex');
  const meta = JSON.stringify({ name: filename, parents: [folderId] });
  const pre = Buffer.from(
    `--${boundary}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n${meta}\r\n--${boundary}\r\nContent-Type: ${mimeType || 'application/octet-stream'}\r\n\r\n`,
    'utf8'
  );
  const post = Buffer.from(`\r\n--${boundary}--`, 'utf8');
  const body = Buffer.concat([pre, buffer, post]);
  const res = await fetch(
    'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name,webViewLink&supportsAllDrives=true',
    {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': `multipart/related; boundary=${boundary}` },
      body,
    }
  );
  const j = await res.json();
  if (!j.id) throw new Error(`파일 업로드 실패: ${j.error?.message || 'unknown'}`);
  return j;
}