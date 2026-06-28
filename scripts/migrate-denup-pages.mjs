// 덴업 멀티페이지 확장 (Phase 2)
// /about, /contact, /services/{insurance|chart|desk|consulting}
// + 헤더 드롭다운 메뉴 + 푸터 사이트맵 갱신
// hospital_id=8

import sqlite3 from 'sqlite3';
const HOSPITAL_ID = 8;
const DB_PATH = process.argv[2] || './wonjudental.db';

// ── 공통 페이지 CSS (랜딩과 동일 변수 + 추가 클래스) ───────────────────────────
const PAGE_CSS = `
@import url('https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/packages/pretendard-gov/dist/web/variable/pretendardvariable-gov.min.css');
:root {
  --color-primary-5:#EFF5FF; --color-primary-10:#D3E1FB; --color-primary-40:#5089EF; --color-primary-50:#244BEB; --color-primary-60:#1D56BC; --color-primary-70:#16408D;
  --color-secondary-50:#003675; --color-secondary-70:#002046;
  --color-gray-0:#FFFFFF; --color-gray-5:#F8F8F8; --color-gray-10:#F0F0F0; --color-gray-20:#E4E4E4; --color-gray-40:#C6C6C6; --color-gray-50:#8E8E8E; --color-gray-60:#717171; --color-gray-70:#555555; --color-gray-80:#2D2D2D; --color-gray-90:#1D1D1D;
  --color-success-50:#00A61E; --color-danger-50:#EB003B; --color-warning-50:#FF9724;
  --denup-primary: var(--color-secondary-50);
  --denup-accent: var(--color-primary-50);
  --denup-accent-light: var(--color-primary-40);
  --denup-dark: var(--color-secondary-70);
  --denup-gray: var(--color-gray-70);
  --denup-light: var(--color-gray-5);
}
* { box-sizing: border-box; }
html { scroll-behavior: smooth; -webkit-text-size-adjust: 100%; text-size-adjust: 100%; }
body { margin: 0; font-family: 'Pretendard GOV Variable', 'Pretendard GOV', -apple-system, BlinkMacSystemFont, 'Apple SD Gothic Neo', 'Malgun Gothic', sans-serif; color: var(--color-gray-70); line-height: 1.5; word-break: keep-all; -webkit-font-smoothing: antialiased; }
section[id] { scroll-margin-top: 96px; }
:focus-visible { outline: 2px solid var(--color-primary-50); outline-offset: 2px; }
.sr-only { position: absolute; width: 1px; height: 1px; padding: 0; margin: -1px; overflow: hidden; clip: rect(0,0,0,0); white-space: nowrap; border: 0; }
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after { animation-duration: 0.01ms !important; transition-duration: 0.01ms !important; scroll-behavior: auto !important; }
  .dn-fade { opacity: 1 !important; transform: none !important; }
}

.dn-wrap { max-width: 1280px; margin: 0 auto; padding: 0 24px; }
.dn-page-hero { padding: 120px 0 64px; background: linear-gradient(180deg, var(--color-secondary-50) 0%, var(--color-secondary-70) 100%); color: var(--color-gray-0); position: relative; overflow: hidden; }
.dn-page-hero::before { content: ''; position: absolute; top: -20%; right: -10%; width: 600px; height: 600px; background: radial-gradient(circle, rgba(36,75,235,0.18) 0%, transparent 70%); pointer-events: none; }
.dn-page-hero h1 { font-size: clamp(2rem, 4vw, 3.125rem); font-weight: 700; letter-spacing: -0.0625rem; margin: 12px 0 14px; line-height: 1.25; position: relative; color: var(--color-gray-0); }
.dn-page-hero p { font-size: 1.0625rem; color: var(--color-gray-20); max-width: 720px; margin: 0; position: relative; line-height: 1.7; }
.dn-page-eyebrow { display: inline-block; font-size: 0.9375rem; font-weight: 700; letter-spacing: 0.05em; color: var(--color-primary-40); text-transform: uppercase; position: relative; }

.dn-section { padding: 80px 0; }
.dn-section.alt { background: var(--color-gray-5); }
.dn-section.dark { background: var(--color-secondary-50); color: var(--color-gray-0); }
.dn-section-eyebrow { display: inline-block; font-size: 0.9375rem; font-weight: 700; letter-spacing: 0.05em; color: var(--color-primary-50); text-transform: uppercase; margin-bottom: 14px; }
.dn-section-title { font-size: clamp(1.625rem, 3vw, 2.5rem); font-weight: 700; letter-spacing: -0.0625rem; margin: 0 0 16px; line-height: 1.3; color: var(--color-gray-90); }
.dn-section.dark .dn-section-eyebrow { color: var(--color-primary-40); }
.dn-section.dark .dn-section-title { color: var(--color-gray-0); }
.dn-section-sub { font-size: 1.0625rem; color: var(--color-gray-70); margin: 0 0 40px; max-width: 760px; line-height: 1.7; }
.dn-section.dark .dn-section-sub { color: var(--color-gray-20); }

.dn-grid { display: grid; gap: 24px; }
.dn-grid-3 { grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); }
.dn-grid-2 { grid-template-columns: repeat(auto-fit, minmax(360px, 1fr)); }
.dn-grid-4 { grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); }

.dn-card { background: var(--color-gray-0); border: 1px solid var(--color-gray-20); border-radius: 10px; padding: 32px 28px; transition: border-color 200ms ease, box-shadow 200ms ease; }
.dn-card:hover { border-color: var(--color-primary-50); box-shadow: 0 4px 16px rgba(36,75,235,0.08); }
.dn-section.dark .dn-card { background: rgba(255,255,255,0.06); border-color: rgba(255,255,255,0.12); }
.dn-section.dark .dn-card:hover { background: rgba(255,255,255,0.1); }
.dn-card-icon { width: 56px; height: 56px; border-radius: 8px; background: var(--color-primary-5); display: flex; align-items: center; justify-content: center; margin-bottom: 16px; color: var(--color-primary-50); }
.dn-card h3 { font-size: 1.1875rem; font-weight: 700; margin: 0 0 10px; color: var(--color-gray-90); line-height: 1.4; }
.dn-section.dark .dn-card h3 { color: var(--color-gray-0); }
.dn-card p { font-size: 0.9375rem; color: var(--color-gray-70); line-height: 1.7; margin: 0; }
.dn-section.dark .dn-card p { color: var(--color-gray-20); }

.dn-btn { display: inline-flex; align-items: center; justify-content: center; gap: 8px; padding: 12px 32px; border-radius: 8px; font-size: 1.0625rem; font-weight: 700; text-decoration: none; cursor: pointer; border: 1px solid transparent; transition: background-color 200ms ease, border-color 200ms ease, color 200ms ease; font-family: inherit; min-height: 56px; }
.dn-btn.primary { background: var(--color-primary-50); color: var(--color-gray-0); }
.dn-btn.primary:hover { background: var(--color-primary-60); }
.dn-btn.primary:active { background: var(--color-primary-70); }
.dn-btn.ghost { background: var(--color-gray-0); color: var(--color-primary-50); border-color: var(--color-primary-50); }
.dn-btn.ghost:hover { background: var(--color-primary-5); }

.dn-list { list-style: none; padding: 0; margin: 0; display: grid; gap: 12px; }
.dn-list li { display: flex; gap: 12px; align-items: flex-start; font-size: 1rem; color: var(--color-gray-70); }
.dn-list li::before { content: ''; flex-shrink: 0; width: 20px; height: 20px; border-radius: 4px; background: var(--color-primary-50); display: flex; align-items: center; justify-content: center; margin-top: 2px; background-image: url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='white' stroke-width='3' stroke-linecap='round' stroke-linejoin='round'><polyline points='20 6 9 17 4 12'/></svg>"); background-size: 14px; background-repeat: no-repeat; background-position: center; }
.dn-section.dark .dn-list li { color: var(--color-gray-20); }

.dn-cta-box { background: var(--color-primary-50); color: var(--color-gray-0); padding: 56px 40px; border-radius: 10px; text-align: center; }
.dn-cta-box h3 { font-size: 1.75rem; font-weight: 700; margin: 0 0 12px; color: var(--color-gray-0); }
.dn-cta-box p { font-size: 1.0625rem; opacity: 0.95; margin: 0 0 28px; }
.dn-cta-box .dn-btn { background: var(--color-gray-0); color: var(--color-primary-50); border-color: var(--color-gray-0); }
.dn-cta-box .dn-btn:hover { background: var(--color-primary-5); }
.dn-cta-box .dn-btn:focus-visible { outline-color: var(--color-gray-0); }

/* 페이드업 (간소화) */
.dn-fade { opacity: 0; transform: translateY(16px); transition: opacity 300ms cubic-bezier(0.4,0,0.2,1), transform 300ms cubic-bezier(0.4,0,0.2,1); }
.dn-fade.in-view { opacity: 1; transform: translateY(0); }
.dn-fade.delay-1 { transition-delay: 80ms; } .dn-fade.delay-2 { transition-delay: 160ms; } .dn-fade.delay-3 { transition-delay: 240ms; } .dn-fade.delay-4 { transition-delay: 320ms; }

/* 통계 */
.dn-stats { display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 16px; margin: 0 0 40px; }
.dn-stat { background: var(--color-gray-0); border: 1px solid var(--color-gray-20); border-radius: 10px; padding: 32px 24px; text-align: center; transition: border-color 200ms ease; }
.dn-stat:hover { border-color: var(--color-primary-50); }
.dn-stat-num { font-size: 2.25rem; font-weight: 700; color: var(--color-primary-50); line-height: 1.1; margin: 0 0 8px; letter-spacing: -0.04em; }
.dn-stat-label { font-size: 0.9375rem; color: var(--color-gray-70); font-weight: 600; margin: 0; }
.dn-section.dark .dn-stat { background: rgba(255,255,255,0.06); border-color: rgba(255,255,255,0.12); }
.dn-section.dark .dn-stat-num { color: var(--color-primary-40); }
.dn-section.dark .dn-stat-label { color: var(--color-gray-20); }

/* FAQ 아코디언 (KRDS Disclosure) */
.dn-faq { display: grid; gap: 8px; }
.dn-faq-item { background: var(--color-gray-0); border: 1px solid var(--color-gray-20); border-radius: 8px; overflow: hidden; transition: border-color 200ms ease; }
.dn-faq-item.open { border-color: var(--color-primary-50); }
.dn-faq-q { padding: 20px 24px; cursor: pointer; display: flex; align-items: center; justify-content: space-between; gap: 16px; font-size: 1.0625rem; font-weight: 700; color: var(--color-gray-90); min-height: 56px; }
.dn-faq-q:hover { background: var(--color-gray-5); }
.dn-faq-q:focus-visible { outline: 2px solid var(--color-primary-50); outline-offset: -2px; }
.dn-faq-q::after { content: ''; width: 24px; height: 24px; flex-shrink: 0; background-image: url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%23244BEB' stroke-width='2.5' stroke-linecap='round' stroke-linejoin='round'><polyline points='6 9 12 15 18 9'/></svg>"); background-repeat: no-repeat; background-position: center; transition: transform 200ms ease; }
.dn-faq-item.open .dn-faq-q::after { transform: rotate(180deg); }
.dn-faq-a { max-height: 0; overflow: hidden; transition: max-height 300ms ease; }
.dn-faq-item.open .dn-faq-a { max-height: 500px; }
.dn-faq-a-inner { padding: 0 24px 24px; font-size: 1rem; color: var(--color-gray-70); line-height: 1.75; border-top: 1px solid var(--color-gray-10); padding-top: 20px; }

/* 프로세스 단계 */
.dn-process { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 20px; }
.dn-process-step { background: var(--color-gray-0); border: 1px solid var(--color-gray-20); border-radius: 10px; padding: 28px 24px; position: relative; }
.dn-process-num { display: inline-flex; align-items: center; justify-content: center; width: 36px; height: 36px; border-radius: 8px; background: var(--color-primary-50); color: var(--color-gray-0); font-weight: 700; font-size: 0.9375rem; margin-bottom: 14px; }
.dn-process-step h3 { font-size: 1.0625rem; font-weight: 700; margin: 0 0 8px; color: var(--color-gray-90); }
.dn-process-step p { font-size: 0.9375rem; color: var(--color-gray-70); margin: 0; line-height: 1.7; }

/* About 페이지 전용 */
.dn-ceo-card { background: var(--color-gray-0); border: 1px solid var(--color-gray-20); border-radius: 10px; padding: 48px; display: grid; grid-template-columns: 220px 1fr; gap: 40px; align-items: center; }
.dn-ceo-avatar { width: 220px; height: 220px; border-radius: 50%; background: var(--color-primary-50); display: flex; align-items: center; justify-content: center; color: var(--color-gray-0); font-size: 4rem; font-weight: 700; }
.dn-ceo-meta { font-size: 0.875rem; color: var(--color-gray-70); margin: 0 0 8px; letter-spacing: 0.05em; font-weight: 600; }
.dn-ceo-name { font-size: 1.625rem; font-weight: 700; color: var(--color-gray-90); margin: 0 0 18px; }
.dn-ceo-quote { font-size: 1.0625rem; color: var(--color-gray-70); line-height: 1.85; margin: 0 0 18px; }
.dn-ceo-sign { font-size: 0.9375rem; color: var(--color-gray-60); }

.dn-timeline { position: relative; max-width: 760px; margin: 0 auto; padding-left: 30px; border-left: 2px solid var(--color-gray-20); }
.dn-timeline-item { position: relative; padding-bottom: 36px; }
.dn-timeline-item::before { content: ''; position: absolute; left: -38px; top: 4px; width: 14px; height: 14px; border-radius: 50%; background: var(--color-primary-50); border: 3px solid var(--color-gray-0); box-shadow: 0 0 0 2px var(--color-primary-50); }
.dn-timeline-year { display: inline-block; font-size: 0.8125rem; font-weight: 700; color: var(--color-primary-50); background: var(--color-primary-5); padding: 4px 12px; border-radius: 4px; margin-bottom: 10px; }
.dn-timeline-item h4 { font-size: 1.0625rem; font-weight: 700; margin: 0 0 4px; color: var(--color-gray-90); }
.dn-timeline-item p { font-size: 0.9375rem; color: var(--color-gray-70); margin: 0; line-height: 1.7; }

/* Contact 페이지 전용 */
.dn-contact-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 32px; align-items: stretch; }
.dn-info-card { background: var(--color-gray-0); border: 1px solid var(--color-gray-20); border-radius: 10px; padding: 32px; display: flex; flex-direction: column; }
.dn-info-row { display: flex; gap: 16px; padding: 18px 0; border-bottom: 1px solid var(--color-gray-10); }
.dn-info-row:last-child { border-bottom: none; padding-bottom: 0; }
.dn-info-row:first-of-type { padding-top: 0; }
.dn-info-icon { width: 40px; height: 40px; border-radius: 8px; background: var(--color-primary-5); color: var(--color-primary-50); display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
.dn-info-label { font-size: 0.8125rem; font-weight: 700; color: var(--color-gray-60); letter-spacing: 0.05em; text-transform: uppercase; margin: 0 0 4px; }
.dn-info-value { font-size: 1rem; font-weight: 600; color: var(--color-gray-90); margin: 0; line-height: 1.5; }
.dn-info-value a { color: var(--color-gray-90); text-decoration: none; }
.dn-info-value a:hover { color: var(--color-primary-50); text-decoration: underline; }
.dn-map { width: 100%; height: 360px; border-radius: 10px; overflow: hidden; border: 1px solid var(--color-gray-20); background: var(--color-gray-10); margin-bottom: 24px; }
.dn-map iframe { width: 100%; height: 100%; border: 0; }

.dn-form { display: grid; gap: 16px; }
.dn-field { display: flex; flex-direction: column; gap: 8px; }
.dn-field label { font-size: 0.9375rem; font-weight: 600; color: var(--color-gray-90); }
.dn-field label em { color: var(--color-danger-50); font-style: normal; margin-left: 2px; }
.dn-field input, .dn-field select, .dn-field textarea { width: 100%; border: 1px solid var(--color-gray-40); background: var(--color-gray-0); padding: 14px 16px; border-radius: 8px; font-size: 1rem; font-family: inherit; color: var(--color-gray-90); outline: none; transition: border-color 200ms ease, box-shadow 200ms ease; min-height: 48px; }
.dn-field input:focus, .dn-field select:focus, .dn-field textarea:focus { border-color: var(--color-primary-50); box-shadow: 0 0 0 3px rgba(36,75,235,0.15); }
.dn-field textarea { min-height: 120px; resize: vertical; }
.dn-agree { display: flex; align-items: flex-start; gap: 10px; font-size: 0.9375rem; color: var(--color-gray-70); cursor: pointer; }
.dn-agree input { width: 18px; height: 18px; margin-top: 2px; accent-color: var(--color-primary-50); flex-shrink: 0; }
.dn-form-msg { font-size: 0.875rem; text-align: center; padding: 4px 0; min-height: 22px; }
.dn-form-msg.ok { color: var(--color-success-50); font-weight: 600; }
.dn-form-msg.err { color: var(--color-danger-50); font-weight: 600; }

@media (max-width: 768px) {
  .dn-section { padding: 56px 0; }
  .dn-page-hero { padding: 88px 0 48px; }
  .dn-ceo-card { grid-template-columns: 1fr; padding: 32px 24px; text-align: center; }
  .dn-ceo-avatar { margin: 0 auto; width: 160px; height: 160px; font-size: 3rem; }
  .dn-contact-grid { grid-template-columns: 1fr; }
}
`;

