// 결제 내역(업체×항목×회차별 1행)
// 자동 생성: vendor_billings 등록 정보 → 매월 구축비 1행 + 유지관리비 1행
// 자동 완납: vendor_billings.build_paid / maintenance_paid 체크 시 해당 항목 자동 paid 처리

import { getDb } from '@/lib/db';
import { ensurePlatformSchema } from '@/lib/platform';

const ITEM_LABELS = { build: '구축비', maintenance: '유지관리비' };
const PAYMENT_STATUSES = new Set(['unpaid', 'paid', 'partial', 'failed']);

function lastDayOfMonth(year, mon) {
  return new Date(year, mon, 0).getDate();
}

function monthsBetween(startIso, endIso) {
  if (!startIso) return [];
  const s = new Date(startIso);
  const e = endIso ? new Date(endIso) : new Date();
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

function inferStatus(amount, paid) {
  const a = Number(amount || 0);
  const p = Number(paid || 0);
  if (a <= 0) return p > 0 ? 'paid' : 'unpaid';
  if (p <= 0) return 'unpaid';
  if (p >= a) return 'paid';
  return 'partial';
}

/**
 * 결제 내역 목록.
 * 필터: hospitalIds(reseller 스코프), year, month, paymentStatus, search(업체명)
 */
export async function listPayments({ hospitalIds = null, year, month, paymentStatus, search } = {}) {
  await ensurePlatformSchema();
  const db = await getDb();

  const where = [];
  const params = [];
  if (Array.isArray(hospitalIds)) {
    if (hospitalIds.length === 0) return { rows: [], summary: { total: 0, count: 0, paid: 0, failed: 0 } };
    where.push(`p.hospital_id IN (${hospitalIds.map(() => '?').join(',')})`);
    params.push(...hospitalIds);
  }
  if (year) { where.push(`substr(p.billing_month, 1, 4) = ?`); params.push(String(year)); }
  if (month) { where.push(`p.billing_month = ?`); params.push(month); }
  if (paymentStatus && PAYMENT_STATUSES.has(paymentStatus)) { where.push(`p.payment_status = ?`); params.push(paymentStatus); }
  if (search) {
    where.push(`(h.name LIKE ? OR h.slug LIKE ?)`);
    params.push(`%${search}%`, `%${search}%`);
  }

  const rows = await db.all(
    `SELECT p.*, h.name AS hospital_name, h.slug AS hospital_slug
       FROM vendor_billing_payments p
       JOIN hospitals h ON h.id = p.hospital_id
      ${where.length ? 'WHERE ' + where.join(' AND ') : ''}
      ORDER BY p.billing_month DESC, p.hospital_id, p.item_type DESC, p.installment_no`,
    params
  );

  const summary = rows.reduce(
    (acc, r) => {
      if (r.payment_status === 'paid') {
        acc.paid += 1;
        acc.total += Number(r.paid_amount || 0);
      } else if (r.payment_status === 'failed') {
        acc.failed += 1;
      }
      acc.count += 1;
      return acc;
    },
    { total: 0, count: 0, paid: 0, failed: 0 }
  );

  return { rows, summary };
}

export async function getPaymentById(id) {
  await ensurePlatformSchema();
  const db = await getDb();
  return db.get(
    `SELECT p.*, h.name AS hospital_name, h.slug AS hospital_slug
       FROM vendor_billing_payments p
       JOIN hospitals h ON h.id = p.hospital_id
      WHERE p.id = ?`,
    [id]
  );
}

/**
 * 한 월에 대해 모든 vendor_billings를 순회하며 구축비/유지관리비 행 자동 생성.
 * 회차 계산:
 *  - 구축비: 항상 1
 *  - 유지관리비: subscription_start_date의 월부터 청구월까지의 N+1
 */
export async function generatePaymentsForMonth({ month }) {
  await ensurePlatformSchema();
  const db = await getDb();

  if (!/^\d{4}-\d{2}$/.test(month)) throw new Error('YYYY-MM 형식이어야 합니다.');
  const [year, mon] = month.split('-').map(Number);
  const periodStart = `${month}-01`;
  const periodEnd = `${month}-${String(lastDayOfMonth(year, mon)).padStart(2, '0')}`;

  const billings = await db.all('SELECT * FROM vendor_billings');

  const expected = []; // { hospital_id, item_type, installment_no, amount }
  for (const b of billings) {
    if (b.terminated_date && b.terminated_date < periodStart) continue;

    // 구축비: setup_date의 월이 일치하면 1회차
    if (Number(b.setup_fee) > 0 && b.setup_date && b.setup_date.startsWith(month)) {
      expected.push({
        hospital_id: b.hospital_id,
        item_type: 'build',
        installment_no: 1,
        amount: Number(b.setup_fee),
        billing: b,
      });
    }

    // 유지관리비: 구독 시작 ~ 종료 사이 매월
    if (Number(b.monthly_fee) > 0 && b.subscription_start_date) {
      const inRange =
        b.subscription_start_date <= periodEnd &&
        (!b.contract_end_date || b.contract_end_date >= periodStart);
      if (inRange) {
        const list = monthsBetween(b.subscription_start_date, month + '-01');
        const installmentNo = Math.max(1, list.length);
        expected.push({
          hospital_id: b.hospital_id,
          item_type: 'maintenance',
          installment_no: installmentNo,
          amount: Number(b.monthly_fee),
          billing: b,
        });
      }
    }
  }

  // 생성/업데이트 (입금액·결제수단·영수증·실패사유는 보존)
  const created = [];
  for (const e of expected) {
    const existing = await db.get(
      `SELECT id, paid_amount, paid_at, payment_method, receipt_url, failure_reason, payment_status
         FROM vendor_billing_payments
        WHERE hospital_id = ? AND billing_month = ? AND item_type = ? AND installment_no = ?`,
      [e.hospital_id, month, e.item_type, e.installment_no]
    );

    const supply = Math.round(e.amount / 1.1);
    const vat = e.amount - supply;

    // 자동 완납 정책: vendor_billings의 결제완료 체크와 일치
    const autoPaidFlag = e.item_type === 'build' ? !!e.billing.build_paid : !!e.billing.maintenance_paid;
    const preservedPaid = Number(existing?.paid_amount || 0);
    const preservedStatus = existing?.payment_status;
    let nextPaid = preservedPaid;
    let nextStatus = preservedStatus || 'unpaid';
    let nextPaidAt = existing?.paid_at || null;

    // 자동 완납이 켜졌고 아직 미납이면 자동으로 paid로 끌어올림
    if (autoPaidFlag && (preservedStatus === 'unpaid' || !preservedStatus || preservedPaid < e.amount)) {
      nextPaid = e.amount;
      nextStatus = 'paid';
      nextPaidAt = nextPaidAt || new Date().toISOString().slice(0, 10);
    }
    // 자동 완납이 꺼졌고 paid 상태가 자동 처리된 경우만 unpaid로 되돌림
    else if (!autoPaidFlag && preservedStatus === 'paid' && existing && Number(existing.paid_amount || 0) === e.amount && (existing.payment_method || '') === '자동 완납') {
      nextPaid = 0;
      nextStatus = 'unpaid';
      nextPaidAt = null;
    } else {
      nextStatus = inferStatus(e.amount, nextPaid);
    }

    if (existing) {
      await db.run(
        `UPDATE vendor_billing_payments
            SET amount = ?, supply_amount = ?, vat = ?, payment_status = ?,
                paid_amount = ?, paid_at = ?,
                payment_method = CASE WHEN ? = 'paid' AND (payment_method = '' OR payment_method IS NULL) THEN '자동 완납' ELSE payment_method END,
                auto_generated = 1, updated_at = CURRENT_TIMESTAMP
          WHERE id = ?`,
        [e.amount, supply, vat, nextStatus, nextPaid, nextPaidAt, autoPaidFlag ? 'paid' : 'unpaid', existing.id]
      );
      created.push({ id: existing.id, action: 'updated' });
    } else {
      const result = await db.run(
        `INSERT INTO vendor_billing_payments
           (hospital_id, billing_month, item_type, installment_no, amount, supply_amount, vat,
            payment_status, paid_amount, paid_at, payment_method, auto_generated)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)`,
        [
          e.hospital_id, month, e.item_type, e.installment_no, e.amount, supply, vat,
          nextStatus, nextPaid, nextPaidAt,
          autoPaidFlag ? '자동 완납' : '',
        ]
      );
      created.push({ id: result.lastID, action: 'created' });
    }
  }

  // 그 월에 expected에 없는 자동 행은 정리 (등록 정보 변경으로 더 이상 청구 대상 아님)
  const expectedKeys = new Set(expected.map((e) => `${e.hospital_id}|${e.item_type}|${e.installment_no}`));
  const stale = await db.all(
    `SELECT id, hospital_id, item_type, installment_no, paid_amount
       FROM vendor_billing_payments
      WHERE billing_month = ? AND auto_generated = 1`,
    [month]
  );
  for (const s of stale) {
    const key = `${s.hospital_id}|${s.item_type}|${s.installment_no}`;
    if (!expectedKeys.has(key) && Number(s.paid_amount || 0) === 0) {
      await db.run('DELETE FROM vendor_billing_payments WHERE id = ?', [s.id]);
    }
  }

  return { month, processed: created.length };
}

export async function regenerateAllPayments() {
  await ensurePlatformSchema();
  const db = await getDb();
  const billings = await db.all('SELECT * FROM vendor_billings');
  const months = new Set();
  for (const b of billings) {
    if (Number(b.setup_fee) > 0 && b.setup_date) months.add(b.setup_date.slice(0, 7));
    if (Number(b.monthly_fee) > 0 && b.subscription_start_date) {
      monthsBetween(b.subscription_start_date, b.contract_end_date || null).forEach((m) => months.add(m));
    }
  }
  // 기존 행이 있는 월도 포함 (정리 대상)
  const existing = await db.all('SELECT DISTINCT billing_month FROM vendor_billing_payments');
  existing.forEach((r) => months.add(r.billing_month));

  let processed = 0;
  for (const m of months) {
    try { await generatePaymentsForMonth({ month: m }); processed += 1; }
    catch (e) { console.error('[regenerateAllPayments]', m, e.message); }
  }
  return { processed, totalMonths: months.size };
}

export async function regeneratePaymentsForBilling(billing, beforeRow = null) {
  const months = new Set();
  for (const src of [billing, beforeRow].filter(Boolean)) {
    if (Number(src.setup_fee) > 0 && src.setup_date) months.add(src.setup_date.slice(0, 7));
    if (Number(src.monthly_fee) > 0 && src.subscription_start_date) {
      monthsBetween(src.subscription_start_date, src.contract_end_date || null).forEach((m) => months.add(m));
    }
  }
  for (const m of months) {
    try { await generatePaymentsForMonth({ month: m }); }
    catch (e) { console.error('[regenPayments]', m, e.message); }
  }
  return { months: [...months] };
}

/**
 * 결제 처리 (수동) — 입금액 + 결제수단 + 영수증 + 실패사유 + 상태
 */
export async function settlePayment({ id, paidAmount, paidAt = null, paymentMethod = '', receiptUrl = '', failureReason = '', status = null }) {
  await ensurePlatformSchema();
  const db = await getDb();
  const row = await db.get('SELECT * FROM vendor_billing_payments WHERE id = ?', [id]);
  if (!row) throw new Error('결제 행을 찾을 수 없습니다.');

  const newPaid = Math.max(0, Number(paidAmount) || 0);
  let newStatus = status;
  if (!newStatus || !PAYMENT_STATUSES.has(newStatus)) {
    newStatus = inferStatus(row.amount, newPaid);
    if (failureReason && newPaid === 0) newStatus = 'failed';
  }
  const newPaidAt = paidAt || (newPaid > 0 ? new Date().toISOString().slice(0, 10) : null);

  await db.run(
    `UPDATE vendor_billing_payments
        SET paid_amount = ?, payment_status = ?, paid_at = ?,
            payment_method = ?, receipt_url = ?, failure_reason = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?`,
    [newPaid, newStatus, newPaidAt, String(paymentMethod || '').slice(0, 200), String(receiptUrl || '').slice(0, 500), String(failureReason || '').slice(0, 500), id]
  );
  return { id, paid_amount: newPaid, payment_status: newStatus, paid_at: newPaidAt };
}

export async function deletePayment({ id }) {
  await ensurePlatformSchema();
  const db = await getDb();
  const result = await db.run('DELETE FROM vendor_billing_payments WHERE id = ?', [id]);
  return result.changes;
}

export { ITEM_LABELS };
