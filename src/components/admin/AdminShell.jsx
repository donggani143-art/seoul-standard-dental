'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import AdminProfileModal from '@/components/admin/AdminProfileModal';
import HospitalSwitcher from '@/components/admin/HospitalSwitcher';

// ── 아이콘 (인라인 SVG) ──────────────────────────────────────────────────────

function Icon({ d, size = 18 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d={d} />
    </svg>
  );
}

const ICONS = {
  dashboard:  'M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z M9 22V12h6v10',
  boards:     'M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z M14 2v6h6 M16 13H8 M16 17H8 M10 9H8',
  popups:     'M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z',
  consult:    'M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2 M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z M23 21v-2a4 4 0 0 0-3-3.87 M16 3.13a4 4 0 0 1 0 7.75',
  seo:        'M21 21l-4.35-4.35 M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z',
  domains:    'M12 2a10 10 0 1 0 0 20A10 10 0 0 0 12 2z M2 12h20 M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z',
  pages:      'M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z M8 10h8 M8 14h5',
  layout:     'M3 3h18v5H3z M3 10h11v11H3z M16 10h5v11h-5z',
  hospitals:  'M19 21V5a2 2 0 0 0-2-2H7a2 2 0 0 0-2 2v16 M1 21h22 M9 10h2v2H9z M13 10h2v2h-2z M9 14h2v2H9z M13 14h2v2h-2z M9 6h6',
  accounts:   'M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2 M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z',
  logs:       'M12 20h9 M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z',
  logout:     'M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4 M16 17l5-5-5-5 M21 12H9',
  menu:       'M3 12h18 M3 6h18 M3 18h18',
  close:      'M18 6L6 18 M6 6l12 12',
  cms:        'M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z M13 2v7h7',
  api:        'M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4',
  calendar:   'M5 4h14a2 2 0 0 1 2 2v13a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z M3 9h18 M8 2v4 M16 2v4',
};

// 캘린더 기능을 노출할 업체 (현재 kda21=경북치과의사회 전용)
const CALENDAR_HOSPITAL_IDS = new Set([7]);

// ── 내비게이션 그룹 설정 ─────────────────────────────────────────────────────

const HOSPITAL_NAV_GROUPS = [
  {
    label: null,
    items: [
      { id: 'dashboard', label: '대시보드', icon: 'dashboard' },
    ],
  },
  {
    label: '콘텐츠 관리',
    items: [
      { id: 'boards',   label: '게시판 관리', icon: 'boards' },
      { id: 'popups',   label: '팝업 · 배너', icon: 'popups' },
      { id: 'consult',  label: '상담 문의',   icon: 'consult' },
      { id: 'patients', label: '회원 관리',   icon: 'accounts' },
    ],
  },
  {
    label: '통계',
    items: [
      { id: 'analytics', label: '방문 통계', icon: 'logs' },
    ],
  },
  {
    label: '사이트 설정',
    items: [
      { id: 'seo',     label: 'SEO · 업체 정보', icon: 'seo' },
      { id: 'pages',   label: '디자인 설정',     icon: 'pages' },
      { id: 'domains', label: '도메인 관리',      icon: 'domains' },
    ],
  },
];

const SUPER_NAV_GROUPS = [
  {
    label: '플랫폼',
    items: [
      { id: 'hospitals', label: '업체 관리', icon: 'hospitals' },
      { id: 'accounts',  label: '계정 관리', icon: 'accounts' },
      { id: 'resellers', label: '리셀러 관리', icon: 'accounts' },
    ],
  },
  {
    label: '영업',
    items: [
      { id: 'sales', label: '영업관리', icon: 'accounts' },
    ],
  },
  {
    label: '정산',
    items: [
      { id: 'billings', label: '정산 관리', icon: 'logs' },
    ],
  },
  {
    label: '시스템',
    items: [
      { id: 'domains',  label: '도메인 관리', icon: 'domains' },
      { id: 'logs',     label: '활동 로그',   icon: 'logs' },
      { id: 'aicrawls', label: 'AI 크롤링',   icon: 'logs' },
    ],
  },
];

const RESELLER_NAV_GROUPS = [
  {
    label: '영업',
    items: [
      { id: 'sales',   label: '영업관리',        icon: 'accounts' },
    ],
  },
  {
    label: '정산',
    items: [
      { id: 'billing', label: '담당 업체 정산', icon: 'logs' },
    ],
  },
  {
    label: '연동',
    items: [
      { id: 'apiinfo', label: 'API 정보', icon: 'api' },
    ],
  },
];

