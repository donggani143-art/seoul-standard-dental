'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

function StatusDot({ status }) {
  const map = {
    active:   'bg-emerald-500',
    draft:    'bg-amber-500',
    disabled: 'bg-zinc-400',
  };
  return <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${map[status] || 'bg-zinc-300'}`} />;
}

export default function HospitalSwitcher({
  currentLabel,
  currentSublabel,
  currentHospitalId,
  isSuper,
  isImpersonating,
}) {
  const [open, setOpen] = useState(false);
  const [hospitals, setHospitals] = useState([]);
  const [query, setQuery] = useState('');
  const [active, setActive] = useState(0);
  const [loaded, setLoaded] = useState(false);
  const rootRef = useRef(null);
  const inputRef = useRef(null);
  const listRef = useRef(null);

  useEffect(() => {
    if (!open || loaded) return;
    fetch('/api/admin/hospitals', { credentials: 'same-origin' })
      .then(r => r.ok ? r.json() : [])
      .then(data => { setHospitals(Array.isArray(data) ? data : []); setLoaded(true); })
      .catch(() => setLoaded(true));
  }, [open, loaded]);

  useEffect(() => {
    if (!open) return;
    setQuery('');
    setActive(0);
    setTimeout(() => inputRef.current?.focus(), 30);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    function onClickOutside(e) {
      if (rootRef.current && !rootRef.current.contains(e.target)) setOpen(false);
    }
    function onKey(e) {
      if (e.key === 'Escape') setOpen(false);
    }
    document.addEventListener('mousedown', onClickOutside);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onClickOutside);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  useEffect(() => {
    function onKey(e) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setOpen(true);
      }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return hospitals;
    return hospitals.filter(h =>
      (h.name || '').toLowerCase().includes(q) ||
      (h.slug || '').toLowerCase().includes(q) ||
      (h.primary_domain || '').toLowerCase().includes(q)
    );
  }, [hospitals, query]);

  useEffect(() => { setActive(0); }, [query]);

  const hasSuperOption = isSuper && isImpersonating;
  const totalItems = (hasSuperOption ? 1 : 0) + filtered.length;

  const selectIndex = useCallback((idx) => {
    if (hasSuperOption && idx === 0) {
      window.location.href = '/api/admin/impersonate?clear=1';
      return;
    }
    const h = filtered[idx - (hasSuperOption ? 1 : 0)];
    if (!h) return;
    if (h.id === currentHospitalId) { setOpen(false); return; }
    window.location.href = `/api/admin/impersonate?hospitalId=${h.id}`;
  }, [filtered, hasSuperOption, currentHospitalId]);

  const onKeyDown = useCallback((e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActive(i => Math.min(i + 1, totalItems - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActive(i => Math.max(i - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      selectIndex(active);
    }
  }, [active, totalItems, selectIndex]);

  useEffect(() => {
    if (!open) return;
    const el = listRef.current?.querySelector(`[data-idx="${active}"]`);
    el?.scrollIntoView({ block: 'nearest' });
  }, [active, open]);

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        className={`flex items-center gap-2 rounded-lg border px-3 py-1.5 text-sm font-semibold transition ${
          open
            ? 'border-zinc-300 bg-zinc-50'
            : 'border-zinc-200 bg-white hover:border-zinc-300 hover:bg-zinc-50'
        }`}
      >
        <span className={`h-6 w-6 shrink-0 rounded-md flex items-center justify-center text-[10px] font-black ${
          isImpersonating ? 'bg-amber-100 text-amber-700' : 'bg-accent text-white'
        }`}>
          {(currentLabel || '').charAt(0)}
        </span>
        <span className="flex flex-col items-start leading-tight">
          <span className="max-w-[160px] truncate text-[13px] font-bold text-zinc-900">{currentLabel}</span>
          {currentSublabel && (
            <span className="max-w-[160px] truncate text-[10px] font-medium text-zinc-500">{currentSublabel}</span>
          )}
        </span>
        <svg className={`ml-1 transition-transform ${open ? 'rotate-180' : ''}`} width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"/></svg>
      </button>

      {open && (
        <div
          className="absolute right-0 top-[calc(100%+6px)] z-50 w-[380px] overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-xl"
          onKeyDown={onKeyDown}
        >
          <div className="flex items-center gap-2 border-b border-zinc-100 px-3 py-2.5">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#a1a1aa" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" />
            </svg>
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="업체 검색..."
              className="flex-1 bg-transparent text-sm outline-none placeholder:text-zinc-400"
            />
            <kbd className="rounded border border-zinc-200 bg-zinc-50 px-1.5 py-0.5 text-[10px] font-bold text-zinc-400">ESC</kbd>
          </div>

          <div ref={listRef} className="max-h-[380px] overflow-y-auto py-1">
            {!loaded ? (
              <div className="py-8 text-center text-xs text-zinc-400">로딩 중...</div>
            ) : totalItems === 0 ? (
              <div className="py-8 text-center text-xs text-zinc-400">일치하는 업체가 없습니다.</div>
            ) : (
              <>
                {hasSuperOption && (() => {
                  const idx = 0;
                  const isActive = idx === active;
                  return (
                    <button
                      key="__super__"
                      data-idx={idx}
                      type="button"
                      onMouseEnter={() => setActive(idx)}
                      onClick={() => selectIndex(idx)}
                      className={`flex w-full items-center gap-3 px-3 py-2 text-left border-b border-zinc-100 ${
                        isActive ? 'bg-zinc-50' : 'bg-white'
                      }`}
                    >
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-accent text-[11px] font-black text-white">S</span>
                      <span className="flex-1 min-w-0">
                        <span className="block text-[13px] font-bold text-zinc-900">슈퍼관리자 대시보드</span>
                        <span className="block text-[11px] text-zinc-500">전체 업체 · 계정 · 도메인 관리</span>
                      </span>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-zinc-400"><path d="M15 18l-6-6 6-6"/></svg>
                    </button>
                  );
                })()}

                {filtered.map((h, i) => {
                  const idx = i + (hasSuperOption ? 1 : 0);
                  const isActive = idx === active;
                  const isCurrent = h.id === currentHospitalId;
                  return (
                    <button
                      key={h.id}
                      data-idx={idx}
                      type="button"
                      onMouseEnter={() => setActive(idx)}
                      onClick={() => selectIndex(idx)}
                      className={`flex w-full items-center gap-3 px-3 py-2 text-left ${
                        isActive ? 'bg-zinc-50' : 'bg-white'
                      }`}
                    >
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-zinc-100 text-[11px] font-black text-zinc-700">
                        {(h.name || '?').charAt(0)}
                      </span>
                      <span className="flex-1 min-w-0">
                        <span className="flex items-center gap-1.5">
                          <span className="truncate text-[13px] font-bold text-zinc-900">{h.name}</span>
                          <StatusDot status={h.status} />
                        </span>
                        <span className="block truncate text-[11px] text-zinc-500">
                          {h.primary_domain || h.slug}
                        </span>
                      </span>
                      {isCurrent ? (
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                      ) : (
                        <span className="text-[10px] text-zinc-400">{h.account_count}명</span>
                      )}
                    </button>
                  );
                })}
              </>
            )}
          </div>

          <div className="flex items-center justify-between border-t border-zinc-100 bg-zinc-50/50 px-3 py-2 text-[10px] text-zinc-500">
            <span>총 {hospitals.length}개 업체</span>
            <span className="flex items-center gap-2">
              <kbd className="rounded border border-zinc-200 bg-white px-1 font-bold">↑↓</kbd>
              <kbd className="rounded border border-zinc-200 bg-white px-1 font-bold">Enter</kbd>
              <kbd className="rounded border border-zinc-200 bg-white px-1 font-bold">⌘K</kbd>
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
