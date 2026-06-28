import { NextResponse } from 'next/server';
import { loadQuestionnaire } from '@/lib/salesShare';
import { isDriveReady, getParentFolderId, findOrCreateFolder, createResumableSession } from '@/lib/googleDrive';

export const dynamic = 'force-dynamic';

// 질문지 파일의 브라우저 직접 업로드(드라이브 resumable) 세션 발급.
// 파일 본문은 브라우저 → 구글 서버로 바로 전송되어 앱 서버를 거치지 않는다(대용량 가능).
export async function POST(request, { params }) {
  const { token } = await params;
  try {
    const info = await loadQuestionnaire(token);
    if (info.error) {
      const status = info.error === 'NOT_FOUND' ? 404 : 403;
      return NextResponse.json({ error: info.error }, { status });
    }
    if (!(await isDriveReady())) {
      return NextResponse.json({ error: 'DRIVE_NOT_CONFIGURED', message: '파일 보관소가 아직 설정되지 않았습니다. 파일 없이 제출해 주세요.' }, { status: 503 });
    }

    let body;
    try { body = await request.json(); } catch { body = {}; }
    const name = String(body?.name || '').trim();
    if (!name) return NextResponse.json({ error: '파일 이름이 필요합니다.' }, { status: 400 });

    const folderName = info.prospect?.name || `거래처-${info.prospect?.id || ''}`;
    const folder = await findOrCreateFolder(folderName, getParentFolderId());

    const origin = request.headers.get('origin') || '';
    const uploadUrl = await createResumableSession({
      folderId: folder.id,
      filename: name,
      mimeType: String(body?.type || '') || 'application/octet-stream',
      fileSize: Number(body?.size) || 0,
      origin,
      token: folder.token,
    });

    return NextResponse.json({ success: true, uploadUrl, folderUrl: folder.webViewLink || '', folderName });
  } catch (e) {
    if (e.code === 'AUTH_EXPIRED') {
      return NextResponse.json(
        { error: 'DRIVE_AUTH_EXPIRED', message: '파일 보관소 인증이 만료되어 파일은 저장되지 않았습니다. 파일 없이 제출을 계속해 주세요.' },
        { status: 503 }
      );
    }
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
