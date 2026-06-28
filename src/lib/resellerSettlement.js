// 리셀러 월별 정산 — 리셀러가 본사에 납부하는 금액을 "청구 기준"으로 집계.
// 원칙:
//  - 정산월 = 결제행의 청구월(billing_month). 이 달 청구된 설치비(build)·월관리비(maintenance)에
//    리셀러별 정산율(%)을 적용한 금액 = 리셀러가 본사에 납부할 금액.
//  - 정산율 미설정 시 100%(등록 금액 전액 납부).
//  - "입금완료" 처리 시 당시 집계를 reseller_settlements에 스냅샷 — 이후 청구 변동은 차액으로 표시.
//  - 이전 3개월 미입금을 함께 반환해 누락 방지.
import { getDb } from '@/lib/db';
import { ensurePlatformSchema } from '@/lib/platform';
import { generatePaymentsForMonth } from '@/lib/billingPayments';

const clampPct = (v, dflt = 100) => {
  const n = Number(v);
  if (!Number.isFinite(n)) return dflt;
  return Math.max(0, Math.min(100, n));
};

function prevMonths(month, n) {
  const [y, m] = month.split('-').map(Number);
  const out = [];
  let d = new Date(y, m - 1, 1);
  for (let i = 0; i < n; i++) {
    d = new Date(d.getFullYear(), d.getMonth() - 1, 1);
    out.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);
  }
  return out;
}

async function loadContext(db) {
  const resellers = await db.all(
    `SELECT id, email, display_name FROM admin_accounts WHERE role = 'reseller' AND status = 'active' ORDER BY display_name`
  );
  const assignments = await db.all(
    `SELECT ra.account_id, ra.hospital_id, h.name AS hospital_name
       FROM reseller_assignments ra JOIN hospitals h ON h.id = ra.hospital_id`
  );
  const rates = await db.all('SELECT account_id, build_pct, monthly_pct FROM reseller_settings');
  const rateBy = new Map(rates.map((r) => [r.account_id, r]));
  return { resellers, assignments, rateBy };
}

// 한 달 치 청구액을 리셀러별로 합산 (행 생성 없이 기존 행 기준)
async function dueTotalsForMonth(db, month, assignments, rateBy, resellers) {
  const rows = await db.all(
    `SELECT hospital_id, item_type, SUM(amount) AS amt
       FROM vendor_billing_payments WHERE billing_month = ?
      GROUP BY hospital_id, item_type`,
    [month]
  );
  const byHospital = new Map();
  for (const r of rows) {
    const cur = byHospital.get(r.hospital_id) || { build: 0, maintenance: 0 };
    cur[r.item_type] = Number(r.amt || 0);
    byHospital.set(r.hospital_id, cur);
  }
  return resellers.map((rs) => {
    let buildBase = 0, monthlyBase = 0;
    for (const a of assignments.filter((x) => x.account_id === rs.id)) {
      const v = byHospital.get(a.hospital_id);
      if (v) { buildBase += v.build || 0; monthlyBase += v.maintenance || 0; }
    }
    const rate = rateBy.get(rs.id);
    const buildPct = clampPct(rate?.build_pct, 100);
    const monthlyPct = clampPct(rate?.monthly_pct, 100);
    return {
      account_id: rs.id,
      due: Math.round(buildBase * buildPct / 100) + Math.round(monthlyBase * monthlyPct / 100),
    };
  });
}

