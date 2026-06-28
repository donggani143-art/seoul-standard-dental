/**
 * 라이트 템플릿 (뎁스 10) — 클린 메디컬 디자인 시스템
 * design 스킬(헬스케어 원칙: 접근성 4.5:1·44px 터치·8pt 리듬·SVG 아이콘·시맨틱 토큰·모바일 퍼스트) 적용.
 * SEO/AEO/GEO/EEAT: 시맨틱 H1/H2(질문형)·답변 우선·내부링크·FAQ·EEAT 신호 반영.
 *
 * 구조(뎁스 10):
 *  홈(main)
 *  병원소개: 인사말(intro-greeting) · 약력(intro-doctor)
 *  진료안내: 임플란트(care-implant) · 교정(care-ortho) · 수면(care-sleep) · 일반(care-general)
 *  커뮤니티: 공지사항(community/notice) · 자주묻는질문(faq) · 진료안내(community/guide)
 */

const fill = (s, name) => String(s).replace(/\{\{hospital_name\}\}/g, name || '');

// ── 디자인 시스템(토큰 + 공통 컴포넌트) — _header CSS에 1회 주입되어 전 페이지 공유 ──
const BASE_CSS = `
:root{
  --lt-primary:#1a8f5e; --lt-primary-d:#147a4f; --lt-accent:#34c98a;
  --lt-ink:#1a1a1a; --lt-body:#5a5a5a; --lt-muted:#9a9a9a; --lt-line:#eeeeee;
  --lt-bg:#ffffff; --lt-soft:#ecf8f1; --lt-soft2:#f5fbf8;
  --lt-radius:16px; --lt-radius-sm:10px;
  --lt-shadow:0 2px 14px rgba(0,0,0,.05); --lt-shadow-lg:0 18px 44px rgba(26,143,94,.16);
  --lt-maxw:1180px;
}
*{box-sizing:border-box}
body{margin:0;font-family:"Pretendard","Noto Sans KR",-apple-system,BlinkMacSystemFont,sans-serif;color:var(--lt-ink);background:var(--lt-bg);line-height:1.65;-webkit-font-smoothing:antialiased;}
img{max-width:100%;display:block}
a{color:inherit;text-decoration:none}
.lt-container{max-width:var(--lt-maxw);margin:0 auto;padding:0 24px}
.lt-section{padding:88px 0}
.lt-soft{background:var(--lt-soft)}
.lt-soft2{background:var(--lt-soft2)}
.lt-kicker{display:inline-block;font-size:13px;font-weight:800;letter-spacing:.14em;text-transform:uppercase;color:var(--lt-primary)}
.lt-h1{font-size:clamp(2rem,4.6vw,3.1rem);font-weight:900;letter-spacing:-.02em;line-height:1.18;margin:.4em 0}
.lt-h2{font-size:clamp(1.5rem,3.2vw,2.15rem);font-weight:800;letter-spacing:-.02em;line-height:1.25;margin:0 0 .5em;color:var(--lt-ink)}
.lt-h3{font-size:1.18rem;font-weight:800;margin:0 0 .4em;color:var(--lt-ink)}
.lt-lead{font-size:clamp(1rem,1.6vw,1.18rem);color:var(--lt-body);line-height:1.8}
.lt-p{color:var(--lt-body);font-size:1rem;line-height:1.85;margin:0 0 1em}
.lt-section-head{max-width:680px;margin:0 auto 48px;text-align:center}
.lt-section-head .lt-h2{margin-top:.3em}
.lt-btn{display:inline-flex;align-items:center;justify-content:center;gap:8px;min-height:48px;padding:0 26px;border-radius:999px;font-size:15px;font-weight:800;cursor:pointer;border:1.5px solid transparent;transition:transform .18s ease,background .18s ease,box-shadow .18s ease;}
.lt-btn:focus-visible{outline:3px solid rgba(14,124,117,.35);outline-offset:2px}
.lt-btn-primary{background:var(--lt-primary);color:#fff}
.lt-btn-primary:hover{background:var(--lt-primary-d);transform:translateY(-2px);box-shadow:var(--lt-shadow-lg)}
.lt-btn-ghost{background:#fff;color:var(--lt-primary);border-color:var(--lt-line)}
.lt-btn-ghost:hover{border-color:var(--lt-primary);transform:translateY(-2px)}
.lt-btn-light{background:rgba(255,255,255,.14);color:#fff;border-color:rgba(255,255,255,.4)}
.lt-btn-light:hover{background:rgba(255,255,255,.24)}
.lt-grid{display:grid;gap:22px}
.lt-grid-2{grid-template-columns:repeat(2,1fr)}
.lt-grid-3{grid-template-columns:repeat(3,1fr)}
.lt-grid-4{grid-template-columns:repeat(4,1fr)}
.lt-card{background:#fff;border:1px solid var(--lt-line);border-radius:var(--lt-radius);padding:30px 26px;transition:transform .2s ease,box-shadow .2s ease,border-color .2s ease}
.lt-card:hover{transform:translateY(-4px);box-shadow:var(--lt-shadow-lg);border-color:transparent}
.lt-ico{width:52px;height:52px;border-radius:14px;background:var(--lt-soft);color:var(--lt-primary);display:flex;align-items:center;justify-content:center;margin-bottom:18px}
.lt-ico svg{width:26px;height:26px}
.lt-card-link{display:inline-flex;align-items:center;gap:6px;margin-top:16px;font-weight:800;font-size:14px;color:var(--lt-primary)}
.lt-card-link svg{width:16px;height:16px}
/* 진료시간/연락 박스 */
.lt-info-row{display:flex;justify-content:space-between;padding:13px 0;border-bottom:1px dashed var(--lt-line);font-size:15px}
.lt-info-row:last-child{border-bottom:0}
.lt-info-row span:first-child{color:var(--lt-body)}
.lt-info-row span:last-child{font-weight:700}
/* FAQ 아코디언 */
.lt-faq{max-width:840px;margin:0 auto}
.lt-faq-item{border:1px solid var(--lt-line);border-radius:var(--lt-radius-sm);margin-bottom:12px;overflow:hidden;background:#fff}
.lt-faq-q{width:100%;text-align:left;background:none;border:0;cursor:pointer;padding:20px 22px;font-size:16px;font-weight:800;color:var(--lt-ink);display:flex;justify-content:space-between;align-items:center;gap:16px}
.lt-faq-q::after{content:"+";font-size:22px;color:var(--lt-primary);transition:transform .2s}
.lt-faq-item.open .lt-faq-q::after{content:"−"}
.lt-faq-a{max-height:0;overflow:hidden;transition:max-height .25s ease;color:var(--lt-body);font-size:15px;line-height:1.8}
.lt-faq-item.open .lt-faq-a{max-height:600px}
.lt-faq-a > div{padding:0 22px 20px}
/* 절차 스텝 */
.lt-steps{counter-reset:s;display:grid;gap:16px}
.lt-step{display:flex;gap:16px;align-items:flex-start;background:#fff;border:1px solid var(--lt-line);border-radius:var(--lt-radius-sm);padding:20px 22px}
.lt-step::before{counter-increment:s;content:counter(s);flex:0 0 36px;height:36px;border-radius:50%;background:var(--lt-primary);color:#fff;font-weight:800;display:flex;align-items:center;justify-content:center}
.lt-step h4{margin:2px 0 4px;font-size:16px;font-weight:800}
.lt-step p{margin:0;color:var(--lt-body);font-size:14px}
/* 페이지 히어로(서브) */
.lt-subhero{background:linear-gradient(180deg,var(--lt-soft) 0%,#fff 100%);padding:72px 0 56px;text-align:center}
.lt-breadcrumb{font-size:13px;color:var(--lt-muted);margin-bottom:10px}
.lt-breadcrumb a:hover{color:var(--lt-primary)}
.lt-prose{max-width:860px;margin:0 auto}
.lt-prose h2{font-size:clamp(1.4rem,2.6vw,1.8rem);font-weight:800;color:var(--lt-ink);margin:1.6em 0 .5em;letter-spacing:-.01em}
.lt-prose h3{font-size:1.12rem;font-weight:800;color:var(--lt-ink);margin:1.3em 0 .4em}
.lt-prose p{color:var(--lt-body);font-size:1.02rem;line-height:1.9;margin:0 0 1.1em}
.lt-prose ul,.lt-prose ol{color:var(--lt-body);line-height:1.95;padding-left:22px;margin:0 0 1.1em}
.lt-prose li{margin-bottom:.4em}
.lt-prose strong{color:var(--lt-ink)}
.lt-prose a{color:var(--lt-primary);font-weight:700}
/* 답변 우선 콜아웃(AEO) */
.lt-answer{background:var(--lt-soft);border-left:4px solid var(--lt-primary);border-radius:0 12px 12px 0;padding:18px 22px;margin:0 0 24px;color:var(--lt-ink);font-size:1.05rem;line-height:1.8;font-weight:600}
.lt-callout{background:#fffaf0;border:1px solid #f5e2bf;border-radius:12px;padding:16px 20px;margin:18px 0;font-size:.95rem;color:#6b5836;line-height:1.8}
/* 비교표(AEO) */
.lt-table{width:100%;border-collapse:collapse;margin:18px 0;font-size:.96rem;overflow:hidden;border-radius:12px;border:1px solid var(--lt-line)}
.lt-table th,.lt-table td{padding:13px 16px;text-align:left;border-bottom:1px solid var(--lt-line)}
.lt-table thead th{background:var(--lt-soft);color:var(--lt-ink);font-weight:800;font-size:.9rem}
.lt-table tbody tr:last-child td{border-bottom:0}
.lt-table td:first-child{font-weight:700;color:var(--lt-ink);white-space:nowrap}
/* 체크리스트 */
.lt-check{list-style:none;padding:0;margin:14px 0;display:grid;gap:10px}
.lt-check li{position:relative;padding-left:30px;color:var(--lt-body);line-height:1.7}
.lt-check li::before{content:"✓";position:absolute;left:0;top:0;width:20px;height:20px;border-radius:50%;background:var(--lt-soft);color:var(--lt-primary);font-weight:800;font-size:12px;display:flex;align-items:center;justify-content:center}
/* 통계/숫자 */
.lt-stats{display:grid;grid-template-columns:repeat(3,1fr);gap:18px;margin:8px 0}
.lt-stat{background:#fff;border:1px solid var(--lt-line);border-radius:14px;padding:24px;text-align:center}
.lt-stat b{display:block;font-size:2rem;font-weight:900;color:var(--lt-primary);letter-spacing:-.02em}
.lt-stat span{font-size:13px;color:var(--lt-muted);font-weight:700}
/* 작성/감수(EEAT) */
.lt-author{display:flex;gap:14px;align-items:flex-start;background:var(--lt-soft2);border:1px solid var(--lt-line);border-radius:14px;padding:18px 20px;margin:24px auto;max-width:860px}
.lt-author .lt-av{flex:0 0 44px;height:44px;border-radius:50%;background:var(--lt-primary);color:#fff;display:flex;align-items:center;justify-content:center;font-weight:800}
.lt-author p{margin:0;font-size:13px;color:var(--lt-body);line-height:1.7}
.lt-author b{color:var(--lt-ink)}
.lt-meta-date{font-size:12px;color:var(--lt-muted);margin-top:4px}
/* 관련 페이지 */
.lt-related{display:flex;flex-wrap:wrap;gap:10px;margin-top:16px}
.lt-related a{display:inline-flex;align-items:center;gap:6px;border:1px solid var(--lt-line);border-radius:999px;padding:8px 16px;font-size:14px;font-weight:700;color:var(--lt-primary);background:#fff}
.lt-related a:hover{border-color:var(--lt-primary);background:var(--lt-soft)}
.lt-toc{background:var(--lt-soft2);border:1px solid var(--lt-line);border-radius:14px;padding:18px 22px;margin:0 0 28px}
.lt-toc b{font-size:13px;color:var(--lt-muted);font-weight:800;letter-spacing:.04em}
.lt-toc ul{list-style:none;padding:0;margin:8px 0 0;display:flex;flex-wrap:wrap;gap:8px 18px}
.lt-toc a{font-size:14px;font-weight:700;color:var(--lt-primary)}
@media(max-width:980px){
  .lt-grid-4{grid-template-columns:repeat(2,1fr)}
  .lt-grid-3{grid-template-columns:1fr}
}
@media(max-width:640px){
  .lt-section{padding:60px 0}
  .lt-grid-2,.lt-grid-4{grid-template-columns:1fr}
  .lt-stats{grid-template-columns:1fr}
  .lt-table{font-size:.88rem}
  .lt-table th,.lt-table td{padding:10px 12px}
}
`;

