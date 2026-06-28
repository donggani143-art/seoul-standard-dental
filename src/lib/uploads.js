import fs from 'node:fs/promises';
import path from 'node:path';

const imageExtensionsByMime = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
  'image/gif': '.gif',
  'image/svg+xml': '.svg',
  'image/avif': '.avif',
};

export function getUploadRoot() {
  if (process.env.UPLOAD_ROOT) {
    return process.env.UPLOAD_ROOT;
  }

  const cwd = process.cwd();
  const standaloneSuffix = path.join('.next', 'standalone');

  if (cwd.endsWith(standaloneSuffix)) {
    return path.resolve(cwd, '..', '..', '..', 'uploads');
  }

  return path.resolve(cwd, 'uploads');
}

export function sanitizeUploadSegment(value) {
  return String(value || '')
    .replace(/[^a-zA-Z0-9._-]+/g, '-')
    .replace(/-{2,}/g, '-')
    .replace(/^-+|-+$/g, '');
}

export function getExtensionFromFile(file) {
  const byMime = imageExtensionsByMime[file?.type];
  if (byMime) {
    return byMime;
  }

  const ext = path.extname(file?.name || '').toLowerCase();
  return ext || '.bin';
}

export async function ensureUploadDir(...segments) {
  const target = resolveUploadPath(...segments);
  await fs.mkdir(target, { recursive: true });
  return target;
}

export function resolveUploadPath(...segments) {
  const root = path.resolve(getUploadRoot());
  const target = path.resolve(root, ...segments);
  const rootWithSep = `${root}${path.sep}`;

  if (target !== root && !target.startsWith(rootWithSep)) {
    throw new Error('Invalid upload path');
  }

  return target;
}

export function getUploadPublicUrl(...segments) {
  return `/uploads/${segments.map((segment) => sanitizeUploadSegment(segment)).join('/')}`;
}

export function getContentTypeFromFilename(filename) {
  const ext = path.extname(filename).toLowerCase();

  switch (ext) {
    case '.jpg':
    case '.jpeg':
      return 'image/jpeg';
    case '.png':
      return 'image/png';
    case '.gif':
      return 'image/gif';
    case '.webp':
      return 'image/webp';
    case '.svg':
      return 'image/svg+xml';
    case '.avif':
      return 'image/avif';
    default:
      return 'application/octet-stream';
  }
}
