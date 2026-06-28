// 영업관리 공유 상수·헬퍼 (클라이언트)

export const STATUS_META = {
  lead:       { label: '리드',     tone: 'bg-zinc-100 text-zinc-700 border-zinc-200' },
  contracted: { label: '계약요청', tone: 'bg-amber-50 text-amber-700 border-amber-200' },
  won:        { label: '승격완료', tone: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  lost:       { label: '실패',     tone: 'bg-zinc-50 text-zinc-400 border-zinc-200' },
  paused:     { label: '보류',     tone: 'bg-zinc-50 text-zinc-500 border-zinc-200' },
};

export const CHECKLIST_SECTIONS = [
  { title: '1. 계정 및 접속 정보', items: [
    { id: 'a1', text: '도메인 관리 계정', note: '가비아·카페24 — 이전 권장' },
    { id: 'a2', text: '호스팅 계정', note: '카페24·아임웹 등' },
    { id: 'a3', text: '기존 홈페이지 Admin', note: '접속 URL + 아이디/비밀번호' },
    { id: 'a4', text: 'FTP 접속 정보', note: '서버 파일 직접 관리용' },
  ]},
  { title: '2. SEO/AEO 관련 계정', items: [
    { id: 'b1', text: '네이버 서치어드바이저 계정', note: '검색 노출 등록 및 오류 체크' },
    { id: 'b2', text: '메일 서비스 연동 여부', note: '도메인 이전 시 메일 단절 가능' },
  ]},
  { title: '3. 디자인 및 콘텐츠 자료', items: [
    { id: 'c1', text: '로고 파일', note: '고화질 원본(.ai 권장)' },
    { id: 'c2', text: '인터뷰 자료 및 사진', note: '병원 강점, 원장 프로필, 내부 시설' },
    { id: 'c3', text: '참고 사이트', note: '디자인·구성 레퍼런스 수령' },
    { id: 'c4', text: '진료과목 및 특장점 정보', note: '주요 진료항목, 차별화 포인트' },
    { id: 'c5', text: '추가 요청사항', note: '꼭 넣어야 할 메뉴·기능 확인' },
  ]},
  { title: '4. 계약 및 비용 확인', items: [
    { id: 'd1', text: '다국어 버전 제작 여부', note: '별도 비용 발생' },
    { id: 'd2', text: '월 유지보수 신청 여부', note: '' },
    { id: 'd3', text: '네이버 SEO 신청 여부', note: '' },
    { id: 'd4', text: 'AEO/GEO 최적화 신청 여부', note: '' },
    { id: 'd5', text: '결제 조건 확인', note: '부가세 포함 여부 및 입금 절차' },
  ]},
  { title: '5. 기술 검토 사항', items: [
    { id: 'e1', text: 'SSL 보안인증서', note: '보안 및 검색 노출 필수' },
    { id: 'e2', text: '메타 태그 설정', note: '검색엔진 색인 최적화' },
    { id: 'e3', text: 'DB 이관 여부', note: '기존 게시글·환자 데이터 이전 여부' },
  ]},
];

export const CHECKLIST_TOTAL = CHECKLIST_SECTIONS.reduce((a, s) => a + s.items.length, 0);

// 전체 서비스 현황 대시보드 — 12종 서비스 키
export const SERVICE_KEYS = [
  'hp_move', 'hp_opt', 'hp_new', 'monthly', 'backlink', 'google_ai', 'web_top',
  'multi_lang', 'web_post', 'quote', 'contract_doc', 'deposit',
];
export const SERVICE_META = {
  hp_move:      { label: '홈페이지 이관',  short: '이관',    group: 'build' },
  hp_opt:       { label: '홈페이지 최적화', short: '최적화',  group: 'build' },
  hp_new:       { label: '홈페이지 신규',  short: '신규',    group: 'build' },
  monthly:      { label: '월관리',         short: '월관리',  group: 'service' },
  backlink:     { label: '백링크',         short: '백링크',  group: 'service' },
  google_ai:    { label: '구글리뷰AI',     short: '리뷰AI',  group: 'service' },
  web_top:      { label: '웹상위노출',     short: '상위노출', group: 'service' },
  multi_lang:   { label: '다국어 버전',    short: '다국어',  group: 'option' },
  web_post:     { label: '웹포스팅',       short: '포스팅',  group: 'option' },
  quote:        { label: '견적서',         short: '견적',    group: 'sales' },
  contract_doc: { label: '계약서',         short: '계약',    group: 'sales' },
  deposit:      { label: '입금',           short: '입금',    group: 'sales' },
};

export const CREDENTIAL_KINDS = [
  { kind: 'domain',  label: '도메인',     icon: '🌐', placeholderProvider: '예: 가비아' },
  { kind: 'hosting', label: '호스팅',     icon: '🖥️', placeholderProvider: '예: 카페24' },
  { kind: 'admin',   label: 'Admin 페이지', icon: '⚙️', urlField: true },
  { kind: 'ftp',     label: 'FTP',         icon: '📁' },
  { kind: 'seo',     label: '네이버 SEO',   icon: '🔍', placeholderProvider: '네이버 서치어드바이저' },
  { kind: 'mail',    label: '메일 서비스',  icon: '✉️', placeholderProvider: '예: 네이버웍스' },
];

export function cx(...classes) { return classes.filter(Boolean).join(' '); }
