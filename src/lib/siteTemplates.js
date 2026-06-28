/**
 * 병원 생성 시 선택 가능한 메인 페이지 템플릿.
 * 각 템플릿은 메인 페이지의 content/custom_css를 제공한다.
 */

import { getLightHeader, getLightFooter, getLightMain } from '@/lib/templates/lightTemplate';

export const SITE_TEMPLATES = {
  blank: {
    key: 'blank',
    name: '빈 템플릿',
    description: '기본 뼈대만 제공. 처음부터 디자인을 시작합니다.',
    main: {
      content: `<section class="page-section">
  <div class="container">
    <h2 class="section-title">{{hospital_name}}에 오신 것을 환영합니다</h2>
    <p class="section-desc">이곳에 내용을 작성해 주세요.</p>
  </div>
</section>`,
      custom_css: `.page-section { padding: 60px 0; }
.container { max-width: 1100px; margin: 0 auto; padding: 0 20px; }
.section-title { font-size: 2rem; font-weight: 800; color: #18181b; margin-bottom: 16px; }
.section-desc { font-size: 1rem; color: #71717a; line-height: 1.8; }`,
    },
  },

  modern: {
    key: 'modern',
    name: '모던 클린 템플릿',
    description: '블루 포인트 컬러 · 깔끔한 히어로 + 서비스 카드 + CTA',
    main: {
      content: `<!-- 히어로 섹션 -->
<section class="mod-hero">
  <div class="mod-container">
    <p class="mod-kicker">HEALTHCARE EXCELLENCE</p>
    <h1 class="mod-hero-title">{{hospital_name}}</h1>
    <p class="mod-hero-desc">믿을 수 있는 진료,<br/>편안한 경험을 약속드립니다.</p>
    <div class="mod-hero-btns">
      <a href="/consult" class="mod-btn mod-btn-primary">상담 신청</a>
      <a href="#services" class="mod-btn mod-btn-ghost">진료 안내</a>
    </div>
  </div>
</section>

<!-- 특징 3단 -->
<section class="mod-features">
  <div class="mod-container">
    <div class="mod-feature-grid">
      <div class="mod-feature-card">
        <div class="mod-feature-icon">01</div>
        <h3>정확한 진단</h3>
        <p>최신 장비와 경험 많은 의료진이 정확한 진단을 제공합니다.</p>
      </div>
      <div class="mod-feature-card">
        <div class="mod-feature-icon">02</div>
        <h3>맞춤형 치료</h3>
        <p>환자 개개인의 상태에 맞는 치료 계획을 수립합니다.</p>
      </div>
      <div class="mod-feature-card">
        <div class="mod-feature-icon">03</div>
        <h3>편안한 환경</h3>
        <p>안심하고 진료받을 수 있는 쾌적한 환경을 제공합니다.</p>
      </div>
    </div>
  </div>
</section>

<!-- CTA -->
<section id="services" class="mod-cta">
  <div class="mod-container mod-cta-inner">
    <div>
      <h2>지금 바로 상담받으세요</h2>
      <p>전문의가 직접 상담해 드립니다.</p>
    </div>
    <a href="/consult" class="mod-btn mod-btn-primary">상담 신청하기</a>
  </div>
</section>`,
      custom_css: `.mod-container { max-width: 1200px; margin: 0 auto; padding: 0 20px; }

.mod-hero { background: linear-gradient(135deg, #1e3a8a 0%, #2563eb 100%); color: #fff; padding: 120px 20px; text-align: center; }
.mod-kicker { font-size: 13px; font-weight: 800; letter-spacing: 4px; color: rgba(255,255,255,0.7); margin-bottom: 16px; }
.mod-hero-title { font-size: clamp(2.5rem, 6vw, 4.5rem); font-weight: 900; margin: 0 0 20px; letter-spacing: -0.02em; }
.mod-hero-desc { font-size: clamp(1rem, 2vw, 1.25rem); line-height: 1.6; color: rgba(255,255,255,0.85); margin: 0 0 40px; }
.mod-hero-btns { display: flex; gap: 12px; justify-content: center; flex-wrap: wrap; }

.mod-btn { display: inline-block; padding: 14px 32px; border-radius: 999px; font-weight: 700; font-size: 15px; text-decoration: none; transition: all 0.2s; }
.mod-btn-primary { background: #fff; color: #1e3a8a; }
.mod-btn-primary:hover { transform: translateY(-2px); box-shadow: 0 10px 20px rgba(0,0,0,0.15); }
.mod-btn-ghost { background: transparent; color: #fff; border: 1px solid rgba(255,255,255,0.4); }
.mod-btn-ghost:hover { background: rgba(255,255,255,0.1); }

.mod-features { padding: 100px 20px; background: #fff; }
.mod-feature-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); gap: 24px; }
.mod-feature-card { padding: 40px 32px; border: 1px solid #e4e4e7; border-radius: 20px; transition: all 0.2s; }
.mod-feature-card:hover { border-color: #2563eb; transform: translateY(-4px); box-shadow: 0 20px 40px rgba(37,99,235,0.08); }
.mod-feature-icon { font-size: 12px; font-weight: 800; color: #2563eb; letter-spacing: 2px; margin-bottom: 16px; }
.mod-feature-card h3 { font-size: 1.25rem; font-weight: 800; color: #18181b; margin: 0 0 12px; }
.mod-feature-card p { font-size: 14px; line-height: 1.7; color: #71717a; margin: 0; }

.mod-cta { padding: 100px 20px; background: #f8fafc; }
.mod-cta-inner { display: flex; align-items: center; justify-content: space-between; gap: 24px; flex-wrap: wrap; }
.mod-cta h2 { font-size: 2rem; font-weight: 800; color: #18181b; margin: 0 0 8px; }
.mod-cta p { font-size: 1rem; color: #71717a; margin: 0; }
.mod-cta .mod-btn-primary { background: #2563eb; color: #fff; }
.mod-cta .mod-btn-primary:hover { background: #1d4ed8; }
`,
    },
  },

  premium: {
    key: 'premium',
    name: '프리미엄 템플릿',
    description: '다크 · 골드 악센트 · 럭셔리 의료 컨셉',
    main: {
      content: `<!-- 프리미엄 히어로 -->
<section class="pr-hero">
  <div class="pr-hero-bg"></div>
  <div class="pr-container pr-hero-inner">
    <span class="pr-line"></span>
    <p class="pr-kicker">Premium Healthcare</p>
    <h1 class="pr-hero-title">{{hospital_name}}</h1>
    <p class="pr-hero-desc">품격있는 진료 경험,<br/>당신만을 위한 맞춤 케어.</p>
    <a href="/consult" class="pr-btn">상담 예약하기 →</a>
  </div>
</section>

<!-- 가치 -->
<section class="pr-values">
  <div class="pr-container">
    <div class="pr-values-head">
      <p class="pr-kicker pr-kicker-dark">OUR VALUES</p>
      <h2>다른 차원의 의료 서비스</h2>
    </div>
    <div class="pr-value-grid">
      <div class="pr-value">
        <div class="pr-value-num">01</div>
        <h3>전문성</h3>
        <p>각 분야 최고 전문의가 직접 진료하며, 최신 의학 지식을 기반으로 최적의 치료를 제공합니다.</p>
      </div>
      <div class="pr-value">
        <div class="pr-value-num">02</div>
        <h3>프라이버시</h3>
        <p>독립 진료실과 프라이빗 상담실을 통해 편안하고 안전한 진료 환경을 보장합니다.</p>
      </div>
      <div class="pr-value">
        <div class="pr-value-num">03</div>
        <h3>사후관리</h3>
        <p>치료 이후에도 지속적인 관리와 정기 점검으로 완성도 높은 케어를 약속드립니다.</p>
      </div>
    </div>
  </div>
</section>

<!-- CTA -->
<section class="pr-cta">
  <div class="pr-container">
    <h2>지금 상담 예약하세요</h2>
    <p>1:1 전문 상담을 통해 맞춤 치료 계획을 안내해 드립니다.</p>
    <a href="/consult" class="pr-btn">예약하기 →</a>
  </div>
</section>`,
      custom_css: `.pr-container { max-width: 1200px; margin: 0 auto; padding: 0 24px; }
.pr-kicker { font-size: 11px; font-weight: 700; letter-spacing: 6px; color: #c5a467; text-transform: uppercase; }
.pr-kicker-dark { color: #c5a467; }

.pr-hero { position: relative; min-height: 85vh; display: flex; align-items: center; background: #0a0a0a; color: #fff; overflow: hidden; }
.pr-hero-bg { position: absolute; inset: 0; background: radial-gradient(circle at 20% 50%, rgba(197,164,103,0.15) 0%, transparent 60%), #0a0a0a; }
.pr-hero-inner { position: relative; z-index: 2; }
.pr-line { display: block; width: 60px; height: 2px; background: #c5a467; margin-bottom: 24px; }
.pr-hero-title { font-size: clamp(3rem, 7vw, 5.5rem); font-weight: 300; letter-spacing: -0.02em; line-height: 1.1; margin: 20px 0; }
.pr-hero-desc { font-size: clamp(1rem, 2vw, 1.3rem); line-height: 1.7; color: rgba(255,255,255,0.7); margin: 24px 0 48px; font-weight: 300; }
.pr-btn { display: inline-block; padding: 16px 36px; border: 1px solid #c5a467; color: #c5a467; text-decoration: none; font-weight: 600; font-size: 14px; letter-spacing: 2px; transition: all 0.3s; }
.pr-btn:hover { background: #c5a467; color: #0a0a0a; }

.pr-values { padding: 120px 20px; background: #fafafa; }
.pr-values-head { text-align: center; margin-bottom: 64px; }
.pr-values-head h2 { font-size: clamp(1.75rem, 4vw, 2.5rem); font-weight: 300; color: #18181b; margin: 16px 0 0; letter-spacing: -0.02em; }
.pr-value-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 48px; }
.pr-value { padding: 0 16px; }
.pr-value-num { font-size: 3rem; font-weight: 300; color: #c5a467; margin-bottom: 16px; font-family: Georgia, serif; }
.pr-value h3 { font-size: 1.3rem; font-weight: 700; color: #18181b; margin: 0 0 16px; }
.pr-value p { font-size: 14px; line-height: 1.8; color: #3f3f46; margin: 0; }

.pr-cta { padding: 120px 20px; background: #0a0a0a; color: #fff; text-align: center; }
.pr-cta h2 { font-size: clamp(1.75rem, 4vw, 2.5rem); font-weight: 300; margin: 0 0 16px; }
.pr-cta p { color: rgba(255,255,255,0.7); margin: 0 0 40px; font-size: 1rem; }
`,
    },
  },
};

