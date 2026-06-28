// 덴업 SEO·AEO·GEO 메타데이터 마이그레이션
// SKILL.md (seo-aeo-geo-checklist) 30개 항목 기준
// 대상 페이지: home, about, contact, services/insurance, services/chart, services/desk, services/consulting

import sqlite3 from 'sqlite3';

const HOSPITAL_ID = 8;
const DB_PATH = process.argv[2] || './wonjudental.db';

const PRIMARY_DOMAIN = 'https://denup.metalink3.mycafe24.com'; // 실제 운영 도메인 등록 시 자동 교체됨
const BRAND = '덴업 DENUP';
const AUTHOR = '덴업';

// ── 페이지별 SEO/AEO/GEO 데이터 ────────────────────────────────────────────────
const SEO_DATA = [
  {
    slug: 'home',                               // (public)/layout.js → buildMetadata('home')
    page_label: '홈 (메인 랜딩)',
    path: '/',
    title: '덴업 | 치과 경영 컨설팅·보험청구·전자차트·데스크 아웃소싱',
    description: '치과 경영의 판을 바꾸다. 20년 경력 전문가가 보험청구 최적화·전자차트 셋업·데스크 업무 아웃소싱·경영지원을 통합 제공합니다. 무료 진단 신청.',
    keywords: '치과 경영 컨설팅, 치과 보험청구, 전자차트, 덴트웹, 치과 데스크 아웃소싱, 비상주 경영지원실, 치과 경영, 덴업',
    og_title: '치과 경영의 판을 바꾸다 | 덴업',
    og_description: '20년 치과 경영·17년 보험청구 전문가. 안정적이고 지속 가능한 수익구조를 함께 만듭니다. 무료 보험청구 진단 받기.',
    og_image: '',                               // geo.og_image_url 폴백
    canonical_url: '',                          // resolveCanonicalBaseUrl 자동 생성
    author: AUTHOR,
    schema_type: 'Organization',
    schema_name: '덴업 DENUP',
    schema_description: '치과 경영 컨설팅 전문 기업. 보험청구·전자차트·데스크 업무·경영지원을 통합 제공.',
    aeo_summary: '덴업은 20년 경력의 치과 경영 컨설팅 전문 기업으로, 치과건강보험 청구 최적화·전자차트 시스템 구축·데스크 업무 아웃소싱·비상주 경영지원실을 통합 제공해 의료진이 진료에 집중할 수 있는 환경을 만듭니다.',
    local_keywords: '서울 강남 치과 컨설팅, 강남구 학동로 치과 경영, 전국 치과 보험청구 컨설팅',
  },
  {
    slug: 'about',
    page_label: '회사소개',
    path: '/about',
    title: '회사소개 | 덴업 — 20년 치과 경영 노하우와 17년 보험청구 전문성',
    description: '덴업은 2005년 시작된 치과 경영 컨설팅 브랜드입니다. 대표 이지수, 누적 120개 이상 치과와 함께 성장해온 여정과 3대 핵심가치(전문성·지속성·실행력)를 소개합니다.',
    keywords: '덴업 회사소개, 이지수 대표, 치과 컨설팅 회사, 치과 경영 전문가, 덴업 연혁',
    og_title: '치과 경영의 판을 바꾸다 — 덴업 회사소개',
    og_description: '20년 치과 경영, 17년 보험청구 전문성. 120개 이상의 치과와 함께한 여정.',
    og_image: '',
    canonical_url: '',
    author: AUTHOR,
    schema_type: 'AboutPage',
    schema_name: '덴업 회사소개',
    schema_description: '덴업의 미션·핵심가치·연혁(2005~2025)·CEO 메시지를 소개하는 페이지.',
    aeo_summary: '덴업은 2005년 창업자 이지수 대표가 첫 치과 경영 컨설팅을 시작한 이래 20년간 누적 120개 이상의 치과와 함께해왔으며, 전문성·지속성·실행력의 3대 핵심가치로 운영됩니다.',
    local_keywords: '서울 강남 치과 컨설팅 회사, 강남구 논현동 치과 경영지원',
  },
  {
    slug: 'contact',
    page_label: '오시는길 · 문의',
    path: '/contact',
    title: '오시는길·상담 신청 | 덴업 (서울 강남구 학동로2길 19)',
    description: '덴업 본사 위치(서울 강남구 학동로2길 19, 세일빌딩) · 대표번호 010-5152-7943 · 평일 09:00–18:00 운영. 무료 보험청구 진단 신청 폼이 있습니다.',
    keywords: '덴업 위치, 덴업 연락처, 덴업 오시는길, 강남 치과 컨설팅 상담, 무료 보험청구 진단',
    og_title: '덴업 오시는길 & 상담 신청',
    og_description: '서울 강남 학동역 도보 5분. 영업일 1일 이내 답변드립니다.',
    og_image: '',
    canonical_url: '',
    author: AUTHOR,
    schema_type: 'ContactPage',
    schema_name: '덴업 연락처 및 오시는길',
    schema_description: '덴업 본사 주소·전화·이메일·운영시간·대중교통 안내 및 온라인 상담 신청 폼.',
    aeo_summary: '덴업 본사는 서울특별시 강남구 학동로2길 19 세일빌딩에 위치하며, 7호선 학동역 도보 5분 거리, 평일 09:00–18:00 운영, 대표번호 010-5152-7943 또는 contact@denup.co.kr로 문의 가능합니다.',
    local_keywords: '서울 강남구 학동로 치과 컨설팅, 학동역 치과 경영지원, 논현동 세일빌딩',
  },
  {
    slug: 'services/insurance',
    page_label: '치과건강보험 UP',
    path: '/services/insurance',
    title: '치과건강보험 UP | 덴업 — 청구 클레임 50% 감소, 보험 매출 22% 증가',
    description: '3단계 청구 프로세스, HIRA 심사 기준 100% 준수, 실시간 분석·피드백. 덴업 보험청구 컨설팅으로 청구 오류는 줄이고 보험 매출은 늘리세요.',
    keywords: '치과건강보험 청구, HIRA 청구, 보험청구 컨설팅, 치과 청구 프로세스, 보험청구 클레임 감소, 덴트웹 청구',
    og_title: '치과건강보험 UP — 청구 오류 최소화 + 매출 향상',
    og_description: '3단계 청구·HIRA 기준 준수·실시간 분석으로 평균 보험 매출 22% 증가.',
    og_image: '',
    canonical_url: '',
    author: AUTHOR,
    schema_type: 'Service',
    schema_name: '치과건강보험 청구 컨설팅',
    schema_description: '치과 의원의 보험청구 프로세스를 진단·셋업·교육하고 월간 분석 리포트를 제공하는 컨설팅 서비스.',
    aeo_summary: '덴업의 치과건강보험 UP 서비스는 진료-검토-청구의 3단계 프로세스로 청구 오류를 사전 차단하고, 심평원(HIRA) 심사 기준에 100% 준수한 표준 워크플로우와 월간 청구 결과 분석을 제공해 평균 보험 매출 22% 증가, 클레임 50% 감소를 달성합니다.',
    local_keywords: '강남 치과 보험청구 컨설팅, 서울 치과 청구 대행, 전국 치과 HIRA 청구',
  },
  {
    slug: 'services/chart',
    page_label: '전자차트 UP',
    path: '/services/chart',
    title: '전자차트 UP | 덴업 — 종이차트→전자차트 셋업·교육·커스터마이징',
    description: '덴트웹 기반 전자차트 원클릭 셋업, 종이차트 등록 대행, 부서별 활용 교육, 커스텀 문진표·동의서·진료탭 제공. 평균 4주 내 시스템 정착.',
    keywords: '전자차트 셋업, 덴트웹 셋업, 치과 전자차트, 종이차트 전환, 커스텀 문진표, 치과 차팅 교육',
    og_title: '전자차트 UP — A부터 Z까지 한 번에',
    og_description: '덴트웹 기반 전자차트 셋업·교육·커스터마이징을 평균 4주 내에.',
    og_image: '',
    canonical_url: '',
    author: AUTHOR,
    schema_type: 'Service',
    schema_name: '치과 전자차트 셋업 컨설팅',
    schema_description: '치과 의원의 전자차트 시스템(덴트웹 등) 셋업·데이터 마이그레이션·부서별 교육·양식 커스터마이징 서비스.',
    aeo_summary: '덴업의 전자차트 UP 서비스는 덴트웹 기반 전자차트를 원클릭으로 셋업하고, 종이차트 등록 대행, 진료실·데스크·상담실 등 부서별 활용 교육, 커스텀 문진표·동의서·진료탭 양식을 제공하여 평균 4주 내 시스템 정착을 보장합니다.',
    local_keywords: '강남 치과 전자차트 셋업, 덴트웹 컨설팅, 서울 치과 차트 시스템',
  },
  {
    slug: 'services/desk',
    page_label: '데스크업무 UP',
    path: '/services/desk',
    title: '데스크업무 UP | 덴업 — 콜·예약·행정 아웃소싱, 인건비 50% 절감',
    description: '전문 상담원의 OUT/IN CALL 서비스, 예약 자동 관리, 원내 문서 제작 대행. 환자 만족도 60% 향상, 예약 취소율 20% 감소, 인건비 50% 절감.',
    keywords: '치과 데스크 아웃소싱, 치과 콜센터, 환자 응대, 예약 관리, 치과 행정 업무, 인건비 절감',
    og_title: '데스크업무 UP — 콜·예약·행정 통합 아웃소싱',
    og_description: '환자 만족도 60% 향상 / 예약 취소율 20% 감소 / 인건비 50% 절감.',
    og_image: '',
    canonical_url: '',
    author: AUTHOR,
    schema_type: 'Service',
    schema_name: '치과 데스크 업무 아웃소싱',
    schema_description: '치과 의원의 전화 응대·예약 관리·원내 행정 문서 작성을 외부 전문 상담원이 대행하는 서비스.',
    aeo_summary: '덴업의 데스크업무 UP 서비스는 전문 상담원이 OUT/IN CALL(30분 안 응대 / 7일 간격 / 10번 이상 관리), 예약 자동화, 원내 문서(동의서·주의사항·재증명 신청서) 제작을 통합 대행하며 도입 평균 환자 만족도 60% 향상·예약 취소율 20% 감소·인건비 50% 절감 효과를 제공합니다.',
    local_keywords: '치과 콜센터 대행, 강남 치과 데스크 아웃소싱, 서울 치과 응대 외주',
  },
  {
    slug: 'services/consulting',
    page_label: '치과 경영 업무 UP',
    path: '/services/consulting',
    title: '치과 경영 업무 UP | 덴업 — 데이터 기반 KPI 경영 + 비상주 경영지원실',
    description: '경영·진료·재무 데이터 통합 KPI 모니터링, 운영 시스템 구축, 비상주 경영지원실(채용·OJT·세무·노무). 평균 매출 35% 증가.',
    keywords: '치과 경영 컨설팅, 치과 KPI, 비상주 경영지원실, 치과 인력관리, 치과 세무노무, 치과 매출 증가',
    og_title: '치과 경영 업무 UP — 데이터 기반 전략 경영지원',
    og_description: '12개 핵심 KPI · 비상주 경영지원실 · 월 24시간 컨설팅. 평균 매출 35% 증가.',
    og_image: '',
    canonical_url: '',
    author: AUTHOR,
    schema_type: 'Service',
    schema_name: '치과 경영지원실 컨설팅',
    schema_description: '치과 의원의 경영 데이터 통합 분석·KPI 모니터링·운영 시스템 구축과 비상주 형태의 경영지원실(채용·OJT·세무·노무) 통합 서비스.',
    aeo_summary: '덴업의 치과 경영 업무 UP 서비스는 매출·환자수·재방문율 등 12개 핵심 KPI를 통합 분석하고, 운영 시스템 구축과 비상주 경영지원실(직원 채용·OJT·세무·노무)을 월간 24시간 컨설팅 형태로 제공하여 도입 치과 평균 매출 35% 증가 효과를 만듭니다.',
    local_keywords: '치과 경영 컨설팅 서울, 강남 치과 경영지원, 치과 비상주 경영지원실',
  },
];

