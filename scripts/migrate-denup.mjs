// denup.co.kr 마이그레이션 스크립트
// 사용: 서버에서 `node /tmp/migrate-denup.mjs` 로 실행 (DB와 같은 위치에 배치)
// hospital_id=8 (덴업) 기준

import sqlite3 from 'sqlite3';

const HOSPITAL_ID = 8;
const DB_PATH = process.argv[2] || './wonjudental.db';

// ── 공통 CSS (KRDS 토큰 기반) ───────────────────────────────────
const COMMON_CSS = `
@import url('https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/packages/pretendard-gov/dist/web/variable/pretendardvariable-gov.min.css');
:root {
  --color-primary-5:#EFF5FF; --color-primary-10:#D3E1FB; --color-primary-40:#5089EF; --color-primary-50:#244BEB; --color-primary-60:#1D56BC; --color-primary-70:#16408D; --color-primary-80:#0E2B5E;
  --color-secondary-50:#003675; --color-secondary-70:#002046;
  --color-gray-0:#FFFFFF; --color-gray-5:#F8F8F8; --color-gray-10:#F0F0F0; --color-gray-20:#E4E4E4; --color-gray-40:#C6C6C6; --color-gray-50:#8E8E8E; --color-gray-60:#717171; --color-gray-70:#555555; --color-gray-80:#2D2D2D; --color-gray-90:#1D1D1D;
  --color-info-50:#2764FF; --color-success-50:#00A61E; --color-danger-50:#EB003B; --color-warning-50:#FF9724;
  --denup-primary: var(--color-secondary-50);
  --denup-accent: var(--color-primary-50);
  --denup-accent-light: var(--color-primary-40);
  --denup-dark: var(--color-secondary-70);
  --denup-gray: var(--color-gray-70);
  --denup-light: var(--color-gray-5);
}
* { box-sizing: border-box; }
html { scroll-behavior: smooth; -webkit-text-size-adjust: 100%; text-size-adjust: 100%; }
body { margin: 0; padding: 0; font-family: 'Pretendard GOV Variable', 'Pretendard GOV', -apple-system, BlinkMacSystemFont, 'Apple SD Gothic Neo', 'Malgun Gothic', sans-serif; color: var(--color-gray-70); line-height: 1.5; word-break: keep-all; -webkit-font-smoothing: antialiased; }
section[id] { scroll-margin-top: 96px; }
:focus-visible { outline: 2px solid var(--color-primary-50); outline-offset: 2px; }
.sr-only { position: absolute; width: 1px; height: 1px; padding: 0; margin: -1px; overflow: hidden; clip: rect(0,0,0,0); white-space: nowrap; border: 0; }
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after { animation-duration: 0.01ms !important; animation-iteration-count: 1 !important; transition-duration: 0.01ms !important; scroll-behavior: auto !important; }
  .denup-fade { opacity: 1 !important; transform: none !important; }
}
.denup-wrap { max-width: 1280px; margin: 0 auto; padding: 0 24px; }
.denup-section { padding: 80px 0; }
.denup-section.dark { background: var(--color-secondary-50); color: var(--color-gray-0); }
.denup-section.light { background: var(--color-gray-5); }
.denup-eyebrow { display: inline-block; font-size: 0.9375rem; font-weight: 700; letter-spacing: 0.05em; color: var(--color-primary-50); text-transform: uppercase; margin-bottom: 16px; }
.denup-section.dark .denup-eyebrow { color: var(--color-primary-40); }
.denup-title { font-size: clamp(2rem, 4vw, 2.5rem); font-weight: 700; letter-spacing: -0.0625rem; line-height: 1.3; margin: 0 0 16px; color: var(--color-gray-90); }
.denup-section.dark .denup-title { color: var(--color-gray-0); }
.denup-subtitle { font-size: 1.0625rem; color: var(--color-gray-70); margin: 0 0 40px; max-width: 760px; line-height: 1.7; }
.denup-section.dark .denup-subtitle { color: var(--color-gray-20); }
.denup-grid { display: grid; gap: 24px; }
.denup-grid-3 { grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); }
.denup-grid-4 { grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); }
.denup-grid-2 { grid-template-columns: repeat(auto-fit, minmax(360px, 1fr)); }
.denup-card { background: var(--color-gray-0); border: 1px solid var(--color-gray-20); border-radius: 10px; padding: 32px 28px; transition: border-color var(--duration-base, 200ms) ease, box-shadow var(--duration-base, 200ms) ease; }
.denup-card:hover { border-color: var(--color-primary-50); box-shadow: 0 4px 16px rgba(36,75,235,0.08); }
.denup-section.dark .denup-card { background: rgba(255,255,255,0.06); border-color: rgba(255,255,255,0.12); }
.denup-section.dark .denup-card:hover { background: rgba(255,255,255,0.1); border-color: var(--color-primary-40); }
.denup-card-img { width: 72px; height: 72px; object-fit: contain; margin-bottom: 20px; }
.denup-card-icon { width: 56px; height: 56px; border-radius: 8px; background: var(--color-primary-5); display: flex; align-items: center; justify-content: center; margin-bottom: 20px; color: var(--color-primary-50); }
.denup-section.dark .denup-card-icon { background: rgba(80,137,239,0.18); color: var(--color-primary-40); }
.denup-process-item { position: relative; overflow: hidden; }
.denup-process-num { position: absolute; top: 16px; right: 20px; font-size: 36px; font-weight: 700; color: rgba(80,137,239,0.25); line-height: 1; letter-spacing: -0.0625rem; }
.denup-process-item h3 { color: var(--color-gray-0) !important; margin-top: 8px; }
.denup-process-item p { color: var(--color-gray-20) !important; }
.denup-card-title { font-size: 1.1875rem; font-weight: 700; margin: 0 0 12px; color: var(--color-gray-90); line-height: 1.4; }
.denup-section.dark .denup-card-title { color: var(--color-gray-0); }
.denup-card-desc { font-size: 0.9375rem; color: var(--color-gray-70); margin: 0; line-height: 1.7; }
.denup-section.dark .denup-card-desc { color: var(--color-gray-20); }
.denup-num { display: inline-flex; align-items: center; justify-content: center; width: 40px; height: 40px; border-radius: 8px; background: var(--color-primary-50); color: var(--color-gray-0); font-weight: 700; font-size: 1rem; margin-bottom: 16px; }
.denup-hero { position: relative; padding: 120px 0 96px; background: linear-gradient(180deg, var(--color-secondary-50) 0%, var(--color-secondary-70) 100%); color: var(--color-gray-0); overflow: hidden; }
.denup-hero::before { content: ''; position: absolute; top: -20%; right: -10%; width: 600px; height: 600px; background: radial-gradient(circle, rgba(36,75,235,0.20) 0%, transparent 70%); pointer-events: none; }
.denup-hero h1 { font-size: clamp(2.5rem, 5vw, 3.75rem); font-weight: 700; margin: 0 0 16px; line-height: 1.2; letter-spacing: -0.0625rem; color: var(--color-gray-0); }
.denup-hero .accent { color: var(--color-primary-40); }
.denup-hero p.sub { font-size: 1.25rem; font-weight: 600; color: var(--color-gray-10); margin: 0 0 12px; }
.denup-hero p.desc { font-size: 1.0625rem; color: var(--color-gray-20); margin: 0 0 24px; }
.denup-badge { display: inline-flex; align-items: center; gap: 8px; background: rgba(36,75,235,0.18); border: 1px solid rgba(80,137,239,0.4); padding: 8px 16px; border-radius: 8px; font-size: 0.9375rem; font-weight: 700; color: var(--color-primary-40); margin-bottom: 24px; }
.denup-stats { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 16px; margin: 40px 0; }
.denup-stat { background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.12); padding: 32px 24px; border-radius: 10px; text-align: center; }
.denup-stat-num { font-size: 2.5rem; font-weight: 700; color: var(--color-primary-40); margin: 0 0 8px; line-height: 1.1; }
.denup-stat-label { font-size: 0.9375rem; color: var(--color-gray-20); margin: 0; font-weight: 500; }
.denup-list { list-style: none; padding: 0; margin: 0; display: grid; gap: 12px; }
.denup-list li { display: flex; gap: 12px; align-items: flex-start; font-size: 1rem; }
.denup-list li::before { content: ''; flex-shrink: 0; width: 20px; height: 20px; border-radius: 4px; background: var(--color-primary-50); color: var(--color-gray-0); display: flex; align-items: center; justify-content: center; margin-top: 2px; background-image: url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='white' stroke-width='3' stroke-linecap='round' stroke-linejoin='round'><polyline points='20 6 9 17 4 12'/></svg>"); background-size: 14px; background-repeat: no-repeat; background-position: center; }
.denup-process { display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 20px; }
.denup-process-item { background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.12); border-radius: 10px; padding: 28px 24px; }
.denup-process-item h3 { font-size: 1.0625rem; font-weight: 700; margin: 0 0 8px; }
.denup-process-item p { font-size: 0.9375rem; margin: 0; line-height: 1.65; }
.denup-cta { background: var(--color-primary-50); color: var(--color-gray-0); text-align: center; padding: 80px 0; }
.denup-cta h2 { font-size: clamp(2rem, 4vw, 2.5rem); font-weight: 700; margin: 0 0 16px; letter-spacing: -0.0625rem; color: var(--color-gray-0); }
.denup-cta p { font-size: 1.0625rem; margin: 0 0 24px; opacity: 0.95; }
.denup-cta-btn { display: inline-flex; align-items: center; gap: 8px; background: var(--color-gray-0); color: var(--color-primary-50); font-weight: 700; font-size: 1.0625rem; padding: 14px 32px; border-radius: 8px; text-decoration: none; border: none; cursor: pointer; transition: background-color var(--duration-base, 200ms) ease; min-height: 56px; font-family: inherit; }
.denup-cta-btn:hover { background: var(--color-primary-5); }
.denup-cta-btn:focus-visible { outline: 3px solid var(--color-gray-0); outline-offset: 3px; }
.denup-service-block { background: var(--color-gray-0); border: 1px solid var(--color-gray-20); border-radius: 10px; padding: 40px; }
.denup-service-block h3 { font-size: 1.3125rem; font-weight: 700; margin: 0 0 20px; display: flex; align-items: center; gap: 12px; color: var(--color-gray-90); }
.denup-service-block h3::before { content: ''; width: 4px; height: 22px; background: var(--color-primary-50); border-radius: 2px; display: inline-block; }
@media (max-width: 768px) {
  .denup-section { padding: 56px 0; }
  .denup-hero { padding: 88px 0 64px; }
}

/* ── 히어로 캔버스 + CTA ── */
.denup-hero { position: relative; }
.denup-hero-canvas { position: absolute; inset: 0; width: 100%; height: 100%; z-index: 0; pointer-events: none; opacity: 0.5; }
.denup-hero-content { position: relative; z-index: 2; }
.denup-hero-cta { display: flex; gap: 12px; flex-wrap: wrap; margin-top: 32px; }
.denup-hero-btn { display: inline-flex; align-items: center; justify-content: center; gap: 8px; padding: 12px 32px; border-radius: 8px; font-size: 1.0625rem; font-weight: 700; text-decoration: none; cursor: pointer; border: 1px solid transparent; transition: background-color var(--duration-base, 200ms) ease, border-color var(--duration-base, 200ms) ease, color var(--duration-base, 200ms) ease; font-family: inherit; min-height: 56px; }
.denup-hero-btn.primary { background: var(--color-primary-50); color: var(--color-gray-0); }
.denup-hero-btn.primary:hover { background: var(--color-primary-60); }
.denup-hero-btn.primary:active { background: var(--color-primary-70); }
.denup-hero-btn.ghost { background: transparent; color: var(--color-gray-0); border-color: rgba(255,255,255,0.4); }
.denup-hero-btn.ghost:hover { background: rgba(255,255,255,0.1); border-color: var(--color-gray-0); }
.denup-hero-btn:focus-visible { outline: 3px solid var(--color-gray-0); outline-offset: 3px; }
.denup-hero-scroll-hint { position: absolute; bottom: 24px; left: 50%; transform: translateX(-50%); display: flex; flex-direction: column; align-items: center; gap: 6px; z-index: 2; color: rgba(255,255,255,0.5); font-size: 0.75rem; font-weight: 700; letter-spacing: 0.2em; pointer-events: none; }
.denup-scroll-line { width: 1px; height: 32px; background: linear-gradient(to bottom, rgba(255,255,255,0.5), transparent); animation: denupScrollPulse 1.6s ease-in-out infinite; }
@keyframes denupScrollPulse { 0%,100% { transform: scaleY(1); transform-origin: top; opacity: 1; } 50% { transform: scaleY(0.4); opacity: 0.4; } }
@media (max-width: 768px) { .denup-hero-scroll-hint { display: none; } }

/* ── 인터랙티브 탭 (KRDS Tab pattern) ── */
.denup-tabs { background: var(--color-gray-0); border: 1px solid var(--color-gray-20); border-radius: 10px; overflow: hidden; }
.denup-tab-nav { display: flex; border-bottom: 1px solid var(--color-gray-20); background: var(--color-gray-5); gap: 0; flex-wrap: wrap; }
.denup-tab-btn { flex: 1; min-width: 140px; padding: 18px 24px; background: transparent; border: none; border-bottom: 3px solid transparent; font-size: 1.0625rem; font-weight: 600; color: var(--color-gray-70); cursor: pointer; transition: color var(--duration-base, 200ms) ease, border-color var(--duration-base, 200ms) ease; font-family: inherit; min-height: 56px; }
.denup-tab-btn:hover { color: var(--color-primary-50); }
.denup-tab-btn:focus-visible { outline: 2px solid var(--color-primary-50); outline-offset: -2px; }
.denup-tab-btn.active { color: var(--color-primary-50); border-bottom-color: var(--color-primary-50); font-weight: 700; background: var(--color-gray-0); }
.denup-tab-panel { display: none; padding: 40px; animation: denupFadeIn 0.2s ease-out; }
.denup-tab-panel.active { display: block; }
@keyframes denupFadeIn { from { opacity: 0; } to { opacity: 1; } }
.denup-tab-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 32px; }
.denup-tab-num { display: inline-block; font-size: 1.75rem; font-weight: 700; color: var(--color-primary-50); line-height: 1; margin-bottom: 12px; letter-spacing: -0.0625rem; }
.denup-tab-grid h4 { font-size: 1.0625rem; font-weight: 700; color: var(--color-gray-90); margin: 0 0 8px; }
.denup-tab-grid p { font-size: 0.9375rem; color: var(--color-gray-70); margin: 0; line-height: 1.7; }

/* ── Before / After 비교 슬라이더 ── */
.denup-compare { position: relative; height: 480px; max-width: 1080px; margin: 0 auto; border-radius: 10px; overflow: hidden; cursor: ew-resize; border: 1px solid var(--color-gray-20); user-select: none; }
.denup-compare-after, .denup-compare-before { position: absolute; inset: 0; display: flex; align-items: center; padding: 40px; }
.denup-compare-after { background: var(--color-primary-50); color: var(--color-gray-0); }
.denup-compare-before { background: var(--color-gray-90); color: var(--color-gray-20); clip-path: inset(0 50% 0 0); }
.denup-compare-content { max-width: 540px; }
.denup-compare-label { display: inline-block; padding: 6px 12px; border-radius: 4px; font-size: 0.8125rem; font-weight: 700; letter-spacing: 0.05em; margin-bottom: 16px; }
.denup-compare-label.after { background: rgba(255,255,255,0.2); color: var(--color-gray-0); }
.denup-compare-label.before { background: rgba(255,255,255,0.1); color: var(--color-gray-30); }
.denup-compare-content h3 { font-size: 1.5625rem; font-weight: 700; margin: 0 0 20px; letter-spacing: -0.0625rem; line-height: 1.3; }
.denup-compare-list { list-style: none; padding: 0; margin: 0; display: grid; gap: 10px; }
.denup-compare-list li { font-size: 0.9375rem; line-height: 1.6; }
.denup-compare-list b { color: inherit; opacity: 0.85; margin-right: 6px; }
.denup-compare-list.dim { opacity: 0.7; }
.denup-compare-handle { position: absolute; top: 0; bottom: 0; left: 50%; width: 4px; background: var(--color-gray-0); transform: translateX(-50%); pointer-events: none; }
.denup-compare-arrow { position: absolute; top: 50%; left: 50%; transform: translate(-50%,-50%); width: 48px; height: 48px; border-radius: 50%; background: var(--color-gray-0); color: var(--color-primary-50); display: flex; align-items: center; justify-content: center; font-size: 1.25rem; font-weight: 700; letter-spacing: -2px; border: 2px solid var(--color-primary-50); }
@media (max-width: 768px) {
  .denup-compare { height: 560px; }
  .denup-compare-after, .denup-compare-before { padding: 28px 24px; align-items: flex-start; padding-top: 60px; }
  .denup-compare-content h3 { font-size: 1.25rem; }
}

/* ── 리뷰 슬라이더 ── */
.denup-reviews { position: relative; padding: 12px 0; }
.denup-reviews-track { display: flex; gap: 24px; overflow-x: auto; scroll-snap-type: x mandatory; scroll-behavior: smooth; padding: 4px 4px 24px; -webkit-overflow-scrolling: touch; scrollbar-width: none; }
.denup-reviews-track::-webkit-scrollbar { display: none; }
.denup-review { flex: 0 0 calc(33.333% - 16px); min-width: 320px; scroll-snap-align: start; background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.12); border-radius: 10px; padding: 28px; transition: background-color var(--duration-base, 200ms) ease, border-color var(--duration-base, 200ms) ease; }
.denup-review:hover { background: rgba(36,75,235,0.12); border-color: var(--color-primary-40); }
.denup-review-stars { font-size: 1rem; letter-spacing: 2px; color: var(--color-warning-50); margin-bottom: 14px; }
.denup-review-body { font-size: 0.9375rem; color: var(--color-gray-10); line-height: 1.75; margin: 0 0 18px; min-height: 96px; }
.denup-review footer { display: flex; flex-direction: column; gap: 2px; padding-top: 14px; border-top: 1px solid rgba(255,255,255,0.12); }
.denup-review footer b { font-size: 0.875rem; color: var(--color-gray-0); font-weight: 700; }
.denup-review footer span { font-size: 0.8125rem; color: var(--color-gray-30); }
.denup-review-arrow { position: absolute; top: 50%; transform: translateY(-50%); width: 48px; height: 48px; border-radius: 8px; background: var(--color-gray-0); color: var(--color-primary-50); border: 1px solid var(--color-primary-50); font-size: 1.25rem; font-weight: 700; cursor: pointer; transition: background-color var(--duration-base, 200ms) ease, color var(--duration-base, 200ms) ease; z-index: 5; display: flex; align-items: center; justify-content: center; }
.denup-review-arrow:hover { background: var(--color-primary-50); color: var(--color-gray-0); }
.denup-review-arrow:focus-visible { outline: 2px solid var(--color-gray-0); outline-offset: 2px; }
.denup-review-arrow.prev { left: -24px; }
.denup-review-arrow.next { right: -24px; }
.denup-review-dots { display: flex; justify-content: center; gap: 8px; margin-top: 20px; }
.denup-review-dots button { width: 10px; height: 10px; border-radius: 4px; border: none; background: rgba(255,255,255,0.25); cursor: pointer; transition: background-color var(--duration-base, 200ms) ease, width var(--duration-base, 200ms) ease; padding: 0; }
.denup-review-dots button:hover { background: rgba(255,255,255,0.5); }
.denup-review-dots button:focus-visible { outline: 2px solid var(--color-gray-0); outline-offset: 2px; }
.denup-review-dots button.active { background: var(--color-primary-40); width: 28px; }
@media (max-width: 768px) {
  .denup-review { flex: 0 0 calc(100% - 16px); min-width: 280px; }
  .denup-review-arrow { display: none; }
}

/* ── 등장 애니메이션 (간소화) ── */
.denup-fade { opacity: 0; transform: translateY(16px); transition: opacity 300ms cubic-bezier(0.4,0,0.2,1), transform 300ms cubic-bezier(0.4,0,0.2,1); }
.denup-fade.in-view { opacity: 1; transform: translateY(0); }
.denup-fade.delay-1 { transition-delay: 80ms; }
.denup-fade.delay-2 { transition-delay: 160ms; }
.denup-fade.delay-3 { transition-delay: 240ms; }
.denup-fade.delay-4 { transition-delay: 320ms; }

/* 히어로 자동 등장 */
.denup-hero .denup-badge,
.denup-hero h1,
.denup-hero p.sub,
.denup-hero p.desc { opacity: 0; transform: translateY(12px); animation: denupHeroIn 400ms cubic-bezier(0.4,0,0.2,1) forwards; }
.denup-hero .denup-badge { animation-delay: 50ms; }
.denup-hero h1 { animation-delay: 150ms; }
.denup-hero p.sub { animation-delay: 280ms; }
.denup-hero p.desc:nth-of-type(1) { animation-delay: 380ms; }
.denup-hero p.desc:nth-of-type(2) { animation-delay: 460ms; }
@keyframes denupHeroIn { to { opacity: 1; transform: translateY(0); } }

/* 스크롤 진행 바 */
.denup-progress { position: fixed; top: 0; left: 0; height: 3px; width: 0; background: var(--color-primary-50); z-index: 200; transition: width 100ms linear; pointer-events: none; }

/* 카드/스탯 hover (틸트 제거, KRDS 권장: 미세 변화만) */
.denup-process-item:hover { background: rgba(36,75,235,0.1); border-color: var(--color-primary-40); }
.denup-stat:hover { background: rgba(36,75,235,0.12); }

/* nav 활성 표시 */
.denup-nav a { position: relative; }
.denup-nav a::after { content: ''; position: absolute; left: 0; right: 0; bottom: -8px; height: 3px; width: 0; margin: 0 auto; background: var(--color-primary-50); transition: width 200ms ease; }
.denup-nav a:hover::after, .denup-nav a.active::after { width: 100%; }

/* ── 상담 모달 ── */
.denup-modal { position: fixed; inset: 0; z-index: 1000; display: none; align-items: center; justify-content: center; padding: 20px; }
.denup-modal.open { display: flex; }
.denup-modal-backdrop { position: absolute; inset: 0; background: var(--color-alpha-black-75, rgba(0,0,0,0.75)); }
.denup-modal-box { position: relative; width: 100%; max-width: 480px; background: var(--color-gray-0); border-radius: 10px; padding: 32px; max-height: 90vh; overflow-y: auto; animation: denupModalIn 200ms cubic-bezier(0.4,0,0.2,1); }
@keyframes denupModalIn { from { transform: translateY(8px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
.denup-modal-close { position: absolute; top: 16px; right: 16px; width: 36px; height: 36px; background: var(--color-gray-5); border: none; border-radius: 8px; font-size: 1rem; color: var(--color-gray-70); cursor: pointer; transition: background-color var(--duration-base, 200ms) ease; }
.denup-modal-close:hover { background: var(--color-gray-10); color: var(--color-gray-90); }
.denup-modal-close:focus-visible { outline: 2px solid var(--color-primary-50); outline-offset: 2px; }
.denup-modal-header { margin-bottom: 24px; }
.denup-modal-eyebrow { font-size: 0.8125rem; font-weight: 700; letter-spacing: 0.1em; color: var(--color-primary-50); margin: 0 0 8px; }
.denup-modal-header h3 { font-size: 1.5625rem; font-weight: 700; color: var(--color-gray-90); margin: 0 0 8px; letter-spacing: -0.0625rem; }
.denup-modal-header p { font-size: 0.9375rem; color: var(--color-gray-70); margin: 0; line-height: 1.6; }
.denup-modal-form { display: flex; flex-direction: column; gap: 16px; }
.denup-field { display: flex; flex-direction: column; gap: 8px; }
.denup-field span { font-size: 0.9375rem; font-weight: 600; color: var(--color-gray-90); }
.denup-field em { color: var(--color-danger-50); font-style: normal; margin-left: 2px; }
.denup-field input, .denup-field select { width: 100%; border: 1px solid var(--color-gray-40); background: var(--color-gray-0); padding: 14px 16px; border-radius: 8px; font-size: 1rem; font-family: inherit; color: var(--color-gray-90); outline: none; transition: border-color var(--duration-base, 200ms) ease, box-shadow var(--duration-base, 200ms) ease; box-sizing: border-box; min-height: 48px; }
.denup-field input:focus, .denup-field select:focus { border-color: var(--color-primary-50); box-shadow: 0 0 0 3px rgba(36,75,235,0.15); }
.denup-field select { appearance: none; -webkit-appearance: none; background-image: url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='12' height='8' viewBox='0 0 12 8'><path fill='%23717171' d='M6 8L0 0h12z'/></svg>"); background-repeat: no-repeat; background-position: right 16px center; padding-right: 40px; }
.denup-agree { display: flex; align-items: flex-start; gap: 10px; font-size: 0.9375rem; color: var(--color-gray-70); cursor: pointer; }
.denup-agree input { width: 18px; height: 18px; margin-top: 2px; accent-color: var(--color-primary-50); flex-shrink: 0; }
.denup-form-msg { font-size: 0.875rem; text-align: center; padding: 4px 0; min-height: 22px; }
.denup-form-msg.ok { color: var(--color-success-50); font-weight: 600; }
.denup-form-msg.err { color: var(--color-danger-50); font-weight: 600; }
.denup-modal-submit { background: var(--color-primary-50); color: var(--color-gray-0); border: none; font-size: 1.0625rem; font-weight: 700; padding: 14px; border-radius: 8px; cursor: pointer; transition: background-color var(--duration-base, 200ms) ease; min-height: 56px; font-family: inherit; }
.denup-modal-submit:hover:not(:disabled) { background: var(--color-primary-60); }
.denup-modal-submit:active:not(:disabled) { background: var(--color-primary-70); }
.denup-modal-submit:focus-visible { outline: 2px solid var(--color-gray-0); outline-offset: -4px; box-shadow: 0 0 0 4px var(--color-primary-50); }
.denup-modal-submit:disabled { opacity: 0.6; cursor: not-allowed; }
`;

