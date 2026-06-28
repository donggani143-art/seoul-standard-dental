'use client';

import { useEffect, useRef, useState } from 'react';

export default function DynamicHtml({ html, className }) {
  const containerRef = useRef(null);
  const [ready, setReady] = useState(false);

  // 첫 렌더 후 1회만 스크립트 실행
  useEffect(() => {
    if (ready || !containerRef.current || !html) return;
    setReady(true);

    // setTimeout으로 React Strict Mode 더블 실행 방지
    const timer = setTimeout(() => {
      const container = containerRef.current;
      if (!container) return;

      container.querySelectorAll('script').forEach(orig => {
        if (orig.dataset.executed) return;
        // JSON-LD 등 비실행 데이터 스크립트(application/ld+json 등)는 재실행하지 않는다.
        // SSR HTML에 그대로 남아 검색엔진이 읽으며, JS로 실행하면 오류가 난다.
        const type = (orig.type || '').toLowerCase();
        if (type && type !== 'text/javascript' && type !== 'application/javascript' && type !== 'module') return;
        orig.dataset.executed = '1';

        const script = document.createElement('script');
        if (orig.src) {
          script.src = orig.src;
        } else {
          script.textContent = orig.textContent;
        }
        orig.replaceWith(script);
      });
    }, 0);

    return () => clearTimeout(timer);
  }, [html, ready]);

  if (!html) return null;

  return (
    <div
      ref={containerRef}
      className={className}
      style={className ? undefined : { display: 'contents' }}
      suppressHydrationWarning
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
