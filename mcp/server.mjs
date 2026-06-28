#!/usr/bin/env node
/**
 * METALINK CMS — MCP 서버 (듀얼 트랜스포트)
 *
 * 권한은 "연결한 플랫폼 계정의 역할"로 결정된다 (super_admin / hospital_admin / reseller).
 *  - 데스크톱(Claude Desktop): stdio. ADMIN_EMAIL/ADMIN_PASSWORD 환경변수 계정으로 동작.
 *  - 웹/모바일(claude.ai 커스텀 커넥터): Streamable HTTP + OAuth. 사용자가 직접 로그인 → 그 계정 역할로 동작.
 *
 * 환경변수:
 *   PLATFORM_URL     플랫폼 주소 (기본 https://metacms.kr)
 *   MCP_PORT         설정 시 HTTP(원격/OAuth) 모드. 미설정 시 stdio(데스크톱).
 *   MCP_PUBLIC_URL   HTTP 모드의 공개 주소 (OAuth issuer, 기본 https://mcp.metacms.kr)
 *   ADMIN_EMAIL/ADMIN_PASSWORD  stdio 모드에서 사용할 계정 (HTTP 모드에선 불필요)
 */
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { isInitializeRequest } from '@modelcontextprotocol/sdk/types.js';
import { mcpAuthRouter } from '@modelcontextprotocol/sdk/server/auth/router.js';
import { requireBearerAuth } from '@modelcontextprotocol/sdk/server/auth/middleware/bearerAuth.js';
import { randomUUID } from 'node:crypto';
import { z } from 'zod';
import express from 'express';
import { createOAuth, platformLogin } from './oauth.mjs';

const PLATFORM_URL = (process.env.PLATFORM_URL || 'https://metacms.kr').replace(/\/+$/, '');
const MCP_PORT = process.env.MCP_PORT ? Number(process.env.MCP_PORT) : null;
const PUBLIC_URL = (process.env.MCP_PUBLIC_URL || 'https://mcp.metacms.kr').replace(/\/+$/, '');
// 슈퍼어드민이 특정 업체를 대상으로 지정할 때 쓰는 임퍼소네이션 쿠키 (플랫폼이 세션을 이 값으로 스코프)
const IMPERSONATE_COOKIE = 'wonju_admin_impersonate';

// ── 사용자별 플랫폼 API 클라이언트 (쿠키 보유) ───────────────────────────────
function makeApi(cookieRef, relogin) {
  return async function api(path, { method = 'GET', json, query, retry = true, impersonate } = {}) {
    if (!cookieRef.value && relogin) await relogin();
    const url = new URL(`${PLATFORM_URL}${path}`);
    if (query) for (const [k, v] of Object.entries(query)) if (v != null && v !== '') url.searchParams.set(k, String(v));
    const cookie = impersonate ? `${cookieRef.value}; ${IMPERSONATE_COOKIE}=${impersonate}` : cookieRef.value;
    const headers = { Accept: 'application/json', Cookie: cookie };
    if (json !== undefined) headers['Content-Type'] = 'application/json';
    const res = await fetch(url, { method, headers, body: json !== undefined ? JSON.stringify(json) : undefined });
    if (res.status === 401 && retry && relogin) { cookieRef.value = ''; await relogin(); return api(path, { method, json, query, impersonate, retry: false }); }
    if (res.status === 401) throw new Error('세션이 만료되었습니다. 다시 연결(로그인)해 주세요.');
    const text = await res.text();
    let data; try { data = text ? JSON.parse(text) : {}; } catch { data = { raw: text }; }
    if (!res.ok || (data && data.error)) throw new Error(`${method} ${path} → ${res.status}: ${((data && data.error) || text || '').toString().slice(0, 120)}`);
    return data;
  };
}

const ok = (d) => ({ content: [{ type: 'text', text: typeof d === 'string' ? d : JSON.stringify(d, null, 2) }] });
const fail = (e) => ({ content: [{ type: 'text', text: `오류: ${e.message || String(e)}` }], isError: true });
const wrap = (fn) => async (args) => { try { return ok(await fn(args || {})); } catch (e) { return fail(e); } };