// ── 공통 헤더 ───────────────────────────────────────────────
const HEADER_CONTENT = `<header class="denup-header" id="denupHeader">
  <div class="denup-wrap denup-header-inner">
    <a href="/" class="denup-logo" aria-label="DENUP 홈">
      <img src="/uploads/denup/logo.png" alt="DENUP" class="denup-logo-img" />
    </a>
    <nav class="denup-nav">
      <a href="/#strengths">덴업 강점</a>
      <a href="/#insurance">치과건강보험 UP</a>
      <a href="/#chart">전자차트 UP</a>
      <a href="/#desk">데스크업무 UP</a>
      <a href="/#consulting">치과 경영 업무 UP</a>
    </nav>
    <div class="denup-header-actions">
      <a href="/login" class="denup-login-btn">로그인</a>
    </div>
    <button class="denup-mobile-toggle" aria-label="메뉴" onclick="document.querySelector('.denup-nav').classList.toggle('open')">☰</button>
  </div>
</header>
<script>
(function(){
  var header = document.getElementById('denupHeader');
  if (!header) return;
  function update(){
    if (window.scrollY > 8) header.classList.add('scrolled');
    else header.classList.remove('scrolled');
  }
  window.addEventListener('scroll', update, { passive: true });
  update();
})();
</script>`;

