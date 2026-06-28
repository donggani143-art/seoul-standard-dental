const icons = {
  arrow:
    '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M13 5l7 7-7 7M4 12h15" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  check:
    '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20 6 9 17l-5-5" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  filter:
    '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 7h12M4 12h8M4 17h5" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/><path d="M18 7h2M14 12h6M11 17h9" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/></svg>',
  responsive:
    '<svg viewBox="0 0 64 64" aria-hidden="true"><rect x="18" y="12" width="34" height="26" rx="2.5" fill="#b9d7ff"/><rect x="20" y="14" width="30" height="20" fill="#fff"/><path d="M34 38v8m-9 0h18" fill="none" stroke="#93bfff" stroke-width="4" stroke-linecap="round"/><rect x="9" y="24" width="13" height="24" rx="2.5" fill="#fff" stroke="#006df0" stroke-width="4"/></svg>',
  standard:
    '<svg viewBox="0 0 64 64" aria-hidden="true"><path d="M18 34c6-2 10-7 16-9 3-1 5 1 4 4l-1 4h10c3 0 5 4 2 6l-9 7c-4 3-9 4-14 2l-8-3V34Z" fill="#a9ceff"/><path d="m28 21 8 8 15-16" fill="none" stroke="#006df0" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/><rect x="10" y="32" width="10" height="19" rx="2" fill="#7fb7ff"/></svg>',
  search:
    '<svg viewBox="0 0 64 64" aria-hidden="true"><rect x="12" y="19" width="39" height="12" rx="3" fill="#d8e9ff" stroke="#94c2ff" stroke-width="4"/><circle cx="35" cy="31" r="13" fill="none" stroke="#006df0" stroke-width="5"/><path d="m44 41 10 10" fill="none" stroke="#78b4ff" stroke-width="5" stroke-linecap="round"/></svg>',
  board:
    '<svg viewBox="0 0 64 64" aria-hidden="true"><path d="M16 13h34v38H16z" fill="#b7d5ff"/><path d="M16 13h12v11H16zm0 14h12v11H16zm0 14h12v10H16z" fill="#006df0"/><path d="M33 19h12M33 32h12M33 45h12" stroke="#fff" stroke-width="4" stroke-linecap="round"/></svg>',
  ssl:
    '<svg viewBox="0 0 64 64" aria-hidden="true"><rect x="11" y="18" width="42" height="30" rx="4" fill="#d8e9ff" stroke="#93c1ff" stroke-width="4"/><text x="18" y="39" fill="#006df0" font-size="15" font-family="Arial, sans-serif" font-weight="900">SSL</text><path d="m42 30 4 4 8-10" fill="none" stroke="#006df0" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  shield:
    '<svg viewBox="0 0 64 64" aria-hidden="true"><path d="M32 10 48 17v13c0 12-7 20-16 24-9-4-16-12-16-24V17l16-7Z" fill="#a8ceff"/><rect x="25" y="29" width="14" height="12" rx="2" fill="#006df0"/><path d="M28 29v-4a4 4 0 0 1 8 0v4" fill="none" stroke="#006df0" stroke-width="3"/></svg>',
  mail:
    '<svg viewBox="0 0 64 64" aria-hidden="true"><path d="M14 17h34a4 4 0 0 1 4 4v22a4 4 0 0 1-4 4H14z" fill="#a8ceff"/><path d="M19 25h20M19 33h16" stroke="#fff" stroke-width="4" stroke-linecap="round"/><path d="m35 47 14-14 6 6-14 14-8 2 2-8Z" fill="#006df0"/></svg>',
  admin:
    '<svg viewBox="0 0 64 64" aria-hidden="true"><path d="m32 9 5 7 8-1 3 8 7 4-3 8 3 8-7 4-3 8-8-1-5 7-5-7-8 1-3-8-7-4 3-8-3-8 7-4 3-8 8 1 5-7Z" fill="#a8ceff"/><circle cx="32" cy="28" r="6" fill="#006df0"/><path d="M21 45c2-7 20-7 22 0" fill="#006df0"/></svg>',
  image:
    '<svg viewBox="0 0 64 64" aria-hidden="true"><rect x="14" y="13" width="36" height="36" rx="4" fill="#7fb7ff"/><path d="m18 43 10-12 8 8 6-7 8 11" fill="#006df0"/><circle cx="39" cy="23" r="4" fill="#b9d7ff"/><circle cx="47" cy="45" r="9" fill="#006df0"/><path d="m43 45 3 3 6-7" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  popup:
    '<svg viewBox="0 0 64 64" aria-hidden="true"><rect x="13" y="14" width="38" height="33" rx="4" fill="#a8ceff"/><path d="M13 23h38" stroke="#006df0" stroke-width="4"/><path d="M25 36h18" stroke="#fff" stroke-width="4" stroke-linecap="round"/><path d="m41 34 8 8m0-8-8 8" stroke="#006df0" stroke-width="4" stroke-linecap="round"/></svg>',
  org:
    '<svg viewBox="0 0 64 64" aria-hidden="true"><rect x="26" y="9" width="12" height="12" rx="2" fill="#006df0"/><rect x="11" y="43" width="12" height="12" rx="2" fill="#a8ceff"/><rect x="26" y="43" width="12" height="12" rx="2" fill="#a8ceff"/><rect x="41" y="43" width="12" height="12" rx="2" fill="#a8ceff"/><path d="M32 21v12M17 43V33h30v10" fill="none" stroke="#7fb7ff" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  map:
    '<svg viewBox="0 0 64 64" aria-hidden="true"><path d="m12 20 13-6 14 6 13-6v35l-13 6-14-6-13 6V20Z" fill="#d8e9ff"/><path d="M25 14v35M39 20v35" stroke="#a8ceff" stroke-width="4"/><path d="M45 29c0 9-9 17-9 17s-9-8-9-17a9 9 0 1 1 18 0Z" fill="#006df0"/><circle cx="36" cy="29" r="3" fill="#fff"/></svg>'
};

const images = {
  logo: "/landing/assets/brand/metalink-logo.png",
  main: "/landing/assets/websilo/main.jpg",
  homepage: "/landing/assets/websilo/homepage.jpg",
  blog: "/landing/assets/websilo/blog.jpg",
  casesHome: "/landing/assets/websilo/cases-home.jpg",
  casesBlog: "/landing/assets/websilo/cases-blog.jpg",
  inquiryHome: "/landing/assets/websilo/inquiry-home.jpg",
  inquiryBlog: "/landing/assets/websilo/inquiry-blog.jpg",
  homeSource: ["/landing/assets/source/homepage/home-01.png", "/landing/assets/source/homepage/home-02.png", "/landing/assets/source/homepage/home-03.png", "/landing/assets/source/homepage/home-04.png", "/landing/assets/source/homepage/home-05.png", "/landing/assets/source/homepage/home-06.png"],
  blogSource: ["/landing/assets/source/blog/blog-01.png", "/landing/assets/source/blog/blog-02.png", "/landing/assets/source/blog/blog-03.png", "/landing/assets/source/blog/blog-04.png", "/landing/assets/source/blog/blog-05.png", "/landing/assets/source/blog/blog-06.png"]
};

const homepagePlans = [
  { title: "홈페이지 구축", price: "2,200,000원", points: ["(VAT 포함)", "반응형 홈페이지", "18~23페이지 기준", "관리자 포함", "SEO·GEO·AEO 기본 설계"] },
  { title: "무료 제공", price: "0원", points: ["도메인 1년", "SSL 인증서 1년", "호스팅 1년", "포털 검색등록", "메타태그 설정"] },
  { title: "맞춤 확장", price: "협의", points: ["맞춤 기획", "맞춤 디자인", "기능 추가", "콘텐츠 확장", "온라인 마케팅 연계"] }
];

const blogPlans = [
  { title: "블로그 구축", price: "550,000원", points: ["(VAT 포함)", "홈페이지형 블로그", "프로필", "위젯 구성", "모바일 배경"] },
  { title: "브랜드 적용", price: "기준 포함", points: ["브랜드 톤 적용", "SNS 연동", "콘텐츠 영역 정리", "상담 동선 구성"] },
  { title: "맞춤 확장", price: "협의", points: ["스크롤 방식 블로그", "추가 위젯", "콘텐츠 영역 추가", "브랜드 스토리 구성"] }
];

// 가격정책 (요금안내·메인 가격 섹션 공용)
const pricePackages = [
  {
    name: "베이직",
    pages: "18 ~ 23 페이지",
    price: "220만원",
    unit: "(VAT 포함)",
    featured: true,
    points: ["반응형 홈페이지 18~23p", "SEO·GEO·AEO 기본 설계", "포털 검색등록 · 관리자페이지", "도메인 · SSL · 호스팅 1년"]
  },
  {
    name: "라이트",
    pages: "9 ~ 11 페이지",
    price: "110만원",
    unit: "(VAT 포함)",
    points: ["반응형 홈페이지 9~11p", "SEO 기본 설계", "포털 검색등록 · 관리자페이지", "도메인 · SSL · 호스팅 1년"]
  },
  {
    name: "블로그",
    pages: "N사 위젯형 블로그",
    price: "55만원",
    unit: "(VAT 포함)",
    points: ["홈페이지형 블로그 스킨", "프로필 · 위젯 구성", "모바일 화면 구성", "브랜드 톤 적용"]
  }
];

