// 서울365열린치과(hospital_id=10) 백과사전 UI/UX 리브랜딩 v2
// - encyclopedia (목록) / encyclopedia-doc (문서) content 전체 교체
// - _footer 의 ENC-GLOSSARY-CSS/JS v1 센티넬 블록을 서울365 디자인으로 교체 (멱등)
// - hospital_id=10 외 절대 영향 없음. 다른 페이지 미접촉.
// - 디자인: 서울365 청록(#004b76) + Pretendard + s365-enc-* 네임스페이스
//
// 사용: node patch-seoul365-encyclopedia-ui.mjs ./wonjudental.db

import sqlite3 from 'sqlite3';

const HOSPITAL_ID = 10;
const HOSPITAL_SLUG_GUARD = 'seoul365opendental';
const GROUP_SLUG = 'seoul365-encyclopedia';
const DB_PATH = process.argv[2] || './wonjudental.db';

const CSS_START = '/* ENC-GLOSSARY-CSS v1 START */';
const CSS_END   = '/* ENC-GLOSSARY-CSS v1 END */';
const JS_START  = '/* ENC-GLOSSARY-JS v1 START */';
const JS_END    = '/* ENC-GLOSSARY-JS v1 END */';

// ── 목록 페이지 (encyclopedia) ─────────────────────────────────────────────
const LIST_BLOCK_HTML = `<div id="s365-enc-list" class="s365-enc-list">
  <div class="s365-enc-hero">
    <p class="s365-enc-kicker">SEOUL 365 · DENTAL ENCYCLOPEDIA</p>
    <h1 class="s365-enc-title">치과 백과사전</h1>
    <p class="s365-enc-sub">서울365열린치과가 검수·관리하는 치과 용어 사전입니다.<br>카테고리·초성·검색으로 빠르게 찾아보세요.</p>
    <div class="s365-enc-search-wrap">
      <svg class="s365-enc-search-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="7"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
      <input id="s365-enc-q" class="s365-enc-search" type="search" placeholder="용어 검색 (예: 임플란트, 사랑니, 디지털 미소디자인)" autocomplete="off" />
    </div>
  </div>

  <div class="s365-enc-toolbar">
    <div id="s365-enc-cho" class="s365-enc-cho" role="tablist" aria-label="초성으로 거르기"></div>
  </div>

  <div class="s365-enc-body">
    <aside id="s365-enc-cats" class="s365-enc-cats" aria-label="카테고리"></aside>
    <main id="s365-enc-content" class="s365-enc-content">
      <div class="s365-enc-empty">불러오는 중…</div>
    </main>
  </div>
</div>
<style>
@import url('https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/static/pretendard.min.css');
.s365-enc-list{--s365-pri:#004b76;--s365-pri-deep:#00395f;--s365-pri-soft:#e6eef3;--s365-bd:#e4e8eb;--s365-tx:#202020;--s365-mu:#6b7280;--s365-mu2:#9ca3af;font-family:'Pretendard','NanumSquare',-apple-system,BlinkMacSystemFont,sans-serif;color:var(--s365-tx);word-break:keep-all;max-width:1280px;margin:0 auto;padding:120px 28px 80px;box-sizing:border-box;}
.s365-enc-list *{box-sizing:border-box;}
.s365-enc-hero{padding:0 0 36px;border-bottom:1px solid var(--s365-bd);margin-bottom:28px;}
.s365-enc-kicker{font-size:12px;letter-spacing:.18em;color:var(--s365-pri);font-weight:700;margin:0 0 14px;}
.s365-enc-title{font-size:clamp(2rem,4.4vw,2.8rem);font-weight:800;color:var(--s365-tx);margin:0 0 14px;letter-spacing:-.02em;line-height:1.2;}
.s365-enc-sub{font-size:15px;color:var(--s365-mu);line-height:1.7;margin:0 0 24px;}
.s365-enc-search-wrap{position:relative;max-width:540px;}
.s365-enc-search-icon{position:absolute;left:18px;top:50%;transform:translateY(-50%);color:var(--s365-mu2);pointer-events:none;}
.s365-enc-search{width:100%;padding:15px 18px 15px 48px;border:1.5px solid var(--s365-bd);border-radius:12px;background:#fff;font-size:15px;font-family:inherit;color:var(--s365-tx);outline:none;transition:border-color .18s ease,box-shadow .18s ease;}
.s365-enc-search:focus{border-color:var(--s365-pri);box-shadow:0 0 0 4px rgba(0,75,118,.08);}
.s365-enc-search::placeholder{color:var(--s365-mu2);}
.s365-enc-toolbar{margin-bottom:24px;}
.s365-enc-cho{display:flex;flex-wrap:wrap;gap:6px;}
.s365-enc-cho-chip{min-width:38px;padding:8px 12px;border:1px solid var(--s365-bd);background:#fff;color:var(--s365-tx);font-size:13px;font-weight:600;font-family:inherit;border-radius:8px;cursor:pointer;transition:all .15s ease;text-align:center;}
.s365-enc-cho-chip:hover{border-color:var(--s365-pri);color:var(--s365-pri);}
.s365-enc-cho-chip.on{background:var(--s365-pri);border-color:var(--s365-pri);color:#fff;}
.s365-enc-body{display:grid;grid-template-columns:240px 1fr;gap:36px;align-items:start;}
.s365-enc-cats{position:sticky;top:96px;background:#fff;border:1px solid var(--s365-bd);border-radius:12px;padding:18px 8px;max-height:calc(100vh - 120px);overflow-y:auto;}
.s365-enc-cats-hd{font-size:12px;font-weight:700;color:var(--s365-mu);padding:4px 14px 12px;letter-spacing:.05em;text-transform:uppercase;}
.s365-enc-cat{display:flex;align-items:center;justify-content:space-between;width:100%;padding:11px 14px;background:none;border:none;color:var(--s365-tx);font-size:14px;font-family:inherit;font-weight:600;cursor:pointer;border-radius:8px;text-align:left;transition:all .15s ease;}
.s365-enc-cat:hover{background:var(--s365-pri-soft);color:var(--s365-pri);}
.s365-enc-cat.on{background:var(--s365-pri);color:#fff;}
.s365-enc-cat.on .s365-enc-cat-cnt{color:rgba(255,255,255,.78);}
.s365-enc-cat-cnt{color:var(--s365-mu2);font-size:12px;font-weight:700;font-variant-numeric:tabular-nums;}
.s365-enc-content{min-width:0;}
.s365-enc-group{margin-bottom:36px;}
.s365-enc-group-hd{display:flex;align-items:baseline;gap:12px;margin-bottom:14px;padding-bottom:10px;border-bottom:2px solid var(--s365-pri);}
.s365-enc-group-ttl{font-size:20px;font-weight:800;color:var(--s365-pri-deep);margin:0;letter-spacing:-.01em;}
.s365-enc-group-cnt{font-size:13px;color:var(--s365-mu);font-weight:600;}
.s365-enc-terms{display:grid;grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:2px 28px;list-style:none;margin:0;padding:0;}
.s365-enc-term{margin:0;}
.s365-enc-term a{display:flex;align-items:baseline;gap:10px;padding:11px 0;color:var(--s365-tx);text-decoration:none;font-size:15px;font-weight:500;border-bottom:1px dotted transparent;transition:all .15s ease;line-height:1.4;}
.s365-enc-term a::before{content:'·';color:var(--s365-pri);font-weight:800;flex-shrink:0;}
.s365-enc-term a:hover{color:var(--s365-pri);border-bottom-color:var(--s365-pri-soft);transform:translateX(2px);}
.s365-enc-empty{grid-column:1/-1;text-align:center;padding:80px 0;color:var(--s365-mu2);font-size:14px;}
.s365-enc-empty.err{color:#dc2626;}
@media(max-width:880px){
  .s365-enc-list{padding:100px 20px 60px;}
  .s365-enc-body{grid-template-columns:1fr;gap:20px;}
  .s365-enc-cats{position:static;max-height:none;overflow-x:auto;overflow-y:visible;padding:10px;display:flex;gap:6px;-webkit-overflow-scrolling:touch;}
  .s365-enc-cats-hd{display:none;}
  .s365-enc-cat{flex:0 0 auto;padding:9px 14px;font-size:13px;border:1px solid var(--s365-bd);border-radius:9999px;white-space:nowrap;}
  .s365-enc-cat-cnt{display:none;}
  .s365-enc-terms{grid-template-columns:1fr;gap:0;}
  .s365-enc-group-ttl{font-size:17px;}
}
</style>
<script>
(function(){
  var boardSlug = '${GROUP_SLUG}';
  var docPath = '/encyclopedia-doc';
  var root = document.getElementById('s365-enc-list');
  if(!root) return;
  var contentEl = document.getElementById('s365-enc-content');
  var catsEl = document.getElementById('s365-enc-cats');
  var choEl = document.getElementById('s365-enc-cho');
  var qInput = document.getElementById('s365-enc-q');

  var CHO = ['ㄱ','ㄴ','ㄷ','ㄹ','ㅁ','ㅂ','ㅅ','ㅇ','ㅈ','ㅊ','ㅋ','ㅌ','ㅍ','ㅎ'];
  var CHO_FULL = ['ㄱ','ㄲ','ㄴ','ㄷ','ㄸ','ㄹ','ㅁ','ㅂ','ㅃ','ㅅ','ㅆ','ㅇ','ㅈ','ㅉ','ㅊ','ㅋ','ㅌ','ㅍ','ㅎ'];
  var FOLD = {'ㄲ':'ㄱ','ㄸ':'ㄷ','ㅃ':'ㅂ','ㅆ':'ㅅ','ㅉ':'ㅈ'};
  function chosung(name){
    if(!name) return '#';
    var c = name.charCodeAt(0);
    if(c < 0xAC00 || c > 0xD7A3) return '#';
    var ch = CHO_FULL[Math.floor((c - 0xAC00) / 588)];
    return FOLD[ch] || ch;
  }
  function esc(s){ return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }

  var items = [], selCat = '전체', selCho = '전체', q = '';

  function parseTitle(t){
    var m = String(t || '').match(/^\\s*\\[([^\\]]+)\\]\\s*(.+)$/);
    if(m) return { cat: m[1].trim(), name: m[2].trim() };
    return { cat: '기타', name: String(t || '').trim() };
  }

  function renderCats(){
    var counts = {};
    items.forEach(function(it){ counts[it.cat] = (counts[it.cat] || 0) + 1; });
    var cats = Object.keys(counts).sort(function(a,b){ return counts[b] - counts[a]; });
    var html = '<div class="s365-enc-cats-hd">카테고리</div>';
    html += '<button type="button" class="s365-enc-cat' + (selCat==='전체'?' on':'') + '" data-cat="전체">전체<span class="s365-enc-cat-cnt">' + items.length + '</span></button>';
    cats.forEach(function(c){
      html += '<button type="button" class="s365-enc-cat' + (selCat===c?' on':'') + '" data-cat="' + esc(c) + '">' + esc(c) + '<span class="s365-enc-cat-cnt">' + counts[c] + '</span></button>';
    });
    catsEl.innerHTML = html;
    [].slice.call(catsEl.querySelectorAll('.s365-enc-cat')).forEach(function(b){
      b.addEventListener('click', function(){ selCat = b.getAttribute('data-cat'); renderCats(); renderContent(); });
    });
  }

  function renderCho(){
    var html = '';
    var choList = ['전체'].concat(CHO).concat(['#']);
    choList.forEach(function(c){
      html += '<button type="button" class="s365-enc-cho-chip' + (selCho===c?' on':'') + '" data-cho="' + esc(c) + '">' + esc(c) + '</button>';
    });
    choEl.innerHTML = html;
    [].slice.call(choEl.querySelectorAll('.s365-enc-cho-chip')).forEach(function(b){
      b.addEventListener('click', function(){ selCho = b.getAttribute('data-cho'); renderCho(); renderContent(); });
    });
  }

  function renderContent(){
    var qq = q.trim().toLowerCase();
    var list = items.filter(function(it){
      if(selCat !== '전체' && it.cat !== selCat) return false;
      if(selCho !== '전체' && chosung(it.name) !== selCho) return false;
      if(qq && it.name.toLowerCase().indexOf(qq) < 0 && it.cat.toLowerCase().indexOf(qq) < 0) return false;
      return true;
    });
    if(!list.length){ contentEl.innerHTML = '<div class="s365-enc-empty">조건에 맞는 용어가 없습니다.</div>'; return; }

    // 카테고리별 그룹화 (선택된 카테고리가 '전체'면 모든 카테고리, 아니면 단일 그룹)
    var groups = {};
    list.forEach(function(it){ (groups[it.cat] = groups[it.cat] || []).push(it); });
    var catOrder = Object.keys(groups).sort(function(a,b){ return groups[b].length - groups[a].length; });

    var html = '';
    catOrder.forEach(function(cat){
      var arr = groups[cat].slice().sort(function(a,b){ return a.name.localeCompare(b.name,'ko'); });
      html += '<section class="s365-enc-group">';
      html += '<div class="s365-enc-group-hd"><h2 class="s365-enc-group-ttl">' + esc(cat) + '</h2><span class="s365-enc-group-cnt">' + arr.length + '건</span></div>';
      html += '<ul class="s365-enc-terms">';
      arr.forEach(function(it){
        html += '<li class="s365-enc-term"><a href="' + docPath + '?postId=' + it.id + '">' + esc(it.name) + '</a></li>';
      });
      html += '</ul></section>';
    });
    contentEl.innerHTML = html;
  }

  qInput.addEventListener('input', function(){ q = qInput.value; renderContent(); });
  try {
    var h = decodeURIComponent((location.hash || '').replace(/^#q=/, ''));
    if(h && location.hash.indexOf('#q=') === 0){ q = h; qInput.value = h; }
  } catch(e){}

  fetch('/api/board?type=board&groupSlug=' + boardSlug)
    .then(function(r){ return r.json(); })
    .then(function(posts){
      if(!Array.isArray(posts) || !posts.length){ contentEl.innerHTML = '<div class="s365-enc-empty">등록된 용어가 없습니다.</div>'; return; }
      items = posts.map(function(p){ var pt = parseTitle(p.title); return { id: p.id, cat: pt.cat, name: pt.name }; });
      renderCats(); renderCho(); renderContent();
    })
    .catch(function(){ contentEl.innerHTML = '<div class="s365-enc-empty err">목록을 불러올 수 없습니다.</div>'; });
})();
</script>`;

