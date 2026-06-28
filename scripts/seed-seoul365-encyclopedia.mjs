// 서울365열린치과(hospital_id=10, slug=seoul365opendental) 치과 백과사전 시드
// - 가산적 / 멱등(이미 있으면 skip). hospital_id=10 외 절대 영향 없음.
// - board_groups.slug='seoul365-encyclopedia' (전역 UNIQUE — 옥스 'encyclopedia'와 분리)
// - pages.slug='encyclopedia' / 'encyclopedia-doc' (hospital_id로 격리되므로 옥스와 충돌 없음, URL은 /encyclopedia)
// - 콘텐츠는 일반 정보 제공용 "초안". 의료 정확성은 서울365열린치과 의료진 검수 전제.
//
// 사용: node seed-seoul365-encyclopedia.mjs ./wonjudental.db

import sqlite3 from 'sqlite3';

const HOSPITAL_ID = 10;
const HOSPITAL_SLUG_GUARD = 'seoul365opendental';
const GROUP_SLUG = 'seoul365-encyclopedia';
const GROUP_NAME = '치과 백과사전';
const HOSPITAL_DISPLAY = '서울365열린치과';
const DB_PATH = process.argv[2] || './wonjudental.db';

// ── 목록 페이지 블록 (slug: encyclopedia) ────────────────────────────────────
// boardSlug 값만 서울365 그룹 slug로 교체. 그 외 HTML/CSS/JS는 옥스 블록과 동일 패턴.
const LIST_BLOCK_HTML = `<div id="enc-list" class="enc-list">
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
  var boardSlug = 'seoul365-encyclopedia';
  var docPath   = '/encyclopedia-doc';
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
    if (!list.length){ grid.innerHTML = '<div class="enc-empty">조건에 맞는 용어가 없습니다.</div>'; return; }
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
  try {
    var h = decodeURIComponent((location.hash || '').replace(/^#q=/, ''));
    if (h && location.hash.indexOf('#q=') === 0) { q = h; qInput.value = h; }
  } catch (e) {}
  fetch('/api/board?type=board&groupSlug=' + boardSlug)
    .then(function(r){ return r.json(); })
    .then(function(posts){
      if (!Array.isArray(posts) || !posts.length){ grid.innerHTML = '<div class="enc-empty">등록된 용어가 없습니다.</div>'; return; }
      items = posts.map(function(p){ var pt = parseTitle(p.title); return { id: p.id, cat: pt.cat, name: pt.name }; });
      renderChips(); renderGrid();
    })
    .catch(function(){ grid.innerHTML = '<div class="enc-empty" style="color:#ef4444">목록을 불러올 수 없습니다.</div>'; });
})();
</script>`;

// ── 문서 페이지 블록 (slug: encyclopedia-doc) ────────────────────────────────
// boardSlug 미사용 — postId 기반 /api/board/{id}만 호출. 옥스 블록과 100% 동일.
const DOC_BLOCK_HTML = `<div id="enc-doc" class="enc-doc"><div class="enc-doc-loading">불러오는 중…</div></div>
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
  var listPath = '/encyclopedia';
  var root = document.getElementById('enc-doc');
  if (!root) return;
  var params = new URLSearchParams(window.location.search);
  var postId = params.get('postId') || window.location.pathname.split('/').pop();
  if (!postId || isNaN(Number(postId))){ root.innerHTML = '<div class="enc-doc-err">문서를 찾을 수 없습니다.</div>'; return; }
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
      body = body.replace(/\\[\\[([^\\]]+)\\]\\]/g, function(_, t){
        t = t.trim();
        if (rels.indexOf(t) < 0) rels.push(t);
        return '<a class="enc-rel-link" href="' + listPath + '#q=' + encodeURIComponent(t) + '">' + esc(t) + '</a>';
      });
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
      if (fns.length){
        var fh = '<div class="enc-sec"><h3>각주</h3><ol class="enc-fns">';
        fns.forEach(function(t, i){
          var n = i + 1;
          fh += '<li id="fn-' + n + '"><a class="bk" href="#fnref-' + n + '">[' + n + '] ↑</a><span>' + esc(t) + '</span></li>';
        });
        fh += '</ol></div>';
        document.getElementById('enc-foot').innerHTML = fh;
      }
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
</script>`;

