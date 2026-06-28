// 서울365열린치과 (hospital_id=10) 업로드 자산 정리
// - DB에서 실제 참조되는 이미지 경로를 추출
// - 참조되지 않는 파일을 _archive/ 로 이동 (구조 유지)
// - MB_*.png + 깨진 파일명은 영구 삭제
// - 활성 페이지가 참조하는 파일은 절대 건드리지 않음

import sqlite3 from 'sqlite3';
import fs from 'fs';
import path from 'path';

const HOSPITAL_ID = 10;
const HOSPITAL_SLUG = 'seoul365opendental';
const DB_PATH = process.argv[2] || './wonjudental.db';
const ROOT = process.argv[3] || `/var/www/wonju-dental/uploads/hospitals/${HOSPITAL_SLUG}`;
const ARCHIVE = path.join(ROOT, '_archive');

const REFERENCE_RE = new RegExp(`/uploads/hospitals/${HOSPITAL_SLUG}/([^\\s"'\`)<>]+)`, 'g');

// cp949→UTF-8 깨짐 감지: 박스 드로잉(U+2500–U+25FF) 또는 키릴(U+0400–U+04FF)이 파일명에 들어 있으면 손상으로 간주
const CORRUPT_NAME_RE = /[─-◿Ѐ-ӿ]/;

function db_all(db, sql, params = []) {
  return new Promise((res, rej) => db.all(sql, params, (e, rows) => e ? rej(e) : res(rows)));
}

function walk(dir, base = dir) {
  if (!fs.existsSync(dir)) return [];
  const out = [];
  for (const name of fs.readdirSync(dir)) {
    const full = path.join(dir, name);
    if (full === ARCHIVE) continue;
    const st = fs.lstatSync(full);
    if (st.isDirectory()) out.push(...walk(full, base));
    else out.push(path.relative(base, full).split(path.sep).join('/'));
  }
  return out;
}

(async () => {
  const db = new sqlite3.Database(DB_PATH);
  const rows = await db_all(db, 'SELECT slug, content, custom_css, custom_js FROM pages WHERE hospital_id=?', [HOSPITAL_ID]);
  db.close();

  const referenced = new Set();
  for (const r of rows) {
    const text = (r.content || '') + '\n' + (r.custom_css || '') + '\n' + (r.custom_js || '');
    let m;
    while ((m = REFERENCE_RE.exec(text)) !== null) referenced.add(m[1]);
  }
  console.log(`[refs] DB 참조 파일 수: ${referenced.size}`);

  const all = walk(ROOT);
  console.log(`[fs] 폴더 내 파일 수: ${all.length}`);

  const TO_DELETE_PERM = [];
  const TO_ARCHIVE = [];
  const KEEP = [];

  for (const rel of all) {
    if (rel.startsWith('_archive/')) continue;

    if (referenced.has(rel)) { KEEP.push(rel); continue; }

    const base = path.basename(rel);

    if (CORRUPT_NAME_RE.test(base)) { TO_DELETE_PERM.push(rel); continue; }
    if (/^MB_.*\.(png|jpg|jpeg|gif|webp)$/i.test(base)) { TO_DELETE_PERM.push(rel); continue; }

    TO_ARCHIVE.push(rel);
  }

  console.log(`[plan] 유지: ${KEEP.length}, 영구삭제: ${TO_DELETE_PERM.length}, 아카이브 이동: ${TO_ARCHIVE.length}`);

  const refList = [...referenced].sort();
  const missingFromDisk = refList.filter(r => !all.includes(r));
  if (missingFromDisk.length) {
    console.log('[warn] DB가 참조하지만 디스크에 없는 파일:');
    for (const r of missingFromDisk) console.log('   - ' + r);
  }

  if (process.argv.includes('--dry-run')) {
    console.log('\n=== DRY RUN ===');
    console.log('[삭제 예정]');
    TO_DELETE_PERM.forEach(f => console.log('  DEL  ' + f));
    console.log('[아카이브 이동 예정 (앞 30건만 표시)]');
    TO_ARCHIVE.slice(0, 30).forEach(f => console.log('  MV   ' + f));
    if (TO_ARCHIVE.length > 30) console.log(`  ... +${TO_ARCHIVE.length - 30}건`);
    return;
  }

  if (!fs.existsSync(ARCHIVE)) fs.mkdirSync(ARCHIVE, { recursive: true });

  let delOk = 0, mvOk = 0;
  for (const rel of TO_DELETE_PERM) {
    const src = path.join(ROOT, rel);
    try { fs.unlinkSync(src); delOk++; console.log('  DEL  ' + rel); }
    catch (e) { console.error('  DEL_ERR ' + rel + ' :: ' + e.message); }
  }
  for (const rel of TO_ARCHIVE) {
    const src = path.join(ROOT, rel);
    const dst = path.join(ARCHIVE, rel);
    fs.mkdirSync(path.dirname(dst), { recursive: true });
    try { fs.renameSync(src, dst); mvOk++; }
    catch (e) { console.error('  MV_ERR ' + rel + ' :: ' + e.message); }
  }

  function pruneEmpty(dir) {
    if (dir === ROOT || dir === ARCHIVE) return;
    if (!fs.existsSync(dir)) return;
    for (const n of fs.readdirSync(dir)) {
      const f = path.join(dir, n);
      if (fs.lstatSync(f).isDirectory()) pruneEmpty(f);
    }
    if (fs.readdirSync(dir).length === 0) {
      fs.rmdirSync(dir);
      console.log('  RMDIR ' + path.relative(ROOT, dir));
    }
  }
  pruneEmpty(ROOT);

  console.log(`\n[완료] 영구삭제 ${delOk} / 아카이브 이동 ${mvOk}`);
})();
