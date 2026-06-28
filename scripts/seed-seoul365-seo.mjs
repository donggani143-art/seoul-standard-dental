// 서울365열린치과(hospital_id=10) SEO 본문 자동 생성 (2단계)
// - seo_settings 의 빈 필드만 채움 (멱등) — 사용자가 어드민에서 채운 값은 절대 덮어쓰지 않음
// - 33개 사이트 페이지: title/description/keywords/og_*/schema_*/aeo_summary/local_keywords
// - 페이지별 명시 매핑 + 페이지 content 첫 문단 추출 결합
// - hospital_id=10 외 절대 영향 없음
//
// 사용: node seed-seoul365-seo.mjs ./wonjudental.db

import sqlite3 from 'sqlite3';

const HOSPITAL_ID = 10;
const HOSPITAL_SLUG_GUARD = 'seoul365opendental';
const HOSPITAL_DISPLAY = '서울365열린치과';
const OG_IMAGE_DEFAULT = '/uploads/hospitals/seoul365opendental/visual1.png';
const DB_PATH = process.argv[2] || './wonjudental.db';

// ── 페이지별 SEO 메타 정의 ───────────────────────────────────────────────────
// 각 페이지마다: title(우선) · keywords · aeo · schema_type · local_keywords
// description / og_* 는 페이지 content + title 기반 자동 생성
const COMMON_LOCAL = '서울, 서울 치과, 서울 임플란트';

