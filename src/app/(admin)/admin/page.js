import { cookies } from 'next/headers';
import AdminLoginForm from '@/components/admin/AdminLoginForm';
import HospitalCMSWorkspace from '@/components/admin/HospitalCMSWorkspace';
import ResellerWorkspace from '@/components/admin/ResellerWorkspace';
import SuperAdminWorkspace from '@/components/admin/SuperAdminWorkspace';
import { canAccessSuperAdmin, getAdminSessionFromCookieStore } from '@/lib/adminAuth';
import { getBoardGroups, listBoards } from '@/lib/boards';
import { getDb } from '@/lib/db';
import {
  ensurePlatformSchema,
  getDefaultHospital,
  getHospitalById,
  listActivityLogs,
  listAdminAccounts,
  listHospitalDomains,
  listHospitals,
} from '@/lib/platform';
import { listResellerAssignments } from '@/lib/resellerAssignments';
import { listCalendarEvents } from '@/lib/calendar';

// ─── 병원 어드민용 모듈 데이터 로더 ───────────────────────────────────────────

const HOSPITAL_MODULES = new Set([
  'dashboard', 'boards', 'popups', 'consult', 'patients', 'analytics', 'calendar', 'seo', 'domains', 'pages',
]);

const SUPER_MODULES = new Set([
  'hospitals', 'accounts', 'domains', 'logs', 'resellers', 'billings', 'aicrawls', 'sales',
]);

const RESELLER_MODULES = new Set([
  'billing', 'sales', 'apiinfo',
]);

async function loadHospitalData(module, session) {
  const db = await getDb();
  const hid = session.role === 'super_admin'
    ? (session.impersonateHospitalId ?? null)
    : (session.hospitalId ?? null);
  const hFilter = hid !== null ? 'WHERE hospital_id = ?' : '';
  const hParams = hid !== null ? [hid] : [];

  switch (module) {
    case 'dashboard': {
      const [consultCount, boardCount, popupCount, recentConsults] = await Promise.all([
        db.get(`SELECT COUNT(*) as c FROM consultations ${hFilter}`, hParams),
        db.get(`SELECT COUNT(*) as c FROM boards ${hFilter}`, hParams),
        db.get(`SELECT COUNT(*) as c FROM popups ${hFilter}`, hParams),
        db.all(
          `SELECT * FROM consultations ${hFilter} ORDER BY created_at DESC LIMIT 8`,
          hParams
        ),
      ]);
      return {
        consultCount: consultCount?.c ?? 0,
        boardCount: boardCount?.c ?? 0,
        popupCount: popupCount?.c ?? 0,
        recentConsults,
      };
    }

    case 'consult':
      return { consultations: await db.all(`SELECT * FROM consultations ${hFilter} ORDER BY created_at DESC`, hParams) };

    case 'boards': {
      const [boards, boardGroups] = await Promise.all([
        listBoards({ includeDrafts: true, hospitalId: hid }),
        getBoardGroups({ includeInactive: true, hospitalId: hid }),
      ]);
      return { boards, boardGroups };
    }

    case 'popups':
      return {
        popups: await db.all(
          `SELECT * FROM popups ${hFilter} ORDER BY sort_order ASC, id DESC`,
          hParams
        ),
      };

    case 'calendar':
      return { events: hid !== null ? await listCalendarEvents({ hospitalId: hid, includeUnpublished: true }) : [] };

    case 'seo': {
      const geoFilter = hid !== null ? 'WHERE hospital_id = ?' : '';
      const geoParams = hid !== null ? [hid] : [];
      const snippetFilter = hid !== null ? 'WHERE hospital_id = ?' : "WHERE id = 'global'";
      const snippetParams = hid !== null ? [hid] : [];

      const pagesFilter = hid !== null
        ? "WHERE hospital_id = ? AND slug NOT LIKE '\\_%' ESCAPE '\\'"
        : "WHERE slug NOT LIKE '\\_%' ESCAPE '\\'";

      const [geo, seoList, snippets, sitePages, doctors] = await Promise.all([
        db.get(`SELECT * FROM geo_settings ${geoFilter} ORDER BY id DESC LIMIT 1`, geoParams),
        db.all(`SELECT * FROM seo_settings ${hFilter}`, hParams),
        db.get(`SELECT * FROM global_snippets ${snippetFilter}`, snippetParams),
        db.all(`SELECT slug, title FROM pages ${pagesFilter} ORDER BY CASE slug WHEN 'main' THEN 0 ELSE 1 END, sort_order ASC, id ASC`, hid !== null ? [hid] : []),
        hid !== null
          ? db.all('SELECT * FROM doctors WHERE hospital_id = ? ORDER BY sort_order ASC, id ASC', [hid])
          : Promise.resolve([]),
      ]);

      const emptySeo = { title: '', description: '', keywords: '', og_title: '', og_description: '', og_image: '', canonical_url: '', author: '', schema_type: '', schema_name: '', schema_description: '', aeo_summary: '', local_keywords: '', author_doctor_id: null, reviewer_doctor_id: null, last_reviewed: '' };
      const seoMap = new Map(seoList.map(s => [s.slug, s]));
      const pathMap = { main: '/', notice: '/community/notice', event: '/community/event' };
      const seoResult = sitePages.map(p => {
        const slug = p.slug === 'main' ? 'home' : p.slug;
        const existing = seoMap.get(slug);
        if (existing) return { ...existing, id: slug };
        return { ...emptySeo, id: slug, slug, page_label: p.title, path: pathMap[p.slug] || `/${p.slug}` };
      });

      return { geo: geo || {}, seoList: seoResult, snippets: snippets || {}, doctors: doctors || [] };
    }

    case 'domains': {
      const domainHid = hid ?? (await getDefaultHospital())?.id ?? null;
      const [domains, logs] = await Promise.all([
        listHospitalDomains(domainHid ? { hospitalId: domainHid } : {}),
        listActivityLogs({ hospitalId: domainHid, limit: 15 }),
      ]);
      return { domains, logs };
    }

    case 'pages': {
      const all = await db.all(
        `SELECT * FROM pages ${hFilter} ORDER BY sort_order ASC, id ASC`,
        hParams
      );
      return {
        pages: all.filter(p => !['_header', '_footer'].includes(p.slug)),
        layouts: all.filter(p => ['_header', '_footer'].includes(p.slug)),
      };
    }

    default:
      return {};
  }
}