// ── 문서 페이지 (encyclopedia-doc) ──────────────────────────────────────────
const DOC_BLOCK_HTML = `<div id="s365-enc-doc" class="s365-enc-doc"><div class="s365-enc-doc-loading">불러오는 중…</div></div>
<style>
@import url('https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/static/pretendard.min.css');
.s365-enc-doc{--s365-pri:#004b76;--s365-pri-deep:#00395f;--s365-pri-soft:#e6eef3;--s365-bd:#e4e8eb;--s365-tx:#202020;--s365-mu:#6b7280;--s365-mu2:#9ca3af;font-family:'Pretendard','NanumSquare',-apple-system,BlinkMacSystemFont,sans-serif;color:var(--s365-tx);word-break:keep-all;max-width:1180px;margin:0 auto;padding:120px 28px 100px;box-sizing:border-box;}
.s365-enc-doc *{box-sizing:border-box;}
.s365-enc-doc-loading{text-align:center;padding:100px 0;color:var(--s365-mu2);font-size:14px;}
.s365-enc-doc-back{display:inline-flex;align-items:center;gap:8px;font-size:13px;color:var(--s365-mu);text-decoration:none;margin-bottom:24px;font-weight:600;letter-spacing:.02em;transition:color .15s ease;}
.s365-enc-doc-back:hover{color:var(--s365-pri);}
.s365-enc-doc-head{padding-bottom:24px;border-bottom:2px solid var(--s365-pri);margin-bottom:36px;}
.s365-enc-doc-cat{display:inline-block;font-size:11px;font-weight:700;color:var(--s365-pri);background:var(--s365-pri-soft);padding:5px 12px;border-radius:9999px;margin-bottom:14px;letter-spacing:.05em;}
.s365-enc-doc-title{font-size:clamp(1.8rem,4.5vw,2.6rem);font-weight:800;color:var(--s365-tx);margin:0 0 12px;letter-spacing:-.02em;line-height:1.2;}
.s365-enc-doc-meta{font-size:13px;color:var(--s365-mu);margin:0;}
.s365-enc-doc-meta-sep{display:inline-block;width:1px;height:11px;background:var(--s365-bd);margin:0 10px;vertical-align:middle;}
.s365-enc-doc-grid{display:grid;grid-template-columns:240px 1fr;gap:48px;align-items:start;}
.s365-enc-toc{position:sticky;top:96px;background:var(--s365-pri-soft);border-radius:12px;padding:20px 22px;max-height:calc(100vh - 120px);overflow-y:auto;}
.s365-enc-toc-hd{display:flex;justify-content:space-between;align-items:center;font-size:12px;font-weight:700;color:var(--s365-pri-deep);letter-spacing:.1em;text-transform:uppercase;margin-bottom:12px;}
.s365-enc-toc-tg{background:none;border:none;color:var(--s365-mu);font-size:11px;font-weight:700;cursor:pointer;font-family:inherit;padding:0;}
.s365-enc-toc-tg:hover{color:var(--s365-pri);}
.s365-enc-toc ol{list-style:none;margin:0;padding:0;}
.s365-enc-toc li{margin:7px 0;font-size:13px;line-height:1.5;}
.s365-enc-toc a{color:var(--s365-tx);text-decoration:none;transition:color .15s ease;display:block;padding:2px 0;}
.s365-enc-toc a:hover{color:var(--s365-pri);}
.s365-enc-toc .n{color:var(--s365-mu2);margin-right:6px;font-variant-numeric:tabular-nums;font-weight:600;}
.s365-enc-doc-body{font-size:16px;line-height:1.85;color:#37404a;min-width:0;}
.s365-enc-doc-body h2,.s365-enc-doc-body h3,.s365-enc-doc-body h4{color:var(--s365-tx);font-weight:800;line-height:1.3;scroll-margin-top:96px;letter-spacing:-.01em;}
.s365-enc-doc-body h2{font-size:1.45rem;margin:44px 0 18px;padding-bottom:10px;border-bottom:1px solid var(--s365-bd);position:relative;}
.s365-enc-doc-body h2::before{content:'';position:absolute;left:-14px;top:8px;bottom:14px;width:4px;background:var(--s365-pri);border-radius:2px;}
.s365-enc-doc-body h3{font-size:1.15rem;margin:30px 0 12px;color:var(--s365-pri-deep);}
.s365-enc-doc-body h4{font-size:1.02rem;margin:22px 0 10px;}
.s365-enc-doc-body .hn{color:var(--s365-mu2);font-weight:700;margin-right:8px;}
.s365-enc-doc-body p{margin:14px 0;}
.s365-enc-doc-body img{max-width:100%;height:auto;border-radius:10px;}
.s365-enc-fn{font-size:.72em;vertical-align:super;line-height:0;}
.s365-enc-fn a{color:var(--s365-pri);text-decoration:none;font-weight:700;padding:0 1px;}
.s365-enc-fn a:hover{text-decoration:underline;}
.s365-enc-rel-link{color:var(--s365-pri);text-decoration:none;border-bottom:1px dashed rgba(0,75,118,.45);padding:0 1px;transition:background .15s ease;}
.s365-enc-rel-link:hover{background:var(--s365-pri-soft);}
.s365-enc-sec{margin-top:48px;padding-top:24px;border-top:1px solid var(--s365-bd);}
.s365-enc-sec h3{font-size:14px;font-weight:700;color:var(--s365-mu);margin:0 0 16px;letter-spacing:.08em;text-transform:uppercase;}
.s365-enc-fns{list-style:none;padding:0;margin:0;font-size:13.5px;color:var(--s365-mu);}
.s365-enc-fns li{margin:8px 0;display:flex;gap:8px;line-height:1.6;}
.s365-enc-fns .bk{color:var(--s365-pri);text-decoration:none;font-weight:700;flex-shrink:0;}
.s365-enc-fns .bk:hover{text-decoration:underline;}
.s365-enc-rels{display:flex;flex-wrap:wrap;gap:8px;}
.s365-enc-rels a{font-size:13px;color:var(--s365-tx);background:#fff;border:1px solid var(--s365-bd);border-radius:9999px;padding:8px 16px;text-decoration:none;font-weight:500;transition:all .15s ease;}
.s365-enc-rels a:hover{border-color:var(--s365-pri);color:var(--s365-pri);background:var(--s365-pri-soft);}
.s365-enc-doc-err{text-align:center;padding:100px 0;color:#dc2626;font-size:14px;}
@media(max-width:880px){
  .s365-enc-doc{padding:100px 20px 60px;}
  .s365-enc-doc-grid{grid-template-columns:1fr;gap:24px;}
  .s365-enc-toc{position:static;max-height:none;}
  .s365-enc-doc-body h2{font-size:1.25rem;margin:32px 0 14px;}
  .s365-enc-doc-body h2::before{display:none;}
  .s365-enc-doc-body h3{font-size:1.05rem;}
}
</style>
<script>
(function(){
  var listPath = '/encyclopedia';
  var root = document.getElementById('s365-enc-doc');
  if(!root) return;
  var params = new URLSearchParams(window.location.search);
  var postId = params.get('postId') || window.location.pathname.split('/').pop();
  if(!postId || isNaN(Number(postId))){ root.innerHTML = '<div class="s365-enc-doc-err">문서를 찾을 수 없습니다.</div>'; return; }
  function esc(s){ return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }

  fetch('/api/board/' + postId)
    .then(function(r){ if(!r.ok) throw new Error(); return r.json(); })
    .then(function(post){
      var tm = String(post.title || '').match(/^\\s*\\[([^\\]]+)\\]\\s*(.+)$/);
      var cat = tm ? tm[1].trim() : '';
      var name = tm ? tm[2].trim() : String(post.title || '');
      var date = String(post.updated_at || post.created_at || '').slice(0, 10);
      var fns = [], rels = [];
      var body = String(post.content || '');
      body = body.replace(/\\[\\[([^\\]]+)\\]\\]/g, function(_, t){
        t = t.trim();
        if(rels.indexOf(t) < 0) rels.push(t);
        return '<a class="s365-enc-rel-link" href="' + listPath + '#q=' + encodeURIComponent(t) + '">' + esc(t) + '</a>';
      });
      body = body.replace(/\\[\\*([^\\]]+)\\]/g, function(_, t){
        fns.push(t.trim());
        var n = fns.length;
        return '<sup class="s365-enc-fn" id="fnref-' + n + '"><a href="#fn-' + n + '">[' + n + ']</a></sup>';
      });

      root.innerHTML =
        '<a class="s365-enc-doc-back" href="' + listPath + '">← 백과사전 목록</a>'
        + '<div class="s365-enc-doc-head">'
        + (cat ? '<div><span class="s365-enc-doc-cat">' + esc(cat) + '</span></div>' : '')
        + '<h1 class="s365-enc-doc-title">' + esc(name) + '</h1>'
        + '<p class="s365-enc-doc-meta">서울365열린치과 검수'
        + (date ? '<span class="s365-enc-doc-meta-sep"></span>최종 수정 ' + date : '')
        + '</p></div>'
        + '<div class="s365-enc-doc-grid">'
        + '<aside id="s365-enc-toc-mt"></aside>'
        + '<article><div class="s365-enc-doc-body" id="s365-enc-body"></div><div id="s365-enc-foot"></div><div id="s365-enc-rel"></div></article>'
        + '</div>';

      var bodyEl = document.getElementById('s365-enc-body');
      bodyEl.innerHTML = body;

      var heads = [].slice.call(bodyEl.querySelectorAll('h2,h3,h4'));
      if(heads.length){
        var lvls = heads.map(function(h){ return parseInt(h.tagName.substring(1), 10); });
        var base = Math.min.apply(null, lvls);
        var ctr = [];
        var tocItems = [];
        heads.forEach(function(h, i){
          var d = parseInt(h.tagName.substring(1), 10) - base;
          ctr = ctr.slice(0, d + 1);
          ctr[d] = (ctr[d] || 0) + 1;
          var num = ctr.slice(0, d + 1).join('.');
          var id = 's365-enc-s' + i;
          h.id = id;
          var label = h.textContent;
          h.insertBefore((function(){ var s = document.createElement('span'); s.className = 'hn'; s.textContent = num + '.'; return s; })(), h.firstChild);
          tocItems.push({ id: id, num: num, label: label, depth: d });
        });
        var ol = '<ol>';
        tocItems.forEach(function(t){
          ol += '<li style="padding-left:' + (t.depth * 14) + 'px"><a href="#' + t.id + '"><span class="n">' + t.num + '.</span>' + esc(t.label) + '</a></li>';
        });
        ol += '</ol>';
        var toc = document.createElement('div');
        toc.className = 's365-enc-toc';
        toc.innerHTML = '<div class="s365-enc-toc-hd"><span>목차</span><button type="button" class="s365-enc-toc-tg">[접기]</button></div><div class="s365-enc-toc-bd">' + ol + '</div>';
        document.getElementById('s365-enc-toc-mt').appendChild(toc);
        var bd = toc.querySelector('.s365-enc-toc-bd');
        var tg = toc.querySelector('.s365-enc-toc-tg');
        tg.addEventListener('click', function(){
          var hidden = bd.style.display === 'none';
          bd.style.display = hidden ? '' : 'none';
          tg.textContent = hidden ? '[접기]' : '[펼치기]';
        });
      } else {
        // 목차 없는 짧은 문서 — 사이드바 제거
        document.querySelector('.s365-enc-doc-grid').style.gridTemplateColumns = '1fr';
      }

      if(fns.length){
        var fh = '<div class="s365-enc-sec"><h3>각주</h3><ol class="s365-enc-fns">';
        fns.forEach(function(t, i){
          var n = i + 1;
          fh += '<li id="fn-' + n + '"><a class="bk" href="#fnref-' + n + '">[' + n + '] ↑</a><span>' + esc(t) + '</span></li>';
        });
        fh += '</ol></div>';
        document.getElementById('s365-enc-foot').innerHTML = fh;
      }
      if(rels.length){
        var rh = '<div class="s365-enc-sec"><h3>관련 문서</h3><div class="s365-enc-rels">';
        rels.forEach(function(t){
          rh += '<a href="' + listPath + '#q=' + encodeURIComponent(t) + '">' + esc(t) + '</a>';
        });
        rh += '</div></div>';
        document.getElementById('s365-enc-rel').innerHTML = rh;
      }
    })
    .catch(function(){ root.innerHTML = '<div class="s365-enc-doc-err">문서를 불러올 수 없습니다.</div>'; });
})();
</script>`;