const HEADER_CSS = `
.denup-header { position: sticky; top: 0; z-index: 100; background: #ffffff; border-bottom: 1px solid #e2e8f0; transition: box-shadow 0.2s ease, background 0.2s ease; }
.denup-header.scrolled { box-shadow: 0 4px 20px rgba(10,26,46,0.08); border-bottom-color: transparent; background: rgba(255,255,255,0.96); backdrop-filter: blur(12px); }
.denup-header-inner { display: flex; align-items: center; justify-content: space-between; padding: 18px 32px; max-width: 1280px; margin: 0 auto; gap: 24px; min-height: 84px; }
.denup-logo { display: inline-flex; align-items: center; text-decoration: none; }
.denup-logo-img { height: 38px; width: auto; display: block; }
.denup-nav { display: flex; gap: 32px; }
.denup-nav a { font-size: 14.5px; font-weight: 600; color: #334155; text-decoration: none; transition: color 0.2s; padding: 6px 0; }
.denup-nav a:hover { color: #2e7dff; }
.denup-header-actions { display: flex; gap: 10px; }
.denup-login-btn { font-size: 13px; font-weight: 700; padding: 10px 22px; background: #2e7dff; color: #fff; border-radius: 999px; text-decoration: none; transition: all 0.2s; box-shadow: 0 4px 14px rgba(46,125,255,0.25); }
.denup-login-btn:hover { background: #1e5fd6; transform: translateY(-1px); box-shadow: 0 6px 18px rgba(46,125,255,0.35); }
.denup-mobile-toggle { display: none; background: none; border: none; font-size: 26px; cursor: pointer; color: #0a1a2e; }
@media (max-width: 1000px) {
  .denup-nav { display: none; position: absolute; top: 100%; left: 0; right: 0; flex-direction: column; background: #fff; border-bottom: 1px solid #e2e8f0; padding: 16px 24px; gap: 0; box-shadow: 0 8px 20px rgba(10,26,46,0.08); }
  .denup-nav.open { display: flex; }
  .denup-nav a { padding: 14px 0; border-bottom: 1px solid #f1f5f9; }
  .denup-mobile-toggle { display: block; }
  .denup-header-actions { display: none; }
  .denup-logo-img { height: 32px; }
  .denup-header-inner { padding: 14px 20px; min-height: 68px; }
}
`;

