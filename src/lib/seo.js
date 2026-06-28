import { cache } from 'react';
import { headers } from 'next/headers';
import { getDb } from '@/lib/db';
import { getCurrentHospital } from '@/lib/hospitalContext';

const ENV_BASE_URL = process.env.SITE_URL || process.env.NEXT_PUBLIC_SITE_URL;
const FALLBACK_BASE_URL = ENV_BASE_URL || 'https://metacms.kr';

// 병원의 대표 도메인을 hospital_domains 테이블에서 조회
async function getPrimaryDomainForHospital(hospitalId) {
  if (!hospitalId) return null;
  try {
    const db = await getDb();
    const row = await db.get(
      `SELECT domain FROM hospital_domains
       WHERE hospital_id = ? AND status IN ('connected', 'pending')
       ORDER BY is_primary DESC, id ASC LIMIT 1`,
      [hospitalId]
    );
    return row?.domain || null;
  } catch {
    return null;
  }
}

// canonical 베이스 URL 결정 우선순위:
// 1) 병원에 등록된 대표 도메인 (hospital_domains.is_primary)
// 2) 현재 요청 Host 헤더 (서브도메인 프리뷰 등)
// 3) 병원 정보의 website_url
// 4) ENV SITE_URL
async function resolveCanonicalBaseUrl(hospitalId, geoWebsiteUrl) {
  const primary = await getPrimaryDomainForHospital(hospitalId);
  if (primary) return `https://${primary}`;

  try {
    const headersList = await headers();
    const host = headersList.get('x-forwarded-host') || headersList.get('host');
    const proto = headersList.get('x-forwarded-proto') || 'https';
    if (host) return `${proto}://${host}`;
  } catch {
    /* SSR 외 컨텍스트에서 호출될 경우 무시 */
  }

  if (geoWebsiteUrl) return geoWebsiteUrl;
  return FALLBACK_BASE_URL;
}
const SITE_NAME = '';
// 옥스치과의원 전용 EEAT 구조 활성화 (다른 병원 영향 없음)
const OAKS_HOSPITAL_ID = 3;

function trimSlash(value) {
  return String(value || '').replace(/\/+$/, '');
}

function toBaseUrl(value) {
  try {
    return trimSlash(new URL(value || FALLBACK_BASE_URL).toString());
  } catch {
    return FALLBACK_BASE_URL;
  }
}

function toAbsoluteUrl(path, baseUrl) {
  if (!path) return undefined;

  try {
    return new URL(path, `${baseUrl}/`).toString();
  } catch {
    return undefined;
  }
}

function splitList(value, separator = /[,;\n]/) {
  return String(value || '')
    .split(separator)
    .map((item) => item.trim())
    .filter(Boolean);
}

// 주소의 시·도(address_region)를 ISO 3166-2:KR 코드로 매핑.
// geo.region 메타를 병원 소재지에 맞게 출력하기 위함(기존엔 강원 KR-42로 고정돼 타 지역은 부정확).
const KR_REGION_CODES = [
  ['서울', 'KR-11'], ['부산', 'KR-26'], ['대구', 'KR-27'], ['인천', 'KR-28'],
  ['광주', 'KR-29'], ['대전', 'KR-30'], ['울산', 'KR-31'], ['세종', 'KR-50'],
  ['경기', 'KR-41'], ['강원', 'KR-42'], ['충청북', 'KR-43'], ['충북', 'KR-43'],
  ['충청남', 'KR-44'], ['충남', 'KR-44'], ['전라북', 'KR-45'], ['전북', 'KR-45'],
  ['전라남', 'KR-46'], ['전남', 'KR-46'], ['경상북', 'KR-47'], ['경북', 'KR-47'],
  ['경상남', 'KR-48'], ['경남', 'KR-48'], ['제주', 'KR-49'],
];
function regionToIsoCode(addressRegion) {
  const s = String(addressRegion || '');
  for (const [needle, code] of KR_REGION_CODES) {
    if (s.includes(needle)) return code;
  }
  return null;
}