// ── 콘텐츠(초안) ─────────────────────────────────────────────────────────────
// 일반 정보 제공용. 의료 정확성·표현은 서울365열린치과 의료진 검수 후 확정.
const NOTE = `<h2>참고 안내</h2>
<p>본 문서는 일반적인 이해를 돕기 위한 정보이며, 개인의 구강 상태에 따라 진단·치료 방법은 달라질 수 있습니다. 정확한 진단과 치료 계획은 서울365열린치과 의료진 상담을 통해 확인하시기 바랍니다.[*본 백과사전 콘텐츠는 서울365열린치과가 검수·관리합니다.]</p>`;

function doc(parts) { return parts.join('\n') + '\n' + NOTE; }

const TERMS = [
  // ── 옥스 초안과 동일 (32건) ────────────────────────────────────────────────
  { cat:'치아교정', name:'치아교정', body:doc([
    `<h2>개요</h2><p>치아교정은 부정교합이나 고르지 않은 치열을 교정 장치로 점진적으로 이동시켜 기능과 심미를 개선하는 치료입니다. [[부정교합]]의 유형과 정도에 따라 치료 계획이 달라집니다.</p>`,
    `<h2>치료 방식</h2><h3>고정식 장치</h3><p>치아 표면에 브라켓을 부착하고 와이어로 힘을 전달하는 일반적인 방식입니다. [[설측교정]]은 장치를 치아 안쪽에 부착합니다.</p><h3>가철식(투명교정)</h3><p>탈부착이 가능한 투명 장치를 사용하는 방식으로 [[인비절라인]]이 대표적입니다.</p>`,
    `<h2>치료 기간과 관리</h2><p>일반적으로 1~3년가량 소요되며 개인차가 큽니다. 교정 종료 후에는 [[리테이너]] 착용으로 안정화가 필요합니다.[*교정 기간은 부정교합 정도, 연령, 협조도에 따라 크게 달라집니다.]</p>` ]) },
  { cat:'치아교정', name:'부정교합', body:doc([
    `<h2>개요</h2><p>부정교합은 위·아래 치아의 맞물림이 정상 범위를 벗어난 상태를 말하며, 발음·저작·심미·구강 위생에 영향을 줄 수 있습니다.</p>`,
    `<h2>분류</h2><h3>1급</h3><p>어금니 관계는 정상이나 치아 배열에 문제가 있는 경우입니다.</p><h3>2급</h3><p>아래턱이 상대적으로 뒤쪽에 위치한 경우입니다.</p><h3>3급</h3><p>아래턱이 상대적으로 앞쪽에 위치한 경우(주걱턱 경향)입니다.</p>`,
    `<h2>치료</h2><p>원인과 분류에 따라 [[치아교정]], 성장기 악정형 치료, 필요 시 악교정 수술이 고려됩니다.</p>` ]) },
  { cat:'치아교정', name:'설측교정', body:doc([
    `<h2>개요</h2><p>설측교정은 브라켓을 치아 안쪽(혀쪽)에 부착해 장치가 겉으로 잘 보이지 않도록 하는 [[치아교정]] 방식입니다.</p>`,
    `<h2>특징</h2><p>심미적 만족도가 높은 반면 초기 적응 기간과 발음 불편이 있을 수 있고, 정밀한 술식이 요구됩니다.[*개인별 적응 양상은 차이가 있습니다.]</p>` ]) },
  { cat:'치아교정', name:'리테이너(보정장치)', body:doc([
    `<h2>개요</h2><p>리테이너는 교정으로 이동한 치아가 원래 위치로 되돌아가는 것을 막기 위해 사용하는 유지 장치입니다.</p>`,
    `<h2>종류</h2><h3>가철식</h3><p>탈부착이 가능하며 착용 시간을 지키는 것이 중요합니다.</p><h3>고정식</h3><p>치아 안쪽에 가는 선을 부착해 상시 유지합니다.</p>`,
    `<h2>관리</h2><p>착용을 소홀히 하면 [[치아교정]] 결과가 재발할 수 있어 정해진 기간 동안 꾸준한 착용이 필요합니다.</p>` ]) },
  { cat:'치아교정', name:'발치교정', body:doc([
    `<h2>개요</h2><p>치아가 배열될 공간이 부족할 때 일부 치아를 발치하여 공간을 확보한 뒤 진행하는 [[치아교정]] 방식입니다.</p>`,
    `<h2>적용</h2><p>돌출 양상, 총생(치아 겹침) 정도, 잇몸·뼈 상태를 종합 평가하여 발치·비발치 여부를 결정합니다.[*발치 여부는 정밀 진단 후 신중히 결정합니다.]</p>` ]) },
  { cat:'인비절라인', name:'인비절라인', body:doc([
    `<h2>개요</h2><p>인비절라인은 디지털 스캔을 기반으로 제작한 투명 교정 장치를 단계별로 교체하며 치아를 이동시키는 [[투명교정]] 시스템입니다.</p>`,
    `<h2>장점과 고려사항</h2><h3>장점</h3><p>장치가 잘 보이지 않고 탈부착이 가능해 식사·양치가 편리합니다.</p><h3>고려사항</h3><p>하루 권장 착용 시간(일반적으로 20시간 이상)을 지키지 않으면 계획대로 이동하지 않을 수 있습니다.[*협조도가 치료 결과에 큰 영향을 줍니다.]</p>`,
    `<h2>진행 과정</h2><p>[[클린체크]] 시뮬레이션으로 예상 경로를 확인한 뒤 단계별 장치를 교체하며, 필요 시 [[어태치먼트]]를 부착합니다.</p>` ]) },
  { cat:'인비절라인', name:'투명교정', body:doc([
    `<h2>개요</h2><p>투명교정은 투명한 가철식 장치를 이용하는 교정 방식의 총칭으로, 심미성과 편의성이 특징입니다. [[인비절라인]]이 대표적입니다.</p>`,
    `<h2>적응증</h2><p>경도~중등도 부정교합에서 효과적이며, 복잡한 케이스는 고정식 장치 병행이 필요할 수 있습니다.</p>` ]) },
  { cat:'인비절라인', name:'클린체크', body:doc([
    `<h2>개요</h2><p>클린체크는 [[인비절라인]] 치료 전 디지털 시뮬레이션으로 치아 이동 단계와 예상 결과를 미리 검토하는 과정입니다.</p>`,
    `<h2>의의</h2><p>치료 전 예측 가능성을 높이고 환자와의 치료 계획 공유에 도움이 됩니다.[*시뮬레이션은 예측이며 실제 결과와 차이가 있을 수 있습니다.]</p>` ]) },
  { cat:'인비절라인', name:'어태치먼트', body:doc([
    `<h2>개요</h2><p>어태치먼트는 투명 장치가 치아에 효과적으로 힘을 전달하도록 치아 표면에 부착하는 작은 레진 돌기입니다.</p>`,
    `<h2>특징</h2><p>치아 색과 유사해 눈에 잘 띄지 않으며, 교정 종료 후 제거합니다. [[인비절라인]] 치료의 정밀도를 높입니다.</p>` ]) },
  { cat:'임플란트', name:'임플란트', body:doc([
    `<h2>개요</h2><p>임플란트는 상실된 치아 부위의 턱뼈에 인공 치근(픽스처)을 식립하고 그 위에 보철물을 연결하여 자연치아의 기능을 회복하는 치료입니다.</p>`,
    `<h2>구성</h2><h3>픽스처</h3><p>턱뼈에 식립되는 인공 치근입니다.</p><h3>지대주</h3><p>픽스처와 보철물을 연결하는 부분입니다.</p><h3>보철물(크라운)</h3><p>실제 치아 형태의 상부 구조입니다.</p>`,
    `<h2>치료 과정</h2><p>정밀 진단([[콘빔CT]]) → 식립 → 골유착 대기 → 보철 연결 순으로 진행하며, 뼈가 부족하면 [[골이식]]이나 [[상악동거상술]]이 동반될 수 있습니다.[*골유착 기간은 개인·부위에 따라 다릅니다.]</p>`,
    `<h2>유지 관리</h2><p>식립 후에도 정기 점검과 구강 위생 관리가 중요하며, 관리가 소홀하면 [[임플란트주위염]]이 생길 수 있습니다.</p>` ]) },
  { cat:'임플란트', name:'골이식', body:doc([
    `<h2>개요</h2><p>골이식은 임플란트 식립에 필요한 잇몸뼈의 양이 부족할 때 뼈를 보충하여 안정적인 식립 환경을 만드는 술식입니다.</p>`,
    `<h2>적용</h2><p>발치 후 뼈 흡수가 진행된 경우 등에서 고려되며, [[임플란트]] 치료의 성공과 장기 안정성에 도움이 됩니다.[*이식재 종류와 치유 기간은 상태에 따라 다릅니다.]</p>` ]) },
  { cat:'임플란트', name:'상악동거상술', body:doc([
    `<h2>개요</h2><p>상악동거상술은 위턱 어금니 부위에서 상악동(부비동) 아래 뼈가 부족할 때 상악동 점막을 들어 올리고 뼈를 채워 [[임플란트]] 식립 공간을 확보하는 술식입니다.</p>`,
    `<h2>방식</h2><p>접근 경로에 따라 측방 접근, 치조정 접근 등으로 나뉘며 뼈 부족 정도에 따라 선택합니다.</p>` ]) },
  { cat:'임플란트', name:'디지털 가이드 임플란트', body:doc([
    `<h2>개요</h2><p>[[콘빔CT]]와 디지털 설계를 기반으로 제작한 수술 가이드를 사용해 계획된 위치·각도·깊이로 [[임플란트]]를 식립하는 방식입니다.</p>`,
    `<h2>의의</h2><p>식립 정밀도와 예측 가능성을 높이는 데 도움이 됩니다.[*가이드 사용 여부는 증례에 따라 결정됩니다.]</p>` ]) },
  { cat:'임플란트', name:'임플란트주위염', body:doc([
    `<h2>개요</h2><p>임플란트주위염은 임플란트 주변 잇몸과 지지뼈에 염증이 생겨 뼈가 흡수되는 상태로, [[치주염]]과 유사한 기전을 가집니다.</p>`,
    `<h2>예방</h2><p>정기 검진과 철저한 구강 위생, 금연 등이 중요합니다. 방치 시 [[임플란트]] 수명에 영향을 줄 수 있습니다.</p>` ]) },
  { cat:'임플란트', name:'즉시식립', body:doc([
    `<h2>개요</h2><p>즉시식립은 발치와 동시에 또는 짧은 기간 내에 [[임플란트]]를 식립하는 방식으로, 치료 기간 단축이 기대됩니다.</p>`,
    `<h2>고려사항</h2><p>감염 여부, 뼈·잇몸 상태 등 적응 조건을 충족해야 하며 모든 경우에 적용되지는 않습니다.[*적응증 평가가 선행되어야 합니다.]</p>` ]) },
  { cat:'심미치료', name:'라미네이트', body:doc([
    `<h2>개요</h2><p>라미네이트는 치아 앞면을 얇게 다듬고 세라믹 등의 얇은 판을 부착해 색·형태를 개선하는 심미 보철 시술입니다.</p>`,
    `<h2>적용</h2><p>변색, 작은 틈(공극), 형태 이상 등에 적용되며 [[올세라믹크라운]]에 비해 치아 삭제량이 적은 편입니다.[*치아 상태에 따라 적합한 방법이 다릅니다.]</p>`,
    `<h2>관리</h2><p>과도한 힘(이갈이 등)에 취약할 수 있어 정기 점검이 권장됩니다.</p>` ]) },
  { cat:'심미치료', name:'올세라믹크라운', body:doc([
    `<h2>개요</h2><p>올세라믹크라운은 금속을 사용하지 않고 세라믹만으로 제작한 보철물로, 자연치아와 유사한 색조 표현이 가능합니다.</p>`,
    `<h2>특징</h2><p>심미성이 우수하며, 적응증과 교합 상태를 고려해 재료를 선택합니다. [[라미네이트]], [[인레이온레이]]와 적용 범위가 다릅니다.</p>` ]) },
  { cat:'심미치료', name:'인레이온레이', body:doc([
    `<h2>개요</h2><p>인레이/온레이는 충치 등으로 손상된 부위를 본을 떠 제작한 보철물로 수복하는 간접 수복 방식입니다.</p>`,
    `<h2>구분</h2><p>인레이는 치아 안쪽 결손, 온레이는 교두를 포함한 더 넓은 결손에 적용됩니다. [[충치]] 치료 후 자주 사용됩니다.</p>` ]) },
  { cat:'심미치료', name:'치아미백', body:doc([
    `<h2>개요</h2><p>치아미백은 미백제를 이용해 치아 변색을 밝게 개선하는 시술입니다.</p>`,
    `<h2>방식</h2><h3>전문가 미백</h3><p>치과에서 진행하는 방식입니다.</p><h3>자가 미백</h3><p>맞춤 트레이로 가정에서 진행하는 방식입니다.</p>`,
    `<h2>고려사항</h2><p>일시적 시린 증상이 있을 수 있으며 변색 원인에 따라 효과가 다릅니다.[*보철물은 미백되지 않습니다.] 보철 색과의 조화는 [[라미네이트]] 등과 함께 상담이 필요합니다.</p>` ]) },
  { cat:'심미치료', name:'잇몸성형', body:doc([
    `<h2>개요</h2><p>잇몸성형(치은성형술)은 잇몸 라인을 다듬어 치아 길이·미소 라인을 개선하는 시술입니다. [[거미스마일]] 개선에 적용될 수 있습니다.</p>`,
    `<h2>고려사항</h2><p>잇몸·뼈 상태에 따라 술식이 달라지며 정밀 진단이 선행됩니다.</p>` ]) },
  { cat:'심미치료', name:'거미스마일', body:doc([
    `<h2>개요</h2><p>거미스마일(gummy smile)은 웃을 때 잇몸이 과도하게 노출되는 상태를 말합니다.</p>`,
    `<h2>원인과 개선</h2><p>치아 길이, 잇몸·입술 위치, 골격 등 원인이 다양하며 [[잇몸성형]], 교정, 보톡스 등 원인별 접근이 필요합니다.[*원인 감별이 중요합니다.]</p>` ]) },
  { cat:'일반치과', name:'충치', body:doc([
    `<h2>개요</h2><p>충치(치아우식증)는 세균이 만든 산에 의해 치아 경조직이 파괴되는 질환입니다.</p>`,
    `<h2>진행 단계</h2><h3>법랑질 우식</h3><p>초기 단계로 증상이 적습니다.</p><h3>상아질 우식</h3><p>시린 증상·통증이 나타날 수 있습니다.</p><h3>치수 침범</h3><p>심한 통증이 발생하며 [[신경치료]]가 필요할 수 있습니다.</p>`,
    `<h2>예방</h2><p>올바른 칫솔질, 정기 검진, [[스케일링]], 식습관 관리가 도움이 됩니다.[*조기 발견 시 치료 범위를 줄일 수 있습니다.]</p>` ]) },
  { cat:'일반치과', name:'신경치료', body:doc([
    `<h2>개요</h2><p>신경치료(근관치료)는 염증·감염된 치수를 제거하고 근관을 소독·충전하여 자연치아를 보존하는 치료입니다.</p>`,
    `<h2>과정</h2><p>치수 제거 → 근관 성형·세척 → 충전 → 보철 수복 순으로 진행되며, 치료 후 [[올세라믹크라운]] 등으로 보강하는 경우가 많습니다.[*치아·근관 상태에 따라 내원 횟수가 다릅니다.]</p>` ]) },
  { cat:'일반치과', name:'사랑니발치', body:doc([
    `<h2>개요</h2><p>사랑니(제3대구치)는 맹출 공간 부족으로 매복되거나 부분 맹출되는 경우가 많아 발치가 필요할 수 있습니다.</p>`,
    `<h2>고려사항</h2><p>신경관·인접 치아와의 관계를 [[파노라마]]·[[콘빔CT]]로 평가한 뒤 발치 난이도와 방법을 결정합니다.[*매복 양상에 따라 외과적 발치가 필요할 수 있습니다.]</p>` ]) },
  { cat:'일반치과', name:'스케일링', body:doc([
    `<h2>개요</h2><p>스케일링은 치아 표면과 잇몸 경계의 치석·치태를 제거하는 예방·치주 치료의 기본 과정입니다.</p>`,
    `<h2>의의</h2><p>[[치주염]] 예방·관리에 중요하며 정기적인 시행이 권장됩니다. 시술 후 일시적 시림이 있을 수 있습니다.</p>` ]) },
  { cat:'일반치과', name:'치주염', body:doc([
    `<h2>개요</h2><p>치주염은 치태·치석 내 세균에 의해 잇몸과 치아 지지조직(뼈)이 파괴되는 만성 염증 질환입니다.</p>`,
    `<h2>경과</h2><p>치은염에서 시작해 진행되면 치아 동요·소실로 이어질 수 있습니다. [[잇몸치료]]와 [[스케일링]], 정기 관리가 핵심입니다.[*전신질환과 연관될 수 있어 관리가 중요합니다.]</p>` ]) },
  { cat:'일반치과', name:'잇몸치료', body:doc([
    `<h2>개요</h2><p>잇몸치료(치주치료)는 [[치주염]]의 원인을 제거하고 진행을 막기 위한 단계적 치료입니다.</p>`,
    `<h2>단계</h2><h3>비외과적 치료</h3><p>스케일링, 치근활택술 등으로 염증 원인을 제거합니다.</p><h3>외과적 치료</h3><p>진행된 경우 잇몸을 절개해 깊은 부위를 처치합니다.</p>` ]) },
  { cat:'일반치과', name:'지각과민', body:doc([
    `<h2>개요</h2><p>지각과민은 찬 것·단 것·칫솔질 등 자극에 치아가 시리고 짧은 통증을 느끼는 상태입니다.</p>`,
    `<h2>원인</h2><p>잇몸 퇴축, 마모, 미세 균열 등 원인이 다양하며, [[치아균열증후군]]이나 [[충치]] 감별이 필요할 수 있습니다.[*원인에 따라 처치가 달라집니다.]</p>` ]) },
  { cat:'일반치과', name:'치아균열증후군', body:doc([
    `<h2>개요</h2><p>치아균열증후군은 치아에 미세한 금이 생겨 씹을 때 순간적 통증 등이 나타나는 상태입니다.</p>`,
    `<h2>특징</h2><p>진단이 까다로울 수 있고 균열 범위에 따라 보철·[[신경치료]]·발치 등 처치가 달라집니다.[*균열은 진행될 수 있어 조기 평가가 권장됩니다.]</p>` ]) },
  { cat:'진단', name:'파노라마', body:doc([
    `<h2>개요</h2><p>파노라마 방사선 촬영은 위·아래 턱과 전체 치아를 한 장에 담아 전반적인 상태를 평가하는 검사입니다.</p>`,
    `<h2>활용</h2><p>[[사랑니발치]], [[임플란트]] 계획 등 전반적 평가에 사용되며, 정밀 평가가 필요하면 [[콘빔CT]]를 추가합니다.</p>` ]) },
  { cat:'진단', name:'콘빔CT', body:doc([
    `<h2>개요</h2><p>콘빔CT(CBCT)는 3차원 영상을 제공하여 뼈 양, 신경관 위치 등을 입체적으로 평가하는 치과용 정밀 검사입니다.</p>`,
    `<h2>활용</h2><p>[[임플란트]] 식립 계획, 매복치 평가 등에 사용됩니다.[*촬영 여부는 진단 필요성에 따라 결정됩니다.]</p>` ]) },
  { cat:'진단', name:'구강검진', body:doc([
    `<h2>개요</h2><p>구강검진은 충치, 잇몸 상태, 보철물·교합 등을 정기적으로 점검하여 질환을 조기에 발견하기 위한 과정입니다.</p>`,
    `<h2>권장</h2><p>증상이 없어도 정기 검진과 [[스케일링]]을 통해 예방·조기 관리하는 것이 바람직합니다.</p>` ]) },

  // ── 서울365열린치과 소폭 추가 (6건, 임플란트 종합 진료 중심 일반 정보) ───────
  { cat:'임플란트', name:'전악 임플란트', body:doc([
    `<h2>개요</h2><p>전악 임플란트는 한 턱 전체 또는 위·아래 모두에 다수의 [[임플란트]]를 식립한 뒤 보철을 연결하여 무치악 또는 잔존치아 보존이 어려운 경우의 저작 기능을 회복하는 방식입니다.</p>`,
    `<h2>방식</h2><h3>올온포(All-on-4)</h3><p>턱 당 4개의 식립체에 보철을 연결하는 방식입니다.</p><h3>올온식스(All-on-6)</h3><p>턱 당 6개의 식립체로 하중을 분산하는 방식입니다.</p>`,
    `<h2>고려사항</h2><p>뼈 양과 상악동·신경관 위치, 교합·전신 상태를 종합 평가하여 식립 위치를 계획하며 [[디지털 가이드 임플란트]]가 함께 활용될 수 있습니다.[*전악 케이스는 정밀 진단과 단계적 관리가 매우 중요합니다.]</p>` ]) },
  { cat:'임플란트', name:'PRF/CGF', body:doc([
    `<h2>개요</h2><p>PRF(혈소판풍부피브린)·CGF(농축성장인자)는 환자 본인 혈액을 원심분리해 얻는 자가혈 농축 성분으로, 발치·식립 부위에 적용하여 치유 환경 개선을 돕는 보조 술식입니다.</p>`,
    `<h2>활용</h2><p>[[발치]] 후 치조골 보존, [[골이식]] 보조, 연조직 치유 보조 등에 사용될 수 있습니다.[*적용 여부는 증례별 의료진 판단을 따릅니다.]</p>` ]) },
  { cat:'임플란트', name:'디지털 인상(구강 스캐너)', body:doc([
    `<h2>개요</h2><p>디지털 인상은 인상재 대신 광학식 구강 스캐너로 구강 내부를 3차원으로 스캔해 디지털 모델을 만드는 방식입니다.</p>`,
    `<h2>의의</h2><p>인상재 사용에 따른 불편을 줄이고 [[디지털 가이드 임플란트]], [[올세라믹크라운]], 투명교정 등 디지털 보철·교정 워크플로와 자연스럽게 연계됩니다.[*구강 환경과 보철 종류에 따라 전통 인상이 더 적합한 경우도 있습니다.]</p>` ]) },
  { cat:'일반치과', name:'교합조정', body:doc([
    `<h2>개요</h2><p>교합조정은 위·아래 치아의 맞물림이 한쪽으로 치우치거나 보철 후 적응이 필요할 때 접촉면을 미세하게 다듬어 균형을 맞추는 술식입니다.</p>`,
    `<h2>적용</h2><p>새 보철 적응 단계, 야간 이갈이·턱관절 증상 관리, [[치아균열증후군]] 위험 관리 등에 활용됩니다.[*과도한 삭제는 피해야 하며 단계적으로 진행합니다.]</p>` ]) },
  { cat:'일반치과', name:'치근단절제술', body:doc([
    `<h2>개요</h2><p>치근단절제술은 [[신경치료]] 후에도 치근단(치아 뿌리 끝) 부위의 병변이 지속될 때 외과적으로 병변과 치근 끝 일부를 제거하여 자연치아를 보존하는 술식입니다.</p>`,
    `<h2>고려사항</h2><p>재신경치료로 해결되지 않거나 접근이 어려운 경우의 선택지로 검토됩니다.[*해부학적 위치와 잔존 치근 상태에 따라 적응증이 달라집니다.]</p>` ]) },
  { cat:'심미치료', name:'디지털 미소디자인(DSD)', body:doc([
    `<h2>개요</h2><p>디지털 미소디자인(Digital Smile Design)은 사진·영상과 디지털 시뮬레이션을 활용해 미소 라인·치아 비례·잇몸 형태를 미리 설계하고 환자와 공유하는 접근입니다.</p>`,
    `<h2>활용</h2><p>[[라미네이트]], [[올세라믹크라운]], [[잇몸성형]] 등 심미 치료의 예측 가능성과 소통 정확도를 높이는 데 기여합니다.[*시뮬레이션은 예측이며 실제 결과와 차이가 있을 수 있습니다.]</p>` ]) },
];

