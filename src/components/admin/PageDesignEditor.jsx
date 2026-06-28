'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import dynamic from 'next/dynamic';

const MonacoEditor = dynamic(() => import('@monaco-editor/react'), { ssr: false });

function Icon({ d, size = 16, className = '' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      {d.split('|').map((path, i) => <path key={i} d={path} />)}
    </svg>
  );
}

const ICONS = {
  html:        'M4 3h16l-1.5 15L12 21l-6.5-3L4 3z|M8 8h8|M8.5 12h7|M9.5 16h5',
  css:         'M4 3h16l-1.5 15L12 21l-6.5-3L4 3z|M9 9l-1 6 4 1.5 4-1.5-1-6',
  js:          'M12 2L2 7l10 5 10-5-10-5z|M2 17l10 5 10-5|M2 12l10 5 10-5',
  preview:     'M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z|M12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6z',
  save:        'M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z|M17 21v-8H7v8|M7 3v5h8',
  close:       'M18 6L6 18|M6 6l12 12',
  desktop:     'M2 3h20v14H2z|M8 21h8|M12 17v4',
  mobile:      'M7 2h10a2 2 0 0 1 2 2v16a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2z|M11 18h2',
  refresh:     'M23 4v6h-6|M1 20v-6h6|M3.51 9a9 9 0 0 1 14.85-3.36L23 10|M1 14l4.64 4.36A9 9 0 0 0 20.49 15',
  split:       'M3 3h8v18H3z|M13 3h8v18h-8z',
  full:        'M8 3H5a2 2 0 0 0-2 2v3|M21 8V5a2 2 0 0 0-2-2h-3|M3 16v3a2 2 0 0 0 2 2h3|M16 21h3a2 2 0 0 0 2-2v-3',
  layers:      'M12 2l10 6-10 6L2 8l10-6z|M2 12l10 6 10-6|M2 16l10 6 10-6',
  blocks:      'M3 3h7v7H3z|M14 3h7v7h-7z|M14 14h7v7h-7z|M3 14h7v7H3z',
  sidebarCollapse: 'M3 6h18|M3 12h18|M3 18h18|M9 12l-3-3|M9 12l-3 3',
  sidebarExpand:   'M3 6h18|M3 12h18|M3 18h18|M15 9l3 3|M15 15l3-3',
  plus:        'M12 5v14|M5 12h14',
  edit:        'M12 20h9|M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z',
  dot:         'M12 12m-4 0a4 4 0 1 1 8 0a4 4 0 1 1 -8 0',
  hero:        'M3 5h18v6H3z|M3 15h8v4H3z|M13 15h8v4h-8z',
  cta:         'M3 8h18v8H3z|M8 12h8|M15 10l2 2-2 2',
  gallery:     'M3 3h7v7H3z|M14 3h7v7h-7z|M14 14h7v7h-7z|M3 14h7v7H3z',
  card:        'M3 5h18v14H3z|M3 9h18|M7 13h6|M7 16h4',
  textImg:     'M3 5h8v14H3z|M13 7h8|M13 11h6|M13 15h8|M13 19h4',
  map:         'M3 6l6-3 6 3 6-3v15l-6 3-6-3-6 3V6z|M9 3v15|M15 6v15',
  quote:       'M7 7h4v4c0 2-1 3-3 3|M15 7h4v4c0 2-1 3-3 3',
  button:      'M4 9h16a2 2 0 0 1 2 2v2a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2v-2a2 2 0 0 1 2-2z',
};

const LAYOUT_PAGES = [
  { slug: '_header',  label: '공통 헤더', path: '_header' },
  { slug: '_footer',  label: '공통 푸터', path: '_footer' },
];

const BUILTIN_PAGES = [
  { slug: 'main',          label: '메인 페이지',       path: '/' },
  { slug: 'login',         label: '로그인',           path: '/login' },
  { slug: 'register',      label: '회원가입',         path: '/register' },
  { slug: 'privacy',       label: '개인정보 처리방침', path: '/privacy' },
  { slug: 'terms',         label: '이용약관',         path: '/terms' },
  { slug: 'notice',        label: '공지사항 목록',     path: '/community/notice' },
  { slug: 'notice-detail', label: '공지사항 상세',     path: '/community/notice/[id]' },
  { slug: 'event',         label: '이벤트 목록',       path: '/community/event' },
  { slug: 'event-detail',  label: '이벤트 상세',       path: '/community/event/[id]' },
];

// ── 블록 스니펫: 원클릭으로 HTML 삽입 ─────────────────────────────────────────

