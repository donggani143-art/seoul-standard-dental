/**
 * MCP 원격(웹/모바일) OAuth 2.1 프로바이더
 *
 * 사용자가 "플랫폼 관리자 계정"으로 로그인하면, 그 계정 역할(super_admin/hospital_admin)로 MCP가 동작한다.
 * - 인가 시 로그인 폼 표시 → 플랫폼 /admin/login으로 자격 검증 → 인가코드 발급
 * - 토큰에는 사용자의 플랫폼 세션 쿠키·역할을 묶어, MCP가 그 사용자로서 플랫폼 API를 호출
 *
 * 저장소: 별도 SQLite 파일(운영 DB와 분리, 기본 ./mcp-oauth.db). 클라이언트(DCR)·토큰·리프레시를
 * 영속화하여 서버 재시작에도 재로그인이 필요 없다. 단명(短命)인 pending/code 는 인메모리.
 * PKCE 는 SDK 가 검증.
 */
import { randomBytes } from 'node:crypto';
import { DatabaseSync } from 'node:sqlite';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const SESSION_COOKIE = 'wonju_admin_session';
const rid = (n = 24) => randomBytes(n).toString('base64url');
const now = () => Date.now();

export async function platformLogin(platformUrl, email, password) {
  const res = await fetch(`${platformUrl}/admin/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'x-requested-with': 'XMLHttpRequest' },
    body: new URLSearchParams({ email, password }),
    redirect: 'manual',
  });
  const setC = typeof res.headers.getSetCookie === 'function' ? res.headers.getSetCookie() : [];
  const sess = setC.map((c) => c.split(';')[0]).find((c) => c.startsWith(`${SESSION_COOKIE}=`));
  if (!sess || sess.split('=').slice(1).join('=').trim().length < 8) return null;
  const me = await fetch(`${platformUrl}/api/admin/me`, { headers: { Accept: 'application/json', Cookie: sess } });
  if (!me.ok) return null;
  const j = await me.json();
  return { cookie: sess, account: j.account || j };
}

function loginForm(pendingId, errorMsg) {
  return `<!DOCTYPE html><html lang="ko"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>METALINK CMS 연결</title>
<style>body{font-family:system-ui,'Pretendard',sans-serif;background:#f5f3f0;display:flex;min-height:100vh;align-items:center;justify-content:center;margin:0}
.box{background:#fff;border:1px solid #e6e3df;border-radius:16px;padding:32px;width:min(92vw,380px);box-shadow:0 8px 30px rgba(0,0,0,.08)}
h1{font-size:19px;margin:0 0 6px;color:#1a1a1a}p.sub{color:#777;font-size:13px;line-height:1.6;margin:0 0 18px}
label{display:block;font-size:13px;font-weight:700;margin:12px 0 5px;color:#444}
input{width:100%;box-sizing:border-box;padding:11px 12px;border:1px solid #ddd;border-radius:9px;font-size:15px;outline:none}
input:focus{border-color:#1a8f5e}button{width:100%;margin-top:18px;padding:12px;background:#1a8f5e;color:#fff;border:0;border-radius:9px;font-weight:800;font-size:15px;cursor:pointer}
.err{color:#dc2626;font-size:13px;margin-top:12px}</style></head>
<body><form class="box" method="post" action="/oauth/login">
<h1>METALINK CMS 연결</h1>
<p class="sub">Claude에 연결하려면 관리자 계정으로 로그인하세요.<br/>계정 역할(슈퍼어드민/업체어드민)에 따라 권한이 부여됩니다.</p>
<input type="hidden" name="pending" value="${pendingId}">
<label>이메일</label><input name="email" type="email" required autofocus autocomplete="username">
<label>비밀번호</label><input name="password" type="password" required autocomplete="current-password">
${errorMsg ? `<p class="err">${errorMsg}</p>` : ''}
<button type="submit">로그인하고 연결</button></form></body></html>`;
}

// ── SQLite 영속 저장소 (운영 DB와 분리된 별도 파일) ──────────────────────────
function openStore(dbPath) {
  const here = dirname(fileURLToPath(import.meta.url));
  const file = resolve(here, dbPath || process.env.MCP_DB || 'mcp-oauth.db');
  const db = new DatabaseSync(file);
  db.exec(`
    CREATE TABLE IF NOT EXISTS oauth_clients (client_id TEXT PRIMARY KEY, data TEXT NOT NULL, issued_at INTEGER);
    CREATE TABLE IF NOT EXISTS oauth_tokens (token TEXT PRIMARY KEY, client_id TEXT, account TEXT, cookie TEXT, role TEXT, exp INTEGER);
    CREATE TABLE IF NOT EXISTS oauth_refreshes (token TEXT PRIMARY KEY, client_id TEXT, account TEXT, cookie TEXT, role TEXT);
  `);
  return { db, file };
}

export function createOAuth(platformUrl, dbPath) {
  const { db, file } = openStore(dbPath);
  process.stderr.write(`[metalink-cms-mcp] OAuth 저장소: ${file}\n`);

  // prepared statements
  const qClientGet = db.prepare('SELECT data FROM oauth_clients WHERE client_id = ?');
  const qClientIns = db.prepare('INSERT INTO oauth_clients (client_id, data, issued_at) VALUES (?, ?, ?)');
  const qTokIns = db.prepare('INSERT OR REPLACE INTO oauth_tokens (token, client_id, account, cookie, role, exp) VALUES (?, ?, ?, ?, ?, ?)');
  const qTokGet = db.prepare('SELECT client_id, account, cookie, role, exp FROM oauth_tokens WHERE token = ?');
  const qTokDelExp = db.prepare('DELETE FROM oauth_tokens WHERE exp < ?');
  const qRefIns = db.prepare('INSERT OR REPLACE INTO oauth_refreshes (token, client_id, account, cookie, role) VALUES (?, ?, ?, ?, ?)');
  const qRefGet = db.prepare('SELECT client_id, account, cookie, role FROM oauth_refreshes WHERE token = ?');

  // 단명(短命) 항목은 인메모리: 인가 진행 중 pending(10분)·인가코드(5분)
  const pendings = new Map();
  const codes = new Map();
  const TOKEN_TTL = 60 * 60 * 1000; // 1h

  function gc() {
    for (const [k, v] of pendings) if (v.exp < now()) pendings.delete(k);
    for (const [k, v] of codes) if (v.exp < now()) codes.delete(k);
    qTokDelExp.run(now());
  }

  const clientsStore = {
    async getClient(id) {
      const row = qClientGet.get(id);
      return row ? JSON.parse(row.data) : undefined;
    },
    async registerClient(client) {
      const full = { ...client, client_id: 'mcp_' + rid(12), client_id_issued_at: Math.floor(now() / 1000) };
      qClientIns.run(full.client_id, JSON.stringify(full), full.client_id_issued_at);
      return full;
    },
  };

  function issueAccess(clientId, account, cookie, role) {
    const access_token = rid(32);
    qTokIns.run(access_token, clientId, JSON.stringify(account), cookie, role, now() + TOKEN_TTL);
    return access_token;
  }

  const provider = {
    get clientsStore() { return clientsStore; },

    async authorize(client, params, res) {
      gc();
      const pendingId = rid(18);
      pendings.set(pendingId, { clientId: client.client_id, params, exp: now() + 10 * 60 * 1000 });
      res.set('Content-Type', 'text/html; charset=utf-8').send(loginForm(pendingId));
    },

    async challengeForAuthorizationCode(client, code) {
      const c = codes.get(code);
      if (!c || c.clientId !== client.client_id) throw new Error('invalid_grant');
      return c.codeChallenge;
    },

    async exchangeAuthorizationCode(client, code) {
      const c = codes.get(code);
      if (!c || c.clientId !== client.client_id || c.exp < now()) throw new Error('invalid_grant');
      codes.delete(code);
      const role = c.account.role || 'hospital_admin';
      const access_token = issueAccess(client.client_id, c.account, c.cookie, role);
      const refresh_token = rid(32);
      qRefIns.run(refresh_token, client.client_id, JSON.stringify(c.account), c.cookie, role);
      return { access_token, token_type: 'bearer', expires_in: TOKEN_TTL / 1000, refresh_token, scope: 'mcp' };
    },

    async exchangeRefreshToken(client, refresh_token) {
      const r = qRefGet.get(refresh_token);
      if (!r || r.client_id !== client.client_id) throw new Error('invalid_grant');
      const access_token = issueAccess(client.client_id, JSON.parse(r.account), r.cookie, r.role);
      return { access_token, token_type: 'bearer', expires_in: TOKEN_TTL / 1000, refresh_token, scope: 'mcp' };
    },

    async verifyAccessToken(token) {
      const t = qTokGet.get(token);
      if (!t || t.exp < now()) throw new Error('invalid_token');
      return { token, clientId: t.client_id, scopes: ['mcp'], expiresAt: Math.floor(t.exp / 1000), extra: { role: t.role, account: JSON.parse(t.account), cookie: t.cookie } };
    },
  };

  // 로그인 폼 제출 처리 → 자격 검증 → 인가코드 발급 → redirect_uri 로 리다이렉트
  async function handleLogin(req, res) {
    const { pending, email, password } = req.body || {};
    const p = pendings.get(pending);
    if (!p) { res.status(400).send('만료되었거나 잘못된 요청입니다. 처음부터 다시 시도해 주세요.'); return; }
    const auth = await platformLogin(platformUrl, String(email || ''), String(password || ''));
    if (!auth) { res.set('Content-Type', 'text/html; charset=utf-8').send(loginForm(pending, '로그인 실패 — 이메일/비밀번호를 확인하세요.')); return; }
    pendings.delete(pending);
    const code = rid(24);
    codes.set(code, { clientId: p.clientId, codeChallenge: p.params.codeChallenge, redirectUri: p.params.redirectUri, account: auth.account, cookie: auth.cookie, exp: now() + 5 * 60 * 1000 });
    const u = new URL(p.params.redirectUri);
    u.searchParams.set('code', code);
    if (p.params.state) u.searchParams.set('state', p.params.state);
    res.redirect(u.toString());
  }

  return { provider, handleLogin };
}