const PAGE_META = {
  main: {
    title: '서울365열린치과 | 임플란트·교정·심미·턱관절 종합 치과',
    keywords: '서울365열린치과, 서울 치과, 365일 열린치과, 서울 임플란트, 서울 치아교정, 서울 심미치료, 서울 턱관절, 수면치료, 통합치의학과',
    aeo: '서울365열린치과는 구강악안면외과·통합치의학과·치과교정과 전문의가 함께 진료하는 종합 치과로, 임플란트·치아교정·심미치료·턱관절·수면치료를 제공합니다.',
    schema_type: 'Dentist',
    schema_name: '서울365열린치과',
  },
  doctors: {
    title: '의료진 소개 | 서울365열린치과 전문의 3인',
    keywords: '서울365 의료진, 고성혁 대표원장, 황준섭 원장, 황조연 원장, 구강악안면외과 전문의, 통합치의학과 전문의, 치과교정과 전문의',
    aeo: '서울365열린치과는 보건복지부 인증 구강악안면외과 전문의(고성혁 대표원장)·통합치의학과 전문의(황준섭 원장)·치과교정과 전문의(황조연 원장) 3인이 진료합니다.',
    schema_type: 'MedicalOrganization',
    schema_name: '서울365열린치과 의료진',
  },
  special: {
    title: '서울365열린치과의 특별함 | 진료 차별점',
    keywords: '서울365열린치과 특별함, 365일 진료, 전문의 책임진료, 수면마취 클리닉, 디지털 장비, 서울 치과 차별점',
    aeo: '서울365열린치과는 365일 진료, 전문의 책임 진료, 수면마취 치료 클리닉, 디지털 정밀 장비를 차별점으로 합니다.',
    schema_type: 'AboutPage',
    schema_name: '서울365열린치과의 특별함',
  },
  guide: {
    title: '진료 안내 | 서울365열린치과 진료 분야 전체 보기',
    keywords: '서울365 진료안내, 임플란트, 치아교정, 심미치료, 잇몸치료, 사랑니, 소아치료, 턱관절, 수면치료, 보철보존, 통합진료',
    aeo: '서울365열린치과 진료 분야는 임플란트, 치아교정, 심미치료, 잇몸치료, 사랑니 발치, 보철·보존, 소아치료, 턱관절·수면 클리닉을 포함합니다.',
    schema_type: 'MedicalWebPage',
  },
  equipment: {
    title: '시설·장비 안내 | 서울365열린치과 디지털 진단',
    keywords: '서울365 시설, 치과 장비, 디지털 치과, 콘빔CT, 구강스캐너, 멸균 시스템, 진료실 둘러보기',
    aeo: '서울365열린치과는 콘빔CT·디지털 구강스캐너 등 정밀 진단 장비와 멸균 관리 시스템을 갖추고 있습니다.',
    schema_type: 'AboutPage',
    schema_name: '서울365열린치과 시설',
  },
  location: {
    title: '오시는 길·진료시간 | 서울365열린치과',
    keywords: '서울365열린치과 오시는길, 서울365 위치, 서울 치과 진료시간, 365일 진료, 야간진료, 예약 안내',
    aeo: '서울365열린치과의 위치, 진료시간, 예약 안내를 확인할 수 있습니다.',
    schema_type: 'Dentist',
    schema_name: '서울365열린치과 위치·진료시간',
  },

  // ── 임플란트 (고성혁 대표원장) ─────────────────────────────────────────
  'implant-sub1': {
    title: '네비게이션 임플란트 | 서울365열린치과',
    keywords: '네비게이션 임플란트, 디지털 가이드 임플란트, 정밀 임플란트, 콘빔CT 임플란트, 서울 임플란트',
    aeo: '네비게이션 임플란트는 콘빔CT·디지털 설계를 기반으로 제작한 가이드를 사용해 계획된 위치·각도·깊이로 식립하는 정밀 임플란트 술식입니다.',
    schema_type: 'MedicalProcedure',
    schema_name: '네비게이션 임플란트',
  },
  'implant-sub2': {
    title: '고난이도 임플란트 | 뼈이식·상악동거상술',
    keywords: '고난이도 임플란트, 뼈이식 임플란트, 상악동거상술, 무치악 임플란트, 전악 임플란트, 서울 임플란트',
    aeo: '서울365열린치과는 뼈이식·상악동거상술·전악 임플란트 등 고난이도 임플란트를 구강악안면외과 전문의가 직접 진료합니다.',
    schema_type: 'MedicalProcedure',
    schema_name: '고난이도 임플란트',
  },
  'implant-sub3': {
    title: '보험 임플란트 | 서울365열린치과 만 65세 이상 대상',
    keywords: '보험 임플란트, 만65세 임플란트, 노인 임플란트 보험, 임플란트 보험 적용, 서울 보험임플란트',
    aeo: '보험 임플란트는 만 65세 이상을 대상으로 평생 2개까지 건강보험이 적용되는 임플란트 치료입니다.',
    schema_type: 'MedicalProcedure',
    schema_name: '보험 임플란트',
  },
  'sleep-sub1': {
    title: '수면 임플란트 | 치과 공포증 환자 수면마취 임플란트',
    keywords: '수면 임플란트, 수면마취 임플란트, 치과 공포증, 진정요법 임플란트, 무통 임플란트',
    aeo: '수면 임플란트는 치과 공포증·고난이도 식립에서 수면마취·진정요법으로 진행하는 임플란트 치료입니다.',
    schema_type: 'MedicalProcedure',
    schema_name: '수면 임플란트',
  },
  'sleep-sub2': {
    title: '수면통증 클리닉 | 서울365열린치과 진정 진료',
    keywords: '수면치료 클리닉, 치과 진정요법, 수면 치과치료, 치과 공포증 치료, 수면마취 치과',
    aeo: '서울365열린치과 수면통증 클리닉은 진정요법·수면마취로 치과 공포·통증을 줄이는 진료 프로그램입니다.',
    schema_type: 'MedicalProcedure',
    schema_name: '수면통증 클리닉',
  },
  jaw: {
    title: '턱관절 클리닉 | 서울365열린치과 TMJ 진료',
    keywords: '턱관절 치료, TMJ, 턱관절 장애, 턱관절 통증, 이갈이, 입벌림 장애, 서울 턱관절',
    aeo: '턱관절 클리닉은 턱관절 소리·통증·입벌림 제한 등을 영상 진단과 생활 습관을 함께 확인해 평가합니다.',
    schema_type: 'MedicalProcedure',
    schema_name: '턱관절 진료',
  },

  // ── 일반·소아 (고성혁) ──────────────────────────────────────────────────
  'clinic-sub2': {
    title: '고난이도 사랑니 발치 | 서울365열린치과',
    keywords: '사랑니 발치, 매복 사랑니, 고난이도 사랑니, 신경관 사랑니, 서울 사랑니',
    aeo: '매복·신경관 인접 등 고난이도 사랑니 발치는 파노라마·콘빔CT로 평가 후 구강악안면외과 전문의가 진료합니다.',
    schema_type: 'MedicalProcedure',
    schema_name: '고난이도 사랑니 발치',
  },
  'clinic-sub5': {
    title: '소아치료 | 서울365열린치과 어린이 치과 진료',
    keywords: '소아치과, 어린이 치과, 소아 충치치료, 실란트, 불소도포, 서울 소아치과',
    aeo: '서울365열린치과 소아치료는 어린이의 충치·실란트·불소도포·맹출 관찰 등 성장 단계 맞춤 진료를 진행합니다.',
    schema_type: 'MedicalProcedure',
    schema_name: '소아치과 진료',
  },

  // ── 보철·심미·잇몸 (황준섭 원장) ───────────────────────────────────────
  'clinic-sub1': {
    title: '보철·보존 치료 | 서울365열린치과',
    keywords: '보철치료, 보존치료, 신경치료, 크라운, 인레이 온레이, 서울 보철',
    aeo: '보철·보존 치료는 충치 제거 후 인레이·온레이·크라운으로 수복하거나, 깊은 충치를 신경치료로 보존하는 진료입니다.',
    schema_type: 'MedicalProcedure',
    schema_name: '보철·보존 치료',
  },
  'clinic-sub3': {
    title: '심미 치료 | 라미네이트·올세라믹·미백',
    keywords: '심미치료, 라미네이트, 올세라믹 크라운, 치아미백, 앞니 치료, 서울 심미치과',
    aeo: '심미 치료는 변색·형태 이상·앞니 보철을 라미네이트·올세라믹·치아미백·잇몸성형 등으로 개선합니다.',
    schema_type: 'MedicalProcedure',
    schema_name: '심미 치료',
  },
  'clinic-sub4': {
    title: '잇몸 치료 | 치주염·스케일링·잇몸수술',
    keywords: '잇몸치료, 치주염, 잇몸수술, 스케일링, 치근활택술, 서울 잇몸치과',
    aeo: '잇몸 치료는 스케일링·치근활택술 등 비외과적 처치와 진행된 치주염에 대한 외과적 치주치료를 단계적으로 진행합니다.',
    schema_type: 'MedicalProcedure',
    schema_name: '잇몸 치료',
  },

  // ── 교정 (황조연 원장) ──────────────────────────────────────────────────
  'ortho-sub1': {
    title: '소아 교정 | 성장기 부정교합·악정형 치료',
    keywords: '소아교정, 어린이 교정, 성장기 교정, 부정교합 치료, 악정형 치료, 서울 소아교정',
    aeo: '소아 교정은 성장기 부정교합·골격 부조화를 악정형 장치·1차 교정으로 조기에 관리하는 진료입니다.',
    schema_type: 'MedicalProcedure',
    schema_name: '소아 교정',
  },
  'orthodontic-sub2': {
    title: '청소년·성인 교정 | 서울365열린치과 교정과 전문의',
    keywords: '청소년 교정, 성인 교정, 인비절라인, 투명교정, 설측교정, 서울 치아교정',
    aeo: '청소년·성인 교정은 부정교합 유형에 따라 고정식·투명교정(인비절라인)·설측교정을 치과교정과 전문의가 진료합니다.',
    schema_type: 'MedicalProcedure',
    schema_name: '청소년·성인 교정',
  },
  'orthodontic-sub3': {
    title: '부분 교정·MTA 교정 | 짧은 기간 앞니 교정',
    keywords: '부분교정, MTA 교정, 앞니교정, 단기교정, 서울 부분교정',
    aeo: '부분 교정·MTA 교정은 앞니 중심의 한정된 부위를 단기간에 정렬하는 교정 방식으로, 적응증 평가가 선행됩니다.',
    schema_type: 'MedicalProcedure',
    schema_name: '부분 교정·MTA 교정',
  },

  // ── 콘텐츠·게시판 ───────────────────────────────────────────────────────
  encyclopedia: {
    title: '치과 백과사전 | 서울365열린치과가 검수하는 치과 용어 사전',
    keywords: '치과 백과사전, 치과 용어, 임플란트 용어, 교정 용어, 심미치료 용어, 서울365 백과사전',
    aeo: '서울365열린치과 치과 백과사전은 임플란트·교정·심미·일반치료의 핵심 용어를 의료진 검수로 제공합니다.',
    schema_type: 'CollectionPage',
    schema_name: '서울365열린치과 치과 백과사전',
  },
  'encyclopedia-doc': {
    title: '치과 백과사전 상세 | 서울365열린치과',
    keywords: '치과 용어 설명, 치과 백과사전 문서, 임플란트 설명, 교정 설명, 심미치료 설명',
    aeo: '치과 백과사전 상세 문서는 용어 정의, 진행 과정, 고려사항을 의료진 검수로 정리한 안내입니다.',
    schema_type: 'MedicalWebPage',
  },
  notice: {
    title: '공지사항 | 서울365열린치과 소식',
    keywords: '서울365 공지사항, 서울365열린치과 소식, 휴진 안내, 진료 안내',
    aeo: '서울365열린치과의 휴진·진료 변경·운영 관련 공지사항을 확인할 수 있습니다.',
    schema_type: 'CollectionPage',
    schema_name: '서울365열린치과 공지사항',
  },
  'notice-detail': {
    title: '공지사항 상세 | 서울365열린치과',
    keywords: '서울365 공지, 서울365열린치과 공지사항 상세',
    aeo: '서울365열린치과 공지사항 상세 페이지입니다.',
    schema_type: 'WebPage',
  },
  event: {
    title: '이벤트 | 서울365열린치과 혜택 안내',
    keywords: '서울365 이벤트, 서울365열린치과 혜택, 임플란트 이벤트, 교정 이벤트',
    aeo: '서울365열린치과에서 진행 중인 이벤트와 혜택 안내를 확인할 수 있습니다.',
    schema_type: 'CollectionPage',
    schema_name: '서울365열린치과 이벤트',
  },
  'event-detail': {
    title: '이벤트 상세 | 서울365열린치과',
    keywords: '서울365 이벤트 상세, 서울365열린치과 혜택',
    aeo: '서울365열린치과 이벤트 상세 페이지입니다.',
    schema_type: 'WebPage',
  },
  'board-news': {
    title: '언론 속 서울365열린치과 | 보도·출연 모음',
    keywords: '서울365 언론보도, OBS 닥터OBS, 채널A 건강스페셜, 국민일보 칼럼, 서울365열린치과 출연',
    aeo: '서울365열린치과 의료진의 방송 출연·언론 보도·전문 칼럼을 한눈에 확인할 수 있습니다.',
    schema_type: 'CollectionPage',
    schema_name: '언론 속 서울365열린치과',
  },
  'board-news-detail': {
    title: '언론보도 상세 | 서울365열린치과',
    keywords: '서울365 보도자료, 서울365열린치과 인터뷰, 의료진 출연',
    aeo: '서울365열린치과 언론보도·출연 상세입니다.',
    schema_type: 'WebPage',
  },

  // ── 시스템 (검색 노출 약함 — 최소 메타) ─────────────────────────────────
  login: {
    title: '로그인 | 서울365열린치과',
    keywords: '서울365 로그인',
    aeo: '서울365열린치과 회원 로그인 페이지입니다.',
    schema_type: 'WebPage',
  },
  register: {
    title: '회원가입 | 서울365열린치과',
    keywords: '서울365 회원가입',
    aeo: '서울365열린치과 회원가입 페이지입니다.',
    schema_type: 'WebPage',
  },
  mypage: {
    title: '마이페이지 | 서울365열린치과',
    keywords: '서울365 마이페이지',
    aeo: '서울365열린치과 회원 마이페이지입니다.',
    schema_type: 'WebPage',
  },
  privacy: {
    title: '개인정보 처리방침 | 서울365열린치과',
    keywords: '서울365 개인정보 처리방침',
    aeo: '서울365열린치과 개인정보 처리방침을 확인할 수 있습니다.',
    schema_type: 'WebPage',
  },
  terms: {
    title: '이용약관 | 서울365열린치과',
    keywords: '서울365 이용약관',
    aeo: '서울365열린치과 이용약관입니다.',
    schema_type: 'WebPage',
  },
};

