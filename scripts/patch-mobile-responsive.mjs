/**
 * 모바일 반응형 종합 패치 스크립트
 * 실행: node scripts/patch-mobile-responsive.mjs
 *
 * 1. _header: 햄버거 버튼을 flex 컨테이너 안으로 이동 (위치 수정)
 * 2. main: 모바일 반응형 CSS 추가 (히어로 텍스트, 마커 배너 등)
 * 3. implant / tmj / wisdom-cavity / esthetics / about / doctor:
 *    카드 패딩, 그리드 모바일 CSS 추가
 */

import path from 'path';
import { fileURLToPath } from 'url';
import sqlite3 from 'sqlite3';
import { open } from 'sqlite';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DB_PATH = path.join(__dirname, '../wonjudental.db');

// ── 1. 헤더 재빌드 ──────────────────────────────────────────────────────────

const HEADER_HTML = `<nav id="wj-nav" class="fixed top-0 z-50 w-full border-b border-zinc-200/60 bg-white/85 backdrop-blur-xl transition-all duration-300">
  <div class="mx-auto flex h-20 max-w-7xl items-center justify-between gap-6 px-4">
    <a href="/" class="shrink-0 flex items-center gap-1 text-[17px] font-bold tracking-tight text-offblack md:text-xl">
      <span>Wonju</span><span class="text-accent">Dental</span><span>Clinic</span>
    </a>

    <div class="hidden flex-1 items-center justify-end gap-8 md:flex" id="wj-menu">

      <!-- 원주치과 소개 -->
      <div class="group relative flex h-full cursor-pointer items-center" data-wj-menu="0">
        <div class="wj-menu-title flex items-center gap-1 text-[15px] font-medium text-offblack transition-colors hover:text-accent">
          원주치과 소개
          <svg class="wj-caret transition-transform" width="14" height="14" viewBox="0 0 256 256" fill="currentColor">
            <path d="M213.66 101.66l-80 80a8 8 0 0 1-11.32 0l-80-80A8 8 0 0 1 53.66 90.34L128 164.69l74.34-74.35a8 8 0 0 1 11.32 11.32Z"/>
          </svg>
        </div>
        <div class="wj-dropdown absolute left-1/2 top-full w-[360px] -translate-x-1/2 origin-top rounded-2xl border border-zinc-200 bg-white p-4 shadow-xl transition-all duration-200 pointer-events-none mt-0 scale-95 opacity-0">
          <div class="flex flex-col gap-1">
            <a href="/about/doctor" class="block rounded-xl p-4 transition-colors hover:bg-zinc-50">
              <div class="mb-1 font-bold text-offblack">원장님 소개</div>
              <div class="text-sm text-zinc-500">진단과 설명을 직접 담당하는 대표원장 소개</div>
            </a>
            <a href="/about/hospital" class="block rounded-xl p-4 transition-colors hover:bg-zinc-50">
              <div class="mb-1 font-bold text-offblack">병원 소개</div>
              <div class="text-sm text-zinc-500">진료시간과 오시는 길, 병원 이용 안내</div>
            </a>
          </div>
        </div>
      </div>

      <!-- 진료과목 소개 -->
      <div class="group relative flex h-full cursor-pointer items-center" data-wj-menu="1">
        <div class="wj-menu-title flex items-center gap-1 text-[15px] font-medium text-offblack transition-colors hover:text-accent">
          진료과목 소개
          <svg class="wj-caret transition-transform" width="14" height="14" viewBox="0 0 256 256" fill="currentColor">
            <path d="M213.66 101.66l-80 80a8 8 0 0 1-11.32 0l-80-80A8 8 0 0 1 53.66 90.34L128 164.69l74.34-74.35a8 8 0 0 1 11.32 11.32Z"/>
          </svg>
        </div>
        <div class="wj-dropdown absolute left-1/2 top-full w-[360px] -translate-x-1/2 origin-top rounded-2xl border border-zinc-200 bg-white p-4 shadow-xl transition-all duration-200 pointer-events-none mt-0 scale-95 opacity-0">
          <div class="flex flex-col gap-1">
            <a href="/implant" class="block rounded-xl p-4 transition-colors hover:bg-zinc-50">
              <div class="mb-1 font-bold text-offblack">프리미엄 임플란트</div>
              <div class="text-sm text-zinc-500">3D 진단과 보철 계획을 함께 보는 임플란트</div>
            </a>
            <a href="/tmj" class="block rounded-xl p-4 transition-colors hover:bg-zinc-50">
              <div class="mb-1 font-bold text-offblack">턱관절 클리닉</div>
              <div class="text-sm text-zinc-500">통증과 개구 제한을 함께 보는 TMJ 진료</div>
            </a>
            <a href="/wisdom-cavity" class="block rounded-xl p-4 transition-colors hover:bg-zinc-50">
              <div class="mb-1 font-bold text-offblack">사랑니 · 충치치료</div>
              <div class="text-sm text-zinc-500">발치와 보존 가능성을 함께 판단하는 진료</div>
            </a>
            <a href="/esthetics" class="block rounded-xl p-4 transition-colors hover:bg-zinc-50">
              <div class="mb-1 font-bold text-offblack">심미치료</div>
              <div class="text-sm text-zinc-500">치아 형태와 색 조화를 고려한 심미 진료</div>
            </a>
          </div>
        </div>
      </div>

      <!-- 커뮤니티 -->
      <div class="group relative flex h-full cursor-pointer items-center" data-wj-menu="2">
        <div class="wj-menu-title flex items-center gap-1 text-[15px] font-medium text-offblack transition-colors hover:text-accent">
          커뮤니티
          <svg class="wj-caret transition-transform" width="14" height="14" viewBox="0 0 256 256" fill="currentColor">
            <path d="M213.66 101.66l-80 80a8 8 0 0 1-11.32 0l-80-80A8 8 0 0 1 53.66 90.34L128 164.69l74.34-74.35a8 8 0 0 1 11.32 11.32Z"/>
          </svg>
        </div>
        <div class="wj-dropdown absolute left-1/2 top-full w-[360px] -translate-x-1/2 origin-top rounded-2xl border border-zinc-200 bg-white p-4 shadow-xl transition-all duration-200 pointer-events-none mt-0 scale-95 opacity-0" id="wj-community-dropdown">
          <div class="flex flex-col gap-1">
            <a href="/community/notice" class="block rounded-xl p-4 transition-colors hover:bg-zinc-50">
              <div class="mb-1 font-bold text-offblack">공지사항</div>
              <div class="text-sm text-zinc-500">병원 운영과 공지 소식을 확인하세요.</div>
            </a>
            <a href="/community/event" class="block rounded-xl p-4 transition-colors hover:bg-zinc-50">
              <div class="mb-1 font-bold text-offblack">이벤트</div>
              <div class="text-sm text-zinc-500">현재 진행 중인 혜택과 프로모션 안내</div>
            </a>
            <!-- 동적 게시판 그룹은 JS에서 추가됨 -->
          </div>
        </div>
      </div>

    </div>

    <!-- 모바일 햄버거 버튼 -->
    <button id="wj-mobile-btn" aria-label="메뉴 열기" aria-expanded="false" aria-controls="wj-mobile-overlay">
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round">
        <line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/>
      </svg>
    </button>
  </div>
</nav>

<!-- 모바일 전체화면 오버레이 -->
<div id="wj-mobile-overlay" role="dialog" aria-modal="true" aria-label="모바일 메뉴">
  <div id="wj-mobile-header">
    <a href="/" class="wj-logo">Wonju<span class="accent">Dental</span>Clinic</a>
    <button id="wj-mobile-close" aria-label="메뉴 닫기">
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round">
        <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
      </svg>
    </button>
  </div>
  <nav id="wj-mobile-nav">
    <!-- JS로 menuData를 렌더링 -->
  </nav>
</div>`;