// 선택 옵션 (필요 시 선택 추가) — 가격표 이미지 기준
const priceOptions = [
  ["백링크", "150,000원"],
  ["웹관리비", "80,000원"],
  ["오토 포스팅", "200,000원"],
  ["네이버 웹 상위", "700,000원~"],
  ["구글 웹 상위", "700,000원~"],
  ["구글 리뷰 등록기 SET", "200,000원"],
  ["구글 리뷰 등록기 월비", "9,900원"]
];

const serviceCards = [
  {
    title: "SEO·GEO·AEO 최적화 홈페이지",
    text: "검색엔진, 생성형 검색, AI 답변엔진이 기업 정보를 정확히 이해하도록 페이지 구조, 메타 태그, FAQ, 스키마를 함께 설계합니다.",
    icon: "SEO",
    href: "#/homepage",
    visual: "seo"
  },
  {
    title: "브랜드 블로그 제작",
    text: "상품, 서비스, 업체의 특징과 가치를 소비자가 쉽게 이해하도록 매력적인 홍보 콘텐츠와 블로그 스킨을 제작합니다.",
    icon: "blog",
    href: "#/blog",
    visual: "blog"
  }
];

const portfolioItems = [
  { title: "경상북도치과의사회", category: "협회 · 홈페이지", image: "/landing/assets/portfolio-home/gbda.png", url: "https://kda21.metacms.kr" },
  { title: "한국국방획득혁신학회", category: "학회 · 홈페이지", image: "/landing/assets/portfolio-home/ideas.png", url: "http://ideas-k.org/" },
  { title: "옥스치과", category: "치과 · 홈페이지", image: "/landing/assets/portfolio-home/oaks.png", url: "https://oaksdental.metacms.kr" },
  { title: "서울에스원치과", category: "치과 · 홈페이지", image: "/landing/assets/portfolio-home/s1dental.png", url: "https://s1dental.co.kr/" },
  { title: "덴업", category: "치과 · 홈페이지", image: "/landing/assets/portfolio-home/denup.png", url: "https://denup.metacms.kr" },
  { title: "서울365열린치과", category: "치과 · 홈페이지", image: "/landing/assets/portfolio-home/seoul365.png", url: "https://seoul365opendental.metacms.kr" }
];

// 블로그 포트폴리오(홈페이지/블로그 탭의 블로그 탭). url 채우면 실제 사이트로 연결, 없으면 이미지 미리보기.
const portfolioBlogItems = [
  { title: "브랜드 블로그", category: "홈페이지형 · N사 위젯형", image: "/landing/assets/portfolio-blog/blog-01.png" },
  { title: "브랜드 블로그", category: "홈페이지형 · N사 위젯형", image: "/landing/assets/portfolio-blog/blog-05.png" },
  { title: "브랜드 블로그", category: "홈페이지형 · N사 위젯형", image: "/landing/assets/portfolio-blog/blog-12.png" },
  { title: "브랜드 블로그", category: "홈페이지형 · N사 위젯형", image: "/landing/assets/portfolio-blog/blog-19.png" },
  { title: "브랜드 블로그", category: "홈페이지형 · N사 위젯형", image: "/landing/assets/portfolio-blog/blog-25.png" },
  { title: "브랜드 블로그", category: "홈페이지형 · N사 위젯형", image: "/landing/assets/portfolio-blog/blog-33.png" }
];

const freeFeatures = [
  { title: "반응형 웹사이트", icon: "responsive" },
  { title: "웹 표준화", icon: "standard" },
  { title: "포털사이트 검색 등록", icon: "search" },
  { title: "다양한 게시판", icon: "board" },
  { title: "SSL 인증서 제공 (12개월)", icon: "ssl" },
  { title: "방화벽 설치", icon: "shield" },
  { title: "메일문의", icon: "mail" },
  { title: "관리자페이지", icon: "admin" },
  { title: "저작권 확보 이미지, 폰트 사용", icon: "image" },
  { title: "팝업 기능", icon: "popup" },
  { title: "조직도 이미지 제작", icon: "org" },
  { title: "지도 API", icon: "map" }
];

const seoItems = [
  ["SEO", "Search Engine Optimization", "제목, 설명, 헤딩 계층, 내부 링크, 이미지 대체 텍스트를 검색엔진이 읽기 쉬운 구조로 정리합니다."],
  ["GEO", "Generative Engine Optimization", "생성형 검색이 브랜드와 서비스 근거를 맥락 있게 요약할 수 있도록 핵심 문장과 근거 콘텐츠를 배치합니다."],
  ["AEO", "Answer Engine Optimization", "질문형 검색과 AI 답변에 대응하도록 FAQ, 절차, 가격, 서비스 범위를 답변 친화적인 문장으로 설계합니다."]
];

const mainFaqItems = [
  ["홈페이지 제작 기간은 얼마나 걸리나요?", "일반적인 기업 홈페이지는 기획, 디자인, 개발, 검수 과정을 포함해 보통 3~6주 정도 소요됩니다. 페이지 수와 기능, 콘텐츠 준비 상태에 따라 달라질 수 있습니다."],
  ["SEO를 반영하면 바로 검색 상위노출이 되나요?", "SEO는 검색엔진이 홈페이지를 이해하기 좋은 구조를 만드는 작업입니다. 상위노출은 업종 경쟁도, 콘텐츠 품질, 운영 기간, 외부 신뢰도에 따라 달라질 수 있습니다."],
  ["GEO는 기존 SEO와 무엇이 다른가요?", "SEO가 검색엔진 노출을 위한 최적화라면, GEO는 생성형 AI가 브랜드와 서비스를 이해하고 답변에 활용할 수 있도록 정보를 구조화하는 전략입니다."],
  ["AEO는 왜 필요한가요?", "사용자의 검색 방식이 키워드 중심에서 질문 중심으로 바뀌고 있기 때문입니다. AEO는 질문에 직접 답하는 콘텐츠를 구성해 검색과 AI 답변 환경에 대응합니다."],
  ["기존 홈페이지도 개선할 수 있나요?", "가능합니다. 기존 홈페이지의 구조, 콘텐츠, 속도, 메타 정보, FAQ, 문의 동선을 진단한 뒤 개선할 수 있습니다."],
  ["제작 후 유지보수도 가능한가요?", "가능합니다. 텍스트 수정, 이미지 교체, 페이지 추가, 보안 점검, 콘텐츠 업데이트 등 운영에 필요한 유지보수를 지원합니다."]
];

const mainCopy = "";

function cta(label, href, variant = "") {
  const classes = ["btn", variant].filter(Boolean).join(" ");
  return `<a class="${classes}" href="${href}" aria-label="${label}">${label}${icons.arrow}</a>`;
}

function sectionTitle(title, text = "") {
  return `<div class="section-title"><h2>${title}</h2>${text ? `<p>${text}</p>` : ""}</div>`;
}

function thumbFrame(src, title, className = "") {
  return `
    <div class="thumb-frame ${className}">
      <img src="${src}" alt="${title}" loading="eager" decoding="async" />
    </div>`;
}

function serviceVisual(type, title) {
  if (type === "blog") {
    return `
      <div class="service-visual service-visual-blog" role="img" aria-label="${title} 요약 이미지">
        <div class="visual-browser"><span></span><span></span><span></span><b>Brand Blog</b></div>
        <div class="visual-blog-layout">
          <aside>
            <i></i>
            <strong>브랜드 프로필</strong>
            <small>톤앤매너</small>
          </aside>
          <div class="visual-post-stack">
            <em>콘텐츠 발행</em>
            <em>검색 노출</em>
            <em>상담 문의</em>
          </div>
        </div>
        <div class="visual-flow-line"><span>블로그 스킨</span><b>문의 전환</b></div>
      </div>`;
  }

  return `
    <div class="service-visual service-visual-seo" role="img" aria-label="${title} 요약 이미지">
      <div class="visual-browser"><span></span><span></span><span></span><b>Search & AI</b></div>
      <div class="visual-search-box">고객 질문을 이해하는 페이지 구조</div>
      <div class="visual-pill-row">
        <strong>SEO</strong>
        <strong>GEO</strong>
        <strong>AEO</strong>
      </div>
      <div class="visual-evidence">
        <span>메타태그</span>
        <span>FAQ</span>
        <span>스키마</span>
      </div>
    </div>`;
}

function portfolioHref(item) {
  return item.url || item.image; // url 있으면 실제 사이트, 없으면 제작 사례 이미지
}

function portfolioAria(item) {
  return `${item.title} ${item.url ? "사이트 새 창으로 열기" : "제작 사례 이미지 보기"}`;
}

function portfolioThumb(item, className = "") {
  return `
    <a class="portfolio-thumb portfolio-link ${className}" href="${portfolioHref(item)}" target="_blank" rel="noopener noreferrer" aria-label="${portfolioAria(item)}">
      ${thumbFrame(item.image, `${item.title} 제작 사례`)}
      <h3>${item.title}</h3>
      <p>${item.category}</p>
    </a>`;
}

function portfolioPlainThumb(item) {
  return `
    <a class="portfolio-thumb portfolio-plain portfolio-link" href="${portfolioHref(item)}" target="_blank" rel="noopener noreferrer" aria-label="${portfolioAria(item)}">
      <img class="portfolio-plain-img" src="${item.image}" alt="${item.title} 제작 사례" loading="eager" decoding="async" />
      <h3>${item.title}</h3>
      <p>${item.category}</p>
    </a>`;
}

