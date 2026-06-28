// 서울에스원치과 (hospital_id=11, s1dental) SEO + GEO + EEAT 전체 시드
// - 의료진 1명(권영선 대표원장) + seo_settings 18행(본문 자동 생성·EEAT 매핑) + geo_settings 풀 시드
// - 가산적·멱등 (이미 채워진 필드 미변경)
// - hospital_id=11 외 절대 영향 없음
//
// 사용: node seed-s1dental-seo-geo-eeat.mjs ./wonjudental.db

import sqlite3 from 'sqlite3';

const HOSPITAL_ID = 11;
const HOSPITAL_SLUG_GUARD = 's1dental';
const HOSPITAL_DISPLAY = '서울에스원치과';
const TODAY = new Date().toISOString().slice(0, 10);
const OG_IMAGE_DEFAULT = '/uploads/hospitals/s1dental/boards/1778219665180-A7400149.jpg'; // 메인 hero 첫 사진
const COMMON_LOCAL = '군산, 군산시 치과, 군산 임플란트, 군산 치주, 전북 치과, 감염관리 우수회원';
const DB_PATH = process.argv[2] || './wonjudental.db';

// ── 의료진 1명 — 권영선 대표원장 ────────────────────────────────────────────
const DOCTOR = {
  name: '권영선',
  job_title: '대표원장',
  license_no: '치주과 전문의',
  specialty: '치주과 · 감염관리 · 임플란트 · 치주치료',
  credentials: [
    '치주과 전문의 (보건복지부 인증)',
    '대한치과감염학회(KADI) 인증 감염관리 우수회원',
    '치과 멸균 프로토콜·멸균기 검증 인증의',
  ].join('\n'),
  education: [
    '치과대학 졸업',
    '치주과 전공의 수련 수료',
  ].join('\n'),
  memberships: [
    '대한치주과학회 정회원',
    '대한치과감염학회 정회원',
    '대한치과의사협회 정회원',
  ].join('\n'),
  career: [
    '치주과 전문의 20년+ 임상 경력',
    '대한치과감염학회 라이브 세미나 — 「치과 멸균 프로토콜 및 멸균기 검증」 강연',
    '서울에스원치과 대표원장 (양산·군산 네트워크)',
    '감염관리 우수회원 치과 인증 (KADI)',
  ].join('\n'),
};

// ── GEO ───────────────────────────────────────────────────────────────────
const GEO = {
  clinic_name: HOSPITAL_DISPLAY,
  representative: '권영선',
  telephone: '063-468-2877',
  address: '전북특별자치도 군산시 월명로 252 동보빌딩 3층',
  street_address: '월명로 252 동보빌딩 3층',
  address_locality: '군산시',
  address_region: '전북특별자치도',
  opening_hours: '월·수·목 09:30 - 18:30 / 화·금 14:00 - 18:30 / 토 09:30 - 13:00 / 점심 13:00 - 14:00 / 일·공휴일 휴진',
  schema_opening_hours: 'Mo,We,Th 09:30-18:30; Tu,Fr 14:00-18:30; Sa 09:30-13:00',
  medical_specialty: 'Dentistry',
  area_served: '전북특별자치도 군산시',
  price_range: '$$',
};