// ────────────────────────────────────────────────────────────────────────
// 공통 헤더/푸터 템플릿 (각 사이트 템플릿별 스타일 차별화)
// ────────────────────────────────────────────────────────────────────────

const HEADER_JS = `
(function(){
  // 모바일 햄버거 토글
  var btn = document.querySelector('.hdr-hamburger');
  var overlay = document.querySelector('.hdr-mobile-overlay');
  var closeBtn = document.querySelector('.hdr-mobile-close');
  if (btn && overlay) btn.addEventListener('click', function(){ overlay.classList.add('active'); document.body.style.overflow = 'hidden'; });
  if (closeBtn && overlay) closeBtn.addEventListener('click', function(){ overlay.classList.remove('active'); document.body.style.overflow = ''; });
  if (overlay) overlay.addEventListener('click', function(e){ if (e.target === overlay) { overlay.classList.remove('active'); document.body.style.overflow = ''; } });

  // 로그인 상태에 따라 로그인/회원가입/로그아웃 표시
  fetch('/api/auth/me', { credentials: 'same-origin' })
    .then(function(r){ return r.json(); })
    .then(function(d){
      if (d.loggedIn) {
        document.body.classList.add('is-logged-in');
        document.querySelectorAll('.auth-user-name').forEach(function(el){ el.textContent = (d.patient?.name || '') + '님'; });
      } else {
        document.body.classList.add('is-guest');
      }
    })
    .catch(function(){ document.body.classList.add('is-guest'); });

  // 로그아웃
  var logoutBtns = document.querySelectorAll('.hdr-logout');
  logoutBtns.forEach(function(b){
    b.addEventListener('click', function(e){
      e.preventDefault();
      fetch('/api/auth/logout', { method: 'POST', credentials: 'same-origin' }).then(function(){ location.reload(); });
    });
  });
})();
`;

