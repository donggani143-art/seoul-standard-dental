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

/**
 * 병원 슬러그를 조회한다.
 * - 세션 인증: 세션의 hospitalId (super_admin은 impersonate 대상)
 * - API 토큰 인증(세션 없음): formData 의 hospital_id 사용
 * - 조회 실패 시 'shared' 폴더 사용
 */
async function resolveHospitalSlug(session, bodyHospitalId) {
  let hospitalId = null;
  if (session) {
    hospitalId = session.role === 'super_admin'
      ? (session.impersonateHospitalId ?? null)
      : (session.hospitalId ?? null);
  }
  // 세션에 병원이 없으면(=토큰 인증) body의 hospital_id 허용
  if (!hospitalId && bodyHospitalId != null && bodyHospitalId !== '') {
    const n = Number(bodyHospitalId);
    if (Number.isFinite(n)) hospitalId = n;
  }

  if (!hospitalId) {
    return 'shared';
  }

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
  // 세션(쿠키) 또는 API 토큰(Authorization: Bearer) 인증 허용
  if (!isAdminApiRequest(request)) {
    return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 });
  }
  const session = getAdminRequestSession(request);

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

    // 토큰 인증 시 formData 의 hospital_id 로 병원 폴더 결정
    const hospitalSlug = await resolveHospitalSlug(session, formData.get('hospital_id'));

    await ensureUploadDir('hospitals', hospitalSlug, 'boards');

    const extension = getExtensionFromFile(file);
    const nameWithoutExt = sanitizeUploadSegment(
      path.basename(file.name || 'board-image', path.extname(file.name || ''))
    );
    const fileName = `${Date.now()}-${nameWithoutExt || 'board-image'}${extension}`;
    const targetPath = resolveUploadPath('hospitals', hospitalSlug, 'boards', fileName);
    const buffer = Buffer.from(await file.arrayBuffer());

    await fs.writeFile(targetPath, buffer);

    const publicPath = getUploadPublicUrl('hospitals', hospitalSlug, 'boards', fileName);

    return NextResponse.json({
      success: true,
      url: publicPath,
      path: publicPath,
      fileName,
      contentType: String(file.type || ''),
      tagTemplate: `<img src="${publicPath}" alt="" />`,
    });
  } catch (error) {
    return NextResponse.json(
      { error: error.message || '이미지 업로드 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
