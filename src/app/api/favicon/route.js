import fs from 'node:fs/promises';
import path from 'node:path';
import { NextResponse } from 'next/server';
import { getAdminRequestSession } from '@/lib/adminAuth';
import { getDb } from '@/lib/db';
import { ensurePlatformSchema } from '@/lib/platform';
import {
  ensureUploadDir,
  getExtensionFromFile,
  getUploadPublicUrl,
  resolveUploadPath,
} from '@/lib/uploads';

const maxSize = 2 * 1024 * 1024;
const allowedTypes = new Set(['image/x-icon', 'image/vnd.microsoft.icon', 'image/png', 'image/svg+xml', 'image/jpeg', 'image/webp']);

async function resolveHospitalSlug(session) {
  const hospitalId = session?.role === 'super_admin'
    ? (session?.impersonateHospitalId ?? null)
    : (session?.hospitalId ?? null);
  if (!hospitalId) return 'shared';
  try {
    await ensurePlatformSchema();
    const db = await getDb();
    const h = await db.get('SELECT slug FROM hospitals WHERE id = ?', [hospitalId]);
    return h?.slug || 'shared';
  } catch {
    return 'shared';
  }
}

export async function POST(request) {
  const session = getAdminRequestSession(request);
  if (!session) return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 });

  try {
    const formData = await request.formData();
    const file = formData.get('file');

    if (!file || typeof file.arrayBuffer !== 'function') {
      return NextResponse.json({ error: '파비콘 파일이 필요합니다.' }, { status: 400 });
    }
    if (!allowedTypes.has(String(file.type || ''))) {
      return NextResponse.json({ error: 'ico/png/svg/jpg/webp만 업로드 가능합니다.' }, { status: 400 });
    }
    if (Number(file.size || 0) > maxSize) {
      return NextResponse.json({ error: '파비콘은 2MB 이하만 업로드 가능합니다.' }, { status: 400 });
    }

    const hospitalSlug = await resolveHospitalSlug(session);
    await ensureUploadDir('hospitals', hospitalSlug, 'favicon');

    const ext = getExtensionFromFile(file);
    const fileName = `favicon-${Date.now()}${ext}`;
    const targetPath = resolveUploadPath('hospitals', hospitalSlug, 'favicon', fileName);
    const buffer = Buffer.from(await file.arrayBuffer());
    await fs.writeFile(targetPath, buffer);

    const publicPath = getUploadPublicUrl('hospitals', hospitalSlug, 'favicon', fileName);
    return NextResponse.json({ success: true, url: publicPath });
  } catch (error) {
    return NextResponse.json({ error: error.message || '파비콘 업로드 실패' }, { status: 500 });
  }
}