// ── 헤더(3그룹 드롭다운 내비 + 모바일 아코디언) ──
const NAV_GROUPS = [
  { label: '병원소개', items: [['인사말', '/intro-greeting'], ['약력', '/intro-doctor']] },
  { label: '진료안내', items: [['임플란트', '/care-implant'], ['교정', '/care-ortho'], ['수면치료', '/care-sleep'], ['일반진료', '/care-general']] },
  { label: '커뮤니티', items: [['공지사항', '/community/notice'], ['자주묻는 질문', '/faq'], ['진료안내', '{{guide_href}}']] },
];

function navDesktop() {
  return NAV_GROUPS.map((g) => `
      <li class="lt-nav-item">
        <button type="button" class="lt-nav-top" aria-haspopup="true" aria-expanded="false">${g.label}</button>
        <ul class="lt-nav-sub">
          ${g.items.map(([t, h]) => `<li><a href="${h}">${t}</a></li>`).join('')}
        </ul>
      </li>`).join('');
}
function navMobile() {
  return NAV_GROUPS.map((g) => `
      <div class="lt-m-group">
        <button type="button" class="lt-m-top">${g.label}<span class="lt-m-caret">⌄</span></button>
        <div class="lt-m-sub">
          ${g.items.map(([t, h]) => `<a href="${h}">${t}</a>`).join('')}
        </div>
      </div>`).join('');
}

const HEADER_CSS = BASE_CSS + `
/* 헤더 */
.lt-hdr{position:sticky;top:0;z-index:100;background:rgba(255,255,255,.92);backdrop-filter:saturate(180%) blur(8px);border-bottom:1px solid var(--lt-line)}
.lt-hdr-in{max-width:var(--lt-maxw);margin:0 auto;padding:0 24px;height:72px;display:flex;align-items:center;gap:28px}
.lt-logo{font-size:1.3rem;font-weight:900;letter-spacing:-.02em;color:var(--lt-ink);display:flex;align-items:center;gap:9px}
.lt-logo .lt-logo-mark{width:30px;height:30px;border-radius:9px;background:var(--lt-primary);display:flex;align-items:center;justify-content:center}
.lt-logo .lt-logo-mark svg{width:18px;height:18px;color:#fff}
.lt-nav{display:flex;gap:6px;margin-left:auto;list-style:none;padding:0;margin-top:0;margin-bottom:0}
.lt-nav-item{position:relative}
.lt-nav-top{background:none;border:0;font-family:inherit;font-size:15px;font-weight:800;color:var(--lt-ink);padding:10px 16px;cursor:pointer;border-radius:10px}
.lt-nav-item:hover .lt-nav-top{color:var(--lt-primary);background:var(--lt-soft)}
.lt-nav-sub{position:absolute;top:100%;left:50%;transform:translateX(-50%) translateY(8px);min-width:170px;background:#fff;border:1px solid var(--lt-line);border-radius:14px;box-shadow:var(--lt-shadow-lg);padding:8px;list-style:none;margin:0;opacity:0;visibility:hidden;transition:all .18s ease;z-index:5}
.lt-nav-item:hover .lt-nav-sub{opacity:1;visibility:visible;transform:translateX(-50%) translateY(4px)}
.lt-nav-sub a{display:block;padding:11px 14px;border-radius:9px;font-size:14px;font-weight:700;color:var(--lt-body)}
.lt-nav-sub a:hover{background:var(--lt-soft);color:var(--lt-primary)}
.lt-hdr-cta{display:flex;align-items:center;gap:8px}
.lt-hdr-cta .lt-btn{min-height:42px;padding:0 18px;font-size:14px}
.lt-hdr-auth{display:flex;gap:10px;align-items:center;font-size:13px;font-weight:700;color:var(--lt-muted)}
.lt-hdr-auth a:hover{color:var(--lt-primary)}
.auth-guest,.auth-user{display:none !important}
body.is-logged-in .auth-user{display:inline-flex !important}
body.is-guest .auth-guest{display:inline-flex !important}
.lt-burger{display:none;margin-left:auto;background:none;border:0;flex-direction:column;gap:5px;padding:10px;cursor:pointer}
.lt-burger span{width:24px;height:2px;background:var(--lt-ink);border-radius:2px}
/* 모바일 */
.lt-m-overlay{display:none;position:fixed;inset:0;z-index:200;background:rgba(15,23,42,.5)}
.lt-m-overlay.open{display:block}
.lt-m-panel{position:absolute;top:0;right:0;width:min(86vw,340px);height:100%;background:#fff;padding:22px;overflow-y:auto}
.lt-m-close{position:absolute;top:16px;right:16px;background:none;border:0;font-size:30px;color:var(--lt-muted);cursor:pointer;line-height:1}
.lt-m-group{border-bottom:1px solid var(--lt-line)}
.lt-m-top{width:100%;text-align:left;background:none;border:0;font-family:inherit;font-size:16px;font-weight:800;color:var(--lt-ink);padding:16px 4px;cursor:pointer;display:flex;justify-content:space-between;align-items:center}
.lt-m-caret{transition:transform .2s;color:var(--lt-primary)}
.lt-m-group.open .lt-m-caret{transform:rotate(180deg)}
.lt-m-sub{max-height:0;overflow:hidden;transition:max-height .25s ease}
.lt-m-group.open .lt-m-sub{max-height:400px}
.lt-m-sub a{display:block;padding:11px 14px;font-size:15px;font-weight:700;color:var(--lt-body)}
.lt-m-sub a:hover{color:var(--lt-primary)}
.lt-m-auth{margin-top:24px;display:flex;flex-direction:column;gap:10px}
@media(max-width:900px){
  .lt-nav,.lt-hdr-cta{display:none !important}
  .lt-burger{display:flex}
}
`;

const HEADER_JS = `
(function(){
  var burger=document.querySelector('.lt-burger');
  var overlay=document.querySelector('.lt-m-overlay');
  var closeBtn=document.querySelector('.lt-m-close');
  function close(){ if(overlay){overlay.classList.remove('open');document.body.style.overflow='';} }
  if(burger&&overlay) burger.addEventListener('click',function(){overlay.classList.add('open');document.body.style.overflow='hidden';});
  if(closeBtn) closeBtn.addEventListener('click',close);
  if(overlay) overlay.addEventListener('click',function(e){if(e.target===overlay)close();});
  document.querySelectorAll('.lt-m-top').forEach(function(b){b.addEventListener('click',function(){b.parentElement.classList.toggle('open');});});
  // 로그인 상태
  fetch('/api/auth/me',{credentials:'same-origin'}).then(function(r){return r.json();}).then(function(d){
    if(d.loggedIn){document.body.classList.add('is-logged-in');document.querySelectorAll('.auth-user-name').forEach(function(el){el.textContent=(d.patient&&d.patient.name||'')+'님';});}
    else document.body.classList.add('is-guest');
  }).catch(function(){document.body.classList.add('is-guest');});
  document.querySelectorAll('.lt-logout').forEach(function(b){b.addEventListener('click',function(e){e.preventDefault();fetch('/api/auth/logout',{method:'POST',credentials:'same-origin'}).then(function(){location.reload();});});});
})();
`;

