'use client';

import { useEffect, useMemo, useState } from 'react';
import { cx } from './salesShared';

// ── 날짜 유틸 ──────────────────────────────────────────────────────────────
const DAY_MS = 86400000;
function toIsoDate(d) {
  return d.toISOString().slice(0, 10);
}
function parseIso(s) {
  if (!s) return null;
  const d = new Date(s + 'T00:00:00');
  return Number.isFinite(d.getTime()) ? d : null;
}
function addDays(d, n) {
  return new Date(d.getTime() + n * DAY_MS);
}
function startOfMonth(d) {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}
function daysInMonth(d) {
  return new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
}
function diffDays(a, b) {
  return Math.floor((b - a) / DAY_MS);
}
function fmtMonth(d) {
  return `${d.getFullYear()}년 ${d.getMonth() + 1}월`;
}

// ── 작업 모달 ─────────────────────────────────────────────────────────────
function TaskModal({ open, task, prospects, categories, defaultProspectId, onClose, onSaved, onDeleted }) {
  const [pid, setPid] = useState('');
  const [title, setTitle] = useState('');
  const [catId, setCatId] = useState('');
  const [start, setStart] = useState('');
  const [end, setEnd] = useState('');
  const [memo, setMemo] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!open) return;
    if (task) {
      setPid(String(task.prospect_id || ''));
      setTitle(task.title || '');
      setCatId(task.category_id ? String(task.category_id) : '');
      setStart(task.start_date || '');
      setEnd(task.end_date || '');
      setMemo(task.memo || '');
    } else {
      setPid(defaultProspectId ? String(defaultProspectId) : (prospects[0]?.id ? String(prospects[0].id) : ''));
      setTitle('');
      setCatId('');
      const today = toIsoDate(new Date());
      setStart(today);
      setEnd(today);
      setMemo('');
    }
    setError('');
  }, [open, task, defaultProspectId, prospects]);

  if (!open) return null;

  async function submit() {
    if (!pid) { setError('거래처를 선택하세요.'); return; }
    if (!title.trim()) { setError('작업명을 입력하세요.'); return; }
    setSaving(true);
    setError('');
    try {
      const body = {
        prospect_id: Number(pid),
        title: title.trim(),
        category_id: catId ? Number(catId) : null,
        start_date: start,
        end_date: end,
        memo,
      };
      const url = task ? `/api/admin/sales/tasks/${task.id}` : '/api/admin/sales/tasks';
      const method = task ? 'PATCH' : 'POST';
      const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, credentials: 'same-origin', body: JSON.stringify(body) });
      const json = await res.json();
      if (!res.ok || json.error) throw new Error(json.error || '저장 실패');
      onSaved?.();
      onClose();
    } catch (e) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  }

  async function remove() {
    if (!task) return;
    if (!confirm(`작업 "${task.title}"을 삭제할까요?`)) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/sales/tasks/${task.id}`, { method: 'DELETE', credentials: 'same-origin' });
      const json = await res.json();
      if (!res.ok || json.error) throw new Error(json.error || '삭제 실패');
      onDeleted?.();
      onClose();
    } catch (e) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="border-b border-zinc-100 px-6 py-5">
          <h3 className="text-lg font-black text-offblack">{task ? '작업 편집' : '작업 추가'}</h3>
        </div>
        <div className="space-y-3 px-6 py-5">
          <label className="block">
            <span className="mb-1.5 block text-[13px] font-bold text-zinc-700">거래처 *</span>
            <select value={pid} onChange={(e) => setPid(e.target.value)} className="w-full rounded-xl border border-zinc-300 bg-white px-3.5 py-2.5 text-[13px] outline-none transition-colors focus:border-zinc-900 focus:ring-4 focus:ring-zinc-900/5">
              <option value="">— 거래처 선택 —</option>
              {prospects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </label>
          <label className="block">
            <span className="mb-1.5 block text-[13px] font-bold text-zinc-700">작업명 *</span>
            <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="예: 디자인 시안 전달" className="w-full rounded-xl border border-zinc-300 px-3.5 py-2.5 text-[13px] outline-none transition-colors focus:border-zinc-900 focus:ring-4 focus:ring-zinc-900/5" />
          </label>
          <div className="grid grid-cols-2 gap-3">
            <label className="block">
              <span className="mb-1.5 block text-[13px] font-bold text-zinc-700">시작일</span>
              <input type="date" value={start} onChange={(e) => setStart(e.target.value)} className="w-full rounded-xl border border-zinc-300 px-3.5 py-2.5 text-[13px] outline-none transition-colors focus:border-zinc-900 focus:ring-4 focus:ring-zinc-900/5" />
            </label>
            <label className="block">
              <span className="mb-1.5 block text-[13px] font-bold text-zinc-700">종료일</span>
              <input type="date" value={end} onChange={(e) => setEnd(e.target.value)} className="w-full rounded-xl border border-zinc-300 px-3.5 py-2.5 text-[13px] outline-none transition-colors focus:border-zinc-900 focus:ring-4 focus:ring-zinc-900/5" />
            </label>
          </div>
          <label className="block">
            <span className="mb-1.5 block text-[13px] font-bold text-zinc-700">카테고리</span>
            <select value={catId} onChange={(e) => setCatId(e.target.value)} className="w-full rounded-xl border border-zinc-300 bg-white px-3.5 py-2.5 text-[13px] outline-none transition-colors focus:border-zinc-900 focus:ring-4 focus:ring-zinc-900/5">
              <option value="">— 미지정 —</option>
              {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </label>
          <label className="block">
            <span className="mb-1.5 block text-[13px] font-bold text-zinc-700">메모</span>
            <input value={memo} onChange={(e) => setMemo(e.target.value)} placeholder="선택 사항" className="w-full rounded-xl border border-zinc-300 px-3.5 py-2.5 text-[13px] outline-none transition-colors focus:border-zinc-900 focus:ring-4 focus:ring-zinc-900/5" />
          </label>
          {error && <p className="rounded-xl bg-red-50 px-4 py-3 text-[13px] font-medium text-red-600">{error}</p>}
        </div>
        <div className="flex items-center justify-between gap-2 border-t border-zinc-100 px-6 py-4">
          <div>
            {task && (
              <button onClick={remove} disabled={saving} className="rounded-lg border border-red-200 bg-white px-3 py-2 text-xs font-bold text-red-600 hover:bg-red-50">삭제</button>
            )}
          </div>
          <div className="flex gap-2">
            <button onClick={onClose} className="rounded-xl border border-zinc-300 bg-white px-5 py-2.5 text-sm font-bold text-zinc-700 transition-colors hover:bg-zinc-50">취소</button>
            <button onClick={submit} disabled={saving} className="rounded-xl bg-accent px-5 py-2.5 text-sm font-bold text-white transition-colors hover:bg-accent-hover disabled:opacity-50">{saving ? '저장 중…' : '저장'}</button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── 카테고리 관리 모달 ────────────────────────────────────────────────────
function CategoriesModal({ open, categories, onClose, onChanged }) {
  const [newName, setNewName] = useState('');
  const [newColor, setNewColor] = useState('#1a6b4a');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  if (!open) return null;

  async function add() {
    if (!newName.trim()) return;
    setBusy(true); setError('');
    try {
      const res = await fetch('/api/admin/sales/categories', { method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'same-origin', body: JSON.stringify({ name: newName.trim(), color: newColor }) });
      const json = await res.json();
      if (!res.ok || json.error) throw new Error(json.error);
      setNewName('');
      onChanged?.();
    } catch (e) { setError(e.message); }
    finally { setBusy(false); }
  }
  async function patch(id, body) {
    setBusy(true); setError('');
    try {
      const res = await fetch(`/api/admin/sales/categories/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, credentials: 'same-origin', body: JSON.stringify(body) });
      const json = await res.json();
      if (!res.ok || json.error) throw new Error(json.error);
      onChanged?.();
    } catch (e) { setError(e.message); }
    finally { setBusy(false); }
  }
  async function remove(id, name) {
    if (!confirm(`카테고리 "${name}" 삭제? 이 카테고리의 작업들은 미지정 상태가 됩니다.`)) return;
    setBusy(true); setError('');
    try {
      const res = await fetch(`/api/admin/sales/categories/${id}`, { method: 'DELETE', credentials: 'same-origin' });
      const json = await res.json();
      if (!res.ok || json.error) throw new Error(json.error);
      onChanged?.();
    } catch (e) { setError(e.message); }
    finally { setBusy(false); }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div className="w-full max-w-lg rounded-2xl bg-white shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="border-b border-zinc-100 px-6 py-5">
          <h3 className="text-lg font-black text-offblack">스케줄 카테고리 관리</h3>
          <p className="mt-1 text-xs text-zinc-500">작업에 표시되는 색·이름을 직접 관리합니다. 삭제 시 작업들은 미지정 상태로 보존됩니다.</p>
        </div>
        <div className="space-y-3 px-6 py-5">
          {error && <p className="rounded-xl bg-red-50 px-4 py-3 text-[13px] font-medium text-red-600">{error}</p>}
          <div className="space-y-2">
            {categories.length === 0 ? (
              <p className="rounded-lg border border-dashed border-zinc-200 px-4 py-6 text-center text-xs text-zinc-400">등록된 카테고리가 없습니다.</p>
            ) : categories.map((c) => (
              <CategoryRow key={c.id} category={c} disabled={busy} onPatch={(b) => patch(c.id, b)} onDelete={() => remove(c.id, c.name)} />
            ))}
          </div>
          <div className="mt-2 rounded-xl border border-zinc-200 bg-zinc-50/60 p-3">
            <p className="mb-2 text-[11px] font-bold text-zinc-600">새 카테고리</p>
            <div className="flex gap-2">
              <input type="color" value={newColor} onChange={(e) => setNewColor(e.target.value)} className="h-9 w-9 cursor-pointer rounded-md border border-zinc-300" />
              <input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="카테고리명" className="flex-1 rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm focus:border-zinc-900 focus:outline-none" />
              <button onClick={add} disabled={busy || !newName.trim()} className="rounded-md bg-accent px-3 py-2 text-xs font-bold text-white hover:bg-accent-hover disabled:opacity-50">추가</button>
            </div>
          </div>
        </div>
        <div className="flex justify-end border-t border-zinc-100 px-6 py-4">
          <button onClick={onClose} className="rounded-xl border border-zinc-300 bg-white px-5 py-2.5 text-sm font-bold text-zinc-700 transition-colors hover:bg-zinc-50">닫기</button>
        </div>
      </div>
    </div>
  );
}