// ── DB 작업 ──────────────────────────────────────────────────────────────────
const db = new sqlite3.Database(DB_PATH);
const run = (s,p=[]) => new Promise((r,j)=>db.run(s,p,function(e){ e?j(e):r(this); }));
const get = (s,p=[]) => new Promise((r,j)=>db.get(s,p,(e,x)=>e?j(e):r(x)));

async function main() {
  console.log('[서울365열린치과 백과사전 시드 시작 — hospital_id=' + HOSPITAL_ID + ']');

  const h = await get('SELECT id,name,slug FROM hospitals WHERE id=?', [HOSPITAL_ID]);
  if (!h || h.slug !== HOSPITAL_SLUG_GUARD) {
    console.error('[ABORT] hospital_id=' + HOSPITAL_ID + ' 가 ' + HOSPITAL_SLUG_GUARD + '이 아님:', JSON.stringify(h));
    process.exitCode = 1; db.close(); return;
  }
  console.log('  대상 병원 확인: ' + h.name + ' (slug=' + h.slug + ')');

  try {
    // 1) 게시판 그룹 (전역 UNIQUE slug — 충돌 가드)
    let group = await get('SELECT id,hospital_id FROM board_groups WHERE slug=?', [GROUP_SLUG]);
    if (group && group.hospital_id !== HOSPITAL_ID) {
      console.error('[ABORT] slug=' + GROUP_SLUG + ' 가 다른 병원(hospital_id=' + group.hospital_id + ')에서 사용 중. 중단.');
      process.exitCode = 1; db.close(); return;
    }
    if (!group) {
      const r = await run(
        `INSERT INTO board_groups (name,slug,description,is_active,members_only,sort_order,hospital_id)
         VALUES (?,?,?,?,?,?,?)`,
        [GROUP_NAME, GROUP_SLUG, '치과 용어 백과사전', 1, 0, 50, HOSPITAL_ID]
      );
      group = { id: r.lastID, hospital_id: HOSPITAL_ID };
      console.log('  [INSERT board_groups] id=' + group.id + ' slug=' + GROUP_SLUG);
    } else {
      console.log('  [skip board_groups] 이미 존재 id=' + group.id);
    }

    // 2) 페이지 2개 (slug, hospital_id) 멱등 — pages는 hospital_id로 격리되므로 옥스 'encyclopedia'와 무관
    async function ensurePage(slug, title, content) {
      const ex = await get('SELECT id FROM pages WHERE slug=? AND hospital_id=?', [slug, HOSPITAL_ID]);
      if (ex) { console.log('  [skip pages] ' + slug + ' 이미 존재 id=' + ex.id); return; }
      const r = await run(
        `INSERT INTO pages (hospital_id,slug,title,content,custom_css,custom_js,meta_title,meta_description,is_published,sort_order,page_type)
         VALUES (?,?,?,?,?,?,?,?,?,?,?)`,
        [HOSPITAL_ID, slug, title, content, '', '', title + ' | ' + HOSPITAL_DISPLAY,
         HOSPITAL_DISPLAY + ' 치과 백과사전 — 임플란트·교정·심미치료 등 치과 용어를 쉽게 설명합니다.', 1, 90, 'custom']
      );
      console.log('  [INSERT pages] ' + slug + ' id=' + r.lastID);
    }
    await ensurePage('encyclopedia', '치과 백과사전', LIST_BLOCK_HTML);
    await ensurePage('encyclopedia-doc', '치과 백과사전 문서', DOC_BLOCK_HTML);

    // 3) 용어 게시글 (title 기준 멱등)
    let ins = 0, skip = 0;
    for (const t of TERMS) {
      const title = '[' + t.cat + '] ' + t.name;
      const ex = await get(
        'SELECT id FROM boards WHERE hospital_id=? AND board_group_id=? AND title=?',
        [HOSPITAL_ID, group.id, title]
      );
      if (ex) { skip++; continue; }
      await run(
        `INSERT INTO boards (type,board_group_id,title,content,is_published,hospital_id)
         VALUES ('board',?,?,?,1,?)`,
        [group.id, title, t.body, HOSPITAL_ID]
      );
      ins++;
    }
    console.log('  [boards] 신규 ' + ins + '건, 기존 skip ' + skip + '건 (총 ' + TERMS.length + ')');
    console.log('[완료] 서울365열린치과 백과사전 시드 종료');
  } catch (e) {
    console.error('[에러]', e.message);
    process.exitCode = 1;
  } finally {
    db.close();
  }
}
main();