function headerHtml(name) {
  return fill(`<header class="lt-hdr">
  <div class="lt-hdr-in">
    <a href="/" class="lt-logo">
      <span class="lt-logo-mark"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2C9 2 7 4 7 7c0 2 .5 4 1.5 8C9 18 10 22 12 22s3-4 3.5-7C16.5 11 17 9 17 7c0-3-2-5-5-5z"/></svg></span>
      {{hospital_name}}
    </a>
    <ul class="lt-nav">${navDesktop()}</ul>
    <div class="lt-hdr-cta">
      <div class="lt-hdr-auth">
        <a href="/login" class="auth-guest">로그인</a>
        <a href="/mypage" class="auth-user auth-user-name"></a>
        <a href="#" class="auth-user lt-logout">로그아웃</a>
      </div>
      <a href="/consult" class="lt-btn lt-btn-primary">상담 예약</a>
    </div>
    <button type="button" class="lt-burger" aria-label="메뉴 열기"><span></span><span></span><span></span></button>
  </div>
</header>
<div class="lt-m-overlay">
  <div class="lt-m-panel">
    <button type="button" class="lt-m-close" aria-label="메뉴 닫기">&times;</button>
    <a href="/" class="lt-logo" style="margin-bottom:18px">{{hospital_name}}</a>
    ${navMobile()}
    <div class="lt-m-auth">
      <a href="/consult" class="lt-btn lt-btn-primary">상담 예약</a>
      <a href="/login" class="lt-btn lt-btn-ghost auth-guest">로그인</a>
      <a href="/mypage" class="lt-btn lt-btn-ghost auth-user">마이페이지</a>
      <a href="#" class="lt-btn lt-btn-ghost auth-user lt-logout">로그아웃</a>
    </div>
  </div>
</div>`, name);
}

// ── 푸터 ──
const FOOTER_CSS = `
.lt-ftr{background:#0c2b29;color:#cfe3e0;padding:64px 0 32px}
.lt-ftr-top{display:grid;grid-template-columns:1.4fr 1fr 1fr;gap:40px;padding-bottom:40px;border-bottom:1px solid rgba(255,255,255,.1)}
.lt-ftr-brand{font-size:1.4rem;font-weight:900;color:#fff;margin-bottom:14px}
.lt-ftr-desc{font-size:14px;line-height:1.8;color:rgba(255,255,255,.6)}
.lt-ftr h4{font-size:13px;font-weight:800;letter-spacing:.08em;color:#fff;margin:0 0 14px}
.lt-ftr-links{display:flex;flex-direction:column;gap:9px;font-size:14px}
.lt-ftr-links a{color:rgba(255,255,255,.7)}
.lt-ftr-links a:hover{color:var(--lt-accent)}
.lt-ftr-bottom{display:flex;justify-content:space-between;flex-wrap:wrap;gap:12px;padding-top:24px;font-size:12px;color:rgba(255,255,255,.45)}
.lt-ftr-bottom a{color:rgba(255,255,255,.6)}
@media(max-width:780px){.lt-ftr-top{grid-template-columns:1fr;gap:28px}}

/* ── 퀵메뉴 (플로팅 예약·상담) ── */
.lt-quick{position:fixed;right:24px;bottom:24px;z-index:300;font-family:inherit}
.lt-quick-fab{width:66px;height:66px;border-radius:50%;background:var(--lt-primary);color:#fff;border:0;cursor:pointer;box-shadow:0 10px 28px rgba(26,143,94,.42);transition:transform .2s,background .2s;display:flex;align-items:center;justify-content:center}
.lt-quick-fab:hover{background:var(--lt-primary-d);transform:translateY(-2px)}
.lt-quick-fab-label{font-size:13px;font-weight:800;line-height:1.2;text-align:center}
.lt-quick.open .lt-quick-fab-label{display:none}
.lt-quick.open .lt-quick-fab::after{content:"✕";font-size:24px;font-weight:400}
.lt-quick-panel{position:absolute;right:0;bottom:80px;width:min(92vw,372px);background:#fff;border-radius:18px;box-shadow:0 20px 56px rgba(0,0,0,.2);overflow:hidden;opacity:0;visibility:hidden;transform:translateY(14px);transition:opacity .22s ease,transform .22s ease,visibility .22s}
.lt-quick.open .lt-quick-panel{opacity:1;visibility:visible;transform:translateY(0)}
.lt-quick-tabs{display:grid;grid-template-columns:1fr 1fr}
.lt-quick-tab{padding:14px 10px;text-align:center;background:var(--lt-soft);border-right:1px solid rgba(0,0,0,.05);transition:background .15s}
.lt-quick-tab:last-child{border-right:0}
.lt-quick-tab:hover{background:var(--lt-soft2)}
.lt-quick-ico{display:block;font-size:18px;margin-bottom:2px}
.lt-quick-tab b{display:block;font-size:13px;font-weight:800;color:var(--lt-ink)}
.lt-quick-tab em{font-size:10px;color:var(--lt-muted);font-style:normal}
.lt-quick-body{padding:20px}
.lt-quick-body h4{margin:0 0 14px;font-size:18px;font-weight:800;color:var(--lt-ink)}
.lt-quick-form{display:flex;flex-direction:column;gap:11px}
.lt-quick-form>label{font-size:13px;font-weight:700;color:var(--lt-body);display:flex;flex-direction:column;gap:5px}
.lt-quick-form select,.lt-quick-form input{border:1px solid var(--lt-line);border-radius:9px;padding:11px 12px;font-size:14px;font-family:inherit;outline:none;background:#fafafa;color:var(--lt-ink)}
.lt-quick-form select:focus,.lt-quick-form input:focus{border-color:var(--lt-primary);background:#fff}
.lt-quick-row{display:grid;grid-template-columns:1fr 1fr;gap:8px}
.lt-quick-agree{flex-direction:row !important;align-items:center;gap:7px;font-weight:600 !important;font-size:12px;color:var(--lt-body)}
.lt-quick-agree input{width:16px;height:16px;flex:0 0 auto}
.lt-quick-agree a{color:var(--lt-primary);margin-left:auto;font-size:11px;font-weight:700}
.lt-req{color:#dc2626}
.lt-quick-msg{margin:2px 0 0;font-size:13px;font-weight:700;text-align:center}
.lt-quick-msg.ok{color:var(--lt-primary)}
.lt-quick-msg.err{color:#dc2626}
@media(max-width:640px){.lt-quick{right:16px;bottom:16px}.lt-quick-fab{width:58px;height:58px}}
`;

function footerHtml(name) {
  const year = new Date().getFullYear();
  return fill(`<footer class="lt-ftr">
  <div class="lt-container">
    <div class="lt-ftr-top">
      <div>
        <div class="lt-ftr-brand">{{hospital_name}}</div>
        <p class="lt-ftr-desc">정직한 진단과 정성을 다하는 진료로<br/>건강한 미소를 함께 만들어 갑니다.<br/><br/>진료시간·주소·연락처는 관리자 페이지<br/>(SEO·병원 정보)에서 설정하세요.</p>
      </div>
      <div>
        <h4>바로가기</h4>
        <div class="lt-ftr-links">
          <a href="/intro-greeting">인사말</a>
          <a href="/intro-doctor">약력</a>
          <a href="/care-implant">진료안내</a>
          <a href="/community/notice">공지사항</a>
          <a href="/faq">자주묻는 질문</a>
        </div>
      </div>
      <div>
        <h4>상담·예약</h4>
        <div class="lt-ftr-links">
          <a href="/consult">온라인 상담</a>
          <a href="{{guide_href}}">진료안내 게시판</a>
          <a href="/login" class="auth-guest">회원 로그인</a>
          <a href="/mypage" class="auth-user">마이페이지</a>
        </div>
      </div>
    </div>
    <div class="lt-ftr-bottom">
      <span>&copy; ${year} {{hospital_name}}. All rights reserved.</span>
      <span><a href="/privacy">개인정보 처리방침</a> &nbsp;·&nbsp; <a href="/terms">이용약관</a></span>
    </div>
  </div>
</footer>

<!-- 퀵메뉴: 플로팅 예약·상담 (카카오·인스타 링크는 관리자 페이지에서 실제 주소로 교체) -->
<div class="lt-quick" id="ltQuick">
  <div class="lt-quick-panel">
    <div class="lt-quick-tabs">
      <a href="https://pf.kakao.com/" target="_blank" rel="noreferrer" class="lt-quick-tab"><span class="lt-quick-ico">💬</span><b>카카오톡 상담</b><em>KakaoTalk</em></a>
      <a href="https://www.instagram.com/" target="_blank" rel="noreferrer" class="lt-quick-tab"><span class="lt-quick-ico">📷</span><b>공식 인스타그램</b><em>Instagram</em></a>
    </div>
    <div class="lt-quick-body">
      <h4>온라인 예약/상담</h4>
      <form class="lt-quick-form">
        <label>어떤 경로로 알게 되셨나요?
          <select name="path">
            <option value="">경로를 선택해 주세요</option>
            <option>네이버 검색</option><option>구글 검색</option><option>지인 소개</option><option>SNS·블로그</option><option>간판·전단</option><option>기타</option>
          </select>
        </label>
        <label>어떤 진료를 원하시나요? <span class="lt-req">*</span>
          <select name="category" required>
            <option value="">진료 과목을 선택해 주세요</option>
            <option>임플란트</option><option>교정</option><option>수면치료</option><option>일반진료</option><option>기타 문의</option>
          </select>
        </label>
        <div class="lt-quick-row">
          <input type="text" name="name" placeholder="이름" required />
          <input type="tel" name="phone" placeholder="010-1234-5678" required />
        </div>
        <label class="lt-quick-agree"><input type="checkbox" name="agreed" required /> <span>개인정보 수집·이용 동의</span> <a href="/privacy" target="_blank">자세히 보기</a></label>
        <label class="lt-quick-agree"><input type="checkbox" name="marketing" /> <span>마케팅 수신 동의 <em style="color:var(--lt-muted);font-weight:500">(선택)</em></span></label>
        <button type="submit" class="lt-btn lt-btn-primary" style="width:100%">완료</button>
        <p class="lt-quick-msg"></p>
      </form>
    </div>
  </div>
  <button type="button" class="lt-quick-fab" aria-label="예약 상담"><span class="lt-quick-fab-label">예약<br/>상담</span></button>
</div>`, name);
}

