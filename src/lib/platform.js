import crypto from 'crypto';
import { getDb } from '@/lib/db';
import { ensureDefaultPagesForHospital } from '@/lib/defaultPages';

const LEGACY_ADMIN_PASSWORD = (() => {
  if (!process.env.ADMIN_PASSWORD && process.env.NODE_ENV === 'production') {
    // eslint-disable-next-line no-console
    console.warn('[platform] ADMIN_PASSWORD is not set — using insecure default. Set this env var on the server.');
  }
  return process.env.ADMIN_PASSWORD || 'wonjudentalclinic';
})();
const SUPER_ADMIN_EMAIL = (process.env.SUPER_ADMIN_EMAIL || 'superadmin@platform.local').toLowerCase();
const SUPER_ADMIN_PASSWORD = process.env.SUPER_ADMIN_PASSWORD || LEGACY_ADMIN_PASSWORD;
const DEFAULT_HOSPITAL_ADMIN_EMAIL = (
  process.env.DEFAULT_HOSPITAL_ADMIN_EMAIL || 'admin@wonju-dental.local'
).toLowerCase();
const DEFAULT_HOSPITAL_ADMIN_PASSWORD =
  process.env.DEFAULT_HOSPITAL_ADMIN_PASSWORD || LEGACY_ADMIN_PASSWORD;
const DEFAULT_TEMPLATE_KEY = 'default-dental';
const ADMIN_ROLES = new Set(['super_admin', 'hospital_admin', 'reseller']);

let platformReadyPromise = null;

function normalizeSlug(value) {
  return String(value || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/-{2,}/g, '-');
}

function normalizeEmail(value) {
  return String(value || '').trim().toLowerCase();
}

