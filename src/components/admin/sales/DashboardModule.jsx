'use client';

import { useEffect, useMemo, useState } from 'react';
import { SERVICE_KEYS, SERVICE_META, STATUS_META, cx } from './salesShared';

// 컬럼 그룹 정의 — 그룹 헤더 + 컬럼 강조
const COLUMN_GROUPS = [
  { id: 'build', label: '빌드', keys: ['hp_move', 'hp_opt', 'hp_new'] },
  { id: 'service', label: '서비스', keys: ['monthly', 'backlink', 'google_ai', 'web_top'] },
  { id: 'option', label: '옵션', keys: ['multi_lang', 'web_post'] },
  { id: 'sales', label: '영업', keys: ['quote', 'contract_doc', 'deposit'], highlight: true },
];

const CAT_LABEL = { sales: '영업', intake: '접수' };

function Icon({ name, className = 'h-4 w-4' }) {
  const paths = {
    refresh: 'M21 12a9 9 0 1 1-2.64-6.36 M21 4v5h-5',
    download: 'M12 3v12 M8 11l4 4 4-4 M5 21h14',
  };
  const d = paths[name];
  if (!d) return null;
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <path d={d} />
    </svg>
  );
}

function ToggleSwitch({ active, saving, onToggle, ariaLabel }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={active}
      aria-label={ariaLabel}
      onClick={onToggle}
      disabled={saving}
      className={cx(
        'relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors duration-150',
        active ? 'bg-accent' : 'bg-zinc-200 hover:bg-zinc-300',
        saving && 'opacity-50',
      )}
    >
      <span
        aria-hidden="true"
        className={cx(
          'inline-block h-4 w-4 transform rounded-full bg-white shadow ring-1 ring-black/5 transition-transform duration-150',
          active ? 'translate-x-[18px]' : 'translate-x-0.5',
        )}
      />
    </button>
  );
}