// ── 공통 푸터 ───────────────────────────────────────────────
const FOOTER_CONTENT = `<footer class="denup-footer">
  <div class="denup-wrap">
    <div class="denup-footer-grid">
      <div>
        <img src="/uploads/denup/logo.png" alt="DENUP" style="height:36px; width:auto; margin-bottom:14px; filter: brightness(0) invert(1);" />
        <p class="denup-footer-tagline">치과의 제갈공명, 덴업이 함께합니다.</p>
      </div>
      <div>
        <p class="denup-footer-heading">회사 정보</p>
        <ul class="denup-footer-list">
          <li>상호: 덴업</li>
          <li>대표자: 이지수</li>
          <li>사업자등록번호: 208-28-51975</li>
        </ul>
      </div>
      <div>
        <p class="denup-footer-heading">연락처</p>
        <ul class="denup-footer-list">
          <li>대표번호: 010-5152-7943</li>
          <li>주소: 서울시 강남구 학동로2길 19<br/>(논현동, 세일빌딩)</li>
        </ul>
      </div>
      <div>
        <p class="denup-footer-heading">서비스</p>
        <ul class="denup-footer-list">
          <li><a href="/#insurance">치과건강보험 UP</a></li>
          <li><a href="/#chart">전자차트 UP</a></li>
          <li><a href="/#desk">데스크업무 UP</a></li>
          <li><a href="/#consulting">경영업무 UP</a></li>
        </ul>
      </div>
    </div>
    <div class="denup-footer-bottom">
      <p>&copy; 덴업 DENUP. All rights reserved.</p>
      <div>
        <a href="/privacy">개인정보처리방침</a>
        <a href="/terms">이용약관</a>
      </div>
    </div>
  </div>
</footer>`;

const FOOTER_CSS = `
.denup-footer { background: #0a1626; color: #cbd5e1; padding: 64px 0 24px; }
.denup-footer-grid { display: grid; grid-template-columns: 1.5fr 1fr 1fr 1fr; gap: 40px; margin-bottom: 48px; }
.denup-footer-logo { font-size: 28px; font-weight: 900; color: #fff; margin: 0 0 12px; display: flex; align-items: center; }
.denup-footer-logo-text { letter-spacing: -0.02em; }
.denup-footer-tagline { font-size: 13px; color: #64748b; margin: 0; }
.denup-footer-heading { font-size: 13px; font-weight: 700; color: #fff; margin: 0 0 16px; letter-spacing: 0.02em; }
.denup-footer-list { list-style: none; padding: 0; margin: 0; display: grid; gap: 10px; }
.denup-footer-list li { font-size: 13px; color: #94a3b8; line-height: 1.6; }
.denup-footer-list a { color: #94a3b8; text-decoration: none; }
.denup-footer-list a:hover { color: #2e7dff; }
.denup-footer-bottom { display: flex; justify-content: space-between; align-items: center; padding-top: 24px; border-top: 1px solid rgba(255,255,255,0.08); font-size: 12px; color: #64748b; }
.denup-footer-bottom div { display: flex; gap: 20px; }
.denup-footer-bottom a { color: #64748b; text-decoration: none; }
.denup-footer-bottom a:hover { color: #fff; }
@media (max-width: 768px) {
  .denup-footer-grid { grid-template-columns: 1fr 1fr; gap: 32px; }
  .denup-footer-bottom { flex-direction: column; gap: 12px; text-align: center; }
}
`;

