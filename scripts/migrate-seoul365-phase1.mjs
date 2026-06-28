// 서울365열린치과의원 Phase 1 — 헤더 + 푸터 + 메인 페이지
// hospital_id=10 (seoul365opendental) 만 대상. 다른 병원 절대 건드리지 않음.
//
// 동작: pages 테이블에서 hospital_id=10 의 _header / _footer / main 행을 UPSERT.
// 그 외 행은 절대 수정 안 함.
//
// 원본: Q:/365seoul/www/theme/basic/{head,tail,index}.php + css/{default,main}.css
// 자산 경로: /uploads/hospitals/seoul365opendental/<file>.png

import sqlite3 from 'sqlite3';

const HOSPITAL_ID = 10;
const HOSPITAL_SLUG = 'seoul365opendental';
const DB_PATH = process.argv[2] || './wonjudental.db';

const IMG = `/uploads/hospitals/${HOSPITAL_SLUG}`;

// ── 공통 디자인 토큰 (default.css 발췌 + 정제) ─────────────────────────────────
const COMMON_RESET = `
@import url('https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/static/pretendard.min.css');
.s365-host * { box-sizing: border-box; font-family: 'Pretendard', 'NanumSquare', -apple-system, sans-serif; letter-spacing: -0.04em; }
.s365-host a { color: inherit; text-decoration: none; }
.s365-host img { max-width: 100%; vertical-align: middle; border: 0; }
.s365-host ul, .s365-host li { list-style: none; padding: 0; margin: 0; }
.s365-host h1, .s365-host h2, .s365-host h3, .s365-host h4, .s365-host h5, .s365-host h6 { margin: 0; padding: 0; font-weight: 400; }
.s365-host .clear:after { content: ''; display: block; clear: both; }
.s365-host .sound { position: absolute; width: 0; height: 0; overflow: hidden; text-indent: -9999px; }
.s365-host .blue { color: #00395f !important; }
.s365-host .bold { font-weight: bold; }
.s365-host .weight900 { font-weight: 900; }
.s365-inbox { width: 1320px; margin: 0 auto; max-width: 100%; padding: 0 24px; }
@media (max-width: 1340px) { .s365-inbox { width: 100%; } }
`;

// ── _header ───────────────────────────────────────────────────────────────────
const HEADER_CSS = `
${COMMON_RESET}
.s365-header { position: sticky; top: 0; left: 0; width: 100%; z-index: 100; background: rgba(0,0,0,0.6); transition: background 0.25s ease; }
.s365-header:hover { background: rgba(0,0,0,0.85); }
.s365-header .s365-inbox { display: flex; align-items: center; padding: 0 24px; }
.s365-header h1 { width: 230px; padding: 18px 0; flex-shrink: 0; }
.s365-header h1 a { display: block; height: 37px; background: url(${IMG}/logo.png) no-repeat 0 50% / contain; }
.s365-header .s365-gnb { flex: 1; display: flex; justify-content: flex-end; }
.s365-header .s365-gnb > ul { display: flex; }
.s365-header .s365-gnb > ul > li { position: relative; text-align: center; padding: 28px 22px 22px; }
.s365-header .s365-gnb > ul > li > a { display: inline-block; color: #fff; font-weight: 800; font-size: 17px; }
.s365-header .s365-gnb > ul > li:hover { background-color: #00395f; }
.s365-header .s365-sub-menu { position: absolute; top: 100%; left: 50%; transform: translateX(-50%); display: none; padding: 14px 18px; background: #00395f; min-width: 180px; }
.s365-header .s365-gnb > ul > li:hover .s365-sub-menu { display: block; }
.s365-header .s365-sub-menu a { display: block; color: #c4c4c4; font-size: 14px; padding: 8px 0; transition: color 0.2s ease; white-space: nowrap; }
.s365-header .s365-sub-menu a:hover { color: #fff; }

.s365-mobile-toggle { display: none; background: transparent; border: 0; color: #fff; font-size: 24px; padding: 8px 12px; cursor: pointer; }

.s365-quick { position: fixed; top: 50%; right: 0; width: 80px; margin-top: -202px; z-index: 99; }
.s365-quick a { display: block; margin-bottom: 1px; }
.s365-quick a img { width: 100%; display: block; }
@media (max-width: 1024px) {
  .s365-header .s365-inbox { padding: 0 16px; }
  .s365-header h1 { width: 180px; padding: 14px 0; }
  .s365-mobile-toggle { display: inline-flex; }
  .s365-header .s365-gnb { display: none; position: absolute; top: 100%; left: 0; right: 0; background: #00395f; }
  .s365-header .s365-gnb.is-open { display: block; }
  .s365-header .s365-gnb > ul { flex-direction: column; }
  .s365-header .s365-gnb > ul > li { padding: 0; border-bottom: 1px solid rgba(255,255,255,0.12); }
  .s365-header .s365-gnb > ul > li > a { display: block; padding: 16px 24px; text-align: left; }
  .s365-header .s365-sub-menu { position: static; transform: none; padding: 0 24px 14px; min-width: 0; background: rgba(0,0,0,0.2); display: block; }
  .s365-header .s365-sub-menu a { padding: 10px 0; text-align: left; }
  .s365-quick { display: none; }
}
`;

