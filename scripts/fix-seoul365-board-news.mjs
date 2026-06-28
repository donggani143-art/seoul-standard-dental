// 서울365열린치과 (hospital_id=10) /board-news 목록·상세 JS 패치
// - 목록 페이지: /api/board?type=news  →  /api/board?groupSlug=news
// - 목록 → 상세 링크: '/board-news' + id  →  '/board-news-detail?id=' + id
// - 상세 페이지: getPostId()가 pathname 마지막 세그먼트를 읽음 → query string ?id=  방식으로 변경

import sqlite3 from 'sqlite3';

const HID = 10;
const HSLUG = 'seoul365opendental';
const DB = process.argv[2] || './wonjudental.db';

const db = new sqlite3.Database(DB);
const get = (sql, p = []) => new Promise((r, j) => db.get(sql, p, (e, x) => e ? j(e) : r(x)));
const run = (sql, p = []) => new Promise((r, j) => db.run(sql, p, function (e) { e ? j(e) : r(this); }));

const LIST_JS = `(function () {
  var container = document.getElementById('newsList');
  if (!container) return;

  function escapeHtml(value) {
    return String(value || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  function formatDate(value) {
    var raw = value || '';
    var datePart = raw.slice(0, 10);
    var parts = datePart.split('-');
    if (parts.length !== 3) return { day: '', ym: '' };
    return { day: parts[2], ym: parts[0] + '.' + parts[1] };
  }

  function getLogo(post) {
    return post.logo || post.thumbnail || post.thumb || post.image || post.cover_image || '';
  }

  fetch('/api/board?groupSlug=news', { credentials: 'same-origin' })
    .then(function (response) {
      if (!response.ok) throw new Error('NETWORK_ERROR');
      return response.json();
    })
    .then(function (posts) {
      if (!Array.isArray(posts) || posts.length === 0) {
        container.innerHTML = '<div class="news-empty">등록된 언론보도가 없습니다.</div>';
        return;
      }
      var html = '';
      posts.forEach(function (post) {
        var id = encodeURIComponent(post.id);
        var title = escapeHtml(post.title);
        var date = formatDate(post.created_at || post.createdAt || post.date);
        var logo = getLogo(post);

        html += '<a href="/board-news-detail?id=' + id + '" class="news-row">';
        html += '  <div class="news-date">';
        html += '    <span class="news-date__day">' + escapeHtml(date.day) + '</span>';
        html += '    <span class="news-date__ym">' + escapeHtml(date.ym) + '</span>';
        html += '  </div>';
        html += '  <div class="news-content">';
        html += '    <h3>' + title + '</h3>';
        html += '  </div>';
        if (logo) {
          html += '  <div class="news-logo">';
          html += '    <img src="' + escapeHtml(logo) + '" alt="' + title + '">';
          html += '  </div>';
        }
        html += '</a>';
      });
      container.innerHTML = html;
    })
    .catch(function () {
      container.innerHTML = '<div class="news-empty">게시글을 불러올 수 없습니다.</div>';
    });
})();
`;

const DETAIL_JS = `(function () {
  var container = document.getElementById('newsDetail');
  if (!container) return;

  function escapeHtml(value) {
    return String(value || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  function formatDate(value) {
    var raw = value || '';
    var datePart = raw.slice(0, 10);
    var parts = datePart.split('-');
    if (parts.length !== 3) return datePart;
    return parts[0] + '.' + parts[1] + '.' + parts[2];
  }

  function getPostId() {
    var params = new URLSearchParams(window.location.search);
    return params.get('id') || '';
  }

  function normalizeBody(value) {
    if (!value) return '';
    var text = String(value);
    if (/<[a-z][\\s\\S]*>/i.test(text)) return text;
    return escapeHtml(text).replace(/\\n/g, '<br>');
  }

  function renderOriginalLink(post) {
    var url = post.url || post.link || post.original_url || '';
    if (!url) return '';
    return '<div class="news-original-link"><a href="' + escapeHtml(url) + '" target="_blank" rel="noopener">원문 기사 보기</a></div>';
  }

  var id = getPostId();
  if (!id) {
    container.innerHTML = '<div class="news-empty">게시글을 찾을 수 없습니다.</div>';
    return;
  }

  fetch('/api/board/' + encodeURIComponent(id), { credentials: 'same-origin' })
    .then(function (response) {
      if (!response.ok) throw new Error('NETWORK_ERROR');
      return response.json();
    })
    .then(function (post) {
      if (!post || !post.id) {
        container.innerHTML = '<div class="news-empty">게시글을 찾을 수 없습니다.</div>';
        return;
      }
      var title = escapeHtml(post.title);
      var date = formatDate(post.created_at || post.createdAt || post.date);
      var body = normalizeBody(post.content || post.body || '');
      var originalLink = renderOriginalLink(post);

      var html = '';
      html += '<div class="news-detail-head">';
      html += '  <h3>' + title + '</h3>';
      html += '  <div class="news-detail-meta">등록일 ' + escapeHtml(date) + '</div>';
      html += '</div>';
      html += '<div class="news-detail-body">' + body + originalLink + '</div>';
      html += '<div class="news-detail-actions">';
      html += '  <a href="/board-news" class="news-detail-list-btn">목록으로</a>';
      html += '</div>';
      container.innerHTML = html;
    })
    .catch(function () {
      container.innerHTML = '<div class="news-empty">게시글을 불러올 수 없습니다.</div>';
    });
})();
`;

(async () => {
  console.log('[seoul365 /board-news JS 패치]');
  const h = await get('SELECT id, slug FROM hospitals WHERE id=?', [HID]);
  if (!h || h.slug !== HSLUG) { console.error('[ABORT] hospital 검증 실패:', h); db.close(); process.exit(1); }

  const list = await get("SELECT id FROM pages WHERE hospital_id=? AND slug='board-news'", [HID]);
  const detail = await get("SELECT id FROM pages WHERE hospital_id=? AND slug='board-news-detail'", [HID]);
  if (!list || !detail) { console.error('[ABORT] 대상 페이지 누락:', { list, detail }); db.close(); process.exit(1); }

  const r1 = await run('UPDATE pages SET custom_js=?, updated_at=CURRENT_TIMESTAMP WHERE id=? AND hospital_id=?', [LIST_JS, list.id, HID]);
  console.log(`  [LIST]   id=${list.id}  changes=${r1.changes}`);
  const r2 = await run('UPDATE pages SET custom_js=?, updated_at=CURRENT_TIMESTAMP WHERE id=? AND hospital_id=?', [DETAIL_JS, detail.id, HID]);
  console.log(`  [DETAIL] id=${detail.id}  changes=${r2.changes}`);

  console.log('[완료]');
  db.close();
})();