// ── 공통 스크립트 (페이드업, 카운터, FAQ, 폼) ───────────────────────────────────
const PAGE_JS = `
(function(){
  if (!('IntersectionObserver' in window)) return;
  var io = new IntersectionObserver(function(entries){
    entries.forEach(function(e){
      if (e.isIntersecting){ e.target.classList.add('in-view'); io.unobserve(e.target); }
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -50px 0px' });
  document.querySelectorAll('.dn-fade, .dn-section-eyebrow, .dn-section-title, .dn-section-sub, .dn-card, .dn-stat, .dn-process-step, .dn-timeline-item').forEach(function(el){
    el.classList.add('dn-fade'); io.observe(el);
  });
})();
(function(){
  document.querySelectorAll('.dn-faq-item').forEach(function(item){
    var q = item.querySelector('.dn-faq-q');
    if (!q) return;
    q.addEventListener('click', function(){ item.classList.toggle('open'); });
  });
})();
(function(){
  var nodes = document.querySelectorAll('[data-count]');
  if (!nodes.length || !('IntersectionObserver' in window)) return;
  var io = new IntersectionObserver(function(entries){
    entries.forEach(function(entry){
      if (!entry.isIntersecting) return;
      var el = entry.target;
      var target = parseInt(el.dataset.count, 10) || 0;
      var suffix = el.dataset.suffix || '';
      var dur = 1400, start = performance.now();
      function step(now){
        var p = Math.min((now - start) / dur, 1);
        var eased = 1 - Math.pow(1 - p, 3);
        el.textContent = Math.round(target * eased).toLocaleString() + suffix;
        if (p < 1) requestAnimationFrame(step);
      }
      requestAnimationFrame(step);
      io.unobserve(el);
    });
  }, { threshold: 0.5 });
  nodes.forEach(function(n){ io.observe(n); });
})();
(function(){
  var form = document.getElementById('dnContactForm');
  if (!form) return;
  form.addEventListener('submit', function(e){
    e.preventDefault();
    var msg = document.getElementById('dnContactMsg');
    msg.className = 'dn-form-msg'; msg.textContent = '';
    var btn = form.querySelector('button[type="submit"]');
    btn.disabled = true; var orig = btn.textContent; btn.textContent = '전송 중...';
    fetch('/api/consult', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'same-origin',
      body: JSON.stringify({
        name: form.name.value, phone: form.phone.value, email: form.email.value,
        category: form.category.value, agreed: form.agreed.checked
      })
    })
    .then(function(r){ return r.json().then(function(d){ return { ok: r.ok, body: d }; }); })
    .then(function(res){
      if (res.ok && res.body.success){
        msg.className = 'dn-form-msg ok'; msg.textContent = '상담 신청이 접수되었습니다. 곧 연락드리겠습니다.';
        form.reset();
      } else {
        msg.className = 'dn-form-msg err'; msg.textContent = (res.body && res.body.error) || '전송 실패';
      }
    })
    .catch(function(){ msg.className = 'dn-form-msg err'; msg.textContent = '네트워크 오류'; })
    .finally(function(){ btn.disabled = false; btn.textContent = orig; });
  });
})();
`;

