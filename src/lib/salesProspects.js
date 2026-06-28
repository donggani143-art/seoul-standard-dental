import { getDb } from '@/lib/db';
import { ensurePlatformSchema } from '@/lib/platform';

export const PROSPECT_STATUSES = ['lead', 'contracted', 'won', 'lost', 'paused'];
// 거래처 구분: sales=실제 영업, intake=일반 접수
export const PROSPECT_CATEGORIES = ['sales', 'intake'];

export async function listProspects({ resellerAccountId, includeAll = false } = {}) {
  await ensurePlatformSchema();
  const db = await getDb();
  const conditions = [];
  const params = [];
  if (!includeAll && resellerAccountId !== undefined && resellerAccountId !== null) {
    conditions.push('p.reseller_account_id = ?');
    params.push(resellerAccountId);
  }
  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
  return db.all(
    `
      SELECT p.*, h.name AS hospital_name, h.slug AS hospital_slug,
             ra.display_name AS reseller_name, ra.email AS reseller_email
      FROM sales_prospects p
      LEFT JOIN hospitals h ON h.id = p.linked_hospital_id
      LEFT JOIN admin_accounts ra ON ra.id = p.reseller_account_id
      ${where}
      ORDER BY p.updated_at DESC, p.id DESC
    `,
    params
  );
}

export async function getProspect(id) {
  await ensurePlatformSchema();
  const db = await getDb();
  return db.get(
    `
      SELECT p.*, h.name AS hospital_name, h.slug AS hospital_slug
      FROM sales_prospects p
      LEFT JOIN hospitals h ON h.id = p.linked_hospital_id
      WHERE p.id = ?
    `,
    [id]
  );
}

export async function createProspect({ resellerAccountId, name, doctorName = '', phone = '', addr = '', memo = '', category = 'sales' }) {
  await ensurePlatformSchema();
  const cleanName = String(name || '').trim();
  if (!cleanName) {
    const err = new Error('거래처명을 입력해 주세요.');
    err.code = 'INVALID_NAME';
    throw err;
  }
  const db = await getDb();
  const dup = await db.get(
    'SELECT id FROM sales_prospects WHERE reseller_account_id = ? AND name = ?',
    [resellerAccountId, cleanName]
  );
  if (dup) {
    const err = new Error('이미 동일한 이름의 거래처가 있습니다.');
    err.code = 'DUP_NAME';
    throw err;
  }
  const cat = PROSPECT_CATEGORIES.includes(category) ? category : 'sales';
  const result = await db.run(
    `INSERT INTO sales_prospects (reseller_account_id, name, doctor_name, phone, addr, memo, category, status)
     VALUES (?, ?, ?, ?, ?, ?, ?, 'lead')`,
    [resellerAccountId, cleanName, String(doctorName || ''), String(phone || ''), String(addr || ''), String(memo || ''), cat]
  );
  return result.lastID;
}

export async function updateProspect(id, patch = {}) {
  await ensurePlatformSchema();
  const db = await getDb();
  const allowed = ['name', 'doctor_name', 'phone', 'addr', 'memo', 'status', 'category'];
  const sets = [];
  const params = [];
  for (const key of allowed) {
    if (patch[key] !== undefined) {
      if (key === 'status' && !PROSPECT_STATUSES.includes(patch[key])) continue;
      if (key === 'category' && !PROSPECT_CATEGORIES.includes(patch[key])) continue;
      sets.push(`${key} = ?`);
      params.push(patch[key]);
    }
  }
  if (!sets.length) return { changes: 0 };
  sets.push('updated_at = CURRENT_TIMESTAMP');
  params.push(id);
  const result = await db.run(`UPDATE sales_prospects SET ${sets.join(', ')} WHERE id = ?`, params);
  return { changes: result.changes };
}

export async function deleteProspect(id) {
  await ensurePlatformSchema();
  const db = await getDb();
  // 승격(linked_hospital_id != null)된 거래처는 삭제 막음 — 운영 데이터 보존
  const row = await db.get('SELECT linked_hospital_id FROM sales_prospects WHERE id = ?', [id]);
  if (!row) return { changes: 0 };
  if (row.linked_hospital_id) {
    const err = new Error('이미 운영 업체로 승격된 거래처는 삭제할 수 없습니다. 상태를 변경해 주세요.');
    err.code = 'PROMOTED';
    throw err;
  }
  const result = await db.run('DELETE FROM sales_prospects WHERE id = ?', [id]);
  return { changes: result.changes };
}
