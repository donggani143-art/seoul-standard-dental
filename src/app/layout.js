import '@/app/globals.css';
import { getGeoSettings, getGlobalSnippets } from '@/lib/seo';

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
};

// 병원별 favicon을 metadata API로 설정 → Next.js 자동 favicon.ico를 덮어씀
export async function generateMetadata() {
  const geo = await getGeoSettings();
  const faviconUrl = geo?.favicon_url?.trim();
  return {
    icons: faviconUrl
      ? {
          icon: [{ url: faviconUrl, sizes: 'any' }],
          shortcut: [{ url: faviconUrl }],
          apple: [{ url: faviconUrl }],
        }
      : undefined,
  };
}

// HTML 스니펫에서 <meta>·<link> 태그를 안전하게 추출해 React 엘리먼트로 변환.
// (head 안에 <span> 같은 래퍼가 들어가면 브라우저 파서가 body 로 옮겨 — 네이버 등 검색엔진
//  사이트 인증이 인식하지 못함. 그래서 태그를 파싱해 head 의 직계 자식으로 렌더한다.)
const REACT_ATTR_MAP = { 'http-equiv': 'httpEquiv', charset: 'charSet', crossorigin: 'crossOrigin', referrerpolicy: 'referrerPolicy' };
function parseHeadTags(html) {
  if (!html) return [];
  const out = [];
  const tagRe = /<(meta|link)\s+([^>]*?)\/?>/gi;
  const attrRe = /([a-zA-Z][\w:-]*)\s*=\s*"([^"]*)"/g;
  let m;
  while ((m = tagRe.exec(html)) !== null) {
    const attrs = {};
    let a;
    attrRe.lastIndex = 0;
    while ((a = attrRe.exec(m[2])) !== null) {
      const key = REACT_ATTR_MAP[a[1].toLowerCase()] || a[1];
      attrs[key] = a[2];
    }
    out.push({ tag: m[1].toLowerCase(), attrs });
  }
  return out;
}

export default async function RootLayout({ children }) {
  const snippets = await getGlobalSnippets();
  const headTags = parseHeadTags(snippets?.common_meta_tags || '');

  return (
    <html lang="ko">
      <head suppressHydrationWarning>
        {headTags.map((t, i) => (
          t.tag === 'link'
            ? <link key={`hd-${i}`} {...t.attrs} />
            : <meta key={`hd-${i}`} {...t.attrs} />
        ))}
      </head>
      <body>{children}</body>
    </html>
  );
}