// ── /about ─────────────────────────────────────────────────────────────────────
const ABOUT_CONTENT = `<section class="dn-page-hero">
  <div class="dn-wrap">
    <span class="dn-page-eyebrow">ABOUT DENUP</span>
    <h1>치과 경영의 판을 바꾸다</h1>
    <p>덴업은 20년 이상 축적된 치과 경영 노하우로, 의료진이 진료에만 집중할 수 있는 환경을 만듭니다.</p>
  </div>
</section>

<section class="dn-section">
  <div class="dn-wrap">
    <div class="dn-ceo-card">
      <div class="dn-ceo-avatar">이</div>
      <div>
        <p class="dn-ceo-meta">CEO MESSAGE</p>
        <h2 class="dn-ceo-name">이지수 대표</h2>
        <p class="dn-ceo-quote">"치과 경영은 더 이상 직관과 경험만으로 운영되어선 안 됩니다. 데이터와 시스템, 그리고 전문가의 검증된 프로세스가 결합될 때 비로소 안정적이고 지속 가능한 성장이 가능합니다.<br/><br/>
        덴업은 17년 이상의 보험청구 경험과 20년 이상의 치과 운영 노하우를 바탕으로, 원장님이 진료에 집중할 수 있는 환경을 만듭니다. 작은 의원부터 대형 네트워크 치과까지, 우리는 함께 성장해왔습니다."</p>
        <p class="dn-ceo-sign">— 덴업 대표 이지수</p>
      </div>
    </div>
  </div>
</section>

<section class="dn-section alt">
  <div class="dn-wrap">
    <span class="dn-section-eyebrow">BY THE NUMBERS</span>
    <h2 class="dn-section-title">숫자로 보는 덴업</h2>
    <p class="dn-section-sub">현장에서 검증된 덴업의 전문성</p>
    <div class="dn-stats">
      <div class="dn-stat"><p class="dn-stat-num"><span data-count="20" data-suffix="년+">0</span></p><p class="dn-stat-label">치과 경영 컨설팅</p></div>
      <div class="dn-stat"><p class="dn-stat-num"><span data-count="17" data-suffix="년+">0</span></p><p class="dn-stat-label">보험청구·심사 경력</p></div>
      <div class="dn-stat"><p class="dn-stat-num"><span data-count="120" data-suffix="+">0</span></p><p class="dn-stat-label">함께한 치과 의원</p></div>
      <div class="dn-stat"><p class="dn-stat-num"><span data-count="98" data-suffix="%">0</span></p><p class="dn-stat-label">고객 만족도</p></div>
    </div>
  </div>
</section>

<section class="dn-section">
  <div class="dn-wrap">
    <span class="dn-section-eyebrow">CORE VALUES</span>
    <h2 class="dn-section-title">덴업의 3대 핵심가치</h2>
    <p class="dn-section-sub">단순한 컨설팅이 아닌, 치과의 든든한 동반자가 되겠습니다.</p>
    <div class="dn-grid dn-grid-3">
      <div class="dn-card">
        <div class="dn-card-icon">
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2L15 8.5L22 9.5L17 14.5L18 21L12 17.5L6 21L7 14.5L2 9.5L9 8.5Z"/></svg>
        </div>
        <h3>전문성 (Expertise)</h3>
        <p>20년 이상 경력의 치과경영 전문가와 17년 이상 경력의 건강보험 청구·심사 전문가가 직접 진단하고 솔루션을 제시합니다.</p>
      </div>
      <div class="dn-card">
        <div class="dn-card-icon">
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
        </div>
        <h3>지속성 (Sustainability)</h3>
        <p>일회성 점검이 아닌, 지속적인 모니터링과 피드백으로 치과의 안정적인 운영 구조를 만들어 갑니다.</p>
      </div>
      <div class="dn-card">
        <div class="dn-card-icon">
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
        </div>
        <h3>실행력 (Execution)</h3>
        <p>이론과 제안에 머무르지 않고, 데스크 업무 아웃소싱부터 시스템 셋업까지 직접 실행합니다.</p>
      </div>
    </div>
  </div>
</section>

<section class="dn-section alt">
  <div class="dn-wrap">
    <span class="dn-section-eyebrow">OUR JOURNEY</span>
    <h2 class="dn-section-title">덴업 연혁</h2>
    <p class="dn-section-sub">치과 경영의 새로운 기준을 만들어 온 여정</p>
    <div class="dn-timeline">
      <div class="dn-timeline-item">
        <span class="dn-timeline-year">2025</span>
        <h4>덴업 공식 출범</h4>
        <p>20년 치과 경영 노하우와 17년 보험청구 전문성을 결합한 통합 컨설팅 브랜드 런칭.</p>
      </div>
      <div class="dn-timeline-item">
        <span class="dn-timeline-year">2024</span>
        <h4>전국 100개 치과 누적 컨설팅</h4>
        <p>서울·경기·부산·대구 등 전국 단위로 치과 의원 컨설팅 누적 100개소 돌파.</p>
      </div>
      <div class="dn-timeline-item">
        <span class="dn-timeline-year">2022</span>
        <h4>비상주 경영지원실 서비스 런칭</h4>
        <p>중·소형 치과를 위한 비상주 경영지원실 모델 출시. 직원 채용·세무·노무까지 원스톱.</p>
      </div>
      <div class="dn-timeline-item">
        <span class="dn-timeline-year">2020</span>
        <h4>전자차트 셋업 컨설팅 시작</h4>
        <p>덴트웹 기반 전자차트 시스템 셋업·교육·커스터마이징 서비스 본격 가동.</p>
      </div>
      <div class="dn-timeline-item">
        <span class="dn-timeline-year">2018</span>
        <h4>보험청구 전략 컨설팅 시작</h4>
        <p>HIRA 심사 기준에 최적화된 3단계 청구 프로세스 개발 및 보급.</p>
      </div>
      <div class="dn-timeline-item">
        <span class="dn-timeline-year">2005</span>
        <h4>치과 경영 컨설팅 시작</h4>
        <p>창업자 이지수 대표가 첫 치과 경영 컨설팅을 시작하며 덴업의 토대 마련.</p>
      </div>
    </div>
  </div>
</section>

<section class="dn-section">
  <div class="dn-wrap">
    <div class="dn-cta-box">
      <h3>지금 바로 무료 진단 받으세요</h3>
      <p>20년 경력 보험청구 전문가가 직접 분석해 드립니다.</p>
      <a href="/contact" class="dn-btn">무료 진단 신청 →</a>
    </div>
  </div>
</section>`;

