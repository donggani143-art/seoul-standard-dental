// 네이버 캐러셀 항목 이미지 업로드
// 저장 경로: /uploads/hospitals/{slug}/carousel/{ts}-{filename}.{ext}

import fs from 'node:fs/promises';
import path from 'node:path';
import { NextResponse } from 'next/server';
import { getAdminRequestSession, isAdminApiRequest } from '@/lib/adminAuth';
import {
  ensureUploadDir,
  getExtensionFromFile,
  getUploadPublicUrl,
  resolveUploadPath,
  sanitizeUploadSegment,
} from '@/lib/uploads';
import { getDb } from '@/lib/db';
import { ensurePlatformSchema } from '@/lib/platform';

const maxUploadSize = 10 * 1024 * 1024;
const allowedImageTypes = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/avif']);

async function resolveHospitalSlug(session) {
  const hospitalId = session?.role === 'super_admin'
    ? (session?.impersonateHospitalId ?? null)
    : (session?.hospitalId ?? null);
  if (!hospitalId) return 'shared';
  try {
    await ensurePlatformSchema();
    const db = await getDb();
    const hospital = await db.get('SELECT slug FROM hospitals WHERE id = ?', [hospitalId]);
    return hospital?.slug || 'shared';
  } catch {
    return 'shared';
  }
}

export async function POST(request) {
  if (!isAdminApiRequest(request)) {
    return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 });
  }
  const session = getAdminRequestSession(request);
  if (session?.role === 'reseller') {
    return NextResponse.json({ error: '접근 권한이 없습니다.' }, { status: 403 });
  }

  try {
    const formData = await request.formData();
    const file = formData.get('file');
    if (!file || typeof file.arrayBuffer !== 'function') {
      return NextResponse.json({ error: '이미지 파일이 필요합니다.' }, { status: 400 });
    }
    if (!allowedImageTypes.has(String(file.type || ''))) {
      return NextResponse.json({ error: '이미지 파일만 업로드할 수 있습니다.' }, { status: 400 });
    }
    if (Number(file.size || 0) > maxUploadSize) {
      return NextResponse.json({ error: '이미지는 10MB 이하만 업로드할 수 있습니다.' }, { status: 400 });
    }

    const hospitalSlug = await resolveHospitalSlug(session);
    await ensureUploadDir('hospitals', hospitalSlug, 'carousel');

    const extension = getExtensionFromFile(file);
    const nameWithoutExt = sanitizeUploadSegment(
      path.basename(file.name || 'carousel', path.extname(file.name || ''))
    );
    const fileName = `${Date.now()}-${nameWithoutExt || 'carousel'}${extension}`;
    const targetPath = resolveUploadPath('hospitals', hospitalSlug, 'carousel', fileName);
    const buffer = Buffer.from(await file.arrayBuffer());
    await fs.writeFile(targetPath, buffer);

    const publicPath = getUploadPublicUrl('hospitals', hospitalSlug, 'carousel', fileName);
    return NextResponse.json({
      success: true,
      url: publicPath,
      path: publicPath,
      fileName,
      contentType: String(file.type || ''),
    });
  } catch (error) {
    return NextResponse.json(
      { error: error.message || '이미지 업로드 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