// ── SEO 페이지별 메타 ──────────────────────────────────────────────────────
const PAGE_META = {
  main: {
    title: '서울에스원치과 | 군산 감염관리 우수회원 치과 · 임플란트·치주과 전문의',
    keywords: '서울에스원치과, 군산 치과, 군산 임플란트, 군산 치주과, 감염관리 우수회원, 대한치과감염학회, 권영선 원장, 치주과 전문의',
    aeo: '서울에스원치과는 대한치과감염학회(KADI) 인증 감염관리 우수회원 치과로, 치주과 전문의 권영선 대표원장이 검증된 멸균 환경에서 임플란트·임플란트 재수술·치주치료·보철·충치치료를 제공하는 군산 치과입니다.',
    schema_type: 'Dentist',
    schema_name: '서울에스원치과',
  },
  about: {
    title: '서울에스원치과 인사말 | 권영선 대표원장 · 치주과 전문의',
    keywords: '서울에스원치과 인사말, 권영선 대표원장, 치주과 전문의, 군산 치과 의료진, 감염관리 강연',
    aeo: '서울에스원치과는 치주과 전문의 권영선 대표원장이 진료하며, 대한치과감염학회 인증 감염관리 우수회원으로서 자연치아 보존과 안전한 진료를 최우선으로 합니다.',
    schema_type: 'AboutPage',
    schema_name: '서울에스원치과 인사말',
  },
  implant: {
    title: '군산 임플란트 | 무균 수술 환경 · 치주과 전문의 책임진료',
    keywords: '군산 임플란트, 서울에스원치과 임플란트, 무균 수술, 1인 1기구, 권영선 원장, 치주과 전문의 임플란트',
    aeo: '서울에스원치과 임플란트는 대한치과감염학회 인증 감염관리 우수회원 기준에 따라 1인 1기구·멸균 수술 환경에서 진행되며, 치주과 전문의가 잇몸과 뼈 상태까지 함께 진단합니다.',
    schema_type: 'MedicalProcedure',
    schema_name: '임플란트 (군산 서울에스원치과)',
  },
  'implant-revision': {
    title: '군산 임플란트 재수술 | 임플란트 주위염·실패 케이스 정밀 진단',
    keywords: '임플란트 재수술, 임플란트 주위염, 임플란트 실패, 군산 임플란트 재수술, 권영선 원장, 무균 수술 환경',
    aeo: '서울에스원치과는 기존 임플란트 주위염·실패 원인을 정밀 진단하고, 3단계 멸균 검증(BI/CI/물리적) 환경에서 안전한 재수술 방향을 안내합니다.',
    schema_type: 'MedicalProcedure',
    schema_name: '임플란트 재수술',
  },
  periodontal: {
    title: '군산 치주치료 | 치주과 전문의 20년+ · 잇몸염증·치주염 정밀 관리',
    keywords: '군산 치주치료, 치주염, 잇몸치료, 스케일링, 치주과 전문의, 권영선 원장, 잇몸 염증 군산',
    aeo: '치주과 전문의 권영선 대표원장(20년+ 경력)이 잇몸 염증·치석·치조골 상태·감염 여부를 종합 진단하여 자연치아를 오래 유지할 수 있는 치주치료를 안내합니다.',
    schema_type: 'MedicalProcedure',
    schema_name: '치주치료',
  },
  restoration: {
    title: '보철·충치치료 | 재감염 차단 · 자연치아 보존 중심',
    keywords: '군산 충치치료, 보철치료, 신경치료, 크라운, 인레이, 재감염 차단, 멸균 환경',
    aeo: '서울에스원치과 보철·충치치료는 3단계 멸균 검증으로 재감염을 차단하며, 자연치아 보존을 최우선으로 레진·인레이·크라운 등 단계적 치료를 안내합니다.',
    schema_type: 'MedicalProcedure',
    schema_name: '보철·충치치료',
  },
  location: {
    title: '서울에스원치과 오시는 길·진료시간 | 전북 군산시 월명로 252',
    keywords: '서울에스원치과 오시는길, 군산 치과 위치, 군산 월명로 치과, 진료시간, 063-468-2877',
    aeo: '서울에스원치과는 전북특별자치도 군산시 월명로 252 동보빌딩 3층에 위치합니다. 평일 09:30~18:30(화·금 오후), 토요일 09:30~13:00 진료, 전화 063-468-2877.',
    schema_type: 'Dentist',
    schema_name: '서울에스원치과 위치·진료시간',
  },
  notice: {
    title: '공지사항 | 서울에스원치과 소식',
    keywords: '서울에스원치과 공지, 군산 치과 휴진 안내, 진료 변경',
    aeo: '서울에스원치과의 휴진·진료 변경·운영 관련 공지사항을 확인할 수 있습니다.',
    schema_type: 'CollectionPage',
    schema_name: '서울에스원치과 공지사항',
  },
  'notice-detail': {
    title: '공지사항 상세 | 서울에스원치과',
    keywords: '서울에스원치과 공지 상세',
    aeo: '서울에스원치과 공지사항 상세 페이지입니다.',
    schema_type: 'WebPage',
  },
  event: {
    title: '이벤트 | 서울에스원치과 진료 혜택',
    keywords: '서울에스원치과 이벤트, 군산 치과 혜택, 임플란트 이벤트, 치주치료 혜택',
    aeo: '서울에스원치과에서 진행 중인 이벤트와 혜택 안내를 확인할 수 있습니다.',
    schema_type: 'CollectionPage',
    schema_name: '서울에스원치과 이벤트',
  },
  'event-detail': {
    title: '이벤트 상세 | 서울에스원치과',
    keywords: '서울에스원치과 이벤트 상세',
    aeo: '서울에스원치과 이벤트 상세 페이지입니다.',
    schema_type: 'WebPage',
  },
  'board-faq': {
    title: '자주묻는 질문 | 서울에스원치과 진료 안내',
    keywords: '서울에스원치과 FAQ, 자주묻는 질문, 임플란트 문의, 치주치료 문의, 군산 치과 상담',
    aeo: '서울에스원치과 진료 전 자주 궁금해하시는 임플란트·치주치료·감염관리 관련 질문을 모았습니다.',
    schema_type: 'FAQPage',
    schema_name: '서울에스원치과 자주묻는 질문',
  },
  'board-faq-detail': {
    title: '자주묻는 질문 상세 | 서울에스원치과',
    keywords: '서울에스원치과 FAQ 상세',
    aeo: '서울에스원치과 자주묻는 질문 상세 페이지입니다.',
    schema_type: 'WebPage',
  },
  login:    { title: '로그인 | 서울에스원치과',          keywords: '서울에스원치과 로그인',    aeo: '서울에스원치과 회원 로그인 페이지입니다.',   schema_type: 'WebPage' },
  register: { title: '회원가입 | 서울에스원치과',        keywords: '서울에스원치과 회원가입',  aeo: '서울에스원치과 회원가입 페이지입니다.',       schema_type: 'WebPage' },
  mypage:   { title: '마이페이지 | 서울에스원치과',      keywords: '서울에스원치과 마이페이지', aeo: '서울에스원치과 회원 마이페이지입니다.',       schema_type: 'WebPage' },
  privacy:  { title: '개인정보 처리방침 | 서울에스원치과', keywords: '서울에스원치과 개인정보 처리방침', aeo: '서울에스원치과 개인정보 처리방침입니다.', schema_type: 'WebPage' },
  terms:    { title: '이용약관 | 서울에스원치과',        keywords: '서울에스원치과 이용약관',  aeo: '서울에스원치과 이용약관입니다.',             schema_type: 'WebPage' },
};