// ── 홈(main) — AEO: 결론형 인트로 + 질문형 H2 + 내부링크 ──
function mainHtml(name) {
  return fill(`<section class="lt-hero">
  <div class="lt-container">
    <p class="lt-hero-tagline">Based on a philosophy of integrity and care,<br/>{{hospital_name}} pursues personalized treatment for your health and beauty.</p>
    <h1 class="lt-hero-brand">{{hospital_name}}</h1>
    <p class="lt-lead lt-hero-sub">건강한 미소를 위한 시작 — 정확한 진단과 환자 중심의 맞춤 진료로<br/>임플란트·교정·수면·일반진료까지 한 곳에서 책임집니다.</p>
    <div class="lt-hero-btns">
      <a href="/consult" class="lt-btn lt-btn-primary">상담 예약하기</a>
      <a href="/care-implant" class="lt-btn lt-btn-ghost">진료 안내 보기</a>
    </div>
    <ul class="lt-hero-trust">
      <li>✓ 1:1 맞춤 진단</li><li>✓ 첨단 디지털 장비</li><li>✓ 철저한 감염관리</li>
    </ul>
  </div>
</section>

<section class="lt-section lt-soft2" style="padding:56px 0">
  <div class="lt-container" style="max-width:640px">
    <div class="lt-hero-card">
      <h3 class="lt-h3" style="text-align:center">진료 시간 안내</h3>
      <div class="lt-info-row"><span>평일</span><span>09:30 – 18:30</span></div>
      <div class="lt-info-row"><span>토요일</span><span>09:30 – 13:00</span></div>
      <div class="lt-info-row"><span>점심시간</span><span>13:00 – 14:00</span></div>
      <div class="lt-info-row"><span>일요일·공휴일</span><span>휴진</span></div>
      <a href="/consult" class="lt-btn lt-btn-primary" style="width:100%;margin-top:18px">예약 문의하기</a>
      <p class="lt-hero-note">※ 진료시간은 관리자 페이지에서 변경하세요.</p>
    </div>
  </div>
</section>

<section class="lt-section">
  <div class="lt-container">
    <div class="lt-section-head">
      <span class="lt-kicker">TREATMENTS</span>
      <h2 class="lt-h2">어떤 진료를 받을 수 있나요?</h2>
      <p class="lt-lead">대표 진료 분야를 한눈에 확인하고, 자세한 안내 페이지로 이동하세요.</p>
    </div>
    <div class="lt-grid lt-grid-4">
      <a class="lt-card" href="/care-implant">
        <div class="lt-ico"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M12 2C9 2 7 4 7 7c0 2 .5 4 1.5 8C9 18 10 22 12 22s3-4 3.5-7C16.5 11 17 9 17 7c0-3-2-5-5-5z"/></svg></div>
        <h3 class="lt-h3">임플란트</h3>
        <p class="lt-p">정밀 진단 기반의 안전한 임플란트 식립.</p>
        <span class="lt-card-link">자세히 <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4"><path d="M5 12h14M13 6l6 6-6 6"/></svg></span>
      </a>
      <a class="lt-card" href="/care-ortho">
        <div class="lt-ico"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="3" y="9" width="18" height="6" rx="2"/><path d="M7 9v6M12 9v6M17 9v6"/></svg></div>
        <h3 class="lt-h3">교정</h3>
        <p class="lt-p">투명·메탈 등 라이프스타일 맞춤 교정.</p>
        <span class="lt-card-link">자세히 <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4"><path d="M5 12h14M13 6l6 6-6 6"/></svg></span>
      </a>
      <a class="lt-card" href="/care-sleep">
        <div class="lt-ico"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M21 12.8A9 9 0 1 1 11.2 3 7 7 0 0 0 21 12.8z"/></svg></div>
        <h3 class="lt-h3">수면치료</h3>
        <p class="lt-p">치과 공포가 있어도 편안한 수면진료.</p>
        <span class="lt-card-link">자세히 <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4"><path d="M5 12h14M13 6l6 6-6 6"/></svg></span>
      </a>
      <a class="lt-card" href="/care-general">
        <div class="lt-ico"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg></div>
        <h3 class="lt-h3">일반진료</h3>
        <p class="lt-p">충치·잇몸·신경치료 등 기본 진료.</p>
        <span class="lt-card-link">자세히 <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4"><path d="M5 12h14M13 6l6 6-6 6"/></svg></span>
      </a>
    </div>
  </div>
</section>

<section class="lt-section lt-soft">
  <div class="lt-container">
    <div class="lt-section-head">
      <span class="lt-kicker">WHY US</span>
      <h2 class="lt-h2">왜 {{hospital_name}}일까요?</h2>
    </div>
    <div class="lt-grid lt-grid-3">
      <div class="lt-card">
        <h3 class="lt-h3">정확한 진단</h3>
        <p class="lt-p">3D CT·구강 스캐너 등 디지털 장비로 정밀하게 진단하고, 충분히 설명드린 뒤 치료를 시작합니다.</p>
      </div>
      <div class="lt-card">
        <h3 class="lt-h3">환자 중심 진료</h3>
        <p class="lt-p">과잉진료 없이 꼭 필요한 치료만, 환자의 상황과 예산에 맞춘 치료 계획을 함께 세웁니다.</p>
      </div>
      <div class="lt-card">
        <h3 class="lt-h3">철저한 위생관리</h3>
        <p class="lt-p">1인 1기구 멸균 원칙과 정기적인 소독으로 안전하고 청결한 진료 환경을 유지합니다.</p>
      </div>
    </div>
  </div>
</section>

<section class="lt-section">
  <div class="lt-container">
    <div class="lt-section-head"><span class="lt-kicker">PROCESS</span><h2 class="lt-h2">처음 방문은 어떻게 진행되나요?</h2>
      <p class="lt-lead">{{hospital_name}}은 첫 방문부터 사후관리까지 체계적인 단계로 진료합니다.</p></div>
    <div class="lt-steps" style="max-width:760px;margin:0 auto">
      <div class="lt-step"><div><h4>접수 및 문진</h4><p>증상과 병력, 복용 약을 확인하고 불편한 점을 충분히 듣습니다.</p></div></div>
      <div class="lt-step"><div><h4>정밀 검사</h4><p>3D CT·파노라마·구강 스캔으로 치아와 잇몸, 골 상태를 정확히 진단합니다.</p></div></div>
      <div class="lt-step"><div><h4>맞춤 치료 계획 상담</h4><p>치료 방법·기간·예상 비용을 그림과 함께 설명드리고 동의를 구합니다.</p></div></div>
      <div class="lt-step"><div><h4>치료 진행</h4><p>통증을 최소화하며 계획에 따라 단계적으로 치료합니다.</p></div></div>
      <div class="lt-step"><div><h4>정기 점검·관리</h4><p>치료 후 정기 검진으로 재발을 막고 오래 유지되도록 관리합니다.</p></div></div>
    </div>
  </div>
</section>

<section class="lt-section lt-soft">
  <div class="lt-container" style="max-width:980px">
    <div class="lt-section-head"><span class="lt-kicker">WITH YOU</span><h2 class="lt-h2">믿고 맡길 수 있는 이유</h2></div>
    <div class="lt-stats">
      <div class="lt-stat"><b>1:1</b><span>맞춤 진단·상담</span></div>
      <div class="lt-stat"><b>3D CT</b><span>디지털 정밀 진단</span></div>
      <div class="lt-stat"><b>100%</b><span>1인 1기구 멸균</span></div>
    </div>
    <p class="lt-p" style="text-align:center;margin-top:18px">※ 위 수치는 운영 기준 예시이며, 실제 통계·실적은 관리자 페이지에서 병원 정보로 수정해 신뢰 신호로 활용하세요.</p>
  </div>
</section>

<section class="lt-section">
  <div class="lt-container lt-prose">
    <h2>{{hospital_name}}은 어떤 진료를 잘하나요?</h2>
    <p class="lt-answer">{{hospital_name}}은 <strong>임플란트·교정·수면치료·일반진료</strong>를 중심으로, 정확한 진단을 바탕으로 환자에게 꼭 필요한 치료만 권하는 것을 원칙으로 합니다.</p>
    <p>치아 상실이 있다면 <a href="/care-implant">임플란트</a>로 자연치아에 가까운 기능을 회복할 수 있고, 치열·교합이 고민이라면 <a href="/care-ortho">교정</a>으로 기능과 심미를 함께 개선합니다. 치과 공포가 크거나 장시간 치료가 필요한 경우 <a href="/care-sleep">수면치료</a>로 편안하게 진료받을 수 있으며, 충치·잇몸·신경치료 등은 <a href="/care-general">일반진료</a>에서 폭넓게 다룹니다.</p>
    <h3>이런 분께 권합니다</h3>
    <ul class="lt-check">
      <li>치아가 빠졌거나 오래된 보철물을 교체하고 싶은 분</li>
      <li>덧니·돌출입 등 치열이 신경 쓰이는 분</li>
      <li>치과 치료가 무섭거나 구역질이 심한 분</li>
      <li>충치·잇몸 출혈 등 기본 구강 관리가 필요한 분</li>
    </ul>
    <div class="lt-callout">정확한 진단명과 치료 방법은 반드시 내원 검진 후 결정됩니다. 온라인 안내는 일반적인 정보이며 개인별 치료 계획을 대신하지 않습니다.</div>
  </div>
</section>

<section class="lt-section lt-soft2">
  <div class="lt-container">
    <div class="lt-section-head"><span class="lt-kicker">FAQ</span><h2 class="lt-h2">자주 묻는 질문</h2></div>
    <div class="lt-faq">
      <div class="lt-faq-item"><button type="button" class="lt-faq-q">처음 방문할 때 무엇을 준비해야 하나요?</button><div class="lt-faq-a"><div>신분증을 지참해 주시고, 복용 중인 약이나 과거 치과 치료 이력이 있다면 알려주시면 진료에 도움이 됩니다. 예약 후 방문하시면 대기 시간을 줄일 수 있습니다.</div></div></div>
      <div class="lt-faq-item"><button type="button" class="lt-faq-q">진료 시간과 휴진일은 어떻게 되나요?</button><div class="lt-faq-a"><div>평일·토요일 진료하며 일요일·공휴일은 휴진입니다. 정확한 시간은 상단 진료시간 안내를 참고하시고, 변경 사항은 <a href="/community/notice">공지사항</a>에서 확인하실 수 있습니다.</div></div></div>
      <div class="lt-faq-item"><button type="button" class="lt-faq-q">비용 상담만 받을 수도 있나요?</button><div class="lt-faq-a"><div>네, 검진 후 치료 계획과 예상 비용을 충분히 설명드린 뒤 환자분이 결정하실 수 있도록 안내합니다. <a href="/consult">온라인 상담</a>으로 먼저 문의하셔도 됩니다.</div></div></div>
      <div class="lt-faq-item"><button type="button" class="lt-faq-q">주차가 가능한가요?</button><div class="lt-faq-a"><div>주차 안내는 병원마다 다릅니다. 자세한 사항은 전화 또는 온라인 상담으로 확인해 주세요. (관리자 페이지에서 실제 정보로 수정하세요.)</div></div></div>
    </div>
  </div>
</section>

<section class="lt-cta">
  <div class="lt-container lt-cta-in">
    <div>
      <h2 class="lt-h2" style="color:#fff">지금 바로 상담받으세요</h2>
      <p class="lt-lead" style="color:rgba(255,255,255,.85);margin:0">궁금한 점은 온라인 상담으로 편하게 문의해 주세요. 전문 상담원이 빠르게 답변드립니다.</p>
    </div>
    <a href="/consult" class="lt-btn lt-btn-light">온라인 상담 신청</a>
  </div>
</section>
<script type="application/ld+json">{"@context":"https://schema.org","@type":"FAQPage","mainEntity":[{"@type":"Question","name":"처음 방문할 때 무엇을 준비해야 하나요?","acceptedAnswer":{"@type":"Answer","text":"신분증을 지참하시고 복용 약·과거 치과 치료 이력이 있으면 알려주세요. 예약 후 방문하시면 대기 시간을 줄일 수 있습니다."}},{"@type":"Question","name":"진료 시간과 휴진일은 어떻게 되나요?","acceptedAnswer":{"@type":"Answer","text":"평일·토요일 진료하며 일요일·공휴일은 휴진입니다. 변경 사항은 공지사항에서 확인할 수 있습니다."}},{"@type":"Question","name":"비용 상담만 받을 수도 있나요?","acceptedAnswer":{"@type":"Answer","text":"네, 검진 후 치료 계획과 예상 비용을 설명드린 뒤 환자분이 결정하실 수 있도록 안내합니다."}}]}</script>`, name);
}

