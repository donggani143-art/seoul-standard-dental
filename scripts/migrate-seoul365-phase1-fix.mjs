// 서울365 Phase 1 패치
//   1) 헤더: 마우스 진입 시 검은 배경 scaleY 애니메이션 + sub_menu 동시 펼침 (원본 .mouse_on 동작 재현)
//   2) 메인: 치과 둘러보기(인테리어 갤러리) 섹션 추가 (16장 인테리어 스와이퍼)
//   3) 푸터: 진료시간 안내 표 첫 번째 컬럼 폭 고정 (128px)
//
// hospital_id=10 (seoul365opendental) 만 대상.

import sqlite3 from 'sqlite3';

const HOSPITAL_ID = 10;
const HOSPITAL_SLUG = 'seoul365opendental';
const DB_PATH = process.argv[2] || './wonjudental.db';

const IMG = `/uploads/hospitals/${HOSPITAL_SLUG}`;
const INT = `${IMG}/interior`;

// 인테리어 원본 이미지 16장 (썸네일 제외)
const INTERIOR_FILES = [
  '1026282948_5YyRaS7h_f46e4cb4e6a4f80e094ba993a94d4cf9df3b6da5.png',
  '1026282948_6bUDehEP_fff604c9ff7388549508c08a348ebd60d9ae30a2.png',
  '1026282948_9RtIaeC6_260d7b73aa17f98ff506b5b162a9dc1c3b7215f0.png',
  '1026282948_EolCYtk5_01db8e9f70be41ef1b065e9b645eda6380b0f93a.png',
  '1026282948_fgRJ2Fnh_a98d0ada93c20764f65cdad19064bdca77cc6dc7.png',
  '1026282948_GKmy6JlD_10e1ed4c17bf7ce12a8e66a2d88db716f09641ca.png',
  '1026282948_inKwHq5x_21bc83a3cf116621260e36f2a587bad867c719cb.png',
  '1026282948_mKZ7BN0G_9b48b775f47e62c5210b5dd8709e5aee678652dd.png',
  '1026282948_pF2Of1mI_5ab49ab4d9415d779482ce504b3a27a48ba0942e.png',
  '1026282948_pQgSBWbD_f60beb782464dae758cc8204a42ac641b02c40ea.png',
  '1026282948_qcmnMbC2_2bad4054fb186a4036e67366866730e2263a0cea.png',
  '1026282948_Qr9dkij5_8735cf1313cd04363b046de9702aa5fb14b4dea3.png',
  '1026282948_qVJFrHXm_ea3bfbcd06d6cd9ec5f641f8595606534044e307.png',
  '1026282948_s87vO0yf_6351d3fedff639569968952562a528c94fbf11ce.png',
  '1026282948_UaoelZVL_f02bf2f4c1aa2dd298aca4758ef3fabeb27bb67c.png',
  '1026282948_WrGPBeEf_004812362d2f2500720d49a65d7ecaa10d7f7650.png',
];

const db = new sqlite3.Database(DB_PATH);
function run(sql, params = []) { return new Promise((res, rej) => db.run(sql, params, function(err){ if(err) rej(err); else res(this); })); }
function get(sql, params = []) { return new Promise((res, rej) => db.get(sql, params, (err, row) => { if(err) rej(err); else res(row); })); }