function normalizeDomain(value) {
  const normalized = String(value || '').trim().toLowerCase();

  if (!normalized) {
    return '';
  }

  try {
    return new URL(normalized.startsWith('http') ? normalized : `https://${normalized}`).host.toLowerCase();
  } catch {
    return normalized.replace(/^https?:\/\//, '').split('/')[0].replace(/\/+$/, '');
  }
}

export function createPasswordHash(password) {
  const salt = crypto.randomBytes(16).toString('hex');
  const derived = crypto.scryptSync(String(password || ''), salt, 64).toString('hex');
  return `scrypt$${salt}$${derived}`;
}

export function verifyPasswordHash(password, passwordHash) {
  const [algorithm, salt, expectedHash] = String(passwordHash || '').split('$');

  if (algorithm !== 'scrypt' || !salt || !expectedHash) {
    return false;
  }

  const actualHash = crypto.scryptSync(String(password || ''), salt, 64).toString('hex');
  const expectedBuffer = Buffer.from(expectedHash, 'hex');
  const actualBuffer = Buffer.from(actualHash, 'hex');

  if (expectedBuffer.length !== actualBuffer.length) {
    return false;
  }

  return crypto.timingSafeEqual(expectedBuffer, actualBuffer);
}

async function ensureTableColumn(db, tableName, columnName, definition) {
  const columns = await db.all(`PRAGMA table_info(${tableName})`);
  const exists = columns.some((column) => column.name === columnName);

  if (!exists) {
    await db.exec(`ALTER TABLE ${tableName} ADD COLUMN ${columnName} ${definition}`);
  }
}

async function ensureDefaultHospital(db) {
  const existingHospital = await db.get('SELECT * FROM hospitals ORDER BY id ASC LIMIT 1');

  if (existingHospital) {
    return existingHospital;
  }

  const geo = await db.get('SELECT clinic_name FROM geo_settings ORDER BY id DESC LIMIT 1');
  const hospitalName = geo?.clinic_name || '원주치과의원';
  const slug = normalizeSlug(hospitalName) || 'wonju-dental';
  const result = await db.run(
    `
      INSERT INTO hospitals (name, slug, status, template_key, site_status)
      VALUES (?, ?, 'active', ?, 'active')
    `,
    [hospitalName, slug, DEFAULT_TEMPLATE_KEY]
  );

  return db.get('SELECT * FROM hospitals WHERE id = ?', [result.lastID]);
}

async function ensureDefaultAccount(db, { email, displayName, password, role, hospitalId = null }) {
  const normalizedEmail = normalizeEmail(email);
  const existing = await db.get('SELECT * FROM admin_accounts WHERE email = ?', [normalizedEmail]);

  if (existing) {
    return existing;
  }

  const result = await db.run(
    `
      INSERT INTO admin_accounts (email, display_name, password_hash, role, hospital_id, status)
      VALUES (?, ?, ?, ?, ?, 'active')
    `,
    [normalizedEmail, displayName, createPasswordHash(password), role, hospitalId]
  );

  return db.get('SELECT * FROM admin_accounts WHERE id = ?', [result.lastID]);
}

const DEFAULT_PATIENT_FIELDS = [
  { field_key: 'name',    label: '이름',   field_type: 'text', enabled: 1, required: 1, display_order: 10 },
  { field_key: 'phone',   label: '연락처', field_type: 'tel',  enabled: 1, required: 1, display_order: 20 },
  { field_key: 'gender',  label: '성별',   field_type: 'select', enabled: 0, required: 0, options: '남자|여자', display_order: 30 },
  { field_key: 'address', label: '주소',   field_type: 'text', enabled: 0, required: 0, display_order: 40 },
];

export async function ensureDefaultPatientFieldsForHospital(db, hospitalId) {
  for (const f of DEFAULT_PATIENT_FIELDS) {
    await db.run(
      `INSERT OR IGNORE INTO patient_field_configs
         (hospital_id, field_key, label, field_type, is_custom, enabled, required, options, display_order)
       VALUES (?, ?, ?, ?, 0, ?, ?, ?, ?)`,
      [hospitalId, f.field_key, f.label, f.field_type, f.enabled, f.required, f.options || '', f.display_order]
    );
  }
}

async function ensureDefaultPlatformData(db) {
  const defaultHospital = await ensureDefaultHospital(db);
  // metalink3.mycafe24.com은 관리자 전용 도메인이므로 병원에 연결하지 않음
  // await ensureDefaultHospitalDomain(db, defaultHospital.id);
  await ensureDefaultAccount(db, {
    email: SUPER_ADMIN_EMAIL,
    displayName: 'Platform Super Admin',
    password: SUPER_ADMIN_PASSWORD,
    role: 'super_admin',
  });
  await ensureDefaultAccount(db, {
    email: DEFAULT_HOSPITAL_ADMIN_EMAIL,
    displayName: defaultHospital.name,
    password: DEFAULT_HOSPITAL_ADMIN_PASSWORD,
    role: 'hospital_admin',
    hospitalId: defaultHospital.id,
  });

  return defaultHospital;
}

export async function ensurePlatformSchema() {
  if (platformReadyPromise) {
    return platformReadyPromise;
  }

  platformReadyPromise = (async () => {
    const db = await getDb();

    await db.exec(`
      CREATE TABLE IF NOT EXISTS hospitals (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        slug TEXT NOT NULL UNIQUE,
        status TEXT NOT NULL DEFAULT 'active',
        template_key TEXT NOT NULL DEFAULT 'default-dental',
        site_status TEXT NOT NULL DEFAULT 'active',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS hospital_domains (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        hospital_id INTEGER NOT NULL,
        domain TEXT NOT NULL UNIQUE,
        is_primary INTEGER NOT NULL DEFAULT 0,
        status TEXT NOT NULL DEFAULT 'pending',
        verification_token TEXT,
        verification_type TEXT NOT NULL DEFAULT 'manual',
        verified_at DATETIME,
        ssl_status TEXT NOT NULL DEFAULT 'inactive',
        ssl_enabled INTEGER NOT NULL DEFAULT 0,
        last_checked_at DATETIME,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (hospital_id) REFERENCES hospitals(id)
      );

      CREATE TABLE IF NOT EXISTS admin_accounts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        email TEXT NOT NULL UNIQUE,
        display_name TEXT NOT NULL,
        password_hash TEXT NOT NULL,
        role TEXT NOT NULL,
        hospital_id INTEGER,
        status TEXT NOT NULL DEFAULT 'active',
        last_login_at DATETIME,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (hospital_id) REFERENCES hospitals(id)
      );

      CREATE TABLE IF NOT EXISTS reseller_assignments (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        account_id INTEGER NOT NULL,
        hospital_id INTEGER NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(account_id, hospital_id),
        FOREIGN KEY (account_id) REFERENCES admin_accounts(id) ON DELETE CASCADE,
        FOREIGN KEY (hospital_id) REFERENCES hospitals(id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS vendor_billings (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        hospital_id INTEGER NOT NULL UNIQUE,
        setup_fee INTEGER NOT NULL DEFAULT 0,
        monthly_fee INTEGER NOT NULL DEFAULT 0,
        setup_date TEXT,
        subscription_start_date TEXT,
        notes TEXT DEFAULT '',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (hospital_id) REFERENCES hospitals(id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS vendor_billing_memos (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        billing_id INTEGER NOT NULL,
        account_id INTEGER NOT NULL,
        role TEXT NOT NULL,
        body TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (billing_id) REFERENCES vendor_billings(id) ON DELETE CASCADE,
        FOREIGN KEY (account_id) REFERENCES admin_accounts(id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS naver_carousels (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        hospital_id INTEGER NOT NULL,
        title TEXT NOT NULL DEFAULT '',
        page_slug TEXT NOT NULL DEFAULT 'main',
        item_type TEXT NOT NULL DEFAULT 'Article',
        is_active INTEGER NOT NULL DEFAULT 1,
        sort_order INTEGER NOT NULL DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (hospital_id) REFERENCES hospitals(id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS naver_carousel_items (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        carousel_id INTEGER NOT NULL,
        position INTEGER NOT NULL DEFAULT 0,
        name TEXT NOT NULL DEFAULT '',
        url TEXT NOT NULL DEFAULT '',
        image_url TEXT DEFAULT '',
        description TEXT DEFAULT '',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (carousel_id) REFERENCES naver_carousels(id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS activity_logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        account_id INTEGER,
        hospital_id INTEGER,
        action TEXT NOT NULL,
        entity_type TEXT NOT NULL,
        entity_id TEXT,
        before_json TEXT,
        after_json TEXT,
        ip_address TEXT,
        user_agent TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (account_id) REFERENCES admin_accounts(id),
        FOREIGN KEY (hospital_id) REFERENCES hospitals(id)
      );
    `);

    await db.exec(`
      CREATE TABLE IF NOT EXISTS page_views (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        hospital_id INTEGER,
        path TEXT,
        referrer TEXT DEFAULT '',
        referrer_source TEXT DEFAULT 'direct',
        user_agent TEXT DEFAULT '',
        ip TEXT DEFAULT '',
        country TEXT DEFAULT '',
        device TEXT DEFAULT 'desktop',
        session_id TEXT DEFAULT '',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (hospital_id) REFERENCES hospitals(id)
      );
      CREATE INDEX IF NOT EXISTS idx_pv_hospital_created ON page_views(hospital_id, created_at);
      CREATE INDEX IF NOT EXISTS idx_pv_ip_country ON page_views(ip, country);
    `);

    await db.exec(`
      CREATE TABLE IF NOT EXISTS ai_crawls (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        hospital_id INTEGER,
        bot TEXT NOT NULL DEFAULT '',
        kind TEXT NOT NULL DEFAULT 'crawler',
        path TEXT DEFAULT '',
        user_agent TEXT DEFAULT '',
        ip TEXT DEFAULT '',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (hospital_id) REFERENCES hospitals(id)
      );
      CREATE INDEX IF NOT EXISTS idx_aicrawl_hospital_created ON ai_crawls(hospital_id, created_at);
      CREATE INDEX IF NOT EXISTS idx_aicrawl_bot ON ai_crawls(bot);
    `);

    // 일정 캘린더 (업체별, 현재 kda21 전용 UI). 가산적·멱등.
    await db.exec(`
      CREATE TABLE IF NOT EXISTS calendar_events (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        hospital_id INTEGER NOT NULL,
        title TEXT NOT NULL DEFAULT '',
        content TEXT DEFAULT '',
        start_date TEXT NOT NULL,
        end_date TEXT DEFAULT '',
        start_time TEXT DEFAULT '',
        location TEXT DEFAULT '',
        link_url TEXT DEFAULT '',
        category TEXT DEFAULT '',
        color TEXT DEFAULT '#2563eb',
        is_published INTEGER NOT NULL DEFAULT 1,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (hospital_id) REFERENCES hospitals(id)
      );
      CREATE INDEX IF NOT EXISTS idx_calendar_hospital_date ON calendar_events(hospital_id, start_date);
    `);

    await db.exec(`
      CREATE TABLE IF NOT EXISTS patients (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        hospital_id INTEGER,
        email TEXT NOT NULL,
        password_hash TEXT NOT NULL,
        name TEXT NOT NULL,
        phone TEXT DEFAULT '',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (hospital_id) REFERENCES hospitals(id),
        UNIQUE(email, hospital_id)
      );

      CREATE TABLE IF NOT EXISTS patient_field_configs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        hospital_id INTEGER NOT NULL,
        field_key TEXT NOT NULL,
        label TEXT NOT NULL,
        field_type TEXT NOT NULL DEFAULT 'text',
        is_custom INTEGER NOT NULL DEFAULT 0,
        enabled INTEGER NOT NULL DEFAULT 1,
        required INTEGER NOT NULL DEFAULT 0,
        options TEXT DEFAULT '',
        display_order INTEGER NOT NULL DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (hospital_id) REFERENCES hospitals(id),
        UNIQUE(hospital_id, field_key)
      );

      CREATE TABLE IF NOT EXISTS patient_grades (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        hospital_id INTEGER NOT NULL,
        name TEXT NOT NULL,
        color TEXT DEFAULT '',
        sort_order INTEGER NOT NULL DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (hospital_id) REFERENCES hospitals(id) ON DELETE CASCADE
      );
      CREATE INDEX IF NOT EXISTS idx_patient_grades_hospital ON patient_grades(hospital_id, sort_order);
    `);

    await db.exec(`
      CREATE TABLE IF NOT EXISTS doctors (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        hospital_id INTEGER NOT NULL,
        name TEXT NOT NULL DEFAULT '',
        job_title TEXT DEFAULT '',
        license_no TEXT DEFAULT '',
        specialty TEXT DEFAULT '',
        credentials TEXT DEFAULT '',
        education TEXT DEFAULT '',
        memberships TEXT DEFAULT '',
        career TEXT DEFAULT '',
        photo_url TEXT DEFAULT '',
        same_as TEXT DEFAULT '',
        sort_order INTEGER NOT NULL DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (hospital_id) REFERENCES hospitals(id) ON DELETE CASCADE
      );
      CREATE INDEX IF NOT EXISTS idx_doctors_hospital ON doctors(hospital_id, sort_order);
    `);

    await ensureTableColumn(db, 'patients', 'gender', "TEXT DEFAULT ''");
    await ensureTableColumn(db, 'patients', 'address', "TEXT DEFAULT ''");
    await ensureTableColumn(db, 'patients', 'extras', "TEXT DEFAULT '{}'");
    await ensureTableColumn(db, 'patients', 'grade', "TEXT DEFAULT ''");

    // vendor_billings 확장 (등록 현황 + 상태 관리)
    await ensureTableColumn(db, 'vendor_billings', 'status', "TEXT DEFAULT 'building_pending'");
    await ensureTableColumn(db, 'vendor_billings', 'manager_name', "TEXT DEFAULT ''");
    await ensureTableColumn(db, 'vendor_billings', 'contract_months', 'INTEGER DEFAULT 12');
    await ensureTableColumn(db, 'vendor_billings', 'contract_end_date', 'TEXT');
    await ensureTableColumn(db, 'vendor_billings', 'service_open_date', 'TEXT');
    await ensureTableColumn(db, 'vendor_billings', 'terminated_date', 'TEXT');
    // 고객사·영업대행사·결제여부·구축종료일 (이미지 정보 구조)
    await ensureTableColumn(db, 'vendor_billings', 'client_manager_name', "TEXT DEFAULT ''");
    await ensureTableColumn(db, 'vendor_billings', 'client_phone', "TEXT DEFAULT ''");
    await ensureTableColumn(db, 'vendor_billings', 'agency_name', "TEXT DEFAULT ''");
    await ensureTableColumn(db, 'vendor_billings', 'agency_manager_name', "TEXT DEFAULT ''");
    await ensureTableColumn(db, 'vendor_billings', 'agency_phone', "TEXT DEFAULT ''");
    await ensureTableColumn(db, 'vendor_billings', 'build_end_date', 'TEXT');
    await ensureTableColumn(db, 'vendor_billings', 'build_paid', 'INTEGER NOT NULL DEFAULT 0');
    await ensureTableColumn(db, 'vendor_billings', 'maintenance_paid', 'INTEGER NOT NULL DEFAULT 0');
    // 영업 거래처(sales_prospects) 기반 정산 연결 — 어떤 영업거래처로부터 등록됐는지
    await ensureTableColumn(db, 'vendor_billings', 'prospect_id', 'INTEGER');

    // 결제 내역 — 업체별·항목별·회차별 1행
    await db.exec(`
      CREATE TABLE IF NOT EXISTS vendor_billing_payments (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        hospital_id INTEGER NOT NULL,
        billing_month TEXT NOT NULL,
        item_type TEXT NOT NULL,
        installment_no INTEGER NOT NULL DEFAULT 1,
        amount INTEGER NOT NULL DEFAULT 0,
        supply_amount INTEGER NOT NULL DEFAULT 0,
        vat INTEGER NOT NULL DEFAULT 0,
        payment_status TEXT NOT NULL DEFAULT 'unpaid',
        paid_amount INTEGER NOT NULL DEFAULT 0,
        paid_at TEXT,
        payment_method TEXT DEFAULT '',
        failure_reason TEXT DEFAULT '',
        receipt_url TEXT DEFAULT '',
        auto_generated INTEGER NOT NULL DEFAULT 0,
        notes TEXT DEFAULT '',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(hospital_id, billing_month, item_type, installment_no),
        FOREIGN KEY (hospital_id) REFERENCES hospitals(id) ON DELETE CASCADE
      );
      CREATE INDEX IF NOT EXISTS idx_vbp_month ON vendor_billing_payments(billing_month);
      CREATE INDEX IF NOT EXISTS idx_vbp_hospital ON vendor_billing_payments(hospital_id);
    `);

    // 리셀러 정산 — 요율(리셀러별) + 월별 정산서(지급 스냅샷)
    await db.exec(`
      CREATE TABLE IF NOT EXISTS reseller_settings (
        account_id INTEGER PRIMARY KEY,
        build_pct REAL NOT NULL DEFAULT 0,
        monthly_pct REAL NOT NULL DEFAULT 0,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (account_id) REFERENCES admin_accounts(id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS reseller_settlements (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        account_id INTEGER NOT NULL,
        month TEXT NOT NULL,
        build_base INTEGER NOT NULL DEFAULT 0,
        monthly_base INTEGER NOT NULL DEFAULT 0,
        build_pct REAL NOT NULL DEFAULT 0,
        monthly_pct REAL NOT NULL DEFAULT 0,
        commission INTEGER NOT NULL DEFAULT 0,
        status TEXT NOT NULL DEFAULT 'pending',
        paid_at TEXT,
        notes TEXT DEFAULT '',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(account_id, month),
        FOREIGN KEY (account_id) REFERENCES admin_accounts(id) ON DELETE CASCADE
      );
      CREATE INDEX IF NOT EXISTS idx_rs_month ON reseller_settlements(month);
    `);

    // 월별 정산 청구 (legacy)
    await db.exec(`
      CREATE TABLE IF NOT EXISTS vendor_billing_invoices (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        billing_month TEXT NOT NULL,
        period_start TEXT NOT NULL,
        period_end TEXT NOT NULL,
        item_count INTEGER NOT NULL DEFAULT 0,
        supply_amount INTEGER NOT NULL DEFAULT 0,
        vat INTEGER NOT NULL DEFAULT 0,
        settlement_amount INTEGER NOT NULL DEFAULT 0,
        paid_amount INTEGER NOT NULL DEFAULT 0,
        payment_status TEXT NOT NULL DEFAULT 'unpaid',
        paid_at TEXT,
        notes TEXT DEFAULT '',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(billing_month)
      );
    `);

    await ensureTableColumn(db, 'consultations', 'hospital_id', 'INTEGER');
    await ensureTableColumn(db, 'boards', 'hospital_id', 'INTEGER');
    await ensureTableColumn(db, 'board_groups', 'hospital_id', 'INTEGER');
    await ensureTableColumn(db, 'board_groups', 'members_only', 'INTEGER NOT NULL DEFAULT 0');
    await ensureTableColumn(db, 'board_groups', 'blocked_grades', "TEXT DEFAULT '[]'");
    await ensureTableColumn(db, 'boards', 'attachments', "TEXT DEFAULT '[]'");
    await ensureTableColumn(db, 'popups', 'hospital_id', 'INTEGER');
    // seo_settings: id TEXT PRIMARY KEY → (slug, hospital_id) UNIQUE 마이그레이션
    const seoHasSlug = await db.get("SELECT 1 FROM pragma_table_info('seo_settings') WHERE name = 'slug'");
    if (!seoHasSlug) {
      const hasHospitalId = await db.get("SELECT 1 FROM pragma_table_info('seo_settings') WHERE name = 'hospital_id'");
      await db.exec('ALTER TABLE seo_settings RENAME TO _seo_old');
      await db.exec(`
        CREATE TABLE seo_settings (
          rowid INTEGER PRIMARY KEY AUTOINCREMENT,
          slug TEXT NOT NULL,
          hospital_id INTEGER,
          page_label TEXT DEFAULT '',
          path TEXT DEFAULT '',
          title TEXT DEFAULT '',
          description TEXT DEFAULT '',
          keywords TEXT DEFAULT '',
          og_title TEXT DEFAULT '',
          og_description TEXT DEFAULT '',
          og_image TEXT DEFAULT '',
          canonical_url TEXT DEFAULT '',
          author TEXT DEFAULT '',
          schema_type TEXT DEFAULT '',
          schema_name TEXT DEFAULT '',
          schema_description TEXT DEFAULT '',
          aeo_summary TEXT DEFAULT '',
          local_keywords TEXT DEFAULT '',
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          UNIQUE(slug, hospital_id)
        )
      `);
      if (hasHospitalId) {
        await db.exec(`INSERT OR IGNORE INTO seo_settings (slug, hospital_id, page_label, path, title, description, keywords, og_title, og_description, og_image, canonical_url, author, schema_type, schema_name, schema_description, aeo_summary, local_keywords, updated_at)
          SELECT id, hospital_id, page_label, path, title, description, keywords, og_title, og_description, og_image, canonical_url, author, schema_type, schema_name, schema_description, aeo_summary, local_keywords, updated_at FROM _seo_old`);
      } else {
        await db.exec(`INSERT OR IGNORE INTO seo_settings (slug, page_label, path, title, description, keywords, og_title, og_description, og_image, canonical_url, author, schema_type, schema_name, schema_description, aeo_summary, local_keywords, updated_at)
          SELECT id, page_label, path, title, description, keywords, og_title, og_description, og_image, canonical_url, author, schema_type, schema_name, schema_description, aeo_summary, local_keywords, updated_at FROM _seo_old`);
      }
      await db.exec('DROP TABLE _seo_old');
    }

    // seo_settings EEAT 확장: 페이지별 작성자/검수자/최종 검수일
    await ensureTableColumn(db, 'seo_settings', 'author_doctor_id', 'INTEGER');
    await ensureTableColumn(db, 'seo_settings', 'reviewer_doctor_id', 'INTEGER');
    await ensureTableColumn(db, 'seo_settings', 'last_reviewed', "TEXT DEFAULT ''");

    // ── 영업관리 (Sales) 모듈 — 리셀러 거래처(prospects) 관리 ───────────────
    await db.exec(`
      CREATE TABLE IF NOT EXISTS sales_prospects (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        reseller_account_id INTEGER NOT NULL,
        name TEXT NOT NULL,
        doctor_name TEXT DEFAULT '',
        phone TEXT DEFAULT '',
        addr TEXT DEFAULT '',
        memo TEXT DEFAULT '',
        category TEXT NOT NULL DEFAULT 'sales',
        status TEXT NOT NULL DEFAULT 'lead',
        linked_hospital_id INTEGER,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(reseller_account_id, name),
        FOREIGN KEY (reseller_account_id) REFERENCES admin_accounts(id) ON DELETE CASCADE,
        FOREIGN KEY (linked_hospital_id) REFERENCES hospitals(id) ON DELETE SET NULL
      );
      CREATE INDEX IF NOT EXISTS idx_sp_reseller ON sales_prospects(reseller_account_id, status);
      CREATE INDEX IF NOT EXISTS idx_sp_linked ON sales_prospects(linked_hospital_id);

      CREATE TABLE IF NOT EXISTS sales_checklist (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        prospect_id INTEGER NOT NULL,
        item_key TEXT NOT NULL,
        checked INTEGER NOT NULL DEFAULT 0,
        checked_at DATETIME,
        checked_by_account_id INTEGER,
        UNIQUE(prospect_id, item_key),
        FOREIGN KEY (prospect_id) REFERENCES sales_prospects(id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS sales_credentials (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        prospect_id INTEGER NOT NULL,
        kind TEXT NOT NULL,
        provider TEXT DEFAULT '',
        account_id TEXT DEFAULT '',
        account_pw_enc TEXT DEFAULT '',
        url TEXT DEFAULT '',
        note TEXT DEFAULT '',
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_by_account_id INTEGER,
        UNIQUE(prospect_id, kind),
        FOREIGN KEY (prospect_id) REFERENCES sales_prospects(id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS sales_service_status (
        prospect_id INTEGER NOT NULL,
        service_key TEXT NOT NULL,
        is_active INTEGER NOT NULL DEFAULT 0,
        started_at TEXT DEFAULT '',
        completed_at TEXT DEFAULT '',
        memo TEXT DEFAULT '',
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (prospect_id, service_key),
        FOREIGN KEY (prospect_id) REFERENCES sales_prospects(id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS sales_clinic_info (
        prospect_id INTEGER PRIMARY KEY,
        subjects TEXT DEFAULT '',
        strengths TEXT DEFAULT '',
        refs TEXT DEFAULT '',
        memo TEXT DEFAULT '',
        multi TEXT DEFAULT '',
        maint TEXT DEFAULT '',
        seo TEXT DEFAULT '',
        aeo TEXT DEFAULT '',
        vat TEXT DEFAULT '',
        files_text TEXT DEFAULT '',
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (prospect_id) REFERENCES sales_prospects(id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS sales_task_categories (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        reseller_account_id INTEGER NOT NULL,
        name TEXT NOT NULL,
        color TEXT DEFAULT '#1a6b4a',
        sort_order INTEGER NOT NULL DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(reseller_account_id, name),
        FOREIGN KEY (reseller_account_id) REFERENCES admin_accounts(id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS sales_tasks (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        prospect_id INTEGER NOT NULL,
        title TEXT NOT NULL DEFAULT '',
        category_id INTEGER,
        start_date TEXT DEFAULT '',
        end_date TEXT DEFAULT '',
        memo TEXT DEFAULT '',
        created_by_account_id INTEGER,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (prospect_id) REFERENCES sales_prospects(id) ON DELETE CASCADE,
        FOREIGN KEY (category_id) REFERENCES sales_task_categories(id) ON DELETE SET NULL
      );
      CREATE INDEX IF NOT EXISTS idx_st_prospect_date ON sales_tasks(prospect_id, start_date);

      CREATE TABLE IF NOT EXISTS sales_share_tokens (
        token TEXT PRIMARY KEY,
        prospect_id INTEGER NOT NULL,
        created_by_account_id INTEGER,
        expires_at DATETIME,
        revoked INTEGER NOT NULL DEFAULT 0,
        last_viewed_at DATETIME,
        view_count INTEGER NOT NULL DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (prospect_id) REFERENCES sales_prospects(id) ON DELETE CASCADE
      );
      CREATE INDEX IF NOT EXISTS idx_sst_prospect ON sales_share_tokens(prospect_id);

      CREATE TABLE IF NOT EXISTS app_settings (
        k TEXT PRIMARY KEY,
        v TEXT DEFAULT '',
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await ensureTableColumn(db, 'geo_settings', 'hospital_id', 'INTEGER');
    await ensureTableColumn(db, 'geo_settings', 'favicon_url', 'TEXT');
    await ensureTableColumn(db, 'geo_settings', 'og_image_url', 'TEXT');

    // 영업/접수 구분 (가산적, 기본 '영업')
    await ensureTableColumn(db, 'sales_prospects', 'category', "TEXT NOT NULL DEFAULT 'sales'");

    // 질문지(병원 정보 입력) 전체 응답 원본 보관 (가산적)
    await ensureTableColumn(db, 'sales_clinic_info', 'answers_json', "TEXT DEFAULT ''");

    // 계약/파일: 관리자 수기 업로드 파일 기록(JSON: {folderUrl, files:[{name,link,at}]}) (가산적)
    await ensureTableColumn(db, 'sales_clinic_info', 'drive_files_json', "TEXT DEFAULT ''");

    // global_snippets: id TEXT PRIMARY KEY → (id, hospital_id) 지원
    const snippetHasHid = await db.get("SELECT 1 FROM pragma_table_info('global_snippets') WHERE name = 'hospital_id'");
    if (!snippetHasHid) {
      await db.exec('ALTER TABLE global_snippets ADD COLUMN hospital_id INTEGER');
    }

    const defaultHospital = await ensureDefaultPlatformData(db);

    await db.run('UPDATE consultations SET hospital_id = ? WHERE hospital_id IS NULL', [defaultHospital.id]);
    await db.run('UPDATE boards SET hospital_id = ? WHERE hospital_id IS NULL', [defaultHospital.id]);
    await db.run('UPDATE board_groups SET hospital_id = ? WHERE hospital_id IS NULL', [defaultHospital.id]);
    await db.run('UPDATE popups SET hospital_id = ? WHERE hospital_id IS NULL', [defaultHospital.id]);
    await db.run('UPDATE seo_settings SET hospital_id = ? WHERE hospital_id IS NULL', [defaultHospital.id]);
    await db.run('UPDATE geo_settings SET hospital_id = ? WHERE hospital_id IS NULL', [defaultHospital.id]);
    await db.run('UPDATE geo_settings SET hospital_id = ? WHERE hospital_id IS NULL', [defaultHospital.id]);
    await db.run("UPDATE global_snippets SET hospital_id = ? WHERE hospital_id IS NULL AND id = 'global'", [defaultHospital.id]);

    // 모든 기존 병원에 기본 페이지(로그인/회원가입/개인정보/이용약관) 백필
    const allHospitals = await db.all('SELECT id FROM hospitals');
    for (const h of allHospitals) {
      await ensureDefaultPagesForHospital(db, h.id);
      await ensureDefaultPatientFieldsForHospital(db, h.id);
    }

    return db;
  })().catch((error) => {
    platformReadyPromise = null;
    throw error;
  });

  return platformReadyPromise;
}

export async function getDefaultHospital() {
  await ensurePlatformSchema();
  const db = await getDb();
  return db.get('SELECT * FROM hospitals ORDER BY id ASC LIMIT 1');
}

export async function getHospitalById(id) {
  await ensurePlatformSchema();
  const db = await getDb();
  return db.get('SELECT * FROM hospitals WHERE id = ?', [id]);
}

export async function getAdminAccountByEmail(email) {
  await ensurePlatformSchema();
  const db = await getDb();
  return db.get('SELECT * FROM admin_accounts WHERE email = ?', [normalizeEmail(email)]);
}

export async function authenticateAdminAccount(email, password) {
  await ensurePlatformSchema();
  const db = await getDb();

  if (email) {
    const account = await getAdminAccountByEmail(email);

    if (!account || account.status !== 'active') {
      return null;
    }

    if (!verifyPasswordHash(password, account.password_hash)) {
      return null;
    }

    await db.run(
      'UPDATE admin_accounts SET last_login_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [account.id]
    );

    return db.get('SELECT * FROM admin_accounts WHERE id = ?', [account.id]);
  }

  // 이메일 없는 로그인은 허용하지 않는다.
  // (과거에는 password === ADMIN_PASSWORD 만으로 슈퍼관리자를 반환하는 레거시 경로가
  //  있었으나, ADMIN_PASSWORD 가 약한 값이면 플랫폼 전체가 탈취되는 위험이 있어 제거함.)
  return null;
}

export async function listHospitals() {
  await ensurePlatformSchema();
  const db = await getDb();

  return db.all(`
    SELECT
      h.*,
      COUNT(DISTINCT d.id) AS domain_count,
      COUNT(DISTINCT a.id) AS account_count,
      (SELECT domain FROM hospital_domains WHERE hospital_id = h.id ORDER BY is_primary DESC, id ASC LIMIT 1) AS primary_domain,
      (SELECT address FROM geo_settings WHERE hospital_id = h.id ORDER BY id DESC LIMIT 1) AS address,
      (SELECT telephone FROM geo_settings WHERE hospital_id = h.id ORDER BY id DESC LIMIT 1) AS phone,
      (SELECT representative FROM geo_settings WHERE hospital_id = h.id ORDER BY id DESC LIMIT 1) AS representative,
      (SELECT clinic_name FROM geo_settings WHERE hospital_id = h.id ORDER BY id DESC LIMIT 1) AS clinic_name
    FROM hospitals h
    LEFT JOIN hospital_domains d ON d.hospital_id = h.id
    LEFT JOIN admin_accounts a ON a.hospital_id = h.id
    GROUP BY h.id
    ORDER BY h.created_at ASC, h.id ASC
  `);
}

export async function listHospitalDomains({ hospitalId = null } = {}) {
  await ensurePlatformSchema();
  const db = await getDb();

  if (hospitalId) {
    return db.all(
      `
        SELECT d.*, h.name AS hospital_name
        FROM hospital_domains d
        INNER JOIN hospitals h ON h.id = d.hospital_id
        WHERE d.hospital_id = ?
        ORDER BY d.is_primary DESC, d.created_at ASC, d.id ASC
      `,
      [hospitalId]
    );
  }

  return db.all(`
    SELECT d.*, h.name AS hospital_name
    FROM hospital_domains d
    INNER JOIN hospitals h ON h.id = d.hospital_id
    ORDER BY h.created_at ASC, d.is_primary DESC, d.created_at ASC, d.id ASC
  `);
}

export async function listAdminAccounts() {
  await ensurePlatformSchema();
  const db = await getDb();

  return db.all(`
    SELECT a.*, h.name AS hospital_name
    FROM admin_accounts a
    LEFT JOIN hospitals h ON h.id = a.hospital_id
    ORDER BY a.created_at ASC, a.id ASC
  `);
}

export async function listActivityLogs({ hospitalId = null, limit = 20 } = {}) {
  await ensurePlatformSchema();
  const db = await getDb();

  if (hospitalId) {
    return db.all(
      `
        SELECT l.*, a.display_name, h.name AS hospital_name
        FROM activity_logs l
        LEFT JOIN admin_accounts a ON a.id = l.account_id
        LEFT JOIN hospitals h ON h.id = l.hospital_id
        WHERE l.hospital_id = ?
        ORDER BY l.created_at DESC, l.id DESC
        LIMIT ?
      `,
      [hospitalId, limit]
    );
  }

  return db.all(
    `
      SELECT l.*, a.display_name, h.name AS hospital_name
      FROM activity_logs l
      LEFT JOIN admin_accounts a ON a.id = l.account_id
      LEFT JOIN hospitals h ON h.id = l.hospital_id
      ORDER BY l.created_at DESC, l.id DESC
      LIMIT ?
    `,
    [limit]
  );
}

export async function createHospital({ name, slug, template }) {
  await ensurePlatformSchema();
  const db = await getDb();
  const normalizedName = String(name || '').trim();
  const normalizedSlug = normalizeSlug(slug || name);
  const templateKey = ['light', 'basic'].includes(template) ? template : 'light';

  if (!normalizedName || !normalizedSlug) {
    throw new Error('업체명과 슬러그를 입력해 주세요.');
  }

  const existingHospital = await db.get('SELECT id FROM hospitals WHERE slug = ?', [normalizedSlug]);

  if (existingHospital) {
    throw new Error('이미 사용 중인 업체 슬러그입니다.');
  }

  const result = await db.run(
    `
      INSERT INTO hospitals (name, slug, status, template_key, site_status)
      VALUES (?, ?, 'active', ?, 'draft')
    `,
    [normalizedName, normalizedSlug, templateKey]
  );

  // 신규 병원에 기본 페이지 자동 생성 (템플릿 적용)
  await ensureDefaultPagesForHospital(db, result.lastID, templateKey, normalizedName, normalizedSlug);
  await ensureDefaultPatientFieldsForHospital(db, result.lastID);

  return db.get('SELECT * FROM hospitals WHERE id = ?', [result.lastID]);
}

export async function createHospitalDomain({ hospitalId, domain, isPrimary = false }) {
  await ensurePlatformSchema();
  const db = await getDb();
  const normalizedDomain = normalizeDomain(domain);

  if (!hospitalId || !normalizedDomain) {
    throw new Error('업체와 도메인을 확인해 주세요.');
  }

  const hospital = await db.get('SELECT id FROM hospitals WHERE id = ?', [hospitalId]);

  if (!hospital) {
    throw new Error('존재하지 않는 업체입니다.');
  }

  const existingDomain = await db.get('SELECT id FROM hospital_domains WHERE domain = ?', [normalizedDomain]);

  if (existingDomain) {
    throw new Error('이미 등록된 도메인입니다.');
  }

  if (isPrimary) {
    await db.run('UPDATE hospital_domains SET is_primary = 0 WHERE hospital_id = ?', [hospitalId]);
  }

  const result = await db.run(
    `
      INSERT INTO hospital_domains (
        hospital_id, domain, is_primary, status, verification_token, verification_type, ssl_status, ssl_enabled
      ) VALUES (?, ?, ?, 'pending', ?, 'manual', 'pending', 0)
    `,
    [hospitalId, normalizedDomain, isPrimary ? 1 : 0, crypto.randomBytes(12).toString('hex')]
  );

  return db.get('SELECT * FROM hospital_domains WHERE id = ?', [result.lastID]);
}

export async function createAdminAccount({
  email,
  password,
  displayName,
  role = 'hospital_admin',
  hospitalId = null,
}) {
  await ensurePlatformSchema();
  const db = await getDb();
  const normalizedEmail = normalizeEmail(email);
  const normalizedDisplayName = String(displayName || '').trim();

  if (!normalizedEmail || !password || !normalizedDisplayName) {
    throw new Error('이메일, 비밀번호, 이름을 입력해 주세요.');
  }

  if (!ADMIN_ROLES.has(role)) {
    throw new Error('지원하지 않는 관리자 권한입니다.');
  }

  const existingAccount = await db.get('SELECT id FROM admin_accounts WHERE email = ?', [normalizedEmail]);

  if (existingAccount) {
    throw new Error('이미 사용 중인 이메일입니다.');
  }

  // hospital_admin은 단일 업체 소속 필수, super_admin/reseller는 업체 미지정
  const requiresHospital = role === 'hospital_admin';
  if (requiresHospital && !hospitalId) {
    throw new Error('업체 관리자 계정은 업체 선택이 필요합니다.');
  }

  if (requiresHospital) {
    const hospital = await db.get('SELECT id FROM hospitals WHERE id = ?', [hospitalId]);

    if (!hospital) {
      throw new Error('존재하지 않는 업체입니다.');
    }
  }

  const persistedHospitalId = requiresHospital ? hospitalId : null;
  const result = await db.run(
    `
      INSERT INTO admin_accounts (email, display_name, password_hash, role, hospital_id, status)
      VALUES (?, ?, ?, ?, ?, 'active')
    `,
    [normalizedEmail, normalizedDisplayName, createPasswordHash(password), role, persistedHospitalId]
  );

  return db.get('SELECT * FROM admin_accounts WHERE id = ?', [result.lastID]);
}

export async function createActivityLog({
  accountId = null,
  hospitalId = null,
  action,
  entityType,
  entityId = null,
  beforeJson = null,
  afterJson = null,
  ipAddress = '',
  userAgent = '',
}) {
  await ensurePlatformSchema();
  const db = await getDb();

  await db.run(
    `
      INSERT INTO activity_logs (
        account_id, hospital_id, action, entity_type, entity_id,
        before_json, after_json, ip_address, user_agent
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `,
    [
      accountId,
      hospitalId,
      action,
      entityType,
      entityId ? String(entityId) : null,
      beforeJson ? JSON.stringify(beforeJson) : null,
      afterJson ? JSON.stringify(afterJson) : null,
      ipAddress,
      userAgent,
    ]
  );
}

export function getLegacyAdminPassword() {
  return LEGACY_ADMIN_PASSWORD;
}
