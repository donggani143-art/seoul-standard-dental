import fs from 'node:fs/promises';
import { NextResponse } from 'next/server';
import { getContentTypeFromFilename, resolveUploadPath, sanitizeUploadSegment } from '@/lib/uploads';

export async function GET(_request, { params }) {
  try {
    const { slug } = await params;
    const segments = Array.isArray(slug) ? slug.map((item) => sanitizeUploadSegment(item)).filter(Boolean) : [];

    if (!segments.length) {
      return new NextResponse('Not found', { status: 404 });
    }

    const filePath = resolveUploadPath(...segments);
    const body = await fs.readFile(filePath);
    const filename = segments[segments.length - 1];

    return new NextResponse(body, {
      status: 200,
      headers: {
        'Content-Type': getContentTypeFromFilename(filename),
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    });
  } catch {
    return new NextResponse('Not found', { status: 404 });
  }
}
