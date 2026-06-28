import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import path from 'path';

let db = null;

const seoDefaults = [
  {
    id: 'home',
    page_label: '홈',
    path: '/',
    title: '원주치과의원 | 당신 치아의 평생 주치의',
    description: '원주치과의원은 원주 단계동에서 자연치아 보존, 임플란트, 사랑니 발치, 턱관절, 심미치료를 진료하는 치과입니다.',
    keywords: '원주치과, 원주치과의원, 단계동치과, 원주임플란트, 원주사랑니, 원주턱관절, 원주심미치료',
    og_title: '원주치과의원 | 당신 치아의 평생 주치의',
    og_description: '과잉 진료 없이 현재와 미래의 치아 건강을 함께 보는 원주 단계동 치과입니다.',
    author: '김영욱 대표원장',
    schema_type: 'Dentist',
    schema_name: '원주치과의원',
    schema_description: '자연치아 보존을 최우선으로 진료하는 원주 단계동 치과',
    aeo_summary: '원주치과의원은 원주 단계동에서 자연치아 보존 중심 진료와 임플란트, 사랑니 발치, 턱관절, 심미치료를 제공하는 치과입니다.',
    local_keywords: '강원특별자치도 원주시, 단계동, 원주 치과'
  },
  {
    id: 'implant',
    page_label: '임플란트',
    path: '/implant',
    title: '원주 임플란트 | 단계동 원주치과의원',
    description: '3D 진단 기반 임플란트 식립, 뼈이식, 상악동거상술, 전체 임플란트까지 원주치과의원의 임플란트 진료를 안내합니다.',
    keywords: '원주임플란트, 단계동임플란트, 원주치과 임플란트, 뼈이식 임플란트, 상악동거상술',
    og_title: '원주 임플란트 진료 | 원주치과의원',
    og_description: '정밀 진단으로 식립 시점과 뼈 상태를 먼저 판단하는 원주 임플란트 진료',
    author: '김영욱 대표원장',
    schema_type: 'MedicalProcedure',
    schema_name: '원주 임플란트 진료',
    schema_description: '치아 상실, 뼈 부족, 보철 상태를 종합해 계획하는 임플란트 진료',
    aeo_summary: '임플란트는 치아 상실 부위의 뼈 상태, 인접 치아 이동, 전신 건강을 함께 확인한 뒤 식립 시점과 보철 방식을 정해야 합니다.',
    local_keywords: '원주 임플란트, 단계동 치과, 강원 원주'
  },
  {
    id: 'tmj',
    page_label: '턱관절',
    path: '/tmj',
    title: '원주 턱관절 치료 | 원주치과의원 TMJ 클리닉',
    description: '턱관절 소리, 통증, 편측 저작, 교통사고 이후 턱관절 불편감을 X-ray와 3D CT 기반으로 평가합니다.',
    keywords: '원주턱관절, 원주 턱관절 치과, TMJ 치료, 턱관절 통증, 단계동 치과',
    og_title: '원주 턱관절 정밀 진료 | 원주치과의원',
    og_description: '소리와 통증의 원인을 구조적으로 확인하는 턱관절 클리닉',
    author: '김영욱 대표원장',
    schema_type: 'MedicalProcedure',
    schema_name: '턱관절 정밀 진료',
    schema_description: '턱관절 장애의 원인을 영상 진단과 생활 습관까지 함께 확인하는 진료',
    aeo_summary: '턱관절 장애는 통증만 보는 것이 아니라 관절 구조, 저작 습관, 치아 맞물림, 외상 이력을 함께 확인해야 합니다.',
    local_keywords: '원주 턱관절, 원주 TMJ, 단계동 치과'
  },
  {
    id: 'wisdom-cavity',
    page_label: '사랑니/충치',
    path: '/wisdom-cavity',
    title: '원주 사랑니 발치·충치치료 | 원주치과의원',
    description: '매복 사랑니 발치, 신경관 위치 확인, MTA 기반 보존치료 등 원주치과의원의 사랑니·충치 진료 안내입니다.',
    keywords: '원주사랑니, 원주 매복사랑니, 단계동 사랑니 발치, 원주 충치치료, MTA 치료',
    og_title: '원주 사랑니 발치와 충치 보존치료',
    og_description: '신경관 위치와 치아 보존 가능성을 먼저 확인하는 사랑니·충치 진료',
    author: '김영욱 대표원장',
    schema_type: 'MedicalProcedure',
    schema_name: '사랑니 발치 및 충치 보존치료',
    schema_description: '매복 사랑니와 깊은 충치를 정밀 진단 후 치료하는 치과 진료',
    aeo_summary: '매복 사랑니는 신경관 위치와 염증 여부를 확인해야 하며, 깊은 충치는 발치 전에 보존 가능성을 먼저 평가해야 합니다.',
    local_keywords: '원주 사랑니 발치, 원주 충치치료, 단계동 치과'
  },
  {
    id: 'esthetics',
    page_label: '심미치료',
    path: '/esthetics',
    title: '원주 앞니 심미치료 | 원주치과의원',
    description: '앞니 벌어짐, 파절, 잇몸 퇴축, 세라믹 인레이, 지르코니아 크라운 등 심미치료 선택 기준을 안내합니다.',
    keywords: '원주심미치료, 원주 앞니치료, 원주 라미네이트, 원주 세라믹 인레이, 단계동 치과',
    og_title: '원주 앞니 심미치료 | 원주치과의원',
    og_description: '자연치아 손상을 줄이고 조화로운 미소를 설계하는 심미치료',
    author: '김영욱 대표원장',
    schema_type: 'MedicalProcedure',
    schema_name: '앞니 심미치료',
    schema_description: '앞니 형태, 색조, 잇몸 상태를 고려한 심미 치과 진료',
    aeo_summary: '앞니 심미치료는 치아 삭제량, 색조, 잇몸 라인, 교합 상태를 함께 비교해 치료 방식을 선택해야 합니다.',
    local_keywords: '원주 심미치료, 원주 라미네이트, 단계동 치과'
  },
  {
    id: 'about-doctor',
    page_label: '대표원장 소개',
    path: '/about/doctor',
    title: '원주치과 김영욱 대표원장 소개',
    description: '원주치과의원 김영욱 대표원장의 진료 철학과 약력, 자연치아 보존 중심 원칙을 확인하세요.',
    keywords: '원주치과 김영욱, 원주치과 대표원장, 원주 치과 전문의',
    og_title: '김영욱 대표원장 | 원주치과의원',
    og_description: '정직한 진료와 자연치아 보존을 우선하는 원주치과의원 대표원장 소개',
    author: '원주치과의원',
    schema_type: 'Person',
    schema_name: '김영욱 대표원장',
    schema_description: '원주치과의원 대표원장',
    aeo_summary: '김영욱 대표원장은 원주치과의원에서 자연치아 보존과 환자별 치료 계획을 중심으로 진료합니다.',
    local_keywords: '원주치과 대표원장, 원주 단계동 치과'
  },
  {
    id: 'about-hospital',
    page_label: '업체 소개/오시는 길',
    path: '/about/hospital',
    title: '원주치과 오시는 길·진료시간 | 원주치과의원',
    description: '원주치과의원의 위치, 진료시간, 예약 안내, 업체 정보를 확인하세요.',
    keywords: '원주치과 오시는길, 원주치과 진료시간, 단계동 치과, 원주치과 예약',
    og_title: '원주치과 오시는 길과 진료시간',
    og_description: '방문 전 위치와 진료시간을 확인하세요.',
    author: '원주치과의원',
    schema_type: 'Dentist',
    schema_name: '원주치과의원 오시는 길',
    schema_description: '원주치과의원의 위치 및 진료시간 안내',
    aeo_summary: '원주치과의원 방문 전 진료시간, 주소, 예약 채널을 확인할 수 있습니다.',
    local_keywords: '원주시 단계동 치과, 원주치과 위치'
  },
  {
    id: 'notice',
    page_label: '공지사항',
    path: '/community/notice',
    title: '원주치과 공지사항 | 업체 소식',
    description: '원주치과의원의 최신 공지사항과 업체 운영 소식을 확인하세요.',
    keywords: '원주치과 공지사항, 원주치과 소식',
    og_title: '원주치과 공지사항',
    og_description: '원주치과의원 업체 소식 안내',
    author: '원주치과의원',
    schema_type: 'CollectionPage',
    schema_name: '원주치과 공지사항',
    schema_description: '원주치과의원 공지사항 목록',
    aeo_summary: '원주치과 공지사항 페이지에서는 업체 운영과 관련된 최신 안내를 확인할 수 있습니다.',
    local_keywords: '원주치과 소식, 단계동 치과 공지'
  },
  {
    id: 'event',
    page_label: '이벤트',
    path: '/community/event',
    title: '원주치과 이벤트 | 진료 혜택 안내',
    description: '원주치과의원에서 진행 중인 이벤트와 혜택 정보를 확인하세요.',
    keywords: '원주치과 이벤트, 원주치과 혜택',
    og_title: '원주치과 이벤트',
    og_description: '진행 중인 혜택과 이벤트 안내',
    author: '원주치과의원',
    schema_type: 'CollectionPage',
    schema_name: '원주치과 이벤트',
    schema_description: '원주치과의원 이벤트 목록',
    aeo_summary: '원주치과 이벤트 페이지에서는 현재 진행 중인 혜택과 안내사항을 확인할 수 있습니다.',
    local_keywords: '원주치과 이벤트, 단계동 치과 혜택'
  }
];