const MAIN_CSS = `
.lt-hero{background:#fff;padding:96px 0 76px;text-align:center}
.lt-hero-tagline{font-size:14px;color:var(--lt-primary);font-weight:600;line-height:1.7;margin:0 0 22px;letter-spacing:.01em}
.lt-hero-brand{font-size:clamp(2.6rem,9vw,6.6rem);font-weight:900;color:var(--lt-primary);letter-spacing:-.03em;line-height:1.02;margin:0 0 26px;word-break:keep-all}
.lt-hero-sub{max-width:700px;margin:0 auto 30px}
.lt-hero-btns{display:flex;gap:12px;flex-wrap:wrap;margin:0 0 24px;justify-content:center}
.lt-hero-trust{list-style:none;padding:0;margin:0;display:flex;gap:20px;flex-wrap:wrap;font-size:14px;font-weight:700;color:var(--lt-primary-d);justify-content:center}
.lt-hero-card{background:#fff;border:1px solid var(--lt-line);border-radius:20px;padding:30px 28px;box-shadow:var(--lt-shadow-lg)}
.lt-hero-note{font-size:12px;color:var(--lt-muted);margin:12px 0 0;text-align:center}
.lt-cta{background:linear-gradient(120deg,var(--lt-primary) 0%,var(--lt-primary-d) 100%)}
.lt-cta-in{display:flex;align-items:center;justify-content:space-between;gap:24px;flex-wrap:wrap;padding:64px 24px}
@media(max-width:640px){.lt-hero{padding:64px 0 50px}}
`;

// ── 서브 페이지 공통 빌더 ──
// 서브 페이지는 _header에 주입된 BASE_CSS 유틸리티를 그대로 사용하므로 별도 CSS 불필요.
function subHero(crumbGroup, title, lead) {
  return `<section class="lt-subhero">
  <div class="lt-container">
    <p class="lt-breadcrumb"><a href="/">홈</a> · ${crumbGroup}</p>
    <span class="lt-kicker">${crumbGroup.toUpperCase ? '' : ''}</span>
    <h1 class="lt-h1">${title}</h1>
    <p class="lt-lead" style="max-width:720px;margin:0 auto">${lead}</p>
  </div>
</section>`;
}
function ctaBand() {
  return `<section class="lt-cta"><div class="lt-container lt-cta-in">
    <div><h2 class="lt-h2" style="color:#fff">상담이 필요하신가요?</h2><p class="lt-lead" style="color:rgba(255,255,255,.85);margin:0">온라인으로 편하게 문의해 주세요. 빠르게 답변드립니다.</p></div>
    <a href="/consult" class="lt-btn lt-btn-light">온라인 상담 신청</a>
  </div></section>`;
}
function faqBlock(items) {
  return `<section class="lt-section lt-soft2"><div class="lt-container">
    <div class="lt-section-head"><span class="lt-kicker">FAQ</span><h2 class="lt-h2">자주 묻는 질문</h2></div>
    <div class="lt-faq">
      ${items.map((it) => `<div class="lt-faq-item"><button type="button" class="lt-faq-q">${it.q}</button><div class="lt-faq-a"><div>${it.a}</div></div></div>`).join('')}
    </div>
  </div></section>`;
}
const FAQ_JS = `(function(){document.querySelectorAll('.lt-faq-q').forEach(function(b){b.addEventListener('click',function(){b.parentElement.classList.toggle('open');});});})();`;

// EEAT 감수 박스 (실제 이름·날짜는 플레이스홀더 — 관리자 수정)
function authorBox() {
  return `<div class="lt-author">
  <span class="lt-av">의</span>
  <p><b>의료진 감수</b> · 본 내용은 {{hospital_name}} 의료진의 임상 경험을 바탕으로 작성·감수되었습니다.<br/>일반적인 정보 제공용이며, 정확한 진단·치료는 내원 검진 후 결정됩니다.<span class="lt-meta-date">최종 검토: 관리자 페이지에서 날짜를 설정하세요</span></p>
</div>`;
}
function relatedBox(items) {
  if (!items || !items.length) return '';
  return `<div class="lt-container" style="max-width:880px;padding-bottom:8px"><h3 class="lt-h3">관련 진료 안내</h3><div class="lt-related">${items.map(([l, h]) => `<a href="${h}">${l} →</a>`).join('')}</div></div>`;
}
function faqLd(faqs) {
  const j = { '@context': 'https://schema.org', '@type': 'FAQPage', mainEntity: faqs.map((f) => ({ '@type': 'Question', name: f.q.replace(/"/g, ' '), acceptedAnswer: { '@type': 'Answer', text: f.a.replace(/<[^>]+>/g, '').replace(/"/g, ' ') } })) };
  return `<script type="application/ld+json">${JSON.stringify(j)}</script>`;
}