// ── /contact ───────────────────────────────────────────────────────────────────
const CONTACT_CONTENT = `<section class="dn-page-hero">
  <div class="dn-wrap">
    <span class="dn-page-eyebrow">CONTACT</span>
    <h1>오시는 길 & 상담 문의</h1>
    <p>전화·이메일·온라인 문의 모두 환영합니다. 빠른 시일 내에 답변드리겠습니다.</p>
  </div>
</section>

<section class="dn-section">
  <div class="dn-wrap">
    <div class="dn-map">
      <iframe src="https://map.kakao.com/?urlX=506740&urlY=1112990&urlLevel=3&itemId=&q=%EC%84%9C%EC%9A%B8%EC%8B%9C%20%EA%B0%95%EB%82%A8%EA%B5%AC%20%ED%95%99%EB%8F%99%EB%A1%9C2%EA%B8%B8%2019&srcid=&map_type=TYPE_MAP&from=roughmap" loading="lazy" allowfullscreen></iframe>
    </div>
    <div class="dn-contact-grid">
        <div class="dn-info-card">
          <h2 style="margin:0 0 8px;font-size:22px;font-weight:900;color:var(--denup-primary);">회사 정보</h2>
          <p style="margin:0 0 24px;font-size:13.5px;color:var(--denup-gray);">덴업 본사 주소 및 연락 가능한 채널을 안내드립니다.</p>
          <div class="dn-info-row">
            <div class="dn-info-icon">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
            </div>
            <div>
              <p class="dn-info-label">주소</p>
              <p class="dn-info-value">서울시 강남구 학동로2길 19<br/>(논현동, 세일빌딩)</p>
            </div>
          </div>
          <div class="dn-info-row">
            <div class="dn-info-icon">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
            </div>
            <div>
              <p class="dn-info-label">대표번호</p>
              <p class="dn-info-value"><a href="tel:010-5152-7943">010-5152-7943</a></p>
            </div>
          </div>
          <div class="dn-info-row">
            <div class="dn-info-icon">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
            </div>
            <div>
              <p class="dn-info-label">이메일</p>
              <p class="dn-info-value"><a href="mailto:contact@denup.co.kr">contact@denup.co.kr</a></p>
            </div>
          </div>
          <div class="dn-info-row">
            <div class="dn-info-icon">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
            </div>
            <div>
              <p class="dn-info-label">상담 시간</p>
              <p class="dn-info-value">평일 09:00 - 18:00<br/><span style="color:#94a3b8;font-size:13px;">(주말·공휴일 휴무)</span></p>
            </div>
          </div>
          <div class="dn-info-row">
            <div class="dn-info-icon">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>
            </div>
            <div>
              <p class="dn-info-label">대중교통</p>
              <p class="dn-info-value">7호선 학동역 도보 5분<br/>강남구청역 도보 8분</p>
            </div>
          </div>
        </div>
        <div class="dn-info-card">
          <h2 style="margin:0 0 8px;font-size:22px;font-weight:900;color:var(--denup-primary);">상담 신청</h2>
          <p style="margin:0 0 24px;font-size:13.5px;color:var(--denup-gray);">아래 양식을 작성해 주시면 영업일 1일 이내에 연락드립니다.</p>
          <form id="dnContactForm" class="dn-form">
            <div class="dn-field">
              <label>이름<em>*</em></label>
              <input type="text" name="name" required placeholder="홍길동" />
            </div>
            <div class="dn-field">
              <label>연락처<em>*</em></label>
              <input type="tel" name="phone" required placeholder="010-0000-0000" />
            </div>
            <div class="dn-field">
              <label>이메일</label>
              <input type="email" name="email" placeholder="선택 입력" />
            </div>
            <div class="dn-field">
              <label>관심 서비스</label>
              <select name="category">
                <option value="">선택해 주세요</option>
                <option value="insurance">치과건강보험 UP</option>
                <option value="chart">전자차트 UP</option>
                <option value="desk">데스크업무 UP</option>
                <option value="consulting">치과 경영 업무 UP</option>
                <option value="etc">기타 문의</option>
              </select>
            </div>
            <label class="dn-agree">
              <input type="checkbox" name="agreed" required />
              <span>개인정보 수집·이용에 동의합니다 (필수)</span>
            </label>
            <div class="dn-form-msg" id="dnContactMsg"></div>
            <button type="submit" class="dn-btn primary" style="width:100%;justify-content:center;">상담 신청하기</button>
          </form>
        </div>
    </div>
  </div>
</section>`;