async function loadSuperData(module) {
  switch (module) {
    case 'hospitals':
      return { hospitals: await listHospitals() };
    case 'accounts':
      return { accounts: await listAdminAccounts() };
    case 'domains':
      return { domains: await listHospitalDomains() };
    case 'logs':
      return { logs: await listActivityLogs({ limit: 50 }) };
    case 'resellers': {
      const { listResellerAccountsWithCounts } = await import('@/lib/resellerAssignments');
      const [resellers, hospitals] = await Promise.all([
        listResellerAccountsWithCounts(),
        listHospitals(),
      ]);
      return { resellers, hospitals };
    }
    case 'billings': {
      const { listBillings } = await import('@/lib/billing');
      const [billings, hospitals] = await Promise.all([
        listBillings({}),
        listHospitals(),
      ]);
      return { billings, hospitals };
    }
    default:
      return {};
  }
}

// ─── 로그인 화면 ─────────────────────────────────────────────────────────────

function AdminLogin({ hasError }) {
  return (
    <main className="flex min-h-screen flex-col bg-white">
      <header className="flex h-[70px] shrink-0 items-center justify-between border-b border-zinc-200 bg-white px-8">
        <div className="flex items-center gap-2">
          <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-[#e8533f] text-[12px] font-black text-white">M</span>
          <span className="text-[16px] font-black tracking-tight text-[#2c2c2c]">METALINK</span>
        </div>
        <div className="flex items-center gap-2 rounded-full border border-[#f5d6d3] bg-white px-3 py-1.5">
          <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-[#e8533f] text-[12px] font-black text-white">☎</span>
          <span className="text-[13px] font-bold text-[#2c2c2c]">고객상담</span>
          <span className="text-[14px] font-black text-[#e8533f]">02-6941-1702</span>
        </div>
      </header>
      <section className="flex flex-1">
        <div className="hidden flex-1 items-center justify-center bg-[#fceeb3] lg:flex">
          <div className="flex flex-col items-center gap-6 text-center">
            <div className="flex items-end gap-3">
              <div className="h-32 w-20 rounded-t-full border-2 border-[#2c2c2c] bg-white" />
              <div className="h-40 w-20 rounded-t-full border-2 border-[#2c2c2c] bg-[#f4a36a]" />
              <div className="h-36 w-20 rounded-t-full border-2 border-[#2c2c2c] bg-white" />
              <div className="h-44 w-20 rounded-t-full border-2 border-[#2c2c2c] bg-white" />
            </div>
            <div className="flex items-end gap-3">
              <div className="h-8 w-6 rounded-b border-2 border-[#2c2c2c] bg-white" />
              <div className="h-7 w-5 rounded-b border-2 border-[#2c2c2c] bg-white" />
              <div className="h-24 w-32 rounded-md border-2 border-[#2c2c2c] bg-[#fceeb3]" />
              <div className="h-7 w-5 rounded-b border-2 border-[#2c2c2c] bg-white" />
            </div>
            <p className="text-[13px] font-semibold text-[#2c2c2c]/70">함께 성장하는 디지털 워크스페이스</p>
          </div>
        </div>
        <div className="flex w-full items-center justify-center bg-white px-8 py-12 lg:w-[480px] lg:px-12">
          <div className="w-full max-w-[360px]">
            <p className="text-[14px] text-zinc-500">(주)메타링크</p>
            <h1 className="mt-3 text-[36px] font-black tracking-tight text-[#2c2c2c]">LOGIN</h1>
            <div className="mt-8">
              <AdminLoginForm initialModule="dashboard" hasError={hasError} />
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

// ─── 메인 페이지 ─────────────────────────────────────────────────────────────

export default async function AdminDashboard({ searchParams }) {
  const params = (await searchParams) || {};
  const cookieStore = await cookies();
  const session = getAdminSessionFromCookieStore(cookieStore);

  if (!session) {
    return <AdminLogin hasError={params?.error === '1'} />;
  }

  await ensurePlatformSchema();

  const isSuper = canAccessSuperAdmin(session);

  // ── 슈퍼어드민이 특정 병원을 임퍼스네이션 중 ──
  // 쿠키는 /api/admin/impersonate 엔드포인트에서 설정됨
  if (isSuper && session.impersonateHospitalId) {
    const hospital = await getHospitalById(session.impersonateHospitalId);
    if (hospital) {
      const rawModule = String(params?.module ?? 'dashboard');
      const activeModule = HOSPITAL_MODULES.has(rawModule) ? rawModule : 'dashboard';
      const initialData = await loadHospitalData(activeModule, session);
      return (
        <HospitalCMSWorkspace
          session={session}
          hospital={hospital}
          activeModule={activeModule}
          initialData={initialData}
          impersonatedBy={{ email: session.email, displayName: session.displayName }}
        />
      );
    }
  }

  // ── 리셀러 뷰 (정산만) ──
  if (session.role === 'reseller') {
    const rawModule = String(params?.module || 'billing');
    const activeModule = RESELLER_MODULES.has(rawModule) ? rawModule : 'billing';
    const assignments = await listResellerAssignments(session.accountId);
    const { listBillings } = await import('@/lib/billing');
    const hospitalIds = assignments.map((a) => a.hospital_id);
    const billings = hospitalIds.length ? await listBillings({ hospitalIds }) : [];
    const hospitals = assignments.map((a) => ({
      id: a.hospital_id,
      name: a.hospital_name,
      slug: a.hospital_slug,
      status: a.hospital_status,
    }));
    return (
      <ResellerWorkspace
        session={session}
        activeModule={activeModule}
        assignments={assignments}
        billings={billings}
        hospitals={hospitals}
      />
    );
  }

  // ── 슈퍼어드민 뷰 ──
  if (isSuper) {
    const rawModule = String(params?.module || 'hospitals');
    const activeModule = SUPER_MODULES.has(rawModule) ? rawModule : 'hospitals';
    const initialData = await loadSuperData(activeModule);

    return (
      <SuperAdminWorkspace
        session={session}
        activeModule={activeModule}
        initialData={initialData}
      />
    );
  }

  // ── 병원 어드민 뷰 ──
  const rawModule = String(params?.module ?? 'dashboard');
  const activeModule = HOSPITAL_MODULES.has(rawModule) ? rawModule : 'dashboard';
  const hospital = await getHospitalById(session.hospitalId) || await getDefaultHospital();
  const initialData = await loadHospitalData(activeModule, session);

  return (
    <HospitalCMSWorkspace
      session={session}
      hospital={hospital}
      activeModule={activeModule}
      initialData={initialData}
    />
  );
}