const columnDefinitions = {
  seo_settings: {
    page_label: 'TEXT',
    path: 'TEXT',
    title: 'TEXT',
    description: 'TEXT',
    keywords: 'TEXT',
    og_title: 'TEXT',
    og_description: 'TEXT',
    og_image: 'TEXT',
    canonical_url: 'TEXT',
    author: 'TEXT',
    schema_type: 'TEXT',
    schema_name: 'TEXT',
    schema_description: 'TEXT',
    aeo_summary: 'TEXT',
    local_keywords: 'TEXT',
    updated_at: 'TEXT'
  },
  geo_settings: {
    clinic_name: 'TEXT',
    representative: 'TEXT',
    telephone: 'TEXT',
    address: 'TEXT',
    street_address: 'TEXT',
    address_locality: 'TEXT',
    address_region: 'TEXT',
    postal_code: 'TEXT',
    latitude: 'TEXT',
    longitude: 'TEXT',
    website_url: 'TEXT',
    map_url: 'TEXT',
    kakao_channel_url: 'TEXT',
    naver_booking_url: 'TEXT',
    naver_blog_url: 'TEXT',
    youtube_url: 'TEXT',
    instagram_url: 'TEXT',
    opening_hours: 'TEXT',
    schema_opening_hours: 'TEXT',
    medical_specialty: 'TEXT',
    area_served: 'TEXT',
    price_range: 'TEXT',
    updated_at: 'TEXT'
  },
  popups: {
    title: 'TEXT',
    content: 'TEXT',
    is_active: 'INTEGER DEFAULT 0',
    start_date: 'TEXT',
    end_date: 'TEXT',
    position: "TEXT DEFAULT 'center'",
    image_url: 'TEXT',
    link_url: 'TEXT',
    sort_order: 'INTEGER DEFAULT 0',
    updated_at: 'TEXT'
  },
  boards: {
    type: 'TEXT',
    board_group_id: 'INTEGER',
    title: 'TEXT',
    content: 'TEXT',
    is_published: 'INTEGER DEFAULT 1',
    start_date: 'TEXT',
    end_date: 'TEXT',
    updated_at: 'TEXT'
  },
  board_groups: {
    slug: 'TEXT',
    name: 'TEXT',
    description: 'TEXT',
    is_active: 'INTEGER DEFAULT 1',
    sort_order: 'INTEGER DEFAULT 0',
    updated_at: 'TEXT'
  },
  global_snippets: {
    common_meta_tags: 'TEXT',
    common_header: 'TEXT',
    common_body: 'TEXT',
    common_footer: 'TEXT',
    updated_at: 'TEXT'
  },
  pages: {
    hospital_id: 'INTEGER',
    slug: 'TEXT',
    title: 'TEXT',
    content: 'TEXT',
    custom_css: 'TEXT',
    custom_js: 'TEXT DEFAULT \'\'',
    meta_title: 'TEXT',
    meta_description: 'TEXT',
    is_published: 'INTEGER DEFAULT 1',
    sort_order: 'INTEGER DEFAULT 0',
    page_type: "TEXT DEFAULT 'custom'",
    updated_at: 'TEXT'
  }
};