// ── 1) _header — 마우스 진입 시 헤더 전체 애니메이션 ──────────────────────────
async function patchHeader() {
  const row = await get('SELECT id, custom_css, content FROM pages WHERE hospital_id=? AND slug=?', [HOSPITAL_ID, '_header']);
  if (!row) throw new Error('_header 행 없음');

  // 기존 CSS에서 .s365-header 관련 일부 규칙 변경 + ::after 애니메이션 추가
  // 1) sticky 유지하되 hover 트리거 영역(.s365-header) 위에 mouse_on 클래스 추가됐을 때 어두운 배경 scaleY 1
  // 2) sub_menu 표시는 해당 li hover 외에 .s365-header.mouse_on 일 때도 보이게
  // 3) 기본 배경은 투명에 가깝게, 스크롤됐을 때만 어두운 배경
  let css = row.custom_css;

  // 헤더 베이스 규칙 교체 (.s365-header { ... }) — 첫 매칭만
  css = css.replace(
    /\.s365-header \{[^}]*\}/,
    `.s365-header { position: sticky; top: 0; left: 0; width: 100%; z-index: 100; background: transparent; transition: background 0.25s ease; }`
  );
  css = css.replace(
    /\.s365-header:hover \{[^}]*\}/,
    `.s365-header.is-scrolled { background: rgba(0,0,0,0.55); }`
  );

  // 추가 애니메이션 규칙(중복 방지 마커 사용)
  const MARKER = '/* === HEADER MOUSE_ON ANIM === */';
  if (!css.includes(MARKER)) {
    css += `

${MARKER}
.s365-header { overflow: visible; }
.s365-header::before { content: ''; position: absolute; top: 0; left: 0; right: 0; height: 100%; background: rgba(0,0,0,0.65); transform: scaleY(0); transform-origin: 50% 0; transition: transform 0.3s cubic-bezier(0.22,1,0.36,1); z-index: -1; pointer-events: none; }
.s365-header.is-mouse-on::before { transform: scaleY(1); }
.s365-header .s365-inbox { position: relative; z-index: 1; }
@media (min-width: 1025px) {
  .s365-header.is-mouse-on .s365-sub-menu { display: block !important; }
  .s365-header .s365-sub-menu { background: transparent; min-width: 0; padding: 8px 18px 18px; transform: translateX(-50%); }
  .s365-header .s365-sub-menu a { padding: 6px 0; font-size: 14px; }
  .s365-header.is-mouse-on .s365-gnb > ul > li { background: transparent !important; }
  .s365-header.is-mouse-on .s365-gnb > ul > li:hover { background: rgba(0,57,95,0.6) !important; }
}
`;
  }

  // 헤더 content에 mouse-on 토글 JS 삽입 (마커로 중복 방지)
  let content = row.content;
  const SCRIPT_MARKER = '<!-- s365-header-mouseon -->';
  if (!content.includes(SCRIPT_MARKER)) {
    const script = `
${SCRIPT_MARKER}
<script>
(function(){
  var h = document.getElementById('s365Header');
  if (!h) return;
  // 데스크탑에서만 mouse_on 동작 (1025px 이상)
  function isDesktop(){ return window.matchMedia('(min-width: 1025px)').matches; }
  h.addEventListener('mouseenter', function(){ if (isDesktop()) h.classList.add('is-mouse-on'); });
  h.addEventListener('mouseleave', function(){ h.classList.remove('is-mouse-on'); });
  // 스크롤 시 어두운 배경 유지 (헤더 영역 밖이어도)
  function syncScrolled(){ if (window.scrollY > 8) h.classList.add('is-scrolled'); else h.classList.remove('is-scrolled'); }
  window.addEventListener('scroll', syncScrolled, { passive: true });
  syncScrolled();
})();
</script>`;
    // </header> 또는 </aside> 직전 또는 마지막 </div> 직전에 삽입 (안전한 위치)
    if (content.includes('</aside>')) {
      content = content.replace('</aside>', '</aside>\n' + script);
    } else {
      content += '\n' + script;
    }
  }

  await run(
    `UPDATE pages SET custom_css=?, content=?, updated_at=CURRENT_TIMESTAMP
     WHERE id=? AND hospital_id=? AND slug=?`,
    [css, content, row.id, HOSPITAL_ID, '_header']
  );
  console.log(`  [UPDATE] _header (id=${row.id})`);
}

