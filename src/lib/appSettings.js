import { getDb } from '@/lib/db';
import { ensurePlatformSchema } from '@/lib/platform';

// 간단한 key-value 설정 저장소 (app_settings)
export async function getSetting(key) {
  await ensurePlatformSchema();
  const db = await getDb();
  const row = await db.get('SELECT v FROM app_settings WHERE k = ?', [key]);
  return row ? row.v : null;
}

export async function setSetting(key, value) {
  await ensurePlatformSchema();
  const db = await getDb();
  await db.run(
    `INSERT INTO app_settings (k, v) VALUES (?, ?)
     ON CONFLICT(k) DO UPDATE SET v = excluded.v, updated_at = CURRENT_TIMESTAMP`,
    [key, String(value ?? '')]
  );
}

export async function deleteSetting(key) {
  await ensurePlatformSchema();
  const db = await getDb();
  await db.run('DELETE FROM app_settings WHERE k = ?', [key]);
}