// ── 서비스 페이지 공통 템플릿 함수 ──────────────────────────────────────────────
function buildServicePage(opts) {
  const { eyebrow, title, sub, problems, solutions, processes, stats, faqs, otherServices } = opts;
  return `<section class="dn-page-hero">
  <div class="dn-wrap">
    <span class="dn-page-eyebrow">${eyebrow}</span>
    <h1>${title}</h1>
    <p>${sub}</p>
  </div>
</section>

<section class="dn-section">
  <div class="dn-wrap">
    <span class="dn-section-eyebrow">PAIN POINTS</span>
    <h2 class="dn-section-title">이런 어려움 겪고 계신가요?</h2>
    <div class="dn-grid dn-grid-3">
      ${problems.map(p => `<div class="dn-card"><h3>${p.t}</h3><p>${p.d}</p></div>`).join('')}
    </div>
  </div>
</section>

<section class="dn-section alt">
  <div class="dn-wrap">
    <span class="dn-section-eyebrow">SOLUTION</span>
    <h2 class="dn-section-title">덴업의 솔루션</h2>
    <p class="dn-section-sub">검증된 프로세스와 실행력으로 문제를 해결합니다.</p>
    <div class="dn-grid dn-grid-3">
      ${solutions.map(s => `
        <div class="dn-card">
          <div class="dn-card-icon">${s.icon}</div>
          <h3>${s.t}</h3>
          <p>${s.d}</p>
        </div>
      `).join('')}
    </div>
  </div>
</section>

<section class="dn-section">
  <div class="dn-wrap">
    <span class="dn-section-eyebrow">PROCESS</span>
    <h2 class="dn-section-title">진행 프로세스</h2>
    <div class="dn-process">
      ${processes.map((p, i) => `
        <div class="dn-process-step">
          <span class="dn-process-num">${String(i+1).padStart(2,'0')}</span>
          <h3>${p.t}</h3>
          <p>${p.d}</p>
        </div>
      `).join('')}
    </div>
  </div>
</section>

<section class="dn-section dark">
  <div class="dn-wrap">
    <span class="dn-section-eyebrow">EXPECTED RESULTS</span>
    <h2 class="dn-section-title">기대 효과</h2>
    <div class="dn-stats">
      ${stats.map(s => `<div class="dn-stat" style="background:rgba(255,255,255,0.05);border-color:rgba(255,255,255,0.1);"><p class="dn-stat-num"><span data-count="${s.n}" data-suffix="${s.suffix}">0</span></p><p class="dn-stat-label" style="color:#94a3b8;">${s.l}</p></div>`).join('')}
    </div>
  </div>
</section>

<section class="dn-section alt">
  <div class="dn-wrap">
    <span class="dn-section-eyebrow">FAQ</span>
    <h2 class="dn-section-title">자주 묻는 질문</h2>
    <div class="dn-faq" style="margin-top:32px;">
      ${faqs.map(f => `
        <div class="dn-faq-item">
          <div class="dn-faq-q">${f.q}</div>
          <div class="dn-faq-a"><div class="dn-faq-a-inner">${f.a}</div></div>
        </div>
      `).join('')}
    </div>
  </div>
</section>

<section class="dn-section">
  <div class="dn-wrap">
    <div class="dn-cta-box">
      <h3>지금 무료 진단 받기</h3>
      <p>덴업 전문가가 직접 분석하고 맞춤 솔루션을 제안합니다.</p>
      <a href="/contact" class="dn-btn">무료 상담 신청 →</a>
    </div>
  </div>
</section>

<section class="dn-section alt">
  <div class="dn-wrap">
    <h2 class="dn-section-title" style="text-align:center;">다른 서비스도 살펴보세요</h2>
    <div class="dn-grid dn-grid-3" style="margin-top:32px;">
      ${otherServices.map(o => `
        <a href="${o.href}" class="dn-card" style="text-decoration:none;color:inherit;display:block;">
          <h3 style="color:var(--denup-accent);">${o.t} →</h3>
          <p>${o.d}</p>
        </a>
      `).join('')}
    </div>
  </div>
</section>`;
}

