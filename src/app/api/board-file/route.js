import fs from 'node:fs/promises';
import path from 'node:path';
import { NextResponse } from 'next/server';
import { getAdminRequestSession, isAdminApiRequest } from '@/lib/adminAuth';
import {
  ensureUploadDir,
  getUploadPublicUrl,
  resolveUploadPath,
  sanitizeUploadSegment,
} from '@/lib/uploads';
import { getDb } from '@/lib/db';
import { ensurePlatformSchema } from '@/lib/platform';

const maxUploadSize = 10 * 1024 * 1024; // 10MB
// hwp 등은 MIME이 불안정하므로 확장자로 검증
const allowedExtensions = new Set(['hwp', 'hwpx', 'pdf', 'jpg', 'jpeg', 'png', 'gif', 'webp']);

async function resolveHospitalSlug(session, bodyHospitalId) {
  let hospitalId = null;
  if (session) {
    hospitalId = session.role === 'super_admin'
      ? (session.impersonateHospitalId ?? null)
      : (session.hospitalId ?? null);
  }
  if (!hospitalId && bodyHospitalId != null && bodyHospitalId !== '') {
    const n = Number(bodyHospitalId);
    if (Number.isFinite(n)) hospitalId = n;
  }
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

  try {
    const formData = await request.formData();
    const file = formData.get('file');

    if (!file || typeof file.arrayBuffer !== 'function') {
      return NextResponse.json({ error: '파일이 필요합니다.' }, { status: 400 });
    }

    const originalName = String(file.name || 'file');
    const ext = path.extname(originalName).replace('.', '').toLowerCase();

    if (!allowedExtensions.has(ext)) {
      return NextResponse.json(
        { error: 'hwp · pdf · 이미지(jpg·png·gif·webp) 파일만 첨부할 수 있습니다.' },
        { status: 400 }
      );
    }

    if (Number(file.size || 0) > maxUploadSize) {
      return NextResponse.json({ error: '첨부파일은 10MB 미만만 가능합니다.' }, { status: 400 });
    }

    const hospitalSlug = await resolveHospitalSlug(session, formData.get('hospital_id'));
    await ensureUploadDir('hospitals', hospitalSlug, 'boards');

    const baseName = sanitizeUploadSegment(path.basename(originalName, path.extname(originalName)));
    const fileName = `${Date.now()}-${baseName || 'file'}.${ext}`;
    const targetPath = resolveUploadPath('hospitals', hospitalSlug, 'boards', fileName);
    const buffer = Buffer.from(await file.arrayBuffer());
    await fs.writeFile(targetPath, buffer);

    const publicPath = getUploadPublicUrl('hospitals', hospitalSlug, 'boards', fileName);

    return NextResponse.json({
      success: true,
      url: publicPath,
      name: originalName,
      size: Number(file.size || 0),
      type: String(file.type || ''),
    });
  } catch (error) {
    return NextResponse.json(
      { error: error.message || '파일 업로드 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
