// 서울365열린치과(hospital_id=10, seoul365opendental) EEAT 1단계 시드
// - 의료진 3명(고성혁/황준섭/황조연) doctors 테이블에 멱등 시드
// - 33개 사이트 페이지의 seo_settings 빈 행 보장 (이미 있으면 skip)
// - 주제별 author_doctor_id 매핑(임플란트→고성혁, 교정→황조연, 심미·보철→황준섭 …)
// - reviewer_doctor_id 는 대표원장(고성혁) 통일, last_reviewed = 오늘
// - 가산적 / 멱등. hospital_id=10 외 절대 영향 없음.
//
// 사용: node seed-seoul365-eeat.mjs ./wonjudental.db

import sqlite3 from 'sqlite3';

const HOSPITAL_ID = 10;
const HOSPITAL_SLUG_GUARD = 'seoul365opendental';
const HOSPITAL_DISPLAY = '서울365열린치과';
const DB_PATH = process.argv[2] || './wonjudental.db';
const TODAY = new Date().toISOString().slice(0, 10);

// ── 의료진 3명 (서울365 /doctors 페이지 정보 그대로) ──────────────────────────
const DOCTORS = [
  {
    name: '고성혁',
    job_title: '대표원장',
    license_no: '구강악안면외과 전문의 1326호 / 통합치의학과 전문의 2755호',
    specialty: '구강악안면외과 · 통합치의학과 · 임플란트',
    credentials: [
      '보건복지부 인증 구강악안면외과 전문의 (1326호)',
      '보건복지부 인증 통합치의학과 전문의 (2755호)',
      '대한구강악안면외과학회 인증 구강악안면외과 인정의',
    ].join('\n'),
    education: [
      '서울대학교 치과대학 졸업',
      '서울대학교 치과대학원 임플란트 연수과정 수료',
      '치의학 박사 과정 수료',
    ].join('\n'),
    memberships: [
      '대한구강악안면외과학회 정회원',
      '대한통합치과학회 정회원',
      '대한치과보철학회 정회원',
    ].join('\n'),
    career: [
      '제60차 대한구강악안면외과학회 종합학술대회 우수상 수상',
      '제24차 EAO 국제학회 우수상 수상',
      '2018 AOCE Management of Facial Trauma 과정 수료',
      '2018 AOCMF Advances in Orthognathic Surgery 과정 수료',
      '대한치과마취과학회 진정법 과정 수료',
      '오스템 임플란트 연구자문위원',
      '스트라우만 임플란트 연구자문위원',
      'IT Y건강스페셜 TV 출연',
      '국민일보 건강 주치의 칼럼 기고',
    ].join('\n'),
    photo_url: '',
    same_as: '',
    sort_order: 0,
  },
  {
    name: '황준섭',
    job_title: '원장',
    license_no: '통합치의학과 전문의 4675호',
    specialty: '통합치의학과 · 심미보철 · 임플란트',
    credentials: [
      '보건복지부 인증 통합치의학과 전문의 (4675호)',
      '대한심미치과학회 인정의 펠로우',
      'MTA 교정 인증의',
    ].join('\n'),
    education: [
      '치과대학 외래교수',
      'MEA 과정 임상의',
      '아시아 심미보철 학회 과정 수료',
      '미국 뉴욕대 치과대학 Implantship 수료',
    ].join('\n'),
    memberships: [
      '대한통합치과학회 정회원',
      '대한심미치과학회 정회원',
      '대한보존치과학회 정회원',
    ].join('\n'),
    career: [
      '오스템 임플란트 Master course 수료',
      '원장 심층치료 임상 세미나 수료',
      'OBS 경인TV 닥터 OBS 출연',
      '주치의 칼럼 기고 — 앞니 치료, 제대로 알고 받아야',
    ].join('\n'),
    photo_url: '',
    same_as: '',
    sort_order: 1,
  },
  {
    name: '황조연',
    job_title: '원장',
    license_no: '치과교정과 전문의 1594호',
    specialty: '치과교정과 · 인비절라인',
    credentials: [
      '보건복지부 인증 치과교정과 전문의 (1594호)',
      '대한치과교정학회 인정의',
      '인비절라인 인증의',
    ].join('\n'),
    education: [
      '연세대학교 치의학 석사',
      '서울대학교병원 CED Fellowship 수료',
    ].join('\n'),
    memberships: [
      '미국치과교정학회 (AAO) 정회원',
      '대한치과교정학회 정회원',
      '대한치과교정학회 평생회원',
    ].join('\n'),
    career: [
      '대한치과교정학회 우수 포스터 증례발표',
      '대한치과교정학회 교정학 전문의 논문발표',
    ].join('\n'),
    photo_url: '',
    same_as: '',
    sort_order: 2,
  },
];