export function jsonLdString(data) {
  return JSON.stringify(data).replace(/</g, '\\u003c');
}

async function resolveHospitalId() {
  const hospital = await getCurrentHospital();
  return hospital?.hospitalId ?? null;
}

export const getGeoSettings = cache(async () => {
  const db = await getDb();
  const hid = await resolveHospitalId();
  if (!hid) return null;
  return db.get('SELECT * FROM geo_settings WHERE hospital_id = ? ORDER BY id DESC LIMIT 1', [hid]);
});

export const getSeoSetting = cache(async (pageId) => {
  const db = await getDb();
  const hid = await resolveHospitalId();
  if (!hid) return null;
  // 'home'은 pages.slug='main'의 별칭 — layout/page.js가 'home'으로 호출.
  // 어드민은 홈 SEO를 slug='home'으로 저장하므로, slug='main'이 없으면 'home'으로 폴백한다.
  const normalizedId = pageId === 'home' ? 'main' : pageId;
  let row = await db.get('SELECT * FROM seo_settings WHERE slug = ? AND hospital_id = ?', [normalizedId, hid]);
  if (!row && pageId === 'home') {
    row = await db.get('SELECT * FROM seo_settings WHERE slug = ? AND hospital_id = ?', ['home', hid]);
  }
  return row;
});

export const getDoctors = cache(async () => {
  const db = await getDb();
  const hid = await resolveHospitalId();
  if (!hid) return [];
  try {
    return await db.all(
      'SELECT * FROM doctors WHERE hospital_id = ? ORDER BY sort_order ASC, id ASC',
      [hid]
    );
  } catch {
    return [];
  }
});

function splitLines(value) {
  return splitList(value, /[\n;]/);
}

// 의료진 1명 → schema.org Physician 노드 (EEAT: 자격·학력·학회·면허·외부 프로필)
function buildDoctorNode(d, baseUrl) {
  const credentials = splitLines(d.credentials).map((name) => ({
    '@type': 'EducationalOccupationalCredential',
    name,
  }));
  const alumniOf = splitLines(d.education).map((name) => ({
    '@type': 'EducationalOrganization',
    name,
  }));
  const memberOf = splitLines(d.memberships).map((name) => ({
    '@type': 'Organization',
    name,
  }));
  const knowsAbout = splitList(d.specialty);
  const sameAs = splitLines(d.same_as);

  return {
    '@type': ['Physician', 'Person'],
    '@id': `${baseUrl}/#doctor-${d.id}`,
    name: d.name,
    jobTitle: d.job_title || undefined,
    image: d.photo_url || undefined,
    description: d.career || undefined,
    worksFor: { '@id': `${baseUrl}/#clinic` },
    medicalSpecialty: d.specialty || undefined,
    knowsAbout: knowsAbout.length ? knowsAbout : undefined,
    hasCredential: credentials.length ? credentials : undefined,
    alumniOf: alumniOf.length ? alumniOf : undefined,
    memberOf: memberOf.length ? memberOf : undefined,
    identifier: d.license_no
      ? { '@type': 'PropertyValue', propertyID: '의사 면허번호', value: d.license_no }
      : undefined,
    sameAs: sameAs.length ? sameAs : undefined,
  };
}

export const getGlobalSnippets = cache(async () => {
  const db = await getDb();
  const hid = await resolveHospitalId();
  if (!hid) return null;
  return db.get('SELECT * FROM global_snippets WHERE id = ?', [`hospital-${hid}`])
    || db.get('SELECT * FROM global_snippets WHERE hospital_id = ? ORDER BY rowid DESC LIMIT 1', [hid]);
});

