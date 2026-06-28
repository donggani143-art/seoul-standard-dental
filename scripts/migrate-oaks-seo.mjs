// 옥스치과의원 GEO + SEO/AEO/GEO 메타데이터 마이그레이션
// hospital_id = 3 (oaksdental) 만 대상. 다른 병원 절대 영향 없음.
//
// 동작:
//   1) geo_settings UPDATE (hospital_id=3 단일 행)
//   2) seo_settings UPSERT (per slug, hospital_id=3)
//   3) pages.meta_title / meta_description 동기화 (per slug, hospital_id=3)

import sqlite3 from 'sqlite3';

const HOSPITAL_ID = 3;
const DB_PATH = process.argv[2] || './wonjudental.db';

const BRAND = '옥스치과의원';
const AUTHOR = '옥스치과의원';

// ── 병원 GEO 정보 ───────────────────────────────────────────────
const GEO = {
  clinic_name: '옥스치과의원',
  representative: '배철민',
  address: '서울특별시 강남구 테헤란로 105, A타워 7층',
  street_address: '테헤란로 105 A타워 7층',
  address_locality: '강남구',
  address_region: '서울특별시',
  postal_code: '06134',
  telephone: '02-555-6633',
  website_url: 'https://oaksdental.metalink3.mycafe24.com',
  opening_hours: '평일 10:00~19:00 / 토요일 10:00~14:00 / 점심 13:00~14:00 / 일요일·공휴일 휴진',
  schema_opening_hours: 'Mo,Tu,We,Th,Fr 10:00-19:00, Sa 10:00-14:00',
  medical_specialty: 'Dentistry',
  area_served: '서울특별시 강남구',
  price_range: '$$',
};

