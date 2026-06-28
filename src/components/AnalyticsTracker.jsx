'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';

export default function AnalyticsTracker() {
  const pathname = usePathname();

  useEffect(() => {
    // 어드민 경로는 추적 제외
    if (!pathname || pathname.startsWith('/admin') || pathname.startsWith('/api/')) return;

    // 세션 ID 발급 (브라우저 세션 동안 유지)
    let sessionId = sessionStorage.getItem('mtlk_sid');
    if (!sessionId) {
      sessionId = Date.now().toString(36) + Math.random().toString(36).slice(2, 10);
      sessionStorage.setItem('mtlk_sid', sessionId);
    }

    fetch('/api/analytics/track', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'same-origin',
      body: JSON.stringify({
        path: pathname,
        referrer: document.referrer || '',
        sessionId,
      }),
      keepalive: true,
    }).catch(() => {});
  }, [pathname]);

  return null;
}