function subHero(title, text, image, theme = "blue") {
  return `
    <section class="sub-hero ${theme}" style="--hero-image: url('${image}')">
      <div class="sub-hero-overlay"></div>
      <div class="container sub-hero-content">
        <span>METALINK</span>
        <h1>${title}</h1>
        <p>${text}</p>
      </div>
    </section>`;
}

function planList(plans) {
  return `
    <div class="plan-list">
      ${plans
        .map(
          (plan, index) => `
        <article class="plan-row">
          <div class="plan-icon">${index + 1}</div>
          <div>
            <h3>${plan.title} <strong>${plan.price}</strong><small>(VAT 포함)</small></h3>
            <p>${plan.points.map((point) => `<span>${point}</span>`).join("")}</p>
          </div>
        </article>`
        )
        .join("")}
    </div>`;
}

function mainHero() {
  return `
    <section class="main-hero">
      <div class="hero-bg" aria-hidden="true"></div>
      <div class="container main-hero-grid">
        <div class="hero-copy">
          <h1>
            <img class="hero-logo" src="${images.logo}" alt="METALINK" />
            <strong>AI 시대에 맞춰 검색되고, 선택되는 홈페이지를 만듭니다.</strong>
          </h1>
          <span class="hero-description">SEO·GEO·AEO를 고려한 홈페이지 제작으로 고객이 검색하고,<br/>AI가 추천하고, 사용자가 문의하게 만드는 웹사이트를 설계합니다.</span>
          <ul class="hero-benefits" aria-label="메인 혜택">
            <li><mark>50% 할인</mark>, 합리적인 제작 비용</li>
            <li><mark>호스팅 1년 무상</mark> 지원</li>
          </ul>
          <div class="hero-actions">
            ${cta("제작견적문의", "#/contact")}
            ${cta("포트폴리오보기", "#/portfolio", "outline")}
          </div>
        </div>
        <div class="ticket-stage" aria-label="제작비 50% 할인과 호스팅 1년 무료 혜택">
          <img src="/landing/assets/design/hero-event.svg" alt="제작비 50% 할인 · 호스팅 1년 무료 이벤트" />
        </div>
      </div>
    </section>`;
}

function serviceLead(title, eyebrow, text, image, options = {}) {
  const gallery = options.gallery || [images.homeSource[0], image, images.homeSource[1], images.homeSource[2]];
  const priceRows =
    options.priceRows ||
    [
      ["홈페이지 구축비용", "220만원"],
      ["도메인·SSL·호스팅 비용", "1년 무료"]
    ];
  const total = options.total || "220만원";
  const secondaryLabel = options.secondaryLabel || "요금안내";
  const primaryLabel = options.primaryLabel || "문의하기";
  const secondaryHref = options.secondaryHref || "#/fee";
  const primaryHref = options.primaryHref || "#/contact";

  return `
    <section class="service-lead">
      <div class="container service-lead-grid">
        <div class="service-lead-copy">
          <p>${eyebrow}</p>
          <h1>${title}</h1>
          <span>${text}</span>
          <div class="service-lead-price">
            ${priceRows.map((row) => `<small>${row[0]} <strong>${row[1]}</strong></small>`).join("")}
            <em>합계 <strong>${total}</strong></em>
          </div>
          <div class="service-lead-actions">
            ${cta(secondaryLabel, secondaryHref, "outline")}
            ${cta(primaryLabel, primaryHref)}
          </div>
        </div>
        ${options.carousel
          ? `<div class="service-lead-gallery service-lead-carousel" data-service-carousel aria-label="${title} 제작 예시 캐러셀">
              <div class="carousel-track">
                ${gallery.map((src) => `
                  <div class="carousel-slide">
                    <img src="${src}" alt="${title} 제작 예시" loading="eager" decoding="async" />
                  </div>`).join("")}
              </div>
              <div class="carousel-dots" data-carousel-dots>
                ${gallery.map((_, i) => `<button type="button" data-go="${i}" aria-label="${i + 1}번 슬라이드"></button>`).join("")}
              </div>
            </div>`
          : `<div class="service-lead-gallery" aria-label="${title} 제작 예시">
              ${gallery.map((src) => thumbFrame(src, `${title} 제작 예시`, "service-lead-thumb")).join("")}
            </div>`}
      </div>
    </section>`;
}

function serviceIntro() {
  return `
    <section class="section service-intro">
      <div class="container">
        ${sectionTitle("서비스안내", "다양한 홈페이지·블로그 제작 경험은 고객의 신뢰로 이어졌고, 저희의 안정적인 실행력을 증명해왔습니다.")}
        <div class="service-card-grid">
          ${serviceCards
            .map(
              (item) => `
            <article class="service-card">
              <div class="service-icon ${item.icon === "blog" ? "blog" : ""}">${item.icon}</div>
              <h3>${item.title}</h3>
              <p>${item.text}</p>
              ${serviceVisual(item.visual, item.title)}
              <div class="card-actions">
                ${cta("포트폴리오 더보기", "#/portfolio", "outline")}
                ${cta("안내 바로보기", item.href, "outline")}
              </div>
            </article>`
            )
            .join("")}
        </div>
      </div>
    </section>`;
}

function seoOptimizationSection() {
  return `
    <section class="section seo-section">
      <div class="container">
        ${sectionTitle("SEO·GEO·AEO 최적화 제작", "보여주는 홈페이지를 넘어, 검색되고 요약되고 답변에 인용되는 홈페이지를 제공합니다.")}
        <div class="seo-grid">
          ${seoItems
            .map(
              (item) => `
            <article>
              <span>${item[0]}</span>
              <h3>${item[1]}</h3>
              <p>${item[2]}</p>
            </article>`
            )
            .join("")}
        </div>
      </div>
    </section>`;
}

function mainProblemSection() {
  const cards = [
    ["검색 노출이 약한<br>홈페이지", "검색 키워드와 구조가<br>부족하면 고객 유입이<br>줄어듭니다."],
    ["방문자는 있지만<br>문의가 적은 홈페이지", "서비스 강점과 CTA가<br>분리되면 다음 행동으로<br>이동하기 어렵습니다."],
    ["회사 강점이<br>드러나지 않는 홈페이지", "차별점과 사례, 비용이<br>흩어져 있으면 신뢰가<br>쌓이기 어렵습니다."],
    ["AI 검색에 대응하지<br>못하는 콘텐츠 구조", "AI가 참고할 설명과<br>FAQ, 근거 콘텐츠가<br>명확해야 합니다."]
  ];

  return `
    <section class="section main-problem-section">
      <div class="container">
        ${sectionTitle("홈페이지는 있는데, 고객이 찾아오고 있나요?", "예쁜 화면만으로는 부족합니다. 검색 결과에서 발견되고, AI가 이해하고, 고객이 문의까지 이동할 수 있는 정보 구조가 필요합니다.")}
        <div class="problem-card-grid">
          ${cards
            .map(
              (card, index) => `
            <article class="problem-card">
              <span>${String(index + 1).padStart(2, "0")}</span>
              <h3>${card[0]}</h3>
              <p>${card[1]}</p>
            </article>`
            )
            .join("")}
        </div>
      </div>
    </section>`;
}

function mainOptimizationGuide() {
  const cards = [
    [
      "SEO",
      "SEO 검색엔진 최적화",
      "메타태그·헤딩·내부 링크·ALT까지 반영해 검색엔진이 잘 이해하는 홈페이지를 제작합니다.",
      "/landing/assets/design/opt-seo.svg"
    ],
    [
      "GEO",
      "GEO 생성형 AI 검색 최적화",
      "ChatGPT·Gemini·Perplexity 등 생성형 AI가 브랜드를 정확히 이해하도록 정보를 구조화합니다.",
      "/landing/assets/design/opt-geo.svg"
    ],
    [
      "AEO",
      "AEO 답변형 검색 최적화",
      "사용자 질문에 바로 답하는 콘텐츠 구조로 검색 결과와 AI 답변 환경에 함께 대응합니다.",
      "/landing/assets/design/opt-aeo.svg"
    ]
  ];

  return `
    <section class="section main-optimization-guide">
      <div class="container">
        ${sectionTitle("SEO · GEO · AEO를 함께 설계합니다", "검색엔진과 AI 답변 환경이 모두 이해할 수 있도록 페이지 구조, 콘텐츠 근거, 전환 동선을 하나의 흐름으로 정리합니다.")}
        <div class="optimization-guide-grid">
          ${cards
            .map(
              (card, index) => `
            <article class="optimization-guide-card guide-card-${index + 1}" tabindex="0">
              <div class="optimization-guide-thumb">
                <img src="${card[3]}" alt="${card[1]} 일러스트" loading="lazy" decoding="async" />
                <span class="optimization-guide-badge">${card[0]}</span>
              </div>
              <div class="optimization-guide-copy">
                <h3>${card[1]}</h3>
                <p>${card[2]}</p>
              </div>
            </article>`
            )
            .join("")}
        </div>
      </div>
    </section>`;
}