// ── 페이지별 path / author 주제 매핑 ───────────────────────────────────────
// path: pathMap에 명시된 경우 그 값, 아니면 `/${slug}`
const pathMap = {
  main: '/',
  notice: '/community/notice',
  'notice-detail': '/community/notice',
  event: '/community/event',
  'event-detail': '/community/event',
  'board-news': '/community/board-news',
  'board-news-detail': '/community/board-news',
};

// author 매핑: 페이지 주제 → 의료진 name
// 미명시 페이지는 대표원장(고성혁)으로 fallback
const authorByName = {
  'implant-sub1': '고성혁',   // 네비게이션임플란트
  'implant-sub2': '고성혁',   // 고난이도임플란트
  'implant-sub3': '고성혁',   // 보험임플란트
  'sleep-sub1':   '고성혁',   // 수면임플란트
  'sleep-sub2':   '고성혁',   // 수면통증클리닉
  'jaw':          '고성혁',   // 턱관절클리닉
  'clinic-sub2':  '고성혁',   // 고난이도 사랑니
  'clinic-sub5':  '고성혁',   // 소아치료(소아치과 전문 없어 대표 책임)
  'clinic-sub1':  '황준섭',   // 보철보존치료
  'clinic-sub3':  '황준섭',   // 심미치료
  'clinic-sub4':  '황준섭',   // 잇몸치료(보존)
  'ortho-sub1':       '황조연', // 소아교정
  'orthodontic-sub2': '황조연', // 청소년 성인 교정
  'orthodontic-sub3': '황조연', // 부분교정 MTA
  // 메인·소개·시설·오시는길·백과사전·언론·공지·이벤트는 default(고성혁)
  // 시스템 페이지(login/register/mypage/privacy/terms)도 default
};

// ── DB 작업 ──────────────────────────────────────────────────────────────────
let db;
const run = (s, p = []) => new Promise((r, j) => db.run(s, p, function (e) { e ? j(e) : r(this); }));
const get = (s, p = []) => new Promise((r, j) => db.get(s, p, (e, x) => e ? j(e) : r(x)));
const all = (s, p = []) => new Promise((r, j) => db.all(s, p, (e, x) => e ? j(e) : r(x)));