// ── 서비스별 데이터 ────────────────────────────────────────────────────────────
const SERVICE_DATA = {
  insurance: {
    title: '치과건강보험 UP',
    sub: '정확하고 빠른 보험청구로 매출과 운영 안정성을 동시에 잡습니다.',
    problems: [
      { t: '청구 누락이 잦아 매출 손실이 큽니다', d: '복잡한 보험 항목과 변경되는 심사 기준 때문에 청구 누락이 발생합니다.' },
      { t: '클레임 빈도가 높아 행정 부담이 큽니다', d: '심평원 클레임 처리에 시간을 빼앗겨 진료에 집중하기 어렵습니다.' },
      { t: '보험 매출이 정체되어 있습니다', d: '청구 패턴 분석 없이 관행적으로 처리하다 보니 개선 기회를 놓칩니다.' },
    ],
    solutions: [
      { icon: '<svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>', t: '3단계 청구 프로세스', d: '진료 → 검토 → 청구의 3단계로 오류를 사전에 차단합니다.' },
      { icon: '<svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>', t: 'HIRA 기준 준수', d: '심평원 최신 심사 기준을 100% 반영한 표준 워크플로우.' },
      { icon: '<svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 20V10"/><path d="M12 20V4"/><path d="M6 20v-6"/></svg>', t: '실시간 분석·피드백', d: '월간 리포트로 청구 패턴을 분석하고 개선안을 제공합니다.' },
    ],
    processes: [
      { t: '진단 분석', d: '현재 청구 패턴·매출·클레임 빈도를 종합 분석합니다.' },
      { t: '시스템 셋업', d: '3단계 청구 프로세스를 의원 환경에 맞춰 셋업합니다.' },
      { t: '직원 교육', d: '데스크/원무 직원에게 표준 워크플로우 교육 진행.' },
      { t: '운영·피드백', d: '월간 리포트와 1:1 컨설팅으로 지속 개선합니다.' },
    ],
    stats: [
      { n: 50, suffix: '%↓', l: '청구 클레임 감소' },
      { n: 22, suffix: '%↑', l: '평균 보험 매출 증가' },
      { n: 95, suffix: '%', l: '심사 통과율' },
      { n: 3, suffix: '개월', l: '평균 ROI 회수 기간' },
    ],
    faqs: [
      { q: '컨설팅 기간은 얼마나 걸리나요?', a: '초기 진단부터 시스템 셋업·교육 완료까지 평균 4~6주 소요됩니다. 이후 월간 운영 컨설팅으로 전환됩니다.' },
      { q: '소규모 의원도 가능한가요?', a: '네, 1~3인 진료실 의원부터 대형 네트워크 치과까지 규모에 맞춘 패키지를 제공합니다.' },
      { q: '비용은 어떻게 산정되나요?', a: '의원 규모와 컨설팅 범위에 따라 다릅니다. 무료 진단 후 맞춤 견적을 드립니다.' },
      { q: '기존 EMR 시스템과 호환되나요?', a: '덴트웹·두번에·하나로 등 주요 EMR과 모두 호환됩니다.' },
    ],
  },
  chart: {
    title: '전자차트 UP',
    sub: '종이차트에서 전자차트로, A부터 Z까지 셋업·교육·커스터마이징을 한 번에.',
    problems: [
      { t: '종이차트로는 데이터 활용이 어렵습니다', d: '환자 이력 추적·분석이 어려워 진료 품질과 마케팅 모두 한계가 있습니다.' },
      { t: '직원마다 차트 작성 방식이 달라요', d: '표준화되지 않은 차트는 정보 누락과 분쟁 위험을 만듭니다.' },
      { t: '문진표·동의서 양식 관리가 번거롭습니다', d: '종이 양식의 보관·검색·법적 보존이 부담으로 다가옵니다.' },
    ],
    solutions: [
      { icon: '<svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>', t: '원클릭 셋업', d: '덴트웹 기반 전자차트를 의원 환경에 맞춰 즉시 사용 가능 상태로 셋업합니다.' },
      { icon: '<svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/></svg>', t: '커스텀 양식 제공', d: '진료 특성에 맞춘 문진표·동의서·진료탭을 즉시 사용할 수 있게 제공합니다.' },
      { icon: '<svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/></svg>', t: '부서별 활용 교육', d: '진료실·데스크·상담실 각 부서별 전자차트 활용 전략을 구축·교육합니다.' },
    ],
    processes: [
      { t: '현황 진단', d: '기존 차트 운영 방식과 시스템 환경을 진단합니다.' },
      { t: '데이터 마이그레이션', d: '종이차트 등록 대행 및 기존 데이터 이관을 처리합니다.' },
      { t: '커스터마이징', d: '진료 방식에 맞춘 진료탭·양식·워크플로우를 구축합니다.' },
      { t: '교육·정착', d: '부서별 OJT 교육과 실무 적용 지원으로 빠르게 정착시킵니다.' },
    ],
    stats: [
      { n: 70, suffix: '%↓', l: '차트 작성 시간 단축' },
      { n: 4, suffix: '주', l: '평균 시스템 정착 기간' },
      { n: 9, suffix: '가지', l: '제공 커스텀 양식' },
      { n: 100, suffix: '%', l: '주요 EMR 호환' },
    ],
    faqs: [
      { q: '기존 종이차트는 어떻게 처리되나요?', a: '덴업이 직접 종이차트 등록 대행 서비스를 제공합니다. 환자별 이력을 전자화하여 검색 가능한 상태로 만듭니다.' },
      { q: '교육 기간은 얼마나 걸리나요?', a: '부서별 단계 교육으로 평균 2~3주 내 실무 적용이 가능합니다. 정착 후에도 1개월 운영 지원이 포함됩니다.' },
      { q: '커스텀 양식 추가는 가능한가요?', a: '네, 의원의 진료 특성에 맞춰 문진표·동의서·진료탭을 자유롭게 커스터마이징합니다.' },
      { q: '클라우드 백업은 안전한가요?', a: '의료법에 부합하는 보안 기준으로 운영되며, 자동 백업과 접근 권한 관리를 지원합니다.' },
    ],
  },
  desk: {
    title: '데스크업무 UP',
    sub: '콜 응대부터 행정·예약 관리까지, 데스크 업무를 통째로 아웃소싱하세요.',
    problems: [
      { t: '데스크 직원 채용이 너무 어렵습니다', d: '구인난과 잦은 이직으로 안정적 운영이 힘듭니다.' },
      { t: '인건비 부담이 점점 커집니다', d: '4대보험·퇴직금까지 고려하면 데스크 1명당 월 400만원 이상.' },
      { t: '환자 콜·문자 응대가 누락됩니다', d: '진료 중에는 부재중 콜·문자가 쌓여 예약 기회를 잃습니다.' },
    ],
    solutions: [
      { icon: '<svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>', t: 'OUT/IN CALL 서비스', d: '전문 상담원이 30분 안에/7일 간격/10번 이상 체계적으로 콜 관리.' },
      { icon: '<svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>', t: '예약 관리 자동화', d: '예약 확인·변경·취소를 자동화하고 노쇼율을 낮춥니다.' },
      { icon: '<svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/><line x1="16" y1="13" x2="8" y2="13"/></svg>', t: '문서 제작 대행', d: '동의서·주의사항·재증명서 등 원내 필요 문서를 즉시 제작.' },
    ],
    processes: [
      { t: '업무 진단', d: '현재 데스크 업무 패턴과 병목 지점을 분석합니다.' },
      { t: '서비스 설계', d: '의원 규모·진료 특성에 맞춘 아웃소싱 범위를 설계합니다.' },
      { t: '시스템 연결', d: '예약 시스템·EMR·콜 시스템을 통합해 단일 워크플로우로 운영.' },
      { t: '운영 시작', d: '전담 상담원이 배치되어 즉시 콜·예약·행정을 운영합니다.' },
    ],
    stats: [
      { n: 60, suffix: '%↑', l: '환자 만족도 향상' },
      { n: 20, suffix: '%↓', l: '예약 취소율 감소' },
      { n: 30, suffix: '%↓', l: '행정 업무부담 감소' },
      { n: 50, suffix: '%↓', l: '인건비 절감' },
    ],
    faqs: [
      { q: '기존 데스크 직원과 병행 가능한가요?', a: '네, 전체 아웃소싱이 아닌 부분 아웃소싱(콜만/예약만/행정만)도 가능합니다.' },
      { q: '환자 정보 보안은 어떻게 보장하나요?', a: '의료법에 따른 개인정보보호 교육을 받은 전문 상담원이 배정되며, 암호화 통신과 접근 로그를 운영합니다.' },
      { q: '응대 시간은 어떻게 되나요?', a: '평일 09:00~21:00 기본 운영, 주말·심야 옵션 추가 가능합니다.' },
      { q: '계약 기간은 어떻게 되나요?', a: '최소 3개월 단위로 계약하며, 운영 후 자유롭게 갱신·종료할 수 있습니다.' },
    ],
  },
  consulting: {
    title: '치과 경영 업무 UP',
    sub: '데이터 기반의 전략적 경영으로 치과 운영을 더욱 단단하게 만듭니다.',
    problems: [
      { t: '경영 데이터가 흩어져 있습니다', d: 'EMR·예약·청구 데이터가 따로 놀아 통합 분석이 어렵습니다.' },
      { t: '직원 채용·관리가 어렵습니다', d: '채용 공고부터 면접·OJT·세무·노무까지 원장이 다 챙겨야 합니다.' },
      { t: 'KPI 없이 감으로 운영합니다', d: '핵심 지표 없이 운영하다 보니 개선 방향이 보이지 않습니다.' },
    ],
    solutions: [
      { icon: '<svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>', t: '데이터 통합 분석', d: '경영·진료·재무 데이터를 통합해 핵심 지표(KPI)를 실시간 모니터링.' },
      { icon: '<svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>', t: '운영 시스템 구축', d: '업무 프로세스·인력 관리·비용 구조를 최적화하는 시스템을 구축.' },
      { icon: '<svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>', t: '비상주 경영지원실', d: '직원 채용·OJT·세무·노무를 원스톱으로 처리합니다.' },
    ],
    processes: [
      { t: '경영 진단', d: '재무·인력·운영·마케팅 전반을 진단해 핵심 이슈를 도출합니다.' },
      { t: 'KPI 설정', d: '의원 목표에 맞춘 핵심 성과 지표를 설정하고 측정 체계를 구축.' },
      { t: '시스템 구축', d: '업무 프로세스를 표준화하고 운영 자동화 도구를 도입합니다.' },
      { t: '월간 운영', d: '월간 리포트와 비상주 지원으로 지속적인 경영 파트너십 운영.' },
    ],
    stats: [
      { n: 35, suffix: '%↑', l: '평균 매출 증가' },
      { n: 40, suffix: '%↓', l: '인력 관리 시간 절감' },
      { n: 12, suffix: '개', l: '핵심 KPI 표준 지표' },
      { n: 24, suffix: '시간', l: '월간 컨설팅 제공' },
    ],
    faqs: [
      { q: '비상주 경영지원실이란 무엇인가요?', a: '풀타임 직원을 채용하지 않고도 경영지원실 기능(채용·세무·노무·내규)을 외부 전문가가 대행하는 서비스입니다.' },
      { q: '월간 리포트는 어떤 내용인가요?', a: '매출·환자수·재방문율·청구 결과·KPI 달성률 등 핵심 지표를 한눈에 보고, 다음 달 개선안을 제시합니다.' },
      { q: '계약 기간과 비용은요?', a: '최소 6개월 단위로 계약하며, 의원 규모에 따라 월 단위 패키지가 다릅니다. 무료 진단 후 견적 제공.' },
      { q: '다른 컨설턴트와의 차이는?', a: '단발성 컨설팅이 아닌 지속적 운영 파트너십이며, 데스크·차트·보험까지 통합 솔루션을 제공한다는 점입니다.' },
    ],
  },
};

