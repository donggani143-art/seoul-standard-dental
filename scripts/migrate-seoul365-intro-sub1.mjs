// 서울365열린치과 — 의료진 소개 페이지 (slug: intro/sub1)
// hospital_id=10 만 대상.
//
// 원본: Q:/365seoul/www/intro/sub1.php + theme/basic/css/{intro,sub}.css
// 콘텐츠: 고성혁 대표원장(구강악안면외과·통합치의학과) / 황준섭 원장(통합치의학과) / 황조연 원장(치과교정과)

import sqlite3 from 'sqlite3';

const HOSPITAL_ID = 10;
const HOSPITAL_SLUG = 'seoul365opendental';
const DB_PATH = process.argv[2] || './wonjudental.db';
const IMG = `/uploads/hospitals/${HOSPITAL_SLUG}`;

const PAGE_CSS = `
@import url('https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/static/pretendard.min.css');
.s365-intro * { box-sizing: border-box; font-family: 'Pretendard', 'NanumSquare', -apple-system, sans-serif; letter-spacing: -0.04em; }
.s365-intro a { color: inherit; text-decoration: none; }
.s365-intro img { max-width: 100%; vertical-align: middle; border: 0; display: block; }
.s365-intro ul, .s365-intro li { list-style: none; padding: 0; margin: 0; }
.s365-intro h1, .s365-intro h2, .s365-intro h3, .s365-intro h4, .s365-intro h5, .s365-intro h6 { margin: 0; padding: 0; font-weight: 400; }
.s365-intro .clear:after { content: ''; display: block; clear: both; }
.s365-intro .blue { color: #00395f !important; }
.s365-intro .bold { font-weight: bold; }
.s365-intro .inbox-container { width: 1320px; max-width: 100%; margin: 0 auto; padding: 0 24px; }

/* 서브 비주얼 */
.s365-sub-visual { position: relative; height: 380px; background: url(${IMG}/sub1/visual.png) no-repeat 50% / cover; color: #fff; display: flex; align-items: center; }
.s365-sub-visual::before { content: ''; position: absolute; inset: 0; background: rgba(0,0,0,0.35); }
.s365-sub-visual .inbox-container { position: relative; z-index: 1; }
.s365-sub-visual .navi { display: flex; align-items: center; gap: 8px; font-size: 14px; opacity: 0.85; margin-bottom: 12px; }
.s365-sub-visual .navi .arrow { display: inline-block; width: 6px; height: 6px; border-top: 1.5px solid #fff; border-right: 1.5px solid #fff; transform: rotate(45deg); }
.s365-sub-visual .navi strong { font-weight: 700; }
.s365-sub-visual h3 { font-size: clamp(32px, 4vw, 48px); font-weight: 900; letter-spacing: -0.02em; }

/* 서브 메뉴 탭 */
.s365-submenu { background: #f9f9f9; border-bottom: 1px solid #e5e5e5; }
.s365-submenu .inbox-container { display: flex; gap: 0; }
.s365-submenu a { flex: 1; text-align: center; padding: 22px 0; font-size: 16px; font-weight: 500; color: #555; border-right: 1px solid #e5e5e5; position: relative; transition: all 0.2s ease; }
.s365-submenu a:first-child { border-left: 1px solid #e5e5e5; }
.s365-submenu a:hover { color: #00395f; }
.s365-submenu a.active { background: #00395f; color: #fff; font-weight: 700; border-color: #00395f; }
@media (max-width: 1024px) {
  .s365-submenu .inbox-container { padding: 0; flex-wrap: wrap; }
  .s365-submenu a { flex: 1 1 33.333%; padding: 14px 8px; font-size: 14px; }
}

/* 타이틀박스 */
.s365-title-section { padding: 90px 0 60px; text-align: center; }
.s365-title-section .deco { display: block; width: 30px; height: 4px; background: #00395f; margin: 0 auto 20px; }
.s365-title-section h5 { font-size: 36px; font-weight: 300; color: #272727; }
.s365-title-section h5 strong { font-weight: 900; color: #00395f; }

/* 의료진 카드 */
.s365-doctor { padding: 60px 0; overflow: hidden; }
.s365-doctor .inbox-container { display: grid; grid-template-columns: 480px 1fr; gap: 48px; align-items: start; }
.s365-doctor.alt .inbox-container { grid-template-columns: 1fr 480px; }
.s365-doctor .photo { position: relative; border-radius: 8px; overflow: hidden; background: #f4f8fb; }
.s365-doctor .photo img { width: 100%; height: 100%; object-fit: cover; aspect-ratio: 480 / 600; }
.s365-doctor.alt .photo { order: 2; }
.s365-doctor .info h6 { color: #272727; font-size: 36px; font-weight: 300; margin-bottom: 22px; line-height: 1.3; }
.s365-doctor .info h6 strong { font-weight: 900; }
.s365-doctor .info h6 .specialty { display: block; color: #00395f; font-weight: 900; font-size: 22px; margin-top: 10px; }
.s365-doctor .info .columns { display: grid; grid-template-columns: 1fr 1fr; gap: 32px; }
.s365-doctor .info p { color: #272727; font-size: 16px; font-weight: 400; line-height: 2em; }
.s365-doctor .info p .highlight { display: block; color: #00395f; margin-top: 16px; padding: 16px 18px; background: #eef4f7; border-radius: 6px; line-height: 1.7em; font-size: 15px; }
.s365-doctor .info p .highlight strong { font-weight: 900; }

@media (max-width: 1024px) {
  .s365-doctor .inbox-container,
  .s365-doctor.alt .inbox-container { grid-template-columns: 1fr; gap: 28px; }
  .s365-doctor.alt .photo { order: 0; }
  .s365-doctor .info h6 { font-size: 28px; }
  .s365-doctor .info .columns { grid-template-columns: 1fr; gap: 0; }
  .s365-doctor .info p { font-size: 15px; line-height: 1.85em; }
}

/* 블루 스트립 (각 의사 사이 시각 구분) */
.s365-blue-strip { background: #00395f; padding: 28px 0; overflow: hidden; }
.s365-blue-strip .roll { display: flex; gap: 24px; animation: s365Roll 30s linear infinite; }
.s365-blue-strip .roll img { height: 80px; opacity: 0.85; }
@keyframes s365Roll { from { transform: translateX(0); } to { transform: translateX(-50%); } }

/* 하단 배너 */
.s365-bottom-banner { padding: 0 0 80px; }
.s365-bottom-banner img { width: 100%; height: auto; }

/* 페이지 전환 애니메이션 (스크롤 시 페이드업) */
.s365-fade { opacity: 0; transform: translateY(28px); transition: opacity 0.7s cubic-bezier(0.22,1,0.36,1), transform 0.7s cubic-bezier(0.22,1,0.36,1); }
.s365-fade.in-view { opacity: 1; transform: translateY(0); }

@media (prefers-reduced-motion: reduce) {
  .s365-fade { opacity: 1 !important; transform: none !important; transition: none !important; }
  .s365-blue-strip .roll { animation: none; }
}
`;

