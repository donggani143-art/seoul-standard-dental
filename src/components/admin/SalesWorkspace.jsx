'use client';

import { useEffect, useMemo, useState } from 'react';
import { STATUS_META, CHECKLIST_TOTAL, cx } from './sales/salesShared';
import ChecklistTab from './sales/ChecklistTab';
import CredentialsTab from './sales/CredentialsTab';
import InfoTab from './sales/InfoTab';
import ContractTab from './sales/ContractTab';
import DashboardModule from './sales/DashboardModule';
import ScheduleModule from './sales/ScheduleModule';
import ShareModal from './sales/ShareModal';

// ── 라인 아이콘 (이모지 대체) ─────────────────────────────────────────────
const ICON_PATHS = {
  dashboard: 'M3 3h7v7H3z M14 3h7v7h-7z M14 14h7v7h-7z M3 14h7v7H3z',
  folder: 'M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z',
  calendar: 'M5 4h14a2 2 0 0 1 2 2v13a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z M3 9h18 M8 2v4 M16 2v4',
  check: 'M9 11l3 3L22 4 M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11',
  lock: 'M5 11h14v10H5z M8 11V7a4 4 0 0 1 8 0v4',
  building: 'M3 21h18 M5 21V5a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v16 M9 7h2 M9 11h2 M9 15h2',
  file: 'M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z M14 2v6h6 M9 13h6 M9 17h6',
  share: 'M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8 M16 6l-4-4-4 4 M12 2v13',
  plus: 'M12 5v14 M5 12h14',
  search: 'M21 21l-4.3-4.3 M11 18a7 7 0 1 0 0-14 7 7 0 0 0 0 14z',
  trash: 'M3 6h18 M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2 M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6',
  promote: 'M12 19V5 M5 12l7-7 7 7',
};
function Icon({ name, className = 'h-4 w-4' }) {
  const d = ICON_PATHS[name];
  if (!d) return null;
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <path d={d} />
    </svg>
  );
}

// 거래처 구분 (영업/접수)
const CATEGORY_META = {
  sales: { label: '영업', tone: 'bg-blue-50 text-blue-700 border-blue-200' },
  intake: { label: '접수', tone: 'bg-zinc-100 text-zinc-600 border-zinc-200' },
};
const CATEGORY_FILTERS = [
  { id: 'all', label: '전체' },
  { id: 'sales', label: '영업' },
  { id: 'intake', label: '접수' },
];
function CategoryBadge({ category, light = false }) {
  const meta = CATEGORY_META[category] || CATEGORY_META.sales;
  if (light) return <span className="inline-flex items-center rounded-full bg-white/20 px-2 py-0.5 text-[11px] font-bold text-white">{meta.label}</span>;
  return <span className={cx('inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-bold', meta.tone)}>{meta.label}</span>;
}

const DETAIL_TABS = [
  { id: 'check', label: '체크리스트', icon: 'check' },
  { id: 'account', label: '계정 정보', icon: 'lock' },
  { id: 'clinic', label: '병원 정보', icon: 'building' },
  { id: 'contract', label: '계약 / 파일', icon: 'file' },
];

const MAIN_TABS = [
  { id: 'dashboard', label: '대시보드', icon: 'dashboard' },
  { id: 'detail', label: '거래처 상세', icon: 'folder' },
  { id: 'schedule', label: '스케줄', icon: 'calendar' },
];

function StatusBadge({ status, light = false }) {
  const meta = STATUS_META[status] || STATUS_META.lead;
  if (light) {
    return (
      <span className="inline-flex items-center rounded-full bg-white/20 px-2 py-0.5 text-[11px] font-bold text-white">
        {meta.label}
      </span>
    );
  }
  return (
    <span className={cx('inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-bold', meta.tone)}>
      {meta.label}
    </span>
  );
}