function mainPerformanceProcess() {
  const steps = [
    ["비즈니스 분석", "업종, 목표 고객, 상담 전환 목표를 확인해 홈페이지가 해결해야 할 역할을 정리합니다."],
    ["키워드 및 경쟁사 분석", "고객이 실제로 검색하는 표현과 경쟁사의 정보 구조를 비교해 콘텐츠 방향을 잡습니다."],
    ["콘텐츠 구조 설계", "서비스, 강점, 비용, 사례, FAQ를 사용자가 이해하기 쉬운 순서로 배치합니다."],
    ["UX/UI 디자인", "브랜드 신뢰와 문의 전환을 고려해 모바일과 PC 화면 흐름을 함께 설계합니다."],
    ["SEO·GEO·AEO 기술 반영", "메타 정보, 헤딩 계층, ALT, FAQ, 스키마, CTA 링크를 제작 단계에서 반영합니다."],
    ["오픈 후 운영 방향 제안", "공지, 사례, 블로그 콘텐츠를 확장할 수 있도록 운영 가능한 구조를 안내합니다."]
  ];

  return `
    <section class="section main-process-section">
      <div class="container">
        ${sectionTitle("성과를 위한 홈페이지 제작 프로세스", "처음부터 검색 노출, AI 이해, 문의 전환을 함께 보고 제작합니다.")}
        <ol class="performance-process-list">
          ${steps
            .map(
              (step, index) => `
            <li>
              <span>${index + 1}</span>
              <h3>${step[0]}</h3>
              <p>${step[1]}</p>
            </li>`
            )
            .join("")}
        </ol>
      </div>
    </section>`;
}

function mainWebsiteServices() {
  const services = [
    ["기업 홈페이지 제작", "회사 소개, 서비스, 사례, 문의 동선을 구조적으로 설계합니다. 검색엔진과 AI가 이해하기 쉬운 콘텐츠 기준을 함께 반영합니다."],
    ["브랜드 블로그 제작", "홈페이지와 같은 톤으로 블로그 스킨과 프로필, 위젯을 구성합니다. 콘텐츠 발행과 상담 전환까지 이어지는 흐름을 만듭니다."],
    ["랜딩페이지 제작", "광고, 캠페인, 특정 서비스 문의 전환에 집중한 단일 페이지를 제작합니다. 핵심 메시지와 CTA가 빠르게 보이도록 구성합니다."],
    ["홈페이지 리뉴얼", "기존 홈페이지의 구조, 콘텐츠, 속도, 문의 동선을 점검해 개선합니다. 필요한 부분부터 단계적으로 정리할 수 있습니다."],
    ["SEO 콘텐츠 설계", "검색 의도에 맞는 제목, 문단, FAQ, 내부 링크 구조를 설계합니다. 운영 중인 콘텐츠도 개선 방향을 제안합니다."],
    ["유지보수 및 운영 지원", "텍스트 수정, 이미지 교체, 페이지 추가, 보안 점검, 콘텐츠 업데이트를 지원합니다. 제작 이후에도 운영 가능한 구조를 유지합니다."]
  ];

  return `
    <section class="section main-service-scope">
      <div class="container">
        ${sectionTitle("METALINK가 제작하는 웹사이트", "제작 목적과 운영 방식에 맞춰 홈페이지, 블로그, 랜딩페이지, 리뉴얼까지 필요한 범위를 제안합니다.")}
        <div class="service-scope-grid">
          ${services
            .map(
              (service) => `
            <article class="service-scope-card">
              <h3>${service[0]}</h3>
              <p>${service[1]}</p>
            </article>`
            )
            .join("")}
        </div>
      </div>
    </section>`;
}

function mainTrustSection() {
  const strengths = [
    ["기획 중심", "대기업 출신 IT 전문 인력이 업종, 고객, 문의 목표를 먼저 분석해 제작 방향을 잡습니다."],
    ["구조 중심", "검색과 AI 답변 환경을 고려해 서비스 정보, 사례, FAQ, CTA가 이어지는 콘텐츠 구조를 설계합니다."],
    ["운영 중심", "모바일, 속도, 접근성, 유지보수, 콘텐츠 확장까지 고려해 제작 이후에도 운영 가능한 홈페이지를 만듭니다."]
  ];

  return `
    <section class="section main-trust-section">
      <div class="container trust-layout">
        <div class="trust-copy">
          <h2>디자인보다 먼저, 성과 구조를 설계합니다</h2>
          <p>METALINK는 예쁜 화면을 넘어서 검색엔진과 AI가 이해하기 쉬운 정보 구조, 사용자가 문의하기 쉬운 전환 동선, 제작 이후 운영 가능한 확장 구조를 함께 설계합니다.</p>
          <div class="trust-keywords">
            <span>대기업 출신 IT 전문 인력</span>
            <span>콘텐츠 정보구조 설계</span>
            <span>모바일·속도·접근성 고려</span>
            <span>운영 가능한 확장 구조</span>
            <span>문의 전환 동선 설계</span>
            <span>제작 후 유지보수 지원</span>
          </div>
        </div>
        <div class="trust-card-stack">
          ${strengths
            .map(
              (item) => `
            <article>
              <strong>${item[0]}</strong>
              <p>${item[1]}</p>
            </article>`
            )
            .join("")}
        </div>
      </div>
    </section>`;
}

function mainFaqSection() {
  return `
    <section class="section main-faq-section" aria-labelledby="main-faq-title">
      <div class="container">
        <div class="section-title">
          <h2 id="main-faq-title">자주 묻는 질문</h2>
          <p>홈페이지 제작, SEO·GEO·AEO, 유지보수에 대해 많이 묻는 내용을 정리했습니다.</p>
        </div>
        <div class="faq-list">
          ${mainFaqItems
            .map(
              (item, index) => `
            <details class="faq-item" ${index === 0 ? "open" : ""}>
              <summary>
                <span>Q</span>
                <h3>${item[0]}</h3>
              </summary>
              <p>${item[1]}</p>
            </details>`
            )
            .join("")}
        </div>
      </div>
    </section>`;
}

function mainFinalCta() {
  return `
    <section class="final-conversion-section" aria-labelledby="final-cta-title">
      <div class="container final-conversion-box">
        <div>
          <h2 id="final-cta-title">우리 회사에 맞는 홈페이지 방향이 궁금하다면</h2>
          <p>현재 홈페이지 상태, 업종, 목표 고객, 예산을 바탕으로 검색 노출과 문의 전환을 고려한 제작 방향을 제안드립니다.</p>
        </div>
        <div class="final-conversion-actions">
          ${cta("무료 상담 신청하기", "#/contact", "white")}
          ${cta("요금안내 보기", "#/fee", "outline")}
        </div>
      </div>
    </section>`;
}

function pricePreview() {
  const cards = [
    {
      key: "homepage",
      title: "홈페이지",
      text: "",
      setupLabel: "구축비",
      setupPrice: "2,200,000원",
      discount: "도메인·SSL·호스팅 1년 무료 제공",
      price: "220만원",
      unit: "(VAT 포함)",
      href: "#/contact",
      points: ["SEO·GEO·AEO 기본 설계", "반응형 홈페이지", "포털사이트 검색 등록", "관리자페이지 제공"]
    },
    {
      key: "blog",
      title: "홈페이지형 블로그",
      text: "홈페이지와 같은 브랜드 톤으로 블로그 스킨과 상담 동선을 구성해 콘텐츠 발행과 문의 전환을 돕습니다.",
      setupLabel: "구축비",
      setupPrice: "550,000원",
      discount: "브랜드 톤 맞춤 구성",
      price: "55만원",
      unit: "(VAT 포함)",
      href: "#/contact",
      points: ["블로그 스킨 제작", "프로필·위젯 구성", "모바일 화면 구성", "콘텐츠 발행 동선 정리"]
    }
  ];

  return `
    <section class="section price-preview">
      <div class="container">
        ${sectionTitle("서비스가격안내", "홈페이지와 블로그 구축 비용을 명확한 기준으로 안내드립니다.")}
        <div class="service-price-cards">
          ${cards
            .map(
              (card) => `
            <article class="service-price-card">
              <div class="service-price-head">
                <h3>${card.title}</h3>
                <p>${card.text}</p>
              </div>
              <dl class="service-price-meta">
                <div>
                  <dt>${card.setupLabel}</dt>
                  <dd>${card.setupPrice}</dd>
                </div>
              </dl>
              <div class="service-price-main">
                <span>${card.discount}</span>
                <strong>${card.price}</strong><em>/ ${card.unit}</em>
              </div>
              <a class="service-price-btn" href="${card.href}">도입 문의</a>
              <ul>
                ${card.points.map((point) => `<li>${icons.check}<span>${point}</span></li>`).join("")}
              </ul>
            </article>`
            )
            .join("")}
        </div>
      </div>
    </section>`;
}

function portfolioPreview() {
  return `
    <section class="section portfolio-preview">
      <div class="circle-bg"></div>
      <div class="container">
        ${sectionTitle("주요 포트폴리오", "회사의 비전, 아이덴티티가 잘 드러날 수 있도록 가장 효율적 비용으로 고객 맞춤형 홈페이지를 제작해드립니다.")}
        <div class="monitor-grid">
          ${portfolioItems
            .slice(0, 3)
            .map(portfolioPlainThumb)
            .join("")}
        </div>
        <div class="center">${cta("포트폴리오 더보기", "#/portfolio", "white")}</div>
      </div>
    </section>`;
}