// ── 도구 등록 (컨텍스트: { api, role, isSuper }) ─────────────────────────────
function reg(server, name, opts, fn) {
  server.registerTool(name, {
    title: opts.title, description: opts.description, inputSchema: opts.input || {},
    annotations: { title: opts.title, readOnlyHint: !!opts.readOnly, destructiveHint: false, openWorldHint: true },
  }, wrap(fn));
}

function buildServer(ctx) {
  const { api, isSuper } = ctx;
  const server = new McpServer({ name: 'metalink-cms', version: '1.0.0' });

  // 업체 대상 지정 — 슈퍼어드민만 노출. 지정 시 impersonate 쿠키로 해당 업체에만 스코프.
  const HID = isSuper ? { hospital_id: z.number().int().optional().describe('대상 업체 id (list_hospitals로 확인). 슈퍼어드민은 업체별 데이터 접근 시 지정 필요. 쓰기 도구는 필수') } : {};
  const imp = (a) => (isSuper && a.hospital_id ? { impersonate: a.hospital_id } : {});
  const requireHid = (a) => { if (isSuper && !a.hospital_id) throw new Error('대상 업체를 지정해야 합니다 — hospital_id 파라미터 필요. 먼저 list_hospitals로 업체 id를 확인하세요. (미지정 시 다른 업체 데이터를 덮어쓸 수 있어 차단합니다.)'); };

  reg(server, 'whoami', { title: '내 권한 확인', readOnly: true, description: '현재 연결된 관리자 계정과 권한(역할·소속 업체)을 확인합니다.' },
    async () => { const a = await api('/api/admin/me').then((r) => r.account || r); return { email: a.email, role: a.role, role_label: a.role === 'super_admin' ? '슈퍼어드민' : (a.role === 'reseller' ? '리셀러' : '업체어드민'), hospital_id: a.hospital_id ?? null, display_name: a.display_name, platform: PLATFORM_URL }; });

  reg(server, 'list_consultations', { title: '상담 문의 조회', readOnly: true, description: '상담 문의 목록을 조회합니다. (업체어드민: 자기 업체 / 슈퍼: hospital_id 지정 업체)',
    input: { limit: z.number().int().min(1).max(500).optional().describe('최대 개수 (기본 100)'), ...HID } },
    (a) => api('/api/consult', { query: { limit: a.limit || 100 }, ...imp(a) }));

  reg(server, 'list_posts', { title: '게시글 조회', readOnly: true, description: '게시판 글 목록을 조회합니다.',
    input: { type: z.enum(['notice', 'event', 'board', 'all']).optional().describe('게시판 유형 (기본 all)'), groupSlug: z.string().optional().describe("type='board'일 때 커스텀 게시판 슬러그"), ...HID } },
    (a) => api('/api/board', { query: { type: a.type || 'all', groupSlug: a.groupSlug }, ...imp(a) }));

  reg(server, 'create_post', { title: '게시글 발행', readOnly: false, description: '게시글을 발행합니다. (포스팅 자동화) notice/event 또는 커스텀 게시판(board+board_group_id).',
    input: {
      type: z.enum(['notice', 'event', 'board']).describe('게시판 유형'), title: z.string().describe('제목'), content: z.string().describe('본문 (HTML 허용)'),
      board_group_id: z.number().int().optional().describe("type='board'일 때 대상 게시판 그룹 id"),
      is_published: z.boolean().optional().describe('발행 여부 (기본 true)'),
      ...HID,
    } },
    (a) => { requireHid(a); return api('/api/board', { method: 'POST', json: { type: a.type, title: a.title, content: a.content, board_group_id: a.board_group_id ?? null, is_published: a.is_published === false ? 0 : 1, ...(isSuper && a.hospital_id ? { hospital_id: a.hospital_id } : {}) }, ...imp(a) }); });

  reg(server, 'list_board_groups', { title: '게시판 그룹 조회', readOnly: true, description: '커스텀 게시판(그룹) 목록을 조회합니다.', input: { ...HID } },
    (a) => api('/api/board-group', { ...imp(a) }));

  reg(server, 'create_board_group', { title: '게시판 그룹 생성', readOnly: false, description: '커스텀 게시판(그룹)을 생성합니다. 목록/상세 페이지가 자동 생성됩니다.',
    input: { name: z.string(), slug: z.string().describe('영문 슬러그 (URL: /community/{slug})'), description: z.string().optional(), ...HID } },
    (a) => { requireHid(a); return api('/api/board-group', { method: 'POST', json: { name: a.name, slug: a.slug, description: a.description || '' }, ...imp(a) }); });

  reg(server, 'list_pages', { title: '페이지 조회', readOnly: true, description: '사이트 페이지 목록을 조회합니다. (슬러그 지정 시 해당 페이지 내용)',
    input: { slug: z.string().optional().describe('특정 페이지 슬러그 (예: main, faq, care-implant)'), ...HID } },
    (a) => api('/api/pages', { query: { slug: a.slug }, ...imp(a) }));

  reg(server, 'update_page', { title: '페이지 수정', readOnly: false, description: '페이지 내용을 부분 수정합니다. (지정 필드만 변경, 나머지 보존)',
    input: { slug: z.string().describe('수정할 페이지 슬러그'), title: z.string().optional(), content: z.string().optional(), custom_css: z.string().optional(), custom_js: z.string().optional(), meta_title: z.string().optional(), meta_description: z.string().optional(), is_published: z.boolean().optional(), ...HID } },
    async (a) => {
      requireHid(a);
      const scope = imp(a);
      const rows = await api('/api/pages', { query: { slug: a.slug }, ...scope });
      const list = Array.isArray(rows) ? rows : (rows && rows.pages) || [];
      const cur = list.find((p) => p.slug === a.slug) || list[0];
      if (!cur) throw new Error(`'${a.slug}' 페이지를 찾을 수 없습니다.`);
      return api('/api/pages', { method: 'PUT', json: { id: cur.id, slug: cur.slug, title: a.title ?? cur.title, content: a.content ?? cur.content, custom_css: a.custom_css ?? cur.custom_css, custom_js: a.custom_js ?? cur.custom_js, meta_title: a.meta_title ?? cur.meta_title, meta_description: a.meta_description ?? cur.meta_description, is_published: a.is_published ?? (cur.is_published !== 0), sort_order: cur.sort_order, page_type: cur.page_type }, ...scope });
    });

  reg(server, 'get_seo_settings', { title: 'SEO·GEO 조회', readOnly: true, description: '병원 SEO·GEO 정보를 조회합니다.', input: { ...HID } },
    (a) => api('/api/settings', { ...imp(a) }));

  if (isSuper) {
    reg(server, 'list_hospitals', { title: '[슈퍼] 업체 조회', readOnly: true, description: '전체 업체(병원) 목록을 조회합니다.' }, () => api('/api/admin/hospitals'));
    reg(server, 'create_hospital', { title: '[슈퍼] 업체 생성', readOnly: false, description: '신규 업체를 생성합니다. 템플릿(light/basic) 기본 페이지가 자동 생성됩니다.',
      input: { name: z.string(), slug: z.string().describe('서브도메인: {slug}.metacms.kr'), template: z.enum(['light', 'basic']).optional() } },
      (a) => api('/api/admin/hospitals', { method: 'POST', json: { name: a.name, slug: a.slug, template: a.template || 'light' } }));
    reg(server, 'list_accounts', { title: '[슈퍼] 계정 조회', readOnly: true, description: '관리자 계정 목록을 조회합니다.' }, () => api('/api/admin/accounts'));
    reg(server, 'create_account', { title: '[슈퍼] 계정 생성', readOnly: false, description: '관리자 계정을 생성합니다.',
      input: { email: z.string(), displayName: z.string(), password: z.string(), role: z.enum(['hospital_admin', 'reseller', 'super_admin']), hospitalId: z.number().int().optional() } },
      (a) => api('/api/admin/accounts', { method: 'POST', json: { email: a.email, displayName: a.displayName, password: a.password, role: a.role, hospitalId: a.role === 'hospital_admin' ? (a.hospitalId ?? null) : null } }));
    reg(server, 'list_activity_logs', { title: '[슈퍼] 활동 로그', readOnly: true, description: '관리자 활동 로그를 조회합니다.' }, () => api('/api/admin/logs'));
    reg(server, 'get_analytics', { title: '[슈퍼] 방문 통계', readOnly: true, description: '방문 통계를 조회합니다.' }, () => api('/api/analytics/stats'));
  }
  return server;
}