export async function buildMetadata(pageId, fallback = {}) {
  const [geo, seo, hospitalId] = await Promise.all([
    getGeoSettings(),
    getSeoSetting(pageId),
    resolveHospitalId(),
  ]);
  const resolvedBase = await resolveCanonicalBaseUrl(hospitalId, geo?.website_url);
  const baseUrl = toBaseUrl(resolvedBase);
  const path = seo?.path || fallback.path || '/';
  const canonical = seo?.canonical_url || toAbsoluteUrl(path, baseUrl);
  // 병원 기본 폴백: geo.clinic_name → hospitals.name 순으로 조회해 seo_settings 없어도 OG 메타 생성
  let brandName = geo?.clinic_name?.trim() || '';
  if (!brandName && hospitalId) {
    try {
      const db = await getDb();
      const h = await db.get('SELECT name FROM hospitals WHERE id = ?', [hospitalId]);
      brandName = h?.name?.trim() || '';
    } catch { /* noop */ }
  }
  const geoFallbackTitle = brandName || SITE_NAME;
  const geoFallbackDesc = brandName
    ? `${brandName} 공식 홈페이지. 진료 안내·오시는길·상담 문의를 확인하세요.`
    : '';
  const title = seo?.title || fallback.title || geoFallbackTitle;
  const description =
    seo?.description || fallback.description || geoFallbackDesc;
  const ogImage = seo?.og_image || geo?.og_image_url || fallback.ogImage;

  return {
    metadataBase: new URL(baseUrl),
    title,
    description,
    keywords: seo?.keywords || fallback.keywords,
    authors: [{ name: seo?.author || fallback.author || SITE_NAME }],
    alternates: {
      canonical
    },
    openGraph: {
      title: seo?.og_title || title,
      description: seo?.og_description || description,
      url: canonical,
      siteName: SITE_NAME,
      locale: 'ko_KR',
      type: 'website',
      images: ogImage ? [{ url: ogImage }] : undefined
    },
    twitter: {
      card: ogImage ? 'summary_large_image' : 'summary',
      title: seo?.og_title || title,
      description: seo?.og_description || description,
      images: ogImage ? [ogImage] : undefined
    },
    robots: {
      index: true,
      follow: true
    },
    other: {
      'geo.region': regionToIsoCode(geo?.address_region) || 'KR-42',
      'geo.placename': geo?.address_locality || '원주시',
      'medical-specialty': geo?.medical_specialty || 'Dentistry',
      'aeo:summary': seo?.aeo_summary || description,
      'geo:local_keywords': seo?.local_keywords || geo?.area_served || '원주시'
    }
  };
}

export async function buildClinicJsonLd() {
  const [geo, hospitalId, doctors, homeSeo] = await Promise.all([
    getGeoSettings(),
    resolveHospitalId(),
    getDoctors(),
    getSeoSetting('home'),
  ]);
  // 업종 @type: 홈 seo의 schema_type 기준(기본=치과, 하위호환). 미용실 등 비의료 업종 지원.
  const bizType = homeSeo?.schema_type;
  const isMedical = !bizType || /dent|medical|clinic|physician|hospital/i.test(bizType);
  const clinicType = isMedical
    ? ['Dentist', 'MedicalClinic', 'LocalBusiness']
    : [bizType, 'LocalBusiness'];
  const resolvedBase = await resolveCanonicalBaseUrl(hospitalId, geo?.website_url);
  const baseUrl = toBaseUrl(resolvedBase);
  const sameAs = [
    geo?.naver_blog_url,
    geo?.kakao_channel_url,
    geo?.youtube_url,
    geo?.instagram_url
  ].filter(Boolean);
  const address = {
    '@type': 'PostalAddress',
    streetAddress: geo?.street_address || geo?.address || '단계동',
    addressLocality: geo?.address_locality || '원주시',
    addressRegion: geo?.address_region || '강원특별자치도',
    postalCode: geo?.postal_code || undefined,
    addressCountry: 'KR'
  };

  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': clinicType,
        '@id': `${baseUrl}/#clinic`,
        name: geo?.clinic_name || SITE_NAME,
        url: baseUrl,
        telephone: geo?.telephone || '033-734-2875',
        priceRange: geo?.price_range || '$$',
        medicalSpecialty: isMedical ? (geo?.medical_specialty || 'Dentistry') : undefined,
        areaServed: geo?.area_served || '강원특별자치도 원주시',
        address,
        geo:
          geo?.latitude && geo?.longitude
            ? {
                '@type': 'GeoCoordinates',
                latitude: geo.latitude,
                longitude: geo.longitude
              }
            : undefined,
        openingHours: splitList(geo?.schema_opening_hours, ';'),
        hasMap: geo?.map_url || undefined,
        sameAs,
        employee: doctors.length
          ? doctors.map((d) => ({ '@id': `${baseUrl}/#doctor-${d.id}` }))
          : undefined,
        potentialAction: geo?.naver_booking_url
          ? {
              '@type': 'ReserveAction',
              target: geo.naver_booking_url,
              name: '네이버 예약'
            }
          : undefined
      },
      {
        '@type': 'WebSite',
        '@id': `${baseUrl}/#website`,
        url: baseUrl,
        name: hospitalId === OAKS_HOSPITAL_ID ? (geo?.clinic_name || SITE_NAME) : SITE_NAME,
        description:
          hospitalId === OAKS_HOSPITAL_ID && geo?.clinic_name
            ? `${geo.clinic_name} 공식 홈페이지. 진료 안내·의료진·오시는 길·상담 문의를 확인하세요.`
            : undefined,
        inLanguage: 'ko-KR',
        publisher: {
          '@id': `${baseUrl}/#clinic`
        }
      },
      {
        '@type': 'Person',
        '@id': `${baseUrl}/#representative`,
        name: geo?.representative || '김영욱',
        jobTitle: '대표원장',
        worksFor: {
          '@id': `${baseUrl}/#clinic`
        }
      },
      ...doctors.map((d) => buildDoctorNode(d, baseUrl))
    ]
  };
}