const HEADER_CSS = `
/* ── 데스크톱 드롭다운 ───────────────────────────────────── */
[data-wj-menu]:hover .wj-dropdown,
[data-wj-menu].active .wj-dropdown {
  pointer-events: auto !important;
  opacity: 1 !important;
  transform: translateX(-50%) scaleY(1) !important;
  margin-top: 8px !important;
}
[data-wj-menu]:hover .wj-caret,
[data-wj-menu].active .wj-caret { transform: rotate(180deg); }
[data-wj-menu]:hover .wj-menu-title,
[data-wj-menu].active .wj-menu-title { color: var(--color-accent, #EE6A3D); font-weight: 700; }

/* ── 모바일 햄버거 버튼 ──────────────────────────────────── */
#wj-mobile-btn {
  display: none;
  align-items: center;
  justify-content: center;
  width: 40px; height: 40px;
  background: transparent; border: none; cursor: pointer; padding: 0;
  color: #1E3A5F; flex-shrink: 0;
  -webkit-tap-highlight-color: transparent;
}
@media (max-width: 767px) {
  #wj-mobile-btn { display: flex; }
}

/* ── 모바일 오버레이 ─────────────────────────────────────── */
#wj-mobile-overlay {
  display: none; position: fixed; inset: 0; z-index: 9999;
  background: #fff; flex-direction: column;
  overflow-y: auto;
}
#wj-mobile-overlay.open { display: flex; }

#wj-mobile-header {
  display: flex; align-items: center; justify-content: space-between;
  padding: 0 16px; height: 64px;
  border-bottom: 1px solid #f0f0f0; flex-shrink: 0;
  position: sticky; top: 0; background: #fff; z-index: 1;
}
#wj-mobile-header .wj-logo {
  font-size: 17px; font-weight: 700; text-decoration: none; color: #1E3A5F;
}
#wj-mobile-header .wj-logo .accent { color: #EE6A3D; }

#wj-mobile-close {
  display: flex; align-items: center; justify-content: center;
  width: 40px; height: 40px;
  background: transparent; border: none; cursor: pointer; padding: 0; color: #555;
  -webkit-tap-highlight-color: transparent;
}

#wj-mobile-nav { padding: 12px 16px 40px; }

.wj-mob-group { border-bottom: 1px solid #f5f5f5; padding: 4px 0; }
.wj-mob-group:last-child { border-bottom: none; }

.wj-mob-toggle {
  display: flex; align-items: center; justify-content: space-between;
  width: 100%; padding: 14px 8px;
  background: none; border: none; cursor: pointer;
  font-size: 15px; font-weight: 700; color: #1E3A5F;
  -webkit-tap-highlight-color: transparent;
}
.wj-mob-toggle svg { transition: transform 0.2s; flex-shrink: 0; }
.wj-mob-toggle.open svg { transform: rotate(180deg); }

.wj-mob-sub { display: none; padding: 0 8px 8px; flex-direction: column; gap: 2px; }
.wj-mob-sub.open { display: flex; }

.wj-mob-sub a {
  display: block; padding: 10px 12px; border-radius: 10px;
  font-size: 14px; font-weight: 600; color: #444;
  text-decoration: none; transition: background 0.15s, color 0.15s;
}
.wj-mob-sub a:active, .wj-mob-sub a.active { background: #fff4ee; color: #EE6A3D; }
.wj-mob-sub-desc { font-size: 12px; font-weight: 400; color: #aaa; margin-top: 2px; }
`;

