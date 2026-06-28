import fs from 'node:fs/promises';
import path from 'node:path';
import { NextResponse } from 'next/server';

// 관리 도메인 루트(/)에서 proxy(미들웨어)가 이 경로로 rewrite 한다.
// 정적 public/*.html 로의 미들웨어 rewrite 는 Next 가 내부 self-proxy(https)를 시도해 EPROTO 500 이 나므로,
// 여기서 public/landing/index.html 을 fs 로 직접 읽어 HTML 로 반환한다. (uploads 라우트와 동일 패턴)
const ADMIN_DOMAINS = new Set(
  (process.env.ADMIN_DOMAINS || process.env.ADMIN_DOMAIN || process.env.SITE_URL || 'metacms.kr')
    .split(',')
    .map((d) => d.replace(/^https?:\/\//, '').replace(/\/+$/, '').trim().toLowerCase())
    .filter(Boolean)
);

export async function GET(request) {
  // 관리 도메인에서만 노출 (테넌트 도메인에서 직접 접근 시 404 — 랜딩 유출 방지)
  const host = (request.headers.get('host') || '').split(':')[0].toLowerCase();
  if (!ADMIN_DOMAINS.has(host)) {
    return new NextResponse('Not found', { status: 404 });
  }

  try {
    const filePath = path.join(process.cwd(), 'public', 'landing', 'index.html');
    const html = await fs.readFile(filePath, 'utf8');
    return new NextResponse(html, {
      status: 200,
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Cache-Control': 'public, max-age=0, s-maxage=60, stale-while-revalidate=300',
      },
    });
  } catch {
    return new NextResponse('Landing not found', { status: 404 });
  }
}