const HEADER_CONTENT = `<div class="s365-host">
<header class="s365-header" id="s365Header">
  <div class="s365-inbox">
    <h1><a href="/" aria-label="서울365열린치과의원 홈"><span class="sound">서울365열린치과의원</span></a></h1>
    <button type="button" class="s365-mobile-toggle" aria-label="메뉴 열기" onclick="document.getElementById('s365Gnb').classList.toggle('is-open')">☰</button>
    <nav class="s365-gnb" id="s365Gnb">
      <ul>
        <li><a href="/intro/sub1">병원소개</a>
          <div class="s365-sub-menu">
            <a href="/intro/sub1">의료진 소개</a>
            <a href="/intro/sub2">진료시스템</a>
            <a href="/intro/sub3">진료시간 안내</a>
            <a href="/intro/sub4">진료공간 둘러보기</a>
            <a href="/intro/sub5">오시는길</a>
          </div>
        </li>
        <li><a href="/clinic/sub1">일반진료</a>
          <div class="s365-sub-menu">
            <a href="/clinic/sub1">보철·보존</a>
            <a href="/clinic/sub2">고난이도 사랑니</a>
            <a href="/clinic/sub3">라미네이트</a>
            <a href="/clinic/chinjoint">턱관절클리닉</a>
          </div>
        </li>
        <li><a href="/implant/sub1">임플란트</a>
          <div class="s365-sub-menu">
            <a href="/implant/sub1">네비게이션 임플란트</a>
            <a href="/implant/sub2">고난이도 임플란트</a>
            <a href="/implant/sub3">보험임플란트</a>
            <a href="/implant/sub4">All-on-4</a>
          </div>
        </li>
        <li><a href="/orthodontic/sub1">교정</a>
          <div class="s365-sub-menu">
            <a href="/orthodontic/sub1">소아교정</a>
            <a href="/orthodontic/sub2">청소년·성인교정</a>
            <a href="/orthodontic/sub3">부분교정</a>
          </div>
        </li>
        <li><a href="/kids/sub1">어린이치과</a>
          <div class="s365-sub-menu">
            <a href="/kids/sub1">충치 증상</a>
            <a href="/kids/sub2">진정치료</a>
            <a href="/kids/sub3">소아 치료</a>
            <a href="/kids/sub4">영유아 구강검진</a>
          </div>
        </li>
        <li><a href="/sleep/sub1">수면치과</a>
          <div class="s365-sub-menu">
            <a href="/sleep/sub1">수면임플란트</a>
            <a href="/sleep/sub2">수면통증클리닉</a>
          </div>
        </li>
      </ul>
    </nav>
  </div>
</header>
<aside class="s365-quick" aria-label="빠른 메뉴">
  <a href="/intro/sub2"><img src="${IMG}/quick1.png" alt="서울365열린치과의원 진료시스템"/></a>
  <a href="https://booking.naver.com/booking/13/bizes/607842?area=pll" target="_blank" rel="noreferrer"><img src="${IMG}/quick2.png" alt="네이버예약"/></a>
  <a href="https://blog.naver.com/seoul365opendental" target="_blank" rel="noreferrer"><img src="${IMG}/quick3.png" alt="블로그"/></a>
  <a href="https://www.instagram.com/seoul_365dental/" target="_blank" rel="noreferrer"><img src="${IMG}/quick4.png" alt="인스타그램"/></a>
  <a href="http://pf.kakao.com/_yxnNvb" target="_blank" rel="noreferrer"><img src="${IMG}/quick5.png" alt="카카오톡 채널"/></a>
</aside>
</div>`;

