import { NextResponse } from 'next/server';
import { requireSalesAuth, assertOwnedProspect } from '@/lib/salesAuth';
import { getDb } from '@/lib/db';
import { ensurePlatformSchema } from '@/lib/platform';
import { isDriveReady, getParentFolderId, findOrCreateFolder, createResumableSession } from '@/lib/googleDrive';

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

// 브라우저 직접 업로드(드라이브 resumable) 세션 발급.
// 파일 본문은 브라우저 → 구글 서버로 바로 전송되어 앱 서버를 거치지 않는다(대용량 가능).
export async function POST(request, { params }) {
  const { res, pid } = await guardReq(request, params);
  if (res) return res;
  try {
    await ensurePlatformSchema();
    const db = await getDb();
    if (!(await isDriveReady())) {
      return NextResponse.json({ error: 'DRIVE_NOT_CONFIGURED', message: '파일 보관소(구글 드라이브)가 설정되지 않았습니다. 슈퍼관리자 대시보드의 "파일 보관소 재연결"을 진행해 주세요.' }, { status: 503 });
    }

    let body;
    try { body = await request.json(); } catch { body = {}; }
    const name = String(body?.name || '').trim();
    if (!name) return NextResponse.json({ error: '파일 이름이 필요합니다.' }, { status: 400 });

    const prospect = await db.get('SELECT name FROM sales_prospects WHERE id = ?', [pid]);
    const folder = await findOrCreateFolder(prospect?.name || `거래처-${pid}`, getParentFolderId());

    const origin = request.headers.get('origin') || '';
    const uploadUrl = await createResumableSession({
      folderId: folder.id,
      filename: name,
      mimeType: String(body?.type || '') || 'application/octet-stream',
      fileSize: Number(body?.size) || 0,
      origin,
      token: folder.token,
    });

    // 폴더 URL을 미리 저장(업로드 완료 전이라도 폴더 링크 노출)
    const row = await db.get('SELECT drive_files_json FROM sales_clinic_info WHERE prospect_id = ?', [pid]);
    let store = { folderUrl: '', files: [] };
    try { if (row?.drive_files_json) store = { ...store, ...JSON.parse(row.drive_files_json) }; } catch { /* */ }
    if (!Array.isArray(store.files)) store.files = [];
    store.folderUrl = folder.webViewLink || store.folderUrl;
    await db.run(
      `INSERT INTO sales_clinic_info (prospect_id, drive_files_json) VALUES (?, ?)
       ON CONFLICT(prospect_id) DO UPDATE SET drive_files_json = excluded.drive_files_json, updated_at = CURRENT_TIMESTAMP`,
      [pid, JSON.stringify(store)]
    );

    return NextResponse.json({ success: true, uploadUrl, folderUrl: folder.webViewLink || '' });
  } catch (e) {
    if (e.code === 'AUTH_EXPIRED') {
      return NextResponse.json({ error: 'DRIVE_AUTH_EXPIRED', message: '파일 보관소 인증이 만료되었습니다. 슈퍼관리자 대시보드의 "파일 보관소 재연결"을 진행해 주세요.' }, { status: 503 });
    }
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