// ════════════ HTTP(원격/OAuth) 모드 ════════════
if (MCP_PORT) {
  const { provider, handleLogin } = createOAuth(PLATFORM_URL);
  const app = express();
  app.use(express.json({ limit: '4mb' }));
  app.use(express.urlencoded({ extended: true }));

  app.post('/oauth/login', handleLogin);
  app.use(mcpAuthRouter({
    provider,
    issuerUrl: new URL(PUBLIC_URL),
    resourceServerUrl: new URL(`${PUBLIC_URL}/mcp`),
    scopesSupported: ['mcp'],
    resourceName: 'METALINK CMS',
  }));

  const bearer = requireBearerAuth({ verifier: provider, resourceMetadataUrl: `${PUBLIC_URL}/.well-known/oauth-protected-resource/mcp` });
  const transports = {};

  app.post('/mcp', bearer, async (req, res) => {
    try {
      const sid = req.headers['mcp-session-id'];
      let transport = sid && transports[sid];
      if (!transport && !sid && isInitializeRequest(req.body)) {
        const ext = req.auth?.extra || {};
        const cookieRef = { value: ext.cookie || '' };
        const ctx = { api: makeApi(cookieRef, null), role: ext.role || 'hospital_admin', isSuper: ext.role === 'super_admin' };
        transport = new StreamableHTTPServerTransport({ sessionIdGenerator: () => randomUUID(), onsessioninitialized: (id) => { transports[id] = transport; } });
        transport.onclose = () => { if (transport.sessionId) delete transports[transport.sessionId]; };
        await buildServer(ctx).connect(transport);
      } else if (!transport) {
        return res.status(400).json({ jsonrpc: '2.0', error: { code: -32000, message: 'Bad Request: 유효한 세션이 없습니다.' }, id: null });
      }
      await transport.handleRequest(req, res, req.body);
    } catch (e) {
      if (!res.headersSent) res.status(500).json({ jsonrpc: '2.0', error: { code: -32603, message: e.message }, id: null });
    }
  });

  const sessionReq = async (req, res) => {
    const sid = req.headers['mcp-session-id'];
    if (!sid || !transports[sid]) return res.status(400).send('유효한 세션이 없습니다.');
    await transports[sid].handleRequest(req, res);
  };
  app.get('/mcp', bearer, sessionReq);
  app.delete('/mcp', bearer, sessionReq);
  app.get('/health', (req, res) => res.json({ ok: true, mode: 'http-oauth', issuer: PUBLIC_URL }));

  app.listen(MCP_PORT, '127.0.0.1', () => process.stderr.write(`[metalink-cms-mcp] HTTP/OAuth 리스닝 127.0.0.1:${MCP_PORT} (issuer ${PUBLIC_URL})\n`));
} else {
  // ════════════ stdio(데스크톱) 모드 ════════════
  const ADMIN_EMAIL = process.env.ADMIN_EMAIL || '';
  const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || '';
  if (!ADMIN_EMAIL || !ADMIN_PASSWORD) { process.stderr.write('[metalink-cms-mcp] stdio 모드: ADMIN_EMAIL/ADMIN_PASSWORD 필요\n'); process.exit(1); }
  const cookieRef = { value: '' };
  let account;
  async function relogin() { const a = await platformLogin(PLATFORM_URL, ADMIN_EMAIL, ADMIN_PASSWORD); if (!a) throw new Error('로그인 실패 — 자격 증명/PLATFORM_URL 확인'); cookieRef.value = a.cookie; account = a.account; return a.account; }
  try { await relogin(); } catch (e) { process.stderr.write(`[metalink-cms-mcp] 초기화 실패: ${e.message}\n`); process.exit(1); }
  const ctx = { api: makeApi(cookieRef, relogin), role: account.role, isSuper: account.role === 'super_admin' };
  await buildServer(ctx).connect(new StdioServerTransport());
  process.stderr.write(`[metalink-cms-mcp] stdio 연결됨 — ${account.email} (${account.role}) @ ${PLATFORM_URL}\n`);
}