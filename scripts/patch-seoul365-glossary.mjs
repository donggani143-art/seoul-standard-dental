// 서울365열린치과(hospital_id=10, seoul365opendental) 전 페이지
// "전문용어 자동 링크 + 호버 툴팁 + 하단 토스트바" 글로서리 패치
// - hospital_id=10 의 _footer 페이지(custom_css / custom_js)에만 가산적 패치
// - 센티넬 마커로 멱등(재실행 시 해당 블록만 교체). 기존 내용 보존.
// - hospital_id=10 외 절대 영향 없음.
// - 옥스 patch-oaks-glossary.mjs 와 동일 구조, groupSlug만 'seoul365-encyclopedia'
//
// 사용: node patch-seoul365-glossary.mjs ./wonjudental.db

import sqlite3 from 'sqlite3';

const HOSPITAL_ID = 10;
const HOSPITAL_SLUG_GUARD = 'seoul365opendental';
const GROUP_SLUG = 'seoul365-encyclopedia';
const DB_PATH = process.argv[2] || './wonjudental.db';

const CSS_START = '/* ENC-GLOSSARY-CSS v1 START */';
const CSS_END   = '/* ENC-GLOSSARY-CSS v1 END */';
const JS_START  = '/* ENC-GLOSSARY-JS v1 START */';
const JS_END    = '/* ENC-GLOSSARY-JS v1 END */';

const GLOSS_CSS = `
.glosst{border-bottom:1px dashed #2563eb;color:#1d4ed8;cursor:pointer;font-weight:600;}
.glosst:hover,.glosst:focus{background:#eff6ff;outline:none;border-radius:3px;}
.enc-gloss-ui{box-sizing:border-box;}
.enc-tip{position:fixed;z-index:9998;max-width:300px;background:#18181b;color:#fff;padding:12px 14px;border-radius:10px;font-size:13px;line-height:1.6;box-shadow:0 8px 24px rgba(0,0,0,.22);pointer-events:none;}
.enc-tip b{display:block;font-size:14px;margin-bottom:4px;}
.enc-tip span{display:block;color:#d4d4d8;}
.enc-tip em{display:block;margin-top:7px;color:#93c5fd;font-style:normal;font-size:11px;}
.enc-toast{position:fixed;left:0;right:0;bottom:0;z-index:9999;transform:translateY(110%);transition:transform .25s ease;}
.enc-toast.on{transform:translateY(0);}
.enc-toast-in{max-width:920px;margin:0 auto;background:#fff;border:1px solid #e4e4e7;border-bottom:none;border-radius:14px 14px 0 0;box-shadow:0 -8px 30px rgba(0,0,0,.12);padding:16px 20px;display:flex;gap:18px;align-items:center;justify-content:space-between;flex-wrap:wrap;}
.enc-toast-tx strong{font-size:15px;color:#18181b;}
.enc-toast-tx p{margin:5px 0 0;font-size:13.5px;color:#52525b;line-height:1.6;}
.enc-toast-ac{display:flex;align-items:center;gap:10px;flex-shrink:0;}
.enc-toast-cta{background:#2563eb;color:#fff;font-size:14px;font-weight:700;padding:11px 18px;border-radius:10px;text-decoration:none;white-space:nowrap;}
.enc-toast-cta:hover{background:#1d4ed8;}
.enc-toast-x{background:none;border:none;font-size:22px;line-height:1;color:#a1a1aa;cursor:pointer;padding:4px 8px;}
@media(max-width:640px){.enc-toast-in{flex-direction:column;align-items:flex-start;gap:12px;}.enc-toast-ac{width:100%;}.enc-toast-cta{flex:1;text-align:center;}}
`;