function mainServiceIntro() {
  return `
    <section class="section service-intro main-service-restore">
      <div class="container">
        ${sectionTitle("서비스 안내", "검색되는 홈페이지와 브랜드 블로그를 목적에 맞게 제작합니다.")}
        <div class="service-card-grid">
          ${serviceCards
            .map(
              (item) => `
            <article class="service-card">
              <div class="service-icon ${item.icon === "blog" ? "blog" : ""}">${item.icon}</div>
              <h3>${item.title}</h3>
              <p>${item.text}</p>
              ${serviceVisual(item.visual, item.title)}
              <div class="card-actions">
                ${cta("포트폴리오 더보기", "#/portfolio", "outline")}
                ${cta("안내 바로보기", item.href, "outline")}
              </div>
            </article>`
            )
            .join("")}
        </div>
      </div>
    </section>`;
}

function pricePackageCards() {
  return `
    <div class="service-price-cards price-package-cards">
      ${pricePackages
        .map(
          (pkg) => `
        <article class="service-price-card price-package${pkg.featured ? " is-featured" : ""}">
          ${pkg.featured ? `<span class="price-badge">추천</span>` : ""}
          <div class="service-price-head">
            <h3>${pkg.name}</h3>
            <p>${pkg.pages}</p>
          </div>
          <div class="service-price-main">
            <strong>${pkg.price}</strong><em>${pkg.unit}</em>
          </div>
          <a class="service-price-btn" href="#/contact">제작 문의</a>
          <ul>
            ${pkg.points.map((point) => `<li>${icons.check}<span>${point}</span></li>`).join("")}
          </ul>
        </article>`
        )
        .join("")}
    </div>`;
}

function priceOptionsMarkup() {
  return `
    <div class="price-options">
      <div class="price-options-head">
        <h3>선택 옵션</h3>
        <p>필요에 따라 선택해 추가하실 수 있는 마케팅·운영 서비스입니다.</p>
      </div>
      <ul class="price-option-list">
        ${priceOptions
          .map(
            (opt, i) => `
          <li>
            <span class="opt-no">${i + 1}</span>
            <span class="opt-name">${opt[0]}</span>
            <span class="opt-price">${opt[1]}</span>
          </li>`
          )
          .join("")}
      </ul>
      <p class="price-options-note">※ 선택 옵션은 모두 별도 선택 항목입니다. 상담 시 필요한 항목만 조합해 견적을 안내드립니다.</p>
    </div>`;
}

function mainPricePreview() {
  return `
    <section class="section price-preview main-price-restore">
      <div class="container">
        ${sectionTitle("서비스 가격 안내", "홈페이지·블로그 구축 기준을 명확하게 안내드립니다. 표시 금액은 VAT 포함입니다.")}
        ${pricePackageCards()}
        <div class="center" style="margin-top:34px">${cta("요금 자세히 보기", "#/fee", "outline")}</div>
      </div>
    </section>`;
}

function mainPortfolioPreview() {
  const items = [
    { title: "경상북도치과의사회",   image: "/landing/assets/portfolio-home/gbda.png",   fallback: "/landing/assets/portfolio-main/gbda-dental.svg" },
    { title: "한국국방획득혁신학회", image: "/landing/assets/portfolio-home/ideas.png", fallback: "/landing/assets/portfolio-main/ideas-defense.svg" },
    { title: "옥스치과",             image: "/landing/assets/portfolio-home/oaks.png",             fallback: "/landing/assets/portfolio-main/oaks-dental.svg" }
  ];

  return `
    <section class="section portfolio-preview main-portfolio-showcase" aria-labelledby="main-portfolio-title">
      <div class="container">
        <div class="section-title">
          <h2 id="main-portfolio-title">주요 포트폴리오</h2>
          <p>업종과 목적에 맞춰 제작한 홈페이지 사례입니다. 섬네일을 클릭하면 페이지가 아래로 스크롤되는 미리보기를 확인할 수 있습니다.</p>
        </div>
        <div class="main-portfolio-grid">
          ${items
            .map(
              (item) => `
            <article class="main-portfolio-card">
              <button class="portfolio-scroll-shot" type="button" aria-label="${item.title} 홈페이지 스크롤 미리보기">
                <span class="portfolio-scroll-track">
                  <img src="${item.image}" data-fallback="${item.fallback}" onerror="if(!this.dataset.fb){this.dataset.fb='1';this.src=this.dataset.fallback;}" alt="${item.title} 홈페이지 섬네일" loading="lazy" decoding="async" />
                </span>
              </button>
              <h3>${item.title}</h3>
            </article>`
            )
            .join("")}
        </div>
        <div class="center">${cta("포트폴리오 더보기", "#/portfolio")}</div>
      </div>
    </section>`;
}

function freeFeatureSection() {
  return `
    <section class="section free-section">
      <div class="container">
        <div class="watermark">METALINK</div>
        ${sectionTitle("다양한 기능을 무료로 제공합니다.", "도메인·SSL·호스팅 1년 무료부터 보안·관리자·게시판·지도 API까지, 홈페이지 운영에 꼭 필요한 핵심 기능을 기본 패키지에 포함해 드립니다.<br>별도 추가 비용 없이 오픈 직후부터 안정적으로 운영할 수 있도록 메타링크가 함께 준비합니다.")}
        <div class="feature-grid">
          ${freeFeatures
            .map(
              (item) => `
            <article class="free-feature-card">
              <div class="free-feature-icon">${icons[item.icon]}</div>
              <h3>${item.title}</h3>
            </article>`
            )
            .join("")}
        </div>
      </div>
    </section>`;
}

function marketingBand() {
  return `
    <section class="marketing-band">
      <div class="container marketing-inner">
        <p>비즈니스 성장을 위한</p>
        <h2>METALINK 마케팅 솔루션</h2>
        <span>전문 서비스를 제공해 드립니다.</span>
        <div class="solution-row"><b>blog</b><b>SNS</b><b>PR</b><b>Design</b><b>Consulting</b></div>
      </div>
    </section>`;
}

function clientsSection() {
  const clients = ["경상북도치과의사회", "덴업", "서울365열린치과", "서울에스원치과", "옥스치과", "한국국방획득혁신학회"];
  const loop = [...clients, ...clients];
  return `
    <section class="section clients-section">
      <div class="container">
        ${sectionTitle("주요 고객사", "메타링크를 믿고 선택해주신 고객사 여러분 감사합니다.")}
        <div class="client-slider" aria-label="주요 고객사 슬라이드 배너">
          <div class="client-row">${loop.map((client) => `<span>${client}</span>`).join("")}</div>
        </div>
      </div>
    </section>`;
}

function contactSection() {
  return `
    <section class="quick-consult-section" id="contact">
      <div class="container quick-consult-grid">
        <div class="quick-consult-copy">
          <h2>AI 최적화 홈페이지 제작,<br>메타링크와 상담하세요.</h2>
          <a class="quick-consult-cta" href="#contactForm">상담 문의${icons.arrow}</a>
        </div>
        <form class="contact-form quick-consult-form" id="contactForm">
          <label>회사명<input name="company" type="text" placeholder="회사명을 입력해 주세요. (필수)" required /></label>
          <label>부서명<input name="department" type="text" placeholder="부서명을 입력해 주세요. (선택)" /></label>
          <label>담당자명<input name="name" type="text" placeholder="담당자명을 입력해 주세요. (필수)" required /></label>
          <label>연락처<input name="phone" type="tel" placeholder="연락처를 입력해 주세요. (필수)" required /></label>
          <label>이메일<input name="email" type="email" placeholder="이메일을 입력해 주세요. (선택)" /></label>
          <label>문의내용<textarea name="message" rows="3" placeholder="문의 내용을 입력해 주세요. (선택)"></textarea></label>
          <label class="agree"><input type="checkbox" required /> 필수 개인정보 수집 및 이용 동의</label>
          <button type="submit">전송</button>
          <p class="form-result" role="status" aria-live="polite"></p>
        </form>
      </div>
    </section>`;
}