async function main() {
  db = new sqlite3.Database(DB_PATH);
  console.log(`[${HOSPITAL_DISPLAY} EEAT 1단계 시드 — hospital_id=${HOSPITAL_ID}, date=${TODAY}]`);

  const h = await get('SELECT id,name,slug FROM hospitals WHERE id=?', [HOSPITAL_ID]);
  if (!h || h.slug !== HOSPITAL_SLUG_GUARD) {
    console.error(`[ABORT] hospital_id=${HOSPITAL_ID} 가 ${HOSPITAL_SLUG_GUARD}이 아님: ${JSON.stringify(h)}`);
    process.exitCode = 1; db.close(); return;
  }
  console.log(`  대상 병원 확인: ${h.name} (slug=${h.slug})`);

  try {
    // 1) 의료진 시드 (멱등: hospital_id + name)
    const docByName = {};
    for (const d of DOCTORS) {
      let ex = await get('SELECT id FROM doctors WHERE hospital_id=? AND name=?', [HOSPITAL_ID, d.name]);
      if (!ex) {
        const r = await run(
          `INSERT INTO doctors (hospital_id,name,job_title,license_no,specialty,credentials,education,memberships,career,photo_url,same_as,sort_order)
           VALUES (?,?,?,?,?,?,?,?,?,?,?,?)`,
          [HOSPITAL_ID, d.name, d.job_title, d.license_no, d.specialty, d.credentials, d.education, d.memberships, d.career, d.photo_url, d.same_as, d.sort_order]
        );
        ex = { id: r.lastID };
        console.log(`  [INSERT doctors] ${d.name} (${d.job_title}) id=${ex.id}`);
      } else {
        console.log(`  [skip doctors] ${d.name} 이미 존재 id=${ex.id}`);
      }
      docByName[d.name] = ex.id;
    }
    const defaultAuthorId = docByName['고성혁'];
    const reviewerId = docByName['고성혁']; // 대표원장 통일

    // 2) 사이트 페이지 목록(_헤더/푸터 제외) — seo_settings 빈 행 보장
    const sitePages = await all(
      "SELECT slug, title FROM pages WHERE hospital_id=? AND slug NOT LIKE '\\_%' ESCAPE '\\' ORDER BY slug",
      [HOSPITAL_ID]
    );
    console.log(`  대상 페이지 ${sitePages.length}개`);

    let inserted = 0, updated = 0;
    for (const p of sitePages) {
      const slug = p.slug;
      const path = pathMap[slug] || `/${slug}`;
      const authorName = authorByName[slug] || '고성혁';
      const authorId = docByName[authorName];

      const exRow = await get('SELECT rowid FROM seo_settings WHERE slug=? AND hospital_id=?', [slug, HOSPITAL_ID]);
      if (!exRow) {
        await run(
          `INSERT INTO seo_settings (slug,hospital_id,page_label,path,title,description,keywords,og_title,og_description,og_image,canonical_url,author,schema_type,schema_name,schema_description,aeo_summary,local_keywords,author_doctor_id,reviewer_doctor_id,last_reviewed,updated_at)
           VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,CURRENT_TIMESTAMP)`,
          [slug, HOSPITAL_ID, p.title || slug, path,
           '', '', '', '', '', '', '', HOSPITAL_DISPLAY, '', '', '', '', '',
           authorId, reviewerId, TODAY]
        );
        inserted++;
      } else {
        // 기존 행은 EEAT 매핑만 갱신 (멱등) — 본문(title/desc/keywords/aeo) 유지
        await run(
          `UPDATE seo_settings
             SET author_doctor_id=?, reviewer_doctor_id=?, last_reviewed=?, updated_at=CURRENT_TIMESTAMP
           WHERE slug=? AND hospital_id=?`,
          [authorId, reviewerId, TODAY, slug, HOSPITAL_ID]
        );
        updated++;
      }
    }
    console.log(`  [seo_settings] 신규 ${inserted}건 / EEAT 매핑 갱신 ${updated}건`);

    // 3) 페이지별 author 매핑 요약
    console.log('  [EEAT mapping summary]');
    const counts = {};
    for (const p of sitePages) {
      const an = authorByName[p.slug] || '고성혁';
      counts[an] = (counts[an] || 0) + 1;
    }
    Object.entries(counts).forEach(([name, c]) => console.log(`    author=${name}: ${c}페이지`));
    console.log(`    reviewer=고성혁: ${sitePages.length}페이지 (전체)`);
    console.log(`    last_reviewed=${TODAY}`);

    console.log(`[완료] ${HOSPITAL_DISPLAY} EEAT 1단계 시드 종료`);
  } catch (e) {
    console.error('[에러]', e.message);
    process.exitCode = 1;
  } finally {
    db.close();
  }
}

main();