// 진료 안내 페이지 빌더 — SEO/AEO/GEO/EEAT 구조 (정의·답변우선·대상·비교표·절차·주의·FAQ·감수·내부링크)
function treatmentPage({ name, slug, sort, title, lead, definition, what, points, who, compare, steps, cautions, faqs, related }) {
  const compareHtml = compare ? `
<section class="lt-section"><div class="lt-container lt-prose">
  <h2>다른 치료와 무엇이 다른가요?</h2>
  <p>${compare.intro || ''}</p>
  <table class="lt-table"><thead><tr>${compare.head.map((h) => `<th>${h}</th>`).join('')}</tr></thead>
  <tbody>${compare.rows.map((r) => `<tr>${r.map((c) => `<td>${c}</td>`).join('')}</tr>`).join('')}</tbody></table>
  <p style="font-size:13px;color:var(--lt-muted)">※ 위 비교는 일반적 특성이며, 환자 상태에 따라 적합한 방법이 달라질 수 있습니다.</p>
</div></section>` : '';
  const whoHtml = who ? `<h3>이런 분께 권합니다</h3><ul class="lt-check">${who.map((w) => `<li>${w}</li>`).join('')}</ul>` : '';
  const cautionsHtml = cautions ? `
<section class="lt-section lt-soft2"><div class="lt-container lt-prose">
  <h2>치료 전 알아두면 좋은 점</h2>
  <ul>${cautions.map((c) => `<li>${c}</li>`).join('')}</ul>
  <div class="lt-callout">통증·부기·출혈 등 이상 증상이 지속되면 임의로 방치하지 마시고 병원에 문의해 주세요.</div>
</div></section>` : '';
  return {
    slug, title, sort,
    content: fill(`${subHero('진료안내', title, lead)}
<section class="lt-section"><div class="lt-container lt-prose">
  <div class="lt-toc"><b>이 페이지에서 확인하세요</b><ul><li><a href="#def">정의</a></li><li><a href="#process">진료 절차</a></li><li><a href="#faq">자주 묻는 질문</a></li></ul></div>
  <h2 id="def">${title}란 무엇인가요?</h2>
  <p class="lt-answer">${definition || what}</p>
  <p>${what}</p>
  ${whoHtml}
</div>
<div class="lt-container" style="max-width:880px;margin-top:8px">
  <div class="lt-grid lt-grid-3">
    ${points.map((p) => `<div class="lt-card"><h3 class="lt-h3">${p.t}</h3><p class="lt-p" style="margin:0">${p.d}</p></div>`).join('')}
  </div>
</div></section>
${compareHtml}
<section class="lt-section lt-soft" id="process"><div class="lt-container" style="max-width:760px">
  <div class="lt-section-head"><span class="lt-kicker">PROCESS</span><h2 class="lt-h2">진료는 어떻게 진행되나요?</h2></div>
  <div class="lt-steps">
    ${steps.map((s) => `<div class="lt-step"><div><h4>${s.t}</h4><p>${s.d}</p></div></div>`).join('')}
  </div>
  <p class="lt-p" style="text-align:center;margin-top:24px;font-size:13px;color:var(--lt-muted)">※ 실제 진료 과정·기간은 환자 상태에 따라 달라질 수 있습니다.</p>
</div></section>
${cautionsHtml}
<div id="faq"></div>${faqBlock(faqs)}
<section class="lt-section" style="padding-top:0">${authorBox()}${relatedBox(related)}</section>
${ctaBand()}
${faqLd(faqs)}`, name),
    custom_css: '',
    custom_js: FAQ_JS,
  };
}