const AUTH_VISIBILITY_CSS = `
.auth-guest, .auth-user { display: none !important; }
body.is-logged-in .auth-user { display: inline-flex !important; }
body.is-guest .auth-guest { display: inline-flex !important; }
`;

// 공통 HTML 골격 (각 템플릿에서 공유)
function headerHtml() {
  return `<header class="hdr">
  <div class="hdr-inner">
    <a href="/" class="hdr-logo">{{hospital_name}}</a>
    <nav class="hdr-nav">
      <a href="/about/hospital">업체소개</a>
      <a href="/community/notice">공지사항</a>
      <a href="/community/event">이벤트</a>
    </nav>
    <div class="hdr-auth">
      <a href="/login" class="auth-guest">로그인</a>
      <a href="/register" class="auth-guest">회원가입</a>
      <a href="/mypage" class="auth-user auth-user-name"></a>
      <a href="#" class="auth-user hdr-logout">로그아웃</a>
    </div>
    <button type="button" class="hdr-hamburger" aria-label="메뉴 열기">
      <span></span><span></span><span></span>
    </button>
  </div>
</header>

<div class="hdr-mobile-overlay">
  <div class="hdr-mobile-inner">
    <button type="button" class="hdr-mobile-close" aria-label="메뉴 닫기">&times;</button>
    <nav class="hdr-mobile-nav">
      <a href="/">홈</a>
      <a href="/about/hospital">업체소개</a>
      <a href="/community/notice">공지사항</a>
      <a href="/community/event">이벤트</a>
      <div class="hdr-mobile-divider"></div>
      <a href="/login" class="auth-guest">로그인</a>
      <a href="/register" class="auth-guest">회원가입</a>
      <a href="/mypage" class="auth-user">마이페이지</a>
      <a href="#" class="auth-user hdr-logout">로그아웃</a>
    </nav>
  </div>
</div>`;
}