// ── _footer ───────────────────────────────────────────────────────────────────
const FOOTER_CSS = `
${COMMON_RESET}
.s365-footer { background: #fff; color: #272727; }
.s365-con4 { padding: 100px 0; background: #f9f9f9; }
.s365-con4 .s365-inbox { display: flex; flex-wrap: wrap; gap: 0; }
.s365-con4 > .s365-inbox > div { width: 33.333%; padding: 0 24px; }
.s365-con4 h6 { font-size: 22px; font-weight: 900; margin-bottom: 18px; text-align: center; line-height: 1.3; }
.s365-con4-1 p { color: #272727; font-size: 16px; line-height: 1.6em; text-align: center; }
.s365-con4-1 p strong { display: block; color: #00395f; font-weight: 900; font-size: 36px; margin: 12px 0 18px; letter-spacing: -0.02em; }
.s365-con4-1 a { display: block; width: 270px; max-width: 100%; height: 50px; background: url(${IMG}/n_reservation.png) no-repeat 50% / contain; margin: 0 auto; }
.s365-con4-2 { border-left: 1px solid #e5e5e5; border-right: 1px solid #e5e5e5; }
.s365-con4-2 table { width: 333px; max-width: 100%; margin: 0 auto; border-spacing: 0 7px; border-collapse: separate; }
.s365-con4-2 th { color: #fff; font-size: 16px; height: 32px; border-radius: 16px; background: #00395f; line-height: 32px; text-align: center; font-weight: 600; padding: 0 12px; white-space: nowrap; }
.s365-con4-2 th strong { font-size: 12px; font-weight: 700; }
.s365-con4-2 td { padding-left: 14px; color: #272727; font-size: 16px; height: 32px; line-height: 32px; font-weight: 400; }
.s365-con4-2 td font { font-size: 12px; color: #666; margin-left: 8px; }
.s365-con4-2 tr.late th { color: #fff17f; }
.s365-con4-2 tr.late td { color: #00395f; font-weight: 700; }
.s365-con4-2 p { color: #00395f; font-size: 15px; font-weight: 700; text-align: center; margin-top: 8px; }
.s365-con4-3 { text-align: center; }
.s365-con4-3 a { display: inline-block; margin: 0 6px; }
.s365-finfo { padding: 50px 0 65px; background: #1e2931; }
.s365-finfo .s365-inbox { position: relative; }
.s365-finfo h4 { position: absolute; bottom: 0; right: 24px; width: 192px; height: 60px; background: url(${IMG}/f_logo.png) no-repeat 50% / contain; }
.s365-finfo .s365-link-box { color: #fff; font-size: 15px; margin-bottom: 18px; letter-spacing: normal; }
.s365-finfo .s365-link-box strong { font-weight: 900; }
.s365-finfo p { position: relative; color: #adbabc; font-size: 13px; line-height: 1.8em; letter-spacing: normal; }
.s365-finfo p::after { position: absolute; top: 50px; left: 0; width: 50%; height: 1px; background: #4c5d5f; content: ''; }
.s365-finfo #s365TopBtn { position: fixed; right: 20px; bottom: 20px; width: 48px; height: 48px; border: 0; padding: 0; background: rgba(0,57,95,0.85) url(${IMG}/top.png) no-repeat 50% / 24px; border-radius: 50%; cursor: pointer; z-index: 50; opacity: 0; pointer-events: none; transition: opacity 0.2s ease; }
.s365-finfo #s365TopBtn.is-visible { opacity: 1; pointer-events: auto; }
@media (max-width: 1024px) {
  .s365-con4 { padding: 64px 0; }
  .s365-con4 .s365-inbox { gap: 32px 0; }
  .s365-con4 > .s365-inbox > div { width: 100%; padding: 0 16px; }
  .s365-con4-2 { border: 0; }
  .s365-finfo h4 { position: static; width: 160px; height: 50px; margin-bottom: 24px; }
  .s365-finfo p::after { display: none; }
}
`;