function AddProspectModal({ open, onClose, onCreated }) {
  const [name, setName] = useState('');
  const [doctor, setDoctor] = useState('');
  const [phone, setPhone] = useState('');
  const [category, setCategory] = useState('sales');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (open) { setName(''); setDoctor(''); setPhone(''); setCategory('sales'); setError(''); }
  }, [open]);

  if (!open) return null;

  async function submit() {
    const cleanName = name.trim();
    if (!cleanName) { setError('거래처명을 입력해 주세요.'); return; }
    setSubmitting(true);
    setError('');
    try {
      const res = await fetch('/api/admin/sales/prospects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({ name: cleanName, doctor_name: doctor.trim(), phone: phone.trim(), category }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok || json.error) throw new Error(json.error || '등록 실패');
      onCreated?.(json.id);
      onClose();
    } catch (e) {
      setError(e.message);
    } finally {
      setSubmitting(false);
    }
  }

  const inputCls = 'w-full rounded-xl border border-zinc-300 px-3.5 py-2.5 text-sm text-offblack outline-none transition-colors focus:border-zinc-900 focus:ring-4 focus:ring-zinc-900/5';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div className="w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="border-b border-zinc-100 px-6 py-5">
          <h3 className="text-lg font-black text-offblack">거래처 추가</h3>
          <p className="mt-1 text-[13px] leading-relaxed text-zinc-500">영업 단계의 거래처로 등록됩니다. 계약 확정 시 슈퍼관리자가 운영 업체로 승격합니다.</p>
        </div>
        <div className="space-y-4 px-6 py-5">
          <label className="block">
            <span className="mb-1.5 block text-[13px] font-bold text-zinc-700">치과명 <span className="text-red-500">*</span></span>
            <input autoFocus value={name} onChange={(e) => setName(e.target.value)} placeholder="예: 강남스마일치과" className={inputCls} />
          </label>
          <div className="block">
            <span className="mb-1.5 block text-[13px] font-bold text-zinc-700">구분</span>
            <div className="inline-flex overflow-hidden rounded-xl border border-zinc-300">
              {CATEGORY_FILTERS.filter((f) => f.id !== 'all').map((f) => (
                <button key={f.id} type="button" onClick={() => setCategory(f.id)}
                  className={cx('px-5 py-2 text-[13px] font-bold transition-colors', category === f.id ? 'bg-accent text-white' : 'bg-white text-zinc-700 hover:bg-zinc-50')}>
                  {f.label}
                </button>
              ))}
            </div>
            <p className="mt-1 text-[12px] text-zinc-400">실제 영업 대상은 ‘영업’, 단순 문의·접수는 ‘접수’로 구분합니다.</p>
          </div>
          <label className="block">
            <span className="mb-1.5 block text-[13px] font-bold text-zinc-700">담당 원장명</span>
            <input value={doctor} onChange={(e) => setDoctor(e.target.value)} placeholder="예: 김원장" className={inputCls} />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-[13px] font-bold text-zinc-700">연락처</span>
            <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="010-0000-0000" className={inputCls} />
          </label>
          {error && <p className="rounded-xl bg-red-50 px-3.5 py-2.5 text-[13px] font-medium text-red-600">{error}</p>}
        </div>
        <div className="flex justify-end gap-2 border-t border-zinc-100 px-6 py-4">
          <button onClick={onClose} className="rounded-xl border border-zinc-300 bg-white px-4 py-2.5 text-sm font-bold text-zinc-700 transition-colors hover:bg-zinc-50">취소</button>
          <button onClick={submit} disabled={submitting} className="rounded-xl bg-accent px-5 py-2.5 text-sm font-bold text-white transition-colors hover:bg-accent-hover disabled:opacity-50">
            {submitting ? '추가 중…' : '추가'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── 거래처 상세 (detail 탭의 내용물) ──────────────────────────────────────
function ProspectDetail({ prospect, onProspectPatch, onDeleted }) {
  const [tab, setTab] = useState('check');
  const [progress, setProgress] = useState({ done: 0, total: CHECKLIST_TOTAL });
  const [showShare, setShowShare] = useState(false);

  useEffect(() => { setTab('check'); }, [prospect?.id]);

  async function deleteProspect() {
    if (!confirm(`거래처 "${prospect.name}"을(를) 삭제할까요?\n관련된 체크리스트·계정정보·메모도 모두 삭제됩니다.`)) return;
    const res = await fetch(`/api/admin/sales/prospects/${prospect.id}`, { method: 'DELETE', credentials: 'same-origin' });
    const json = await res.json();
    if (!res.ok || json.error) { alert(json.error || '실패'); return; }
    onDeleted?.();
  }

  async function toggleCategory() {
    const next = (prospect.category || 'sales') === 'sales' ? 'intake' : 'sales';
    const res = await fetch(`/api/admin/sales/prospects/${prospect.id}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' }, credentials: 'same-origin',
      body: JSON.stringify({ category: next }),
    });
    const json = await res.json();
    if (!res.ok || json.error) { alert(json.error || '실패'); return; }
    onProspectPatch?.({ category: next });
  }

  if (!prospect) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center bg-zinc-50/50 text-center">
        <div className="rounded-3xl bg-white p-12 shadow-sm ring-1 ring-zinc-200">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-zinc-100 text-zinc-400">
            <Icon name="folder" className="h-8 w-8" />
          </div>
          <p className="mt-5 text-base font-bold text-offblack">거래처를 선택하세요</p>
          <p className="mt-2 text-[13px] leading-relaxed text-zinc-500">왼쪽 목록에서 거래처를 선택하거나<br /><b>+ 추가</b>로 새 거래처를 등록하세요.</p>
        </div>
      </div>
    );
  }

  const pct = Math.round((progress.done / progress.total) * 100);
  const btnGhost = 'inline-flex items-center gap-1.5 rounded-xl border border-zinc-300 bg-white px-3.5 py-2 text-[13px] font-bold text-zinc-700 transition-colors hover:bg-zinc-50';

  return (
    <div className="flex min-h-0 flex-1 flex-col bg-zinc-50/50">
      <header className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-b border-zinc-100 bg-white px-8 py-5">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2.5">
            <h2 className="text-lg font-black tracking-tight text-offblack">{prospect.name}</h2>
            <CategoryBadge category={prospect.category} />
            <StatusBadge status={prospect.status} />
            {prospect.linked_hospital_id && (
              <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-bold text-emerald-700">→ 운영: {prospect.hospital_name}</span>
            )}
          </div>
          <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[13px] text-zinc-500">
            {prospect.doctor_name && <span>원장 {prospect.doctor_name}</span>}
            {prospect.phone && <span>{prospect.phone}</span>}
            <span className="inline-flex items-center gap-2">
              진행률
              <span className="inline-flex h-1.5 w-24 overflow-hidden rounded-full bg-zinc-200 align-middle">
                <span className="h-full rounded-full bg-accent transition-all" style={{ width: `${pct}%` }} />
              </span>
              <span className="font-bold text-offblack">{pct}%</span>
              <span className="text-zinc-400">({progress.done}/{progress.total})</span>
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={toggleCategory} className={btnGhost} title="영업 ↔ 접수 전환">
            구분 전환 → {(CATEGORY_META[(prospect.category || 'sales') === 'sales' ? 'intake' : 'sales']).label}
          </button>
          <button onClick={() => setShowShare(true)} className={btnGhost}><Icon name="share" />질문지 공유</button>
          {!prospect.linked_hospital_id && (
            <button onClick={deleteProspect} className="inline-flex items-center gap-1.5 rounded-xl border border-red-200 bg-white px-3.5 py-2 text-[13px] font-bold text-red-600 transition-colors hover:bg-red-50">
              <Icon name="trash" />삭제
            </button>
          )}
        </div>
      </header>

      <ShareModal open={showShare} prospect={prospect} onClose={() => setShowShare(false)} />

      <nav className="flex shrink-0 gap-1 border-b border-zinc-100 bg-white px-8">
        {DETAIL_TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={cx(
              'inline-flex items-center gap-2 border-b-2 px-3.5 py-3.5 text-[13px] font-bold transition-colors',
              tab === t.id ? 'border-accent text-accent' : 'border-transparent text-zinc-400 hover:text-zinc-700'
            )}
          >
            <Icon name={t.icon} className="h-[18px] w-[18px]" />{t.label}
          </button>
        ))}
      </nav>

      <div className="flex-1 overflow-y-auto p-8">
        {tab === 'check' && <ChecklistTab prospectId={prospect.id} onProgressChange={setProgress} />}
        {tab === 'account' && <CredentialsTab prospectId={prospect.id} />}
        {tab === 'clinic' && <InfoTab prospectId={prospect.id} prospect={prospect} onProspectPatch={onProspectPatch} />}
        {tab === 'contract' && <ContractTab prospectId={prospect.id} />}
      </div>
    </div>
  );
}

// ── 메인 SalesWorkspace ──────────────────────────────────────────────────
export default function SalesWorkspace({ readOnly = false }) {
  const [prospects, setProspects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [query, setQuery] = useState('');
  const [catFilter, setCatFilter] = useState('all'); // 'all' | 'sales' | 'intake'
  const [showAdd, setShowAdd] = useState(false);
  const [selectedId, setSelectedId] = useState(null);
  const [mainTab, setMainTab] = useState('dashboard'); // 'dashboard' | 'detail'

  async function load(preserveSelected = true) {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/admin/sales/prospects', { credentials: 'same-origin' });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || '불러오기 실패');
      const list = Array.isArray(json) ? json : [];
      setProspects(list);
      if (preserveSelected && selectedId && !list.find((p) => p.id === selectedId)) {
        setSelectedId(null);
      }
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return prospects.filter((p) => {
      if (catFilter !== 'all' && (p.category || 'sales') !== catFilter) return false;
      if (q && ![p.name, p.doctor_name, p.phone, p.addr].some((v) => String(v || '').toLowerCase().includes(q))) return false;
      return true;
    });
  }, [prospects, query, catFilter]);

  const selected = useMemo(() => prospects.find((p) => p.id === selectedId) || null, [prospects, selectedId]);

  function patchSelected(patch) {
    setProspects((list) => list.map((p) => (p.id === selectedId ? { ...p, ...patch } : p)));
  }

  function selectProspect(id) {
    setSelectedId(id);
    setMainTab('detail');
  }

  return (
    <div className="flex h-full bg-white">
      {/* 좌측 사이드바 — 거래처 목록 전용 */}
      <aside className="flex w-72 shrink-0 flex-col border-r border-zinc-100 bg-zinc-50/40">
        <div className="border-b border-zinc-100 bg-white px-4 py-4">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-black text-offblack">거래처 <span className="ml-1 font-bold text-zinc-400">{prospects.length}</span></h2>
            {!readOnly && (
              <button
                onClick={() => setShowAdd(true)}
                className="inline-flex items-center gap-1 rounded-lg bg-accent px-3 py-1.5 text-[13px] font-bold text-white transition-colors hover:bg-accent-hover"
              >
                <Icon name="plus" className="h-4 w-4" /> 추가
              </button>
            )}
          </div>
          <div className="relative">
            <Icon name="search" className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="거래처 검색"
              className="w-full rounded-xl border border-zinc-300 bg-white py-2.5 pl-9 pr-3 text-[13px] outline-none transition-colors focus:border-zinc-900 focus:ring-4 focus:ring-zinc-900/5"
            />
          </div>
          <div className="mt-2.5 flex gap-1">
            {CATEGORY_FILTERS.map((f) => (
              <button
                key={f.id}
                onClick={() => setCatFilter(f.id)}
                className={cx('flex-1 rounded-lg py-1.5 text-[12px] font-bold transition-colors', catFilter === f.id ? 'bg-offblack text-white' : 'bg-zinc-100 text-zinc-500 hover:bg-zinc-200')}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-2.5">
          {loading ? (
            <p className="p-8 text-center text-[13px] text-zinc-400">불러오는 중…</p>
          ) : filtered.length === 0 ? (
            <p className="whitespace-pre-line p-8 text-center text-[13px] leading-relaxed text-zinc-400">
              {prospects.length === 0 ? '아직 거래처가 없습니다.\n+ 추가로 등록하세요.' : '검색 결과가 없습니다.'}
            </p>
          ) : (
            filtered.map((p) => {
              const active = selectedId === p.id && mainTab === 'detail';
              return (
                <button
                  key={p.id}
                  onClick={() => selectProspect(p.id)}
                  className={cx(
                    'group mb-1.5 block w-full rounded-xl px-3.5 py-3 text-left transition-all',
                    active ? 'bg-accent text-white shadow-sm' : 'bg-transparent text-offblack hover:bg-white hover:shadow-sm'
                  )}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="truncate text-sm font-bold">{p.name}</span>
                    <div className="flex shrink-0 items-center gap-1">
                      {active ? <CategoryBadge category={p.category} light /> : <CategoryBadge category={p.category} />}
                      {active ? <StatusBadge status={p.status} light /> : <StatusBadge status={p.status} />}
                    </div>
                  </div>
                  {(p.doctor_name || p.phone) && (
                    <p className={cx('mt-1.5 truncate text-xs', active ? 'text-white/70' : 'text-zinc-500')}>
                      {p.doctor_name}{p.doctor_name && p.phone ? ' · ' : ''}{p.phone}
                    </p>
                  )}
                  {readOnly && p.reseller_name && (
                    <p className={cx('mt-1 truncate text-[11px] font-semibold', active ? 'text-white/70' : 'text-accent')}>
                      🏷 {p.reseller_name}
                    </p>
                  )}
                </button>
              );
            })
          )}
        </div>
      </aside>

      {/* 우측 메인 — 상단 탭 바 + 컨텐츠 */}
      <main className="flex min-h-0 min-w-0 flex-1 flex-col">
        {/* 메인 탭 바 */}
        <nav className="flex shrink-0 gap-1 border-b border-zinc-100 bg-white px-6">
          {MAIN_TABS.map((t) => {
            const isActive = mainTab === t.id;
            const isDetail = t.id === 'detail';
            return (
              <button
                key={t.id}
                onClick={() => setMainTab(t.id)}
                className={cx(
                  'inline-flex items-center gap-2 border-b-2 px-4 py-3.5 text-sm font-bold transition-colors',
                  isActive ? 'border-accent text-accent' : 'border-transparent text-zinc-400 hover:text-zinc-700'
                )}
              >
                <Icon name={t.icon} className="h-[18px] w-[18px]" />{t.label}
                {isDetail && selected && (
                  <span className={cx('ml-1 max-w-[140px] truncate rounded-full px-2 py-0.5 text-[11px] font-bold', isActive ? 'bg-accent/10 text-accent' : 'bg-zinc-100 text-zinc-500')}>
                    {selected.name}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
          {error ? (
            <div className="m-6 rounded-xl bg-red-50 px-4 py-3 text-sm font-medium text-red-700">{error}</div>
          ) : mainTab === 'dashboard' ? (
            <DashboardModule
              prospects={prospects}
              onSelectProspect={selectProspect}
              onReloadProspects={() => load(false)}
              superAdmin={readOnly}
            />
          ) : mainTab === 'schedule' ? (
            <ScheduleModule prospects={prospects} />
          ) : (
            <ProspectDetail
              prospect={selected}
              onProspectPatch={patchSelected}
              onDeleted={() => { setSelectedId(null); load(false); }}
            />
          )}
        </div>
      </main>

      <AddProspectModal
        open={showAdd}
        onClose={() => setShowAdd(false)}
        onCreated={(id) => { load(false).then(() => selectProspect(id)); }}
      />
    </div>
  );
}