// ── 메인 페이지 콘텐츠 ───────────────────────────────────────────────
const MAIN_CONTENT = `<div class="denup-home">
  <section class="denup-hero">
    <canvas id="denupHeroCanvas" class="denup-hero-canvas" aria-hidden="true"></canvas>
    <div class="denup-wrap denup-hero-content">
      <span class="denup-badge">🦷 치과 경영 전문 컨설팅</span>
      <h1>치과 경영의 <span class="accent">판</span>을 바꾸다</h1>
      <p class="sub">가격 경쟁은 끝났다!</p>
      <p class="desc">덴업과 함께 안정적이고 지속 가능한 전략적 수익구조 수립</p>
      <p class="desc" style="color:#fff; font-weight:600; margin-top:24px;">치과의 제갈공명, 덴업이 함께합니다.</p>
      <div class="denup-hero-cta">
        <button type="button" class="denup-hero-btn primary" onclick="denupOpenConsult()">무료 진단 받기 →</button>
        <a href="#strengths" class="denup-hero-btn ghost">서비스 둘러보기</a>
      </div>
    </div>
    <div class="denup-hero-scroll-hint" aria-hidden="true">
      <span>SCROLL</span>
      <div class="denup-scroll-line"></div>
    </div>
  </section>

  <section id="strengths" class="denup-section">
    <div class="denup-wrap">
      <span class="denup-eyebrow">OUR STRENGTHS</span>
      <h2 class="denup-title">덴업 강점</h2>
      <p class="denup-subtitle">덴업은 치과의 경영 구조를 전략적으로 혁신하여, 의료진이 원하는 진료에 집중할 수 있도록 돕고, 동시에 안정적인 치과 운영을 실현합니다.</p>
      <div class="denup-grid denup-grid-3">
        <div class="denup-card">
          <div class="denup-card-icon">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2L15.09 8.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
          </div>
          <h3 class="denup-card-title">차별화된 전문성</h3>
          <p class="denup-card-desc">20년 이상 경력의 치과경영 전문가와 17년 이상 경력의 건강보험 청구 및 심사 전문가가 함께합니다.</p>
        </div>
        <div class="denup-card">
          <div class="denup-card-icon">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M23 6l-9.5 9.5-5-5L1 18"/><path d="M17 6h6v6"/></svg>
          </div>
          <h3 class="denup-card-title">안정적 수익구조</h3>
          <p class="denup-card-desc">맞춤 차팅 시스템과 보험 진료 관리로 안정적인 매출 구조를 만듭니다.</p>
        </div>
        <div class="denup-card">
          <div class="denup-card-icon">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>
          </div>
          <h3 class="denup-card-title">효율적인 치과운영</h3>
          <p class="denup-card-desc">데스크/콜 업무 지원과 의료서비스 표준화 솔루션으로 운영 효율을 극대화합니다.</p>
        </div>
      </div>
    </div>
  </section>

  <section id="insurance" class="denup-section dark">
    <div class="denup-wrap">
      <span class="denup-eyebrow">INSURANCE UP</span>
      <h2 class="denup-title">치과건강보험 전략적 Process 설계</h2>
      <p class="denup-subtitle">치과건강보험 정확하고 빠르게! 덴업이 최적화 합니다.</p>
      <div class="denup-process">
        <div class="denup-process-item">
          <span class="denup-process-num">01</span>
          <div class="denup-card-icon">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>
          </div>
          <h3>3단계 청구</h3>
          <p>오류 최소화, 클레임 사전 예방</p>
        </div>
        <div class="denup-process-item">
          <span class="denup-process-num">02</span>
          <div class="denup-card-icon">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>
          </div>
          <h3>HIRA 기준 준수</h3>
          <p>건강보험심사평가원 청구 심사 기준 철저히 준수</p>
        </div>
        <div class="denup-process-item">
          <span class="denup-process-num">03</span>
          <div class="denup-card-icon">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
          </div>
          <h3>최적화 시스템</h3>
          <p>보험청구 최적화 시스템 구축</p>
        </div>
        <div class="denup-process-item">
          <span class="denup-process-num">04</span>
          <div class="denup-card-icon">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 20V10"/><path d="M12 20V4"/><path d="M6 20v-6"/></svg>
          </div>
          <h3>실시간 분석 & 피드백</h3>
          <p>청구 결과 분석 & 맞춤형 개선 방안 제공</p>
        </div>
      </div>
    </div>
  </section>

  <section id="chart" class="denup-section light">
    <div class="denup-wrap">
      <span class="denup-eyebrow">CHART UP</span>
      <h2 class="denup-title">전자차트 셋팅 A~Z까지</h2>
      <p class="denup-subtitle">종이차트에서 전자차트로 스마트하게 전환. 덴업이 전자차트 시스템을 A부터 Z까지 구축해드립니다.</p>
      <div class="denup-tabs">
        <div class="denup-tab-nav" role="tablist">
          <button type="button" class="denup-tab-btn active" role="tab" data-tab="setup">시스템 구축</button>
          <button type="button" class="denup-tab-btn" role="tab" data-tab="edu">교육 · 활용</button>
          <button type="button" class="denup-tab-btn" role="tab" data-tab="custom">커스터마이징</button>
        </div>

        <div class="denup-tab-panel active" data-panel="setup">
          <div class="denup-tab-grid">
            <div>
              <span class="denup-tab-num">01</span>
              <h4>덴트웹 원클릭 셋업</h4>
              <p>복잡한 설치 과정 없이 덴트웹을 원클릭으로 사용 가능하도록 셋업합니다.</p>
            </div>
            <div>
              <span class="denup-tab-num">02</span>
              <h4>종이차트 → 전자차트 전환</h4>
              <p>종이차트를 디지털로 스마트하게 전환하고 등록 대행까지 진행합니다.</p>
            </div>
            <div>
              <span class="denup-tab-num">03</span>
              <h4>슬립지 활용법</h4>
              <p>쪽차트(슬립지) 활용법을 안내해 빠른 진료 기록을 가능하게 합니다.</p>
            </div>
          </div>
        </div>

        <div class="denup-tab-panel" data-panel="edu">
          <div class="denup-tab-grid">
            <div>
              <span class="denup-tab-num">01</span>
              <h4>접점별 활용 교육</h4>
              <p>진료실·데스크·상담실 각 부서별 전자차트 활용 전략을 구축합니다.</p>
            </div>
            <div>
              <span class="denup-tab-num">02</span>
              <h4>상담 자료 제작 & 공유</h4>
              <p>효과적인 상담 자료의 제작 및 공유 방법까지 함께 안내합니다.</p>
            </div>
            <div>
              <span class="denup-tab-num">03</span>
              <h4>실무 OJT</h4>
              <p>현장 직원들이 바로 활용할 수 있도록 OJT 형식으로 교육합니다.</p>
            </div>
          </div>
        </div>

        <div class="denup-tab-panel" data-panel="custom">
          <div class="denup-tab-grid">
            <div>
              <span class="denup-tab-num">01</span>
              <h4>커스텀 문진표</h4>
              <p>치과 특성에 맞는 문진표 양식을 제공해 환자 데이터를 체계화합니다.</p>
            </div>
            <div>
              <span class="denup-tab-num">02</span>
              <h4>동의서 양식</h4>
              <p>법적 안전성을 고려한 다양한 동의서 양식을 즉시 사용할 수 있습니다.</p>
            </div>
            <div>
              <span class="denup-tab-num">03</span>
              <h4>진료탭 구성</h4>
              <p>치과별 진료 방식에 맞춰 진료탭을 커스텀 구성합니다.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>

  <section id="desk" class="denup-section dark">
    <div class="denup-wrap">
      <span class="denup-eyebrow">DESK UP</span>
      <h2 class="denup-title">데스크 업무 아웃소싱</h2>
      <p class="denup-subtitle">콜 응대부터 행정 관리까지, 인건비는 절약하고 생산성은 향상됩니다.</p>
      <div class="denup-stats">
        <div class="denup-stat"><p class="denup-stat-num"><span class="denup-count" data-target="60" data-suffix="%↑">0%↑</span></p><p class="denup-stat-label">환자 만족도 향상</p></div>
        <div class="denup-stat"><p class="denup-stat-num"><span class="denup-count" data-target="20" data-suffix="%↓">0%↓</span></p><p class="denup-stat-label">예약 취소율 감소</p></div>
        <div class="denup-stat"><p class="denup-stat-num"><span class="denup-count" data-target="30" data-suffix="%↓">0%↓</span></p><p class="denup-stat-label">행정 업무부담 감소</p></div>
      </div>
      <div class="denup-grid denup-grid-2">
        <div class="denup-card">
          <span class="denup-num">1</span>
          <h3 class="denup-card-title">OUT/IN CALL 서비스</h3>
          <ul class="denup-list" style="margin-top:16px;">
            <li>전문 상담원의 환자 응대</li>
            <li>30분 안에 / 7일 간격 / 10번 이상 call 관리</li>
            <li>맞춤형 콜 스크립트 제공</li>
            <li>환자 만족도 향상</li>
            <li>업무 효율성 증대</li>
          </ul>
        </div>
        <div class="denup-card">
          <span class="denup-num">2</span>
          <h3 class="denup-card-title">행정 및 예약 관리</h3>
          <ul class="denup-list" style="margin-top:16px;">
            <li>체계적인 문서 관리 시스템</li>
            <li>환자 데이터 통합 관리</li>
            <li>행정 업무 자동화</li>
            <li>리소스 최적화</li>
            <li>원내 필요 문서 제작 (동의서·주의사항·재증명 신청서 등)</li>
          </ul>
        </div>
      </div>
    </div>
  </section>

  <section class="denup-section light">
    <div class="denup-wrap">
      <span class="denup-eyebrow">BEFORE / AFTER</span>
      <h2 class="denup-title">덴업 도입 전후 비교</h2>
      <p class="denup-subtitle">슬라이더를 좌우로 움직여 데스크 업무 효율 변화를 확인해 보세요.</p>
      <div class="denup-compare" id="denupCompare">
        <div class="denup-compare-after">
          <div class="denup-compare-content">
            <span class="denup-compare-label after">덴업 도입 후</span>
            <h3>예약·콜·문서까지 한 번에</h3>
            <ul class="denup-compare-list">
              <li><b>응대 시간</b>: 평균 2분 → 30초</li>
              <li><b>예약 취소율</b>: 18% → 14%</li>
              <li><b>월간 인건비</b>: 540만 → 280만</li>
              <li><b>환자 만족도</b>: 65점 → 92점</li>
              <li><b>행정 처리</b>: 일일 4시간 → 1시간</li>
            </ul>
          </div>
        </div>
        <div class="denup-compare-before" id="denupCompareBefore">
          <div class="denup-compare-content">
            <span class="denup-compare-label before">기존 운영</span>
            <h3>분산된 업무, 잦은 누락</h3>
            <ul class="denup-compare-list dim">
              <li><b>응대 시간</b>: 평균 2분</li>
              <li><b>예약 취소율</b>: 18%</li>
              <li><b>월간 인건비</b>: 540만</li>
              <li><b>환자 만족도</b>: 65점</li>
              <li><b>행정 처리</b>: 일일 4시간</li>
            </ul>
          </div>
        </div>
        <div class="denup-compare-handle" id="denupCompareHandle">
          <span class="denup-compare-arrow">‹›</span>
        </div>
      </div>
    </div>
  </section>

  <section id="consulting" class="denup-section">
    <div class="denup-wrap">
      <span class="denup-eyebrow">CONSULTING UP</span>
      <h2 class="denup-title">치과 경영지원실 업무 지원</h2>
      <p class="denup-subtitle">데이터 기반의 전략적 경영, 치과 경영이 더욱 단단해집니다.</p>
      <div class="denup-grid denup-grid-3">
        <div class="denup-card">
          <div class="denup-card-icon">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
          </div>
          <h3 class="denup-card-title">운영 효율 극대화</h3>
          <ul class="denup-list" style="margin-top:16px;">
            <li>맞춤형 운영 시스템 구축</li>
            <li>업무 프로세스 최적화</li>
            <li>인력 관리 효율성 제고</li>
            <li>비용 구조 개선</li>
            <li>생산성 향상 전략</li>
          </ul>
        </div>
        <div class="denup-card">
          <div class="denup-card-icon">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>
          </div>
          <h3 class="denup-card-title">데이터 기반 분석</h3>
          <ul class="denup-list" style="margin-top:16px;">
            <li>경영 데이터 통합 분석</li>
            <li>핵심 성과 지표(KPI) 설정</li>
            <li>실시간 경영 현황 모니터링</li>
            <li>데이터 기반 의사결정 지원</li>
            <li>경쟁력 강화 방안 도출</li>
          </ul>
        </div>
        <div class="denup-card">
          <div class="denup-card-icon">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
          </div>
          <h3 class="denup-card-title">비상주 경영지원실</h3>
          <ul class="denup-list" style="margin-top:16px;">
            <li>직원 Recruiting</li>
            <li>병원내규 관리</li>
            <li>직원 OJT</li>
            <li>세무/노무 처리</li>
            <li>거래처와의 원활한 소통</li>
          </ul>
        </div>
      </div>
    </div>
  </section>

  <section class="denup-section dark">
    <div class="denup-wrap">
      <span class="denup-eyebrow">REVIEWS</span>
      <h2 class="denup-title">현장의 목소리</h2>
      <p class="denup-subtitle">덴업과 함께한 치과 원장님들이 직접 경험한 변화를 전합니다.</p>
      <div class="denup-reviews" id="denupReviews">
        <div class="denup-reviews-track">
          <article class="denup-review">
            <div class="denup-review-stars">★★★★★</div>
            <p class="denup-review-body">"보험청구 클레임 빈도가 절반 이하로 줄었습니다. 덴업 시스템을 도입하고 제일 만족스러운 변화입니다. 매월 청구 결과 분석 리포트를 받아보면서 의사결정이 훨씬 명확해졌어요."</p>
            <footer><b>이○○ 원장</b><span>강남 OOO치과</span></footer>
          </article>
          <article class="denup-review">
            <div class="denup-review-stars">★★★★★</div>
            <p class="denup-review-body">"3년 전부터 데스크 인력 구하기가 너무 힘들었는데, 콜·예약 관리를 덴업에 맡기고 나니 인건비도 줄고 환자 응대 만족도도 올라갔습니다. 진료에만 집중할 수 있게 됐어요."</p>
            <footer><b>박○○ 원장</b><span>분당 OO치과의원</span></footer>
          </article>
          <article class="denup-review">
            <div class="denup-review-stars">★★★★★</div>
            <p class="denup-review-body">"개원 1년차에 만난 덴업. 차팅 시스템부터 보험 진료 흐름까지 0에서부터 잡아주셔서 운영이 자리 잡는 데 6개월이 채 안 걸렸습니다. 추천합니다."</p>
            <footer><b>김○○ 원장</b><span>일산 OOO덴탈</span></footer>
          </article>
          <article class="denup-review">
            <div class="denup-review-stars">★★★★★</div>
            <p class="denup-review-body">"전자차트 셋업을 부탁드렸는데 부서별 활용 전략까지 잡아주셔서 직원 교육 시간이 확 줄었습니다. 진료실·데스크·상담실 모두 같은 시스템으로 일하니 누락이 없어요."</p>
            <footer><b>최○○ 원장</b><span>부산 OO치과</span></footer>
          </article>
          <article class="denup-review">
            <div class="denup-review-stars">★★★★★</div>
            <p class="denup-review-body">"무료 진단을 받아본 게 시작이었어요. 우리 청구 패턴의 약점을 정확히 짚어주셨고, 3개월 만에 보험 매출이 22% 증가했습니다. 의심 많던 저도 인정합니다."</p>
            <footer><b>정○○ 원장</b><span>대구 OOO치과</span></footer>
          </article>
          <article class="denup-review">
            <div class="denup-review-stars">★★★★★</div>
            <p class="denup-review-body">"비상주 경영지원실 서비스를 받고 있습니다. 직원 채용·세무·노무까지 손대주셔서 원장은 진료에만 집중하면 됩니다. 작은 치과일수록 효과가 큽니다."</p>
            <footer><b>윤○○ 원장</b><span>인천 OO치과의원</span></footer>
          </article>
        </div>
        <button type="button" class="denup-review-arrow prev" onclick="denupReviewMove(-1)" aria-label="이전 리뷰">‹</button>
        <button type="button" class="denup-review-arrow next" onclick="denupReviewMove(1)" aria-label="다음 리뷰">›</button>
        <div class="denup-review-dots" id="denupReviewDots"></div>
      </div>
    </div>
  </section>

  <section class="denup-cta">
    <div class="denup-wrap">
      <h2>늘 함께 성장하는 성장 파트너</h2>
      <p>더 이상 불안정한 매출, 불확실한 경영으로 고민하지 마세요.</p>
      <p style="font-size:16px; opacity:0.9; margin-bottom:8px;">덴업과 함께 더 안정적으로! 더 효율적으로! 더 가치 있게! 치과를 운영하세요.</p>
      <p style="font-size:14px; opacity:0.85; margin-bottom:32px;">덴업 20년 보험청구 전문가가 직접 분석하고 최적화 방안을 제시해 드립니다.</p>
      <button type="button" class="denup-cta-btn" onclick="denupOpenConsult()">무료 보험청구 진단받기 →</button>
    </div>
  </section>

  <div class="denup-progress" id="denupProgress"></div>

  <!-- 상담 문의 모달 -->
  <div class="denup-modal" id="denupConsultModal" role="dialog" aria-modal="true" aria-hidden="true">
    <div class="denup-modal-backdrop" onclick="denupCloseConsult()"></div>
    <div class="denup-modal-box">
      <button type="button" class="denup-modal-close" onclick="denupCloseConsult()" aria-label="닫기">✕</button>
      <div class="denup-modal-header">
        <p class="denup-modal-eyebrow">FREE CONSULTING</p>
        <h3>무료 보험청구 진단받기</h3>
        <p>20년 경력 보험청구 전문가가 직접 분석하고 최적화 방안을 제시해 드립니다.</p>
      </div>
      <form id="denupConsultForm" class="denup-modal-form">
        <label class="denup-field">
          <span>이름 <em>*</em></span>
          <input type="text" name="name" required placeholder="홍길동" />
        </label>
        <label class="denup-field">
          <span>연락처 <em>*</em></span>
          <input type="tel" name="phone" required placeholder="010-0000-0000" />
        </label>
        <label class="denup-field">
          <span>이메일</span>
          <input type="email" name="email" placeholder="선택 입력" />
        </label>
        <label class="denup-field">
          <span>문의 유형</span>
          <select name="category">
            <option value="">선택해 주세요</option>
            <option value="insurance">치과건강보험 UP</option>
            <option value="chart">전자차트 UP</option>
            <option value="desk">데스크업무 UP</option>
            <option value="consulting">치과 경영 업무 UP</option>
            <option value="etc">기타 문의</option>
          </select>
        </label>
        <label class="denup-agree">
          <input type="checkbox" name="agreed" required />
          <span>개인정보 수집·이용에 동의합니다 (필수)</span>
        </label>
        <div class="denup-form-msg" id="denupFormMsg"></div>
        <button type="submit" class="denup-modal-submit">상담 신청하기</button>
      </form>
    </div>
  </div>
</div>
<script>
function denupOpenConsult(){
  var m = document.getElementById('denupConsultModal');
  if (!m) return;
  m.classList.add('open');
  m.setAttribute('aria-hidden','false');
  document.body.style.overflow='hidden';
  var first = m.querySelector('input[name="name"]');
  if (first) setTimeout(function(){ first.focus(); }, 100);
}
function denupCloseConsult(){
  var m = document.getElementById('denupConsultModal');
  if (!m) return;
  m.classList.remove('open');
  m.setAttribute('aria-hidden','true');
  document.body.style.overflow='';
}
document.addEventListener('keydown', function(e){
  if (e.key === 'Escape') denupCloseConsult();
});

/* ── 히어로 캔버스 파티클 네트워크 ── */
(function(){
  var canvas = document.getElementById('denupHeroCanvas');
  if (!canvas) return;
  var ctx = canvas.getContext('2d');
  var dpr = Math.min(window.devicePixelRatio || 1, 2);
  var particles = [];
  var w = 0, h = 0;
  var mouse = { x: -1000, y: -1000 };

  function resize(){
    w = canvas.offsetWidth;
    h = canvas.offsetHeight;
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    ctx.scale(dpr, dpr);
    var count = Math.min(70, Math.floor(w * h / 18000));
    particles = [];
    for (var i = 0; i < count; i++){
      particles.push({
        x: Math.random() * w,
        y: Math.random() * h,
        vx: (Math.random() - 0.5) * 0.4,
        vy: (Math.random() - 0.5) * 0.4,
        r: Math.random() * 1.6 + 0.8
      });
    }
  }

  function tick(){
    ctx.clearRect(0, 0, w, h);
    for (var i = 0; i < particles.length; i++){
      var p = particles[i];
      p.x += p.vx; p.y += p.vy;
      if (p.x < 0 || p.x > w) p.vx *= -1;
      if (p.y < 0 || p.y > h) p.vy *= -1;
      var dx = p.x - mouse.x, dy = p.y - mouse.y;
      var dist = Math.sqrt(dx*dx + dy*dy);
      if (dist < 120){
        p.x += dx * 0.01; p.y += dy * 0.01;
      }
      ctx.fillStyle = 'rgba(91,156,255,0.5)';
      ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2); ctx.fill();
    }
    for (var i = 0; i < particles.length; i++){
      for (var j = i + 1; j < particles.length; j++){
        var a = particles[i], b = particles[j];
        var dx = a.x - b.x, dy = a.y - b.y;
        var dist = Math.sqrt(dx*dx + dy*dy);
        if (dist < 130){
          var alpha = (1 - dist / 130) * 0.25;
          ctx.strokeStyle = 'rgba(91,156,255,' + alpha + ')';
          ctx.lineWidth = 0.6;
          ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
        }
      }
    }
    requestAnimationFrame(tick);
  }

  resize();
  window.addEventListener('resize', resize);
  canvas.addEventListener('mousemove', function(e){
    var rect = canvas.getBoundingClientRect();
    mouse.x = e.clientX - rect.left;
    mouse.y = e.clientY - rect.top;
  });
  canvas.addEventListener('mouseleave', function(){ mouse.x = -1000; mouse.y = -1000; });
  tick();
})();

/* ── 카운터 애니메이션 ── */
(function(){
  var nodes = document.querySelectorAll('.denup-count');
  if (!nodes.length || !('IntersectionObserver' in window)) return;
  var io = new IntersectionObserver(function(entries){
    entries.forEach(function(entry){
      if (!entry.isIntersecting) return;
      var el = entry.target;
      var target = parseInt(el.dataset.target, 10) || 0;
      var suffix = el.dataset.suffix || '';
      var dur = 1400, start = performance.now();
      function step(now){
        var p = Math.min((now - start) / dur, 1);
        var eased = 1 - Math.pow(1 - p, 3);
        el.textContent = Math.round(target * eased) + suffix;
        if (p < 1) requestAnimationFrame(step);
      }
      requestAnimationFrame(step);
      io.unobserve(el);
    });
  }, { threshold: 0.5 });
  nodes.forEach(function(n){ io.observe(n); });
})();

/* ── 인터랙티브 탭 ── */
(function(){
  var tabs = document.querySelectorAll('.denup-tab-btn');
  var panels = document.querySelectorAll('.denup-tab-panel');
  if (!tabs.length) return;
  tabs.forEach(function(tab){
    tab.addEventListener('click', function(){
      var key = tab.dataset.tab;
      tabs.forEach(function(t){ t.classList.toggle('active', t === tab); });
      panels.forEach(function(p){ p.classList.toggle('active', p.dataset.panel === key); });
    });
  });
})();

/* ── Before / After 비교 슬라이더 ── */
(function(){
  var box = document.getElementById('denupCompare');
  if (!box) return;
  var before = document.getElementById('denupCompareBefore');
  var handle = document.getElementById('denupCompareHandle');
  var dragging = false;
  function setPos(clientX){
    var rect = box.getBoundingClientRect();
    var x = clientX - rect.left;
    var pct = Math.max(0, Math.min(100, (x / rect.width) * 100));
    before.style.clipPath = 'inset(0 ' + (100 - pct) + '% 0 0)';
    handle.style.left = pct + '%';
  }
  function start(e){ dragging = true; box.style.cursor = 'grabbing'; }
  function move(e){
    if (!dragging) return;
    var clientX = e.touches ? e.touches[0].clientX : e.clientX;
    setPos(clientX);
  }
  function end(){ dragging = false; box.style.cursor = 'ew-resize'; }
  box.addEventListener('mousedown', start);
  box.addEventListener('touchstart', start, { passive: true });
  window.addEventListener('mousemove', move);
  window.addEventListener('touchmove', move, { passive: true });
  window.addEventListener('mouseup', end);
  window.addEventListener('touchend', end);
  // 클릭 위치로 즉시 이동
  box.addEventListener('click', function(e){
    if (e.target === handle || handle.contains(e.target)) return;
    var clientX = e.clientX;
    setPos(clientX);
  });
})();

/* ── 리뷰 슬라이더 ── */
window.denupReviewMove = function(dir){
  var track = document.querySelector('#denupReviews .denup-reviews-track');
  if (!track) return;
  var card = track.querySelector('.denup-review');
  if (!card) return;
  var step = card.offsetWidth + 24;
  track.scrollBy({ left: step * dir, behavior: 'smooth' });
};
(function(){
  var wrap = document.getElementById('denupReviews');
  if (!wrap) return;
  var track = wrap.querySelector('.denup-reviews-track');
  var dotsHost = document.getElementById('denupReviewDots');
  if (!track || !dotsHost) return;
  var cards = wrap.querySelectorAll('.denup-review');
  if (!cards.length) return;

  function step(){ return cards[0].offsetWidth + 24; }
  function perView(){ return Math.max(1, Math.floor(track.clientWidth / step())); }
  function totalStops(){ return Math.max(1, cards.length - perView() + 1); }

  function buildDots(){
    dotsHost.innerHTML = '';
    var n = totalStops();
    for (var i = 0; i < n; i++){
      (function(idx){
        var b = document.createElement('button');
        b.type = 'button';
        b.setAttribute('aria-label', '리뷰 ' + (idx + 1) + '번째 위치');
        b.addEventListener('click', function(){
          track.scrollTo({ left: step() * idx, behavior: 'smooth' });
        });
        dotsHost.appendChild(b);
      })(i);
    }
    syncDots();
  }
  function syncDots(){
    var idx = Math.round(track.scrollLeft / step());
    var max = totalStops() - 1;
    if (idx > max) idx = max;
    dotsHost.querySelectorAll('button').forEach(function(b, i){ b.classList.toggle('active', i === idx); });
  }
  track.addEventListener('scroll', syncDots, { passive: true });
  buildDots();

  var resizeTimer;
  window.addEventListener('resize', function(){
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(buildDots, 150);
  });

  var auto = setInterval(function(){
    var s = step();
    var max = track.scrollWidth - track.clientWidth;
    if (track.scrollLeft + s > max + 10) {
      track.scrollTo({ left: 0, behavior: 'smooth' });
    } else {
      track.scrollBy({ left: s, behavior: 'smooth' });
    }
  }, 5000);
  wrap.addEventListener('mouseenter', function(){ clearInterval(auto); });
})();

/* ── 카드 3D 틸트 효과 ── */
(function(){
  var cards = document.querySelectorAll('.denup-card, .denup-process-item');
  cards.forEach(function(card){
    card.addEventListener('mousemove', function(e){
      var rect = card.getBoundingClientRect();
      var x = e.clientX - rect.left, y = e.clientY - rect.top;
      var rx = ((y / rect.height) - 0.5) * -6;
      var ry = ((x / rect.width) - 0.5) * 6;
      card.style.transform = 'perspective(900px) rotateX(' + rx + 'deg) rotateY(' + ry + 'deg) translateY(-2px)';
    });
    card.addEventListener('mouseleave', function(){
      card.style.transform = '';
    });
  });
})();

/* ── 스크롤 등장 애니메이션 ── */
(function(){
  var targets = document.querySelectorAll(
    '.denup-section .denup-eyebrow, .denup-section .denup-title, .denup-section .denup-subtitle, ' +
    '.denup-card, .denup-process-item, .denup-stat, .denup-service-block'
  );
  if (!('IntersectionObserver' in window)) {
    targets.forEach(function(el){ el.classList.add('denup-fade','in-view'); });
    return;
  }
  targets.forEach(function(el){
    el.classList.add('denup-fade');
    // 같은 부모의 같은 클래스끼리 stagger
    var parent = el.parentNode;
    if (parent && parent.classList.contains('denup-grid') || (parent && parent.classList.contains('denup-process')) || (parent && parent.classList.contains('denup-stats'))) {
      var siblings = Array.prototype.filter.call(parent.children, function(c){
        return c.classList.contains('denup-fade') || c.classList.contains('denup-card') || c.classList.contains('denup-process-item') || c.classList.contains('denup-stat') || c.classList.contains('denup-service-block');
      });
      var idx = siblings.indexOf(el);
      if (idx > 0 && idx <= 4) el.classList.add('delay-' + idx);
    }
  });
  var io = new IntersectionObserver(function(entries){
    entries.forEach(function(entry){
      if (entry.isIntersecting){
        entry.target.classList.add('in-view');
        io.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -60px 0px' });
  targets.forEach(function(el){ io.observe(el); });
})();

/* ── 스크롤 프로그레스 바 ── */
(function(){
  var bar = document.getElementById('denupProgress');
  if (!bar) return;
  function update(){
    var scrollTop = window.scrollY || document.documentElement.scrollTop;
    var height = (document.documentElement.scrollHeight || document.body.scrollHeight) - window.innerHeight;
    var pct = height > 0 ? (scrollTop / height) * 100 : 0;
    bar.style.width = pct + '%';
  }
  window.addEventListener('scroll', update, { passive: true });
  update();
})();

/* ── nav 활성 섹션 표시 + 모바일 메뉴 자동 닫힘 ── */
(function(){
  var navLinks = Array.prototype.slice.call(document.querySelectorAll('.denup-nav a[href^="/#"], .denup-nav a[href^="#"]'));
  if (!navLinks.length) return;
  var sectionsById = {};
  navLinks.forEach(function(link){
    var hash = (link.getAttribute('href') || '').split('#')[1];
    if (!hash) return;
    var sec = document.getElementById(hash);
    if (sec) sectionsById[hash] = sec;
    link.addEventListener('click', function(){
      var nav = document.querySelector('.denup-nav');
      if (nav) nav.classList.remove('open');
    });
  });
  if (!('IntersectionObserver' in window)) return;
  var navIo = new IntersectionObserver(function(entries){
    entries.forEach(function(entry){
      if (entry.isIntersecting){
        var id = entry.target.id;
        navLinks.forEach(function(l){
          var hash = (l.getAttribute('href') || '').split('#')[1];
          l.classList.toggle('active', hash === id);
        });
      }
    });
  }, { threshold: 0.35, rootMargin: '-90px 0px -50% 0px' });
  Object.values(sectionsById).forEach(function(s){ navIo.observe(s); });
})();
(function(){
  var form = document.getElementById('denupConsultForm');
  if (!form) return;
  form.addEventListener('submit', function(e){
    e.preventDefault();
    var msg = document.getElementById('denupFormMsg');
    msg.className = 'denup-form-msg';
    msg.textContent = '';
    var btn = form.querySelector('button[type="submit"]');
    btn.disabled = true;
    btn.textContent = '전송 중...';
    var payload = {
      name: form.name.value,
      phone: form.phone.value,
      email: form.email.value,
      category: form.category.value,
      agreed: form.agreed.checked
    };
    fetch('/api/consult', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'same-origin',
      body: JSON.stringify(payload)
    })
    .then(function(r){ return r.json().then(function(d){ return { ok: r.ok, body: d }; }); })
    .then(function(res){
      if (res.ok && res.body.success){
        msg.className = 'denup-form-msg ok';
        msg.textContent = '상담 신청이 접수되었습니다. 곧 연락드리겠습니다.';
        form.reset();
        setTimeout(denupCloseConsult, 2000);
      } else {
        msg.className = 'denup-form-msg err';
        msg.textContent = (res.body && res.body.error) || '전송에 실패했습니다. 잠시 후 다시 시도해 주세요.';
      }
    })
    .catch(function(){
      msg.className = 'denup-form-msg err';
      msg.textContent = '네트워크 오류가 발생했습니다.';
    })
    .finally(function(){
      btn.disabled = false;
      btn.textContent = '상담 신청하기';
    });
  });
})();
</script>`;