// ── AdminShell 컴포넌트 ───────────────────────────────────────────────────────

export default function AdminShell({ session, hospitalName, activeModule, onModuleChange, children, impersonatedBy, currentHospitalId }) {
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);

  const isSuper = session?.role === 'super_admin';
  const isReseller = session?.role === 'reseller';
  const canSwitch = isSuper || !!impersonatedBy;
  let groups;
  if (isReseller) groups = RESELLER_NAV_GROUPS;
  else if (isSuper && !impersonatedBy) groups = SUPER_NAV_GROUPS;
  else groups = HOSPITAL_NAV_GROUPS;

  // kda21 전용: '콘텐츠 관리' 그룹에 캘린더 메뉴 추가
  if (groups === HOSPITAL_NAV_GROUPS && CALENDAR_HOSPITAL_IDS.has(Number(currentHospitalId))) {
    groups = HOSPITAL_NAV_GROUPS.map((g) =>
      g.label === '콘텐츠 관리'
        ? { ...g, items: [...g.items, { id: 'calendar', label: '캘린더 · 일정', icon: 'calendar' }] }
        : g
    );
  }

  function handleNav(moduleId) {
    setMobileOpen(false);
    if (onModuleChange) {
      onModuleChange(moduleId);
    } else {
      router.push(`/admin?module=${moduleId}`);
    }
  }

  const displayName = hospitalName || session?.displayName || '관리자';
  const roleLabel = isSuper ? '슈퍼관리자' : isReseller ? '리셀러' : '업체 관리자';

  // 활성 메뉴 라벨 (사이드바 다크 헤더에 표시)
  let activeMenuLabel = displayName;
  for (const g of groups) {
    const hit = g.items.find((it) => it.id === activeModule);
    if (hit) { activeMenuLabel = hit.label; break; }
  }

  return (
    <div className="flex h-screen flex-col bg-base">

      {/* ── 모바일 사이드바 오버레이 ── */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/40 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* ════════════ 글로벌바 (상단 60px) ════════════ */}
      <header className="flex h-[60px] shrink-0 items-center border-b border-line bg-white px-4 lg:px-6">
        {/* 모바일 메뉴 토글 */}
        <button
          onClick={() => setMobileOpen(true)}
          className="mr-2 flex h-9 w-9 items-center justify-center rounded-md text-zinc-600 hover:bg-zinc-100 hover:text-accent lg:hidden"
          aria-label="메뉴"
        >
          <Icon d={ICONS.menu} size={20} />
        </button>

        {/* 로고 */}
        <div className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-md bg-accent text-[12px] font-black text-white">M</span>
          <p className="text-[16px] font-black tracking-tight text-zinc-900">METALINK CMS</p>
        </div>

        <div className="flex-1" />

        {/* 임퍼스네이션 배지 */}
        {impersonatedBy && (
          <span className="mr-3 hidden items-center gap-1.5 rounded-full bg-amber-50 px-2.5 py-1 text-[11px] font-bold text-amber-700 sm:inline-flex">
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 8v4"/><path d="M12 16h.01"/></svg>
            슈퍼관리자 모드
          </span>
        )}

        {/* 업체 전환 */}
        {canSwitch && (
          <div className="mr-3 hidden lg:block">
            <HospitalSwitcher
              currentLabel={impersonatedBy ? (hospitalName || '업체') : '슈퍼관리자'}
              currentSublabel={impersonatedBy ? (impersonatedBy.displayName || impersonatedBy.email) : '전체 플랫폼'}
              currentHospitalId={currentHospitalId ?? null}
              isSuper={isSuper}
              isImpersonating={!!impersonatedBy}
            />
          </div>
        )}

        <span className="mr-2 hidden h-5 w-px bg-zinc-200 sm:block" />

        {/* 사용자 정보 + 프로필 */}
        <button
          onClick={() => setProfileOpen(true)}
          className="flex items-center gap-2 rounded-md px-1.5 py-1 transition-colors hover:bg-zinc-100"
          aria-label="프로필"
        >
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-zinc-200 text-[11px] font-black text-zinc-700">
            {(session?.displayName || '?').charAt(0)}
          </span>
          <span className="hidden text-left leading-tight sm:block">
            <span className="block text-[12px] font-bold text-zinc-900">{session?.displayName}</span>
            <span className="block text-[10px] text-zinc-500">{roleLabel}</span>
          </span>
        </button>

        {/* 로그아웃 */}
        <a
          href="/admin/logout"
          className="ml-1 flex h-9 w-9 items-center justify-center rounded-md text-zinc-500 transition-colors hover:bg-zinc-100 hover:text-accent"
          title="로그아웃"
        >
          <Icon d={ICONS.logout} size={18} />
        </a>
      </header>

      {/* ════════════ 본문 그리드 (사이드바 240px + 콘텐츠) ════════════ */}
      <div className="grid min-h-0 flex-1 grid-rows-[minmax(0,1fr)] grid-cols-[240px_1fr] max-lg:grid-cols-1">

        {/* ── 사이드바 ── */}
        <aside
          className={`
            flex flex-col overflow-y-auto border-r border-line bg-[#fafaf8]
            max-lg:fixed max-lg:top-0 max-lg:left-0 max-lg:bottom-0 max-lg:z-40 max-lg:w-64
            max-lg:transition-transform max-lg:duration-300
            ${mobileOpen ? 'max-lg:translate-x-0' : 'max-lg:-translate-x-full'}
          `}
        >
          {/* 사이드바 헤더 — 다크 배경 + 사이트명/역할 */}
          <div className="flex h-[60px] shrink-0 items-center justify-between border-b border-black/20 bg-[#3a3a3a] px-5">
            <h2 className="truncate text-[16px] font-bold tracking-tight text-white">{activeMenuLabel}</h2>
            <button
              onClick={() => setMobileOpen(false)}
              className="text-white/70 hover:text-white lg:hidden"
              aria-label="닫기"
            >
              <Icon d={ICONS.close} size={16} />
            </button>
          </div>

          {/* 내비게이션 */}
          <nav className="flex-1 overflow-y-auto py-1">
            {groups.map((group, gi) => (
              <div key={gi} className="border-b border-[#ececea] px-2 py-2 last:border-b-0">
                {group.label && (
                  <p className="px-3 pb-1.5 pt-1 text-[10px] font-bold uppercase tracking-wider text-zinc-400">
                    {group.label}
                  </p>
                )}
                <div className="space-y-0.5">
                  {group.items.map((item) => {
                    const active = activeModule === item.id;
                    return (
                      <button
                        key={item.id}
                        onClick={() => handleNav(item.id)}
                        className={`
                          group relative flex w-full items-center gap-2.5 rounded-md px-3 py-2 text-left text-[13px] font-semibold
                          transition-colors duration-150
                          ${active
                            ? 'bg-[#ededea] text-accent'
                            : 'text-zinc-600 hover:bg-[#f3f1ed] hover:text-zinc-900'
                          }
                        `}
                      >
                        {active && (
                          <span className="absolute left-0 top-1/2 h-5 w-[3px] -translate-y-1/2 rounded-r bg-accent" />
                        )}
                        <span className={`shrink-0 transition-colors ${active ? 'text-accent' : 'text-zinc-400 group-hover:text-zinc-700'}`}>
                          <Icon d={ICONS[item.icon]} size={16} />
                        </span>
                        {item.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </nav>

          {/* 서비스 문의 */}
          <div className="border-t border-line px-4 py-3">
            <p className="mb-2 text-[10px] font-bold uppercase tracking-wider text-zinc-400">서비스 문의</p>
            <div className="flex items-center gap-2">
              <a
                href="https://pf.kakao.com/_xjxhLyn"
                target="_blank"
                rel="noreferrer"
                title="카카오톡 문의"
                className="flex h-8 w-8 items-center justify-center rounded-md bg-[#FEE500]/20 text-zinc-800 transition hover:bg-[#FEE500]/40"
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor"><path d="M12 3C6.48 3 2 6.58 2 10.94c0 2.8 1.86 5.27 4.66 6.67l-.9 3.38c-.08.3.26.54.52.37l3.91-2.58c.58.08 1.18.13 1.81.13 5.52 0 10-3.58 10-7.97S17.52 3 12 3z"/></svg>
              </a>
              <a
                href="https://mtlink.kr/TechSupport"
                target="_blank"
                rel="noreferrer"
                title="기술지원 게시판"
                className="flex h-8 w-8 items-center justify-center rounded-md bg-zinc-100 text-zinc-600 transition hover:bg-zinc-200"
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/><path d="M16 13H8"/><path d="M16 17H8"/><path d="M10 9H8"/></svg>
              </a>
            </div>
          </div>
        </aside>

        {/* ── 메인 ── */}
        <main className="min-w-0 min-h-0 overflow-auto">
          {children}
        </main>
      </div>

      <AdminProfileModal open={profileOpen} onClose={() => setProfileOpen(false)} session={session} />
    </div>
  );
}