export const LIGHT_SUBPAGES = (name) => [
  // ── 병원소개: 인사말 ──
  {
    slug: 'intro-greeting', title: '인사말', sort: 10,
    content: fill(`${subHero('병원소개', '인사말', '{{hospital_name}}을 찾아주신 모든 분께 진심으로 감사드립니다.')}
<section class="lt-section"><div class="lt-container" style="max-width:820px">
  <h2 class="lt-h2">환자 한 분 한 분을 가족처럼 진료하겠습니다</h2>
  <p class="lt-p">안녕하세요. {{hospital_name}}입니다. 저희는 <strong>정확한 진단과 과잉진료 없는 정직한 치료</strong>를 가장 중요한 원칙으로 삼고 있습니다. 단순히 아픈 곳을 치료하는 것을 넘어, 환자분이 오래도록 건강한 치아로 편안하게 생활하실 수 있도록 함께하겠습니다.</p>
  <p class="lt-p">치과 치료에 대한 두려움과 부담을 잘 알고 있습니다. 그래서 충분한 설명과 상담을 통해 환자분이 스스로 납득하고 안심할 수 있는 진료를 약속드립니다. 최신 디지털 장비와 철저한 위생관리로 안전한 진료 환경을 갖추고, 늘 한결같은 마음으로 여러분의 미소를 지키겠습니다.</p>
  <div class="lt-card" style="margin-top:28px;background:var(--lt-soft);border-color:transparent">
    <h3 class="lt-h3">우리 병원의 약속</h3>
    <p class="lt-p" style="margin:0">① 꼭 필요한 치료만 권합니다 &nbsp; ② 충분히 설명하고 동의를 구합니다 &nbsp; ③ 끝까지 책임지고 관리합니다</p>
  </div>
  <p class="lt-p" style="margin-top:28px;text-align:right;font-weight:700;color:var(--lt-ink)">{{hospital_name}} 의료진 일동 드림</p>
  <p class="lt-p" style="text-align:right;font-size:13px;color:var(--lt-muted)">자세한 의료진 약력은 <a href="/intro-doctor" style="color:var(--lt-primary);font-weight:700">약력 페이지</a>에서 확인하실 수 있습니다.</p>
</div></section>
${ctaBand()}`, name),
    custom_css: '', custom_js: '',
  },
  // ── 병원소개: 약력 (EEAT 강화) ──
  {
    slug: 'intro-doctor', title: '약력', sort: 11,
    content: fill(`${subHero('병원소개', '의료진 약력', '풍부한 임상 경험과 전문성을 갖춘 의료진이 직접 진료합니다.')}
<section class="lt-section"><div class="lt-container" style="max-width:880px">
  <div class="lt-grid lt-grid-2" style="align-items:start">
    <div class="lt-card">
      <h2 class="lt-h2" style="font-size:1.4rem">대표원장</h2>
      <p class="lt-p" style="font-weight:700;color:var(--lt-ink)">○○○ 원장</p>
      <ul class="lt-p" style="padding-left:18px;line-height:2">
        <li>○○대학교 치과대학 졸업</li>
        <li>○○대학교병원 인턴·레지던트 수료</li>
        <li>대한치과의사협회 정회원</li>
        <li>대한구강악안면임플란트학회 정회원</li>
      </ul>
      <p class="lt-p" style="font-size:13px;color:var(--lt-muted);margin:0">※ 약력 내용은 관리자 페이지에서 실제 정보로 수정하세요.</p>
    </div>
    <div>
      <h3 class="lt-h3">진료 철학</h3>
      <p class="lt-p">"치료보다 예방, 화려함보다 정확함." 환자의 자연치아를 최대한 살리는 보존적 치료를 우선하며, 장기적인 구강 건강을 함께 설계합니다.</p>
      <h3 class="lt-h3" style="margin-top:24px">전문 분야</h3>
      <p class="lt-p">임플란트 · 치아교정 · 심미보철 · 일반진료 전반에 걸쳐 체계적인 진료를 제공합니다. 자세한 내용은 <a href="/care-implant" style="color:var(--lt-primary);font-weight:700">진료안내</a>를 참고해 주세요.</p>
    </div>
  </div>
</div></section>
${ctaBand()}`, name),
    custom_css: '', custom_js: '',
  },
  // ── 진료안내 4종 ──
  treatmentPage({
    name, slug: 'care-implant', sort: 20, title: '임플란트',
    lead: '상실된 치아를 자연치아처럼 회복하는 가장 효과적인 치료입니다.',
    definition: '임플란트란 치아가 빠진 자리에 인공 치근(픽스처)을 식립하고 그 위에 보철물을 연결해 자연치아의 기능과 형태를 회복하는 치료입니다.',
    what: '임플란트는 잇몸뼈에 티타늄 인공 치근을 심고, 골과 결합(골유착)된 뒤 그 위에 기둥(지대주)과 인공치아(크라운)를 연결하는 3단계 구조로 이루어집니다. 주변 건강한 치아를 깎지 않고 빠진 치아만 독립적으로 회복할 수 있어, 틀니나 브릿지에 비해 자연치아에 가까운 저작력을 기대할 수 있습니다. 성공률은 정밀 진단과 식립 계획에 크게 좌우되므로, 3D CT로 신경·혈관 위치와 골량을 정확히 파악한 뒤 진행합니다.',
    points: [
      { t: '정밀 3D 진단', d: '3D CT로 신경·골 상태를 분석해 안전하게 식립합니다.' },
      { t: '맞춤 디지털 보철', d: '구강 스캐너 기반 디지털 보철로 정교하게 제작합니다.' },
      { t: '체계적 사후관리', d: '식립 후 정기 점검으로 오래 사용하도록 관리합니다.' },
    ],
    who: ['충치·잇몸병으로 치아를 발치한 분', '오래된 브릿지·틀니가 불편한 분', '주변 건강한 치아를 깎고 싶지 않은 분', '잘 씹는 기능을 회복하고 싶은 분'],
    compare: {
      intro: '치아 상실 시 대표적인 회복 방법은 임플란트·브릿지·틀니입니다. 각각의 특성을 비교하면 다음과 같습니다.',
      head: ['구분', '임플란트', '브릿지', '틀니'],
      rows: [
        ['주변 치아', '깎지 않음', '양옆 치아 삭제', '걸이로 부담'],
        ['저작력', '자연치아에 가까움', '비교적 양호', '상대적으로 약함'],
        ['관리', '자연치아처럼 관리', '치실 관리 필요', '탈착 세척'],
        ['수명', '관리 시 장기간', '중기', '주기적 교체'],
      ],
    },
    steps: [
      { t: '상담·진단', d: '3D CT 촬영과 구강 검사로 식립 가능 여부를 진단합니다.' },
      { t: '치료 계획', d: '식립 위치·개수·기간과 예상 비용을 충분히 설명드립니다.' },
      { t: '식립 수술', d: '국소마취 후 계획에 따라 인공 치근을 정확히 식립합니다.' },
      { t: '골유착 대기', d: '인공 치근과 뼈가 단단히 결합되도록 일정 기간 기다립니다.' },
      { t: '보철 연결', d: '골유착 후 최종 보철물을 연결해 기능을 회복합니다.' },
    ],
    cautions: ['당뇨·골다공증 등 전신 질환이나 복용 약이 있으면 사전에 알려주세요.', '식립 후 일정 기간 음주·흡연은 골유착에 좋지 않습니다.', '정기 검진과 올바른 칫솔질·치실 관리가 임플란트 수명에 큰 영향을 줍니다.'],
    faqs: [
      { q: '임플란트 치료 기간은 얼마나 걸리나요?', a: '식립 후 골유착까지 일반적으로 2~4개월이 소요되며, 골 상태와 부위에 따라 달라집니다. 정확한 기간은 진단 후 안내드립니다.' },
      { q: '시술이 많이 아픈가요?', a: '국소마취로 진행되어 수술 중 통증은 거의 없습니다. 치과 공포가 크신 경우 수면치료를 함께 고려할 수 있습니다.' },
      { q: '임플란트는 얼마나 오래 쓸 수 있나요?', a: '정기 검진과 올바른 관리가 병행되면 오랫동안 사용할 수 있습니다. 식립 후 관리가 수명에 큰 영향을 줍니다.' },
      { q: '뼈가 부족해도 임플란트가 가능한가요?', a: '골량이 부족한 경우 뼈이식 등을 병행해 식립할 수 있습니다. 가능 여부는 3D CT 진단 후 판단합니다.' },
      { q: '당뇨가 있어도 임플란트를 할 수 있나요?', a: '혈당이 잘 조절되면 가능한 경우가 많습니다. 전신 상태를 확인한 뒤 안전하게 계획합니다.' },
    ],
    related: [['교정', '/care-ortho'], ['일반진료', '/care-general'], ['온라인 상담', '/consult']],
  }),
  treatmentPage({
    name, slug: 'care-ortho', sort: 21, title: '교정',
    lead: '가지런한 치열과 올바른 교합으로 기능과 심미를 동시에 개선합니다.',
    definition: '치아교정이란 고르지 않은 치아와 부정교합(위·아래 치아가 맞물리는 방식의 이상)을 장치로 서서히 이동시켜 바로잡는 치료입니다.',
    who: ['덧니·뻐드렁니 등 치열이 고르지 않은 분', '돌출입이 신경 쓰이는 분', '아래·위 치아가 잘 맞물리지 않는 분', '교정 후 심미와 저작 기능을 함께 개선하고 싶은 분'],
    compare: {
      intro: '교정 장치는 크게 투명교정과 장치(메탈/세라믹)교정으로 나뉩니다. 생활 패턴과 케이스 난이도에 따라 적합한 방식이 다릅니다.',
      head: ['구분', '투명교정', '장치교정'],
      rows: [['심미성', '눈에 잘 띄지 않음', '장치가 보임(세라믹은 덜함)'], ['편의성', '탈착 가능', '고정식'], ['적용 범위', '비교적 단순~중등도', '복잡한 케이스까지 폭넓음'], ['관리', '스스로 착용 시간 관리', '정기 조정 필요']],
    },
    cautions: ['교정 중에는 칫솔질·치실 관리가 특히 중요하며, 관리 소홀 시 충치·잇몸병이 생길 수 있습니다.', '투명교정은 하루 권장 착용 시간을 지켜야 계획대로 이동합니다.', '교정 완료 후에는 유지장치를 착용해야 재발(원래대로 돌아감)을 막을 수 있습니다.'],
    related: [['임플란트', '/care-implant'], ['일반진료', '/care-general'], ['온라인 상담', '/consult']],
    what: '교정 치료는 고르지 않은 치아와 부정교합을 바로잡아 저작 기능과 심미성을 개선하는 치료입니다. 투명교정·메탈교정 등 다양한 방식 중 환자의 생활 패턴과 상태에 맞는 방법을 함께 선택합니다.',
    points: [
      { t: '맞춤 교정 설계', d: '정밀 검사를 토대로 개인별 교정 계획을 수립합니다.' },
      { t: '투명교정 가능', d: '눈에 잘 띄지 않는 투명장치로 부담을 줄입니다.' },
      { t: '정기 체크', d: '주기적 내원으로 진행 상황을 꼼꼼히 관리합니다.' },
    ],
    steps: [
      { t: '정밀 검사', d: '엑스레이·구강 스캔으로 교합 상태를 분석합니다.' },
      { t: '교정 계획', d: '장치 종류·예상 기간·비용을 안내합니다.' },
      { t: '장치 부착·조정', d: '장치를 부착하고 정기적으로 조정합니다.' },
      { t: '유지장치', d: '교정 완료 후 유지장치로 안정화합니다.' },
    ],
    faqs: [
      { q: '교정 기간은 보통 얼마나 되나요?', a: '평균 1.5~2.5년 정도이며, 부정교합 정도와 치료 방식에 따라 달라집니다. 검사 후 예상 기간을 안내드립니다.' },
      { q: '성인도 교정이 가능한가요?', a: '네, 잇몸과 치아 상태가 건강하다면 나이와 관계없이 교정이 가능합니다.' },
      { q: '투명교정과 일반교정의 차이는 무엇인가요?', a: '투명교정은 심미성과 편의성이 높고, 일반(장치)교정은 복잡한 케이스에 폭넓게 적용됩니다. 상태에 따라 적합한 방식을 권합니다.' },
    ],
  }),
  treatmentPage({
    name, slug: 'care-sleep', sort: 22, title: '수면치료',
    lead: '치과 공포·구역질이 심한 분도 편안하게 진료받을 수 있습니다.',
    definition: '수면치료(진정요법)란 진정제를 이용해 환자가 긴장 없이 편안한 상태에서 치과 진료를 받도록 돕는 방법입니다. 전신마취와 달리 의식이 일부 유지되는 진정 상태에서 진행합니다.',
    who: ['치과 치료가 무섭거나 트라우마가 있는 분', '구역 반사가 심해 진료가 어려운 분', '오래 입을 벌리기 힘들거나 장시간 수술이 필요한 분', '여러 부위를 한 번에 치료하고 싶은 분'],
    cautions: ['시술 전 일정 시간 금식이 필요할 수 있어, 사전 안내를 꼭 확인해 주세요.', '전신 질환·복용 약·알레르기는 반드시 미리 알려주세요.', '진정 후에는 회복 시간이 필요하며 당일 운전은 피하고 보호자 동반을 권장합니다.'],
    related: [['임플란트', '/care-implant'], ['일반진료', '/care-general'], ['온라인 상담', '/consult']],
    what: '수면치료(진정요법)는 진정제를 이용해 환자가 편안한 상태에서 진료받도록 돕는 방법입니다. 치과 공포가 크거나 장시간 수술이 필요한 경우, 구역 반사가 심한 경우에 특히 도움이 됩니다. 시술 전 충분한 문진과 모니터링으로 안전하게 진행합니다.',
    points: [
      { t: '편안한 진료', d: '긴장과 공포 없이 진료를 받을 수 있습니다.' },
      { t: '안전한 모니터링', d: '진료 내내 활력징후를 관찰하며 진행합니다.' },
      { t: '사전 문진', d: '병력·복용약을 확인해 안전 여부를 평가합니다.' },
    ],
    steps: [
      { t: '사전 상담·문진', d: '건강 상태와 적용 가능 여부를 확인합니다.' },
      { t: '진정 유도', d: '환자에 맞는 방식으로 편안한 상태를 유도합니다.' },
      { t: '진료 진행', d: '모니터링하며 계획된 진료를 진행합니다.' },
      { t: '회복·귀가 안내', d: '충분히 회복한 뒤 주의사항을 안내합니다.' },
    ],
    faqs: [
      { q: '수면치료를 받으면 진료 내용을 전혀 기억 못 하나요?', a: '방식에 따라 다르지만, 진정 상태에서 편안하게 진료받고 시술에 대한 기억이 적게 남는 경우가 많습니다.' },
      { q: '수면치료 후 바로 일상생활이 가능한가요?', a: '진정 방식에 따라 회복 시간이 필요하며, 당일 운전은 피하고 보호자 동반을 권장합니다.' },
      { q: '누구나 받을 수 있나요?', a: '전신 질환·복용약 등에 따라 제한될 수 있어, 사전 문진을 통해 적용 가능 여부를 판단합니다.' },
    ],
  }),
  treatmentPage({
    name, slug: 'care-general', sort: 23, title: '일반진료',
    lead: '충치·잇몸·신경치료 등 구강 건강의 기본을 책임집니다.',
    definition: '일반진료란 충치치료·신경치료·잇몸치료·발치·스케일링 등 구강 건강을 유지하기 위한 기본 치과 진료를 통칭합니다.',
    who: ['차고 단 음식에 시린 증상이 있는 분', '잇몸이 붓거나 피가 나는 분', '오래 미뤄둔 충치·사랑니가 있는 분', '정기 검진·스케일링이 필요한 분'],
    cautions: ['충치·잇몸병은 자연 치유되지 않고 진행되므로 조기 치료가 비용·시간 부담을 줄입니다.', '신경치료 후에는 치아가 약해질 수 있어 보철(크라운)이 권장되는 경우가 있습니다.', '정기 스케일링과 올바른 칫솔질은 잇몸병 예방의 기본입니다.'],
    related: [['임플란트', '/care-implant'], ['교정', '/care-ortho'], ['온라인 상담', '/consult']],
    what: '일반진료는 충치치료, 신경치료, 잇몸치료, 사랑니 발치, 스케일링 등 구강 건강을 지키는 기본 진료를 포함합니다. 작은 문제를 조기에 발견·치료하는 것이 큰 치료를 예방하는 가장 좋은 방법입니다.',
    points: [
      { t: '충치·신경치료', d: '진행 정도에 맞춰 자연치아를 최대한 보존합니다.' },
      { t: '잇몸치료', d: '잇몸 질환을 관리해 치아 수명을 늘립니다.' },
      { t: '예방·검진', d: '정기 스케일링·검진으로 미리 예방합니다.' },
    ],
    steps: [
      { t: '검사·진단', d: '구강 검사와 엑스레이로 정확히 진단합니다.' },
      { t: '치료 계획', d: '필요한 치료와 순서를 설명드립니다.' },
      { t: '치료 진행', d: '통증을 최소화하며 치료를 진행합니다.' },
      { t: '정기 관리', d: '재발 방지를 위한 관리 계획을 안내합니다.' },
    ],
    faqs: [
      { q: '스케일링은 얼마나 자주 받아야 하나요?', a: '일반적으로 6개월~1년에 한 번 권장하며, 잇몸 상태에 따라 주기를 조정합니다.' },
      { q: '충치는 꼭 치료해야 하나요?', a: '충치는 자연 치유되지 않고 진행되므로, 조기에 치료할수록 간단하고 비용 부담도 적습니다.' },
      { q: '사랑니는 모두 빼야 하나요?', a: '위치·맹출 상태에 따라 다릅니다. 검사 후 발치 필요성을 판단해 안내드립니다.' },
    ],
  }),
  // ── 커뮤니티: FAQ (FAQPage 구조 + AEO) ──
  {
    slug: 'faq', title: '자주 묻는 질문', sort: 30,
    content: fill(`${subHero('커뮤니티', '자주 묻는 질문', '{{hospital_name}}에 자주 문의하시는 내용을 모았습니다.')}
${faqBlock([
  { q: '예약 없이 방문해도 진료가 가능한가요?', a: '예약 환자 우선으로 진료하므로, 대기 시간을 줄이려면 사전 예약을 권장합니다. 온라인 상담 또는 전화로 예약하실 수 있습니다.' },
  { q: '주차가 가능한가요?', a: '주차 정보는 병원마다 다릅니다. 자세한 안내는 오시는 길 또는 전화로 확인해 주세요. (관리자 페이지에서 실제 정보로 수정하세요.)' },
  { q: '진료 시간과 휴진일은 어떻게 되나요?', a: '평일·토요일 진료하며 일요일·공휴일은 휴진입니다. 정확한 시간은 홈 화면 진료시간 안내를 참고해 주세요.' },
  { q: '처음 방문하는데 무엇을 준비해야 하나요?', a: '신분증을 지참해 주시고, 복용 중인 약이나 과거 치과 치료 이력이 있다면 알려주시면 진료에 도움이 됩니다.' },
  { q: '비용 상담만 받을 수도 있나요?', a: '네, 진단 후 치료 계획과 예상 비용을 충분히 설명드린 뒤 환자분이 결정하실 수 있도록 안내합니다.' },
])}
${ctaBand()}`, name),
    custom_css: '', custom_js: FAQ_JS,
  },
  // ── 상담 문의 (폼 → /api/consult) ──
  {
    slug: 'consult', title: '상담 문의', sort: 40,
    content: fill(`${subHero('상담', '온라인 상담 문의', '간단한 정보만 남겨주시면 전문 상담원이 빠르게 연락드립니다.')}
<section class="lt-section"><div class="lt-container" style="max-width:920px">
  <div class="lt-grid lt-grid-2" style="align-items:start;gap:32px">
    <div class="lt-prose" style="margin:0">
      <h2>어떻게 상담하나요?</h2>
      <p class="lt-answer">아래 양식에 성함과 연락처, 상담 항목을 남겨주시면 진료시간 내에 순차적으로 연락드려 궁금한 점을 안내해 드립니다.</p>
      <ul class="lt-check">
        <li>치료 방법·기간·비용 등 무엇이든 문의 가능</li>
        <li>개인정보는 상담 목적으로만 사용·안전하게 관리</li>
        <li>급한 문의는 진료시간 중 전화가 가장 빠릅니다</li>
      </ul>
      <div class="lt-callout">정확한 진단·비용은 내원 검진 후 결정됩니다. 온라인 상담은 일반적인 안내를 위한 것입니다.</div>
      <p style="font-size:13px;color:var(--lt-muted)">관련 안내: <a href="/care-implant">임플란트</a> · <a href="/care-ortho">교정</a> · <a href="/faq">자주 묻는 질문</a></p>
    </div>
    <div class="lt-card" style="padding:28px">
      <h3 class="lt-h3">상담 신청</h3>
      <form id="lt-consult-form" class="lt-form">
        <label>상담 항목
          <select name="category">
            <option value="임플란트">임플란트</option>
            <option value="교정">교정</option>
            <option value="수면치료">수면치료</option>
            <option value="일반진료">일반진료</option>
            <option value="기타">기타 문의</option>
          </select>
        </label>
        <label>성함 <span class="lt-req">*</span>
          <input type="text" name="name" placeholder="성함" required />
        </label>
        <label>연락처 <span class="lt-req">*</span>
          <input type="tel" name="phone" placeholder="010-0000-0000" required />
        </label>
        <label>이메일 <span style="color:var(--lt-muted);font-weight:500">(선택)</span>
          <input type="email" name="email" placeholder="example@email.com" />
        </label>
        <label class="lt-agree"><input type="checkbox" name="agreed" required /> <span>개인정보 수집·이용에 동의합니다. (<a href="/privacy" target="_blank">개인정보 처리방침</a>)</span></label>
        <button type="submit" class="lt-btn lt-btn-primary" style="width:100%">상담 신청하기</button>
        <p id="lt-consult-msg" class="lt-form-msg"></p>
      </form>
    </div>
  </div>
</div></section>`, name),
    custom_css: `.lt-form{display:flex;flex-direction:column;gap:14px}
.lt-form label{display:flex;flex-direction:column;gap:6px;font-size:14px;font-weight:700;color:var(--lt-ink)}
.lt-form input,.lt-form select{border:1.5px solid var(--lt-line);border-radius:10px;padding:12px 14px;font-size:16px;font-family:inherit;outline:none;transition:border-color .15s}
.lt-form input:focus,.lt-form select:focus{border-color:var(--lt-primary)}
.lt-req{color:#dc2626}
.lt-agree{flex-direction:row !important;align-items:flex-start;gap:8px;font-weight:500 !important;font-size:13px;color:var(--lt-body)}
.lt-agree input{width:18px;height:18px;margin-top:2px;flex:0 0 auto}
.lt-agree a{color:var(--lt-primary);font-weight:700}
.lt-form-msg{margin:0;font-size:14px;font-weight:700;text-align:center}
.lt-form-msg.ok{color:var(--lt-primary)}
.lt-form-msg.err{color:#dc2626}`,
    custom_js: `(function(){
  var f=document.getElementById('lt-consult-form'); if(!f) return;
  var msg=document.getElementById('lt-consult-msg');
  f.addEventListener('submit',function(e){
    e.preventDefault();
    var btn=f.querySelector('button[type=submit]');
    if(!f.agreed.checked){msg.className='lt-form-msg err';msg.textContent='개인정보 수집 동의가 필요합니다.';return;}
    btn.disabled=true; msg.className='lt-form-msg'; msg.textContent='접수 중…';
    fetch('/api/consult',{method:'POST',headers:{'Content-Type':'application/json'},credentials:'same-origin',body:JSON.stringify({category:f.category.value,name:f.name.value,phone:f.phone.value,email:f.email.value,agreed:true})})
      .then(function(r){return r.json();})
      .then(function(d){ if(d.error) throw new Error(d.error); msg.className='lt-form-msg ok'; msg.textContent='상담 신청이 접수되었습니다. 곧 연락드리겠습니다.'; f.reset(); })
      .catch(function(err){ msg.className='lt-form-msg err'; msg.textContent=err.message||'접수에 실패했습니다. 잠시 후 다시 시도해 주세요.'; })
      .finally(function(){ btn.disabled=false; });
  });
})();`,
  },
];

