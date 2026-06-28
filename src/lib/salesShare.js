import crypto from 'crypto';
import { getDb } from '@/lib/db';
import { ensurePlatformSchema } from '@/lib/platform';
import { encryptSecret, isSalesCryptoReady } from '@/lib/salesCrypto';

export function generateShareToken() {
  // 24바이트 random → 32자 base64url (URL safe)
  return crypto.randomBytes(24).toString('base64url');
}

export async function listProspectShareTokens(prospectId) {
  await ensurePlatformSchema();
  const db = await getDb();
  return db.all(
    `SELECT token, prospect_id, created_by_account_id, expires_at, revoked, last_viewed_at, view_count, created_at
     FROM sales_share_tokens WHERE prospect_id = ? ORDER BY created_at DESC`,
    [prospectId]
  );
}

export async function createShareToken({ prospectId, createdByAccountId, expiresAt = null }) {
  await ensurePlatformSchema();
  const db = await getDb();
  const token = generateShareToken();
  await db.run(
    `INSERT INTO sales_share_tokens (token, prospect_id, created_by_account_id, expires_at)
     VALUES (?, ?, ?, ?)`,
    [token, prospectId, createdByAccountId, expiresAt]
  );
  return token;
}

export async function revokeShareToken(token) {
  await ensurePlatformSchema();
  const db = await getDb();
  const result = await db.run('UPDATE sales_share_tokens SET revoked = 1 WHERE token = ?', [token]);
  return result.changes;
}

// ── 질문지(병원 정보 입력) ──────────────────────────────────────────────────
// 공유 토큰을 재사용한다. 토큰 유효성 검증 후 거래처 기본정보 + 기존 입력값을 반환.
function checkTokenValidity(row) {
  if (!row) return 'NOT_FOUND';
  if (row.revoked) return 'REVOKED';
  if (row.expires_at && new Date(row.expires_at).getTime() < Date.now()) return 'EXPIRED';
  return null;
}

export async function loadQuestionnaire(token) {
  await ensurePlatformSchema();
  const db = await getDb();
  const t = await db.get(
    `SELECT t.token, t.prospect_id, t.revoked, t.expires_at,
            p.name, p.doctor_name, p.phone, p.addr
     FROM sales_share_tokens t
     JOIN sales_prospects p ON p.id = t.prospect_id
     WHERE t.token = ?`,
    [token]
  );
  const err = checkTokenValidity(t);
  if (err) return { error: err };
  const info = (await db.get(
    'SELECT subjects, strengths, refs, memo, multi, maint, seo, aeo, vat, answers_json FROM sales_clinic_info WHERE prospect_id = ?',
    [t.prospect_id]
  )) || {};
  let answers = {};
  try { answers = info.answers_json ? JSON.parse(info.answers_json) : {}; } catch { answers = {}; }
  return {
    prospect: { id: t.prospect_id, name: t.name, doctor_name: t.doctor_name || '', phone: t.phone || '', addr: t.addr || '' },
    info,
    answers,
  };
}

const MULTI_VALUES = new Set(['영문', '중문', '일문', '영·중문', '영·중·일문']);
const VAT_VALUES = new Set(['포함', '별도']);
const CRED_KINDS = ['domain', 'hosting', 'admin', 'ftp'];

// answers_json 저장 시 계정 비밀번호는 평문 보관하지 않음 (암호화본은 sales_credentials)
function redactAnswers(a) {
  let copy;
  try { copy = JSON.parse(JSON.stringify(a || {})); } catch { copy = {}; }
  if (copy && copy.creds && typeof copy.creds === 'object') {
    for (const k of Object.keys(copy.creds)) {
      if (copy.creds[k] && typeof copy.creds[k] === 'object') delete copy.creds[k].account_pw;
    }
  }
  return copy;
}

// 임시저장(초안) — answers_json만 갱신, 확정 동기화/체크리스트/자격증명 변경 없음
export async function saveQuestionnaireDraft(token, answers = {}) {
  await ensurePlatformSchema();
  const db = await getDb();
  const t = await db.get('SELECT prospect_id, revoked, expires_at FROM sales_share_tokens WHERE token = ?', [token]);
  const err = checkTokenValidity(t);
  if (err) return { error: err };
  await db.run(
    `INSERT INTO sales_clinic_info (prospect_id, answers_json)
     VALUES (?, ?)
     ON CONFLICT(prospect_id) DO UPDATE SET answers_json = excluded.answers_json, updated_at = CURRENT_TIMESTAMP`,
    [t.prospect_id, JSON.stringify(redactAnswers(answers))]
  );
  return { success: true };
}

