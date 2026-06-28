import { NextResponse } from 'next/server';
import { requireSalesAuth, assertOwnedProspect } from '@/lib/salesAuth';
import { getDb } from '@/lib/db';
import { ensurePlatformSchema } from '@/lib/platform';

export const dynamic = 'force-dynamic';

async function guardReq(request, params) {
  const auth = requireSalesAuth(request);
  if (auth.error) return { res: NextResponse.json({ error: auth.error }, { status: auth.status }) };
  const { id } = await params;
  const pid = Number(id);
  if (!Number.isFinite(pid)) return { res: NextResponse.json({ error: 'id 오류' }, { status: 400 }) };
  const g = await assertOwnedProspect(auth.session, pid);
  if (g.error) return { res: NextResponse.json({ error: g.error }, { status: g.status }) };
  return { pid };
}

// 거래처의 파일 목록 = 관리자 업로드(drive_files_json) + 질문지 업로드(answers_json.drive_files) 병합
async function loadFiles(db, pid) {
  const row = await db.get('SELECT drive_files_json, answers_json FROM sales_clinic_info WHERE prospect_id = ?', [pid]);
  let store = { folderUrl: '', files: [] };
  try { if (row?.drive_files_json) store = { ...store, ...JSON.parse(row.drive_files_json) }; } catch { /* */ }
  if (!Array.isArray(store.files)) store.files = [];
  let qFiles = [], qFolder = '';
  try {
    const a = row?.answers_json ? JSON.parse(row.answers_json) : null;
    if (a) { if (Array.isArray(a.drive_files)) qFiles = a.drive_files; qFolder = a.drive_folder_url || ''; }
  } catch { /* */ }
  const files = [
    ...qFiles.filter((f) => f && f.name).map((f) => ({ name: f.name, link: f.link || '', source: '질문지' })),
    ...store.files.filter((f) => f && f.name).map((f) => ({ name: f.name, link: f.link || '', at: f.at || '', source: f.source || '관리자' })),
  ];
  return { folderUrl: store.folderUrl || qFolder || '', files };
}

// 브라우저 직접 업로드 완료 후 파일 메타(name·link)를 목록에 기록
export async function POST(request, { params }) {
  const { res, pid } = await guardReq(request, params);
  if (res) return res;
  try {
    await ensurePlatformSchema();
    const db = await getDb();

    let body;
    try { body = await request.json(); } catch { body = {}; }
    const name = String(body?.name || '').trim().slice(0, 300);
    const link = String(body?.link || '').trim().slice(0, 1000);
    if (!name) return NextResponse.json({ error: '파일 이름이 필요합니다.' }, { status: 400 });
    if (link && !/^https:\/\/(drive|docs)\.google\.com\//.test(link)) {
      return NextResponse.json({ error: '유효하지 않은 파일 링크입니다.' }, { status: 400 });
    }

    const row = await db.get('SELECT drive_files_json FROM sales_clinic_info WHERE prospect_id = ?', [pid]);
    let store = { folderUrl: '', files: [] };
    try { if (row?.drive_files_json) store = { ...store, ...JSON.parse(row.drive_files_json) }; } catch { /* */ }
    if (!Array.isArray(store.files)) store.files = [];
    store.files = [...store.files, { name, link, at: new Date().toISOString().slice(0, 10), source: '관리자' }];
    await db.run(
      `INSERT INTO sales_clinic_info (prospect_id, drive_files_json) VALUES (?, ?)
       ON CONFLICT(prospect_id) DO UPDATE SET drive_files_json = excluded.drive_files_json, updated_at = CURRENT_TIMESTAMP`,
      [pid, JSON.stringify(store)]
    );

    const data = await loadFiles(db, pid);
    return NextResponse.json({ success: true, files: data.files, folderUrl: data.folderUrl });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