function footerHtml() {
  return `<footer class="ftr">
  <div class="ftr-inner">
    <div class="ftr-brand">{{hospital_name}}</div>
    <div class="ftr-info">
      <p>진료 시간 및 연락처는 관리자 페이지에서 설정하세요.</p>
    </div>
    <div class="ftr-links">
      <a href="/privacy">개인정보 처리방침</a>
      <span class="ftr-dot">·</span>
      <a href="/terms">이용약관</a>
    </div>
    <p class="ftr-copy">&copy; ${new Date().getFullYear()} {{hospital_name}}. All Rights Reserved.</p>
  </div>
</footer>`;
}

// 템플릿별 스타일
const LAYOUT_TEMPLATES = {
  blank: {
    header_css: `
.hdr { background: #fff; border-bottom: 1px solid #e4e4e7; position: sticky; top: 0; z-index: 100; }
.hdr-inner { max-width: 1200px; margin: 0 auto; padding: 0 24px; height: 64px; display: flex; align-items: center; gap: 32px; }
.hdr-logo { font-size: 1.25rem; font-weight: 800; color: #18181b; text-decoration: none; }
.hdr-nav { display: flex; gap: 24px; margin-left: auto; }
.hdr-nav a { font-size: 14px; font-weight: 600; color: #3f3f46; text-decoration: none; transition: color 0.15s; }
.hdr-nav a:hover { color: #18181b; }
.hdr-auth { display: flex; gap: 12px; align-items: center; }
.hdr-auth a { font-size: 13px; font-weight: 600; color: #71717a; text-decoration: none; }
.hdr-auth a:hover { color: #18181b; }
.hdr-hamburger { display: none; background: none; border: none; flex-direction: column; gap: 4px; cursor: pointer; padding: 8px; margin-left: auto; }
.hdr-hamburger span { display: block; width: 22px; height: 2px; background: #18181b; }
${AUTH_VISIBILITY_CSS}
.hdr-mobile-overlay { display: none; position: fixed; inset: 0; z-index: 200; background: rgba(0,0,0,0.5); }
.hdr-mobile-overlay.active { display: flex; }
.hdr-mobile-inner { margin-left: auto; width: 280px; height: 100%; background: #fff; padding: 24px; position: relative; }
.hdr-mobile-close { position: absolute; top: 16px; right: 16px; background: none; border: none; font-size: 28px; cursor: pointer; color: #71717a; }
.hdr-mobile-nav { display: flex; flex-direction: column; gap: 8px; margin-top: 40px; }
.hdr-mobile-nav a { padding: 12px 0; font-size: 15px; font-weight: 600; color: #18181b; text-decoration: none; border-bottom: 1px solid #f4f4f5; }
.hdr-mobile-divider { height: 1px; background: #e4e4e7; margin: 12px 0; }
@media (max-width: 768px) {
  .hdr-nav, .hdr-auth { display: none !important; }
  .hdr-hamburger { display: flex; }
}
`,
    footer_css: `
.ftr { background: #fafafa; border-top: 1px solid #e4e4e7; padding: 48px 24px; color: #3f3f46; }
.ftr-inner { max-width: 1200px; margin: 0 auto; text-align: center; }
.ftr-brand { font-size: 1.1rem; font-weight: 800; color: #18181b; margin-bottom: 12px; }
.ftr-info { font-size: 13px; color: #71717a; margin-bottom: 16px; }
.ftr-links { font-size: 13px; margin-bottom: 16px; }
.ftr-links a { color: #3f3f46; text-decoration: none; }
.ftr-links a:hover { color: #18181b; text-decoration: underline; }
.ftr-dot { margin: 0 8px; color: #d4d4d8; }
.ftr-copy { font-size: 12px; color: #a1a1aa; margin: 0; }
`,
  },

  modern: {
    header_css: `
.hdr { background: #fff; position: sticky; top: 0; z-index: 100; box-shadow: 0 1px 3px rgba(0,0,0,0.04); }
.hdr-inner { max-width: 1200px; margin: 0 auto; padding: 0 24px; height: 72px; display: flex; align-items: center; gap: 32px; }
.hdr-logo { font-size: 1.35rem; font-weight: 900; color: #1e3a8a; text-decoration: none; letter-spacing: -0.01em; }
.hdr-nav { display: flex; gap: 32px; margin-left: auto; }
.hdr-nav a { font-size: 14px; font-weight: 700; color: #3f3f46; text-decoration: none; position: relative; padding: 4px 0; }
.hdr-nav a:hover { color: #2563eb; }
.hdr-nav a::after { content: ''; position: absolute; bottom: -2px; left: 0; right: 0; height: 2px; background: #2563eb; transform: scaleX(0); transition: transform 0.2s; }
.hdr-nav a:hover::after { transform: scaleX(1); }
.hdr-auth { display: flex; gap: 8px; align-items: center; }
.hdr-auth a { padding: 8px 16px; font-size: 13px; font-weight: 700; border-radius: 999px; text-decoration: none; transition: all 0.15s; }
.hdr-auth a.auth-guest:first-of-type { color: #3f3f46; }
.hdr-auth a.auth-guest:first-of-type:hover { background: #f4f4f5; }
.hdr-auth a.auth-guest:nth-of-type(2), .hdr-auth a.hdr-logout { background: #2563eb; color: #fff; }
.hdr-auth a.auth-guest:nth-of-type(2):hover, .hdr-auth a.hdr-logout:hover { background: #1d4ed8; }
.hdr-auth a.auth-user-name { color: #2563eb; font-weight: 800; padding: 8px 12px; }
.hdr-hamburger { display: none; background: none; border: none; flex-direction: column; gap: 4px; cursor: pointer; padding: 8px; margin-left: auto; }
.hdr-hamburger span { display: block; width: 22px; height: 2px; background: #2563eb; }
${AUTH_VISIBILITY_CSS}
.hdr-mobile-overlay { display: none; position: fixed; inset: 0; z-index: 200; background: rgba(30,58,138,0.6); }
.hdr-mobile-overlay.active { display: flex; }
.hdr-mobile-inner { margin-left: auto; width: 300px; height: 100%; background: #fff; padding: 24px; position: relative; }
.hdr-mobile-close { position: absolute; top: 16px; right: 16px; background: none; border: none; font-size: 28px; cursor: pointer; color: #2563eb; }
.hdr-mobile-nav { display: flex; flex-direction: column; gap: 4px; margin-top: 48px; }
.hdr-mobile-nav a { padding: 14px 0; font-size: 15px; font-weight: 700; color: #18181b; text-decoration: none; border-bottom: 1px solid #f4f4f5; }
.hdr-mobile-divider { height: 1px; background: #e4e4e7; margin: 12px 0; }
@media (max-width: 900px) {
  .hdr-nav, .hdr-auth { display: none !important; }
  .hdr-hamburger { display: flex; }
}
`,
    footer_css: `
.ftr { background: #1e3a8a; color: #fff; padding: 64px 24px 32px; }
.ftr-inner { max-width: 1200px; margin: 0 auto; text-align: center; }
.ftr-brand { font-size: 1.5rem; font-weight: 900; margin-bottom: 16px; letter-spacing: -0.01em; }
.ftr-info { font-size: 14px; color: rgba(255,255,255,0.7); line-height: 1.8; margin-bottom: 24px; }
.ftr-links { font-size: 13px; margin-bottom: 32px; padding-bottom: 32px; border-bottom: 1px solid rgba(255,255,255,0.1); }
.ftr-links a { color: rgba(255,255,255,0.85); text-decoration: none; font-weight: 600; }
.ftr-links a:hover { color: #fff; text-decoration: underline; }
.ftr-dot { margin: 0 12px; color: rgba(255,255,255,0.3); }
.ftr-copy { font-size: 12px; color: rgba(255,255,255,0.5); margin: 0; }
`,
  },

  premium: {
    header_css: `
.hdr { background: #0a0a0a; color: #fff; position: sticky; top: 0; z-index: 100; border-bottom: 1px solid rgba(197,164,103,0.2); }
.hdr-inner { max-width: 1200px; margin: 0 auto; padding: 0 24px; height: 80px; display: flex; align-items: center; gap: 40px; }
.hdr-logo { font-size: 1.35rem; font-weight: 300; color: #fff; text-decoration: none; letter-spacing: 0.08em; border-left: 2px solid #c5a467; padding-left: 16px; }
.hdr-nav { display: flex; gap: 36px; margin-left: auto; }
.hdr-nav a { font-size: 13px; font-weight: 600; color: rgba(255,255,255,0.8); text-decoration: none; letter-spacing: 0.06em; text-transform: uppercase; transition: color 0.2s; }
.hdr-nav a:hover { color: #c5a467; }
.hdr-auth { display: flex; gap: 16px; align-items: center; }
.hdr-auth a { font-size: 12px; font-weight: 600; color: rgba(255,255,255,0.6); text-decoration: none; letter-spacing: 0.1em; text-transform: uppercase; transition: color 0.2s; }
.hdr-auth a:hover { color: #c5a467; }
.hdr-auth a.auth-user-name { color: #c5a467; }
.hdr-hamburger { display: none; background: none; border: none; flex-direction: column; gap: 4px; cursor: pointer; padding: 8px; margin-left: auto; }
.hdr-hamburger span { display: block; width: 22px; height: 1px; background: #c5a467; }
${AUTH_VISIBILITY_CSS}
.hdr-mobile-overlay { display: none; position: fixed; inset: 0; z-index: 200; background: rgba(0,0,0,0.9); }
.hdr-mobile-overlay.active { display: flex; }
.hdr-mobile-inner { margin-left: auto; width: 320px; height: 100%; background: #0a0a0a; padding: 24px; position: relative; border-left: 1px solid rgba(197,164,103,0.2); }
.hdr-mobile-close { position: absolute; top: 20px; right: 20px; background: none; border: none; font-size: 28px; cursor: pointer; color: #c5a467; }
.hdr-mobile-nav { display: flex; flex-direction: column; gap: 2px; margin-top: 60px; }
.hdr-mobile-nav a { padding: 16px 4px; font-size: 14px; font-weight: 600; color: rgba(255,255,255,0.8); text-decoration: none; border-bottom: 1px solid rgba(255,255,255,0.08); letter-spacing: 0.08em; text-transform: uppercase; }
.hdr-mobile-nav a:hover { color: #c5a467; }
.hdr-mobile-divider { height: 1px; background: rgba(197,164,103,0.3); margin: 16px 0; }
@media (max-width: 900px) {
  .hdr-nav, .hdr-auth { display: none !important; }
  .hdr-hamburger { display: flex; }
}
`,
    footer_css: `
.ftr { background: #0a0a0a; color: #fff; padding: 80px 24px 40px; border-top: 1px solid rgba(197,164,103,0.2); }
.ftr-inner { max-width: 1200px; margin: 0 auto; text-align: center; }
.ftr-brand { font-size: 1.5rem; font-weight: 300; color: #fff; letter-spacing: 0.08em; margin-bottom: 20px; }
.ftr-info { font-size: 13px; color: rgba(255,255,255,0.5); line-height: 1.9; margin-bottom: 32px; }
.ftr-links { font-size: 11px; margin-bottom: 40px; padding-bottom: 40px; border-bottom: 1px solid rgba(255,255,255,0.1); letter-spacing: 0.12em; text-transform: uppercase; }
.ftr-links a { color: #c5a467; text-decoration: none; font-weight: 600; }
.ftr-links a:hover { color: #fff; }
.ftr-dot { margin: 0 12px; color: rgba(197,164,103,0.3); }
.ftr-copy { font-size: 11px; color: rgba(255,255,255,0.3); margin: 0; letter-spacing: 0.1em; }
`,
  },
};