function krdsDetailStructure(type) {
  const isBlog = type === "blog";
  const overview = isBlog
    ? {
        label: "",
        title: "검색되는 블로그를 넘어, 신뢰받는 브랜드 채널로",
        text: [
          "고객은 정보를 찾을 때 가장 먼저 네이버에서 검색합니다. 검색 결과 상단에서 가장 자주 노출되는 채널이 바로 '네이버 블로그'이며, 자체 채널을 우선 노출하는 네이버 알고리즘 특성상 브랜드 인지도와 신뢰를 빠르게 쌓을 수 있는 강력한 통로입니다.",
          "메타링크는 단순 스킨 제작이 아닌 '홈페이지처럼 보이는 브랜드 블로그'를 설계합니다. 메인 화면, 카테고리 구조, 프로필, 위젯, 모바일 화면까지 일관된 브랜드 시각으로 구성하고, C-Rank·D.I.A. 알고리즘이 선호하는 카테고리 전문성·H태그 구조·키워드 흐름을 함께 반영합니다.",
          "그 결과 블로그는 네이버 검색의 진입로, 브랜드 정보의 허브, 고객 문의로 이어지는 전환 채널이 됩니다. 메타링크는 블로그 제작부터 운영 가이드까지 함께 설계해 콘텐츠가 쌓일수록 검색·신뢰가 누적되는 자산을 만듭니다."
        ],
        summary: [],
        solo: true,
        cards: [
          [
            "네이버 검색의 진입로",
            "네이버는 자체 채널(블로그·포스트)을 검색 결과 상단에 우선 노출합니다. 홈페이지형 블로그는 이 노출 우위를 그대로 활용하면서도 홈페이지 수준의 시각 신뢰감을 더해 브랜드 검색 진입로 역할을 합니다."
          ],
          [
            "브랜드 일관성",
            "메인 스킨·타이틀·카테고리·프로필·위젯·모바일 화면을 동일한 브랜드 톤으로 설계합니다. 어떤 글을 통해 들어와도 같은 브랜드 경험으로 인식되어 홈페이지와 분리되지 않은 하나의 자산이 됩니다."
          ],
          [
            "콘텐츠 자산화",
            "C-Rank·D.I.A. 알고리즘을 고려해 카테고리 전문성·H태그 구조·키워드 흐름을 설계합니다. 발행한 글이 쌓일수록 검색 노출이 누적되고, 운영 가이드를 통해 비전문가도 꾸준히 운영할 수 있습니다."
          ]
        ],
        flow: [
          "브랜드 톤·키워드 정리",
          "메인 스킨·타이틀 제작",
          "카테고리·위젯 구성",
          "프로필·CI 적용",
          "모바일 화면 점검",
          "콘텐츠 운영 가이드",
          "검색·문의 동선 점검"
        ]
      }
    : {
        label: "",
        title: "검색되는 홈페이지를 넘어, AI가 선택하는 홈페이지로",
        text: [
          "고객은 이제 Google, Naver뿐 아니라 ChatGPT·Gemini·Perplexity 같은 AI 검색 환경에서도 브랜드를 발견합니다.",
          "메타링크는 단순 홈페이지 제작을 넘어 SEO·GEO·AEO 최적화 홈페이지를 설계합니다. 자체 개발한 METALINK CMS를 통해 업체 정보, 페이지별 메타 태그, Schema.org 구조화 데이터, OG 이미지, 네이버 캐러셀, 카카오 채널 등 검색과 AI 인용에 필요한 핵심 정보를 통합 관리합니다.",
          "그 결과 홈페이지는 검색엔진이 이해하기 쉬운 구조, AI가 참고하기 좋은 정보 구조, 고객 문의로 이어지는 전환 구조를 갖추게 됩니다. 메타링크는 브랜드가 더 잘 발견되고, 더 신뢰받고, 더 많은 문의로 연결될 수 있도록 홈페이지의 제작부터 운영까지 함께 설계합니다."
        ],
        summary: [],
        solo: true,
        cards: [
          [
            "GEO · 로컬 검색의 정답",
            "의료기관명·대표·전화·주소·위도/경도·진료시간을 Schema.org <code>Organization</code>·<code>MedicalBusiness</code>·<code>Place</code> 형식으로 자동 출력해 Google 비즈니스, Naver 플레이스, Kakao 맵에서 정확하게 노출되도록 합니다."
          ],
          [
            "SEO · 페이지마다 정밀하게",
            "메인·진료·블로그·문의 등 모든 페이지에 title·description·키워드·OG 이미지를 개별 설정하고, 공통 코드로 사이트 전역 메타·픽셀·스크립트를 일관되게 주입해 검색엔진 신호가 흔들리지 않도록 합니다."
          ],
          [
            "AEO · 생성형 AI가 인용하는 근거",
            "ChatGPT·Gemini·Perplexity가 답변을 만들 때 참고할 수 있도록 Schema 진료시간, 카카오 채널, 네이버 예약·블로그, 유튜브, 인스타그램, OG 카드 등 신뢰 신호를 자동 노출해 출처 채택 확률을 높입니다."
          ]
        ],
        flow: [
          "업체 GEO 정보 등록",
          "페이지 SEO 메타 작성",
          "Schema 자동 생성",
          "OG 이미지·캐러셀 연동",
          "카카오·SNS 채널 등록",
          "검색·AI 노출 점검",
          "운영 가이드 인계"
        ]
      };

  const textHtml = Array.isArray(overview.text)
    ? overview.text.map((p) => `<p>${p}</p>`).join("")
    : `<p>${overview.text}</p>`;

  const isSolo = overview.solo === true;

  return `
    <section class="section krds-detail" aria-labelledby="${type}-detail-title">
      <div class="container krds-layout${isSolo ? " krds-layout--solo" : ""}">
        ${isSolo
          ? ""
          : `<aside class="krds-summary" aria-label="${overview.label} 요약">
              <p>${overview.label}</p>
              <ul>
                ${overview.summary.map((item) => `<li>${icons.check}<span>${item}</span></li>`).join("")}
              </ul>
            </aside>`}
        <div class="krds-content">
          <div class="krds-heading">
            <h2 id="${type}-detail-title">${overview.title}</h2>
            ${textHtml}
          </div>
          <div class="krds-card-grid">
            ${overview.cards
              .map(
                (card) => `
              <article>
                <h3>${card[0]}</h3>
                <p>${card[1]}</p>
              </article>`
              )
              .join("")}
          </div>
          <ol class="krds-flow">
            ${overview.flow.map((item) => `<li><span>${item}</span></li>`).join("")}
          </ol>
        </div>
      </div>
    </section>`;
}

function homePage() {
  return `
    ${mainHero()}
    ${mainProblemSection()}
    ${mainOptimizationGuide()}
    ${mainPerformanceProcess()}
    ${mainFaqSection()}
    ${mainServiceIntro()}
    ${mainPricePreview()}
    ${mainPortfolioPreview()}
    ${freeFeatureSection()}
    ${clientsSection()}
    ${contactSection()}`;
}

function homepageDetail() {
  return `
    ${serviceLead("AI 시대, 고객이 먼저 찾는 홈페이지를 만듭니다", mainCopy, "고객이 검색하고, AI가 이해하고, 문의로 이어질 수 있도록 정보구조·콘텐츠·반응형 UI·SEO·GEO·AEO 최적화를 함께 설계합니다.", images.homeSource[0], {
      carousel: true,
      gallery: [
        "/landing/assets/portfolio-home/gbda.png",
        "/landing/assets/portfolio-home/ideas.png",
        "/landing/assets/portfolio-home/s1dental.png",
        "/landing/assets/portfolio-home/oaks.png",
        "/landing/assets/portfolio-home/denup.png",
        "/landing/assets/portfolio-home/seoul365.png"
      ],
      priceRows: [
        ["홈페이지 구축비용", "220만원 (VAT 포함)"],
        ["도메인·SSL·호스팅 비용", "1년 무료"],
        ["유지보수비", "10만원 (VAT 포함)"]
      ],
      total: "220만원 (VAT 포함)"
    })}
    ${krdsDetailStructure("homepage")}
    ${seoOptimizationSection()}
    <section class="section detail-top">
      <div class="container detail-grid">
        <div>
          ${sectionTitle("홈페이지 구축 기준", "220만원 (VAT 포함)을 기준으로 기업 홈페이지를 제작하며 도메인, SSL, 호스팅 비용을 1년 무료로 제공합니다.")}
          ${planList(homepagePlans)}
        </div>
        <div class="image-stack">
          ${thumbFrame(images.homeSource[1], "AI 최적화 홈페이지 제작 안내 자료", "detail-thumb")}
          <strong>SEO·GEO·AEO 최적화 제공</strong>
          <p>템플릿 제작을 넘어 검색 의도와 AI 답변 구조를 반영해 콘텐츠, FAQ, 메타 태그, CTA 흐름을 함께 설계합니다.</p>
        </div>
      </div>
    </section>
    <section class="section table-section">
      <div class="container">
        ${sectionTitle("비용별 제공사항", "제작비용별 제공되는 서비스안내입니다.")}
        ${comparisonTable()}
      </div>
    </section>
    ${portfolioPreview()}
    ${processSection("홈페이지 제작순서", ["제작신청 접수", "자료 확인 및 1차 완료일 안내", "1차 제작", "수정 및 컨펌요청", "모바일 최적화", "비용 정산 및 최종완료"])}
    ${contactSection()}`;
}