async function ensureColumns(connection, tableName, columns) {
  const existing = await connection.all(`PRAGMA table_info(${tableName})`);
  const existingNames = new Set(existing.map((column) => column.name));

  for (const [name, definition] of Object.entries(columns)) {
    if (!existingNames.has(name)) {
      await connection.exec(`ALTER TABLE ${tableName} ADD COLUMN ${name} ${definition}`);
    }
  }
}

async function seedSeoSettings(connection) {
  // seo_settings 스키마가 마이그레이션(platform.js)으로 slug 기반으로 변경됨
  // 기존 id 컬럼 기반 시딩은 스킵 — 새 병원은 빈 상태로 시작
  const hasSlugCol = await connection.get("SELECT 1 FROM pragma_table_info('seo_settings') WHERE name = 'slug'");
  if (hasSlugCol) return;

  for (const item of seoDefaults) {
    await connection.run(
      `INSERT OR IGNORE INTO seo_settings (
        id, page_label, path, title, description, keywords, og_title, og_description,
        author, schema_type, schema_name, schema_description, aeo_summary, local_keywords
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [item.id, item.page_label, item.path, item.title, item.description, item.keywords,
       item.og_title, item.og_description, item.author, item.schema_type, item.schema_name,
       item.schema_description, item.aeo_summary, item.local_keywords]
    );
  }
}

async function seedGeoSettings(connection) {
  const geoCheck = await connection.get('SELECT count(*) as count FROM geo_settings');
  if (geoCheck.count > 0) return;

  await connection.run(
    `INSERT OR IGNORE INTO geo_settings (
      clinic_name, representative, address, street_address, address_locality,
      address_region, telephone, website_url, map_url, kakao_channel_url,
      naver_booking_url, naver_blog_url, youtube_url, instagram_url,
      opening_hours, schema_opening_hours, medical_specialty, area_served, price_range
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      '원주치과의원',
      '김영욱',
      '강원특별자치도 원주시 원주치과 (단계동)',
      '단계동',
      '원주시',
      '강원특별자치도',
      '033-734-2875',
      'https://wonjudental-example.com',
      '',
      'https://pf.kakao.com/_xoeuqb',
      'https://booking.naver.com/booking/13/bizes/1002721',
      'https://blog.naver.com/entourage?tab=1',
      'https://www.youtube.com/@%EC%9B%90%EC%A3%BC%EC%B9%98%EA%B3%BCTVv',
      'https://www.instagram.com/wonju_dental/',
      '월·수·금 09:30-18:00 / 화 09:30-21:00 / 목 14:00-18:00 / 점심 12:30-14:00 / 주말·공휴일 휴진',
      'Mo,We,Fr 09:30-18:00; Tu 09:30-21:00; Th 14:00-18:00',
      'Dentistry',
      '강원특별자치도 원주시',
      '$$'
    ]
  );
}


async function seedGlobalSnippets(connection) {
  await connection.run(
    `INSERT OR IGNORE INTO global_snippets (
      id, common_meta_tags, common_header, common_body, common_footer
    ) VALUES (?, ?, ?, ?, ?)`,
    ['global', '', '', '', '']
  );
}

async function seedBoardGroups(connection) {
  await connection.run(
    `INSERT OR IGNORE INTO board_groups (
      slug, name, description, is_active, sort_order
    ) VALUES (?, ?, ?, ?, ?)`,
    ['board', '게시판', '원주치과의 일반 게시판', 1, 0]
  );
}

async function getDb() {
  if (db) return db;

  const dbPath = path.join(process.cwd(), 'wonjudental.db');

  db = await open({
    filename: dbPath,
    driver: sqlite3.Database
  });

  await db.exec(`
    CREATE TABLE IF NOT EXISTS popup_settings (
      id TEXT PRIMARY KEY,
      isActive INTEGER DEFAULT 1,
      image_url TEXT,
      link_url TEXT,
      start_date TEXT,
      end_date TEXT
    );

    CREATE TABLE IF NOT EXISTS seo_settings (
      id TEXT PRIMARY KEY,
      page_label TEXT,
      path TEXT,
      title TEXT,
      description TEXT,
      keywords TEXT,
      og_title TEXT,
      og_description TEXT,
      og_image TEXT,
      canonical_url TEXT,
      author TEXT,
      schema_type TEXT,
      schema_name TEXT,
      schema_description TEXT,
      aeo_summary TEXT,
      local_keywords TEXT,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS geo_settings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      clinic_name TEXT,
      representative TEXT,
      telephone TEXT,
      address TEXT,
      street_address TEXT,
      address_locality TEXT,
      address_region TEXT,
      postal_code TEXT,
      latitude TEXT,
      longitude TEXT,
      website_url TEXT,
      map_url TEXT,
      kakao_channel_url TEXT,
      naver_booking_url TEXT,
      naver_blog_url TEXT,
      youtube_url TEXT,
      instagram_url TEXT,
      opening_hours TEXT,
      schema_opening_hours TEXT,
      medical_specialty TEXT,
      area_served TEXT,
      price_range TEXT,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS consultations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      category TEXT,
      name TEXT,
      phone TEXT,
      email TEXT,
      agreed INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS boards (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      type TEXT,
      board_group_id INTEGER,
      title TEXT,
      content TEXT,
      is_published INTEGER DEFAULT 1,
      start_date TEXT,
      end_date TEXT,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS popups (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT,
      content TEXT,
      is_active INTEGER DEFAULT 0,
      start_date TEXT,
      end_date TEXT,
      position TEXT DEFAULT 'center',
      image_url TEXT,
      link_url TEXT,
      sort_order INTEGER DEFAULT 0,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS board_groups (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      slug TEXT UNIQUE,
      name TEXT,
      description TEXT,
      is_active INTEGER DEFAULT 1,
      members_only INTEGER NOT NULL DEFAULT 0,
      sort_order INTEGER DEFAULT 0,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS global_snippets (
      id TEXT PRIMARY KEY,
      common_meta_tags TEXT,
      common_header TEXT,
      common_body TEXT,
      common_footer TEXT,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS pages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      hospital_id INTEGER,
      slug TEXT NOT NULL,
      title TEXT NOT NULL DEFAULT '',
      content TEXT DEFAULT '',
      custom_css TEXT DEFAULT '',
      custom_js TEXT DEFAULT '',
      meta_title TEXT DEFAULT '',
      meta_description TEXT DEFAULT '',
      is_published INTEGER NOT NULL DEFAULT 1,
      sort_order INTEGER NOT NULL DEFAULT 0,
      page_type TEXT NOT NULL DEFAULT 'custom',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  for (const [tableName, columns] of Object.entries(columnDefinitions)) {
    await ensureColumns(db, tableName, columns);
  }

  await seedSeoSettings(db);
  await seedGeoSettings(db);
  // backfillGeoSettings 제거 - 다른 병원의 GEO 데이터를 원주치과 값으로 덮어쓰는 버그
  await seedGlobalSnippets(db);
  await seedBoardGroups(db);

  return db;
}

export { getDb, seoDefaults };
