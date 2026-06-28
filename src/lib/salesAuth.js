import { getAdminRequestSession, isAdminApiRequest } from '@/lib/adminAuth';
import { getDb } from '@/lib/db';
import { ensurePlatformSchema } from '@/lib/platform';

// 영업관리 API 공통 권한 가드
// - reseller 본인 prospects 만 접근 가능
// - super_admin 은 전체 접근
// - 그 외 (hospital_admin / 비로그인 / 토큰만) → 거부

export function getSalesSession(request) {
  const session = getAdminRequestSession(request);
  if (!session) return null;
  if (session.role === 'reseller' || session.role === 'super_admin') return session;
  return null;
}

export function requireSalesAuth(request) {
  if (!isAdminApiRequest(request)) return { error: '인증이 필요합니다.', status: 401 };
  const session = getSalesSession(request);
  if (!session) return { error: '영업관리 접근 권한이 없습니다.', status: 403 };
  return { session };
}

// 본인 prospect 인지 검증
export async function assertOwnedProspect(session, prospectId) {
  const db = await getDb();
  const row = await db.get('SELECT id, reseller_account_id FROM sales_prospects WHERE id = ?', [prospectId]);
  if (!row) return { error: '거래처를 찾을 수 없습니다.', status: 404 };
  if (session.role === 'super_admin') return { row };
  if (row.reseller_account_id !== session.accountId) {
    return { error: '접근 권한이 없습니다.', status: 403 };
  }
  return { row };
}

// 신규 리셀러 가입 직후·첫 영업모듈 접근 시 카테고리 7종 기본 시드 (멱등)
const DEFAULT_CATEGORIES = [
  { name: '계약',   color: '#1a6b4a' },
  { name: '디자인', color: '#1d4ed8' },
  { name: '개발',   color: '#7c3aed' },
  { name: '납품',   color: '#0d9488' },
  { name: '콘텐츠', color: '#d97706' },
  { name: 'SEO',    color: '#0891b2' },
  { name: '기타',   color: '#6b7280' },
];

export async function ensureDefaultTaskCategories(resellerAccountId) {
  await ensurePlatformSchema();
  const db = await getDb();
  const existing = await db.get(
    'SELECT COUNT(*) AS c FROM sales_task_categories WHERE reseller_account_id = ?',
    [resellerAccountId]
  );
  if (existing && existing.c > 0) return;
  for (let i = 0; i < DEFAULT_CATEGORIES.length; i++) {
    const cat = DEFAULT_CATEGORIES[i];
    await db.run(
      `INSERT OR IGNORE INTO sales_task_categories (reseller_account_id, name, color, sort_order)
       VALUES (?, ?, ?, ?)`,
      [resellerAccountId, cat.name, cat.color, i]
    );
  }
}