// 질문지 제출 → sales_prospects / sales_clinic_info / sales_credentials / sales_checklist 동기화
export async function saveQuestionnaire(token, answers = {}) {
  await ensurePlatformSchema();
  const db = await getDb();
  const t = await db.get('SELECT prospect_id, revoked, expires_at FROM sales_share_tokens WHERE token = ?', [token]);
  const err = checkTokenValidity(t);
  if (err) return { error: err };
  const pid = t.prospect_id;
  const a = answers || {};

  // 1) 거래처 기본정보(제공된 값만)
  const pFields = [];
  const pVals = [];
  for (const k of ['doctor_name', 'phone', 'addr']) {
    if (typeof a[k] === 'string' && a[k].trim()) { pFields.push(`${k} = ?`); pVals.push(a[k].trim()); }
  }
  if (pFields.length) {
    await db.run(`UPDATE sales_prospects SET ${pFields.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`, [...pVals, pid]);
  }

  // 2) 병원정보(clinic_info) upsert — 정규 컬럼 + 전체 응답 JSON
  const join = (v) => (Array.isArray(v) ? v.filter(Boolean).join(', ') : String(v || ''));
  const clinic = {
    subjects: join(a.subjects),
    strengths: join(a.strengths),
    refs: String(a.refs || ''),
    memo: String(a.memo || ''),
    multi: MULTI_VALUES.has(a.multi) ? a.multi : '',
    maint: a.maint === '신청' ? '신청' : '',
    seo: a.seo === '신청' ? '신청' : '',
    aeo: a.aeo === '신청' ? '신청' : '',
    vat: VAT_VALUES.has(a.vat) ? a.vat : '',
    answers_json: JSON.stringify(redactAnswers(a)),
  };
  const cols = Object.keys(clinic);
  const placeholders = cols.map(() => '?').join(', ');
  const updates = cols.map((c) => `${c} = excluded.${c}`).join(', ');
  await db.run(
    `INSERT INTO sales_clinic_info (prospect_id, ${cols.join(', ')})
     VALUES (?, ${placeholders})
     ON CONFLICT(prospect_id) DO UPDATE SET ${updates}, updated_at = CURRENT_TIMESTAMP`,
    [pid, ...cols.map((c) => clinic[c])]
  );

  // 3) 계정·접속 정보(credentials) — 입력된 것만, 비밀번호 암호화
  const creds = a.creds || {};
  const credProvided = {};
  if (isSalesCryptoReady()) {
    for (const kind of CRED_KINDS) {
      const c = creds[kind];
      if (!c || typeof c !== 'object') continue;
      const provider = String(c.provider || '');
      const accountId = String(c.account_id || '');
      const pw = String(c.account_pw || '');
      const url = String(c.url || '');
      if (!provider && !accountId && !pw && !url) continue; // 빈 항목 건너뜀
      credProvided[kind] = true;
      const pwEnc = pw ? encryptSecret(pw) : '';
      await db.run(
        `INSERT INTO sales_credentials (prospect_id, kind, provider, account_id, account_pw_enc, url, note)
         VALUES (?, ?, ?, ?, ?, ?, '')
         ON CONFLICT(prospect_id, kind) DO UPDATE SET
           provider = excluded.provider, account_id = excluded.account_id,
           account_pw_enc = excluded.account_pw_enc, url = excluded.url,
           updated_at = CURRENT_TIMESTAMP`,
        [pid, kind, provider, accountId, pwEnc, url]
      );
    }
  }

  // 4) 체크리스트 자동 동기화 (제출된 항목 체크)
  const checks = new Set();
  if (credProvided.domain) checks.add('a1');   // 도메인 관리 계정
  if (credProvided.hosting) checks.add('a2');  // 호스팅 계정
  if (credProvided.admin) checks.add('a3');    // 기존 홈페이지 Admin
  if (credProvided.ftp) checks.add('a4');      // FTP 접속 정보
  if (clinic.subjects || clinic.strengths) checks.add('c4'); // 진료과목 및 특장점 정보
  if (clinic.refs) checks.add('c3');           // 참고 사이트
  if (clinic.memo) checks.add('c5');           // 추가 요청사항
  if (clinic.multi) checks.add('d1');          // 다국어 버전
  if (clinic.maint) checks.add('d2');          // 월 유지보수
  if (clinic.seo) checks.add('d3');            // 네이버 SEO
  if (clinic.aeo) checks.add('d4');            // AEO/GEO
  if (clinic.vat) checks.add('d5');            // 결제(부가세) 확인
  for (const key of checks) {
    await db.run(
      `INSERT INTO sales_checklist (prospect_id, item_key, checked, checked_at)
       VALUES (?, ?, 1, CURRENT_TIMESTAMP)
       ON CONFLICT(prospect_id, item_key) DO UPDATE SET checked = 1, checked_at = CURRENT_TIMESTAMP`,
      [pid, key]
    );
  }

  // 제출 완료 → 링크 자동 폐기 (1회용)
  await db.run('UPDATE sales_share_tokens SET last_viewed_at = CURRENT_TIMESTAMP, view_count = view_count + 1, revoked = 1 WHERE token = ?', [token]);
  return { success: true, prospectId: pid };
}

export async function loadShareTokenForView(token) {
  await ensurePlatformSchema();
  const db = await getDb();
  const row = await db.get(
    `SELECT t.*, p.id AS prospect_id, p.name, p.doctor_name, p.phone, p.addr, p.status, p.linked_hospital_id,
            h.name AS hospital_name
     FROM sales_share_tokens t
     JOIN sales_prospects p ON p.id = t.prospect_id
     LEFT JOIN hospitals h ON h.id = p.linked_hospital_id
     WHERE t.token = ?`,
    [token]
  );
  if (!row) return { error: 'NOT_FOUND' };
  if (row.revoked) return { error: 'REVOKED' };
  if (row.expires_at && new Date(row.expires_at).getTime() < Date.now()) return { error: 'EXPIRED' };
  // view count 증가
  await db.run('UPDATE sales_share_tokens SET view_count = view_count + 1, last_viewed_at = CURRENT_TIMESTAMP WHERE token = ?', [token]);
  return { share: row };
}