// ── 글로서리 v2 (서울365 톤: 화이트 카드 툴팁 + 우측 슬라이드 패널) ────────
const GLOSS_CSS_V2 = `
.glosst{border-bottom:1.5px dotted #004b76;color:#00395f;cursor:pointer;font-weight:600;padding:0 1px;transition:background .15s ease;}
.glosst:hover,.glosst:focus{background:#e6eef3;outline:none;border-radius:3px;color:#004b76;}
.enc-gloss-ui{box-sizing:border-box;font-family:'Pretendard','NanumSquare',-apple-system,BlinkMacSystemFont,sans-serif;}
/* 화이트 카드 툴팁 */
.enc-tip{position:fixed;z-index:9998;max-width:320px;background:#fff;color:#202020;padding:14px 16px;border-radius:12px;font-size:13px;line-height:1.6;box-shadow:0 12px 36px rgba(0,0,0,.14),0 0 0 1px rgba(0,75,118,.08);pointer-events:none;border-left:4px solid #004b76;}
.enc-tip b{display:block;font-size:14px;color:#00395f;margin-bottom:6px;font-weight:800;letter-spacing:-.01em;}
.enc-tip span{display:block;color:#6b7280;}
.enc-tip em{display:block;margin-top:9px;color:#004b76;font-style:normal;font-size:11px;font-weight:700;letter-spacing:.04em;}
/* 우측 슬라이드 패널 */
.enc-panel{position:fixed;top:0;right:0;width:min(450px,100vw);height:100vh;z-index:9999;background:#fff;box-shadow:-12px 0 40px rgba(0,0,0,.16);transform:translateX(100%);transition:transform .28s cubic-bezier(.4,0,.2,1);display:flex;flex-direction:column;}
.enc-panel.on{transform:translateX(0);}
.enc-panel-backdrop{position:fixed;inset:0;z-index:9997;background:rgba(0,0,0,.32);opacity:0;pointer-events:none;transition:opacity .28s ease;}
.enc-panel-backdrop.on{opacity:1;pointer-events:auto;}
.enc-panel-hd{display:flex;align-items:center;justify-content:space-between;padding:22px 24px;border-bottom:1px solid #e4e8eb;flex-shrink:0;}
.enc-panel-kicker{font-size:11px;font-weight:700;color:#004b76;letter-spacing:.12em;text-transform:uppercase;}
.enc-panel-x{background:none;border:none;width:36px;height:36px;font-size:24px;line-height:1;color:#6b7280;cursor:pointer;border-radius:8px;display:flex;align-items:center;justify-content:center;transition:all .15s ease;font-family:inherit;padding:0;}
.enc-panel-x:hover{background:#e6eef3;color:#004b76;}
.enc-panel-bd{flex:1;overflow-y:auto;padding:28px 24px 24px;}
.enc-panel-cat{display:inline-block;font-size:11px;font-weight:700;color:#004b76;background:#e6eef3;padding:5px 12px;border-radius:9999px;margin-bottom:14px;letter-spacing:.05em;}
.enc-panel-name{font-size:22px;font-weight:800;color:#202020;margin:0 0 14px;line-height:1.3;letter-spacing:-.02em;}
.enc-panel-sum{font-size:14.5px;color:#37404a;line-height:1.75;margin:0;word-break:keep-all;}
.enc-panel-ft{padding:18px 24px 22px;border-top:1px solid #e4e8eb;flex-shrink:0;}
.enc-panel-cta{display:flex;align-items:center;justify-content:center;gap:8px;width:100%;background:#004b76;color:#fff;font-size:15px;font-weight:700;padding:14px 18px;border-radius:10px;text-decoration:none;font-family:inherit;transition:background .15s ease;}
.enc-panel-cta:hover{background:#00395f;}
.enc-panel-cta svg{transition:transform .15s ease;}
.enc-panel-cta:hover svg{transform:translateX(3px);}
@media(max-width:520px){
  .enc-tip{max-width:calc(100vw - 32px);}
  .enc-panel{width:100vw;}
}
`;

