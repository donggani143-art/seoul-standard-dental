// 업체 정산(빌링) 관리
// - 정산 본체: 업체당 1행 (UNIQUE hospital_id) — 세팅비/월 비용/세팅일/구독 시작일/비고
// - 정산 메모: 1:N (super_admin·reseller가 작성)

import { getDb } from '@/lib/db';
import { ensurePlatformSchema } from '@/lib/platform';

function sanitizeAmount(value) {
  const n = Number(value);
  if (!Number.isFinite(n) || n < 0) return 0;
  return Math.round(n);
}

function sanitizeDate(value) {
  if (!value) return null;
  const s = String(value).trim();
  // YYYY-MM-DD 형식만 허용 (느슨한 검사)
  return /^\d{4}-\d{2}-\d{2}$/.test(s) ? s : null;
}

/**
 * 정산 목록. hospitalIds 가 주어지면 해당 업체만 (리셀러 스코프).
 * @param {{ hospitalIds?: number[] | null }} opts
 */
export async function listBillings({ hospitalIds = null } = {}) {
  await ensurePlatformSchema();
  const db = await getDb();

  const where = [];
  const params = [];
  if (Array.isArray(hospitalIds)) {
    if (hospitalIds.length === 0) return [];
    const placeholders = hospitalIds.map(() => '?').join(',');
    where.push(`b.hospital_id IN (${placeholders})`);
    params.push(...hospitalIds);
  }

  const rows = await db.all(
    `SELECT b.id, b.hospital_id, b.setup_fee, b.monthly_fee, b.setup_date,
            b.subscription_start_date, b.notes, b.created_at, b.updated_at,
            b.status, b.manager_name, b.contract_months, b.contract_end_date,
            b.service_open_date, b.terminated_date,
            b.client_manager_name, b.client_phone,
            b.agency_name, b.agency_manager_name, b.agency_phone,
            b.build_end_date, b.build_paid, b.maintenance_paid, b.prospect_id,
            h.name AS hospital_name, h.slug AS hospital_slug, h.status AS hospital_status,
            (SELECT COUNT(*) FROM vendor_billing_memos m WHERE m.billing_id = b.id) AS memo_count
       FROM vendor_billings b
       JOIN hospitals h ON h.id = b.hospital_id
      ${where.length ? 'WHERE ' + where.join(' AND ') : ''}
      ORDER BY b.created_at DESC, b.id DESC`,
    params
  );
  return rows;
}

/**
 * 단일 업체의 정산 본체 + 메모 목록.
 */
export async function getBillingByHospitalId(hospitalId) {
  if (!hospitalId) return null;
  await ensurePlatformSchema();
  const db = await getDb();

  const billing = await db.get(
    `SELECT b.*, h.name AS hospital_name, h.slug AS hospital_slug
       FROM vendor_billings b
       JOIN hospitals h ON h.id = b.hospital_id
      WHERE b.hospital_id = ?`,
    [hospitalId]
  );
  if (!billing) return null;

  const memos = await db.all(
    `SELECT m.id, m.billing_id, m.account_id, m.role, m.body, m.created_at,
            a.email AS account_email, a.display_name AS account_name
       FROM vendor_billing_memos m
       LEFT JOIN admin_accounts a ON a.id = m.account_id
      WHERE m.billing_id = ?
      ORDER BY m.created_at DESC`,
    [billing.id]
  );

  return { ...billing, memos };
}

/**
 * 정산 미등록 업체 — 생성된 업체(hospitals) 중 vendor_billings가 없는 곳.
 * 연결된 영업 거래처(원장명·연락처)와 배정 리셀러(대행사명)를 함께 반환해
 * 등록 폼 자동 채움에 쓴다.
 */
export async function listBillingCandidates() {
  await ensurePlatformSchema();
  const db = await getDb();
  return db.all(
    `SELECT h.id AS hospital_id, h.name, h.slug, h.site_status, h.created_at,
            p.id AS prospect_id, p.doctor_name, p.phone AS prospect_phone,
            a.display_name AS reseller_name, a.email AS reseller_email
       FROM hospitals h
       LEFT JOIN vendor_billings b ON b.hospital_id = h.id
       LEFT JOIN sales_prospects p ON p.linked_hospital_id = h.id
       LEFT JOIN reseller_assignments ra ON ra.hospital_id = h.id
       LEFT JOIN admin_accounts a ON a.id = COALESCE(p.reseller_account_id, ra.account_id)
      WHERE b.id IS NULL
      GROUP BY h.id
      ORDER BY h.created_at DESC, h.id DESC`
  );
}