const HEADER_JS = `
(function() {
  // ── 데스크톱 드롭다운 ──────────────────────────────────────────────────────
  var nav = document.getElementById('wj-nav');
  var menuItems = nav ? nav.querySelectorAll('[data-wj-menu]') : [];
  menuItems.forEach(function(item) {
    item.addEventListener('mouseenter', function() {
      menuItems.forEach(function(i) { i.classList.remove('active'); });
      item.classList.add('active');
    });
  });
  if (nav) {
    nav.addEventListener('mouseleave', function() {
      menuItems.forEach(function(i) { i.classList.remove('active'); });
    });
  }

  // 현재 경로에 따른 활성 스타일
  var cur = window.location.pathname;
  menuItems.forEach(function(item) {
    var links = item.querySelectorAll('a[href]');
    links.forEach(function(a) {
      if (cur === a.getAttribute('href') || (a.getAttribute('href') !== '/' && cur.startsWith(a.getAttribute('href')))) {
        item.querySelector('.wj-menu-title').style.color = 'var(--color-accent, #EE6A3D)';
        item.querySelector('.wj-menu-title').style.fontWeight = '700';
      }
    });
  });

  // 커뮤니티 동적 게시판 그룹 로드
  var commDropdown = document.getElementById('wj-community-dropdown');
  if (commDropdown) {
    fetch('/api/board-group').then(function(r){ return r.json(); }).then(function(groups){
      if (!Array.isArray(groups) || groups.length === 0) return;
      var container = commDropdown.querySelector('.flex.flex-col');
      groups.forEach(function(g) {
        var a = document.createElement('a');
        a.href = '/community/' + g.slug;
        a.className = 'block rounded-xl p-4 transition-colors hover:bg-zinc-50';
        a.innerHTML = '<div class="mb-1 font-bold text-offblack">' + g.name + '</div>' +
          '<div class="text-sm text-zinc-500">' + (g.description || g.name + ' 게시판으로 이동') + '</div>';
        container.appendChild(a);
      });
    }).catch(function(){});
  }

  // ── 모바일 메뉴 ────────────────────────────────────────────────────────────
  var btn = document.getElementById('wj-mobile-btn');
  var overlay = document.getElementById('wj-mobile-overlay');
  var closeBtn = document.getElementById('wj-mobile-close');
  var mobileNav = document.getElementById('wj-mobile-nav');
  if (!btn || !overlay) return;

  var menuData = [
    { title: '원주치과 소개', items: [
      { name: '원장님 소개', path: '/about/doctor', desc: '진단과 설명을 직접 담당하는 대표원장 소개' },
      { name: '병원 소개', path: '/about/hospital', desc: '진료시간과 오시는 길, 병원 이용 안내' },
    ]},
    { title: '진료과목 소개', items: [
      { name: '프리미엄 임플란트', path: '/implant', desc: '3D 진단과 보철 계획을 함께 보는 임플란트' },
      { name: '턱관절 클리닉', path: '/tmj', desc: '통증과 개구 제한을 함께 보는 TMJ 진료' },
      { name: '사랑니 · 충치치료', path: '/wisdom-cavity', desc: '발치와 보존 가능성을 함께 판단하는 진료' },
      { name: '심미치료', path: '/esthetics', desc: '치아 형태와 색 조화를 고려한 심미 진료' },
    ]},
    { title: '커뮤니티', items: [
      { name: '공지사항', path: '/community/notice', desc: '병원 운영과 공지 소식을 확인하세요.' },
      { name: '이벤트', path: '/community/event', desc: '현재 진행 중인 혜택과 프로모션 안내' },
    ]},
  ];

  fetch('/api/board-group').then(function(r){ return r.json(); }).then(function(groups){
    if (!Array.isArray(groups)) return;
    groups.forEach(function(g){
      menuData[2].items.push({ name: g.name, path: '/community/' + g.slug, desc: g.description || '' });
    });
    renderMobileNav();
  }).catch(function(){ renderMobileNav(); });

  function renderMobileNav() {
    var html = '';
    menuData.forEach(function(group, gi) {
      var anyActive = group.items.some(function(i){ return cur === i.path || (i.path !== '/' && cur.startsWith(i.path)); });
      html += '<div class="wj-mob-group">';
      html += '<button class="wj-mob-toggle' + (anyActive ? ' open' : '') + '" aria-expanded="' + (anyActive ? 'true' : 'false') + '">';
      html += group.title;
      html += '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><polyline points="6 9 12 15 18 9"/></svg>';
      html += '</button>';
      html += '<div class="wj-mob-sub' + (anyActive ? ' open' : '') + '">';
      group.items.forEach(function(item) {
        var active = cur === item.path || (item.path !== '/' && cur.startsWith(item.path));
        html += '<a href="' + item.path + '"' + (active ? ' class="active"' : '') + '>';
        html += item.name;
        if (item.desc) html += '<div class="wj-mob-sub-desc">' + item.desc + '</div>';
        html += '</a>';
      });
      html += '</div></div>';
    });
    mobileNav.innerHTML = html;

    mobileNav.querySelectorAll('.wj-mob-toggle').forEach(function(t) {
      t.addEventListener('click', function() {
        var sub = t.nextElementSibling;
        var isOpen = t.classList.toggle('open');
        sub.classList.toggle('open', isOpen);
        t.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
      });
    });
  }

  renderMobileNav();

  function openMenu() {
    overlay.classList.add('open');
    btn.setAttribute('aria-expanded', 'true');
    document.body.style.overflow = 'hidden';
  }
  function closeMenu() {
    overlay.classList.remove('open');
    btn.setAttribute('aria-expanded', 'false');
    document.body.style.overflow = '';
  }

  btn.addEventListener('click', openMenu);
  closeBtn.addEventListener('click', closeMenu);
  overlay.addEventListener('click', function(e) {
    if (e.target === overlay) closeMenu();
  });
  document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') closeMenu();
  });
  mobileNav.addEventListener('click', function(e) {
    var a = e.target.closest('a[href]');
    if (a) closeMenu();
  });
})();
`;