function CategoryRow({ category, disabled, onPatch, onDelete }) {
  const [name, setName] = useState(category.name);
  const [color, setColor] = useState(category.color || '#1a6b4a');
  const changed = name !== category.name || color !== (category.color || '#1a6b4a');
  return (
    <div className="flex items-center gap-2 rounded-md border border-zinc-200 bg-white p-2">
      <input type="color" value={color} onChange={(e) => setColor(e.target.value)} className="h-8 w-8 cursor-pointer rounded-md border border-zinc-300" />
      <input value={name} onChange={(e) => setName(e.target.value)} className="flex-1 rounded-md border border-zinc-300 px-2.5 py-1.5 text-sm focus:border-zinc-900 focus:outline-none" />
      {changed && (
        <button onClick={() => onPatch({ name: name.trim(), color })} disabled={disabled || !name.trim()} className="rounded-md bg-accent px-2.5 py-1.5 text-[11px] font-bold text-white hover:bg-accent-hover disabled:opacity-50">저장</button>
      )}
      <button onClick={onDelete} disabled={disabled} className="rounded-md border border-red-200 bg-white px-2.5 py-1.5 text-[11px] font-bold text-red-600 hover:bg-red-50">삭제</button>
    </div>
  );
}

// ── 간트 차트 ─────────────────────────────────────────────────────────────
function GanttView({ tasks, anchorDate, onTaskClick }) {
  // 1개월 단위로 표시
  const monthStart = startOfMonth(anchorDate);
  const totalDays = daysInMonth(anchorDate);
  const dayCols = Array.from({ length: totalDays }, (_, i) => i + 1);
  const cellW = 28;
  const rowH = 32;

  // 거래처별 그룹
  const grouped = useMemo(() => {
    const map = new Map();
    tasks.forEach((t) => {
      if (!map.has(t.prospect_id)) map.set(t.prospect_id, { name: t.prospect_name, items: [] });
      map.get(t.prospect_id).items.push(t);
    });
    return [...map.entries()];
  }, [tasks]);

  if (!tasks.length) {
    return <div className="rounded-2xl border border-dashed border-zinc-200 bg-white p-16 text-center text-sm leading-relaxed text-zinc-400">이 기간에 등록된 작업이 없습니다.<br />상단 우측 「+ 작업 추가」로 시작하세요.</div>;
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-zinc-200 bg-white">
      <table className="border-collapse text-[11px]" style={{ minWidth: 200 + totalDays * cellW }}>
        <thead>
          <tr className="border-b border-zinc-200 bg-zinc-50">
            <th className="sticky left-0 z-10 w-[200px] bg-zinc-50 px-3 py-2 text-left font-bold text-zinc-600">거래처 / 작업</th>
            {dayCols.map((d) => {
              const date = new Date(monthStart.getFullYear(), monthStart.getMonth(), d);
              const dow = date.getDay();
              return (
                <th key={d} style={{ width: cellW }} className={cx('border-l border-zinc-100 py-2 text-center font-bold', dow === 0 && 'text-red-500', dow === 6 && 'text-blue-500', dow !== 0 && dow !== 6 && 'text-zinc-500')}>
                  {d}
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody>
          {grouped.map(([pid, group]) => (
            <ProspectGroup key={pid} group={group} monthStart={monthStart} totalDays={totalDays} cellW={cellW} rowH={rowH} onTaskClick={onTaskClick} />
          ))}
        </tbody>
      </table>
    </div>
  );
}

function ProspectGroup({ group, monthStart, totalDays, cellW, rowH, onTaskClick }) {
  return (
    <>
      <tr className="border-b border-zinc-100 bg-zinc-50/40">
        <td className="sticky left-0 z-10 bg-zinc-50/40 px-3 py-1.5 text-[11px] font-black text-offblack">{group.name}</td>
        <td colSpan={totalDays} />
      </tr>
      {group.items.map((t) => {
        const s = parseIso(t.start_date) || monthStart;
        const e = parseIso(t.end_date) || s;
        const monthEnd = addDays(monthStart, totalDays - 1);
        const visibleStart = s < monthStart ? monthStart : s;
        const visibleEnd = e > monthEnd ? monthEnd : e;
        if (visibleEnd < monthStart || visibleStart > monthEnd) return null;
        const offsetDays = diffDays(monthStart, visibleStart);
        const spanDays = diffDays(visibleStart, visibleEnd) + 1;
        return (
          <tr key={t.id} className="border-b border-zinc-50 hover:bg-zinc-50/40">
            <td className="sticky left-0 z-10 bg-white px-3 py-1.5 text-[11px]">
              <button onClick={() => onTaskClick(t)} className="block w-full truncate text-left text-zinc-700 hover:text-blue-600 hover:underline" title={t.title}>{t.title}</button>
            </td>
            <td colSpan={totalDays} className="relative p-0" style={{ height: rowH }}>
              <button
                onClick={() => onTaskClick(t)}
                className="absolute top-1.5 flex h-[20px] items-center overflow-hidden rounded-md px-2 text-[10px] font-bold text-white shadow-sm hover:opacity-90"
                style={{
                  left: offsetDays * cellW + 2,
                  width: spanDays * cellW - 4,
                  background: t.category_color || '#52525b',
                }}
                title={`${t.title} (${t.start_date} ~ ${t.end_date})`}
              >
                <span className="truncate">{t.category_name ? `[${t.category_name}] ` : ''}{t.title}</span>
              </button>
            </td>
          </tr>
        );
      })}
    </>
  );
}

// ── 월간 캘린더 ───────────────────────────────────────────────────────────
function CalendarView({ tasks, anchorDate, onTaskClick, onDayClick }) {
  const monthStart = startOfMonth(anchorDate);
  const startWeekday = monthStart.getDay();
  const total = daysInMonth(anchorDate);
  const cells = [];
  // 앞쪽 빈칸
  for (let i = 0; i < startWeekday; i++) cells.push({ blank: true, key: `b${i}` });
  for (let d = 1; d <= total; d++) {
    const date = new Date(monthStart.getFullYear(), monthStart.getMonth(), d);
    const iso = toIsoDate(date);
    const dayTasks = tasks.filter((t) => {
      const ts = parseIso(t.start_date);
      const te = parseIso(t.end_date) || ts;
      if (!ts) return false;
      return date >= ts && date <= te;
    });
    cells.push({ d, iso, dow: date.getDay(), tasks: dayTasks, key: `d${d}` });
  }
  // 뒤쪽 빈칸 (7의 배수까지)
  while (cells.length % 7 !== 0) cells.push({ blank: true, key: `t${cells.length}` });

  return (
    <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white">
      <div className="grid grid-cols-7 border-b border-zinc-200 bg-zinc-50 text-center text-[11px] font-bold">
        {['일','월','화','수','목','금','토'].map((w, i) => (
          <div key={w} className={cx('px-2 py-2', i === 0 && 'text-red-500', i === 6 && 'text-blue-500', i !== 0 && i !== 6 && 'text-zinc-500')}>{w}</div>
        ))}
      </div>
      <div className="grid grid-cols-7">
        {cells.map((c) => c.blank ? (
          <div key={c.key} className="min-h-[100px] border-b border-r border-zinc-100 bg-zinc-50/30" />
        ) : (
          <div
            key={c.key}
            onClick={() => onDayClick?.(c.iso)}
            className="min-h-[100px] cursor-pointer border-b border-r border-zinc-100 bg-white p-1.5 transition-colors hover:bg-zinc-50/60"
          >
            <div className={cx('mb-1 text-[11px] font-bold', c.dow === 0 && 'text-red-500', c.dow === 6 && 'text-blue-500', c.dow !== 0 && c.dow !== 6 && 'text-zinc-700')}>{c.d}</div>
            <div className="space-y-0.5">
              {c.tasks.slice(0, 3).map((t) => (
                <button
                  key={t.id}
                  onClick={(e) => { e.stopPropagation(); onTaskClick(t); }}
                  className="block w-full truncate rounded px-1.5 py-0.5 text-left text-[10px] font-bold text-white hover:opacity-90"
                  style={{ background: t.category_color || '#52525b' }}
                  title={`${t.prospect_name} · ${t.title}`}
                >
                  {t.title}
                </button>
              ))}
              {c.tasks.length > 3 && <div className="text-[9px] text-zinc-400">+{c.tasks.length - 3}건</div>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── ScheduleModule ────────────────────────────────────────────────────────
export default function ScheduleModule({ prospects }) {
  const [view, setView] = useState('gantt'); // 'gantt' | 'calendar'
  const [anchorDate, setAnchorDate] = useState(() => new Date());
  const [tasks, setTasks] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editTask, setEditTask] = useState(null);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [showCategoriesModal, setShowCategoriesModal] = useState(false);
  const [defaultProspectId, setDefaultProspectId] = useState(null);

  async function loadAll() {
    setLoading(true);
    setError('');
    try {
      const monthStart = startOfMonth(anchorDate);
      const monthEnd = new Date(monthStart.getFullYear(), monthStart.getMonth() + 1, 0);
      const [tRes, cRes] = await Promise.all([
        fetch(`/api/admin/sales/tasks?from=${toIsoDate(monthStart)}&to=${toIsoDate(monthEnd)}`, { credentials: 'same-origin' }),
        fetch('/api/admin/sales/categories', { credentials: 'same-origin' }),
      ]);
      const tJson = await tRes.json();
      const cJson = await cRes.json();
      if (!tRes.ok) throw new Error(tJson.error || '작업 조회 실패');
      if (!cRes.ok) throw new Error(cJson.error || '카테고리 조회 실패');
      setTasks(Array.isArray(tJson) ? tJson : []);
      setCategories(Array.isArray(cJson) ? cJson : []);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => { loadAll(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [anchorDate]);

  function nav(delta) {
    const next = new Date(anchorDate.getFullYear(), anchorDate.getMonth() + delta, 1);
    setAnchorDate(next);
  }

  function openAddTask(prospectId = null) {
    setEditTask(null);
    setDefaultProspectId(prospectId);
    setShowTaskModal(true);
  }
  function openEditTask(t) {
    setEditTask(t);
    setShowTaskModal(true);
  }

  return (
    <div className="flex h-full flex-col">
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-zinc-100 bg-white px-8 py-5">
        <div className="flex items-center gap-4">
          <h1 className="text-lg font-black tracking-tight text-offblack">스케줄</h1>
          <div className="flex items-center gap-1.5">
            <button onClick={() => nav(-1)} className="rounded-lg border border-zinc-300 bg-white px-2.5 py-2 text-sm font-bold text-zinc-700 transition-colors hover:bg-zinc-50">‹</button>
            <span className="px-3 text-base font-bold text-offblack">{fmtMonth(anchorDate)}</span>
            <button onClick={() => nav(1)} className="rounded-lg border border-zinc-300 bg-white px-2.5 py-2 text-sm font-bold text-zinc-700 transition-colors hover:bg-zinc-50">›</button>
            <button onClick={() => setAnchorDate(new Date())} className="ml-1 rounded-lg border border-zinc-300 bg-white px-3 py-2 text-[13px] font-bold text-zinc-700 transition-colors hover:bg-zinc-50">오늘</button>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="inline-flex overflow-hidden rounded-xl border border-zinc-300">
            {[['gantt','간트차트'], ['calendar','월간 캘린더']].map(([id, label]) => (
              <button key={id} onClick={() => setView(id)} className={cx('px-3.5 py-2 text-[13px] font-bold transition-colors', view === id ? 'bg-accent text-white' : 'bg-white text-zinc-700 hover:bg-zinc-50')}>{label}</button>
            ))}
          </div>
          <button onClick={() => setShowCategoriesModal(true)} className="rounded-xl border border-zinc-300 bg-white px-3.5 py-2 text-[13px] font-bold text-zinc-700 transition-colors hover:bg-zinc-50">카테고리</button>
          <button onClick={() => openAddTask()} className="rounded-xl bg-accent px-3.5 py-2 text-[13px] font-bold text-white transition-colors hover:bg-accent-hover">+ 작업 추가</button>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto bg-zinc-50/50 p-8">
        {error && <div className="mb-3 rounded-xl bg-red-50 px-4 py-3 text-[13px] font-medium text-red-700">{error}</div>}
        {loading ? (
          <div className="rounded-2xl border border-dashed border-zinc-200 bg-white p-16 text-center text-sm text-zinc-400">불러오는 중…</div>
        ) : view === 'gantt' ? (
          <GanttView tasks={tasks} anchorDate={anchorDate} onTaskClick={openEditTask} />
        ) : (
          <CalendarView tasks={tasks} anchorDate={anchorDate} onTaskClick={openEditTask} onDayClick={(iso) => { setEditTask(null); setDefaultProspectId(null); setShowTaskModal(true); setTimeout(() => { /* iso 활용 위해 defaultDate가 모달에 없음 — 추후 확장 */ }, 0); }} />
        )}

        {categories.length > 0 && (
          <div className="mt-5 flex flex-wrap items-center gap-2 text-[13px]">
            <span className="font-bold text-zinc-500">카테고리:</span>
            {categories.map((c) => (
              <span key={c.id} className="inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1 ring-1 ring-zinc-200">
                <span className="inline-block h-2.5 w-2.5 rounded-full" style={{ background: c.color }} />
                {c.name}
              </span>
            ))}
          </div>
        )}
      </div>

      <TaskModal
        open={showTaskModal}
        task={editTask}
        prospects={prospects || []}
        categories={categories}
        defaultProspectId={defaultProspectId}
        onClose={() => setShowTaskModal(false)}
        onSaved={loadAll}
        onDeleted={loadAll}
      />
      <CategoriesModal
        open={showCategoriesModal}
        categories={categories}
        onClose={() => setShowCategoriesModal(false)}
        onChanged={loadAll}
      />
    </div>
  );
}