const BLOCK_SNIPPETS = [
  {
    id: 'calendar',
    icon: ICONS.card,
    label: '일정 캘린더',
    desc: '월 달력 + 일정 리스트 (관리자 캘린더 연동)',
    kda21Only: true,
    html: `<section class="mlk-cal" data-mlk-cal>
  <div class="mlk-cal-head">
    <button type="button" class="mlk-cal-nav" data-cal-prev aria-label="이전 달">‹</button>
    <strong class="mlk-cal-title" data-cal-title>달력</strong>
    <button type="button" class="mlk-cal-nav" data-cal-next aria-label="다음 달">›</button>
  </div>
  <div class="mlk-cal-weekdays"><span>일</span><span>월</span><span>화</span><span>수</span><span>목</span><span>금</span><span>토</span></div>
  <div class="mlk-cal-grid" data-cal-grid></div>
  <div class="mlk-cal-list" data-cal-list></div>
</section>
<style>
.mlk-cal{max-width:920px;margin:48px auto;padding:0 16px;font-family:'Pretendard','Noto Sans KR',sans-serif;color:#1f2937;}
.mlk-cal-head{display:flex;align-items:center;justify-content:center;gap:18px;margin-bottom:18px;}
.mlk-cal-title{font-size:22px;font-weight:800;min-width:140px;text-align:center;}
.mlk-cal-nav{border:1px solid #e5e7eb;background:#fff;width:38px;height:38px;border-radius:10px;font-size:20px;line-height:1;cursor:pointer;color:#374151;}
.mlk-cal-nav:hover{background:#f9fafb;}
.mlk-cal-weekdays{display:grid;grid-template-columns:repeat(7,1fr);text-align:center;font-size:12px;font-weight:700;color:#9ca3af;padding-bottom:6px;}
.mlk-cal-weekdays span:first-child{color:#ef4444;}.mlk-cal-weekdays span:last-child{color:#3b82f6;}
.mlk-cal-grid{display:grid;grid-template-columns:repeat(7,1fr);border-top:1px solid #f3f4f6;border-left:1px solid #f3f4f6;}
.mlk-cal-cell{min-height:78px;border-right:1px solid #f3f4f6;border-bottom:1px solid #f3f4f6;padding:6px;background:#fff;}
.mlk-cal-cell.empty{background:#fafafa;}
.mlk-cal-dnum{font-size:12px;font-weight:700;color:#6b7280;}
.mlk-cal-cell.today .mlk-cal-dnum{background:#111827;color:#fff;border-radius:50%;display:inline-flex;width:20px;height:20px;align-items:center;justify-content:center;}
.mlk-cal-ev{margin-top:3px;font-size:10px;font-weight:700;color:#fff;border-radius:4px;padding:1px 4px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
.mlk-cal-list{margin-top:24px;display:flex;flex-direction:column;gap:10px;}
.mlk-cal-item{display:flex;gap:12px;align-items:flex-start;border:1px solid #eef0f2;border-radius:12px;padding:14px 16px;}
.mlk-cal-bar{width:4px;align-self:stretch;border-radius:4px;flex:0 0 4px;}
.mlk-cal-it-title{font-weight:800;font-size:15px;}
.mlk-cal-it-meta{font-size:13px;color:#6b7280;margin-top:3px;}
.mlk-cal-it-desc{font-size:13px;color:#4b5563;margin-top:6px;white-space:pre-line;}
.mlk-cal-empty{text-align:center;color:#9ca3af;font-size:14px;padding:24px 0;}
@media(max-width:560px){.mlk-cal-cell{min-height:56px;padding:3px;}.mlk-cal-ev{font-size:9px;}}
</style>
<script>
(function(){
  function init(root){
    if(root.getAttribute('data-cal-init'))return; root.setAttribute('data-cal-init','1');
    var grid=root.querySelector('[data-cal-grid]'),list=root.querySelector('[data-cal-list]'),title=root.querySelector('[data-cal-title]');
    var now=new Date(),y=now.getFullYear(),m=now.getMonth()+1;
    function p2(n){return (n<10?'0':'')+n;}
    function esc(s){return String(s==null?'':s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');}
    function evOnDay(events,day){var out=[];for(var i=0;i<events.length;i++){var e=events[i];var en=e.end_date||e.start_date;if(e.start_date<=day&&day<=en)out.push(e);}return out;}
    function render(events){
      var first=new Date(y,m-1,1).getDay(),dim=new Date(y,m,0).getDate();
      var t=new Date(),tk=t.getFullYear()+'-'+p2(t.getMonth()+1)+'-'+p2(t.getDate());
      var h='';var i;
      for(i=0;i<first;i++){h+='<div class="mlk-cal-cell empty"></div>';}
      for(var d=1;d<=dim;d++){
        var day=y+'-'+p2(m)+'-'+p2(d);var evs=evOnDay(events,day);
        h+='<div class="mlk-cal-cell'+(day===tk?' today':'')+'"><span class="mlk-cal-dnum">'+d+'</span>';
        for(var j=0;j<Math.min(evs.length,3);j++){h+='<div class="mlk-cal-ev" style="background:'+(evs[j].color||'#2563eb')+'">'+(evs[j].start_time?esc(evs[j].start_time)+' ':'')+esc(evs[j].title)+'</div>';}
        if(evs.length>3){h+='<div class="mlk-cal-dnum" style="color:#9ca3af">+'+(evs.length-3)+'</div>';}
        h+='</div>';
      }
      grid.innerHTML=h;
      var s=events.slice().sort(function(a,b){return (a.start_date+(a.start_time||'')).localeCompare(b.start_date+(b.start_time||''));});
      if(!s.length){list.innerHTML='<div class="mlk-cal-empty">이 달 등록된 일정이 없습니다.</div>';return;}
      var lh='';
      for(var k=0;k<s.length;k++){var e=s[k];
        var meta=e.start_date+(e.end_date&&e.end_date!==e.start_date?' ~ '+e.end_date:'')+(e.start_time?' '+e.start_time:'')+(e.location?' · '+e.location:'')+(e.category?' · '+e.category:'');
        var tt=e.link_url?'<a href="'+esc(e.link_url)+'" target="_blank" rel="noopener" style="color:inherit;text-decoration:none">'+esc(e.title)+'</a>':esc(e.title);
        lh+='<div class="mlk-cal-item"><span class="mlk-cal-bar" style="background:'+(e.color||'#2563eb')+'"></span><div><div class="mlk-cal-it-title">'+tt+'</div><div class="mlk-cal-it-meta">'+esc(meta)+'</div>'+(e.content?'<div class="mlk-cal-it-desc">'+esc(e.content)+'</div>':'')+'</div></div>';
      }
      list.innerHTML=lh;
    }
    function load(){
      title.textContent=y+'년 '+m+'월';list.innerHTML='<div class="mlk-cal-empty">불러오는 중…</div>';
      fetch('/api/calendar?month='+y+'-'+p2(m),{credentials:'same-origin'}).then(function(r){return r.json();}).then(function(d){render(d.events||[]);}).catch(function(){grid.innerHTML='';list.innerHTML='<div class="mlk-cal-empty">일정을 불러올 수 없습니다.</div>';});
    }
    root.querySelector('[data-cal-prev]').addEventListener('click',function(){m--;if(m<1){m=12;y--;}load();});
    root.querySelector('[data-cal-next]').addEventListener('click',function(){m++;if(m>12){m=1;y++;}load();});
    load();
  }
  var nodes=document.querySelectorAll('[data-mlk-cal]');for(var i=0;i<nodes.length;i++){init(nodes[i]);}
})();
</script>`,
  },
  {
    id: 'quick-menu',
    icon: ICONS.mobile,
    label: '퀵메뉴 (SNS/예약)',
    desc: '우하단 플로팅 버튼',
    html: `<!-- 퀵메뉴: 링크/아이콘/색상 자유 수정 -->
<div id="quick-menu" style="position:fixed;bottom:32px;right:32px;z-index:50;display:flex;flex-direction:column;align-items:flex-end;gap:12px;">
  <a href="https://booking.naver.com/" target="_blank" rel="noreferrer" class="qm-btn" style="background:#fff;color:#18181b;" title="예약">
    <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor"><path d="M19 4h-1V2h-2v2H8V2H6v2H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2zm0 16H5V10h14v10zM5 8V6h14v2H5zm2 4h5v5H7v-5z"/></svg>
  </a>
  <a href="https://pf.kakao.com/" target="_blank" rel="noreferrer" class="qm-btn" style="background:#FEE500;color:#371D1E;" title="카카오톡">
    <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor"><path d="M12 3C6.48 3 2 6.58 2 10.94c0 2.8 1.86 5.27 4.66 6.67l-.9 3.38c-.08.3.26.54.52.37l3.91-2.58c.58.08 1.18.13 1.81.13 5.52 0 10-3.58 10-7.97S17.52 3 12 3z"/></svg>
  </a>
  <a href="https://blog.naver.com/" target="_blank" rel="noreferrer" class="qm-btn" style="background:#fff;color:#18181b;" title="블로그">
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 4h16v16H4z"/><path d="M4 8h16M8 4v16"/></svg>
  </a>
  <a href="https://youtube.com/" target="_blank" rel="noreferrer" class="qm-btn" style="background:#fff;color:#FF0000;" title="유튜브">
    <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor"><path d="M21.58 7.19a2.5 2.5 0 0 0-1.77-1.77C18.25 5 12 5 12 5s-6.25 0-7.81.42A2.5 2.5 0 0 0 2.42 7.19 26.2 26.2 0 0 0 2 12a26.2 26.2 0 0 0 .42 4.81 2.5 2.5 0 0 0 1.77 1.77C5.75 19 12 19 12 19s6.25 0 7.81-.42a2.5 2.5 0 0 0 1.77-1.77A26.2 26.2 0 0 0 22 12a26.2 26.2 0 0 0-.42-4.81zM10 15V9l5.2 3L10 15z"/></svg>
  </a>
  <a href="https://instagram.com/" target="_blank" rel="noreferrer" class="qm-btn" style="background:#fff;color:#E4405F;" title="인스타그램">
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="2" width="20" height="20" rx="5"/><circle cx="12" cy="12" r="5"/><circle cx="17.5" cy="6.5" r="1.5" fill="currentColor" stroke="none"/></svg>
  </a>
  <button onclick="window.scrollTo({top:0,behavior:'smooth'})" class="qm-btn qm-top" style="background:rgba(255,255,255,0.8);color:#a1a1aa;margin-top:8px;width:48px;height:48px;" title="맨 위로">
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><path d="M18 15l-6-6-6 6"/></svg>
  </button>
</div>
<style>
.qm-btn {
  display:flex;align-items:center;justify-content:center;
  width:56px;height:56px;border-radius:9999px;
  box-shadow:0 4px 16px rgba(0,0,0,0.12);
  border:1px solid rgba(0,0,0,0.05);
  text-decoration:none;cursor:pointer;
  transition:transform 0.2s,box-shadow 0.2s;
}
.qm-btn:hover { transform:scale(1.1) translateX(-4px); box-shadow:0 6px 20px rgba(0,0,0,0.18); }
.qm-top { width:48px;height:48px;border:none; }
</style>`,
  },
  {
    id: 'intro',
    icon: ICONS.full,
    label: '인트로 애니메이션',
    desc: '로딩 시 타이핑 + 브랜드 표시',
    html: `<!-- 인트로 오버레이: 텍스트/색상/시간 자유 수정 가능 -->
<div id="intro-overlay" style="position:fixed;inset:0;z-index:9999;display:flex;align-items:center;justify-content:center;background:#fff;transition:opacity 0.6s ease;">
  <div style="text-align:center;">
    <p id="intro-typed" style="font-size:clamp(1.5rem,5vw,3rem);font-weight:600;color:#18181b;min-height:1.2em;"></p>
    <p id="intro-brand" style="font-size:clamp(1.8rem,5vw,2.5rem);font-weight:700;color:#18181b;opacity:0;transition:opacity 0.7s ease;margin-top:12px;">
      <span>Wonju</span> <span style="color:#fca311;">Dental</span> <span>Clinic</span>
    </p>
  </div>
</div>
<script>
(function(){
  var text = '당신 치아의 평생 주치의';  /* ← 타이핑 텍스트 수정 */
  var typingSpeed = 95;                  /* ← 타이핑 속도 (ms) */
  var brandDelay = 900;                  /* ← 브랜드 표시 딜레이 */
  var fadeOutDelay = 3000;               /* ← 전체 사라지는 시간 */

  var overlay = document.getElementById('intro-overlay');
  var typed = document.getElementById('intro-typed');
  var brand = document.getElementById('intro-brand');
  if(!overlay) return;

  var i = 0;
  var timer = setInterval(function(){
    i++;
    typed.textContent = text.slice(0, i);
    if(i >= text.length){
      clearInterval(timer);
      setTimeout(function(){ typed.style.opacity = '0'; brand.style.opacity = '1'; }, brandDelay);
      setTimeout(function(){ overlay.style.opacity = '0'; }, fadeOutDelay);
      setTimeout(function(){ overlay.remove(); }, fadeOutDelay + 600);
    }
  }, typingSpeed);
})();
</script>`,
  },
  {
    id: 'hero',
    icon: ICONS.hero,
    label: '히어로 섹션',
    desc: '큰 제목 + 부제 + 버튼',
    html: `<section class="hero">
  <div class="container">
    <h1 class="hero-title">최고의 진료, 편안한 경험</h1>
    <p class="hero-desc">믿을 수 있는 진료를 약속드립니다.</p>
    <a href="/consult" class="hero-btn">상담 신청하기</a>
  </div>
</section>`,
  },
  {
    id: 'cta',
    icon: ICONS.cta,
    label: 'CTA 배너',
    desc: '행동 유도 배너',
    html: `<section class="cta-banner">
  <div class="container cta-inner">
    <div>
      <h3 class="cta-title">지금 바로 상담 받으세요</h3>
      <p class="cta-desc">전문의가 직접 상담해 드립니다.</p>
    </div>
    <a href="tel:033-000-0000" class="cta-btn">전화 상담</a>
  </div>
</section>`,
  },
  {
    id: 'card-grid',
    icon: ICONS.gallery,
    label: '카드 3단',
    desc: '특징/서비스 3개 나열',
    html: `<section class="card-grid-section">
  <div class="container">
    <h2 class="section-title">진료 분야</h2>
    <div class="card-grid">
      <div class="card">
        <h3 class="card-title">임플란트</h3>
        <p class="card-desc">정교하고 안전한 임플란트.</p>
      </div>
      <div class="card">
        <h3 class="card-title">심미치료</h3>
        <p class="card-desc">자연스러운 아름다움.</p>
      </div>
      <div class="card">
        <h3 class="card-title">교정치료</h3>
        <p class="card-desc">건강한 치아 배열.</p>
      </div>
    </div>
  </div>
</section>`,
  },
  {
    id: 'text-image',
    icon: ICONS.textImg,
    label: '텍스트 + 이미지',
    desc: '좌우 2단 레이아웃',
    html: `<section class="text-image">
  <div class="container text-image-inner">
    <div class="text-image-text">
      <h2 class="section-title">우리 업체만의 특별함</h2>
      <p class="section-desc">전문 인력이 고객 한 분 한 분을 세심하게 응대합니다.</p>
    </div>
    <div class="text-image-media">
      <img src="/images/placeholder.jpg" alt="" />
    </div>
  </div>
</section>`,
  },
  {
    id: 'quote',
    icon: ICONS.quote,
    label: '인용/후기',
    desc: '환자 후기 카드',
    html: `<section class="quote-section">
  <div class="container">
    <blockquote class="quote">
      <p>"정말 친절하게 설명해 주시고, 치료 결과도 만족스러워요."</p>
      <cite>— 홍OO 님</cite>
    </blockquote>
  </div>
</section>`,
  },
  {
    id: 'button',
    icon: ICONS.button,
    label: '버튼',
    desc: '단일 CTA 버튼',
    html: `<a href="/consult" class="btn-primary">상담 신청</a>`,
  },
  {
    id: 'divider',
    icon: ICONS.sidebarCollapse,
    label: '구분선',
    desc: '섹션 간 구분',
    html: `<hr class="section-divider" />`,
  },
  {
    id: 'board-list',
    icon: ICONS.card,
    label: '게시판 목록',
    desc: '공지/이벤트/커스텀 게시글 목록',
    html: `<!-- ============================================
     게시판 목록 블록

     ★ 아래 boardType만 수정하세요 ★
     - 공지사항:  boardType = 'notice'   (boardSlug 비워두기)
     - 이벤트:    boardType = 'event'    (boardSlug 비워두기)
     - 커스텀:    boardType = 'board'    (boardSlug에 그룹 slug 입력)

     ※ 경로(community/notice)가 아닌 타입명(notice)만 입력!
     ============================================ -->
<div id="board-list-container">
  <div style="text-align:center;padding:40px;color:#a1a1aa;">불러오는 중...</div>
</div>
<script>
(function(){
  var boardType = 'notice';   /* ← notice | event | board */
  var boardSlug = '';          /* ← board일 때만 slug 입력 (예: 'free') */

  var url = '/api/board?type=' + boardType;
  if (boardSlug) url += '&groupSlug=' + boardSlug;

  var container = document.getElementById('board-list-container');
  if (!container) return;

  fetch(url)
    .then(function(r){ return r.json(); })
    .then(function(posts){
      if (!Array.isArray(posts) || posts.length === 0) {
        container.innerHTML = '<p style="text-align:center;padding:60px 0;color:#a1a1aa;">등록된 게시글이 없습니다.</p>';
        return;
      }
      var detailBase = boardType === 'notice' ? '/community/notice/'
                     : boardType === 'event' ? '/community/event/'
                     : '/community/' + boardSlug + '/';
      var html = '<ul style="list-style:none;padding:0;margin:0;">';
      posts.forEach(function(p){
        var date = (p.created_at || '').slice(0, 10);
        html += '<li style="border-bottom:1px solid #f0f0f0;">'
          + '<a href="' + detailBase + p.id + '" style="display:flex;justify-content:space-between;align-items:center;padding:16px 4px;text-decoration:none;color:inherit;transition:background 0.15s;" onmouseover="this.style.background=\\'#fafafa\\'" onmouseout="this.style.background=\\'\\'">'
          + '<span style="font-weight:600;font-size:15px;color:#18181b;">' + p.title + '</span>'
          + '<span style="font-size:13px;color:#a1a1aa;flex-shrink:0;margin-left:16px;">' + date + '</span>'
          + '</a></li>';
      });
      html += '</ul>';
      container.innerHTML = html;
    })
    .catch(function(){ container.innerHTML = '<p style="text-align:center;padding:40px;color:#ef4444;">게시글을 불러올 수 없습니다.</p>'; });
})();
</script>`,
  },
  {
    id: 'board-detail',
    icon: ICONS.card,
    label: '게시글 상세',
    desc: 'URL의 게시글 ID로 상세 표시',
    html: `<!-- ============================================
     게시글 상세 블록
     URL 파라미터에서 자동으로 게시글 ID를 읽습니다.
     사용법: 이 블록이 있는 페이지 URL에 ?postId=123 추가
     ============================================ -->
<div id="board-detail-container">
  <div style="text-align:center;padding:40px;color:#a1a1aa;">불러오는 중...</div>
</div>
<script>
(function(){
  var container = document.getElementById('board-detail-container');
  if (!container) return;

  var params = new URLSearchParams(window.location.search);
  var postId = params.get('postId') || window.location.pathname.split('/').pop();

  if (!postId || isNaN(Number(postId))) {
    container.innerHTML = '<p style="text-align:center;padding:60px 0;color:#a1a1aa;">게시글을 찾을 수 없습니다.</p>';
    return;
  }

  fetch('/api/board/' + postId)
    .then(function(r){ if (!r.ok) throw new Error(); return r.json(); })
    .then(function(post){
      var date = (post.created_at || '').slice(0, 10);
      container.innerHTML = ''
        + '<article style="max-width:800px;margin:0 auto;padding:40px 20px;">'
        + '<h1 style="font-size:1.8rem;font-weight:800;color:#18181b;margin-bottom:12px;">' + post.title + '</h1>'
        + '<p style="font-size:13px;color:#a1a1aa;margin-bottom:32px;padding-bottom:16px;border-bottom:1px solid #f0f0f0;">' + date + '</p>'
        + '<div style="font-size:15px;line-height:1.8;color:#3f3f46;">' + post.content + '</div>'
        + '</article>';
    })
    .catch(function(){ container.innerHTML = '<p style="text-align:center;padding:60px 0;color:#ef4444;">게시글을 불러올 수 없습니다.</p>'; });
})();
</script>`,
  },
  {
    id: 'encyclopedia-list',
    icon: ICONS.card,
    label: '치과 백과사전 (목록)',
    desc: '카테고리 + 초성검색 용어 목록',
    html: `<!-- ============================================
     치과 백과사전 — 목록 (레퍼런스형: 카테고리 + 초성검색)
     ★ 아래 boardSlug / docPath 만 수정 ★
     - boardSlug : 게시판 그룹 slug (게시판 관리에서 생성, 기본 'encyclopedia')
     - docPath   : 나무위키 상세 블록이 있는 페이지 경로 (기본 '/encyclopedia-doc')
     - 게시글 제목 규칙:  [카테고리] 용어명   예) [임플란트] 골이식
       (대괄호가 없으면 '기타'로 분류됩니다)
     ============================================ -->
<div id="enc-list" class="enc-list">
  <div class="enc-head">
    <h2 class="enc-h">치과 백과사전</h2>
    <p class="enc-sub">궁금한 치과 용어를 카테고리 · 초성 · 검색으로 찾아보세요.</p>
    <input id="enc-q" class="enc-search" type="search" placeholder="용어 검색 (예: 임플란트, 사랑니)" autocomplete="off" />
  </div>
  <div id="enc-cats" class="enc-chips"></div>
  <div id="enc-cho" class="enc-chips enc-cho"></div>
  <div id="enc-grid" class="enc-grid"><div class="enc-empty">불러오는 중…</div></div>
</div>
<style>
.enc-list{max-width:1080px;margin:0 auto;padding:48px 20px;color:#27272a;font-family:inherit;}
.enc-head{text-align:center;margin-bottom:28px;}
.enc-h{font-size:clamp(1.6rem,4vw,2.2rem);font-weight:800;color:#18181b;margin:0 0 8px;}
.enc-sub{font-size:14px;color:#71717a;margin:0 0 20px;}
.enc-search{width:100%;max-width:480px;padding:14px 18px;border:1px solid #e4e4e7;border-radius:12px;background:#fafafa;font-size:15px;outline:none;transition:border-color .15s,background .15s;}
.enc-search:focus{border-color:#18181b;background:#fff;}
.enc-chips{display:flex;flex-wrap:wrap;gap:8px;justify-content:center;margin-bottom:14px;}
.enc-cho{margin-bottom:24px;}
.enc-chip{padding:7px 14px;border:1px solid #e4e4e7;border-radius:9999px;background:#fff;color:#52525b;font-size:13px;font-weight:600;cursor:pointer;transition:all .15s;}
.enc-chip:hover{border-color:#a1a1aa;}
.enc-chip.on{background:#18181b;border-color:#18181b;color:#fff;}
.enc-cho .enc-chip{min-width:38px;text-align:center;padding:7px 0;}
.enc-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:12px;}
.enc-card{display:block;text-align:left;padding:18px;border:1px solid #ececef;border-radius:14px;background:#fff;cursor:pointer;transition:transform .15s,box-shadow .15s,border-color .15s;}
.enc-card:hover{transform:translateY(-2px);box-shadow:0 8px 22px rgba(0,0,0,.07);border-color:#d4d4d8;}
.enc-cat-badge{display:inline-block;font-size:11px;font-weight:700;color:#2563eb;background:#eff6ff;padding:3px 9px;border-radius:9999px;margin-bottom:8px;}
.enc-card-name{font-size:16px;font-weight:700;color:#18181b;}
.enc-empty{grid-column:1/-1;text-align:center;padding:60px 0;color:#a1a1aa;font-size:14px;}
@media(max-width:640px){.enc-list{padding:32px 16px;}.enc-grid{grid-template-columns:repeat(auto-fill,minmax(150px,1fr));}}
</style>
<script>
(function(){
  var boardSlug = 'encyclopedia';      /* ← 게시판 그룹 slug */
  var docPath   = '/encyclopedia-doc'; /* ← 나무위키 상세 페이지 경로 */

  var root = document.getElementById('enc-list');
  if (!root) return;
  var grid = document.getElementById('enc-grid');
  var catsBox = document.getElementById('enc-cats');
  var choBox = document.getElementById('enc-cho');
  var qInput = document.getElementById('enc-q');

  var CHO = ['ㄱ','ㄴ','ㄷ','ㄹ','ㅁ','ㅂ','ㅅ','ㅇ','ㅈ','ㅊ','ㅋ','ㅌ','ㅍ','ㅎ'];
  var CHO_FULL = ['ㄱ','ㄲ','ㄴ','ㄷ','ㄸ','ㄹ','ㅁ','ㅂ','ㅃ','ㅅ','ㅆ','ㅇ','ㅈ','ㅉ','ㅊ','ㅋ','ㅌ','ㅍ','ㅎ'];
  var FOLD = {'ㄲ':'ㄱ','ㄸ':'ㄷ','ㅃ':'ㅂ','ㅆ':'ㅅ','ㅉ':'ㅈ'};

  function chosung(name){
    if (!name) return '#';
    var c = name.charCodeAt(0);
    if (c < 0xAC00 || c > 0xD7A3) return '#';
    var ch = CHO_FULL[Math.floor((c - 0xAC00) / 588)];
    return FOLD[ch] || ch;
  }

  var items = [], selCat = '전체', selCho = '전체', q = '';

  function parseTitle(t){
    var m = String(t || '').match(/^\\s*\\[([^\\]]+)\\]\\s*(.+)$/);
    if (m) return { cat: m[1].trim(), name: m[2].trim() };
    return { cat: '기타', name: String(t || '').trim() };
  }

  function chip(label, active){
    var b = document.createElement('button');
    b.type = 'button';
    b.className = 'enc-chip' + (active ? ' on' : '');
    b.textContent = label;
    return b;
  }

  function renderChips(){
    var cats = ['전체'];
    items.forEach(function(it){ if (cats.indexOf(it.cat) < 0) cats.push(it.cat); });
    catsBox.innerHTML = '';
    cats.forEach(function(c){
      var el = chip(c, c === selCat);
      el.addEventListener('click', function(){ selCat = c; renderChips(); renderGrid(); });
      catsBox.appendChild(el);
    });
    choBox.innerHTML = '';
    var choList = ['전체'].concat(CHO).concat(['#']);
    choList.forEach(function(c){
      var el = chip(c, c === selCho);
      el.addEventListener('click', function(){ selCho = c; renderChips(); renderGrid(); });
      choBox.appendChild(el);
    });
  }

  function renderGrid(){
    var qq = q.trim().toLowerCase();
    var list = items.filter(function(it){
      if (selCat !== '전체' && it.cat !== selCat) return false;
      if (selCho !== '전체' && chosung(it.name) !== selCho) return false;
      if (qq && it.name.toLowerCase().indexOf(qq) < 0 && it.cat.toLowerCase().indexOf(qq) < 0) return false;
      return true;
    });
    list.sort(function(a, b){ return a.name.localeCompare(b.name, 'ko'); });
    if (!list.length){
      grid.innerHTML = '<div class="enc-empty">조건에 맞는 용어가 없습니다.</div>';
      return;
    }
    grid.innerHTML = '';
    list.forEach(function(it){
      var a = document.createElement('a');
      a.className = 'enc-card';
      a.href = docPath + '?postId=' + it.id;
      a.innerHTML = '<span class="enc-cat-badge">' + it.cat + '</span><div class="enc-card-name">' + it.name + '</div>';
      grid.appendChild(a);
    });
  }

  qInput.addEventListener('input', function(){ q = qInput.value; renderGrid(); });

  // 상세 [[관련문서]] 링크에서 넘어온 검색어(#q=...) 자동 적용
  try {
    var h = decodeURIComponent((location.hash || '').replace(/^#q=/, ''));
    if (h && location.hash.indexOf('#q=') === 0) { q = h; qInput.value = h; }
  } catch (e) {}

  fetch('/api/board?type=board&groupSlug=' + boardSlug)
    .then(function(r){ return r.json(); })
    .then(function(posts){
      if (!Array.isArray(posts) || !posts.length){
        grid.innerHTML = '<div class="enc-empty">등록된 용어가 없습니다.</div>';
        return;
      }
      items = posts.map(function(p){
        var pt = parseTitle(p.title);
        return { id: p.id, cat: pt.cat, name: pt.name };
      });
      renderChips();
      renderGrid();
    })
    .catch(function(){ grid.innerHTML = '<div class="enc-empty" style="color:#ef4444">목록을 불러올 수 없습니다.</div>'; });
})();
</script>`,
  },
  {
    id: 'encyclopedia-detail',
    icon: ICONS.card,
    label: '치과 백과사전 (문서)',
    desc: '나무위키형 자동목차+각주+관련문서',
    html: `<!-- ============================================
     치과 백과사전 — 문서 (나무위키형)
     사용법: 이 블록을 넣은 페이지 경로를 목록 블록의 docPath 와 동일하게 맞추세요.
     URL ?postId=123 또는 경로 끝의 숫자 ID를 자동으로 읽습니다.

     게시글 본문 작성 규칙:
     - 소제목은 h2 / h3 / h4 사용 → 자동 목차 생성
     - 각주:        문장[*각주 내용]   → 하단 각주로 이동
     - 관련 문서:   [[관련 용어]]      → 목록에서 검색되는 링크
     - listPath : 목록 블록이 있는 페이지 경로 (기본 '/encyclopedia')
     ============================================ -->
<div id="enc-doc" class="enc-doc"><div class="enc-doc-loading">불러오는 중…</div></div>
<style>
.enc-doc{max-width:880px;margin:0 auto;padding:40px 20px 80px;color:#27272a;font-family:inherit;}
.enc-doc-loading{text-align:center;padding:80px 0;color:#a1a1aa;}
.enc-doc-back{display:inline-flex;align-items:center;gap:6px;font-size:13px;color:#71717a;text-decoration:none;margin-bottom:18px;}
.enc-doc-back:hover{color:#18181b;}
.enc-doc-title{font-size:clamp(1.7rem,4.5vw,2.4rem);font-weight:800;color:#18181b;margin:0 0 6px;line-height:1.25;}
.enc-doc-meta{font-size:13px;color:#a1a1aa;margin:0 0 22px;padding-bottom:18px;border-bottom:2px solid #18181b;}
.enc-doc-cat{display:inline-block;font-size:12px;font-weight:700;color:#2563eb;background:#eff6ff;padding:3px 10px;border-radius:9999px;margin-right:8px;}
.enc-toc{background:#f8f8f9;border:1px solid #e8e8eb;border-radius:12px;padding:16px 20px;margin:0 0 28px;font-size:14px;}
.enc-toc-hd{display:flex;justify-content:space-between;align-items:center;font-weight:800;color:#18181b;}
.enc-toc-tg{background:none;border:none;color:#71717a;font-size:12px;font-weight:700;cursor:pointer;}
.enc-toc ol{list-style:none;margin:12px 0 0;padding:0;}
.enc-toc li{margin:5px 0;}
.enc-toc a{color:#3f3f46;text-decoration:none;}
.enc-toc a:hover{color:#2563eb;text-decoration:underline;}
.enc-toc .n{color:#a1a1aa;margin-right:7px;font-variant-numeric:tabular-nums;}
.enc-doc-body{font-size:16px;line-height:1.85;color:#3f3f46;}
.enc-doc-body h2,.enc-doc-body h3,.enc-doc-body h4{color:#18181b;font-weight:800;line-height:1.3;scroll-margin-top:80px;border-bottom:1px solid #ececef;padding-bottom:6px;}
.enc-doc-body h2{font-size:1.5rem;margin:42px 0 16px;}
.enc-doc-body h3{font-size:1.2rem;margin:32px 0 12px;border-bottom:none;}
.enc-doc-body h4{font-size:1.05rem;margin:24px 0 10px;border-bottom:none;}
.enc-doc-body .hn{color:#a1a1aa;font-weight:700;margin-right:8px;}
.enc-doc-body img{max-width:100%;height:auto;border-radius:10px;}
.enc-doc-body p{margin:14px 0;}
.enc-fn{font-size:.72em;vertical-align:super;line-height:0;}
.enc-fn a{color:#2563eb;text-decoration:none;font-weight:700;padding:0 1px;}
.enc-rel-link{color:#2563eb;text-decoration:none;border-bottom:1px dotted #93c5fd;}
.enc-rel-link:hover{background:#eff6ff;}
.enc-sec{margin-top:44px;padding-top:18px;border-top:1px solid #ececef;}
.enc-sec h3{font-size:1.1rem;font-weight:800;color:#18181b;margin:0 0 12px;}
.enc-fns{list-style:none;padding:0;margin:0;font-size:13.5px;color:#52525b;}
.enc-fns li{margin:7px 0;display:flex;gap:8px;}
.enc-fns .bk{color:#2563eb;text-decoration:none;font-weight:700;flex-shrink:0;}
.enc-rels{display:flex;flex-wrap:wrap;gap:8px;}
.enc-rels a{font-size:13px;color:#3f3f46;background:#f4f4f5;border:1px solid #e4e4e7;border-radius:9999px;padding:7px 14px;text-decoration:none;}
.enc-rels a:hover{border-color:#2563eb;color:#2563eb;}
.enc-doc-err{text-align:center;padding:80px 0;color:#ef4444;}
@media(max-width:640px){.enc-doc{padding:28px 16px 60px;}}
</style>
<script>
(function(){
  var listPath = '/encyclopedia';  /* ← 목록 블록이 있는 페이지 경로 */

  var root = document.getElementById('enc-doc');
  if (!root) return;

  var params = new URLSearchParams(window.location.search);
  var postId = params.get('postId') || window.location.pathname.split('/').pop();
  if (!postId || isNaN(Number(postId))){
    root.innerHTML = '<div class="enc-doc-err">문서를 찾을 수 없습니다.</div>';
    return;
  }

  function esc(s){ return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }

  fetch('/api/board/' + postId)
    .then(function(r){ if (!r.ok) throw new Error(); return r.json(); })
    .then(function(post){
      var tm = String(post.title || '').match(/^\\s*\\[([^\\]]+)\\]\\s*(.+)$/);
      var cat = tm ? tm[1].trim() : '';
      var name = tm ? tm[2].trim() : String(post.title || '');
      var date = String(post.updated_at || post.created_at || '').slice(0, 10);

      var fns = [], rels = [];
      var body = String(post.content || '');
      // 관련 문서 [[제목]]
      body = body.replace(/\\[\\[([^\\]]+)\\]\\]/g, function(_, t){
        t = t.trim();
        if (rels.indexOf(t) < 0) rels.push(t);
        return '<a class="enc-rel-link" href="' + listPath + '#q=' + encodeURIComponent(t) + '">' + esc(t) + '</a>';
      });
      // 각주 [*내용]
      body = body.replace(/\\[\\*([^\\]]+)\\]/g, function(_, t){
        fns.push(t.trim());
        var n = fns.length;
        return '<sup class="enc-fn" id="fnref-' + n + '"><a href="#fn-' + n + '">[' + n + ']</a></sup>';
      });

      root.innerHTML =
        '<a class="enc-doc-back" href="' + listPath + '">← 백과사전 목록</a>'
        + '<h1 class="enc-doc-title">' + esc(name) + '</h1>'
        + '<p class="enc-doc-meta">' + (cat ? '<span class="enc-doc-cat">' + esc(cat) + '</span>' : '')
        + (date ? '최종 수정: ' + date : '') + '</p>'
        + '<div id="enc-toc-mt"></div>'
        + '<div class="enc-doc-body" id="enc-body"></div>'
        + '<div id="enc-foot"></div>'
        + '<div id="enc-rel"></div>';

      var bodyEl = document.getElementById('enc-body');
      bodyEl.innerHTML = body;

      // 자동 목차 + 앵커 + 나무위키형 번호
      var heads = [].slice.call(bodyEl.querySelectorAll('h2,h3,h4'));
      if (heads.length){
        var lvls = heads.map(function(h){ return parseInt(h.tagName.substring(1), 10); });
        var base = Math.min.apply(null, lvls);
        var ctr = [];
        var tocItems = [];
        heads.forEach(function(h, i){
          var d = parseInt(h.tagName.substring(1), 10) - base;
          ctr = ctr.slice(0, d + 1);
          ctr[d] = (ctr[d] || 0) + 1;
          var num = ctr.slice(0, d + 1).join('.');
          var id = 'enc-s' + i;
          h.id = id;
          var label = h.textContent;
          h.insertBefore((function(){ var s = document.createElement('span'); s.className = 'hn'; s.textContent = num + '.'; return s; })(), h.firstChild);
          tocItems.push({ id: id, num: num, label: label, depth: d });
        });
        var ol = '<ol>';
        tocItems.forEach(function(t){
          ol += '<li style="padding-left:' + (t.depth * 16) + 'px"><a href="#' + t.id + '"><span class="n">' + t.num + '.</span>' + esc(t.label) + '</a></li>';
        });
        ol += '</ol>';
        var toc = document.createElement('div');
        toc.className = 'enc-toc';
        toc.innerHTML = '<div class="enc-toc-hd"><span>목차</span><button type="button" class="enc-toc-tg">[접기]</button></div><div class="enc-toc-bd">' + ol + '</div>';
        document.getElementById('enc-toc-mt').appendChild(toc);
        var bd = toc.querySelector('.enc-toc-bd');
        var tg = toc.querySelector('.enc-toc-tg');
        tg.addEventListener('click', function(){
          var hidden = bd.style.display === 'none';
          bd.style.display = hidden ? '' : 'none';
          tg.textContent = hidden ? '[접기]' : '[펼치기]';
        });
      }

      // 각주
      if (fns.length){
        var fh = '<div class="enc-sec"><h3>각주</h3><ol class="enc-fns">';
        fns.forEach(function(t, i){
          var n = i + 1;
          fh += '<li id="fn-' + n + '"><a class="bk" href="#fnref-' + n + '">[' + n + '] ↑</a><span>' + esc(t) + '</span></li>';
        });
        fh += '</ol></div>';
        document.getElementById('enc-foot').innerHTML = fh;
      }

      // 관련 문서
      if (rels.length){
        var rh = '<div class="enc-sec"><h3>관련 문서</h3><div class="enc-rels">';
        rels.forEach(function(t){
          rh += '<a href="' + listPath + '#q=' + encodeURIComponent(t) + '">' + esc(t) + '</a>';
        });
        rh += '</div></div>';
        document.getElementById('enc-rel').innerHTML = rh;
      }
    })
    .catch(function(){ root.innerHTML = '<div class="enc-doc-err">문서를 불러올 수 없습니다.</div>'; });
})();
</script>`,
  },
  {
    id: 'map',
    icon: ICONS.map,
    label: '지도 임베드',
    desc: 'iframe 지도',
    html: `<section class="map-section">
  <div class="container">
    <h2 class="section-title">오시는 길</h2>
    <iframe src="https://map.naver.com/..." class="map-embed" loading="lazy"></iframe>
  </div>
</section>`,
  },
  {
    id: 'consult-form',
    icon: ICONS.card,
    label: '상담 신청 폼',
    desc: '카테고리/이름/연락처 입력 폼',
    html: `<section class="consult-section" style="background:#18181b;padding:80px 0;">
  <div style="max-width:900px;margin:0 auto;padding:0 20px;">
    <div style="text-align:center;margin-bottom:48px;">
      <h2 style="font-size:2.5rem;font-weight:800;color:#fff;margin-bottom:16px;">빠른 상담 신청</h2>
      <p style="font-size:1rem;color:rgba(255,255,255,0.7);">정보를 남겨주시면 가장 빠른 시간 내에 전문 상담사가 연락을 드립니다.</p>
    </div>
    <form id="consultForm" style="background:#fff;border-radius:24px;padding:48px;box-shadow:0 20px 40px rgba(0,0,0,0.15);">
      <div style="display:grid;grid-template-columns:repeat(2,1fr);gap:24px;margin-bottom:32px;">
        <div style="display:flex;flex-direction:column;gap:8px;">
          <label style="font-weight:700;font-size:14px;color:#18181b;">진료과목 선택</label>
          <select name="category" required style="border:1px solid #e4e4e7;border-radius:12px;padding:16px;background:#fafafa;font-size:14px;">
            <option value="">진료과목을 선택해주세요</option>
            <option value="임플란트">임플란트</option>
            <option value="턱관절클리닉">턱관절클리닉</option>
            <option value="사랑니발치">사랑니 당일 매복발치</option>
            <option value="심미치료">하이엔드 심미치료</option>
            <option value="기타상담">기타 상담</option>
          </select>
        </div>
        <div style="display:flex;flex-direction:column;gap:8px;">
          <label style="font-weight:700;font-size:14px;color:#18181b;">이름</label>
          <input type="text" name="name" required placeholder="홍길동" style="border:1px solid #e4e4e7;border-radius:12px;padding:16px;background:#fafafa;font-size:14px;" />
        </div>
        <div style="display:flex;flex-direction:column;gap:8px;">
          <label style="font-weight:700;font-size:14px;color:#18181b;">연락처</label>
          <input type="tel" name="phone" required placeholder="010-1234-5678" style="border:1px solid #e4e4e7;border-radius:12px;padding:16px;background:#fafafa;font-size:14px;" />
        </div>
        <div style="display:flex;flex-direction:column;gap:8px;">
          <label style="font-weight:700;font-size:14px;color:#18181b;">이메일 (선택)</label>
          <input type="email" name="email" placeholder="example@email.com" style="border:1px solid #e4e4e7;border-radius:12px;padding:16px;background:#fafafa;font-size:14px;" />
        </div>
      </div>
      <div style="display:flex;align-items:center;gap:12px;margin-bottom:32px;background:#fafafa;padding:16px;border-radius:12px;border:1px solid #e4e4e7;">
        <input type="checkbox" name="agreed" required style="width:20px;height:20px;accent-color:#fca311;" />
        <label style="font-size:14px;color:#71717a;">[필수] 개인정보 수집 및 취급방침에 동의하며 마케팅, 이벤트 수신에 동의합니다.</label>
      </div>
      <button type="submit" style="width:100%;background:#fca311;color:#fff;font-weight:800;padding:20px;border-radius:16px;border:none;font-size:16px;cursor:pointer;">
        빠른 상담 신청하기
      </button>
      <div id="consultMsg" style="display:none;margin-top:16px;text-align:center;font-weight:700;color:#fca311;"></div>
    </form>
  </div>
</section>
<script>
(function(){
  var f=document.getElementById('consultForm');
  if(!f)return;
  f.addEventListener('submit',function(e){
    e.preventDefault();
    var d={category:f.category.value,name:f.name.value,phone:f.phone.value,email:f.email.value,agreed:f.agreed.checked?1:0};
    fetch('/api/consult',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(d)})
    .then(function(r){if(r.ok){f.reset();var m=document.getElementById('consultMsg');m.style.display='block';m.textContent='상담 신청이 접수되었습니다.';setTimeout(function(){m.style.display='none'},5000)}})
    .catch(function(){alert('신청 중 오류가 발생했습니다.')});
  });
})();
</script>`,
  },
  {
    id: 'login-form',
    icon: ICONS.edit,
    label: '환자 로그인 폼',
    desc: '이메일/비밀번호 로그인',
    html: `<section style="padding:60px 0;">
  <div style="max-width:400px;margin:0 auto;padding:0 20px;">
    <h2 style="font-size:1.5rem;font-weight:800;text-align:center;margin-bottom:32px;color:#18181b;">로그인</h2>
    <form id="patientLoginForm" style="display:flex;flex-direction:column;gap:16px;">
      <input type="email" name="email" required placeholder="이메일" style="border:1px solid #e4e4e7;border-radius:12px;padding:14px;font-size:14px;background:#fafafa;" />
      <input type="password" name="password" required placeholder="비밀번호" style="border:1px solid #e4e4e7;border-radius:12px;padding:14px;font-size:14px;background:#fafafa;" />
      <div id="loginError" style="display:none;text-align:center;color:#ef4444;font-size:13px;font-weight:700;"></div>
      <button type="submit" style="background:#fca311;color:#fff;font-weight:800;padding:14px;border-radius:12px;border:none;font-size:15px;cursor:pointer;">로그인</button>
    </form>
    <p style="text-align:center;margin-top:16px;font-size:13px;color:#71717a;">계정이 없으신가요? <a href="#register" style="color:#fca311;font-weight:700;">회원가입</a></p>
  </div>
</section>
<script>
(function(){
  var f=document.getElementById('patientLoginForm');
  if(!f)return;
  f.addEventListener('submit',function(e){
    e.preventDefault();
    var err=document.getElementById('loginError');
    err.style.display='none';
    fetch('/api/auth/login',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({email:f.email.value,password:f.password.value})})
    .then(function(r){return r.json()})
    .then(function(d){if(d.ok){location.reload()}else{err.textContent=d.error||'로그인 실패';err.style.display='block'}})
    .catch(function(){err.textContent='네트워크 오류';err.style.display='block'});
  });
})();
</script>`,
  },
  {
    id: 'register-form',
    icon: ICONS.plus,
    label: '환자 회원가입 폼',
    desc: '이름/연락처/이메일/비밀번호',
    html: `<section style="padding:60px 0;">
  <div style="max-width:400px;margin:0 auto;padding:0 20px;">
    <h2 style="font-size:1.5rem;font-weight:800;text-align:center;margin-bottom:32px;color:#18181b;">회원가입</h2>
    <form id="patientRegForm" style="display:flex;flex-direction:column;gap:16px;">
      <input type="text" name="name" required placeholder="이름" style="border:1px solid #e4e4e7;border-radius:12px;padding:14px;font-size:14px;background:#fafafa;" />
      <input type="tel" name="phone" placeholder="연락처 (선택)" style="border:1px solid #e4e4e7;border-radius:12px;padding:14px;font-size:14px;background:#fafafa;" />
      <input type="email" name="email" required placeholder="이메일" style="border:1px solid #e4e4e7;border-radius:12px;padding:14px;font-size:14px;background:#fafafa;" />
      <input type="password" name="password" required placeholder="비밀번호 (4자 이상)" minlength="4" style="border:1px solid #e4e4e7;border-radius:12px;padding:14px;font-size:14px;background:#fafafa;" />
      <div id="regError" style="display:none;text-align:center;color:#ef4444;font-size:13px;font-weight:700;"></div>
      <button type="submit" style="background:#fca311;color:#fff;font-weight:800;padding:14px;border-radius:12px;border:none;font-size:15px;cursor:pointer;">가입하기</button>
    </form>
    <p style="text-align:center;margin-top:16px;font-size:13px;color:#71717a;">이미 계정이 있으신가요? <a href="#login" style="color:#fca311;font-weight:700;">로그인</a></p>
  </div>
</section>
<script>
(function(){
  var f=document.getElementById('patientRegForm');
  if(!f)return;
  f.addEventListener('submit',function(e){
    e.preventDefault();
    var err=document.getElementById('regError');
    err.style.display='none';
    fetch('/api/auth/register',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({name:f.name.value,phone:f.phone.value,email:f.email.value,password:f.password.value})})
    .then(function(r){return r.json()})
    .then(function(d){if(d.ok){location.reload()}else{err.textContent=d.error||'가입 실패';err.style.display='block'}})
    .catch(function(){err.textContent='네트워크 오류';err.style.display='block'});
  });
})();
</script>`,
  },
  {
    id: 'auth-modal-set',
    icon: ICONS.edit,
    label: '로그인 모달 세트',
    desc: '버튼 + 로그인/회원가입 모달 (조건부 표시)',
    html: `<!-- ============================================
     인증 버튼 + 모달 세트
     - 비로그인: "로그인" / "회원가입" 버튼 표시
     - 로그인: "OOO님" / "로그아웃" 표시
     - 버튼 클릭 시 모달 팝업
     헤더 HTML에 통째로 넣으세요.
     ============================================ -->
<div class="auth-buttons">
  <a href="#" class="auth-guest" data-modal-open="login">로그인</a>
  <a href="#" class="auth-guest" data-modal-open="register">회원가입</a>
  <span class="auth-user auth-user-name" id="userName"></span>
  <a href="#" class="auth-user" id="btnLogout">로그아웃</a>
</div>

<!-- 로그인 모달 -->
<div class="auth-modal" id="loginModal">
  <div class="auth-modal-box">
    <button type="button" class="auth-modal-close" data-modal-close>&times;</button>
    <h2>로그인</h2>
    <form id="loginForm">
      <input type="email" name="email" placeholder="이메일" required />
      <input type="password" name="password" placeholder="비밀번호" required />
      <div class="auth-error" id="loginError"></div>
      <button type="submit">로그인</button>
      <p class="auth-switch">계정이 없으신가요? <a href="#" data-modal-switch="register">회원가입</a></p>
    </form>
  </div>
</div>

<!-- 회원가입 모달 -->
<div class="auth-modal" id="registerModal">
  <div class="auth-modal-box">
    <button type="button" class="auth-modal-close" data-modal-close>&times;</button>
    <h2>회원가입</h2>
    <form id="registerForm">
      <input type="text" name="name" placeholder="이름" required />
      <input type="tel" name="phone" placeholder="연락처 (선택)" />
      <input type="email" name="email" placeholder="이메일" required />
      <input type="password" name="password" placeholder="비밀번호 (4자 이상)" minlength="4" required />
      <label class="auth-agree">
        <input type="checkbox" name="agreePrivacy" required />
        <span><a href="/privacy" target="_blank">개인정보 수집·이용</a>에 동의합니다 (필수)</span>
      </label>
      <label class="auth-agree">
        <input type="checkbox" name="agreeTerms" required />
        <span><a href="/terms" target="_blank">이용약관</a>에 동의합니다 (필수)</span>
      </label>
      <div class="auth-error" id="registerError"></div>
      <button type="submit">가입하기</button>
      <p class="auth-switch">이미 계정이 있으신가요? <a href="#" data-modal-switch="login">로그인</a></p>
    </form>
  </div>
</div>

<style>
.auth-buttons { display: inline-flex; gap: 12px; align-items: center; }
.auth-buttons a, .auth-buttons span { cursor: pointer; font-size: 14px; color: inherit; text-decoration: none; }

/* 로그인 상태별 자동 표시 */
.auth-guest, .auth-user { display: none !important; }
body.is-logged-in .auth-user { display: inline-flex !important; }
body.is-guest .auth-guest { display: inline-flex !important; }
.auth-user-name { font-weight: 700; }

/* 모달 */
.auth-modal { position: fixed; inset: 0; z-index: 10000; display: none; align-items: center; justify-content: center; background: rgba(0,0,0,0.5); backdrop-filter: blur(4px); }
.auth-modal.open { display: flex; }
.auth-modal-box { position: relative; width: 100%; max-width: 400px; margin: 16px; background: #fff; border-radius: 16px; padding: 40px 32px; box-shadow: 0 20px 60px rgba(0,0,0,0.3); }
.auth-modal-box h2 { text-align: center; font-size: 22px; font-weight: 800; color: #18181b; margin: 0 0 24px; }
.auth-modal-close { position: absolute; top: 12px; right: 16px; background: none; border: none; font-size: 28px; color: #a1a1aa; cursor: pointer; line-height: 1; }
.auth-modal-close:hover { color: #18181b; }
.auth-modal-box form { display: flex; flex-direction: column; gap: 12px; }
.auth-modal-box input { border: 1px solid #e4e4e7; background: #fafafa; padding: 14px 16px; border-radius: 10px; font-size: 14px; outline: none; transition: border-color 0.15s; }
.auth-modal-box input:focus { border-color: #2563eb; background: #fff; }
.auth-modal-box button[type="submit"] { background: #2563eb; color: #fff; font-weight: 700; padding: 14px; border-radius: 10px; border: none; font-size: 15px; cursor: pointer; margin-top: 4px; }
.auth-modal-box button[type="submit"]:hover { background: #1d4ed8; }
.auth-modal-box button[type="submit"]:disabled { opacity: 0.6; }
.auth-error { display: none; text-align: center; color: #ef4444; font-size: 13px; font-weight: 700; }
.auth-error.show { display: block; }
.auth-switch { text-align: center; margin: 12px 0 0; font-size: 13px; color: #71717a; }
.auth-switch a { color: #2563eb; font-weight: 700; margin-left: 4px; }
.auth-agree { display: flex; align-items: flex-start; gap: 8px; margin: 4px 0; font-size: 13px; color: #3f3f46; cursor: pointer; }
.auth-agree input { width: 16px; height: 16px; margin-top: 2px; accent-color: #2563eb; }
.auth-agree a { color: #2563eb; text-decoration: underline; }
</style>

<script>
(function(){
  // 로그인 상태 체크
  fetch('/api/auth/me', { credentials: 'same-origin' })
    .then(function(r){ return r.json(); })
    .then(function(d){
      if (d.loggedIn) {
        document.body.classList.add('is-logged-in');
        var n = document.getElementById('userName');
        if (n) n.textContent = ((d.patient && d.patient.name) || '') + '님';
      } else {
        document.body.classList.add('is-guest');
      }
    })
    .catch(function(){ document.body.classList.add('is-guest'); });

  // 모달 열기
  document.querySelectorAll('[data-modal-open]').forEach(function(el){
    el.addEventListener('click', function(e){
      e.preventDefault();
      var id = el.dataset.modalOpen + 'Modal';
      var m = document.getElementById(id);
      if (m) { m.classList.add('open'); document.body.style.overflow = 'hidden'; }
    });
  });

  // 모달 닫기
  document.querySelectorAll('[data-modal-close]').forEach(function(el){
    el.addEventListener('click', function(){
      document.querySelectorAll('.auth-modal').forEach(function(m){ m.classList.remove('open'); });
      document.body.style.overflow = '';
    });
  });
  document.querySelectorAll('.auth-modal').forEach(function(m){
    m.addEventListener('click', function(e){
      if (e.target === m) { m.classList.remove('open'); document.body.style.overflow = ''; }
    });
  });

  // 모달 전환
  document.querySelectorAll('[data-modal-switch]').forEach(function(el){
    el.addEventListener('click', function(e){
      e.preventDefault();
      document.querySelectorAll('.auth-modal').forEach(function(m){ m.classList.remove('open'); });
      var m = document.getElementById(el.dataset.modalSwitch + 'Modal');
      if (m) m.classList.add('open');
    });
  });

  // 로그인 폼
  var loginForm = document.getElementById('loginForm');
  if (loginForm) {
    loginForm.addEventListener('submit', function(e){
      e.preventDefault();
      var err = document.getElementById('loginError');
      err.classList.remove('show');
      var btn = loginForm.querySelector('button[type="submit"]');
      btn.disabled = true;
      fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({ email: loginForm.email.value, password: loginForm.password.value })
      })
      .then(function(r){ return r.json(); })
      .then(function(d){
        if (d.ok) { location.reload(); }
        else { err.textContent = d.error || '로그인 실패'; err.classList.add('show'); btn.disabled = false; }
      })
      .catch(function(){ err.textContent = '네트워크 오류'; err.classList.add('show'); btn.disabled = false; });
    });
  }

  // 회원가입 폼
  var regForm = document.getElementById('registerForm');
  if (regForm) {
    regForm.addEventListener('submit', function(e){
      e.preventDefault();
      var err = document.getElementById('registerError');
      err.classList.remove('show');
      var btn = regForm.querySelector('button[type="submit"]');
      btn.disabled = true;
      fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({ name: regForm.name.value, phone: regForm.phone.value, email: regForm.email.value, password: regForm.password.value })
      })
      .then(function(r){ return r.json(); })
      .then(function(d){
        if (d.ok) { location.reload(); }
        else { err.textContent = d.error || '가입 실패'; err.classList.add('show'); btn.disabled = false; }
      })
      .catch(function(){ err.textContent = '네트워크 오류'; err.classList.add('show'); btn.disabled = false; });
    });
  }

  // 로그아웃
  var logoutBtn = document.getElementById('btnLogout');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', function(e){
      e.preventDefault();
      fetch('/api/auth/logout', { method: 'POST', credentials: 'same-origin' })
        .then(function(){ location.reload(); });
    });
  }
})();
</script>`,
  },
];

