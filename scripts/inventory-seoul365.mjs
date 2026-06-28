import sqlite3 from 'sqlite3';
const db = new sqlite3.Database(process.argv[2] || './wonjudental.db');
const HOSPITAL_ID = 10;

function all(sql, params = []) {
  return new Promise((res, rej) => db.all(sql, params, (e, rows) => e ? rej(e) : res(rows)));
}

(async () => {
  const pages = await all(
    'SELECT id, slug, title, page_type, sort_order, is_published, length(content) AS clen, length(custom_css) AS csslen FROM pages WHERE hospital_id=? ORDER BY page_type, sort_order, slug',
    [HOSPITAL_ID]
  );
  console.log('=== PAGES (hospital_id=10) ===');
  pages.forEach(p => {
    console.log(`  [${p.page_type}] /${p.slug.padEnd(28)} | ${p.title.padEnd(20)} | content=${p.clen}b css=${p.csslen}b ${p.is_published ? '✓' : '✗'}`);
  });

  console.log('\n=== IMAGE REFERENCES IN CONTENT ===');
  const all_pages = await all('SELECT slug, content, custom_css FROM pages WHERE hospital_id=?', [HOSPITAL_ID]);
  const refs = new Map();
  const re = /\/uploads\/hospitals\/seoul365opendental\/[^\s"'`)]+/g;
  for (const p of all_pages) {
    const text = (p.content || '') + '\n' + (p.custom_css || '');
    const matches = text.match(re) || [];
    for (const m of matches) {
      if (!refs.has(m)) refs.set(m, new Set());
      refs.get(m).add(p.slug);
    }
  }
  const sorted = [...refs.entries()].sort((a, b) => a[0].localeCompare(b[0]));
  for (const [path, slugs] of sorted) {
    console.log(`  ${path}  ←  ${[...slugs].join(', ')}`);
  }

  db.close();
})();