// ── 2) main — 인테리어 둘러보기 섹션 추가 ──────────────────────────────────
async function patchMain() {
  const row = await get('SELECT id, content, custom_css FROM pages WHERE hospital_id=? AND slug=?', [HOSPITAL_ID, 'main']);
  if (!row) throw new Error('main 행 없음');

  let content = row.content;
  let css = row.custom_css;
  const MARKER = '<!-- s365-interior-section -->';
  if (content.includes(MARKER)) {
    console.log('  main 둘러보기 섹션 이미 존재 — 스킵');
    return;
  }

  // CSS 추가
  const cssMarker = '/* === INTERIOR GALLERY === */';
  if (!css.includes(cssMarker)) {
    css += `

${cssMarker}
.s365-con5 { padding: 120px 0; background: #fff; overflow: hidden; }
.s365-con5 .s365-titlebox { text-align: center; margin-bottom: 36px; }
.s365-con5 .s365-titlebox h5 { font-size: 32px; font-weight: 300; color: #272727; }
.s365-con5 .s365-titlebox h5 strong { font-weight: 900; color: #00395f; }
.s365-con5 .s365-titlebox .icon { display: block; width: 32px; height: 32px; margin: 0 auto 14px; background: url(${IMG}/icon.png) no-repeat 50% / contain; opacity: 0.6; }
.s365-con5 .s365-out-interior { position: relative; max-width: 1150px; margin: 0 auto; padding: 0 64px; }
.s365-con5 .s365-out-interior .swiper-slide { aspect-ratio: 1150 / 650; }
.s365-con5 .s365-out-interior .swiper-slide img { width: 100%; height: 100%; object-fit: cover; display: block; border-radius: 4px; }
.s365-con5 .s365-slide-btn span { position: absolute; top: 50%; transform: translateY(-50%); width: 50px; height: 50px; border-radius: 50%; background-color: #00395f; background-repeat: no-repeat; background-position: 50%; cursor: pointer; transition: opacity 0.2s; z-index: 5; }
.s365-con5 .s365-slide-btn span:hover { opacity: 0.85; }
.s365-con5 .s365-slide-btn .l_bt { left: 0; background-image: url(${IMG}/bt_left.png); }
.s365-con5 .s365-slide-btn .r_bt { right: 0; background-image: url(${IMG}/bt_right.png); }
.s365-con5 .s365-thumbs { margin-top: 16px; max-width: 1150px; margin-left: auto; margin-right: auto; padding: 0 64px; }
.s365-con5 .s365-thumbs .swiper-slide { width: 12.5% !important; opacity: 0.5; cursor: pointer; transition: opacity 0.2s; }
.s365-con5 .s365-thumbs .swiper-slide.swiper-slide-thumb-active { opacity: 1; }
.s365-con5 .s365-thumbs img { width: 100%; aspect-ratio: 1; object-fit: cover; display: block; border-radius: 2px; }
@media (max-width: 768px) {
  .s365-con5 { padding: 64px 0; }
  .s365-con5 .s365-out-interior, .s365-con5 .s365-thumbs { padding: 0 16px; }
  .s365-con5 .s365-slide-btn span { width: 40px; height: 40px; }
  .s365-con5 .s365-thumbs { display: none; }
}
`;
  }

  // 메인 갤러리 슬라이드 + 썸네일 슬라이드 HTML
  const slidesHtml = INTERIOR_FILES.map((f, i) => `        <div class="swiper-slide"><img src="${INT}/${f}" alt="서울365열린치과 인테리어 ${i+1}" loading="lazy"/></div>`).join('\n');
  const thumbsHtml = INTERIOR_FILES.map((f, i) => `        <div class="swiper-slide"><img src="${INT}/thumb-${f.replace('.png','')}_202x150.png" alt="" loading="lazy" onerror="this.src='${INT}/${f}'"/></div>`).join('\n');

  const sectionHtml = `

${MARKER}
<section class="s365-con5">
  <div class="s365-inbox">
    <div class="s365-titlebox">
      <span class="icon" aria-hidden="true"></span>
      <h5>서울365열린치과 <strong>둘러보기</strong></h5>
    </div>
    <div class="s365-out-interior">
      <div class="swiper-container" id="s365Interior">
        <div class="swiper-wrapper">
${slidesHtml}
        </div>
      </div>
      <div class="s365-slide-btn">
        <span class="l_bt" id="s365InteriorPrev" role="button" aria-label="이전"></span>
        <span class="r_bt" id="s365InteriorNext" role="button" aria-label="다음"></span>
      </div>
    </div>
    <div class="s365-thumbs">
      <div class="swiper-container" id="s365InteriorThumbs">
        <div class="swiper-wrapper">
${thumbsHtml}
        </div>
      </div>
    </div>
  </div>
</section>
`;

  // </div> 마지막 .s365-host 닫기 직전에 삽입
  const lastClose = content.lastIndexOf('</div>');
  if (lastClose > 0) {
    content = content.slice(0, lastClose) + sectionHtml + '\n' + content.slice(lastClose);
  } else {
    content += sectionHtml;
  }

  // custom_js에 인테리어 swiper 초기화 추가 (중복 방지)
  const jsRow = await get('SELECT custom_js FROM pages WHERE hospital_id=? AND slug=?', [HOSPITAL_ID, 'main']);
  let js = jsRow.custom_js || '';
  const JS_MARKER = '/* s365-interior-init */';
  if (!js.includes(JS_MARKER)) {
    js += `
${JS_MARKER}
(function(){
  function initInterior(){
    if (!window.Swiper) { setTimeout(initInterior, 200); return; }
    if (!document.getElementById('s365Interior')) return;
    var thumbs = new Swiper('#s365InteriorThumbs', { slidesPerView: 8, spaceBetween: 8, watchSlidesProgress: true });
    new Swiper('#s365Interior', {
      loop: true, speed: 700, autoplay: { delay: 5000 },
      navigation: { nextEl: '#s365InteriorNext', prevEl: '#s365InteriorPrev' },
      thumbs: { swiper: thumbs }
    });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', initInterior); else initInterior();
})();
`;
  }

  await run(
    `UPDATE pages SET content=?, custom_css=?, custom_js=?, updated_at=CURRENT_TIMESTAMP
     WHERE id=? AND hospital_id=? AND slug=?`,
    [content, css, js, row.id, HOSPITAL_ID, 'main']
  );
  console.log(`  [UPDATE] main (id=${row.id}) — 둘러보기 섹션 추가`);
}