/** 월별 리셀러 정산 집계 (청구 기준, 라이브 계산 + 저장된 정산서 병합 + 이전 미입금) */
export async function buildResellerSettlement({ month }) {
  if (!/^\d{4}-\d{2}$/.test(String(month || ''))) throw new Error('YYYY-MM 형식이어야 합니다.');
  await ensurePlatformSchema();
  const db = await getDb();

  // 등록 정보 기준으로 이 달 청구 행을 최신화(멱등 — 입금 정보 보존)
  try { await generatePaymentsForMonth({ month }); } catch { /* 생성 실패해도 기존 행으로 집계 */ }

  const { resellers, assignments, rateBy } = await loadContext(db);
  const saved = await db.all('SELECT * FROM reseller_settlements WHERE month = ?', [month]);
  const savedBy = new Map(saved.map((s) => [s.account_id, s]));

  // 담당 업체 중복 배정 감지(이중 정산 위험)
  const ownerCount = new Map();
  for (const a of assignments) ownerCount.set(a.hospital_id, (ownerCount.get(a.hospital_id) || 0) + 1);
  const overlaps = [...ownerCount.entries()].filter(([, n]) => n > 1).map(([hid]) => hid);

  // 이 달 청구 행 (업체별 상세)
  const billedRows = await db.all(
    `SELECT p.*, h.name AS hospital_name
       FROM vendor_billing_payments p JOIN hospitals h ON h.id = p.hospital_id
      WHERE p.billing_month = ?
      ORDER BY p.hospital_id, p.item_type DESC`,
    [month]
  );
  const byHospital = new Map();
  for (const r of billedRows) {
    const arr = byHospital.get(r.hospital_id) || [];
    arr.push(r);
    byHospital.set(r.hospital_id, arr);
  }

  // 이전 3개월 미입금
  const prevList = prevMonths(month, 3);
  const prevSaved = await db.all(
    `SELECT account_id, month, status, commission FROM reseller_settlements WHERE month IN (${prevList.map(() => '?').join(',')})`,
    prevList
  );
  const prevSavedBy = new Map(prevSaved.map((s) => [`${s.account_id}|${s.month}`, s]));
  const prevDue = {};
  for (const pm of prevList) {
    prevDue[pm] = await dueTotalsForMonth(db, pm, assignments, rateBy, resellers);
  }

  const result = resellers.map((rs) => {
    const myHospitals = assignments.filter((a) => a.account_id === rs.id);
    const items = [];
    for (const h of myHospitals) {
      for (const p of byHospital.get(h.hospital_id) || []) {
        items.push({
          hospital_id: p.hospital_id,
          hospital_name: p.hospital_name,
          item_type: p.item_type,
          installment_no: p.installment_no,
          billing_month: p.billing_month,
          amount: Number(p.amount || 0),
          payment_status: p.payment_status,
        });
      }
    }
    const buildBase = items.filter((i) => i.item_type === 'build').reduce((s, i) => s + i.amount, 0);
    const monthlyBase = items.filter((i) => i.item_type === 'maintenance').reduce((s, i) => s + i.amount, 0);
    const rate = rateBy.get(rs.id);
    const buildPct = clampPct(rate?.build_pct, 100);
    const monthlyPct = clampPct(rate?.monthly_pct, 100);
    const buildDue = Math.round(buildBase * buildPct / 100);
    const monthlyDue = Math.round(monthlyBase * monthlyPct / 100);
    const due = buildDue + monthlyDue;
    const snap = savedBy.get(rs.id) || null;

    // 이전 미입금: due>0 이고 저장상태가 paid 아님
    const unpaidPrev = prevList
      .map((pm) => {
        const d = prevDue[pm].find((x) => x.account_id === rs.id)?.due || 0;
        const s = prevSavedBy.get(`${rs.id}|${pm}`);
        return { month: pm, due: d, paid: s?.status === 'paid' };
      })
      .filter((x) => x.due > 0 && !x.paid);

    return {
      account_id: rs.id,
      name: rs.display_name || rs.email,
      email: rs.email,
      hospital_count: myHospitals.length,
      build_pct: buildPct,
      monthly_pct: monthlyPct,
      build_base: buildBase,
      monthly_base: monthlyBase,
      build_due: buildDue,
      monthly_due: monthlyDue,
      due,
      items,
      unpaid_prev: unpaidPrev,
      settlement: snap
        ? {
            status: snap.status,
            paid_at: snap.paid_at,
            notes: snap.notes,
            snapshot_due: Number(snap.commission || 0),
            drift: snap.status === 'paid' ? due - Number(snap.commission || 0) : 0,
          }
        : { status: 'pending', paid_at: null, notes: '', snapshot_due: null, drift: 0 },
    };
  });

  return {
    month,
    resellers: result,
    totals: {
      billed: billedRows.reduce((s, r) => s + Number(r.amount || 0), 0),
      due: result.reduce((s, r) => s + r.due, 0),
      collected: result.filter((r) => r.settlement.status === 'paid').reduce((s, r) => s + (r.settlement.snapshot_due ?? r.due), 0),
    },
    overlapHospitalIds: overlaps,
  };
}

/** 리셀러 정산율 저장 */
export async function saveResellerRates({ accountId, buildPct, monthlyPct }) {
  await ensurePlatformSchema();
  const db = await getDb();
  const b = clampPct(buildPct, 100);
  const m = clampPct(monthlyPct, 100);
  await db.run(
    `INSERT INTO reseller_settings (account_id, build_pct, monthly_pct, updated_at)
     VALUES (?, ?, ?, CURRENT_TIMESTAMP)
     ON CONFLICT(account_id) DO UPDATE SET build_pct = excluded.build_pct, monthly_pct = excluded.monthly_pct, updated_at = CURRENT_TIMESTAMP`,
    [accountId, b, m]
  );
  return { accountId, build_pct: b, monthly_pct: m };
}

/** 입금 상태 변경 — 입금완료 처리 시 현재 집계 스냅샷 저장 */
export async function setSettlementStatus({ accountId, month, status, notes = '' }) {
  if (!['pending', 'paid'].includes(status)) throw new Error('status는 pending|paid 만 가능합니다.');
  await ensurePlatformSchema();
  const db = await getDb();

  const data = await buildResellerSettlement({ month });
  const row = data.resellers.find((r) => r.account_id === Number(accountId));
  if (!row) throw new Error('리셀러를 찾을 수 없습니다.');

  const paidAt = status === 'paid' ? new Date().toISOString().slice(0, 10) : null;
  await db.run(
    `INSERT INTO reseller_settlements
       (account_id, month, build_base, monthly_base, build_pct, monthly_pct, commission, status, paid_at, notes, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
     ON CONFLICT(account_id, month) DO UPDATE SET
       build_base = excluded.build_base, monthly_base = excluded.monthly_base,
       build_pct = excluded.build_pct, monthly_pct = excluded.monthly_pct,
       commission = excluded.commission, status = excluded.status, paid_at = excluded.paid_at,
       notes = CASE WHEN excluded.notes != '' THEN excluded.notes ELSE reseller_settlements.notes END,
       updated_at = CURRENT_TIMESTAMP`,
    [accountId, month, row.build_base, row.monthly_base, row.build_pct, row.monthly_pct, row.due, status, paidAt, String(notes || '').slice(0, 500)]
  );
  return { accountId, month, status, paid_at: paidAt, due: row.due };
}