// ── 2. 메인 페이지 모바일 CSS ──────────────────────────────────────────────

const MAIN_MOBILE_CSS = `
/* ── 모바일 반응형 오버라이드 (≤767px) ───────────────────── */
@media (max-width: 767px) {
  /* 히어로 타이포 축소 */
  .wj-hero-content h1 { font-size: 2.4rem !important; line-height: 1.08 !important; }
  .wj-hero-content p { font-size: 1rem !important; }
  /* 히어로 섹션 높이 축소 */
  .wj-hero-content { min-height: 260px; }
  /* 도트 컨테이너 */
  .wj-hero-dots-container { gap: 8px; }
}
@media (max-width: 480px) {
  .wj-hero-content h1 { font-size: 2rem !important; }
}
`;

// ── 3. 서비스 페이지 공통 모바일 CSS ────────────────────────────────────────

const SERVICE_MOBILE_CSS = `
/* ── 모바일 카드 패딩 최적화 (≤767px) ────────────────────── */
@media (max-width: 767px) {
  /* 큰 패딩 카드 축소 */
  .rounded-\\[3rem\\], .rounded-\\[2rem\\] {
    border-radius: 1.5rem !important;
    padding: 1.75rem !important;
  }
  /* 섹션 상단 마진 축소 */
  .mb-24 { margin-bottom: 3rem !important; }
  /* 격자 내 큰 min-height 제거 */
  .min-h-\\[400px\\] { min-height: 280px !important; }
  /* 이미지 카드 높이 */
  .h-\\[420px\\], .h-\\[480px\\] { height: 300px !important; }
  /* 텍스트 크기 */
  h1.text-5xl, .text-5xl { font-size: 2.4rem !important; line-height: 1.08 !important; }
  h2.text-4xl, .text-4xl { font-size: 1.9rem !important; }
  h2.text-6xl, .text-6xl { font-size: 2rem !important; }
  h3.text-3xl, .text-3xl { font-size: 1.5rem !important; }
}
@media (max-width: 480px) {
  .rounded-\\[3rem\\], .rounded-\\[2rem\\] {
    border-radius: 1.25rem !important;
    padding: 1.25rem !important;
  }
  h1.text-5xl, .text-5xl { font-size: 2rem !important; }
}
`;