function blogDetail() {
  return `
    ${serviceLead("검색되는 채널 위에 신뢰를 더한, 홈페이지형 블로그를 만듭니다", mainCopy, "네이버에서 가장 많이 검색되는 채널인 블로그에 홈페이지 수준의 시각 신뢰감을 더해 브랜드가 검색되고 기억되는 콘텐츠 채널을 만듭니다.", images.blogSource[0], {
      carousel: true,
      gallery: [
        "/landing/assets/portfolio-blog/blog-01.png",
        "/landing/assets/portfolio-blog/blog-05.png",
        "/landing/assets/portfolio-blog/blog-12.png",
        "/landing/assets/portfolio-blog/blog-19.png",
        "/landing/assets/portfolio-blog/blog-25.png",
        "/landing/assets/portfolio-blog/blog-33.png"
      ],
      priceRows: [
        ["블로그 구축비용", "55만원 (VAT 포함)"],
        ["브랜드 톤·모바일 화면", "기본 포함"],
        ["유지보수비", "10만원 (VAT 포함)"]
      ],
      total: "55만원 (VAT 포함)",
      secondaryLabel: "요금안내",
      primaryLabel: "블로그 문의"
    })}
    ${krdsDetailStructure("blog")}
    ${seoOptimizationSection()}
    <section class="section detail-top">
      <div class="container detail-grid">
        <div>
          ${sectionTitle("블로그 구축 기준", "55만원 (VAT 포함)을 기준으로 홈페이지형 브랜드 블로그를 제작하며 브랜드 톤·모바일 화면 구성을 기본 포함합니다.")}
          ${planList(blogPlans)}
        </div>
        <div class="image-stack">
          ${thumbFrame(images.blogSource[1], "홈페이지형 블로그 제작 안내 자료", "detail-thumb")}
          <strong>홈페이지처럼 보이는 브랜드 블로그</strong>
          <p>메인 스킨·카테고리·프로필·위젯·모바일 화면을 동일한 브랜드 톤으로 설계해 콘텐츠 발행과 상담 전환이 끊기지 않도록 구성합니다.</p>
        </div>
      </div>
    </section>
    <section class="section table-section">
      <div class="container">
        ${sectionTitle("비용별 제공사항", "제작비용별 제공되는 서비스안내입니다.")}
        ${blogComparisonTable()}
      </div>
    </section>
    ${portfolioPreview()}
    ${processSection("블로그 제작순서", ["제작신청 접수", "자료 확인 및 1차 완료일 안내", "1차 시안 작업", "수정 및 컨펌요청", "블로그 적용", "비용 정산 및 최종완료"])}
    ${contactSection()}`;
}

function blogComparisonTable() {
  const rows = [
    ["제작비용", "550,000원 (VAT 포함)", "맞춤 견적", "기본 패키지 기준"],
    ["기본 제공", "메인 스킨·프로필·위젯·모바일", "협의", "브랜드 톤 적용 포함"],
    ["콘텐츠 운영", "운영 가이드 제공", "콘텐츠 대행 별도", "월 단위 협의"],
    ["최적화", "C-Rank·H태그 구조 반영", "키워드·콘텐츠 맞춤 설계", "발행 시 반영 권장"],
    ["제작기간", "영업일 5~7일 이내", "영업일 10일 이내", "자료 수령 후 산정"]
  ];

  return `
    <div class="comparison-wrap">
      <table class="comparison-table">
        <thead><tr><th>항목</th><th>홈페이지형 블로그</th><th>맞춤형</th><th>비고</th></tr></thead>
        <tbody>${rows.map((row) => `<tr>${row.map((cell) => `<td>${cell}</td>`).join("")}</tr>`).join("")}</tbody>
      </table>
    </div>`;
}

function comparisonTable() {
  const rows = [
    ["제작비용", "2,200,000원 (VAT 포함)", "맞춤 견적", "기본 패키지 기준"],
    ["무료 제공", "도메인·SSL·호스팅 1년", "협의", "1년 이후 연 단위 갱신"],
    ["페이지 제공", "메인 1p, 서브 10p 기준", "협의", "추가 페이지는 별도 견적"],
    ["최적화", "SEO·GEO·AEO 기본", "SEO·GEO·AEO 맞춤 설계", "METALINK CMS 자동 연동"],
    ["제작기간", "영업일 10일 이내", "영업일 30일 이내", "자료 수령 후 산정"]
  ];

  return `
    <div class="comparison-wrap">
      <table class="comparison-table">
        <thead><tr><th>항목</th><th>홈페이지</th><th>맞춤형</th><th>비고</th></tr></thead>
        <tbody>${rows.map((row) => `<tr>${row.map((cell) => `<td>${cell}</td>`).join("")}</tr>`).join("")}</tbody>
      </table>
    </div>`;
}

function processSection(title, items) {
  return `
    <section class="section process-section">
      <div class="container">
        ${sectionTitle(title, "제작비용별 제공되는 서비스안내입니다.")}
        <div class="process-grid">
          ${items
            .map(
              (item, index) => `
            <article>
              <img src="${index % 2 === 0 ? images.inquiryHome : images.inquiryBlog}" alt="" loading="lazy" />
              <span>${String(index + 1).padStart(2, "0")}</span>
              <h3>${item}</h3>
              <p>${index === 0 ? "온라인으로 제작신청을 접수 받습니다." : index === items.length - 1 ? "비용 정산 후 홈페이지를 오픈합니다." : "필요 자료 확인 후 단계별 제작을 진행합니다."}</p>
            </article>`
            )
            .join("")}
        </div>
      </div>
    </section>`;
}

function portfolioPage() {
  return `
    <section class="section portfolio-page">
      <div class="container">
        <h2 class="portfolio-heading">포트폴리오</h2>
        <div class="portfolio-filter" role="tablist">
          <button class="active" type="button" data-portfolio-tab="home" aria-selected="true">홈페이지</button>
          <button type="button" data-portfolio-tab="blog" aria-selected="false">블로그</button>
        </div>
        <div class="case-grid" data-portfolio-grid="home">
          ${portfolioItems
            .map((item) => portfolioThumb(item, "case-card"))
            .join("")}
        </div>
        <div class="case-grid" data-portfolio-grid="blog" hidden>
          ${portfolioBlogItems
            .map((item) => portfolioThumb(item, "case-card"))
            .join("")}
        </div>
      </div>
    </section>`;
}

function feePackageInfoMarkup(type) {
  const info =
    type === "blog"
      ? [["구축 기준", "홈페이지형 블로그"], ["제작기간", "1~2주"], ["구축비", "55만원 (VAT 포함)"], ["모바일", "제공"], ["브랜드 톤", "적용"]]
      : [["구축 기준", "기업 홈페이지"], ["제작기간", "4~5주"], ["페이지 수", "10페이지"], ["구축비", "220만원 (VAT 포함)"], ["도메인·SSL·호스팅", "1년 무료"], ["반응형", "제공"]];
  return `<dl>${info.map((item) => `<dt>${item[0]}</dt><dd>${item[1]}</dd>`).join("")}</dl>`;
}

function feePackageSummaryMarkup(type) {
  if (type === "blog") {
    return `
      <div class="summary-box">
        <p><span>블로그 구축비</span><b>550,000원</b></p>
        <p><span>브랜드 톤 적용</span><b>기준 포함</b></p>
        <p><span>모바일 배경 구성</span><b>기준 포함</b></p>
      </div>
      <div class="final-box">
        <p><span>최종금액</span><b>550,000원</b></p>
      </div>
      <div class="total-price"><span>총 이용 금액 (VAT 포함)</span><strong>550,000원</strong></div>
      ${cta("블로그 신청하기", "#/contact")}`;
  }

  return `
    <div class="summary-box">
      <p><span>홈페이지 구축비</span><b>2,200,000원</b></p>
      <p><span>도메인</span><b>1년 무료</b></p>
      <p><span>SSL 인증서</span><b>1년 무료</b></p>
      <p><span>호스팅</span><b>1년 무료</b></p>
      <p><span>반응형 홈페이지</span><b>포함</b></p>
    </div>
    <div class="final-box">
      <p><span>최종금액</span><b>2,200,000원</b></p>
    </div>
    <div class="total-price"><span>총 이용 금액 (VAT 포함)</span><strong>2,200,000원</strong></div>
    ${cta("서비스 신청하기", "#/contact")}`;
}

function feePage() {
  return `
    <section class="fee-hero">
      <div class="container">
        <h1>요금안내</h1>
        <p class="fee-sub">홈페이지·블로그 구축 기준과 선택 옵션을 명확하게 안내드립니다. 표시 금액은 VAT 포함입니다.</p>
        ${pricePackageCards()}
        ${priceOptionsMarkup()}
      </div>
    </section>
    ${contactSection()}`;
}

const routes = {
  "/": homePage,
  "/main": homePage,
  "/contact": homePage,
  "/homepage": homepageDetail,
  "/blog": blogDetail,
  "/portfolio": portfolioPage,
  "/fee": feePage
};

const main = document.querySelector("#main");
const siteHeader = document.querySelector("#siteHeader");
const menuToggle = document.querySelector(".menu-toggle");
const mobileNav = document.querySelector("#mobileNav");
let priceCarouselTimer;
let mainScrollObserver;

function currentPath() {
  return location.hash.replace("#", "") || "/main";
}

function setActive(path) {
  const activePath = path === "/" || path === "/contact" ? "/main" : path;
  document.querySelectorAll("[data-route]").forEach((link) => {
    const isActive = link.getAttribute("data-route") === activePath;
    link.classList.toggle("is-active", isActive);
    if (isActive) {
      link.setAttribute("aria-current", "page");
    } else {
      link.removeAttribute("aria-current");
    }
  });
}

function bindContactForm() {
  const form = document.querySelector("#contactForm");
  if (!form) return;
  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const result = form.querySelector(".form-result");
    result.textContent = "상담 신청이 접수되었습니다. 담당자가 빠르게 연락드리겠습니다.";
    form.reset();
  });
}

let serviceCarouselTimer;

