// 리셀러 ↔ 업체 배정 관리
// 리셀러는 super_admin이 배정한 업체만 조회 가능 (정산 한정)

import { getDb } from '@/lib/db';
import { ensurePlatformSchema } from '@/lib/platform';

/**
 * 특정 리셀러 계정에 배정된 업체 ID 목록.
 * @param {number} accountId
 * @returns {Promise<number[]>}
 */
export async function getResellerHospitalIds(accountId) {
  if (!accountId) return [];
  await ensurePlatformSchema();
  const db = await getDb();
  const rows = await db.all(
    'SELECT hospital_id FROM reseller_assignments WHERE account_id = ? ORDER BY hospital_id',
    [accountId]
  );
  return rows.map((r) => r.hospital_id);
}

/**
 * 특정 리셀러 계정에 배정된 업체 정보 (hospitals 테이블 조인).
 */
export async function listResellerAssignments(accountId) {
  if (!accountId) return [];
  await ensurePlatformSchema();
  const db = await getDb();
  return db.all(
    `SELECT ra.id, ra.account_id, ra.hospital_id, ra.created_at,
            h.name AS hospital_name, h.slug AS hospital_slug, h.status AS hospital_status
       FROM reseller_assignments ra
       JOIN hospitals h ON h.id = ra.hospital_id
      WHERE ra.account_id = ?
      ORDER BY h.name`,
    [accountId]
  );
}

/**
 * 리셀러의 배정을 통째로 교체. set의 누락분은 삭제.
 * 트랜잭션 내에서 수행.
 * @param {number} accountId
 * @param {number[]} hospitalIds
 */
export async function setResellerHospitalIds(accountId, hospitalIds) {
  await ensurePlatformSchema();
  const db = await getDb();

  // 계정이 reseller 인지 확인
  const account = await db.get('SELECT id, role FROM admin_accounts WHERE id = ?', [accountId]);
  if (!account) throw new Error('계정을 찾을 수 없습니다.');
  if (account.role !== 'reseller') throw new Error('리셀러 계정만 업체 배정이 가능합니다.');

  const targets = [...new Set((hospitalIds || []).map(Number).filter((n) => Number.isInteger(n) && n > 0))];

  // 유효성: 존재하는 업체만 통과
  if (targets.length) {
    const placeholders = targets.map(() => '?').join(',');
    const valid = await db.all(`SELECT id FROM hospitals WHERE id IN (${placeholders})`, targets);
    const validIds = new Set(valid.map((r) => r.id));
    for (const id of targets) {
      if (!validIds.has(id)) throw new Error(`존재하지 않는 업체 ID: ${id}`);
    }
  }

  await db.run('BEGIN');
  try {
    await db.run('DELETE FROM reseller_assignments WHERE account_id = ?', [accountId]);
    for (const hid of targets) {
      await db.run(
        'INSERT INTO reseller_assignments (account_id, hospital_id) VALUES (?, ?)',
        [accountId, hid]
      );
    }
    await db.run('COMMIT');
  } catch (e) {
    await db.run('ROLLBACK');
    throw e;
  }
  return targets;
}

/**
 * 모든 리셀러 계정 + 배정된 업체 수 (super_admin 화면용).
 */
export async function listResellerAccountsWithCounts() {
  await ensurePlatformSchema();
  const db = await getDb();
  return db.all(
    `SELECT a.id, a.email, a.display_name, a.status, a.created_at,
            COALESCE(c.assigned_count, 0) AS assigned_count
       FROM admin_accounts a
       LEFT JOIN (
         SELECT account_id, COUNT(*) AS assigned_count
           FROM reseller_assignments
          GROUP BY account_id
       ) c ON c.account_id = a.id
      WHERE a.role = 'reseller'
      ORDER BY a.created_at DESC`
  );
}

/**
 * 리셀러 세션이 특정 업체에 접근 가능한지 검증.
 */
export async function resellerCanAccessHospital(accountId, hospitalId) {
  if (!accountId || !hospitalId) return false;
  await ensurePlatformSchema();
  const db = await getDb();
  const row = await db.get(
    'SELECT 1 FROM reseller_assignments WHERE account_id = ? AND hospital_id = ?',
    [accountId, hospitalId]
  );
  return Boolean(row);
}
