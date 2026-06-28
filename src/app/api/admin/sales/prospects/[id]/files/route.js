import { NextResponse } from 'next/server';
import { requireSalesAuth, assertOwnedProspect } from '@/lib/salesAuth';
import { getDb } from '@/lib/db';
import { ensurePlatformSchema } from '@/lib/platform';
import { isDriveReady, getParentFolderId, findOrCreateFolder, uploadFileToFolder } from '@/lib/googleDrive';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

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

export async function GET(request, { params }) {
  const { res, pid } = await guardReq(request, params);
  if (res) return res;
  await ensurePlatformSchema();
  const db = await getDb();
  const data = await loadFiles(db, pid);
  data.driveReady = await isDriveReady();
  return NextResponse.json(data);
}

export async function POST(request, { params }) {
  const { res, pid } = await guardReq(request, params);
  if (res) return res;
  try {
    await ensurePlatformSchema();
    const db = await getDb();
    if (!(await isDriveReady())) {
      return NextResponse.json({ error: 'DRIVE_NOT_CONFIGURED', message: '파일 보관소(구글 드라이브)가 설정되지 않았습니다. 슈퍼관리자 대시보드의 "파일 보관소 재연결"을 진행해 주세요.' }, { status: 503 });
    }
    const prospect = await db.get('SELECT name FROM sales_prospects WHERE id = ?', [pid]);
    const form = await request.formData();
    const files = form.getAll('files').filter((f) => typeof f === 'object' && f && f.arrayBuffer);
    if (!files.length) return NextResponse.json({ error: '업로드할 파일이 없습니다.' }, { status: 400 });

    const folder = await findOrCreateFolder(prospect?.name || `거래처-${pid}`, getParentFolderId());
    const today = new Date().toISOString().slice(0, 10);
    const uploaded = [];
    for (const file of files) {
      const buf = Buffer.from(await file.arrayBuffer());
      const r = await uploadFileToFolder({
        token: folder.token, folderId: folder.id,
        filename: file.name || 'file', mimeType: file.type || 'application/octet-stream', buffer: buf,
      });
      uploaded.push({ name: r.name, link: r.webViewLink, at: today, source: '관리자' });
    }

    const row = await db.get('SELECT drive_files_json FROM sales_clinic_info WHERE prospect_id = ?', [pid]);
    let store = { folderUrl: '', files: [] };
    try { if (row?.drive_files_json) store = { ...store, ...JSON.parse(row.drive_files_json) }; } catch { /* */ }
    if (!Array.isArray(store.files)) store.files = [];
    store.folderUrl = folder.webViewLink || store.folderUrl;
    store.files = [...store.files, ...uploaded];
    await db.run(
      `INSERT INTO sales_clinic_info (prospect_id, drive_files_json) VALUES (?, ?)
       ON CONFLICT(prospect_id) DO UPDATE SET drive_files_json = excluded.drive_files_json, updated_at = CURRENT_TIMESTAMP`,
      [pid, JSON.stringify(store)]
    );
    const data = await loadFiles(db, pid);
    return NextResponse.json({ success: true, folderUrl: folder.webViewLink, uploaded, files: data.files });
  } catch (e) {
    if (e.code === 'AUTH_EXPIRED') {
      return NextResponse.json({ error: 'DRIVE_AUTH_EXPIRED', message: '파일 보관소 인증이 만료되었습니다. 슈퍼관리자 대시보드의 "파일 보관소 재연결"을 진행해 주세요.' }, { status: 503 });
    }
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