/**
 * 템플릿 키에 따라 메인 페이지 콘텐츠 반환
 */
// 라이트/베이직 템플릿은 별도 모듈(클린 메디컬 디자인 시스템)을 사용한다.
// 베이직(뎁스 20)은 라이트(뎁스 10)를 기반으로 확장 — 현재는 라이트 코어를 공유.
const LIGHT_KEYS = new Set(['light', 'basic']);

export function getMainPageContent(templateKey, hospitalName) {
  if (LIGHT_KEYS.has(templateKey)) return getLightMain(hospitalName);
  const template = SITE_TEMPLATES[templateKey] || SITE_TEMPLATES.blank;
  return {
    content: template.main.content.replace(/\{\{hospital_name\}\}/g, hospitalName || ''),
    custom_css: template.main.custom_css,
  };
}

/**
 * 템플릿 키에 따라 헤더/푸터 콘텐츠 반환
 */
export function getHeaderContent(templateKey, hospitalName) {
  if (LIGHT_KEYS.has(templateKey)) return getLightHeader(hospitalName);
  const layout = LAYOUT_TEMPLATES[templateKey] || LAYOUT_TEMPLATES.blank;
  return {
    content: headerHtml().replace(/\{\{hospital_name\}\}/g, hospitalName || ''),
    custom_css: layout.header_css,
    custom_js: HEADER_JS,
  };
}

export function getFooterContent(templateKey, hospitalName) {
  if (LIGHT_KEYS.has(templateKey)) return getLightFooter(hospitalName);
  const layout = LAYOUT_TEMPLATES[templateKey] || LAYOUT_TEMPLATES.blank;
  return {
    content: footerHtml().replace(/\{\{hospital_name\}\}/g, hospitalName || ''),
    custom_css: layout.footer_css,
    custom_js: '',
  };
}

/**
 * 템플릿 목록 (UI 표시용) — 라이트/베이직 2종 고정
 */
export const TEMPLATE_OPTIONS = [
  { key: 'light', name: '라이트', description: '뎁스 10 · 병원소개·진료안내·커뮤니티 핵심 구성 (클린 메디컬)' },
  { key: 'basic', name: '베이직', description: '뎁스 20 · 라이트 확장형 (준비 중 — 현재 라이트 코어 적용)' },
];