function bindServiceCarousel() {
  const carousel = document.querySelector("[data-service-carousel]");
  if (!carousel) return;

  const track = carousel.querySelector(".carousel-track");
  if (!track) return;

  // 무한 롤링: 원본 슬라이드를 한 번 더 복제해 [orig … orig'] 구성.
  // 끝지점에 도달하면 transition을 잠깐 끄고 처음으로 점프 → 끊김 없이 무한 진행
  const original = [...track.querySelectorAll(".carousel-slide")];
  const N = original.length;
  if (!N) return;
  original.forEach((s) => track.appendChild(s.cloneNode(true)));
  const slides = [...track.querySelectorAll(".carousel-slide")];
  const dots = [...carousel.querySelectorAll("[data-go]")];

  let active = 0;
  let snapping = false;

  const applyClasses = () => {
    const total = slides.length;
    slides.forEach((slide, i) => {
      slide.classList.remove("is-active", "is-prev", "is-next", "is-far");
      if (i === active) slide.classList.add("is-active");
      else if (i === (active - 1 + total) % total) slide.classList.add("is-prev");
      else if (i === (active + 1) % total) slide.classList.add("is-next");
      else slide.classList.add("is-far");
    });
    dots.forEach((dot, i) => dot.classList.toggle("is-active", i === active % N));
  };

  const positionTrack = () => {
    const cw = carousel.clientWidth;
    if (!cw) return;
    const slide = slides[active];
    if (!slide) return;
    const slideCenter = slide.offsetLeft + slide.offsetWidth / 2;
    const offset = cw / 2 - slideCenter;
    track.style.transform = `translateX(${offset}px)`;
  };

  const layout = () => {
    applyClasses();
    positionTrack();
  };

  const advance = () => {
    if (snapping) return;
    active = active + 1;
    track.style.transition = "";
    layout();

    // 복제 영역(>= N)에 진입하면 transition이 끝난 직후 첫 슬라이드로 silent jump
    if (active >= N) {
      setTimeout(() => {
        snapping = true;
        track.style.transition = "none";
        active = active % N;
        layout();
        // 강제 reflow 후 transition 복구
        // eslint-disable-next-line no-unused-expressions
        track.offsetHeight;
        track.style.transition = "";
        snapping = false;
      }, 650);
    }
  };

  const goTo = (i) => {
    if (snapping) return;
    active = ((i % N) + N) % N;
    track.style.transition = "";
    layout();
  };

  const restart = () => {
    clearInterval(serviceCarouselTimer);
    serviceCarouselTimer = setInterval(advance, 4000);
  };

  slides.forEach((slide, i) => {
    slide.addEventListener("click", () => {
      goTo(i);
      restart();
    });
  });
  dots.forEach((dot) => {
    dot.addEventListener("click", () => {
      goTo(parseInt(dot.dataset.go, 10) || 0);
      restart();
    });
  });
  carousel.addEventListener("mouseenter", () => clearInterval(serviceCarouselTimer));
  carousel.addEventListener("mouseleave", restart);

  // 이미지 로드/리사이즈 시 재배치
  const ro = new ResizeObserver(() => positionTrack());
  ro.observe(carousel);
  slides.forEach((s) => {
    const img = s.querySelector("img");
    if (img && !img.complete) {
      img.addEventListener("load", positionTrack, { once: true });
    }
  });

  requestAnimationFrame(layout);
  restart();
}

function bindPriceCarousel() {
  const carousel = document.querySelector("[data-price-carousel]");
  if (!carousel) return;

  const slides = [...carousel.querySelectorAll("[data-price-slide]")];
  const dots = [...document.querySelectorAll("[data-price-dot]")];
  const prev = carousel.querySelector(".price-prev");
  const next = carousel.querySelector(".price-next");
  let active = 0;

  const show = (index) => {
    active = (index + slides.length) % slides.length;
    slides.forEach((slide, slideIndex) => slide.classList.toggle("is-active", slideIndex === active));
    dots.forEach((dot, dotIndex) => dot.classList.toggle("is-active", dotIndex === active));
  };

  const restart = () => {
    clearInterval(priceCarouselTimer);
    priceCarouselTimer = setInterval(() => show(active + 1), 5200);
  };

  prev?.addEventListener("click", () => {
    show(active - 1);
    restart();
  });
  next?.addEventListener("click", () => {
    show(active + 1);
    restart();
  });
  dots.forEach((dot, index) => {
    dot.addEventListener("click", () => {
      show(index);
      restart();
    });
  });
  restart();
}

function bindFeeTabs() {
  const tabs = [...document.querySelectorAll("[data-fee-package]")];
  const info = document.querySelector("[data-fee-info]");
  const summary = document.querySelector("[data-fee-summary]");
  if (!tabs.length || !info || !summary) return;

  tabs.forEach((tab) => {
    tab.addEventListener("click", () => {
      const type = tab.dataset.feePackage;
      tabs.forEach((item) => item.classList.toggle("active", item === tab));
      info.innerHTML = feePackageInfoMarkup(type);
      summary.innerHTML = feePackageSummaryMarkup(type);
    });
  });
}

function bindPortfolioTabs() {
  const tabs = [...document.querySelectorAll("[data-portfolio-tab]")];
  const grids = [...document.querySelectorAll("[data-portfolio-grid]")];
  if (!tabs.length || !grids.length) return;

  tabs.forEach((tab) => {
    tab.addEventListener("click", () => {
      const key = tab.dataset.portfolioTab;
      tabs.forEach((item) => {
        const on = item === tab;
        item.classList.toggle("active", on);
        item.setAttribute("aria-selected", String(on));
      });
      grids.forEach((grid) => {
        grid.hidden = grid.dataset.portfolioGrid !== key;
      });
    });
  });
}

function bindOptimizationGuideCards() {
  document.querySelectorAll(".optimization-guide-card").forEach((card) => {
    const setActive = (active) => card.classList.toggle("is-active", active);
    card.addEventListener("mouseenter", () => setActive(true));
    card.addEventListener("mouseleave", () => setActive(false));
    card.addEventListener("focus", () => setActive(true));
    card.addEventListener("blur", () => setActive(false));
  });
}

function enhanceMainScroll() {
  if (typeof IntersectionObserver === "undefined") {
    // 옵저버 미지원 환경에서는 hidden 처리 자체를 안 함
    document.body.classList.remove("js-reveal");
    return;
  }

  if (mainScrollObserver && typeof mainScrollObserver.disconnect === "function") {
    mainScrollObserver.disconnect();
  }

  const isMain = document.body.classList.contains("route-main");
  const targets = isMain
    ? [
        ...document.querySelectorAll(
          ".main-hero, .main-problem-section, .main-optimization-guide, .main-process-section, .main-service-scope, .main-trust-section, .main-faq-section, .service-intro, .price-preview, .portfolio-preview, .free-section, .clients-section, .quick-consult-section"
        ),
        ...document.querySelectorAll(
          ".problem-card, .optimization-guide-card, .performance-process-list li, .service-scope-card, .trust-card-stack article, .faq-item, .service-card, .service-price-card, .portfolio-thumb, .free-feature-card"
        )
      ]
    : [...document.querySelectorAll(".section, .service-lead, .quick-consult-section")];

  targets.forEach((item, index) => {
    item.classList.add("scroll-reveal");
    item.style.setProperty("--reveal-index", String(index % 8));
  });

  // 옵저버가 준비된 시점에만 body.js-reveal 적용 — 그래야 CSS hidden 처리 발동
  document.body.classList.add("js-reveal");

  mainScrollObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          mainScrollObserver.unobserve(entry.target);
        }
      });
    },
    { rootMargin: "0px 0px 14% 0px", threshold: 0.08 }
  );

  targets.forEach((item) => mainScrollObserver.observe(item));

  // 안전장치: 1초 후에도 보이지 않는 항목은 강제로 노출
  setTimeout(() => {
    targets.forEach((item) => {
      if (!item.classList.contains("is-visible")) {
        item.classList.add("is-visible");
      }
    });
  }, 1000);
}

function syncScrollEffects() {
  const viewport = Math.max(window.innerHeight, 1);
  const progress = Math.min(1, Math.max(0, window.scrollY / viewport));
  document.documentElement.style.setProperty("--page-scroll", progress.toFixed(3));
  siteHeader.classList.toggle("is-scrolled", window.scrollY > 10);
}

function render() {
  const path = currentPath();
  const view = routes[path] || routes["/main"];
  clearInterval(priceCarouselTimer);
  clearInterval(serviceCarouselTimer);
  main.innerHTML = view();
  document.body.classList.toggle("route-main", path === "/" || path === "/main" || path === "/contact");
  document.body.classList.toggle("route-detail", path === "/homepage" || path === "/blog" || path === "/portfolio" || path === "/fee");
  setActive(path);
  bindContactForm();
  bindPriceCarousel();
  bindServiceCarousel();
  bindFeeTabs();
  bindPortfolioTabs();
  bindOptimizationGuideCards();
  enhanceMainScroll();
  syncScrollEffects();
  mobileNav.classList.remove("is-open");
  menuToggle.setAttribute("aria-expanded", "false");
  if (path === "/contact") {
    requestAnimationFrame(() => document.querySelector("#contact")?.scrollIntoView({ behavior: "auto", block: "start" }));
  } else {
    window.scrollTo({ top: 0, behavior: "auto" });
  }
}

menuToggle.addEventListener("click", () => {
  const isOpen = mobileNav.classList.toggle("is-open");
  menuToggle.setAttribute("aria-expanded", String(isOpen));
});

mobileNav.addEventListener("click", (event) => {
  if (event.target.closest("a")) {
    mobileNav.classList.remove("is-open");
    menuToggle.setAttribute("aria-expanded", "false");
  }
});

window.addEventListener("hashchange", render);
window.addEventListener("scroll", syncScrollEffects, { passive: true });

render();