const GLOSS_JS_V2 = `
;(function(){
  if(window.__encGloss) return; window.__encGloss = 1;
  var P = location.pathname || '';
  if(P.indexOf('/encyclopedia') === 0) return; // 백과사전 페이지 자체 제외
  function ready(fn){ if(document.readyState !== 'loading'){ fn(); } else { document.addEventListener('DOMContentLoaded', fn); } }
  function esc(x){ return String(x).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }
  var tip, panel, backdrop;

  ready(function(){
    fetch('/api/board?type=board&groupSlug=${GROUP_SLUG}')
      .then(function(r){ return r.json(); })
      .then(function(posts){
        if(!Array.isArray(posts) || !posts.length) return;
        var terms = posts.map(function(p){
          var m = String(p.title || '').match(/^\\s*\\[([^\\]]+)\\]\\s*(.+)$/);
          var name = m ? m[2].trim() : String(p.title || '').trim();
          var cat = m ? m[1].trim() : '';
          var d = document.createElement('div'); d.innerHTML = String(p.content || '');
          var raw = (d.textContent || '')
            .replace(/\\[\\[([^\\]]+)\\]\\]/g, '$1')
            .replace(/\\[\\*[^\\]]*\\]/g, '')
            .replace(/\\s+/g, ' ')
            .replace(/^참고 안내\\s*/, '')
            .replace(/^개요\\s*/, '')
            .trim();
          if(raw.length > 180) raw = raw.slice(0, 180) + '…';
          var alias = name.replace(/\\s*[\\(（][^\\)）]*[\\)）]\\s*/g, '').trim();
          return { id:p.id, name:name, cat:cat, alias:(alias && alias!==name && alias.length>=2) ? alias : null, sum:raw };
        }).filter(function(t){ return t.name && t.name.length >= 2; });
        terms.sort(function(a, b){ return b.name.length - a.name.length; });

        var SKIP = {A:1,BUTTON:1,SCRIPT:1,STYLE:1,NOSCRIPT:1,TEXTAREA:1,INPUT:1,SELECT:1,CODE:1,PRE:1,H1:1,H2:1,H3:1,H4:1,H5:1,H6:1,NAV:1,HEADER:1,FOOTER:1};
        function excluded(node){
          var el = node.parentElement;
          while(el && el !== document.body){
            if(SKIP[el.tagName]) return true;
            if(el.classList && (el.classList.contains('glosst') || el.classList.contains('enc-gloss-ui'))) return true;
            if(el.getAttribute && el.getAttribute('data-global-snippet')) return true;
            if(el.isContentEditable) return true;
            el = el.parentElement;
          }
          return false;
        }

        var active = terms.slice(), usedCount = 0;
        var walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, null);
        var nodes = [], nn;
        while((nn = walker.nextNode())){
          if(!nn.nodeValue || !nn.nodeValue.trim()) continue;
          if(excluded(nn)) continue;
          nodes.push(nn);
        }
        for(var i=0; i<nodes.length && active.length; i++){
          var node = nodes[i];
          var txt = node.nodeValue;
          var best = -1, bestT = null, bestStr = '';
          for(var k=0; k<active.length; k++){
            var t = active[k];
            var idx = txt.indexOf(t.name), useStr = t.name;
            if(idx < 0 && t.alias){ var ia = txt.indexOf(t.alias); if(ia >= 0){ idx = ia; useStr = t.alias; } }
            if(idx >= 0 && (best < 0 || idx < best)){ best = idx; bestT = t; bestStr = useStr; }
          }
          if(best < 0) continue;
          var before = txt.slice(0, best);
          var after = txt.slice(best + bestStr.length);
          var span = document.createElement('span');
          span.className = 'glosst';
          span.textContent = bestStr;
          span.setAttribute('data-eid', bestT.id);
          span.setAttribute('data-ename', bestT.name);
          span.setAttribute('data-ecat', bestT.cat || '');
          span.setAttribute('tabindex', '0');
          span.setAttribute('role', 'button');
          span.setAttribute('aria-label', bestT.name + ' 용어 설명 보기');
          span.__sum = bestT.sum;
          var parent = node.parentNode;
          parent.insertBefore(document.createTextNode(before), node);
          parent.insertBefore(span, node);
          node.nodeValue = after;
          active = active.filter(function(x){ return x.id !== bestT.id; });
          usedCount++;
          i--;
        }
        if(usedCount > 0) buildUI();
      })
      .catch(function(){});
  });

  function termOf(e){ var t = e.target; return (t && t.classList && t.classList.contains('glosst')) ? t : null; }

  function buildUI(){
    tip = document.createElement('div'); tip.className = 'enc-gloss-ui enc-tip'; tip.style.display = 'none';
    document.body.appendChild(tip);
    backdrop = document.createElement('div'); backdrop.className = 'enc-gloss-ui enc-panel-backdrop';
    document.body.appendChild(backdrop);
    panel = document.createElement('aside'); panel.className = 'enc-gloss-ui enc-panel'; panel.setAttribute('role', 'dialog'); panel.setAttribute('aria-modal', 'true');
    document.body.appendChild(panel);

    backdrop.addEventListener('click', closePanel);
    document.addEventListener('keydown', function(e){
      if(e.key === 'Escape' && panel.classList.contains('on')) closePanel();
    });

    document.addEventListener('mouseover', function(e){ var s = termOf(e); if(s) showTip(s); }, true);
    document.addEventListener('mouseout', function(e){ if(termOf(e)) hideTip(); }, true);
    document.addEventListener('focusin', function(e){ var s = termOf(e); if(s) showTip(s); }, true);
    document.addEventListener('focusout', function(e){ if(termOf(e)) hideTip(); }, true);
    document.addEventListener('click', function(e){ var s = termOf(e); if(s){ e.preventDefault(); openPanel(s); } }, true);
    document.addEventListener('keydown', function(e){
      var s = termOf(e);
      if(s && (e.key === 'Enter' || e.key === ' ')){ e.preventDefault(); openPanel(s); }
    }, true);
    window.addEventListener('scroll', hideTip, true);
  }

  function showTip(s){
    tip.innerHTML = '<b>' + esc(s.getAttribute('data-ename')) + '</b><span>' + esc(s.__sum || '') + '</span><em>클릭하면 자세히 안내</em>';
    tip.style.display = 'block';
    var r = s.getBoundingClientRect();
    var tw = tip.offsetWidth, th = tip.offsetHeight;
    var left = Math.min(Math.max(8, r.left), window.innerWidth - tw - 8);
    var top = r.top - th - 10;
    if(top < 8) top = r.bottom + 10;
    tip.style.left = left + 'px'; tip.style.top = top + 'px';
  }
  function hideTip(){ if(tip) tip.style.display = 'none'; }

  function openPanel(s){
    hideTip();
    var id = s.getAttribute('data-eid');
    var name = s.getAttribute('data-ename');
    var cat = s.getAttribute('data-ecat') || '';
    panel.innerHTML =
      '<div class="enc-panel-hd">'
      + '<span class="enc-panel-kicker">서울365 백과사전</span>'
      + '<button type="button" class="enc-panel-x" aria-label="닫기">×</button>'
      + '</div>'
      + '<div class="enc-panel-bd">'
      + (cat ? '<span class="enc-panel-cat">' + esc(cat) + '</span>' : '')
      + '<h2 class="enc-panel-name">' + esc(name) + '</h2>'
      + '<p class="enc-panel-sum">' + esc(s.__sum || '') + '</p>'
      + '</div>'
      + '<div class="enc-panel-ft">'
      + '<a class="enc-panel-cta" href="/encyclopedia-doc?postId=' + encodeURIComponent(id) + '">백과사전에서 자세히 보기'
      + '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>'
      + '</a></div>';
    backdrop.classList.add('on');
    requestAnimationFrame(function(){ panel.classList.add('on'); });
    var x = panel.querySelector('.enc-panel-x');
    if(x) x.onclick = closePanel;
  }
  function closePanel(){
    panel.classList.remove('on');
    backdrop.classList.remove('on');
  }
})();
`;