// ── 페이지별 SEO/AEO/GEO 데이터 ────────────────────────────────────────────────
const SEO_DATA = [
  {
    slug: 'home',                         // (public)/layout.js → buildMetadata('home')
    page_label: '홈 (메인)',
    path: '/',
    title: '옥스치과의원 | 강남 테헤란로 치아교정·임플란트·인비절라인',
    description: '서울 강남 테헤란로 옥스치과의원. 치아교정·인비절라인·임플란트·라미네이트·잇몸성형·미백 전문 진료. 평일 10:00~19:00, 토요일 진료.',
    keywords: '강남 치과, 테헤란역 치과, 옥스치과, 치아교정, 인비절라인, 임플란트, 라미네이트, 잇몸성형, 치아미백, 강남 임플란트',
    og_title: '강남 테헤란로 옥스치과의원',
    og_description: '치아교정·임플란트·인비절라인·라미네이트·미백·잇몸성형. 평일 10시~19시 진료.',
    og_image: '',
    canonical_url: '',
    author: AUTHOR,
    schema_type: 'Dentist',
    schema_name: '옥스치과의원',
    schema_description: '서울 강남구 테헤란로에 위치한 종합 치과 진료 의원. 치아교정·임플란트·인비절라인·라미네이트·잇몸성형·미백 전문.',
    aeo_summary: '옥스치과의원은 서울특별시 강남구 테헤란로 105 A타워 7층에 위치한 치과 의원으로, 치아교정·인비절라인·임플란트·라미네이트·치아미백·잇몸성형을 전문으로 하며 평일 10:00~19:00, 토요일 10:00~14:00 진료합니다.',
    local_keywords: '강남 치과, 테헤란역 치과, 강남구 치과, 역삼동 치과',
  },
  // ── 병원소개 카테고리 ──
  {
    slug: 'intro', page_label: '병원소개', path: '/intro',
    title: '병원소개 | 옥스치과의원 — 강남 테헤란로 치과',
    description: '환자 중심의 진료 철학과 맞춤형 치료를 제공하는 옥스치과의원의 진료 가치와 시설을 소개합니다.',
    keywords: '옥스치과 소개, 강남 치과 소개, 테헤란로 치과', og_title: '옥스치과의원 병원소개',
    og_description: '환자 중심의 진료 철학·시설·진료 가치 안내.', og_image: '', canonical_url: '',
    author: AUTHOR, schema_type: 'AboutPage', schema_name: '옥스치과의원 병원소개',
    schema_description: '옥스치과의원의 진료 철학·시설·운영 방침 소개 페이지.',
    aeo_summary: '옥스치과의원은 환자 중심의 진료 철학을 바탕으로 강남 테헤란로에서 종합 치과 진료를 제공하는 의원입니다.',
    local_keywords: '강남 치과 소개, 테헤란로 치과',
  },
  {
    slug: 'doctors', page_label: '의료진소개', path: '/doctors',
    title: '의료진소개 | 옥스치과의원 — 대표원장 배철민',
    description: '옥스치과의원의 대표원장 배철민 외 전문 의료진을 소개합니다. 치아교정·임플란트·심미치료 전문.',
    keywords: '배철민 원장, 옥스치과 의료진, 강남 치과 원장', og_title: '옥스치과 의료진',
    og_description: '대표원장 배철민 외 전문 의료진 프로필 소개.', og_image: '', canonical_url: '',
    author: AUTHOR, schema_type: 'AboutPage', schema_name: '옥스치과 의료진 소개',
    schema_description: '옥스치과의원의 대표원장 및 진료의 약력·전문 분야 소개.',
    aeo_summary: '옥스치과의원의 대표원장은 배철민이며, 치아교정·임플란트·심미치료를 전문으로 하는 의료진이 근무합니다.',
    local_keywords: '강남 치과 의료진, 옥스치과 원장',
  },
  {
    slug: 'guide', page_label: '진료안내', path: '/guide',
    title: '진료안내 | 옥스치과의원 — 평일 10시~19시, 토요일 진료',
    description: '옥스치과의원 진료시간·예약 안내·진료 절차. 평일 10:00~19:00, 토요일 10:00~14:00.',
    keywords: '옥스치과 진료시간, 강남 치과 예약, 테헤란로 치과 진료', og_title: '옥스치과 진료안내',
    og_description: '평일 10:00~19:00, 토요일 10:00~14:00. 점심 13:00~14:00.', og_image: '', canonical_url: '',
    author: AUTHOR, schema_type: 'WebPage', schema_name: '옥스치과 진료안내',
    schema_description: '옥스치과의원의 진료 시간·예약 절차·진료 안내 페이지.',
    aeo_summary: '옥스치과의원의 진료시간은 평일 10:00~19:00, 토요일 10:00~14:00이며 점심시간은 13:00~14:00, 일요일·공휴일은 휴진합니다.',
    local_keywords: '강남 치과 진료시간, 강남 치과 예약',
  },
  {
    slug: 'location', page_label: '찾아오시는 길', path: '/location',
    title: '찾아오시는 길 | 옥스치과의원 (강남 테헤란로 105 A타워 7층)',
    description: '옥스치과의원 위치 안내. 서울특별시 강남구 테헤란로 105 A타워 7층. 지하철·버스·자차 안내.',
    keywords: '옥스치과 위치, 강남 테헤란로 치과, 역삼역 치과, 강남구 테헤란로 치과', og_title: '옥스치과 오시는길',
    og_description: '서울 강남구 테헤란로 105 A타워 7층. 지하철·버스·자차 안내.', og_image: '', canonical_url: '',
    author: AUTHOR, schema_type: 'ContactPage', schema_name: '옥스치과 위치 및 오시는 길',
    schema_description: '옥스치과의원 본원 위치·교통편·주차 안내.',
    aeo_summary: '옥스치과의원은 서울특별시 강남구 테헤란로 105 A타워 7층에 위치하며, 지하철·버스·자차 모두 접근이 편리합니다.',
    local_keywords: '강남 테헤란로 치과, 역삼역 치과, 테헤란로 105',
  },
  // ── 진료과목 ──
  {
    slug: 'ortho', page_label: '치아교정', path: '/ortho',
    title: '치아교정 | 옥스치과의원 — 강남 교정 전문',
    description: '강남 옥스치과의원의 치아교정. 환자 맞춤형 진단과 정밀한 교정 계획으로 안정적인 결과를 제공합니다.',
    keywords: '강남 치아교정, 테헤란로 치아교정, 옥스치과 교정, 강남구 교정 치과', og_title: '옥스치과 치아교정',
    og_description: '환자 맞춤 진단과 정밀 교정 계획.', og_image: '', canonical_url: '',
    author: AUTHOR, schema_type: 'MedicalProcedure', schema_name: '옥스치과 치아교정',
    schema_description: '옥스치과의원의 치아교정 진료 안내·치료 계획·관리 가이드.',
    aeo_summary: '옥스치과의원은 정밀 진단을 기반으로 환자 맞춤형 치아교정 치료 계획을 수립하며, 교정 기간 중 정기 점검과 사후 관리까지 제공합니다.',
    local_keywords: '강남 치아교정, 테헤란로 교정, 강남구 교정',
  },
  {
    slug: 'invisalign', page_label: '인비절라인', path: '/invisalign',
    title: '인비절라인 | 옥스치과의원 — 투명교정 전문',
    description: '옥스치과의원의 인비절라인 투명교정. 보이지 않는 장치, 탈부착 가능한 편리함과 정밀한 교정 결과.',
    keywords: '인비절라인, 투명교정, 강남 인비절라인, 옥스치과 인비절라인', og_title: '옥스치과 인비절라인',
    og_description: '투명교정 인비절라인 — 보이지 않고 편리하며 정밀합니다.', og_image: '', canonical_url: '',
    author: AUTHOR, schema_type: 'MedicalProcedure', schema_name: '옥스치과 인비절라인',
    schema_description: '인비절라인 투명교정 진료 안내·과정·관리 가이드.',
    aeo_summary: '옥스치과의원의 인비절라인 투명교정은 탈부착 가능한 투명 장치로 일상생활의 불편 없이 교정이 가능하며, 디지털 시뮬레이션을 통한 사전 결과 예측을 제공합니다.',
    local_keywords: '강남 인비절라인, 테헤란로 투명교정',
  },
  {
    slug: 'implant', page_label: '임플란트', path: '/implant',
    title: '임플란트 | 옥스치과의원 — 강남 임플란트 전문',
    description: '강남 옥스치과의원의 임플란트. 정밀 진단·맞춤 식립 계획·체계적인 사후 관리로 오래가는 임플란트.',
    keywords: '강남 임플란트, 테헤란로 임플란트, 옥스치과 임플란트, 강남 임플란트 잘하는 곳', og_title: '옥스치과 임플란트',
    og_description: '정밀 진단·맞춤 식립·체계적 사후 관리.', og_image: '', canonical_url: '',
    author: AUTHOR, schema_type: 'MedicalProcedure', schema_name: '옥스치과 임플란트',
    schema_description: '옥스치과의원의 임플란트 진료 안내·식립 과정·사후 관리.',
    aeo_summary: '옥스치과의원의 임플란트는 CT 정밀 진단을 기반으로 환자 구강 상태에 맞춘 식립 계획을 수립하며, 식립 후 정기 점검과 사후 관리 프로그램을 제공합니다.',
    local_keywords: '강남 임플란트, 테헤란로 임플란트, 역삼동 임플란트',
  },
  {
    slug: 'whitening', page_label: '치아미백', path: '/whitening',
    title: '치아미백 | 옥스치과의원 — 강남 미백 전문',
    description: '옥스치과의원의 치아미백. 치아 손상 최소화한 안전한 미백 시스템과 자연스러운 결과.',
    keywords: '강남 치아미백, 옥스치과 미백, 테헤란로 치아미백', og_title: '옥스치과 치아미백',
    og_description: '안전한 미백 시스템으로 자연스러운 결과.', og_image: '', canonical_url: '',
    author: AUTHOR, schema_type: 'MedicalProcedure', schema_name: '옥스치과 치아미백',
    schema_description: '옥스치과의원의 치아미백 진료 안내·과정·관리 가이드.',
    aeo_summary: '옥스치과의원의 치아미백은 치아 손상을 최소화하면서도 자연스러운 톤으로 개선되도록 안전한 미백 시스템을 사용합니다.',
    local_keywords: '강남 치아미백, 테헤란로 미백',
  },
  {
    slug: 'laminate', page_label: '라미네이트', path: '/laminate',
    title: '라미네이트 | 옥스치과의원 — 심미 라미네이트',
    description: '옥스치과의원의 라미네이트. 자연스러운 색조·형태 디자인으로 심미적인 미소 라인 완성.',
    keywords: '강남 라미네이트, 옥스치과 라미네이트, 심미 라미네이트', og_title: '옥스치과 라미네이트',
    og_description: '자연스러운 색조·형태 디자인.', og_image: '', canonical_url: '',
    author: AUTHOR, schema_type: 'MedicalProcedure', schema_name: '옥스치과 라미네이트',
    schema_description: '라미네이트 시술 안내·과정·관리 가이드.',
    aeo_summary: '옥스치과의원의 라미네이트는 자연 치아의 색조·형태에 맞춰 심미적인 미소 라인을 디자인하는 심미 보철 시술입니다.',
    local_keywords: '강남 라미네이트, 테헤란로 라미네이트',
  },
  {
    slug: 'gum', page_label: '치아·잇몸성형', path: '/gum',
    title: '치아·잇몸성형 | 옥스치과의원 — 잇몸 라인 교정',
    description: '옥스치과의원의 치아·잇몸성형. 잇몸 라인 정렬과 미소 디자인으로 자연스러운 미소 완성.',
    keywords: '강남 잇몸성형, 옥스치과 잇몸, 거미스마일 교정, 잇몸 라인', og_title: '옥스치과 치아·잇몸성형',
    og_description: '잇몸 라인 정렬과 미소 디자인.', og_image: '', canonical_url: '',
    author: AUTHOR, schema_type: 'MedicalProcedure', schema_name: '옥스치과 치아·잇몸성형',
    schema_description: '치아·잇몸성형 진료 안내·과정·관리 가이드.',
    aeo_summary: '옥스치과의원의 치아·잇몸성형은 잇몸 라인 교정과 미소 디자인을 통해 자연스러운 미소 라인을 완성하는 심미 시술입니다.',
    local_keywords: '강남 잇몸성형, 강남 거미스마일 교정',
  },
  // ── 게시판 목록 페이지 ──
  {
    slug: 'notice', page_label: '공지사항', path: '/community/notice',
    title: '공지사항 | 옥스치과의원',
    description: '옥스치과의원의 공지사항. 휴진 안내, 진료시간 변경, 운영 공지 등을 확인하세요.',
    keywords: '옥스치과 공지사항, 강남 치과 공지', og_title: '옥스치과 공지사항',
    og_description: '휴진 안내 및 운영 공지.', og_image: '', canonical_url: '',
    author: AUTHOR, schema_type: 'CollectionPage', schema_name: '옥스치과 공지사항',
    schema_description: '옥스치과의원의 공지사항 목록 페이지.',
    aeo_summary: '옥스치과의원의 공지사항 게시판으로 휴진 안내, 진료시간 변경, 운영 관련 공지를 확인할 수 있습니다.',
    local_keywords: '강남 치과 공지, 옥스치과 운영 안내',
  },
  {
    slug: 'event', page_label: '이벤트', path: '/community/event',
    title: '이벤트 | 옥스치과의원',
    description: '옥스치과의원에서 진행 중인 진료 이벤트와 프로모션 안내.',
    keywords: '옥스치과 이벤트, 강남 치과 이벤트, 치과 프로모션', og_title: '옥스치과 이벤트',
    og_description: '진료 이벤트와 프로모션 안내.', og_image: '', canonical_url: '',
    author: AUTHOR, schema_type: 'CollectionPage', schema_name: '옥스치과 이벤트',
    schema_description: '옥스치과의원의 이벤트 목록 페이지.',
    aeo_summary: '옥스치과의원에서 진행하는 치료 이벤트와 프로모션을 확인할 수 있는 게시판입니다.',
    local_keywords: '강남 치과 이벤트, 옥스치과 프로모션',
  },
  {
    slug: 'board-photo', page_label: '치료 전후사진', path: '/community/photo',
    title: '치료 전후사진 | 옥스치과의원 — 치아교정·임플란트·라미네이트 결과',
    description: '옥스치과의원에서 진행한 치아교정·임플란트·라미네이트 등의 치료 전후 사진을 확인하세요.',
    keywords: '옥스치과 전후사진, 강남 치아교정 전후, 임플란트 전후, 라미네이트 전후',
    og_title: '옥스치과 치료 전후사진',
    og_description: '치아교정·임플란트·라미네이트 치료 전후사진.', og_image: '', canonical_url: '',
    author: AUTHOR, schema_type: 'CollectionPage', schema_name: '옥스치과 치료 전후사진',
    schema_description: '치료 전후사진 갤러리. 치아교정·임플란트·라미네이트 등 시술 결과 모음.',
    aeo_summary: '옥스치과의원의 치료 전후사진 갤러리에서 치아교정·임플란트·라미네이트 등의 시술 결과를 비교하여 확인할 수 있습니다.',
    local_keywords: '강남 치아교정 전후, 강남 임플란트 전후',
  },
  {
    slug: 'board-column', page_label: '건강컬럼', path: '/community/column',
    title: '건강컬럼 | 옥스치과의원 — 치아·잇몸 건강 정보',
    description: '옥스치과의원이 전하는 치아·잇몸 건강 컬럼. 일상에서 챙기는 구강 건강 관리 가이드.',
    keywords: '치아건강, 잇몸건강, 옥스치과 컬럼, 구강건강 정보', og_title: '옥스치과 건강컬럼',
    og_description: '치아·잇몸 건강 가이드.', og_image: '', canonical_url: '',
    author: AUTHOR, schema_type: 'CollectionPage', schema_name: '옥스치과 건강컬럼',
    schema_description: '옥스치과의원이 운영하는 치아·잇몸 건강 정보 칼럼 게시판.',
    aeo_summary: '옥스치과의원의 건강컬럼은 치아·잇몸 건강 관리, 시술 후 관리법, 구강 위생 가이드 등 환자에게 도움이 되는 정보를 제공합니다.',
    local_keywords: '치아건강 정보, 잇몸건강 가이드',
  },
  {
    slug: 'board-gallery', page_label: '갤러리', path: '/community/gallery',
    title: '갤러리 | 옥스치과의원 — 병원 시설·일상',
    description: '옥스치과의원의 시설·일상·이벤트 사진 갤러리.',
    keywords: '옥스치과 갤러리, 강남 치과 시설', og_title: '옥스치과 갤러리',
    og_description: '병원 시설·일상·이벤트 사진.', og_image: '', canonical_url: '',
    author: AUTHOR, schema_type: 'CollectionPage', schema_name: '옥스치과 갤러리',
    schema_description: '옥스치과의원의 시설·일상·이벤트 사진 갤러리.',
    aeo_summary: '옥스치과의원의 시설, 일상, 이벤트 사진을 볼 수 있는 갤러리입니다.',
    local_keywords: '강남 치과 시설, 옥스치과 갤러리',
  },
  // ── 정책 ──
  {
    slug: 'privacy', page_label: '개인정보 처리방침', path: '/privacy',
    title: '개인정보 처리방침 | 옥스치과의원',
    description: '옥스치과의원의 개인정보 처리방침. 수집·이용 목적, 보유 기간, 이용자 권리 안내.',
    keywords: '옥스치과 개인정보, 개인정보처리방침', og_title: '옥스치과 개인정보 처리방침',
    og_description: '개인정보 처리방침 안내.', og_image: '', canonical_url: '',
    author: AUTHOR, schema_type: 'WebPage', schema_name: '옥스치과 개인정보 처리방침',
    schema_description: '옥스치과의원의 개인정보 처리방침 안내 페이지.',
    aeo_summary: '옥스치과의원의 개인정보 처리방침은 수집 항목, 이용 목적, 보유 기간, 이용자의 권리 등을 명시합니다.',
    local_keywords: '',
  },
  {
    slug: 'terms', page_label: '이용약관', path: '/terms',
    title: '이용약관 | 옥스치과의원',
    description: '옥스치과의원 웹사이트 이용약관.',
    keywords: '옥스치과 이용약관', og_title: '옥스치과 이용약관',
    og_description: '웹사이트 이용약관.', og_image: '', canonical_url: '',
    author: AUTHOR, schema_type: 'WebPage', schema_name: '옥스치과 이용약관',
    schema_description: '옥스치과의원 웹사이트 이용약관 페이지.',
    aeo_summary: '옥스치과의원 웹사이트 이용약관은 서비스 이용 조건과 회원의 권리·의무를 안내합니다.',
    local_keywords: '',
  },
];

