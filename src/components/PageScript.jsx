'use client';

import { useEffect, useRef } from 'react';

export default function PageScript({ js }) {
  const executed = useRef(false);

  useEffect(() => {
    if (!js?.trim() || executed.current) return;
    executed.current = true;

    // DynamicHtml이 DOM에 삽입을 완료할 때까지 다음 tick으로 지연
    const timer = setTimeout(() => {
      // DOMContentLoaded 리스너를 즉시 실행되도록 가로챈다
      const origAdd = document.addEventListener.bind(document);
      document.addEventListener = function (type, listener, options) {
        if (type === 'DOMContentLoaded') {
          setTimeout(listener, 0);
          return;
        }
        return origAdd(type, listener, options);
      };

      try {
        // <script> 태그가 들어있으면 자동 제거 (사용자 실수 보정)
        const cleaned = js.replace(/<\/?script[^>]*>/gi, '').trim();
        const fn = new Function(cleaned);
        fn.call(window);
      } catch (err) {
        console.error('[PageScript] 실행 오류:', err);
      } finally {
        document.addEventListener = origAdd;
      }
    }, 0);

    return () => clearTimeout(timer);
  }, []);

  return null;
}