// 페이지 경로 매핑 (특수 경로만, 나머지는 /slug)
const PATH_MAP = {
  main: '/',
  notice: '/community/notice',
  'notice-detail': '/community/notice',
  event: '/community/event',
  'event-detail': '/community/event',
  'board-faq': '/community/faq',
  'board-faq-detail': '/community/faq',
};

// ── 페이지 content 첫 문단 추출 (description fallback) ───────────────────
function stripTags(html) {
  return String(html || '')
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}
function extractFirstParagraph(html, minLen = 40, maxLen = 160) {
  const ps = [...String(html || '').matchAll(/<p[^>]*>([\s\S]*?)<\/p>/gi)].map(m => stripTags(m[1]));
  for (const p of ps) {
    if (p && p.length >= minLen && !/^[\s·\-]+$/.test(p)) {
      return p.length > maxLen ? p.slice(0, maxLen - 1).trim() + '…' : p;
    }
  }
  const text = stripTags(html);
  if (text.length >= minLen) return text.length > maxLen ? text.slice(0, maxLen - 1).trim() + '…' : text;
  return '';
}

// ── DB ─────────────────────────────────────────────────────────────────────
let db;
const run = (s, p = []) => new Promise((r, j) => db.run(s, p, function (e) { e ? j(e) : r(this); }));
const get = (s, p = []) => new Promise((r, j) => db.get(s, p, (e, x) => e ? j(e) : r(x)));
const all = (s, p = []) => new Promise((r, j) => db.all(s, p, (e, x) => e ? j(e) : r(x)));