function patchBlock(value, start, end, payload) {
  const v = String(value || '');
  const block = start + '\n' + payload.trim() + '\n' + end;
  const si = v.indexOf(start);
  const ei = v.indexOf(end);
  if (si >= 0 && ei > si) {
    return { text: v.slice(0, si) + block + v.slice(ei + end.length), mode: 'replace' };
  }
  return { text: (v.trim() ? v.replace(/\s*$/, '') + '\n\n' : '') + block + '\n', mode: 'append' };
}

let db;
const run = (s, p=[]) => new Promise((r, j) => db.run(s, p, function(e){ e ? j(e) : r(this); }));
const get = (s, p=[]) => new Promise((r, j) => db.get(s, p, (e, x) => e ? j(e) : r(x)));

async function main() {
  db = new sqlite3.Database(DB_PATH);
  console.log('[서울365 백과사전 UI v2 패치 — hospital_id=' + HOSPITAL_ID + ']');

  const h = await get('SELECT id,name,slug FROM hospitals WHERE id=?', [HOSPITAL_ID]);
  if (!h || h.slug !== HOSPITAL_SLUG_GUARD) {
    console.error('[ABORT] hospital_id=' + HOSPITAL_ID + ' 가 ' + HOSPITAL_SLUG_GUARD + '이 아님:', JSON.stringify(h));
    process.exitCode = 1; db.close(); return;
  }
  console.log('  대상 병원 확인: ' + h.name + ' (slug=' + h.slug + ')');

  // 1) encyclopedia 페이지
  const pList = await get("SELECT id, length(content) AS clen FROM pages WHERE slug='encyclopedia' AND hospital_id=?", [HOSPITAL_ID]);
  if (!pList) {
    console.error('[ABORT] encyclopedia 페이지 없음. seed 먼저 실행 필요.');
    process.exitCode = 1; db.close(); return;
  }
  await run("UPDATE pages SET content=?, updated_at=CURRENT_TIMESTAMP WHERE id=? AND hospital_id=?", [LIST_BLOCK_HTML, pList.id, HOSPITAL_ID]);
  console.log('  [UPDATE pages.encyclopedia] id=' + pList.id + ' content: ' + pList.clen + ' → ' + LIST_BLOCK_HTML.length);

  // 2) encyclopedia-doc 페이지
  const pDoc = await get("SELECT id, length(content) AS clen FROM pages WHERE slug='encyclopedia-doc' AND hospital_id=?", [HOSPITAL_ID]);
  if (!pDoc) {
    console.error('[ABORT] encyclopedia-doc 페이지 없음. seed 먼저 실행 필요.');
    process.exitCode = 1; db.close(); return;
  }
  await run("UPDATE pages SET content=?, updated_at=CURRENT_TIMESTAMP WHERE id=? AND hospital_id=?", [DOC_BLOCK_HTML, pDoc.id, HOSPITAL_ID]);
  console.log('  [UPDATE pages.encyclopedia-doc] id=' + pDoc.id + ' content: ' + pDoc.clen + ' → ' + DOC_BLOCK_HTML.length);

  // 3) _footer 글로서리 v1 블록 → v2 디자인으로 교체 (센티넬 그대로, 멱등)
  const pFooter = await get("SELECT id, custom_css, custom_js FROM pages WHERE slug='_footer' AND hospital_id=?", [HOSPITAL_ID]);
  if (!pFooter) {
    console.error('[ABORT] _footer 페이지 없음.');
    process.exitCode = 1; db.close(); return;
  }
  const css = patchBlock(pFooter.custom_css, CSS_START, CSS_END, GLOSS_CSS_V2);
  const js  = patchBlock(pFooter.custom_js,  JS_START,  JS_END,  GLOSS_JS_V2);
  await run(
    "UPDATE pages SET custom_css=?, custom_js=?, updated_at=CURRENT_TIMESTAMP WHERE id=? AND slug='_footer' AND hospital_id=?",
    [css.text, js.text, pFooter.id, HOSPITAL_ID]
  );
  console.log('  [UPDATE pages._footer] id=' + pFooter.id);
  console.log('  custom_css: ' + css.mode + ' (' + String(pFooter.custom_css||'').length + ' → ' + css.text.length + ')');
  console.log('  custom_js : ' + js.mode  + ' (' + String(pFooter.custom_js||'').length  + ' → ' + js.text.length + ')');

  console.log('[완료] 서울365 백과사전 UI v2 패치 종료');
  db.close();
}

main().catch(e => { console.error('[에러]', e.message); process.exitCode = 1; if(db) db.close(); });