// ── DB 작업 ───────────────────────────────────────────────────────
const db = new sqlite3.Database(DB_PATH);
function run(sql, params = []) { return new Promise((res, rej) => db.run(sql, params, function(err){ if(err) rej(err); else res(this); })); }
function get(sql, params = []) { return new Promise((res, rej) => db.get(sql, params, (err, row) => { if(err) rej(err); else res(row); })); }

async function updateGeo() {
  // hospital_id=3 의 단일 row만 UPDATE. NULL 필드만 채우거나 GEO 객체 값으로 덮어씀.
  // favicon_url, og_image_url 은 보존 (이미 설정되어 있음)
  const cols = [
    'clinic_name','representative','address','street_address','address_locality','address_region','postal_code',
    'telephone','website_url','opening_hours','schema_opening_hours','medical_specialty','area_served','price_range',
  ];
  const setSql = cols.map(c => `${c} = ?`).join(', ');
  const params = cols.map(c => GEO[c]);
  const result = await run(
    `UPDATE geo_settings SET ${setSql}, updated_at = CURRENT_TIMESTAMP WHERE hospital_id = ?`,
    [...params, HOSPITAL_ID]
  );
  console.log(`  [UPDATE geo_settings] rows changed: ${result.changes}`);
}

async function upsertSeo(s) {
  const existing = await get('SELECT rowid FROM seo_settings WHERE slug = ? AND hospital_id = ?', [s.slug, HOSPITAL_ID]);
  const fields = [
    s.page_label, s.path, s.title, s.description, s.keywords,
    s.og_title, s.og_description, s.og_image, s.canonical_url,
    s.author, s.schema_type, s.schema_name, s.schema_description,
    s.aeo_summary, s.local_keywords,
  ];
  if (existing) {
    await run(
      `UPDATE seo_settings SET
        page_label=?, path=?, title=?, description=?, keywords=?,
        og_title=?, og_description=?, og_image=?, canonical_url=?,
        author=?, schema_type=?, schema_name=?, schema_description=?,
        aeo_summary=?, local_keywords=?, updated_at=CURRENT_TIMESTAMP
       WHERE rowid = ? AND hospital_id = ?`,
      [...fields, existing.rowid, HOSPITAL_ID]
    );
    console.log(`  [UPDATE seo_settings] ${s.slug}`);
  } else {
    await run(
      `INSERT INTO seo_settings
        (slug, hospital_id, page_label, path, title, description, keywords,
         og_title, og_description, og_image, canonical_url,
         author, schema_type, schema_name, schema_description,
         aeo_summary, local_keywords, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`,
      [s.slug, HOSPITAL_ID, ...fields]
    );
    console.log(`  [INSERT seo_settings] ${s.slug}`);
  }
}