const FOOTER_CONTENT = `<div class="s365-host">
<footer class="s365-footer">
  <div class="s365-con4">
    <div class="s365-inbox">
      <div class="s365-con4-1">
        <h6>진료문의·예약</h6>
        <p>
          진료예약 및 진료관련 상담은<br/>
          대표번호로 언제든지 문의주세요!
          <strong>031-594-2080</strong>
        </p>
        <a href="https://booking.naver.com/booking/13/bizes/607842?area=pll" target="_blank" rel="noreferrer" aria-label="네이버예약 바로가기"><span class="sound">네이버예약 바로가기</span></a>
      </div>
      <div class="s365-con4-2">
        <h6>진료시간 안내</h6>
        <table>
          <colgroup><col width="128"><col width="*"></colgroup>
          <tbody>
            <tr><th>평일 진료</th><td>AM 9:30 - PM 6:30</td></tr>
            <tr class="late"><th>목요일 <strong>(야간)</strong></th><td>PM 2:00 - PM 8:30</td></tr>
            <tr><th>토·일요일</th><td>AM 9:30 - PM 2:00 <font>점심시간 없음</font></td></tr>
            <tr><th>점심시간</th><td>PM 1:00 - PM 2:00</td></tr>
          </tbody>
        </table>
        <p>* 법정 공휴일 휴진</p>
      </div>
      <div class="s365-con4-3">
        <h6>서울365열린치과 SNS</h6>
        <a href="https://blog.naver.com/seoul365opendental" target="_blank" rel="noreferrer"><img src="${IMG}/icon_b.png" alt="서울365열린치과 블로그"/></a>
        <a href="http://pf.kakao.com/_yxnNvb" target="_blank" rel="noreferrer"><img src="${IMG}/icon_y.png" alt="서울365열린치과 카카오채널"/></a>
        <a href="https://www.instagram.com/seoul_365dental/" target="_blank" rel="noreferrer"><img src="${IMG}/icon_i.png" alt="서울365열린치과 인스타그램"/></a>
      </div>
    </div>
  </div>
  <div class="s365-finfo">
    <div class="s365-inbox">
      <h4><span class="sound">서울365열린치과</span></h4>
      <div class="s365-link-box"><strong>대표문의 : 031-594-2080</strong></div>
      <p>
        상호 : 서울365열린치과의원 &nbsp;·&nbsp; 성명 : 고성혁 &nbsp;·&nbsp; 사업자등록번호 : 273-02-02503<br/>
        주소 : 경기도 남양주시 화도읍 비룡로 112, 명화B/D 주1동 1층 &nbsp;·&nbsp; TEL: 031-594-2080<br/><br/>
        COPYRIGHT ⓒ SEOUL 365 OPEN DENTAL CLINIC ALL RIGHTS RESERVED.
      </p>
      <button type="button" id="s365TopBtn" aria-label="페이지 상단으로"></button>
    </div>
  </div>
</footer>
</div>
<script>
(function(){
  var btn = document.getElementById('s365TopBtn');
  if (!btn) return;
  function update(){ if (window.scrollY > 400) btn.classList.add('is-visible'); else btn.classList.remove('is-visible'); }
  window.addEventListener('scroll', update, { passive: true });
  btn.addEventListener('click', function(){ window.scrollTo({ top: 0, behavior: 'smooth' }); });
  update();
})();
</script>`;