const SERVICE_PAGES = [
  {
    slug: 'services/insurance', eyebrow: 'INSURANCE UP',
    others: [
      { href: '/services/chart', t: '전자차트 UP', d: '전자차트 셋업·교육·커스터마이징' },
      { href: '/services/desk', t: '데스크업무 UP', d: '콜·예약·행정 업무 아웃소싱' },
      { href: '/services/consulting', t: '치과 경영 업무 UP', d: '데이터 기반 전략 경영지원' },
    ],
  },
  {
    slug: 'services/chart', eyebrow: 'CHART UP',
    others: [
      { href: '/services/insurance', t: '치과건강보험 UP', d: '청구 오류 최소화 + 매출 향상' },
      { href: '/services/desk', t: '데스크업무 UP', d: '콜·예약·행정 업무 아웃소싱' },
      { href: '/services/consulting', t: '치과 경영 업무 UP', d: '데이터 기반 전략 경영지원' },
    ],
  },
  {
    slug: 'services/desk', eyebrow: 'DESK UP',
    others: [
      { href: '/services/insurance', t: '치과건강보험 UP', d: '청구 오류 최소화 + 매출 향상' },
      { href: '/services/chart', t: '전자차트 UP', d: '전자차트 셋업·교육·커스터마이징' },
      { href: '/services/consulting', t: '치과 경영 업무 UP', d: '데이터 기반 전략 경영지원' },
    ],
  },
  {
    slug: 'services/consulting', eyebrow: 'CONSULTING UP',
    others: [
      { href: '/services/insurance', t: '치과건강보험 UP', d: '청구 오류 최소화 + 매출 향상' },
      { href: '/services/chart', t: '전자차트 UP', d: '전자차트 셋업·교육·커스터마이징' },
      { href: '/services/desk', t: '데스크업무 UP', d: '콜·예약·행정 업무 아웃소싱' },
    ],
  },
];

// ── 헤더 (Dropdown) ─────────────────────────────────────────────────────────
const HEADER_CONTENT = `<header class="denup-header" id="denupHeader" role="banner">
  <div class="denup-wrap denup-header-inner">
    <a href="/" class="denup-logo" aria-label="DENUP 홈">
      <img src="/uploads/denup/logo.png" alt="DENUP" class="denup-logo-img" />
    </a>
    <nav class="denup-nav" id="denupNav" aria-label="주 메뉴">
      <a href="/about">회사소개</a>
      <div class="denup-nav-dropdown">
        <button type="button" class="denup-nav-trigger" aria-haspopup="true" aria-expanded="false">서비스 <svg width="10" height="6" viewBox="0 0 10 6" fill="none" stroke="currentColor" stroke-width="2"><polyline points="1 1 5 5 9 1"/></svg></button>
        <div class="denup-nav-menu" role="menu">
          <a href="/services/insurance" role="menuitem">
            <strong>치과건강보험 UP</strong>
            <span>청구 오류 최소화 + 매출 향상</span>
          </a>
          <a href="/services/chart" role="menuitem">
            <strong>전자차트 UP</strong>
            <span>전자차트 셋업·교육·커스터마이징</span>
          </a>
          <a href="/services/desk" role="menuitem">
            <strong>데스크업무 UP</strong>
            <span>콜·예약·행정 업무 아웃소싱</span>
          </a>
          <a href="/services/consulting" role="menuitem">
            <strong>치과 경영 업무 UP</strong>
            <span>데이터 기반 전략 경영지원</span>
          </a>
        </div>
      </div>
      <a href="/contact">오시는길 · 문의</a>
    </nav>
    <div class="denup-header-actions">
      <a href="/login" class="denup-login-btn">로그인</a>
    </div>
    <button class="denup-mobile-toggle" aria-label="메뉴" onclick="document.getElementById('denupNav').classList.toggle('open')">☰</button>
  </div>
</header>
<script>
(function(){
  var header = document.getElementById('denupHeader');
  if (!header) return;
  function update(){
    if (window.scrollY > 8) header.classList.add('scrolled'); else header.classList.remove('scrolled');
  }
  window.addEventListener('scroll', update, { passive: true });
  update();
  // 드롭다운: 데스크탑 hover, 모바일 click
  var dd = header.querySelector('.denup-nav-dropdown');
  if (dd){
    var trigger = dd.querySelector('.denup-nav-trigger');
    if (trigger){
      trigger.addEventListener('click', function(e){
        e.preventDefault(); e.stopPropagation();
        dd.classList.toggle('open');
        trigger.setAttribute('aria-expanded', dd.classList.contains('open'));
      });
    }
    document.addEventListener('click', function(e){
      if (!dd.contains(e.target)) dd.classList.remove('open');
    });
  }
})();
</script>`;

const HEADER_CSS = `
@import url('https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/packages/pretendard-gov/dist/web/variable/pretendardvariable-gov.min.css');
.denup-header { position: sticky; top: 0; z-index: 100; background: #ffffff; border-bottom: 1px solid #E4E4E4; transition: box-shadow 200ms ease; font-family: 'Pretendard GOV Variable','Pretendard GOV',-apple-system,sans-serif; }
.denup-header.scrolled { box-shadow: 0 2px 8px rgba(0,0,0,0.06); }
.denup-header-inner { display: flex; align-items: center; justify-content: space-between; padding: 16px 32px; max-width: 1280px; margin: 0 auto; gap: 24px; min-height: 80px; }
.denup-logo { display: inline-flex; align-items: center; text-decoration: none; }
.denup-logo:focus-visible { outline: 2px solid #244BEB; outline-offset: 4px; border-radius: 4px; }
.denup-logo-img { height: 38px; width: auto; display: block; }
.denup-nav { display: flex; gap: 32px; align-items: center; }
.denup-nav > a, .denup-nav-trigger { font-size: 1rem; font-weight: 600; color: #1D1D1D; text-decoration: none; padding: 8px 0; background: none; border: none; cursor: pointer; font-family: inherit; transition: color 200ms ease; display: inline-flex; align-items: center; gap: 6px; min-height: 44px; }
.denup-nav > a:hover, .denup-nav-trigger:hover { color: #244BEB; }
.denup-nav > a:focus-visible, .denup-nav-trigger:focus-visible { outline: 2px solid #244BEB; outline-offset: 4px; border-radius: 4px; }
.denup-nav-dropdown { position: relative; }
.denup-nav-menu { position: absolute; top: calc(100% + 12px); left: 50%; transform: translateX(-50%) translateY(-4px); background: #fff; border: 1px solid #E4E4E4; border-radius: 10px; box-shadow: 0 8px 24px rgba(0,0,0,0.08); min-width: 320px; padding: 8px; opacity: 0; visibility: hidden; transition: opacity 200ms ease, transform 200ms ease, visibility 200ms ease; }
.denup-nav-dropdown:hover .denup-nav-menu, .denup-nav-dropdown.open .denup-nav-menu { opacity: 1; visibility: visible; transform: translateX(-50%) translateY(0); }
.denup-nav-menu a { display: block; padding: 14px 18px; border-radius: 8px; color: #1D1D1D; text-decoration: none; transition: background 200ms ease; }
.denup-nav-menu a:hover { background: #EFF5FF; }
.denup-nav-menu a:focus-visible { outline: 2px solid #244BEB; outline-offset: -2px; }
.denup-nav-menu strong { display: block; font-size: 1rem; font-weight: 700; color: #1D1D1D; margin-bottom: 2px; }
.denup-nav-menu span { display: block; font-size: 0.875rem; color: #555555; }
.denup-header-actions { display: flex; gap: 10px; }
.denup-login-btn { font-size: 0.9375rem; font-weight: 700; padding: 12px 24px; background: #244BEB; color: #fff; border-radius: 8px; text-decoration: none; transition: background-color 200ms ease; min-height: 48px; display: inline-flex; align-items: center; }
.denup-login-btn:hover { background: #1D56BC; }
.denup-login-btn:active { background: #16408D; }
.denup-login-btn:focus-visible { outline: 2px solid #244BEB; outline-offset: 3px; }
.denup-mobile-toggle { display: none; background: none; border: 1px solid transparent; padding: 8px 12px; border-radius: 8px; font-size: 1.5rem; cursor: pointer; color: #1D1D1D; min-height: 44px; min-width: 44px; }
.denup-mobile-toggle:focus-visible { outline: 2px solid #244BEB; outline-offset: 2px; }
@media (max-width: 1000px) {
  .denup-nav { display: none; position: absolute; top: 100%; left: 0; right: 0; flex-direction: column; align-items: stretch; background: #fff; border-bottom: 1px solid #E4E4E4; padding: 16px 24px; gap: 0; box-shadow: 0 8px 20px rgba(0,0,0,0.06); }
  .denup-nav.open { display: flex; }
  .denup-nav > a, .denup-nav-trigger { padding: 16px 0; border-bottom: 1px solid #F0F0F0; width: 100%; justify-content: space-between; min-height: 48px; }
  .denup-nav-dropdown { width: 100%; }
  .denup-nav-menu { position: static; transform: none !important; opacity: 1; visibility: visible; box-shadow: none; border: none; min-width: 0; padding: 0 0 8px 16px; max-height: 0; overflow: hidden; transition: max-height 300ms ease; background: transparent; }
  .denup-nav-dropdown.open .denup-nav-menu { max-height: 400px; }
  .denup-nav-menu a { padding: 14px 8px; border-bottom: 1px solid #F0F0F0; }
  .denup-mobile-toggle { display: inline-flex; align-items: center; justify-content: center; }
  .denup-header-actions { display: none; }
  .denup-logo-img { height: 32px; }
  .denup-header-inner { padding: 14px 20px; min-height: 64px; }
}
`;