const GLOSS_JS = `
;(function(){
  if (window.__encGloss) return; window.__encGloss = 1;
  var P = location.pathname || '';
  if (P.indexOf('/encyclopedia') === 0) return; // 백과사전 페이지 자체 제외
  function ready(fn){ if(document.readyState!=='loading'){ fn(); } else { document.addEventListener('DOMContentLoaded', fn); } }
  function esc(x){ return String(x).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }
  var tip, toast;
  ready(function(){
    fetch('/api/board?type=board&groupSlug=${GROUP_SLUG}')
      .then(function(r){ return r.json(); })
      .then(function(posts){
        if(!Array.isArray(posts) || !posts.length) return;
        var terms = posts.map(function(p){
          var m = String(p.title||'').match(/^\\s*\\[([^\\]]+)\\]\\s*(.+)$/);
          var name = m ? m[2].trim() : String(p.title||'').trim();
          var d = document.createElement('div'); d.innerHTML = String(p.content||'');
          var raw = (d.textContent || '')
            .replace(/\\[\\[([^\\]]+)\\]\\]/g,'$1')
            .replace(/\\[\\*[^\\]]*\\]/g,'')
            .replace(/\\s+/g,' ')
            .replace(/^개요\\s*/,'')
            .trim();
          if(raw.length > 140) raw = raw.slice(0,140) + '…';
          var alias = name.replace(/\\s*[\\(（][^\\)）]*[\\)）]\\s*/g,'').trim();
          return { id:p.id, name:name, alias:(alias && alias!==name && alias.length>=2)?alias:null, sum:raw };
        }).filter(function(t){ return t.name && t.name.length>=2; });
        terms.sort(function(a,b){ return b.name.length - a.name.length; });

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
          span.setAttribute('tabindex','0');
          span.setAttribute('role','button');
          span.setAttribute('aria-label', bestT.name + ' 용어 설명 보기');
          span.__sum = bestT.sum;
          var parent = node.parentNode;
          parent.insertBefore(document.createTextNode(before), node);
          parent.insertBefore(span, node);
          node.nodeValue = after;
          active = active.filter(function(x){ return x.id !== bestT.id; });
          usedCount++;
          i--; // 같은 노드의 나머지(after)에서 다른 용어 재탐색
        }
        if(usedCount > 0) buildUI();
      })
      .catch(function(){});
  });

  function termOf(e){ var t = e.target; return (t && t.classList && t.classList.contains('glosst')) ? t : null; }
  function buildUI(){
    tip = document.createElement('div'); tip.className = 'enc-gloss-ui enc-tip'; tip.style.display = 'none';
    document.body.appendChild(tip);
    toast = document.createElement('div'); toast.className = 'enc-gloss-ui enc-toast'; toast.style.display = 'none';
    document.body.appendChild(toast);
    document.addEventListener('mouseover', function(e){ var s=termOf(e); if(s) showTip(s); }, true);
    document.addEventListener('mouseout', function(e){ if(termOf(e)) tip.style.display='none'; }, true);
    document.addEventListener('focusin', function(e){ var s=termOf(e); if(s) showTip(s); }, true);
    document.addEventListener('focusout', function(e){ if(termOf(e)) tip.style.display='none'; }, true);
    document.addEventListener('click', function(e){ var s=termOf(e); if(s){ e.preventDefault(); openToast(s); } }, true);
    document.addEventListener('keydown', function(e){
      var s = termOf(e);
      if(s && (e.key==='Enter' || e.key===' ')){ e.preventDefault(); openToast(s); }
    }, true);
    window.addEventListener('scroll', function(){ if(tip) tip.style.display='none'; }, true);
  }
  function showTip(s){
    tip.innerHTML = '<b>'+esc(s.getAttribute('data-ename'))+'</b><span>'+esc(s.__sum||'')+'</span><em>클릭하면 자세히 안내</em>';
    tip.style.display = 'block';
    var r = s.getBoundingClientRect();
    var tw = tip.offsetWidth, th = tip.offsetHeight;
    var left = Math.min(Math.max(8, r.left), window.innerWidth - tw - 8);
    var top = r.top - th - 10;
    if(top < 8) top = r.bottom + 10;
    tip.style.left = left + 'px'; tip.style.top = top + 'px';
  }
  function openToast(s){
    if(tip) tip.style.display = 'none';
    var id = s.getAttribute('data-eid');
    var name = s.getAttribute('data-ename');
    toast.innerHTML =
      '<div class="enc-toast-in">'
      + '<div class="enc-toast-tx"><strong>'+esc(name)+'</strong><p>'+esc(s.__sum||'')+'</p></div>'
      + '<div class="enc-toast-ac">'
      + '<a class="enc-toast-cta" href="/encyclopedia-doc?postId='+encodeURIComponent(id)+'">백과사전에서 자세히 보기</a>'
      + '<button type="button" class="enc-toast-x" aria-label="닫기">×</button>'
      + '</div></div>';
    toast.style.display = 'block';
    requestAnimationFrame(function(){ toast.classList.add('on'); });
    var x = toast.querySelector('.enc-toast-x');
    if(x) x.onclick = function(){ toast.classList.remove('on'); setTimeout(function(){ toast.style.display='none'; }, 250); };
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
const run = (s,p=[]) => new Promise((r,j)=>db.run(s,p,function(e){ e?j(e):r(this); }));
const get = (s,p=[]) => new Promise((r,j)=>db.get(s,p,(e,x)=>e?j(e):r(x)));

async function main() {
  db = new sqlite3.Database(DB_PATH);
  console.log('[서울365열린치과 용어 글로서리 패치 — hospital_id=' + HOSPITAL_ID + ']');
  const h = await get('SELECT id,name,slug FROM hospitals WHERE id=?', [HOSPITAL_ID]);
  if (!h || h.slug !== HOSPITAL_SLUG_GUARD) {
    console.error('[ABORT] hospital_id=' + HOSPITAL_ID + ' 가 ' + HOSPITAL_SLUG_GUARD + '이 아님:', JSON.stringify(h));
    process.exitCode = 1; db.close(); return;
  }
  console.log('  대상 병원 확인: ' + h.name + ' (slug=' + h.slug + ')');

  const page = await get(
    "SELECT id, custom_css, custom_js FROM pages WHERE slug='_footer' AND hospital_id=?",
    [HOSPITAL_ID]
  );
  if (!page) {
    console.error('[ABORT] hospital_id=' + HOSPITAL_ID + ' 의 _footer 페이지가 없습니다. 중단.');
    process.exitCode = 1; db.close(); return;
  }

  const css = patchBlock(page.custom_css, CSS_START, CSS_END, GLOSS_CSS);
  const js  = patchBlock(page.custom_js,  JS_START,  JS_END,  GLOSS_JS);

  await run(
    "UPDATE pages SET custom_css=?, custom_js=?, updated_at=CURRENT_TIMESTAMP WHERE id=? AND slug='_footer' AND hospital_id=?",
    [css.text, js.text, page.id, HOSPITAL_ID]
  );

  console.log('  [UPDATE pages._footer] id=' + page.id);
  console.log('  custom_css: ' + css.mode + ' (' + String(page.custom_css||'').length + ' → ' + css.text.length + ')');
  console.log('  custom_js : ' + js.mode  + ' (' + String(page.custom_js||'').length  + ' → ' + js.text.length  + ')');
  console.log('[완료] 글로서리 패치 종료');
  db.close();
}

export { GLOSS_JS, GLOSS_CSS };

// 직접 실행될 때만 패치 수행 (import 시 부작용 없음 — 검증용)
const invokedDirectly = process.argv[1] && process.argv[1].replace(/\\/g, '/').endsWith('patch-seoul365-glossary.mjs');
if (invokedDirectly) {
  main().catch(e => { console.error('[에러]', e.message); process.exitCode = 1; db.close(); });
}