// ── main 페이지 ───────────────────────────────────────────────────────────────
const MAIN_CSS = `
${COMMON_RESET}
.s365-host { background: #fff; color: #272727; line-height: 1.4; }
.s365-host .s365-titlebox { text-align: center; }
.s365-host .s365-titlebox h5 { font-size: 36px; font-weight: 300; color: #272727; line-height: 1.4; }
.s365-host .s365-titlebox h5.tit2 { text-align: left; }
.s365-host .s365-titlebox h5 strong { font-weight: 900; color: #00395f; }
.s365-host .s365-titlebox p { font-size: 17px; color: #555; margin-top: 16px; line-height: 1.6em; }

/* ── 메인 비주얼 ── */
.s365-visual { position: relative; height: 720px; overflow: hidden; }
.s365-visual .swiper-wrapper { display: flex; }
.s365-visual .swiper-slide { flex: 0 0 100%; height: 720px; position: relative; background-position: 50% 50%; background-size: cover; background-repeat: no-repeat; }
.s365-visual .v1 { background-image: url(${IMG}/visual1.png); }
.s365-visual .v2 { background-image: url(${IMG}/visual2.png); }
.s365-visual .v3 { background-image: url(${IMG}/visual3.png); }
.s365-visual .s365-inbox { display: flex; align-items: center; height: 100%; }
.s365-visual .s365-write-box { color: #fff; padding: 0 24px; max-width: 720px; }
.s365-visual .s365-write-box strong { display: inline-block; position: relative; z-index: 1; font-size: clamp(36px, 5vw, 60px); font-weight: 900; line-height: 1.2; padding: 8px 16px; margin-bottom: 16px; }
.s365-visual .s365-write-box strong::before { content: ''; position: absolute; inset: 0; background-color: #00395f; z-index: -1; opacity: 0.85; }
.s365-visual .s365-write-box span { display: block; font-size: clamp(20px, 2.4vw, 28px); font-weight: 700; }
.s365-visual .s365-write-box p { color: #fff; font-size: clamp(15px, 1.4vw, 18px); line-height: 1.7em; margin-top: 24px; opacity: 0.95; }
.s365-visual .v3 .s365-inbox { justify-content: center; text-align: center; }
.s365-visual .v3 .s365-write-box { text-align: center; }
.s365-visual .s365-scroll { position: absolute; bottom: 24px; left: 50%; transform: translateX(-50%); color: #fff; font-size: 13px; font-weight: 700; letter-spacing: 0.2em; text-align: center; z-index: 5; }
.s365-visual .s365-scroll span { display: block; width: 2px; height: 40px; background: #fff; margin: 0 auto 8px; opacity: 0.8; animation: s365ScrollPulse 1.6s ease-in-out infinite; }
@keyframes s365ScrollPulse { 0%,100% { transform: scaleY(1); transform-origin: top; opacity: 1; } 50% { transform: scaleY(0.4); opacity: 0.4; } }

/* ── 의료진 슬라이드 ── */
.s365-con1 { position: relative; }
.s365-con1 .swiper-slide { position: relative; height: 580px; background-position: 50% 50%; background-size: cover; background-repeat: no-repeat; }
.s365-con1 .s365-con1_1 { background-image: url(${IMG}/con1_1.png); }
.s365-con1 .s365-con1_2 { background-image: url(${IMG}/con1_2.png); }
.s365-con1 .s365-con1_3 { background-image: url(${IMG}/con1_3.png); }
.s365-con1 .s365-profile { position: absolute; top: 50%; transform: translateY(-50%); padding: 0 24px; max-width: 600px; }
.s365-con1 .s365-con1_1 .s365-profile { right: 50%; margin-right: -560px; }
.s365-con1 .s365-con1_2 .s365-profile { left: 50%; margin-left: -560px; }
.s365-con1 .s365-con1_3 .s365-profile { right: 50%; margin-right: -560px; }
.s365-con1 .s365-profile h3 { color: #272727; font-size: 28px; font-weight: 300; margin-bottom: 24px; line-height: 1.3; }
.s365-con1 .s365-profile h3 strong { font-size: 38px; font-weight: 900; }
.s365-con1 .s365-profile p { color: #272727; font-size: 18px; font-weight: 300; line-height: 2em; }
.s365-con1 .s365-profile a { display: inline-block; min-width: 160px; padding: 0 20px; height: 44px; line-height: 44px; color: #fff; text-align: center; font-size: 16px; background-color: #00395f; margin-top: 30px; border-radius: 22px; transition: background-color 0.2s ease; }
.s365-con1 .s365-profile a:hover { background-color: #002948; }
.s365-con1 .swiper-pagination { position: absolute; bottom: 24px; left: 0; right: 0; text-align: center; z-index: 5; }
.s365-con1 .swiper-pagination span { display: inline-block; width: 36px; height: 36px; border: 1px solid #fff; color: #fff; text-align: center; border-radius: 50%; line-height: 36px; font-size: 15px; margin: 0 5px; cursor: pointer; transition: all 0.2s ease; }
.s365-con1 .swiper-pagination span.swiper-pagination-bullet-active { background-color: #00395f; border-color: #00395f; }
@media (max-width: 1199px) {
  .s365-con1 .s365-con1_1 .s365-profile, .s365-con1 .s365-con1_2 .s365-profile, .s365-con1 .s365-con1_3 .s365-profile { right: auto; left: 0; margin: 0; padding: 0 24px; max-width: 100%; }
  .s365-con1 .swiper-slide { background-position: 70% 50%; }
}

/* ── 특별함 ── */
.s365-con2 { padding: 120px 0; overflow: hidden; }
.s365-con2 .s365-inbox { display: flex; flex-wrap: wrap; align-items: flex-start; gap: 40px; }
.s365-con2 .s365-titlebox { width: 380px; flex-shrink: 0; }
.s365-con2 .s365-titlebox h5 { text-align: left; }
.s365-con2 .s365-titlebox p { font-size: 17px; color: #555; margin-top: 16px; line-height: 1.7em; }
.s365-con2 .s365-slide-btn { margin-top: 36px; display: flex; gap: 10px; }
.s365-con2 .s365-slide-btn span { display: inline-block; width: 50px; height: 50px; border-radius: 50%; cursor: pointer; transition: opacity 0.2s; background-color: #00395f; }
.s365-con2 .s365-slide-btn .l_bt { background-image: url(${IMG}/bt_left.png); background-repeat: no-repeat; background-position: 50%; }
.s365-con2 .s365-slide-btn .r_bt { background-image: url(${IMG}/bt_right.png); background-repeat: no-repeat; background-position: 50%; }
.s365-con2 .s365-slide-btn span:hover { opacity: 0.8; }
.s365-con2 .s365-list { flex: 1; min-width: 0; overflow: hidden; }
.s365-con2 .s365-list .swiper-slide { width: 380px !important; padding-right: 24px; }
.s365-con2 .s365-list img { display: block; width: 100%; margin-bottom: 14px; }
.s365-con2 .s365-list strong { display: block; font-size: 20px; font-weight: 700; color: #272727; line-height: 1.5em; }
@media (max-width: 1024px) {
  .s365-con2 .s365-inbox { flex-direction: column; }
  .s365-con2 .s365-titlebox { width: 100%; }
  .s365-con2 .s365-list .swiper-slide { width: 280px !important; }
}

/* ── 언론에서 주목 ── */
.s365-con3 { padding: 120px 0; background: #f4f8fb; overflow: hidden; }
.s365-con3 .s365-titlebox { text-align: center; margin-bottom: 48px; }
.s365-con3 .s365-titlebox h5 { font-size: 32px; }
.s365-con3 .s365-titlebox h5 strong { display: block; font-size: 28px; font-weight: 700; color: #555; margin-bottom: 8px; }
.s365-con3 .s365-list { overflow: hidden; }
.s365-con3 .s365-list ul { display: flex; gap: 24px; justify-content: center; flex-wrap: wrap; }
.s365-con3 .s365-list li { width: 420px; max-width: 100%; }
.s365-con3 .s365-list img { display: block; width: 100%; margin-bottom: 14px; }
.s365-con3 .s365-list strong { display: block; font-size: 18px; font-weight: 700; color: #272727; line-height: 1.6em; }

@media (max-width: 1024px) { .s365-con2, .s365-con3 { padding: 64px 0; } }
`;

