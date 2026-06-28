// 서울365열린치과(hospital_id=10) GEO 기본값 시드 (3단계)
// - 최소 기본값만 채움 (clinic_name, representative, medical_specialty, area_served, price_range)
// - 주소·전화·진료시간·SNS·예약 URL 등 구체 정보는 어드민에서 직접 입력
// - 이미 geo_settings 행이 있으면 빈 필드만 채움 (멱등)
// - hospital_id=10 외 절대 영향 없음
//
// 사용: node seed-seoul365-geo.mjs ./wonjudental.db

import sqlite3 from 'sqlite3';

const HOSPITAL_ID = 10;
const HOSPITAL_SLUG_GUARD = 'seoul365opendental';
const HOSPITAL_DISPLAY = '서울365열린치과';
const DB_PATH = process.argv[2] || './wonjudental.db';

const DEFAULTS = {
  clinic_name: HOSPITAL_DISPLAY,
  representative: '고성혁',
  medical_specialty: 'Dentistry',
  area_served: '서울',
  price_range: '$$',
  // 빈 필드(어드민에서 입력):
  // address, street_address, address_locality, address_region, postal_code,
  // latitude, longitude, telephone, website_url, map_url,
  // kakao_channel_url, naver_booking_url, naver_blog_url, youtube_url, instagram_url,
  // opening_hours, schema_opening_hours
};

let db;
const run = (s, p = []) => new Promise((r, j) => db.run(s, p, function (e) { e ? j(e) : r(this); }));
const get = (s, p = []) => new Promise((r, j) => db.get(s, p, (e, x) => e ? j(e) : r(x)));

async function main() {
  db = new sqlite3.Database(DB_PATH);
  console.log(`[${HOSPITAL_DISPLAY} GEO 기본값 시드 — hospital_id=${HOSPITAL_ID}]`);

  const h = await get('SELECT id,name,slug FROM hospitals WHERE id=?', [HOSPITAL_ID]);
  if (!h || h.slug !== HOSPITAL_SLUG_GUARD) {
    console.error(`[ABORT] hospital_id=${HOSPITAL_ID} 가 ${HOSPITAL_SLUG_GUARD}이 아님: ${JSON.stringify(h)}`);
    process.exitCode = 1; db.close(); return;
  }
  console.log(`  대상 병원 확인: ${h.name} (slug=${h.slug})`);

  try {
    const ex = await get('SELECT * FROM geo_settings WHERE hospital_id=? ORDER BY id DESC LIMIT 1', [HOSPITAL_ID]);
    if (!ex) {
      // 신규 INSERT
      const cols = ['hospital_id', ...Object.keys(DEFAULTS)];
      const placeholders = cols.map(() => '?').join(',');
      const params = [HOSPITAL_ID, ...Object.values(DEFAULTS)];
      await run(
        `INSERT INTO geo_settings (${cols.join(',')}) VALUES (${placeholders})`,
        params
      );
      console.log(`  [INSERT geo_settings] hospital_id=${HOSPITAL_ID} 기본값 적용`);
      Object.entries(DEFAULTS).forEach(([k, v]) => console.log(`    ${k} = ${v}`));
    } else {
      // 빈 필드만 채움 (멱등)
      const sets = [];
      const params = [];
      const applied = [];
      for (const [k, v] of Object.entries(DEFAULTS)) {
        const cur = ex[k];
        if (cur === null || cur === '' || cur === undefined) {
          sets.push(`${k} = ?`);
          params.push(v);
          applied.push(`${k}=${v}`);
        }
      }
      if (sets.length === 0) {
        console.log('  [skip geo_settings] 모든 기본 필드가 이미 채워져 있음 — 변경 없음');
      } else {
        sets.push('updated_at = CURRENT_TIMESTAMP');
        params.push(ex.id);
        await run(`UPDATE geo_settings SET ${sets.join(', ')} WHERE id = ?`, params);
        console.log(`  [UPDATE geo_settings] id=${ex.id} — ${applied.length}개 필드 채움`);
        applied.forEach(s => console.log(`    ${s}`));
      }
    }

    // 확인
    const after = await get('SELECT * FROM geo_settings WHERE hospital_id=? ORDER BY id DESC LIMIT 1', [HOSPITAL_ID]);
    const filled = [];
    const empty = [];
    for (const [k, v] of Object.entries(after || {})) {
      if (k === 'id' || k === 'hospital_id' || k === 'updated_at') continue;
      if (v == null || v === '') empty.push(k);
      else filled.push(`${k}=${String(v).slice(0, 40)}`);
    }
    console.log(`  [현재 상태] filled=${filled.length}, empty=${empty.length}`);
    console.log(`  채워진 필드: ${filled.join(', ')}`);
    console.log(`  비어있음 (어드민 입력 필요): ${empty.join(', ')}`);

    console.log(`[완료] ${HOSPITAL_DISPLAY} GEO 기본값 시드 종료`);
  } catch (e) {
    console.error('[에러]', e.message);
    process.exitCode = 1;
  } finally {
    db.close();
  }
}

main();