// ── 3) _footer — 진료시간 안내 표 라벨 폭 고정 ───────────────────────────────
async function patchFooter() {
  const row = await get('SELECT id, custom_css FROM pages WHERE hospital_id=? AND slug=?', [HOSPITAL_ID, '_footer']);
  if (!row) throw new Error('_footer 행 없음');

  let css = row.custom_css;
  const MARKER = '/* === FOOTER TABLE FIXED LABEL WIDTH === */';
  if (css.includes(MARKER)) {
    console.log('  _footer 표 패치 이미 적용됨 — 스킵');
    return;
  }

  // table-layout: fixed 적용 + th에 명시적 폭 + 모든 th 동일한 padding/font 보장
  css += `

${MARKER}
.s365-con4-2 table { table-layout: fixed; width: 100%; max-width: 360px; }
.s365-con4-2 th { width: 132px; padding: 0 8px; font-size: 15px; line-height: 32px; height: 32px; text-align: center; box-sizing: border-box; word-break: keep-all; }
.s365-con4-2 th strong { font-size: 11px; margin-left: 2px; font-weight: 700; }
.s365-con4-2 td { padding-left: 14px; font-size: 15px; height: 32px; line-height: 32px; box-sizing: border-box; }
.s365-con4-2 td font { font-size: 11px; margin-left: 6px; color: #666; }
`;

  await run(
    `UPDATE pages SET custom_css=?, updated_at=CURRENT_TIMESTAMP
     WHERE id=? AND hospital_id=? AND slug=?`,
    [css, row.id, HOSPITAL_ID, '_footer']
  );
  console.log(`  [UPDATE] _footer (id=${row.id}) — 표 라벨 폭 고정`);
}

async function main() {
  console.log('[seoul365 Phase 1 패치 — hospital_id=10]');
  const h = await get('SELECT id, slug FROM hospitals WHERE id=?', [HOSPITAL_ID]);
  if (!h || h.slug !== HOSPITAL_SLUG) {
    console.error(`[ABORT] hospital 검증 실패:`, h);
    db.close(); process.exit(1);
  }
  try {
    await patchHeader();
    await patchMain();
    await patchFooter();
    console.log('[완료]');
  } catch (e) {
    console.error('[에러]', e.message);
    process.exitCode = 1;
  } finally {
    db.close();
  }
}

main();