// ── DB 업데이트 ───────────────────────────────────────────────
const db = new sqlite3.Database(DB_PATH);

function run(sql, params = []) {
  return new Promise((res, rej) => db.run(sql, params, function (err) { if (err) rej(err); else res(this); }));
}
function get(sql, params = []) {
  return new Promise((res, rej) => db.get(sql, params, (err, row) => { if (err) rej(err); else res(row); }));
}

async function upsertPage(slug, title, content, css, pageType, sortOrder = 100) {
  const existing = await get('SELECT id FROM pages WHERE slug = ? AND hospital_id = ?', [slug, HOSPITAL_ID]);
  if (existing) {
    await run(
      `UPDATE pages SET title=?, content=?, custom_css=?, page_type=?, sort_order=?, is_published=1, updated_at=CURRENT_TIMESTAMP WHERE id=?`,
      [title, content, css, pageType, sortOrder, existing.id]
    );
    console.log(`  [UPDATE] ${slug}`);
  } else {
    await run(
      `INSERT INTO pages (hospital_id, slug, title, content, custom_css, custom_js, meta_title, meta_description, is_published, sort_order, page_type)
       VALUES (?, ?, ?, ?, ?, '', ?, '', 1, ?, ?)`,
      [HOSPITAL_ID, slug, title, content, css, title, sortOrder, pageType]
    );
    console.log(`  [INSERT] ${slug}`);
  }
}