function getDefaultHtml(slug) {
  if (slug.endsWith('-detail')) {
    return `<!-- ${BUILTIN_PAGES.find(p => p.slug === slug)?.label ?? slug}
     템플릿 변수: {{post.title}}, {{post.content}}, {{post.date}},
     {{post.boardLabel}}, {{post.listHref}}, {{post.listLabel}} -->

<main style="max-width:1100px;margin:0 auto;min-height:70vh;padding:160px 16px 80px;">
  <div style="border:1px solid #e4e4e7;border-radius:2rem;background:#fff;box-shadow:0 20px 40px -15px rgba(0,0,0,0.05);overflow:hidden;">
    <!-- 헤더 영역 -->
    <div style="border-bottom:1px solid #e4e4e7;padding:32px 40px;">
      <div style="display:flex;flex-wrap:wrap;align-items:center;gap:12px;margin-bottom:16px;">
        <span style="display:inline-block;background:rgba(37,99,235,0.1);color:#2563eb;font-size:12px;font-weight:800;padding:4px 12px;border-radius:9999px;">{{post.boardLabel}}</span>
        <span style="font-size:14px;font-weight:600;color:#a1a1aa;">{{post.date}}</span>
      </div>
      <h1 style="font-size:clamp(1.5rem,4vw,3rem);font-weight:900;color:#18181b;letter-spacing:-0.025em;">{{post.title}}</h1>
    </div>
    <!-- 본문 영역 -->
    <article style="padding:32px 40px;">
      <div style="font-size:15px;line-height:2;color:#3f3f46;">{{post.content}}</div>
    </article>
  </div>
  <!-- 목록으로 버튼 -->
  <div style="margin-top:32px;display:flex;justify-content:flex-end;">
    <a href="{{post.listHref}}" style="display:inline-flex;align-items:center;padding:12px 20px;border:1px solid #d4d4d8;border-radius:8px;font-size:14px;font-weight:700;color:#3f3f46;text-decoration:none;transition:border-color 0.15s;">{{post.listLabel}}</a>
  </div>
</main>`;
  }

  return `<!-- ${BUILTIN_PAGES.find(p => p.slug === slug)?.label ?? slug} 페이지 -->
<section class="page-section">
  <div class="container">
    <h2 class="section-title">제목을 입력하세요</h2>
    <p class="section-desc">내용을 작성해 주세요.</p>
  </div>
</section>`;
}