export async function buildPageJsonLd(pageId, fallback = {}) {
  const [geo, seo, hospitalId] = await Promise.all([
    getGeoSettings(),
    getSeoSetting(pageId),
    resolveHospitalId(),
  ]);
  const resolvedBase = await resolveCanonicalBaseUrl(hospitalId, geo?.website_url);
  const baseUrl = toBaseUrl(resolvedBase);
  const path = seo?.path || fallback.path || '/';
  const url = seo?.canonical_url || toAbsoluteUrl(path, baseUrl);
  const schemaType = seo?.schema_type || fallback.schemaType || 'WebPage';
  const title = seo?.schema_name || seo?.title || fallback.title || SITE_NAME;
  const description = seo?.schema_description || seo?.description || fallback.description;

  const doctorRef = (id) =>
    id ? { '@id': `${baseUrl}/#doctor-${id}` } : null;
  const authorRef = doctorRef(seo?.author_doctor_id);
  const reviewerRef = doctorRef(seo?.reviewer_doctor_id) || { '@id': `${baseUrl}/#representative` };
  const lastReviewed = seo?.last_reviewed || undefined;

  const webPage = {
    '@context': 'https://schema.org',
    '@type': schemaType === 'CollectionPage' ? 'CollectionPage' : 'MedicalWebPage',
    '@id': `${url}#webpage`,
    url,
    name: title,
    description,
    inLanguage: 'ko-KR',
    isPartOf: {
      '@id': `${baseUrl}/#website`
    },
    about: {
      '@id': `${baseUrl}/#clinic`
    },
    primaryImageOfPage: seo?.og_image ? { '@type': 'ImageObject', url: seo.og_image } : undefined,
    mainEntity:
      schemaType && schemaType !== 'Dentist' && schemaType !== 'CollectionPage'
        ? {
            '@type': schemaType,
            name: title,
            description
          }
        : undefined,
    author: authorRef || undefined,
    reviewedBy: reviewerRef,
    lastReviewed,
    dateModified: lastReviewed
  };

  if (pageId === 'about-doctor') {
    webPage.mainEntity = {
      '@type': 'Person',
      '@id': `${baseUrl}/#representative`,
      name: geo?.representative || '김영욱',
      jobTitle: '대표원장',
      worksFor: {
        '@id': `${baseUrl}/#clinic`
      }
    };
  }

  return webPage;
}