// ── 내보내기 ──
export function getLightHeader(name) {
  return { content: headerHtml(name), custom_css: HEADER_CSS, custom_js: HEADER_JS };
}
const QUICK_JS = `(function(){
  var q=document.getElementById('ltQuick'); if(!q) return;
  var fab=q.querySelector('.lt-quick-fab');
  fab.addEventListener('click',function(){ q.classList.toggle('open'); });
  document.addEventListener('keydown',function(e){ if(e.key==='Escape') q.classList.remove('open'); });
  var form=q.querySelector('.lt-quick-form'); if(!form) return;
  var msg=q.querySelector('.lt-quick-msg');
  form.addEventListener('submit',function(e){
    e.preventDefault();
    if(!form.agreed.checked){ msg.className='lt-quick-msg err'; msg.textContent='개인정보 수집 동의가 필요합니다.'; return; }
    var btn=form.querySelector('button[type=submit]'); btn.disabled=true; msg.className='lt-quick-msg'; msg.textContent='접수 중…';
    fetch('/api/consult',{method:'POST',headers:{'Content-Type':'application/json'},credentials:'same-origin',body:JSON.stringify({category:(form.category.value||form.path.value||'기타'),name:form.name.value,phone:form.phone.value,agreed:true})})
      .then(function(r){return r.json();})
      .then(function(d){ if(d.error) throw new Error(d.error); msg.className='lt-quick-msg ok'; msg.textContent='상담 신청이 접수되었습니다. 곧 연락드리겠습니다.'; form.reset(); })
      .catch(function(err){ msg.className='lt-quick-msg err'; msg.textContent=err.message||'접수에 실패했습니다.'; })
      .finally(function(){ btn.disabled=false; });
  });
})();`;

export function getLightFooter(name) {
  return { content: footerHtml(name), custom_css: FOOTER_CSS, custom_js: QUICK_JS };
}
export function getLightMain(name) {
  return { content: mainHtml(name), custom_css: MAIN_CSS, custom_js: FAQ_JS };
}