const DEFAULT_CSS = `/* 이 CSS는 해당 페이지에만 적용됩니다 */

.page-section { padding: 60px 0; }

.container {
  max-width: 1100px;
  margin: 0 auto;
  padding: 0 20px;
}

.section-title {
  font-size: 2rem;
  font-weight: 800;
  color: #18181b;
  margin-bottom: 16px;
}

.section-desc {
  font-size: 1rem;
  color: #71717a;
  line-height: 1.8;
}`;

function getSiteStyles() {
  if (typeof document === 'undefined') return { links: '', inline: '' };
  const origin = window.location.origin;
  const links = [...document.querySelectorAll('link[rel="stylesheet"]')]
    .filter(l => l.href && (l.href.startsWith(origin) || l.href.includes('/_next/')))
    .map(l => `<link rel="stylesheet" href="${l.href}">`)
    .join('\n');
  const inline = [...document.querySelectorAll('style')]
    .map(s => `<style>${s.textContent}</style>`)
    .join('\n');
  return { links, inline };
}

function buildPreviewDoc(html, css, js, siteStyles = { links: '', inline: '' }) {
  // 미리보기 전용 가드: location 변경 차단 + fetch 모킹
  const previewGuard = `
(function(){
  // 페이지 이동 차단 (미리보기 내에서 리다이렉트 방지)
  try {
    var noop = function(){};
    Object.defineProperty(window, 'location', {
      configurable: true,
      get: function(){ return { href: '#preview', pathname: '/preview', search: '', hash: '', reload: noop, assign: noop, replace: noop }; },
      set: function(){}
    });
  } catch(e) {}
  // fetch 모킹 - auth 엔드포인트는 로그인 상태인 척 반환
  var originalFetch = window.fetch;
  window.fetch = function(url, opts){
    var u = String(url || '');
    if (u.indexOf('/api/auth/me') === 0) {
      return Promise.resolve({ ok: true, json: function(){ return Promise.resolve({ loggedIn: true, patient: { id: 0, name: '미리보기', email: 'preview@example.com', phone: '' } }); } });
    }
    if (u.indexOf('/api/auth/') === 0 || u.indexOf('/api/consult') === 0 || u.indexOf('/api/board') === 0) {
      return Promise.resolve({ ok: true, json: function(){ return Promise.resolve({ ok: true, loggedIn: true, patient: {} }); } });
    }
    return originalFetch.apply(this, arguments);
  };
})();
`;

  return `<!DOCTYPE html>
<html lang="ko">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<base href="${typeof window !== 'undefined' ? window.location.origin : ''}/" target="_blank">
${siteStyles.links}
${siteStyles.inline}
<style>
  body { margin: 0; }
  img { max-width: 100%; }
  ${css || ''}
</style>
<script>${previewGuard}</script>
</head>
<body>
${html || ''}
${js?.trim() ? `<script>${js}</script>` : ''}
</body>
</html>`;
}