// ── 푸터 (KRDS Footer 패턴) ─────────────────────────────────────────────────
const FOOTER_CSS = `
.denup-footer { background: #1D1D1D; color: #C6C6C6; padding: 56px 0 24px; font-family: 'Pretendard GOV Variable','Pretendard GOV',-apple-system,sans-serif; }
.denup-footer .denup-wrap { max-width: 1280px; margin: 0 auto; padding: 0 24px; box-sizing: border-box; }
.denup-footer-grid { display: grid; grid-template-columns: 1.5fr 1fr 1fr 1fr; gap: 40px; margin-bottom: 40px; }
.denup-footer-tagline { font-size: 0.9375rem; color: #8E8E8E; margin: 0; line-height: 1.6; }
.denup-footer-heading { font-size: 0.9375rem; font-weight: 700; color: #fff; margin: 0 0 16px; letter-spacing: 0.02em; }
.denup-footer-list { list-style: none; padding: 0; margin: 0; display: grid; gap: 10px; }
.denup-footer-list li { font-size: 0.9375rem; color: #C6C6C6; line-height: 1.6; }
.denup-footer-list a { color: #C6C6C6; text-decoration: none; transition: color 200ms ease; }
.denup-footer-list a:hover { color: #fff; text-decoration: underline; }
.denup-footer-list a:focus-visible { outline: 2px solid #5089EF; outline-offset: 2px; border-radius: 2px; }
.denup-footer-bottom { display: flex; justify-content: space-between; align-items: center; padding-top: 24px; border-top: 1px solid rgba(255,255,255,0.12); font-size: 0.8125rem; color: #8E8E8E; }
.denup-footer-bottom div { display: flex; gap: 20px; }
.denup-footer-bottom a { color: #8E8E8E; text-decoration: none; transition: color 200ms ease; }
.denup-footer-bottom a:hover { color: #fff; text-decoration: underline; }
.denup-footer-bottom a:focus-visible { outline: 2px solid #5089EF; outline-offset: 2px; border-radius: 2px; }
@media (max-width: 768px) {
  .denup-footer-grid { grid-template-columns: 1fr 1fr; gap: 32px; }
  .denup-footer-bottom { flex-direction: column; gap: 12px; text-align: center; }
}
`;

const FOOTER_CONTENT = `<footer class="denup-footer">
  <div class="denup-wrap">
    <div class="denup-footer-grid">
      <div>
        <img src="/uploads/denup/logo.png" alt="DENUP" style="height:36px; width:auto; margin-bottom:14px; filter: brightness(0) invert(1);" />
        <p class="denup-footer-tagline">치과의 제갈공명, 덴업이 함께합니다.</p>
      </div>
      <div>
        <p class="denup-footer-heading">회사</p>
        <ul class="denup-footer-list">
          <li><a href="/about">회사소개</a></li>
          <li><a href="/contact">오시는길</a></li>
          <li><a href="/contact">상담 문의</a></li>
        </ul>
      </div>
      <div>
        <p class="denup-footer-heading">서비스</p>
        <ul class="denup-footer-list">
          <li><a href="/services/insurance">치과건강보험 UP</a></li>
          <li><a href="/services/chart">전자차트 UP</a></li>
          <li><a href="/services/desk">데스크업무 UP</a></li>
          <li><a href="/services/consulting">치과 경영 업무 UP</a></li>
        </ul>
      </div>
      <div>
        <p class="denup-footer-heading">연락처</p>
        <ul class="denup-footer-list">
          <li>대표번호: 010-5152-7943</li>
          <li>이메일: contact@denup.co.kr</li>
          <li>주소: 서울시 강남구 학동로2길 19<br/>(논현동, 세일빌딩)</li>
        </ul>
      </div>
    </div>
    <div class="denup-footer-bottom">
      <p>&copy; 덴업 DENUP. All rights reserved. | 대표 이지수 | 사업자등록번호 208-28-51975</p>
      <div>
        <a href="/privacy">개인정보처리방침</a>
        <a href="/terms">이용약관</a>
      </div>
    </div>
  </div>
</footer>`;

// ── DB 작업 ──────────────────────────────────────────────────────────────────
const db = new sqlite3.Database(DB_PATH);
function run(sql, params = []) { return new Promise((res, rej) => db.run(sql, params, function (err) { if (err) rej(err); else res(this); })); }
function get(sql, params = []) { return new Promise((res, rej) => db.get(sql, params, (err, row) => { if (err) rej(err); else res(row); })); }

async function upsertPage(slug, title, content, css, js, pageType, sortOrder) {
  const existing = await get('SELECT id FROM pages WHERE slug = ? AND hospital_id = ?', [slug, HOSPITAL_ID]);
  if (existing) {
    await run(
      `UPDATE pages SET title=?, content=?, custom_css=?, custom_js=?, page_type=?, sort_order=?, is_published=1, updated_at=CURRENT_TIMESTAMP WHERE id=?`,
      [title, content, css, js || '', pageType, sortOrder, existing.id]
    );
    console.log(`  [UPDATE] ${slug}`);
  } else {
    await run(
      `INSERT INTO pages (hospital_id, slug, title, content, custom_css, custom_js, meta_title, meta_description, is_published, sort_order, page_type)
       VALUES (?, ?, ?, ?, ?, ?, ?, '', 1, ?, ?)`,
      [HOSPITAL_ID, slug, title, content, css, js || '', title, sortOrder, pageType]
    );
    console.log(`  [INSERT] ${slug}`);
  }
}

async function main() {
  console.log('[Phase 2 멀티페이지 확장 시작]');
  try {
    // 헤더/푸터 갱신
    await upsertPage('_header', '공통 헤더', HEADER_CONTENT, HEADER_CSS, '', 'layout', -10);
    await upsertPage('_footer', '공통 푸터', FOOTER_CONTENT, FOOTER_CSS, '', 'layout', 999);

    // about / contact
    await upsertPage('about', '회사소개', ABOUT_CONTENT, PAGE_CSS, PAGE_JS, 'custom', 10);
    await upsertPage('contact', '오시는길 · 문의', CONTACT_CONTENT, PAGE_CSS, PAGE_JS, 'custom', 90);

    // services
    let order = 20;
    for (const meta of SERVICE_PAGES) {
      const data = SERVICE_DATA[meta.slug.split('/')[1]];
      const html = buildServicePage({
        eyebrow: meta.eyebrow,
        title: data.title,
        sub: data.sub,
        problems: data.problems,
        solutions: data.solutions,
        processes: data.processes,
        stats: data.stats,
        faqs: data.faqs,
        otherServices: meta.others,
      });
      await upsertPage(meta.slug, data.title, html, PAGE_CSS, PAGE_JS, 'custom', order);
      order += 1;
    }

    console.log('[완료]');
  } catch (e) {
    console.error('[에러]', e.message);
    process.exitCode = 1;
  } finally {
    db.close();
  }
}

main();