const PAGE_CONTENT = `<div class="s365-intro">
<section class="s365-sub-visual">
  <div class="inbox-container">
    <p class="navi">
      <span>HOME</span>
      <span class="arrow"></span>
      <span>병원소개</span>
      <span class="arrow"></span>
      <strong>의료진 소개</strong>
    </p>
    <h3>의료진 소개</h3>
  </div>
</section>

<nav class="s365-submenu" aria-label="병원소개 하위 메뉴">
  <div class="inbox-container">
    <a href="/intro/sub1" class="active">의료진 소개</a>
    <a href="/intro/sub2">진료시스템</a>
    <a href="/intro/sub3">진료시간 안내</a>
    <a href="/intro/sub4">진료공간 둘러보기</a>
    <a href="/intro/sub5">오시는길</a>
  </div>
</nav>

<section class="s365-title-section">
  <span class="deco" aria-hidden="true"></span>
  <h5><strong>의료진</strong> 소개</h5>
</section>

<!-- 1. 고성혁 대표원장 -->
<article class="s365-doctor" id="doctor1">
  <div class="inbox-container">
    <div class="photo">
      <img src="${IMG}/sub1/s2_dr1.png" alt="고성혁 대표원장" loading="lazy"/>
    </div>
    <div class="info">
      <h6>
        <strong>고성혁</strong> 대표원장
        <span class="specialty">구강악안면외과 · 통합치의학과</span>
      </h6>
      <div class="columns">
        <p>
          - 보건복지부 인증 구강악안면외과 전문의 (1326호)<br/>
          - 보건복지부 인증 통합치의학과 전문의 (2755호)<br/>
          - 대한악안면성형재건외과학회 인증 구강악안면외과 인정의<br/><br/>

          - 서울대학교 졸업<br/>
          - 서울대학교 치의학대학원 임플란트 연수과정 수료<br/>
          - 치의학 석사·박사 수료<br/>
          - 대한구강악안면외과학회 정회원<br/>
          - 대한악안면성형재건외과학회 정회원<br/>
          - 대한구강악안면임플란트학회 정회원<br/>
          - 대한치과마취학회 정회원<br/>
          - 대한통합치과학회 정회원<br/>
          - 대한심미치과학회 정회원<br/>
          - 대한턱관절교합학회 정회원<br/>
          - 전) 이엘치과 원장<br/>
          - 전) 틀플란트치과 원장<br/>
          - 전) 다비드치과 원장
        </p>
        <p>
          - 제 60차 대한구강악안면외과학회 종합학술대회 우수상 수상<br/>
          - 제 24차 EACMFS (유럽두개악안면외과학회) 우수상 수상<br/>
          - 2018 AOCMF Management of Facial Trauma 과정 수료<br/>
          - 2018 AOCMF Advances in Orthognathic Surgery 과정 수료<br/>
          - 대한턱관절협회 턱관절 질환 진단 치료 교육과정 수료<br/>
          - 대한구순구개열학회 전문치료과정 수료<br/>
          - 대한악안면성형재건외과학회 보톡스 필러 연수회 수료<br/>
          - 오스템 임플란트 연구자문위원<br/>
          - 포인트UV 임플란트 연구자문위원<br/>
          - 스트라우만 임플란트 연구자문위원<br/>

          <span class="highlight">
            <strong>매일경제 TV '건강스페셜'</strong><br/>
            서울365열린치과 대표원장 고성혁 원장님 TV출연<br/>
            '전악임플란트' 주제로 강연
          </span>
        </p>
      </div>
    </div>
  </div>
</article>

<div class="s365-blue-strip">
  <div class="roll">
    <img src="${IMG}/sub1/s2_dr1_ce.png" alt=""/>
    <img src="${IMG}/sub1/s2_dr1_ce.png" alt=""/>
  </div>
</div>

<!-- 2. 황준섭 원장 -->
<article class="s365-doctor alt" id="doctor2">
  <div class="inbox-container">
    <div class="photo">
      <img src="${IMG}/sub1/s2_dr2.png" alt="황준섭 원장" loading="lazy"/>
    </div>
    <div class="info">
      <h6>
        <strong>황준섭</strong> 원장
        <span class="specialty">통합치의학과</span>
      </h6>
      <p>
        - 보건복지부 인증 통합치의학과 전문의 (4675호)<br/>
        - 심미치과학회 인정의 펠로우<br/>
        - MTA 교정 인증의<br/><br/>

        - 치의학 석사<br/>
        - 캐나다 맥길 대학교 치과대학 externship<br/>
        - 한국성인치과교정연구회 정회원<br/>
        - 대한심미치과학회 정회원<br/>
        - 대한통합치과학회 정회원<br/>
        - 제55회 대한치과교정학회학술대회 포스터 우수 발표<br/>
        - 성인교정임상연수회 수료<br/>
        - 오스템 임플란트 Master course 수료<br/>
        - 현) 강남 SF치과의원 원장<br/>

        <span class="highlight">
          <strong>OBS경인TV '닥터 OBS'</strong><br/>
          황준섭 원장님 TV 출연<br/>
          '앞니 치료, 제대로 알고 받아야' 주제로 강연
        </span>
      </p>
    </div>
  </div>
</article>

<div class="s365-blue-strip">
  <div class="roll">
    <img src="${IMG}/sub1/s2_dr2_ce.png" alt=""/>
    <img src="${IMG}/sub1/s2_dr2_ce.png" alt=""/>
  </div>
</div>

<!-- 3. 황조연 원장 -->
<article class="s365-doctor" id="doctor3">
  <div class="inbox-container">
    <div class="photo">
      <img src="${IMG}/sub1/s2_dr3.png" alt="황조연 원장" loading="lazy"/>
    </div>
    <div class="info">
      <h6>
        <strong>황조연</strong> 원장
        <span class="specialty">치과교정과</span>
      </h6>
      <p>
        - 보건복지부 인증 치과교정과 전문의 (1594호)<br/>
        - 치의학 박사<br/>
        - 대한치과교정학회 인정의<br/>
        - 인비절라인 인증의<br/>
        - 세계교정의사연맹(WFO) fellow member<br/>
        - 미국치과교정학회(AAO) 정회원<br/>
        - 대한치과교정학회 정회원<br/>
        - 대한심미치과학회 정회원<br/><br/>

        - 대한치과의사협회장 표창패 (2019)<br/>
        - 대한치과교정학회 우수 포스터 증례발표<br/>
        &nbsp;&nbsp;&nbsp;(제55회 대한치과교정학회 정기학술대회)<br/>
        - 대한치과교정학회 표창패<br/>
        &nbsp;&nbsp;&nbsp;(제13회 아시아-태평양교정학회 논문발표)
      </p>
    </div>
  </div>
</article>

<div class="s365-blue-strip">
  <div class="roll">
    <img src="${IMG}/sub1/s2_dr3_ce.png" alt=""/>
    <img src="${IMG}/sub1/s2_dr3_ce.png" alt=""/>
  </div>
</div>

<!-- 하단 배너 (3인 협진) -->
<section class="s365-bottom-banner">
  <div class="inbox-container">
    <img src="${IMG}/intro_doctors_banner.png" alt="전문의 3인협진" loading="lazy"/>
  </div>
</section>
</div>`;