function AddPageInEditor({ onAdd }) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [saving, setSaving] = useState(false);

  function handleSlug(v) {
    setSlug(v.toLowerCase().replace(/[^a-z0-9-]+/g, '-').replace(/^-+|-+$/g, ''));
  }

  async function handleAdd(e) {
    e.preventDefault();
    if (!title || !slug) return;
    setSaving(true);
    try {
      const res = await fetch('/api/pages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({ slug, title, content: '', custom_css: '', is_published: 1, page_type: 'custom' }),
      });
      if (res.ok) {
        onAdd({ slug, label: title, path: `/${slug}` });
        setOpen(false);
        setTitle('');
        setSlug('');
      }
    } finally {
      setSaving(false);
    }
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="mx-2 mt-2 flex items-center gap-2 rounded-md border border-dashed border-white/10 px-3 py-2 text-xs font-bold text-zinc-500 transition hover:border-white/30 hover:text-blue-400"
      >
        <Icon d={ICONS.plus} size={12} /> 새 페이지 추가
      </button>
    );
  }

  return (
    <form onSubmit={handleAdd} className="mx-2 mt-2 space-y-2 rounded-lg border border-white/10 bg-white/5 p-3">
      <input
        type="text"
        value={title}
        onChange={e => { setTitle(e.target.value); if (!slug) handleSlug(e.target.value); }}
        placeholder="페이지 제목"
        required
        className="w-full rounded-md bg-white/10 px-3 py-2 text-xs text-white placeholder-white/30 outline-none focus:bg-white/15"
      />
      <input
        type="text"
        value={slug}
        onChange={e => handleSlug(e.target.value)}
        placeholder="slug (URL 경로)"
        required
        className="w-full rounded-md bg-white/10 px-3 py-2 text-xs font-mono text-white placeholder-white/30 outline-none focus:bg-white/15"
      />
      <div className="flex gap-2">
        <button type="button" onClick={() => setOpen(false)} className="flex-1 rounded-md bg-white/5 py-1.5 text-xs text-zinc-400 hover:bg-white/10">취소</button>
        <button type="submit" disabled={saving} className="flex-1 rounded-md bg-zinc-700 py-1.5 text-xs font-bold text-white hover:bg-zinc-600 disabled:opacity-50">{saving ? '생성 중...' : '추가'}</button>
      </div>
    </form>
  );
}