/**
 * 영업 거래처(sales_prospect)를 정산용 업체로 해석.
 * 연결된 업체가 없으면 '비공개 업체'(status/site_status=inactive, 공개 사이트 아님)를 자동 생성·연결.
 * → hospital_id NOT NULL 모델을 유지하면서 영업 거래처를 정산 대상으로 쓸 수 있게 함(A안).
 */
export async function resolveBillingHospitalForProspect(prospectId) {
  await ensurePlatformSchema();
  const db = await getDb();
  const pid = Number(prospectId);
  if (!pid) throw new Error('영업 거래처 ID가 필요합니다.');
  const p = await db.get('SELECT * FROM sales_prospects WHERE id = ?', [pid]);
  if (!p) throw new Error('존재하지 않는 영업 거래처입니다.');
  if (p.linked_hospital_id) {
    return { hospitalId: p.linked_hospital_id, prospect: p, created: false };
  }
  // 연결용 비공개 업체 자동 생성
  const base = 'prospect-' + pid;
  let slug = base, n = 1;
  while (await db.get('SELECT id FROM hospitals WHERE slug = ?', [slug])) { slug = base + '-' + (++n); }
  const ins = await db.run(
    `INSERT INTO hospitals (name, slug, status, template_key, site_status)
     VALUES (?, ?, 'inactive', 'default-dental', 'inactive')`,
    [String(p.name || ('거래처-' + pid)).slice(0, 200), slug]
  );
  const hospitalId = ins.lastID;
  await db.run('UPDATE sales_prospects SET linked_hospital_id = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?', [hospitalId, pid]);
  if (p.reseller_account_id) {
    await db.run('INSERT OR IGNORE INTO reseller_assignments (account_id, hospital_id) VALUES (?, ?)', [p.reseller_account_id, hospitalId]);
  }
  return { hospitalId, prospect: p, created: true };
}

// 새 6단계 + legacy 값 호환 (preparing → 구축대기, open → 관리진행)
const ALLOWED_STATUSES = new Set([
  'preparing',         // legacy: 구축대기로 표시
  'building_pending',  // 구축대기
  'building_active',   // 구축진행
  'building_done',     // 구축완료
  'managing_pending',  // 관리대기
  'managing_active',   // 관리진행
  'open',              // legacy: 관리진행으로 표시
  'terminated',        // 계약해지
]);