async function main() {
  db = new sqlite3.Database(DB_PATH);
  console.log(`[${HOSPITAL_DISPLAY} SEO + GEO + EEAT 통합 시드 — hospital_id=${HOSPITAL_ID}, date=${TODAY}]`);

  const h = await get('SELECT id,name,slug FROM hospitals WHERE id=?', [HOSPITAL_ID]);
  if (!h || h.slug !== HOSPITAL_SLUG_GUARD) {
    console.error(`[ABORT] hospital_id=${HOSPITAL_ID} 가 ${HOSPITAL_SLUG_GUARD}이 아님: ${JSON.stringify(h)}`);
    process.exitCode = 1; db.close(); return;
  }
  console.log(`  대상 병원: ${h.name} (slug=${h.slug})\n`);

  try {
    // ── 1) 권영선 원장 시드 (멱등: name 기준) ────────────────────────────
    let doc = await get('SELECT id FROM doctors WHERE hospital_id=? AND name=?', [HOSPITAL_ID, DOCTOR.name]);
    if (!doc) {
      const r = await run(
        `INSERT INTO doctors (hospital_id,name,job_title,license_no,specialty,credentials,education,memberships,career,photo_url,same_as,sort_order)
         VALUES (?,?,?,?,?,?,?,?,?,?,?,?)`,
        [HOSPITAL_ID, DOCTOR.name, DOCTOR.job_title, DOCTOR.license_no, DOCTOR.specialty, DOCTOR.credentials, DOCTOR.education, DOCTOR.memberships, DOCTOR.career, '', '', 0]
      );
      doc = { id: r.lastID };
      console.log(`  [INSERT doctors] ${DOCTOR.name} (${DOCTOR.job_title}) id=${doc.id}`);
    } else {
      console.log(`  [skip doctors] ${DOCTOR.name} 이미 존재 id=${doc.id}`);
    }
    const docId = doc.id;

    // ── 2) GEO 시드 (멱등: 빈 필드만 채움) ────────────────────────────────
    const exGeo = await get('SELECT * FROM geo_settings WHERE hospital_id=? ORDER BY id DESC LIMIT 1', [HOSPITAL_ID]);
    if (!exGeo) {
      const cols = ['hospital_id', ...Object.keys(GEO)];
      const placeholders = cols.map(() => '?').join(',');
      const params = [HOSPITAL_ID, ...Object.values(GEO)];
      await run(`INSERT INTO geo_settings (${cols.join(',')}) VALUES (${placeholders})`, params);
      console.log(`  [INSERT geo_settings] hospital_id=${HOSPITAL_ID} 풀 시드`);
    } else {
      const sets = [];
      const params = [];
      const applied = [];
      for (const [k, v] of Object.entries(GEO)) {
        const cur = exGeo[k];
        if (cur === null || cur === '' || cur === undefined) {
          sets.push(`${k} = ?`);
          params.push(v);
          applied.push(k);
        }
      }
      if (sets.length === 0) {
        console.log('  [skip geo_settings] 모든 필드 채워짐');
      } else {
        sets.push('updated_at = CURRENT_TIMESTAMP');
        params.push(exGeo.id);
        await run(`UPDATE geo_settings SET ${sets.join(', ')} WHERE id = ?`, params);
        console.log(`  [UPDATE geo_settings] ${applied.length}개 필드 채움 (${applied.join(', ')})`);
      }
    }

    // ── 3) seo_settings 행 보장 + 본문 + EEAT 매핑 ───────────────────────
    const sitePages = await all(
      "SELECT slug, title, content FROM pages WHERE hospital_id=? AND slug NOT LIKE '\\_%' ESCAPE '\\' ORDER BY slug",
      [HOSPITAL_ID]
    );
    console.log(`  대상 페이지 ${sitePages.length}개\n`);

    let inserted = 0, updated = 0, filled = 0;
    for (const p of sitePages) {
      const slug = p.slug;
      const meta = PAGE_META[slug] || {};
      const path = PATH_MAP[slug] || `/${slug}`;
      const firstPara = extractFirstParagraph(p.content);

      const want = {
        title: meta.title || `${p.title || slug} | ${HOSPITAL_DISPLAY}`,
        keywords: meta.keywords || `${p.title || slug}, ${HOSPITAL_DISPLAY}`,
        aeo_summary: meta.aeo || `${HOSPITAL_DISPLAY} ${p.title || slug} 안내 페이지입니다.`,
        schema_type: meta.schema_type || 'WebPage',
        schema_name: meta.schema_name || (meta.title ? meta.title.split('|')[0].trim() : (p.title || slug)),
        local_keywords: COMMON_LOCAL,
      };
      const desc = firstPara || want.aeo_summary;
      want.description = desc;
      want.og_title = want.title;
      want.og_description = desc.length > 200 ? desc.slice(0, 199) + '…' : desc;
      want.og_image = OG_IMAGE_DEFAULT;
      want.schema_description = desc.length > 160 ? desc.slice(0, 159) + '…' : desc;

      const exRow = await get('SELECT * FROM seo_settings WHERE slug=? AND hospital_id=?', [slug, HOSPITAL_ID]);
      if (!exRow) {
        await run(
          `INSERT INTO seo_settings (slug,hospital_id,page_label,path,title,description,keywords,og_title,og_description,og_image,canonical_url,author,schema_type,schema_name,schema_description,aeo_summary,local_keywords,author_doctor_id,reviewer_doctor_id,last_reviewed,updated_at)
           VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,CURRENT_TIMESTAMP)`,
          [slug, HOSPITAL_ID, p.title || slug, path,
           want.title, want.description, want.keywords, want.og_title, want.og_description, want.og_image, '',
           HOSPITAL_DISPLAY, want.schema_type, want.schema_name, want.schema_description, want.aeo_summary, want.local_keywords,
           docId, docId, TODAY]
        );
        inserted++;
      } else {
        // 빈 필드만 채움 + EEAT 갱신
        const sets = [];
        const params = [];
        const fields = ['title','description','keywords','og_title','og_description','og_image','schema_type','schema_name','schema_description','aeo_summary','local_keywords'];
        for (const f of fields) {
          if (!exRow[f]) { sets.push(`${f}=?`); params.push(want[f]); }
        }
        // EEAT는 항상 갱신
        sets.push('author_doctor_id=?', 'reviewer_doctor_id=?', 'last_reviewed=?');
        params.push(docId, docId, TODAY);
        sets.push('updated_at=CURRENT_TIMESTAMP');
        params.push(exRow.rowid);
        await run(`UPDATE seo_settings SET ${sets.join(', ')} WHERE rowid=?`, params);
        updated++;
        if (sets.length > 4) filled++;
      }
    }
    console.log(`  [seo_settings] 신규 ${inserted}건 / 기존 갱신 ${updated}건 (필드 보강 ${filled}건)`);
    console.log(`  EEAT: author=${DOCTOR.name}(#${docId}), reviewer=${DOCTOR.name}(#${docId}), last_reviewed=${TODAY}\n`);

    console.log(`[완료] ${HOSPITAL_DISPLAY} SEO + GEO + EEAT 시드 종료`);
  } catch (e) {
    console.error('[에러]', e.message);
    process.exitCode = 1;
  } finally {
    db.close();
  }
}

main();