const PAGE_JS = `
(function(){
  if (!('IntersectionObserver' in window)) return;
  var io = new IntersectionObserver(function(entries){
    entries.forEach(function(e){ if (e.isIntersecting){ e.target.classList.add('in-view'); io.unobserve(e.target); } });
  }, { threshold: 0.15, rootMargin: '0px 0px -80px 0px' });
  document.querySelectorAll('.s365-doctor, .s365-title-section').forEach(function(el){
    el.classList.add('s365-fade');
    io.observe(el);
  });
})();
`;

// ── DB ────────────────────────────────────────────────────────────────────────
const db = new sqlite3.Database(DB_PATH);
function run(sql, params = []) { return new Promise((res, rej) => db.run(sql, params, function(err){ if(err) rej(err); else res(this); })); }
function get(sql, params = []) { return new Promise((res, rej) => db.get(sql, params, (err, row) => { if(err) rej(err); else res(row); })); }

async function upsertPage(slug, title, content, css, js, pageType, sortOrder) {
  const existing = await get('SELECT id FROM pages WHERE slug = ? AND hospital_id = ?', [slug, HOSPITAL_ID]);
  if (existing) {
    await run(
      `UPDATE pages SET title=?, content=?, custom_css=?, custom_js=?, page_type=?, sort_order=?, is_published=1, updated_at=CURRENT_TIMESTAMP
       WHERE id=? AND hospital_id=?`,
      [title, content, css, js || '', pageType, sortOrder, existing.id, HOSPITAL_ID]
    );
    console.log(`  [UPDATE] ${slug} (id=${existing.id})`);
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
  console.log('[seoul365 intro/sub1 — 의료진 소개]');
  const h = await get('SELECT id, slug FROM hospitals WHERE id=?', [HOSPITAL_ID]);
  if (!h || h.slug !== HOSPITAL_SLUG) { console.error('[ABORT] hospital 검증 실패:', h); db.close(); process.exit(1); }
  try {
    await upsertPage('intro/sub1', '의료진 소개', PAGE_CONTENT, PAGE_CSS, PAGE_JS, 'builtin', 100);
    console.log('[완료]');
  } catch (e) { console.error('[에러]', e.message); process.exitCode = 1; }
  finally { db.close(); }
}
main();