const MAIN_CONTENT = `<div class="s365-host">
<section class="s365-visual">
  <div class="swiper-container" id="s365Visual">
    <div class="swiper-wrapper">
      <div class="swiper-slide v1">
        <div class="s365-inbox">
          <div class="s365-write-box">
            <strong><span>믿을 수 있는 전문의</span></strong>
            <p>
              <span><b>구강악안면외과, 치과교정과, 통합치의학과 전문의 3인 원장</b>의<br/>
              각 과별 전문 진료 및 협진 진료를 통해 원스탑 치료가 가능하며<br/>
              수준 높은 치료 결과를 약속합니다.</span>
            </p>
          </div>
        </div>
      </div>
      <div class="swiper-slide v2">
        <div class="s365-inbox">
          <div class="s365-write-box">
            <strong><span>안전한 수면치과치료</span></strong>
            <p>
              <span>치과 공포증 환자 분들을 위한 수면 치과 치료 시스템이 구비되어<br/>
              안전하고 편안하게 치료를 받으실 수 있습니다.</span>
            </p>
          </div>
        </div>
      </div>
      <div class="swiper-slide v3">
        <div class="s365-inbox">
          <div class="s365-write-box">
            <strong><span>365일 함께하는 치과</span></strong>
            <p>
              <span>환자분들의 소중한 시간을 위해 365일 진료하는 서울365열린치과는<br/>
              이웃 사촌 같은 따뜻한 치과가 되겠습니다.</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  </div>
  <div class="s365-scroll" aria-hidden="true"><span></span>SCROLL</div>
</section>

<section class="s365-con1">
  <div class="swiper-container" id="s365Con1">
    <div class="swiper-wrapper">
      <div class="swiper-slide s365-con1_1">
        <div class="s365-profile">
          <h3><strong>고성혁</strong> 대표원장</h3>
          <p>
            · 보건복지부 인증 구강악안면외과 전문의 (1326호)<br/>
            · 보건복지부 인증 통합치의학과 전문의 (2755호)<br/>
            · 대한악안면성형재건외과학회 인증 구강악안면외과 인정의
          </p>
          <a href="/intro/sub1#doctor1">더알아보기 +</a>
        </div>
      </div>
      <div class="swiper-slide s365-con1_2">
        <div class="s365-profile">
          <h3><strong>황준섭</strong> 원장</h3>
          <p>
            · 보건복지부 인증 통합치의학과 전문의 (4675호)<br/>
            · 심미치과학회 인정의 펠로우<br/>
            · MTA 교정 인증의
          </p>
          <a href="/intro/sub1#doctor2">더알아보기 +</a>
        </div>
      </div>
      <div class="swiper-slide s365-con1_3">
        <div class="s365-profile">
          <h3><strong>황조연</strong> 원장</h3>
          <p>
            · 보건복지부 인증 치과교정과 전문의 (1594호)<br/>
            · 치의학 박사<br/>
            · 대한치과교정학회 인정의 / 인비절라인 인증의
          </p>
          <a href="/intro/sub1#doctor3">더알아보기 +</a>
        </div>
      </div>
    </div>
    <div class="swiper-pagination"></div>
  </div>
</section>

<section class="s365-con2">
  <div class="s365-inbox">
    <div class="s365-titlebox">
      <h5 class="tit2">서울365열린치과의 <strong>특별함</strong></h5>
      <p>전문 진료 및 협진 진료를 통해<br/>원스탑 치료가 가능하며<br/>수준 높은 치료 결과를 약속합니다.</p>
      <div class="s365-slide-btn">
        <span class="l_bt" role="button" aria-label="이전"></span>
        <span class="r_bt" role="button" aria-label="다음"></span>
      </div>
    </div>
    <div class="s365-list">
      <div class="swiper-container" id="s365Con2">
        <div class="swiper-wrapper">
          <div class="swiper-slide">
            <img src="${IMG}/con2_1.png" alt="전문의 책임 진료"/>
            <strong>믿을 수 있는<br/>전문의 원장이 책임 진료 합니다.</strong>
          </div>
          <div class="swiper-slide">
            <img src="${IMG}/con2_2.png" alt="수면마취치료클리닉"/>
            <strong>치과 공포증 환자분들을 위한<br/>수면마취치료클리닉을 운영합니다.</strong>
          </div>
          <div class="swiper-slide">
            <img src="${IMG}/con2_3.png" alt="첨단 디지털 장비"/>
            <strong>서울365열린치과는 첨단 디지털 장비를 통해<br/>좀 더 정확하고 안전한 치료를 추구합니다</strong>
          </div>
          <div class="swiper-slide">
            <img src="${IMG}/con2_4.png" alt="오래쓰는 임플란트, 예뻐지는 치아교정"/>
            <strong>오래쓰는 임플란트 · 예뻐지는 치아교정은<br/>서울365열린치과입니다</strong>
          </div>
        </div>
      </div>
    </div>
  </div>
</section>

<section class="s365-con3">
  <div class="s365-inbox">
    <div class="s365-titlebox">
      <h5><strong>언론에서 주목하는</strong>서울365열린치과의원</h5>
    </div>
    <div class="s365-list">
      <ul>
        <li>
          <img src="${IMG}/con3_1.png" alt="OBS 경인TV 황준섭 원장"/>
          <strong>[OBS 경인TV]<br/>황준섭 원장님 닥터OBS 출연</strong>
        </li>
        <li>
          <img src="${IMG}/con3_2.png" alt="채널A 고성혁 대표원장"/>
          <strong>[채널A]<br/>고성혁 대표원장님 건강스페셜 출연</strong>
        </li>
      </ul>
    </div>
  </div>
</section>
</div>

<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/swiper@8/swiper-bundle.min.css">`;