// ── 4. about / doctor 페이지 모바일 CSS ─────────────────────────────────────

const ABOUT_MOBILE_CSS = `
/* ── 모바일 최적화 ───────────────────────────────────────── */
@media (max-width: 767px) {
  h1.text-4xl, .text-4xl { font-size: 1.9rem !important; }
  /* 그리드 갭 축소 */
  .gap-12 { gap: 2rem !important; }
}
`;

// ──────────────────────────────────────────────────────────────────────────────

async function main() {
  const db = await open({ filename: DB_PATH, driver: sqlite3.Database });
  console.log('DB 연결 완료:', DB_PATH);

  // 1. 헤더 완전 재작성 (올바른 위치에 햄버거 버튼 포함)
  console.log('\n[1/7] _header 재작성...');
  await db.run(
    `UPDATE pages SET content = ?, custom_css = ?, custom_js = ?, updated_at = CURRENT_TIMESTAMP WHERE slug = '_header'`,
    [HEADER_HTML, HEADER_CSS, HEADER_JS]
  );
  console.log('  ✓ _header: content', HEADER_HTML.length, 'css', HEADER_CSS.length, 'js', HEADER_JS.length);

  // 2. 메인 페이지 CSS 업데이트
  console.log('\n[2/7] main 페이지 모바일 CSS 추가...');
  const mainPage = await db.get('SELECT custom_css FROM pages WHERE slug = ?', ['main']);
  if (mainPage) {
    let css = mainPage.custom_css || '';
    if (!css.includes('모바일 반응형 오버라이드')) {
      css = css + '\n' + MAIN_MOBILE_CSS;
      await db.run('UPDATE pages SET custom_css = ?, updated_at = CURRENT_TIMESTAMP WHERE slug = ?', [css, 'main']);
      console.log('  ✓ main CSS 업데이트:', css.length, '자');
    } else {
      console.log('  ⚠ 이미 모바일 CSS 존재');
    }
  }

  // 3~6. 서비스 페이지 CSS 추가
  const servicePages = ['implant', 'tmj', 'wisdom-cavity', 'esthetics'];
  let i = 3;
  for (const slug of servicePages) {
    console.log(`\n[${i++}/7] ${slug} 모바일 CSS 추가...`);
    const p = await db.get('SELECT custom_css FROM pages WHERE slug = ?', [slug]);
    if (!p) { console.log('  ⚠ 페이지 없음'); continue; }
    let css = p.custom_css || '';
    if (!css.includes('모바일 카드 패딩 최적화')) {
      css = css + '\n' + SERVICE_MOBILE_CSS;
      await db.run('UPDATE pages SET custom_css = ?, updated_at = CURRENT_TIMESTAMP WHERE slug = ?', [css, slug]);
      console.log('  ✓', slug, 'CSS 업데이트:', css.length, '자');
    } else {
      console.log('  ⚠ 이미 모바일 CSS 존재');
    }
  }

  // 7. about / doctor 페이지 CSS 추가
  console.log('\n[7/7] about / doctor 모바일 CSS 추가...');
  for (const slug of ['about', 'doctor']) {
    const p = await db.get('SELECT custom_css FROM pages WHERE slug = ?', [slug]);
    if (!p) continue;
    let css = p.custom_css || '';
    if (!css.includes('모바일 최적화')) {
      css = css + '\n' + ABOUT_MOBILE_CSS;
      await db.run('UPDATE pages SET custom_css = ?, updated_at = CURRENT_TIMESTAMP WHERE slug = ?', [css, slug]);
      console.log('  ✓', slug, 'CSS 업데이트');
    }
  }

  console.log('\n✅ 모바일 반응형 패치 완료!');
  await db.close();
}

main().catch(e => { console.error(e); process.exit(1); });