async function upsertGeoSettings() {
  const existing = await get('SELECT rowid FROM geo_settings WHERE hospital_id = ? ORDER BY rowid DESC LIMIT 1', [HOSPITAL_ID]).catch(() => null);
  const fields = {
    clinic_name: '덴업',
    address: '서울시 강남구 학동로2길 19 (논현동, 세일빌딩)',
    telephone: '010-5152-7943',
    representative: '이지수',
    street_address: '학동로2길 19',
    address_locality: '강남구',
    address_region: '서울특별시',
  };
  const cols = await new Promise((res) => db.all(`PRAGMA table_info(geo_settings)`, (e, rows) => res(rows || [])));
  const colSet = new Set(cols.map(c => c.name));
  const setKeys = Object.keys(fields).filter(k => colSet.has(k));

  if (existing) {
    const setSql = setKeys.map(k => `${k} = ?`).join(', ');
    await run(
      `UPDATE geo_settings SET ${setSql}, updated_at=CURRENT_TIMESTAMP WHERE hospital_id = ?`,
      [...setKeys.map(k => fields[k]), HOSPITAL_ID]
    );
    console.log('  [UPDATE] geo_settings');
  } else {
    const insertKeys = ['hospital_id', ...setKeys];
    const placeholders = insertKeys.map(() => '?').join(', ');
    await run(
      `INSERT INTO geo_settings (${insertKeys.join(', ')}) VALUES (${placeholders})`,
      [HOSPITAL_ID, ...setKeys.map(k => fields[k])]
    );
    console.log('  [INSERT] geo_settings');
  }
}

async function main() {
  console.log('[denup 마이그레이션 시작]');
  try {
    await upsertGeoSettings();

    await upsertPage('main', '메인 페이지', MAIN_CONTENT, COMMON_CSS, 'builtin', 0);
    // _header / _footer 는 Phase 2 (migrate-denup-pages.mjs) 가 관리.
    // 충돌 방지를 위해 본 스크립트에서는 메인 페이지만 갱신함.

    console.log('[완료]');
  } catch (e) {
    console.error('[에러]', e.message);
    process.exitCode = 1;
  } finally {
    db.close();
  }
}

main();