function todayIso() {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

/**
 * 정산 본체 upsert (super_admin only — 호출자가 권한 체크).
 */
export async function upsertBilling({
  hospitalId,
  setupFee = 0,
  monthlyFee = 0,
  setupDate = null,
  subscriptionStartDate = null,
  notes = '',
  status,
  managerName,
  contractMonths,
  contractEndDate,
  serviceOpenDate,
  terminatedDate,
  // 이미지 정보 구조: 고객사 / 영업대행사 / 구축·유지관리 결제여부
  clientManagerName,
  clientPhone,
  agencyName,
  agencyManagerName,
  agencyPhone,
  buildEndDate,
  buildPaid,
  maintenancePaid,
  prospectId,
}) {
  await ensurePlatformSchema();
  const db = await getDb();

  if (!hospitalId) throw new Error('업체 ID가 필요합니다.');
  const hospital = await db.get('SELECT id FROM hospitals WHERE id = ?', [hospitalId]);
  if (!hospital) throw new Error('존재하지 않는 업체입니다.');

  const safeSetup = sanitizeAmount(setupFee);
  const safeMonthly = sanitizeAmount(monthlyFee);
  const safeSetupDate = sanitizeDate(setupDate);
  const safeSubDate = sanitizeDate(subscriptionStartDate);
  const safeNotes = String(notes || '').slice(0, 4000);
  const safeStatus = status && ALLOWED_STATUSES.has(status) ? status : undefined;
  const safeManager = managerName !== undefined ? String(managerName || '').slice(0, 100) : undefined;
  const safeMonths = contractMonths !== undefined ? Math.max(0, Number(contractMonths) || 0) : undefined;
  const safeContractEnd = contractEndDate !== undefined ? sanitizeDate(contractEndDate) : undefined;
  const safeServiceOpen = serviceOpenDate !== undefined ? sanitizeDate(serviceOpenDate) : undefined;
  const safeTerminated = terminatedDate !== undefined ? sanitizeDate(terminatedDate) : undefined;
  const sanitizeStr = (v, max = 100) => v !== undefined ? String(v || '').slice(0, max) : undefined;
  const safeClientManager = sanitizeStr(clientManagerName);
  const safeClientPhone = sanitizeStr(clientPhone, 50);
  const safeAgencyName = sanitizeStr(agencyName);
  const safeAgencyManager = sanitizeStr(agencyManagerName);
  const safeAgencyPhone = sanitizeStr(agencyPhone, 50);
  const safeBuildEnd = buildEndDate !== undefined ? sanitizeDate(buildEndDate) : undefined;
  const safeBuildPaid = buildPaid !== undefined ? (buildPaid ? 1 : 0) : undefined;
  const safeMaintPaid = maintenancePaid !== undefined ? (maintenancePaid ? 1 : 0) : undefined;

  const existing = await db.get('SELECT * FROM vendor_billings WHERE hospital_id = ?', [hospitalId]);
  if (existing) {
    const fields = [
      'setup_fee = ?', 'monthly_fee = ?', 'setup_date = ?', 'subscription_start_date = ?',
      'notes = ?', 'updated_at = CURRENT_TIMESTAMP',
    ];
    const params = [safeSetup, safeMonthly, safeSetupDate, safeSubDate, safeNotes];
    if (safeStatus !== undefined) { fields.push('status = ?'); params.push(safeStatus); }
    if (safeManager !== undefined) { fields.push('manager_name = ?'); params.push(safeManager); }
    if (safeMonths !== undefined) { fields.push('contract_months = ?'); params.push(safeMonths); }
    if (safeContractEnd !== undefined) { fields.push('contract_end_date = ?'); params.push(safeContractEnd); }
    if (safeServiceOpen !== undefined) { fields.push('service_open_date = ?'); params.push(safeServiceOpen); }
    if (safeTerminated !== undefined) { fields.push('terminated_date = ?'); params.push(safeTerminated); }
    if (safeClientManager !== undefined) { fields.push('client_manager_name = ?'); params.push(safeClientManager); }
    if (safeClientPhone !== undefined) { fields.push('client_phone = ?'); params.push(safeClientPhone); }
    if (safeAgencyName !== undefined) { fields.push('agency_name = ?'); params.push(safeAgencyName); }
    if (safeAgencyManager !== undefined) { fields.push('agency_manager_name = ?'); params.push(safeAgencyManager); }
    if (safeAgencyPhone !== undefined) { fields.push('agency_phone = ?'); params.push(safeAgencyPhone); }
    if (safeBuildEnd !== undefined) { fields.push('build_end_date = ?'); params.push(safeBuildEnd); }
    if (safeBuildPaid !== undefined) { fields.push('build_paid = ?'); params.push(safeBuildPaid); }
    if (safeMaintPaid !== undefined) { fields.push('maintenance_paid = ?'); params.push(safeMaintPaid); }
    if (prospectId !== undefined && prospectId !== null && Number(prospectId)) { fields.push('prospect_id = ?'); params.push(Number(prospectId)); }
    params.push(existing.id);
    await db.run(`UPDATE vendor_billings SET ${fields.join(', ')} WHERE id = ?`, params);
    return { id: existing.id, hospital_id: hospitalId };
  }

  const result = await db.run(
    `INSERT INTO vendor_billings
       (hospital_id, setup_fee, monthly_fee, setup_date, subscription_start_date, notes,
        status, manager_name, contract_months, contract_end_date, service_open_date, terminated_date,
        client_manager_name, client_phone,
        agency_name, agency_manager_name, agency_phone,
        build_end_date, build_paid, maintenance_paid, prospect_id)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      hospitalId, safeSetup, safeMonthly, safeSetupDate, safeSubDate, safeNotes,
      safeStatus || 'building_pending',
      safeManager || '',
      safeMonths !== undefined ? safeMonths : 12,
      safeContractEnd || null,
      safeServiceOpen || null,
      safeTerminated || null,
      safeClientManager || '',
      safeClientPhone || '',
      safeAgencyName || '',
      safeAgencyManager || '',
      safeAgencyPhone || '',
      safeBuildEnd || null,
      safeBuildPaid || 0,
      safeMaintPaid || 0,
      (prospectId !== undefined && prospectId !== null && Number(prospectId)) ? Number(prospectId) : null,
    ]
  );
  return { id: result.lastID, hospital_id: hospitalId };
}

/**
 * upsertBilling 후 결제 내역(payments) 자동 재계산.
 */
export async function upsertBillingWithAutoInvoice(input) {
  await ensurePlatformSchema();
  const db = await getDb();
  const beforeRow = await db.get('SELECT * FROM vendor_billings WHERE hospital_id = ?', [input.hospitalId]);
  const result = await upsertBilling(input);
  const after = await db.get('SELECT * FROM vendor_billings WHERE id = ?', [result.id]);
  if (after) {
    try {
      const { regeneratePaymentsForBilling } = await import('@/lib/billingPayments');
      await regeneratePaymentsForBilling(after, beforeRow);
    } catch (e) { console.error('[autoPayments on upsert]', e.message); }
  }
  return result;
}

/**
 * 상태 전환 헬퍼 (super_admin only — 호출자가 권한 체크).
 * preparing → open: service_open_date = today (없으면)
 * open → terminated: terminated_date = today (없으면)
 */
export async function changeBillingStatus({ hospitalId, nextStatus }) {
  if (!ALLOWED_STATUSES.has(nextStatus)) throw new Error('지원하지 않는 상태입니다.');
  await ensurePlatformSchema();
  const db = await getDb();

  const billing = await db.get('SELECT * FROM vendor_billings WHERE hospital_id = ?', [hospitalId]);
  if (!billing) throw new Error('정산 본체가 없습니다. 먼저 등록해 주세요.');

  const fields = ['status = ?', 'updated_at = CURRENT_TIMESTAMP'];
  const params = [nextStatus];
  if (nextStatus === 'open' && !billing.service_open_date) {
    fields.push('service_open_date = ?');
    params.push(todayIso());
  }
  if (nextStatus === 'terminated' && !billing.terminated_date) {
    fields.push('terminated_date = ?');
    params.push(todayIso());
  }
  params.push(billing.id);
  await db.run(`UPDATE vendor_billings SET ${fields.join(', ')} WHERE id = ?`, params);

  // 상태 변경 후 결제 내역 자동 재계산
  const after = await db.get('SELECT * FROM vendor_billings WHERE id = ?', [billing.id]);
  if (after) {
    try {
      const { regeneratePaymentsForBilling } = await import('@/lib/billingPayments');
      await regeneratePaymentsForBilling(after, billing);
    } catch (e) { console.error('[autoPayments on status change]', e.message); }
  }
  return { id: billing.id, status: nextStatus };
}

/**
 * 정산 본체 삭제 (super_admin only).
 */
export async function deleteBillingById(billingId) {
  await ensurePlatformSchema();
  const db = await getDb();
  const result = await db.run('DELETE FROM vendor_billings WHERE id = ?', [billingId]);
  return result.changes;
}

/**
 * 메모 추가 (super_admin 또는 배정된 reseller).
 * 호출자가 권한 체크.
 */
export async function addBillingMemo({ billingId, accountId, role, body }) {
  await ensurePlatformSchema();
  const db = await getDb();

  const text = String(body || '').trim().slice(0, 2000);
  if (!text) throw new Error('메모 내용을 입력해 주세요.');
  if (!billingId) throw new Error('billingId가 필요합니다.');
  if (!accountId) throw new Error('accountId가 필요합니다.');

  const billing = await db.get('SELECT id FROM vendor_billings WHERE id = ?', [billingId]);
  if (!billing) throw new Error('정산 정보를 찾을 수 없습니다.');

  const result = await db.run(
    `INSERT INTO vendor_billing_memos (billing_id, account_id, role, body)
     VALUES (?, ?, ?, ?)`,
    [billingId, accountId, String(role || ''), text]
  );
  return { id: result.lastID };
}

/**
 * 메모 삭제 (작성자 본인 또는 super_admin). 호출자가 권한 체크.
 */
export async function deleteBillingMemo({ memoId }) {
  await ensurePlatformSchema();
  const db = await getDb();
  const result = await db.run('DELETE FROM vendor_billing_memos WHERE id = ?', [memoId]);
  return result.changes;
}

/**
 * 단일 메모 + 작성자 정보 조회 (권한 체크용).
 */
export async function getBillingMemoById(memoId) {
  await ensurePlatformSchema();
  const db = await getDb();
  return db.get(
    `SELECT m.id, m.billing_id, m.account_id, m.role, m.body, m.created_at,
            b.hospital_id
       FROM vendor_billing_memos m
       JOIN vendor_billings b ON b.id = m.billing_id
      WHERE m.id = ?`,
    [memoId]
  );
}

// ── 월별 정산(invoices) ──────────────────────────────────────────────────────

const ALLOWED_PAYMENT_STATUSES = new Set(['unpaid', 'paid', 'partial']);

function inferPaymentStatus(settlement, paid) {
  const s = Number(settlement || 0);
  const p = Number(paid || 0);
  if (s <= 0) return p > 0 ? 'paid' : 'unpaid';
  if (p <= 0) return 'unpaid';
  if (p >= s) return 'paid';
  return 'partial';
}

/**
 * 월별 정산 목록 + 누적/총액 계산.
 * @param {{ year?: string|null, paymentStatus?: string|null }} opts
 */
export async function listInvoices({ year = null, paymentStatus = null } = {}) {
  await ensurePlatformSchema();
  const db = await getDb();

  const where = [];
  const params = [];
  if (year) {
    where.push('substr(billing_month, 1, 4) = ?');
    params.push(String(year));
  }
  if (paymentStatus && ALLOWED_PAYMENT_STATUSES.has(paymentStatus)) {
    where.push('payment_status = ?');
    params.push(paymentStatus);
  }

  const rows = await db.all(
    `SELECT id, billing_month, period_start, period_end, item_count,
            supply_amount, vat, settlement_amount, paid_amount,
            payment_status, paid_at, notes, created_at, updated_at
       FROM vendor_billing_invoices
       ${where.length ? 'WHERE ' + where.join(' AND ') : ''}
      ORDER BY billing_month DESC`,
    params
  );

  // 누적 미납액·총 납부금액을 시간순(asc)으로 계산 후 결과에 부착
  const asc = [...rows].sort((a, b) => a.billing_month.localeCompare(b.billing_month));
  let cumUnpaid = 0;
  let totalPaid = 0;
  const enriched = new Map();
  for (const r of asc) {
    const monthlyUnpaid = Math.max(0, Number(r.settlement_amount || 0) - Number(r.paid_amount || 0));
    cumUnpaid += monthlyUnpaid;
    totalPaid += Number(r.paid_amount || 0);
    enriched.set(r.id, {
      monthly_unpaid: monthlyUnpaid,
      cumulative_unpaid: cumUnpaid,
      total_paid: totalPaid,
    });
  }

  return rows.map((r) => ({ ...r, ...(enriched.get(r.id) || {}) }));
}

export async function getInvoiceById(id) {
  await ensurePlatformSchema();
  const db = await getDb();
  return db.get('SELECT * FROM vendor_billing_invoices WHERE id = ?', [id]);
}

export async function upsertInvoice({
  id = null,
  billingMonth,
  periodStart,
  periodEnd,
  itemCount = 0,
  supplyAmount = 0,
  vat = 0,
  settlementAmount = null, // null이면 supplyAmount + vat 자동 계산
  paidAmount = 0,
  paymentStatus = null,    // null이면 자동 추론
  paidAt = null,
  notes = '',
}) {
  await ensurePlatformSchema();
  const db = await getDb();

  const safeMonth = String(billingMonth || '').slice(0, 7);
  if (!/^\d{4}-\d{2}$/.test(safeMonth)) throw new Error('청구월 형식이 올바르지 않습니다 (YYYY-MM).');

  const safePeriodStart = sanitizeDate(periodStart);
  const safePeriodEnd = sanitizeDate(periodEnd);
  if (!safePeriodStart || !safePeriodEnd) throw new Error('정산 기간을 입력해 주세요.');

  const sCount = Math.max(0, Number(itemCount) || 0);
  const sSupply = sanitizeAmount(supplyAmount);
  const sVat = sanitizeAmount(vat);
  const sSettle = settlementAmount === null ? (sSupply + sVat) : sanitizeAmount(settlementAmount);
  const sPaid = sanitizeAmount(paidAmount);
  const sStatus = paymentStatus && ALLOWED_PAYMENT_STATUSES.has(paymentStatus)
    ? paymentStatus
    : inferPaymentStatus(sSettle, sPaid);
  const sPaidAt = sanitizeDate(paidAt);
  const sNotes = String(notes || '').slice(0, 4000);

  if (id) {
    const exists = await db.get('SELECT id FROM vendor_billing_invoices WHERE id = ?', [id]);
    if (!exists) throw new Error('청구 행을 찾을 수 없습니다.');
    await db.run(
      `UPDATE vendor_billing_invoices
          SET billing_month = ?, period_start = ?, period_end = ?, item_count = ?,
              supply_amount = ?, vat = ?, settlement_amount = ?, paid_amount = ?,
              payment_status = ?, paid_at = ?, notes = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?`,
      [safeMonth, safePeriodStart, safePeriodEnd, sCount, sSupply, sVat, sSettle, sPaid, sStatus, sPaidAt, sNotes, id]
    );
    return { id };
  }

  // 동일 월 행 있으면 업데이트
  const existingByMonth = await db.get('SELECT id FROM vendor_billing_invoices WHERE billing_month = ?', [safeMonth]);
  if (existingByMonth) {
    return upsertInvoice({
      id: existingByMonth.id, billingMonth, periodStart, periodEnd, itemCount,
      supplyAmount, vat, settlementAmount, paidAmount, paymentStatus, paidAt, notes,
    });
  }

  const result = await db.run(
    `INSERT INTO vendor_billing_invoices
       (billing_month, period_start, period_end, item_count,
        supply_amount, vat, settlement_amount, paid_amount, payment_status, paid_at, notes)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [safeMonth, safePeriodStart, safePeriodEnd, sCount, sSupply, sVat, sSettle, sPaid, sStatus, sPaidAt, sNotes]
  );
  return { id: result.lastID };
}

export async function recordInvoicePayment({ id, paidAmount, paidAt = null }) {
  await ensurePlatformSchema();
  const db = await getDb();
  const inv = await db.get('SELECT * FROM vendor_billing_invoices WHERE id = ?', [id]);
  if (!inv) throw new Error('청구 행을 찾을 수 없습니다.');

  const newPaid = sanitizeAmount(paidAmount);
  const newStatus = inferPaymentStatus(inv.settlement_amount, newPaid);
  const newPaidAt = sanitizeDate(paidAt) || (newPaid > 0 ? todayIso() : null);

  await db.run(
    `UPDATE vendor_billing_invoices
        SET paid_amount = ?, payment_status = ?, paid_at = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?`,
    [newPaid, newStatus, newPaidAt, id]
  );
  return { id, paid_amount: newPaid, payment_status: newStatus, paid_at: newPaidAt };
}

export async function deleteInvoice({ id }) {
  await ensurePlatformSchema();
  const db = await getDb();
  const result = await db.run('DELETE FROM vendor_billing_invoices WHERE id = ?', [id]);
  return result.changes;
}

// ── 자동 청구 생성 ─────────────────────────────────────────────────────────────

function lastDayOfMonth(year, mon /* 1-12 */) {
  return new Date(year, mon, 0).getDate();
}

function monthsBetweenIso(startDateIso, endDateIso) {
  if (!startDateIso) return [];
  const s = new Date(startDateIso);
  const e = endDateIso ? new Date(endDateIso) : new Date();
  if (isNaN(s.getTime()) || isNaN(e.getTime())) return [];
  const out = [];
  let cur = new Date(s.getFullYear(), s.getMonth(), 1);
  const end = new Date(e.getFullYear(), e.getMonth(), 1);
  while (cur <= end) {
    out.push(`${cur.getFullYear()}-${String(cur.getMonth() + 1).padStart(2, '0')}`);
    cur = new Date(cur.getFullYear(), cur.getMonth() + 1, 1);
  }
  return out;
}

/**
 * 특정 월의 청구 행을 vendor_billings 데이터로부터 자동 계산해서 upsert.
 * - 구축비: setup_date가 그 월에 속하면 1건 합산
 * - 유지관리비: subscription_start_date ~ contract_end_date 범위에 그 월이 들면 1건 합산
 * - 입금액(paid_amount)은 기존 행이 있으면 보존
 * - 합산 결과 0건이면 기존 행 삭제 (의미 없음)
 */
export async function generateInvoiceForMonth({ month }) {
  await ensurePlatformSchema();
  const db = await getDb();

  if (!/^\d{4}-\d{2}$/.test(month)) throw new Error('YYYY-MM 형식이어야 합니다.');

  const [year, mon] = month.split('-').map(Number);
  const periodStart = `${month}-01`;
  const lastDay = lastDayOfMonth(year, mon);
  const periodEnd = `${month}-${String(lastDay).padStart(2, '0')}`;

  const billings = await db.all('SELECT * FROM vendor_billings');

  let itemCount = 0;
  let totalIncl = 0;

  for (const b of billings) {
    // 해지된 업체: 해지일 이후 월은 청구 제외
    if (b.terminated_date && b.terminated_date < periodStart) continue;

    // 구축비
    if (Number(b.setup_fee) > 0 && b.setup_date && b.setup_date.startsWith(month)) {
      itemCount += 1;
      totalIncl += Number(b.setup_fee);
    }

    // 유지관리비
    if (Number(b.monthly_fee) > 0 && b.subscription_start_date) {
      const inRange =
        b.subscription_start_date <= periodEnd &&
        (!b.contract_end_date || b.contract_end_date >= periodStart);
      if (inRange) {
        itemCount += 1;
        totalIncl += Number(b.monthly_fee);
      }
    }
  }

  const existing = await db.get(
    'SELECT id, paid_amount, paid_at FROM vendor_billing_invoices WHERE billing_month = ?',
    [month]
  );

  if (itemCount === 0) {
    if (existing) {
      await db.run('DELETE FROM vendor_billing_invoices WHERE id = ?', [existing.id]);
      return { month, action: 'deleted' };
    }
    return { month, action: 'skipped' };
  }

  // VAT 10% 분리
  const supplyAmount = Math.round(totalIncl / 1.1);
  const vat = totalIncl - supplyAmount;
  const settlementAmount = totalIncl;

  const paidAmount = Number(existing?.paid_amount || 0);
  const paidAt = existing?.paid_at || null;

  await upsertInvoice({
    id: existing?.id || null,
    billingMonth: month,
    periodStart,
    periodEnd,
    itemCount,
    supplyAmount,
    vat,
    settlementAmount,
    paidAmount,
    paymentStatus: null, // 자동 추론
    paidAt,
    notes: existing ? undefined : '자동 생성',
  });
  return { month, action: existing ? 'updated' : 'created', itemCount, settlementAmount };
}

/**
 * 단일 vendor_billings에서 영향을 미치는 모든 월 목록.
 */
function getAffectedMonthsForBilling(b, beforeRow = null) {
  const months = new Set();
  const sources = [b];
  if (beforeRow) sources.push(beforeRow);
  for (const src of sources) {
    if (Number(src.setup_fee) > 0 && src.setup_date) {
      months.add(src.setup_date.slice(0, 7));
    }
    if (Number(src.monthly_fee) > 0 && src.subscription_start_date) {
      const list = monthsBetweenIso(
        src.subscription_start_date,
        src.contract_end_date || null
      );
      list.forEach((m) => months.add(m));
    }
  }
  return [...months];
}

/**
 * 한 vendor_billings의 변경 후 영향받는 모든 월 청구를 재생성.
 * 변경 전 데이터(beforeRow)도 합쳐서 잔재 정리.
 */
export async function regenerateInvoicesForBilling(billing, beforeRow = null) {
  const months = getAffectedMonthsForBilling(billing, beforeRow);
  for (const m of months) {
    try { await generateInvoiceForMonth({ month: m }); }
    catch (e) { /* 한 월 실패해도 다른 월 진행 */ console.error('[autoInvoice]', m, e.message); }
  }
  return { months };
}

/**
 * 모든 월의 청구 자동 재생성 (수동 일괄).
 */
export async function regenerateAllInvoices() {
  await ensurePlatformSchema();
  const db = await getDb();
  const billings = await db.all('SELECT * FROM vendor_billings');
  const allMonths = new Set();
  for (const b of billings) {
    getAffectedMonthsForBilling(b).forEach((m) => allMonths.add(m));
  }
  // 기존 invoice 중 vendor_billings 변경으로 누락된 월도 정리 대상
  const existing = await db.all('SELECT DISTINCT billing_month FROM vendor_billing_invoices');
  existing.forEach((r) => allMonths.add(r.billing_month));

  let processed = 0;
  for (const m of allMonths) {
    try { await generateInvoiceForMonth({ month: m }); processed += 1; }
    catch (e) { console.error('[regenerateAll]', m, e.message); }
  }
  return { processed, totalMonths: allMonths.size };
}