// pages.meta_title / meta_description 동기화 (slug 매핑: home → main)
async function syncPageMeta(s) {
  const pageSlug = s.slug === 'home' ? 'main' : s.slug;
  const page = await get('SELECT id FROM pages WHERE slug = ? AND hospital_id = ?', [pageSlug, HOSPITAL_ID]);
  if (!page) {
    console.log(`  [skip pages.meta] ${pageSlug} (페이지 없음)`);
    return;
  }
  await run(
    'UPDATE pages SET meta_title = ?, meta_description = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ? AND hospital_id = ?',
    [s.title, s.description, page.id, HOSPITAL_ID]
  );
  console.log(`  [UPDATE pages.meta] ${pageSlug}`);
}

async function main() {
  console.log('[옥스치과 SEO/GEO 마이그레이션 시작 — hospital_id=3]');

  // 안전장치: hospital_id=3가 oaksdental 인지 재확인
  const h = await get('SELECT id, name, slug FROM hospitals WHERE id = ?', [HOSPITAL_ID]);
  if (!h || h.slug !== 'oaksdental') {
    console.error(`[ABORT] hospital_id=${HOSPITAL_ID} 가 oaksdental이 아님:`, h);
    process.exitCode = 1;
    db.close();
    return;
  }
  console.log(`  대상 병원 확인: ${h.name} (slug=${h.slug})`);

  try {
    await updateGeo();
    for (const s of SEO_DATA) {
      await upsertSeo(s);
      await syncPageMeta(s);
    }
    console.log(`[완료] 총 ${SEO_DATA.length}개 페이지 SEO 적용`);
  } catch (e) {
    console.error('[에러]', e.message);
    process.exitCode = 1;
  } finally {
    db.close();
  }
}

main();