// ── 페이지 content에서 첫 의미 문단 추출 ────────────────────────────────────
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
  // <p>...</p> 안에서 의미있는 문단 우선 추출
  const ps = [...String(html || '').matchAll(/<p[^>]*>([\s\S]*?)<\/p>/gi)].map(m => stripTags(m[1]));
  for (const p of ps) {
    if (p && p.length >= minLen && !/^[\s·\-]+$/.test(p)) {
      return p.length > maxLen ? p.slice(0, maxLen - 1).trim() + '…' : p;
    }
  }
  const text = stripTags(html);
  if (text.length >= minLen) {
    return text.length > maxLen ? text.slice(0, maxLen - 1).trim() + '…' : text;
  }
  return '';
}

// ── DB ─────────────────────────────────────────────────────────────────────
let db;
const run = (s, p = []) => new Promise((r, j) => db.run(s, p, function (e) { e ? j(e) : r(this); }));
const get = (s, p = []) => new Promise((r, j) => db.get(s, p, (e, x) => e ? j(e) : r(x)));
const all = (s, p = []) => new Promise((r, j) => db.all(s, p, (e, x) => e ? j(e) : r(x)));

async function main() {
  db = new sqlite3.Database(DB_PATH);
  console.log(`[${HOSPITAL_DISPLAY} SEO 본문 자동 생성 — hospital_id=${HOSPITAL_ID}]`);

  const h = await get('SELECT id,name,slug FROM hospitals WHERE id=?', [HOSPITAL_ID]);
  if (!h || h.slug !== HOSPITAL_SLUG_GUARD) {
    console.error(`[ABORT] hospital_id=${HOSPITAL_ID} 가 ${HOSPITAL_SLUG_GUARD}이 아님: ${JSON.stringify(h)}`);
    process.exitCode = 1; db.close(); return;
  }
  console.log(`  대상 병원 확인: ${h.name} (slug=${h.slug})`);

  try {
    const seoRows = await all('SELECT * FROM seo_settings WHERE hospital_id=?', [HOSPITAL_ID]);
    console.log(`  seo_settings ${seoRows.length}행 점검 중…`);

    let filled = 0, skipped = 0, untouched = 0;
    for (const row of seoRows) {
      const slug = row.slug;
      const meta = PAGE_META[slug] || {};
      const pageRow = await get("SELECT content FROM pages WHERE slug=? AND hospital_id=?", [slug, HOSPITAL_ID]);
      const pageContent = pageRow?.content || '';

      // 빈 필드만 채울 후보 계산
      const want = {
        title: meta.title || `${row.page_label || slug} | ${HOSPITAL_DISPLAY}`,
        keywords: meta.keywords || `${row.page_label || slug}, ${HOSPITAL_DISPLAY}`,
        aeo_summary: meta.aeo || `${HOSPITAL_DISPLAY} ${row.page_label || slug} 안내 페이지입니다.`,
        schema_type: meta.schema_type || 'WebPage',
        schema_name: meta.schema_name || (meta.title ? meta.title.split('|')[0].trim() : (row.page_label || slug)),
        local_keywords: COMMON_LOCAL,
      };

      // description / og_description: 페이지 content 첫 문단 우선, 없으면 aeo
      const firstPara = extractFirstParagraph(pageContent);
      const desc = firstPara || want.aeo_summary;

      want.description = desc;
      want.og_title = want.title;
      want.og_description = desc.length > 200 ? desc.slice(0, 199) + '…' : desc;
      want.og_image = OG_IMAGE_DEFAULT;
      want.schema_description = (desc.length > 160 ? desc.slice(0, 159) + '…' : desc);

      // 빈 필드만 채움 — 사용자가 어드민에서 채운 값은 절대 덮어쓰지 않음
      const sets = [];
      const params = [];
      const fields = ['title', 'description', 'keywords', 'og_title', 'og_description', 'og_image',
                      'schema_type', 'schema_name', 'schema_description', 'aeo_summary', 'local_keywords'];
      let touched = 0;
      for (const f of fields) {
        const cur = row[f];
        if (cur === null || cur === '' || cur === undefined) {
          sets.push(`${f} = ?`);
          params.push(want[f] || '');
          touched++;
        }
      }
      if (touched === 0) {
        untouched++;
        continue;
      }
      sets.push('updated_at = CURRENT_TIMESTAMP');
      params.push(row.rowid);
      await run(`UPDATE seo_settings SET ${sets.join(', ')} WHERE rowid = ?`, params);
      filled++;
      if (slug === 'main' || slug === 'doctors' || slug === 'implant-sub1') {
        console.log(`  [${slug}] title="${want.title}" / desc(${desc.length}b) / schema=${want.schema_type}`);
      }
    }
    console.log(`  [요약] 신규 채움 ${filled}행 / 변경 없음 ${untouched}행 / skip ${skipped}행`);
    console.log(`[완료] ${HOSPITAL_DISPLAY} SEO 본문 자동 생성 종료`);
  } catch (e) {
    console.error('[에러]', e.message);
    process.exitCode = 1;
  } finally {
    db.close();
  }
}

main();