const MAIN_JS = `
(function(){
  function loadSwiper(cb){
    if (window.Swiper) return cb();
    var s = document.createElement('script');
    s.src = 'https://cdn.jsdelivr.net/npm/swiper@8/swiper-bundle.min.js';
    s.onload = cb;
    document.body.appendChild(s);
  }
  function init(){
    if (!window.Swiper) return;
    if (document.getElementById('s365Visual')) {
      new Swiper('#s365Visual', { loop: true, speed: 800, autoplay: { delay: 6000 } });
    }
    if (document.getElementById('s365Con1')) {
      new Swiper('#s365Con1', {
        loop: true, speed: 800, autoplay: { delay: 6000 },
        pagination: { el: '#s365Con1 .swiper-pagination', clickable: true,
          renderBullet: function(idx, cls){ return '<span class="' + cls + '">' + (idx+1) + '</span>'; }
        }
      });
    }
    if (document.getElementById('s365Con2')) {
      new Swiper('#s365Con2', {
        slidesPerView: 'auto', spaceBetween: 0, loop: true, autoplay: { delay: 6000 },
        navigation: { nextEl: '.s365-con2 .r_bt', prevEl: '.s365-con2 .l_bt' }
      });
    }
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function(){ loadSwiper(init); });
  } else {
    loadSwiper(init);
  }
})();
`;