function downloadCSV(filename, rows) {
  const csv = rows.map((r) => r.map((v) => {
    const s = String(v ?? '');
    return /[,"\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  }).join(',')).join('\n');
  const BOM = '﻿';
  const blob = new Blob([BOM + csv], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export default function DashboardModule({ prospects, onSelectProspect, superAdmin = false }) {
  const [services, setServices] = useState({});
  const [loading, setLoading] = useState(true);
  const [savingKey, setSavingKey] = useState(null);
  const [error, setError] = useState('');
  const [query, setQuery] = useState('');
  const [filterService, setFilterService] = useState('');
  const [filterWebPost, setFilterWebPost] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterCategory, setFilterCategory] = useState('');

  async function load() {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/admin/sales/services', { credentials: 'same-origin' });
      const json = await res.json();
      if (!res.ok || json.error) throw new Error(json.error || '불러오기 실패');
      setServices(json || {});
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => { load(); }, []);

  function getActive(pid, sk) {
    return !!services[pid]?.[sk]?.is_active;
  }

  async function toggle(pid, sk) {
    const cur = getActive(pid, sk);
    const next = !cur;
    const key = `${pid}:${sk}`;
    setSavingKey(key);
    setServices((prev) => ({
      ...prev,
      [pid]: { ...(prev[pid] || {}), [sk]: { ...(prev[pid]?.[sk] || {}), is_active: next } },
    }));
    try {
      const res = await fetch('/api/admin/sales/services', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({ prospect_id: pid, service_key: sk, is_active: next }),
      });
      const json = await res.json();
      if (!res.ok || json.error) throw new Error(json.error || '저장 실패');
    } catch (e) {
      setServices((prev) => ({
        ...prev,
        [pid]: { ...(prev[pid] || {}), [sk]: { ...(prev[pid]?.[sk] || {}), is_active: cur } },
      }));
      setError(e.message);
    } finally {
      setSavingKey(null);
    }
  }

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return (prospects || []).filter((p) => {
      if (q && ![p.name, p.doctor_name].some((v) => String(v || '').toLowerCase().includes(q))) return false;
      if (filterCategory && (p.category || 'sales') !== filterCategory) return false;
      if (filterStatus && p.status !== filterStatus) return false;
      if (filterService && !getActive(p.id, filterService)) return false;
      if (filterWebPost === 'y' && !getActive(p.id, 'web_post')) return false;
      if (filterWebPost === 'n' && getActive(p.id, 'web_post')) return false;
      return true;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [prospects, query, filterCategory, filterService, filterWebPost, filterStatus, services]);

  const summary = useMemo(() => {
    const c = { total: filtered.length };
    for (const sk of SERVICE_KEYS) c[sk] = 0;
    for (const p of filtered) for (const sk of SERVICE_KEYS) if (getActive(p.id, sk)) c[sk]++;
    return c;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filtered, services]);

  function handleExport() {
    const header = ['거래처명', '구분', '담당원장', '연락처', '주소', '상태', '운영 연결', ...SERVICE_KEYS.map((k) => SERVICE_META[k].label), '메모', '등록일', '수정일'];
    const rows = [header];
    for (const p of filtered) {
      rows.push([
        p.name,
        CAT_LABEL[p.category] || '영업',
        p.doctor_name || '', p.phone || '', p.addr || '',
        STATUS_META[p.status]?.label || p.status,
        p.linked_hospital_id ? (p.hospital_name || '연결됨') : '',
        ...SERVICE_KEYS.map((k) => (getActive(p.id, k) ? 'O' : '')),
        String(p.memo || '').replace(/\s+/g, ' ').trim(),
        String(p.created_at || '').slice(0, 10),
        String(p.updated_at || '').slice(0, 10),
      ]);
    }
    const today = new Date().toISOString().slice(0, 10);
    downloadCSV(`영업관리DB_${today}.csv`, rows);
  }

  function resetFilters() { setQuery(''); setFilterCategory(''); setFilterService(''); setFilterWebPost(''); setFilterStatus(''); }

  const selectCls = 'rounded-xl border border-zinc-300 bg-white px-3 py-2 text-[13px] outline-none transition-colors focus:border-zinc-900 focus:ring-4 focus:ring-zinc-900/5';

  return (
    <div className="flex h-full flex-col">
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-zinc-100 bg-white px-8 py-5">
        <div>
          <h1 className="text-lg font-black tracking-tight text-offblack">전체 서비스 현황</h1>
          <p className="mt-1 text-[13px] text-zinc-500">거래처 × {SERVICE_KEYS.length}종 서비스를 한눈에 확인하고 토글로 켜고 끕니다.</p>
        </div>
        <div className="flex items-center gap-2">
          {superAdmin && (
            <a href="/api/admin/google-oauth/start" title="질문지 자료 업로드용 구글 드라이브 연결/재인증 (슈퍼관리자 전용)" className="inline-flex items-center gap-1.5 rounded-xl border border-zinc-300 bg-white px-3.5 py-2 text-[13px] font-bold text-zinc-700 transition-colors hover:bg-zinc-50">📁 파일 보관소 재연결</a>
          )}
          <button onClick={load} className="inline-flex items-center gap-1.5 rounded-xl border border-zinc-300 bg-white px-3.5 py-2 text-[13px] font-bold text-zinc-700 transition-colors hover:bg-zinc-50"><Icon name="refresh" />새로고침</button>
          <button onClick={handleExport} className="inline-flex items-center gap-1.5 rounded-xl bg-accent px-3.5 py-2 text-[13px] font-bold text-white transition-colors hover:bg-accent-hover"><Icon name="download" />전체 DB 다운로드 (CSV)</button>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto bg-zinc-50/50 p-8">
        {/* 요약 — 영업(견적/계약/입금)만 강조, 나머지는 통일 회색 */}
        <div className="mb-5 grid grid-cols-2 gap-4 md:grid-cols-4">
          <SummaryCard label="전체 거래처" value={summary.total} accent />
          <SummaryCard label="견적서" value={summary.quote} />
          <SummaryCard label="계약서" value={summary.contract_doc} />
          <SummaryCard label="입금" value={summary.deposit} />
        </div>
        <div className="mb-5 flex flex-wrap gap-2">
          {['monthly', 'backlink', 'google_ai', 'web_top', 'multi_lang', 'web_post'].map((k) => (
            <span key={k} className="inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1.5 text-[13px] font-medium text-zinc-600 ring-1 ring-zinc-200">
              {SERVICE_META[k].label} <span className="font-black text-offblack">{summary[k]}</span>
            </span>
          ))}
        </div>

        {/* 필터 바 */}
        <div className="mb-4 flex flex-wrap items-center gap-2.5 rounded-2xl border border-zinc-200 bg-white p-4">
          <span className="text-[13px] font-bold text-zinc-500">필터</span>
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="거래처명·원장 검색"
            className="w-52 rounded-xl border border-zinc-300 px-3 py-2 text-[13px] outline-none transition-colors focus:border-zinc-900 focus:ring-4 focus:ring-zinc-900/5" />
          <select value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)} className={selectCls}>
            <option value="">구분 전체</option>
            <option value="sales">영업</option>
            <option value="intake">접수</option>
          </select>
          <select value={filterService} onChange={(e) => setFilterService(e.target.value)} className={selectCls}>
            <option value="">서비스 전체</option>
            {SERVICE_KEYS.map((k) => <option key={k} value={k}>{SERVICE_META[k].label} 진행 중</option>)}
          </select>
          <select value={filterWebPost} onChange={(e) => setFilterWebPost(e.target.value)} className={selectCls}>
            <option value="">웹포스팅 전체</option>
            <option value="y">웹포스팅 있음</option>
            <option value="n">웹포스팅 없음</option>
          </select>
          <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className={selectCls}>
            <option value="">상태 전체</option>
            {Object.entries(STATUS_META).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
          </select>
          <span className="ml-auto text-[13px] font-semibold text-zinc-500">{filtered.length}건</span>
          <button onClick={resetFilters} className="rounded-xl border border-zinc-300 bg-white px-3 py-2 text-[13px] font-bold text-zinc-600 transition-colors hover:bg-zinc-50">초기화</button>
        </div>

        {error && <div className="mb-3 rounded-xl bg-red-50 px-4 py-3 text-sm font-medium text-red-700">{error}</div>}

        {/* 테이블 — 그룹 헤더 + 토글 스위치 */}
        <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1100px] border-collapse text-[13px]">
              <thead>
                {/* 1행: 그룹 헤더 */}
                <tr className="border-b border-zinc-200 bg-zinc-50">
                  <th rowSpan={2} className="sticky left-0 z-10 bg-zinc-50 px-5 py-3 text-left text-[13px] font-black text-offblack">
                    거래처
                  </th>
                  {COLUMN_GROUPS.map((g) => (
                    <th
                      key={g.id}
                      colSpan={g.keys.length}
                      className={cx(
                        'border-l border-zinc-200 px-2 py-2.5 text-center text-[11px] font-black uppercase tracking-wider',
                        g.highlight ? 'bg-amber-50 text-amber-900' : 'text-zinc-400',
                      )}
                    >
                      {g.label}
                    </th>
                  ))}
                  <th rowSpan={2} className="border-l border-zinc-200 bg-zinc-50 px-3 py-3 text-center text-[13px] font-black text-offblack">상태</th>
                </tr>
                {/* 2행: 컬럼 헤더 */}
                <tr className="border-b border-zinc-200 bg-zinc-50/70">
                  {COLUMN_GROUPS.flatMap((g) => g.keys.map((k, i) => (
                    <th
                      key={k}
                      className={cx(
                        'px-2 py-2.5 text-center text-xs font-bold text-zinc-600',
                        i === 0 && 'border-l border-zinc-200',
                        g.highlight && 'bg-amber-50/60',
                      )}
                    >
                      {SERVICE_META[k].short}
                    </th>
                  )))}
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={SERVICE_KEYS.length + 2} className="px-4 py-14 text-center text-sm text-zinc-400">불러오는 중…</td></tr>
                ) : filtered.length === 0 ? (
                  <tr><td colSpan={SERVICE_KEYS.length + 2} className="px-4 py-14 text-center text-sm text-zinc-400">
                    {(prospects || []).length === 0 ? '등록된 거래처가 없습니다. 좌측에서 +추가하세요.' : '조건에 맞는 거래처가 없습니다.'}
                  </td></tr>
                ) : (
                  filtered.map((p) => (
                    <tr key={p.id} className="border-b border-zinc-50 transition-colors hover:bg-zinc-50/70">
                      <td className="sticky left-0 z-10 bg-white px-5 py-3.5">
                        <button
                          onClick={() => onSelectProspect?.(p.id)}
                          className="text-left text-sm font-bold text-offblack transition-colors hover:text-accent hover:underline"
                          title="거래처 상세로 이동"
                        >
                          {p.name}
                        </button>
                        <p className="mt-1 flex items-center gap-1.5 text-xs text-zinc-400">
                          <span className={cx('inline-flex items-center rounded px-1.5 py-0.5 text-[10px] font-bold', (p.category || 'sales') === 'intake' ? 'bg-zinc-100 text-zinc-500' : 'bg-blue-50 text-blue-600')}>{CAT_LABEL[p.category] || '영업'}</span>
                          {p.doctor_name}
                        </p>
                      </td>
                      {COLUMN_GROUPS.flatMap((g) => g.keys.map((k, i) => (
                        <td
                          key={k}
                          className={cx(
                            'px-2 py-3.5 text-center',
                            i === 0 && 'border-l border-zinc-100',
                            g.highlight && 'bg-amber-50/30',
                          )}
                        >
                          <div className="flex items-center justify-center">
                            <ToggleSwitch
                              active={getActive(p.id, k)}
                              saving={savingKey === `${p.id}:${k}`}
                              onToggle={() => toggle(p.id, k)}
                              ariaLabel={`${p.name} ${SERVICE_META[k].label}`}
                            />
                          </div>
                        </td>
                      )))}
                      <td className="border-l border-zinc-100 px-3 py-3.5 text-center">
                        <span className={cx('inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-bold',
                          STATUS_META[p.status]?.tone || 'bg-zinc-100 text-zinc-500 border-zinc-200')}>
                          {STATUS_META[p.status]?.label || p.status}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        <p className="mt-4 text-xs leading-relaxed text-zinc-400">
          ※ 토글을 켜면 자동으로 시작일이 기록되고, 끄면 완료일이 기록됩니다. 영업(견적·계약·입금) 컬럼은 앰버 배경으로 강조됩니다.
        </p>
      </div>
    </div>
  );
}

function SummaryCard({ label, value, accent = false }) {
  return (
    <div className={cx(
      'rounded-2xl p-5 shadow-sm',
      accent ? 'bg-accent text-white' : 'border border-zinc-200 bg-white',
    )}>
      <p className={cx('text-[13px] font-bold', accent ? 'text-white/70' : 'text-zinc-500')}>{label}</p>
      <p className={cx('mt-1.5 text-3xl font-black tracking-tight', accent ? 'text-white' : 'text-offblack')}>{value}</p>
    </div>
  );
}