// ── DB 작업 ────────────────────────────────────────────────────────────
const db = new sqlite3.Database(DB_PATH);
function run(sql, params = []) { return new Promise((res, rej) => db.run(sql, params, function(err){ if(err) rej(err); else res(this); })); }
function get(sql, params = []) { return new Promise((res, rej) => db.get(sql, params, (err, row) => { if(err) rej(err); else res(row); })); }

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
       WHERE rowid = ?`,
      [...fields, existing.rowid]
    );
    console.log(`  [UPDATE] seo_settings: ${s.slug}`);
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
    console.log(`  [INSERT] seo_settings: ${s.slug}`);
  }
}

// pages.meta_title / meta_description 동기화 (slug 매핑: home → main)
async function syncPageMeta(s) {
  const pageSlug = s.slug === 'home' ? 'main' : s.slug;
  const page = await get('SELECT id FROM pages WHERE slug = ? AND hospital_id = ?', [pageSlug, HOSPITAL_ID]);
  if (!page) {
    console.log(`  [skip] pages 미존재: ${pageSlug}`);
    return;
  }
  await run(
    'UPDATE pages SET meta_title = ?, meta_description = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
    [s.title, s.description, page.id]
  );
  console.log(`  [UPDATE] pages.meta: ${pageSlug}`);
}

async function main() {
  console.log('[덴업 SEO/AEO/GEO 마이그레이션 시작]');
  try {
    for (const s of SEO_DATA) {
      await upsertSeo(s);
      await syncPageMeta(s);
    }
    console.log('[완료] 총 ' + SEO_DATA.length + '개 페이지');
  } catch (e) {
    console.error('[에러]', e.message);
    process.exitCode = 1;
  } finally {
    db.close();
  }
}

main();
