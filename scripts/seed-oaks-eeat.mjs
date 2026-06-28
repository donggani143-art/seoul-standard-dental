// 옥스치과의원(hospital_id=3, oaksdental) 페이지별 EEAT 데이터 시드
// - 배철민 대표원장 1명 생성(없으면) + hospital_id=3 의 seo_settings 전 행에
//   author_doctor_id / reviewer_doctor_id / last_reviewed 설정
// - encyclopedia / encyclopedia-doc 는 seo_settings 행이 없으면 최소 행 생성
// - 가산적 / 멱등. hospital_id=3 외 절대 영향 없음. 자격·학력은 병원이 관리자에서 보완.
//
// 사용: node seed-oaks-eeat.mjs ./wonjudental.db

import sqlite3 from 'sqlite3';

const HOSPITAL_ID = 3;
const DB_PATH = process.argv[2] || './wonjudental.db';
const TODAY = new Date().toISOString().slice(0, 10);

let db;
const run = (s,p=[]) => new Promise((r,j)=>db.run(s,p,function(e){ e?j(e):r(this); }));
const get = (s,p=[]) => new Promise((r,j)=>db.get(s,p,(e,x)=>e?j(e):r(x)));
const all = (s,p=[]) => new Promise((r,j)=>db.all(s,p,(e,x)=>e?j(e):r(x)));

async function main() {
  db = new sqlite3.Database(DB_PATH);
  console.log('[옥스치과 EEAT 시드 — hospital_id=' + HOSPITAL_ID + ', date=' + TODAY + ']');

  const h = await get('SELECT id,name,slug FROM hospitals WHERE id=?', [HOSPITAL_ID]);
  if (!h || h.slug !== 'oaksdental') {
    console.error('[ABORT] hospital_id=' + HOSPITAL_ID + ' 가 oaksdental이 아님:', JSON.stringify(h));
    process.exitCode = 1; db.close(); return;
  }
  console.log('  대상 병원 확인: ' + h.name + ' (slug=' + h.slug + ')');

  try {
    // 1) 배철민 대표원장 (멱등: name 기준)
    let doc = await get("SELECT id FROM doctors WHERE hospital_id=? AND name=?", [HOSPITAL_ID, '배철민']);
    if (!doc) {
      const r = await run(
        `INSERT INTO doctors (hospital_id,name,job_title,license_no,specialty,credentials,education,memberships,career,photo_url,same_as,sort_order)
         VALUES (?,?,?,?,?,?,?,?,?,?,?,?)`,
        [HOSPITAL_ID, '배철민', '대표원장', '', '치과교정·임플란트·심미치료', '', '', '', '', '', '', 0]
      );
      doc = { id: r.lastID };
      console.log('  [INSERT doctors] 배철민 대표원장 id=' + doc.id);
    } else {
      console.log('  [skip doctors] 배철민 이미 존재 id=' + doc.id);
    }
    const did = doc.id;

    // 2) 백과사전 페이지에 seo_settings 최소 행 보장
    const encRows = [
      { slug:'encyclopedia',     label:'치과 백과사전',      path:'/encyclopedia' },
      { slug:'encyclopedia-doc', label:'치과 백과사전 문서', path:'/encyclopedia-doc' },
    ];
    for (const e of encRows) {
      const ex = await get('SELECT rowid FROM seo_settings WHERE slug=? AND hospital_id=?', [e.slug, HOSPITAL_ID]);
      if (!ex) {
        await run(
          `INSERT INTO seo_settings (slug,hospital_id,page_label,path,author,author_doctor_id,reviewer_doctor_id,last_reviewed,updated_at)
           VALUES (?,?,?,?,?,?,?,?,CURRENT_TIMESTAMP)`,
          [e.slug, HOSPITAL_ID, e.label, e.path, '옥스치과의원', did, did, TODAY]
        );
        console.log('  [INSERT seo_settings] ' + e.slug);
      }
    }

    // 3) hospital_id=3 전 seo_settings 행에 author/reviewer/last_reviewed 설정 (멱등)
    const before = await all('SELECT slug FROM seo_settings WHERE hospital_id=?', [HOSPITAL_ID]);
    const res = await run(
      `UPDATE seo_settings
         SET author_doctor_id=?, reviewer_doctor_id=?, last_reviewed=?, updated_at=CURRENT_TIMESTAMP
       WHERE hospital_id=?`,
      [did, did, TODAY, HOSPITAL_ID]
    );
    console.log('  [UPDATE seo_settings] hospital_id=3 ' + res.changes + '행 (slugs: ' + before.map(r=>r.slug).join(', ') + ')');
    console.log('[완료] 옥스치과 EEAT 시드 종료');
  } catch (e) {
    console.error('[에러]', e.message);
    process.exitCode = 1;
  } finally {
    db.close();
  }
}
main();