export default function PageDesignEditor({ page: initialPage, hospitalName, hospitalId, baseUrl = '', onClose }) {
  const [activePage, setActivePage] = useState(
    initialPage
      ? [...LAYOUT_PAGES, ...BUILTIN_PAGES].find(p => p.slug === initialPage.slug)
        ?? { slug: initialPage.slug, label: initialPage.title || initialPage.slug, path: initialPage.path || `/${initialPage.slug}` }
      : BUILTIN_PAGES[0]
  );
  const [tab, setTab] = useState('html');
  const [html, setHtml] = useState('');
  const [css, setCss] = useState('');
  const [js, setJs] = useState('');
  const [previewDoc, setPreviewDoc] = useState('');
  const [viewMode, setViewMode] = useState('split');
  const [previewDevice, setPreviewDevice] = useState('desktop');
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState(null);
  const [loading, setLoading] = useState(false);
  const [customPages, setCustomPages] = useState([]);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [sidebarPanel, setSidebarPanel] = useState('pages'); // 'pages' | 'blocks'

  const iframeRef = useRef(null);
  const previewTimer = useRef(null);
  const handleSaveRef = useRef(null);
  const monacoEditorRef = useRef(null);

  const loadPage = useCallback(async (slug) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/pages?slug=${encodeURIComponent(slug)}`, { credentials: 'same-origin' });
      const data = await res.json();
      const record = Array.isArray(data) ? data.find(p => p.slug === slug) : null;
      setHtml(record?.content || getDefaultHtml(slug));
      setCss(record?.custom_css || DEFAULT_CSS);
      setJs(record?.custom_js || '');
    } catch {
      setHtml(getDefaultHtml(slug));
      setCss(DEFAULT_CSS);
    } finally {
      setLoading(false);
    }
  }, []);

  // DB에서 전체 페이지 목록 로드 (사이드바용)
  useEffect(() => {
    fetch('/api/pages', { credentials: 'same-origin' })
      .then(r => r.ok ? r.json() : [])
      .then(pages => {
        const builtinSlugs = new Set([...LAYOUT_PAGES, ...BUILTIN_PAGES].map(p => p.slug));
        setCustomPages(
          pages
            .filter(p => !builtinSlugs.has(p.slug))
            .map(p => ({ slug: p.slug, label: p.title || p.slug, path: `/${p.slug}` }))
        );
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    loadPage(activePage.slug);
  }, [activePage.slug, loadPage]);

  useEffect(() => {
    clearTimeout(previewTimer.current);
    previewTimer.current = setTimeout(() => {
      setPreviewDoc(buildPreviewDoc(html, css, js, getSiteStyles()));
    }, 400);
    return () => clearTimeout(previewTimer.current);
  }, [html, css, js]);

  async function handleSave() {
    setSaving(true);
    setSaveMsg(null);
    const pageType = activePage.slug.startsWith('_') ? 'layout' : 'builtin';
    try {
      const res = await fetch('/api/pages', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({
          slug: activePage.slug,
          title: activePage.label,
          content: html,
          custom_css: css,
          custom_js: js,
          page_type: pageType,
          is_published: 1,
        }),
      });

      if (!res.ok) {
        const postRes = await fetch('/api/pages', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'same-origin',
          body: JSON.stringify({
            slug: activePage.slug,
            title: activePage.label,
            content: html,
            custom_css: css,
            custom_js: js,
            page_type: pageType,
            is_published: 1,
          }),
        });
        if (!postRes.ok) throw new Error('저장 실패');
      }
      setSaveMsg({ ok: true, text: '저장되었습니다.' });
    } catch (err) {
      setSaveMsg({ ok: false, text: err.message || '저장 실패' });
    } finally {
      setSaving(false);
      setTimeout(() => setSaveMsg(null), 2500);
    }
  }

  handleSaveRef.current = handleSave;
  useEffect(() => {
    function onKeyDown(e) {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        handleSaveRef.current();
      }
    }
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  function refreshPreview() {
    setPreviewDoc(buildPreviewDoc(html, css, js, getSiteStyles()));
  }

  // 스니펫 블록을 현재 커서 위치 또는 HTML 끝에 삽입
  function insertSnippet(snippet) {
    // HTML 탭이 아니면 전환
    if (tab !== 'html') setTab('html');

    const editor = monacoEditorRef.current;
    if (editor) {
      const selection = editor.getSelection();
      const id = { major: 1, minor: 1 };
      const op = {
        identifier: id,
        range: selection,
        text: (selection && !selection.isEmpty() ? '' : '\n\n') + snippet.html + '\n',
        forceMoveMarkers: true,
      };
      editor.executeEdits('insert-snippet', [op]);
      editor.focus();
    } else {
      setHtml(prev => `${prev}\n\n${snippet.html}\n`);
    }
  }

  const previewWidth = previewDevice === 'mobile' ? '390px' : '100%';
  const pageGroups = useMemo(() => ([
    { key: 'layout',  title: '레이아웃',     items: LAYOUT_PAGES },
    { key: 'builtin', title: '기본 페이지',  items: BUILTIN_PAGES },
    ...(customPages.length ? [{ key: 'custom', title: '커스텀 페이지', items: customPages }] : []),
  ]), [customPages]);

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-[#1a1a1a] text-white">

      {/* ── 상단 툴바 ── */}
      <div className="flex h-14 shrink-0 items-center gap-3 border-b border-white/10 bg-gradient-to-r from-[#1f1f23] to-[#26262c] px-4">

        {/* 사이드바 토글 */}
        <button
          onClick={() => setSidebarCollapsed(v => !v)}
          title={sidebarCollapsed ? '사이드바 펼치기' : '사이드바 접기'}
          className="flex h-8 w-8 items-center justify-center rounded-md text-zinc-400 hover:bg-white/5 hover:text-white transition"
        >
          <Icon d={sidebarCollapsed ? ICONS.sidebarExpand : ICONS.sidebarCollapse} size={16} />
        </button>

        {/* 브랜드 */}
        <div className="flex items-center gap-2">
          <div className="h-6 w-6 rounded-md bg-gradient-to-br from-white to-zinc-300" />
          <div className="leading-tight">
            <div className="text-[11px] font-black tracking-wider text-white/90">METALINK CMS</div>
            <div className="text-[9px] text-zinc-500">Page Builder</div>
          </div>
        </div>

        <div className="mx-1 h-6 w-px bg-white/10" />

        {/* 현재 페이지 표시 */}
        <div className="flex items-center gap-2">
          <span className="text-[11px] text-zinc-500">편집 중</span>
          <span className="text-sm font-bold text-white">{activePage.label}</span>
          <span className="rounded bg-white/5 px-1.5 py-0.5 font-mono text-[10px] text-zinc-400">
            {activePage.path}
          </span>
        </div>

        <div className="flex-1" />

        {/* HTML / CSS / JS 탭 */}
        <div className="flex rounded-lg bg-black/30 p-1 ring-1 ring-white/5">
          {[
            { id: 'html', label: 'HTML', color: 'bg-white text-zinc-900' },
            { id: 'css',  label: 'CSS',  color: 'bg-white text-zinc-900' },
            { id: 'js',   label: 'JS',   color: 'bg-yellow-500' },
          ].map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`rounded-md px-3 py-1.5 text-xs font-bold transition ${
                tab === t.id
                  ? `${t.color} text-white shadow-lg`
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* 뷰 모드 */}
        <div className="flex rounded-lg bg-black/30 p-1 ring-1 ring-white/5">
          {[
            { id: 'editor',  icon: ICONS.full,    label: '에디터' },
            { id: 'split',   icon: ICONS.split,   label: '분할' },
            { id: 'preview', icon: ICONS.preview, label: '미리보기' },
          ].map(v => (
            <button
              key={v.id}
              onClick={() => setViewMode(v.id)}
              title={v.label}
              className={`rounded-md px-2.5 py-1.5 transition ${
                viewMode === v.id ? 'bg-white/15 text-white' : 'text-zinc-500 hover:text-zinc-300'
              }`}
            >
              <Icon d={v.icon} size={14} />
            </button>
          ))}
        </div>

        {/* 디바이스 */}
        {viewMode !== 'editor' && (
          <div className="flex rounded-lg bg-black/30 p-1 ring-1 ring-white/5">
            <button
              onClick={() => setPreviewDevice('desktop')}
              title="데스크탑"
              className={`rounded-md px-2.5 py-1.5 transition ${
                previewDevice === 'desktop' ? 'bg-white/15 text-white' : 'text-zinc-500 hover:text-zinc-300'
              }`}
            >
              <Icon d={ICONS.desktop} size={14} />
            </button>
            <button
              onClick={() => setPreviewDevice('mobile')}
              title="모바일 (390px)"
              className={`rounded-md px-2.5 py-1.5 transition ${
                previewDevice === 'mobile' ? 'bg-white/15 text-white' : 'text-zinc-500 hover:text-zinc-300'
              }`}
            >
              <Icon d={ICONS.mobile} size={14} />
            </button>
          </div>
        )}

        <button
          onClick={refreshPreview}
          title="프리뷰 새로고침"
          className="rounded-md p-2 text-zinc-500 hover:bg-white/5 hover:text-zinc-300 transition"
        >
          <Icon d={ICONS.refresh} size={14} />
        </button>

        <div className="mx-1 h-6 w-px bg-white/10" />

        {/* 저장 메시지 */}
        {saveMsg && (
          <span className={`rounded-md px-2 py-1 text-xs font-bold ${
            saveMsg.ok ? 'bg-emerald-500/10 text-emerald-400 ring-1 ring-emerald-500/20'
                       : 'bg-red-500/10 text-red-400 ring-1 ring-red-500/20'
          }`}>
            {saveMsg.text}
          </span>
        )}

        {/* 저장 버튼 */}
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-1.5 rounded-lg bg-gradient-to-b from-zinc-700 to-zinc-900 px-4 py-1.5 text-xs font-black text-white shadow-lg shadow-zinc-900/40 transition hover:brightness-110 disabled:opacity-60"
        >
          <Icon d={ICONS.save} size={13} />
          {saving ? '저장 중...' : '저장'}
          <span className="ml-1 hidden rounded bg-black/20 px-1 font-mono text-[9px] sm:inline">Ctrl+S</span>
        </button>

        {/* 닫기 */}
        <button
          onClick={onClose}
          className="rounded-md p-2 text-zinc-500 hover:bg-red-500/20 hover:text-red-400 transition"
          title="편집기 닫기"
        >
          <Icon d={ICONS.close} size={16} />
        </button>
      </div>

      {/* ── 메인 영역 ── */}
      <div className="flex flex-1 overflow-hidden">

        {/* ── 좌측 사이드바 ── */}
        {!sidebarCollapsed && (
          <aside className="flex w-64 shrink-0 flex-col border-r border-white/10 bg-[#17171a]">
            {/* 사이드바 탭 */}
            <div className="flex shrink-0 border-b border-white/10">
              <button
                onClick={() => setSidebarPanel('pages')}
                className={`flex flex-1 items-center justify-center gap-2 py-3 text-xs font-bold transition ${
                  sidebarPanel === 'pages'
                    ? 'border-b-2 border-white text-white'
                    : 'border-b-2 border-transparent text-zinc-500 hover:text-zinc-300'
                }`}
              >
                <Icon d={ICONS.layers} size={13} />
                페이지
              </button>
              <button
                onClick={() => setSidebarPanel('blocks')}
                className={`flex flex-1 items-center justify-center gap-2 py-3 text-xs font-bold transition ${
                  sidebarPanel === 'blocks'
                    ? 'border-b-2 border-white text-white'
                    : 'border-b-2 border-transparent text-zinc-500 hover:text-zinc-300'
                }`}
              >
                <Icon d={ICONS.blocks} size={13} />
                블록
              </button>
            </div>

            {/* 사이드바 콘텐츠 */}
            <div className="flex-1 overflow-y-auto">
              {sidebarPanel === 'pages' && (
                <div className="flex flex-col gap-5 px-3 py-4">
                  {pageGroups.map(group => (
                    <div key={group.key}>
                      <div className="mb-2 px-2 text-[10px] font-bold uppercase tracking-wider text-zinc-500">
                        {group.title}
                      </div>
                      <div className="flex flex-col gap-0.5">
                        {group.items.map(p => {
                          const active = p.slug === activePage.slug;
                          return (
                            <button
                              key={p.slug}
                              onClick={() => setActivePage(p)}
                              className={`group flex items-center gap-2 rounded-md px-2 py-2 text-left text-xs transition ${
                                active
                                  ? 'bg-white text-zinc-900'
                                  : 'text-zinc-400 hover:bg-white/5 hover:text-white'
                              }`}
                            >
                              <span className={`h-1.5 w-1.5 rounded-full ${
                                active ? 'bg-white' : 'bg-zinc-700 group-hover:bg-zinc-500'
                              }`} />
                              <span className="flex-1 font-semibold">{p.label || p.slug}</span>
                              <span className="font-mono text-[9px] text-zinc-600">{p.path}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ))}

                  {/* 새 페이지 추가 */}
                  <AddPageInEditor onAdd={(newPage) => {
                    setCustomPages(prev => [...prev, newPage]);
                    setActivePage(newPage);
                  }} />
                </div>
              )}

              {sidebarPanel === 'blocks' && (
                <div className="flex flex-col gap-2 p-3">
                  <div className="mb-1 px-1 text-[10px] font-bold uppercase tracking-wider text-zinc-500">
                    클릭하여 HTML에 삽입
                  </div>
                  {BLOCK_SNIPPETS.filter(block => !block.kda21Only || Number(hospitalId) === 7).map(block => (
                    <button
                      key={block.id}
                      onClick={() => insertSnippet(block)}
                      className="group flex items-start gap-3 rounded-lg border border-white/5 bg-white/[0.02] px-3 py-2.5 text-left transition hover:border-white/30 hover:bg-zinc-600/5"
                    >
                      <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-white/5 text-zinc-400 group-hover:bg-zinc-600/20 group-hover:text-blue-400 transition">
                        <Icon d={block.icon} size={14} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="text-xs font-bold text-white">{block.label}</div>
                        <div className="truncate text-[10px] text-zinc-500">{block.desc}</div>
                      </div>
                      <Icon d={ICONS.plus} size={12} className="mt-1 text-zinc-600 group-hover:text-blue-400 transition" />
                    </button>
                  ))}
                  <div className="mt-2 rounded-md border border-dashed border-white/10 px-3 py-2 text-[10px] text-zinc-500">
                    블록을 클릭하면 HTML 편집기의 커서 위치에 코드가 삽입됩니다.
                  </div>
                </div>
              )}
            </div>

            {/* 사이드바 푸터 */}
            <div className="shrink-0 border-t border-white/10 px-3 py-2.5 text-[10px] text-zinc-500">
              {hospitalName && (
                <div className="flex items-center gap-1.5">
                  <Icon d={ICONS.dot} size={10} className="text-emerald-400" />
                  <span className="truncate font-semibold text-zinc-400">{hospitalName}</span>
                </div>
              )}
            </div>
          </aside>
        )}

        {/* ── 에디터 + 프리뷰 ── */}
        <div className="flex flex-1 overflow-hidden">

          {/* 에디터 패널 */}
          {viewMode !== 'preview' && (
            <div className={`flex flex-col bg-[#1e1e1e] ${viewMode === 'split' ? 'w-1/2' : 'w-full'} border-r border-white/10`}>
              {/* 파일 경로 바 */}
              <div className="flex h-9 shrink-0 items-center gap-2 border-b border-white/5 bg-[#181818] px-4">
                <div className={`h-1.5 w-1.5 rounded-full ${
                  tab === 'html' ? 'bg-white' : tab === 'css' ? 'bg-white' : 'bg-yellow-400'
                }`} />
                <span className="text-[11px] font-semibold text-zinc-400">
                  {tab === 'html' ? 'content.html' : tab === 'css' ? 'custom.css' : 'custom.js'}
                </span>
                <span className="text-[11px] text-zinc-600">—</span>
                <span className="text-[11px] text-zinc-600">{activePage.path}</span>
                {loading && <span className="ml-auto text-[11px] text-zinc-500 animate-pulse">불러오는 중...</span>}
              </div>

              <div className="flex-1">
                <MonacoEditor
                  height="100%"
                  language={tab === 'html' ? 'html' : tab === 'css' ? 'css' : 'javascript'}
                  theme="vs-dark"
                  value={tab === 'html' ? html : tab === 'css' ? css : js}
                  onChange={val => tab === 'html' ? setHtml(val ?? '') : tab === 'css' ? setCss(val ?? '') : setJs(val ?? '')}
                  onMount={(editor) => { monacoEditorRef.current = editor; }}
                  options={{
                    fontSize: 13,
                    lineHeight: 22,
                    minimap: { enabled: false },
                    scrollBeyondLastLine: false,
                    wordWrap: 'on',
                    automaticLayout: true,
                    tabSize: 2,
                    formatOnPaste: true,
                    suggestOnTriggerCharacters: true,
                    quickSuggestions: true,
                    folding: true,
                    renderLineHighlight: 'line',
                    padding: { top: 12, bottom: 12 },
                  }}
                />
              </div>
            </div>
          )}

          {/* 프리뷰 패널 */}
          {viewMode !== 'editor' && (
            <div className={`flex flex-col bg-[#0f0f11] ${viewMode === 'split' ? 'w-1/2' : 'w-full'}`}>
              {/* 프리뷰 헤더 (브라우저 바 느낌) */}
              <div className="flex h-9 shrink-0 items-center gap-2 border-b border-white/10 bg-[#141418] px-3">
                <div className="flex gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-full bg-red-500/70" />
                  <span className="h-2.5 w-2.5 rounded-full bg-yellow-500/70" />
                  <span className="h-2.5 w-2.5 rounded-full bg-emerald-500/70" />
                </div>
                <div className="ml-2 flex flex-1 items-center gap-2 rounded-md bg-black/40 px-3 py-1 ring-1 ring-white/5">
                  <Icon d={ICONS.preview} size={11} className="text-zinc-500" />
                  <span className="truncate text-[11px] font-mono text-zinc-400">
                    {baseUrl || 'https://preview'}{activePage.path === '_header' || activePage.path === '_footer' || activePage.path === '_consult' ? `#${activePage.path}` : activePage.path}
                  </span>
                </div>
                <span className="text-[10px] font-bold text-zinc-500">
                  {previewDevice === 'mobile' ? '390 × —' : 'Desktop'}
                </span>
              </div>

              {/* 프리뷰 캔버스 */}
              <div className="flex flex-1 items-start justify-center overflow-auto bg-gradient-to-br from-[#1a1a1f] to-[#0f0f11] p-6">
                <div
                  style={{
                    width: previewWidth,
                    maxWidth: '100%',
                    transition: 'width 0.3s',
                  }}
                  className={`h-full min-h-[500px] overflow-hidden bg-white shadow-[0_20px_60px_rgba(0,0,0,0.6)] ${
                    previewDevice === 'mobile' ? 'rounded-[28px] ring-[6px] ring-zinc-900' : 'rounded-lg ring-1 ring-white/10'
                  }`}
                >
                  <iframe
                    ref={iframeRef}
                    srcDoc={previewDoc}
                    title="페이지 미리보기"
                    className="h-full w-full"
                    style={{ minHeight: '600px', border: 'none' }}
                    sandbox="allow-scripts allow-same-origin"
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── 하단 상태바 ── */}
      <div className="flex h-7 shrink-0 items-center gap-3 border-t border-white/5 bg-[#0f0f11] px-4 text-[11px] text-zinc-500">
        <span className="flex items-center gap-1.5 font-bold text-zinc-400">
          <Icon d={ICONS.dot} size={8} className="text-emerald-400" />
          연결됨
        </span>
        <span className="text-white/10">|</span>
        <span>{activePage.label} <span className="text-zinc-600">({activePage.path})</span></span>
        <span className="text-white/10">|</span>
        <span>{tab === 'html' ? 'HTML' : tab === 'css' ? 'CSS' : 'JavaScript'} 편집 중</span>
        <div className="flex-1" />
        <span className="rounded bg-white/5 px-1.5 py-0.5 font-mono text-[10px]">Ctrl + S</span>
        <span>저장</span>
      </div>
    </div>
  );
}
