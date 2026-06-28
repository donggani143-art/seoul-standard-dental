import { NextResponse } from 'next/server';
import { loadQuestionnaire } from '@/lib/salesShare';
import { isDriveReady, getParentFolderId, findOrCreateFolder, uploadFileToFolder } from '@/lib/googleDrive';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

// POST (multipart/form-data) — 질문지 파일 업로드 → 구글 드라이브 "거래처명" 폴더에 저장
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

    const form = await request.formData();
    const files = form.getAll('files').filter((f) => typeof f === 'object' && f && f.arrayBuffer);
    if (files.length === 0) return NextResponse.json({ error: '업로드할 파일이 없습니다.' }, { status: 400 });

    const folderName = info.prospect?.name || `거래처-${info.prospect?.id || ''}`;
    const folder = await findOrCreateFolder(folderName, getParentFolderId());

    const uploaded = [];
    for (const file of files) {
      const buf = Buffer.from(await file.arrayBuffer());
      const r = await uploadFileToFolder({
        token: folder.token,
        folderId: folder.id,
        filename: file.name || 'file',
        mimeType: file.type || 'application/octet-stream',
        buffer: buf,
      });
      uploaded.push({ name: r.name, link: r.webViewLink });
    }

    return NextResponse.json({ success: true, folderUrl: folder.webViewLink, folderName, files: uploaded });
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