// ── DB 작업 ────────────────────────────────────────────────────────────────────
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
  console.log('[seoul365 Phase 1 마이그레이션 시작 — hospital_id=10]');

  // 안전장치: hospital_id=10가 seoul365opendental 인지 재확인
  const h = await get('SELECT id, name, slug FROM hospitals WHERE id = ?', [HOSPITAL_ID]);
  if (!h || h.slug !== HOSPITAL_SLUG) {
    console.error(`[ABORT] hospital_id=${HOSPITAL_ID} 가 ${HOSPITAL_SLUG}이 아님:`, h);
    db.close();
    process.exit(1);
  }
  console.log(`  대상 병원 확인: ${h.name} (slug=${h.slug})`);

  try {
    await upsertPage('_header', '공통 헤더', HEADER_CONTENT, HEADER_CSS, '', 'layout', -10);
    await upsertPage('_footer', '공통 푸터', FOOTER_CONTENT, FOOTER_CSS, '', 'layout', 999);
    await upsertPage('main', '메인 페이지', MAIN_CONTENT, MAIN_CSS, MAIN_JS, 'builtin', 0);
    console.log('[완료] _header / _footer / main 적용');
  } catch (e) {
    console.error('[에러]', e.message);
    process.exitCode = 1;
  } finally {
    db.close();
  }
}

main();
