'use client';

import { useEffect, useState } from 'react';
import { CHECKLIST_SECTIONS, CHECKLIST_TOTAL, cx } from './salesShared';

export default function ChecklistTab({ prospectId, onProgressChange }) {
  const [checks, setChecks] = useState({});
  const [loading, setLoading] = useState(true);
  const [savingKey, setSavingKey] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!prospectId) return;
    setLoading(true);
    setError('');
    fetch(`/api/admin/sales/prospects/${prospectId}/checklist`, { credentials: 'same-origin' })
      .then((r) => r.json())
      .then((data) => {
        if (data?.error) throw new Error(data.error);
        setChecks(data || {});
        emitProgress(data || {});
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [prospectId]);

  function emitProgress(map) {
    const done = Object.values(map).filter((v) => v?.checked).length;
    onProgressChange?.({ done, total: CHECKLIST_TOTAL });
  }

  async function toggle(itemKey) {
    const current = !!checks[itemKey]?.checked;
    const next = !current;
    setSavingKey(itemKey);
    setChecks((prev) => {
      const updated = { ...prev, [itemKey]: { ...(prev[itemKey] || {}), checked: next } };
      emitProgress(updated);
      return updated;
    });
    try {
      const res = await fetch(`/api/admin/sales/prospects/${prospectId}/checklist`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({ item_key: itemKey, checked: next }),
      });
      const json = await res.json();
      if (!res.ok || json.error) throw new Error(json.error || '저장 실패');
    } catch (e) {
      // 롤백
      setChecks((prev) => {
        const updated = { ...prev, [itemKey]: { ...(prev[itemKey] || {}), checked: current } };
        emitProgress(updated);
        return updated;
      });
      setError(e.message);
    } finally {
      setSavingKey(null);
    }
  }

  if (loading) return <div className="p-16 text-center text-sm text-zinc-400">불러오는 중…</div>;

  const done = Object.values(checks).filter((v) => v?.checked).length;
  const pct = Math.round((done / CHECKLIST_TOTAL) * 100);

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-3 gap-4">
        <div className="rounded-2xl border border-zinc-200 bg-white p-4">
          <p className="text-[13px] font-bold text-zinc-500">완료 항목</p>
          <p className="mt-1.5 text-2xl font-black text-offblack">{done}<span className="ml-1 text-sm font-medium text-zinc-400">/ {CHECKLIST_TOTAL}</span></p>
        </div>
        <div className="rounded-2xl border border-zinc-200 bg-white p-4">
          <p className="text-[13px] font-bold text-zinc-500">진행률</p>
          <p className="mt-1.5 text-2xl font-black text-offblack">{pct}<span className="ml-1 text-sm font-medium text-zinc-400">%</span></p>
        </div>
        <div className="rounded-2xl border border-zinc-200 bg-white p-4">
          <p className="text-[13px] font-bold text-zinc-500">잔여</p>
          <p className="mt-1.5 text-2xl font-black text-offblack">{CHECKLIST_TOTAL - done}<span className="ml-1 text-sm font-medium text-zinc-400">개</span></p>
        </div>
      </div>

      <div className="h-2 overflow-hidden rounded-full bg-zinc-100">
        <div className="h-full bg-emerald-500 transition-all" style={{ width: `${pct}%` }} />
      </div>

      {error && <div className="rounded-xl bg-red-50 px-4 py-3 text-[13px] font-medium text-red-700">{error}</div>}

      {CHECKLIST_SECTIONS.map((sec) => {
        const sd = sec.items.filter((it) => checks[it.id]?.checked).length;
        return (
          <div key={sec.title} className="overflow-hidden rounded-2xl border border-zinc-200 bg-white">
            <div className="flex items-center justify-between border-b border-zinc-100 bg-zinc-50/60 px-5 py-3.5">
              <h3 className="text-sm font-black text-offblack">{sec.title}</h3>
              <span className="rounded-full border border-zinc-200 bg-white px-2.5 py-0.5 text-[13px] font-bold text-zinc-500">{sd} / {sec.items.length}</span>
            </div>
            {sec.items.map((it) => {
              const ch = !!checks[it.id]?.checked;
              return (
                <label key={it.id} className="flex cursor-pointer items-start gap-3.5 border-b border-zinc-50 px-5 py-3.5 last:border-b-0 hover:bg-zinc-50/50">
                  <input
                    type="checkbox"
                    checked={ch}
                    disabled={savingKey === it.id}
                    onChange={() => toggle(it.id)}
                    className="mt-0.5 h-[18px] w-[18px] cursor-pointer accent-emerald-600"
                  />
                  <div className="min-w-0 flex-1">
                    <p className={cx('text-sm', ch ? 'text-zinc-400 line-through' : 'text-offblack')}>{it.text}</p>
                    {it.note && <p className="mt-0.5 text-[13px] text-zinc-400">{it.note}</p>}
                  </div>
                  <span className={cx('shrink-0 rounded-full px-2.5 py-0.5 text-[11px] font-bold', ch ? 'bg-emerald-50 text-emerald-700' : 'bg-zinc-100 text-zinc-400')}>
                    {ch ? '완료' : '대기'}
                  </span>
                </label>
              );
            })}
          </div>
        );
      })}
    </div>
  );
}
