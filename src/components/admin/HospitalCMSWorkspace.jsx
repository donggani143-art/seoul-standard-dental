'use client';

import { useState, useCallback, useEffect } from 'react';
import AdminShell from '@/components/admin/AdminShell';
import BoardContentEditor from '@/components/admin/BoardContentEditor';
import PageDesignEditor from '@/components/admin/PageDesignEditor';

// ── 공통 헬퍼 ────────────────────────────────────────────────────────────────

function cx(...cls) { return cls.filter(Boolean).join(' '); }

function formatDate(v) {
  if (!v) return '-';
  return new Date(v).toLocaleString('ko-KR', { dateStyle: 'short', timeStyle: 'short' });
}

function slugify(v) {
  return String(v || '').trim().toLowerCase().replace(/[^a-z0-9-]+/g, '-').replace(/^-+|-+$/g, '').replace(/-{2,}/g, '-');
}

// ── 공통 UI 컴포넌트 ──────────────────────────────────────────────────────────

function PageHeader({ title, subtitle, action }) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-4 border-b border-zinc-200 bg-white px-6 py-5">
      <div>
        <h1 className="text-xl font-black tracking-tight text-offblack">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-zinc-500">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

function Card({ children, className = '' }) {
  return (
    <div className={cx('rounded-2xl border border-zinc-200 bg-white shadow-sm', className)}>
      {children}
    </div>
  );
}

function Btn({ children, onClick, variant = 'primary', size = 'md', disabled = false, type = 'button', className = '' }) {
  const base = 'inline-flex items-center justify-center font-bold rounded-xl transition-colors disabled:opacity-50';
  const sizes = { sm: 'px-3 py-1.5 text-xs', md: 'px-4 py-2.5 text-sm', lg: 'px-6 py-3 text-sm' };
  const variants = {
    primary: 'bg-accent text-white hover:bg-zinc-700',
    secondary: 'bg-zinc-100 text-offblack hover:bg-zinc-200',
    danger: 'bg-red-50 text-red-600 hover:bg-red-100',
    ghost: 'text-zinc-500 hover:text-offblack hover:bg-zinc-100',
    dark: 'bg-accent text-white hover:bg-accent-hover',
  };
  return (
    <button type={type} onClick={onClick} disabled={disabled} className={cx(base, sizes[size], variants[variant], className)}>
      {children}
    </button>
  );
}

function Notice({ tone, message }) {
  if (!message) return null;
  const cls = {
    success: 'bg-emerald-50 border-emerald-200 text-emerald-700',
    error: 'bg-red-50 border-red-200 text-red-600',
    info: 'bg-sky-50 border-sky-200 text-sky-700',
    idle: 'bg-zinc-50 border-zinc-200 text-zinc-500',
  }[tone] || 'bg-zinc-50 border-zinc-200 text-zinc-500';
  return <div className={cx('rounded-xl border px-4 py-3 text-sm font-semibold', cls)}>{message}</div>;
}

function Field({ label, children, hint, className = '' }) {
  return (
    <label className={cx('flex flex-col gap-1.5 text-sm font-bold text-offblack', className)}>
      <span>{label}</span>
      {children}
      {hint && <span className="text-xs font-normal text-zinc-400">{hint}</span>}
    </label>
  );
}

function Input({ value, onChange, type = 'text', placeholder = '', disabled = false, className = '' }) {
  return (
    <input
      type={type}
      value={value ?? ''}
      onChange={onChange}
      placeholder={placeholder}
      disabled={disabled}
      autoComplete="off"
      autoCorrect="off"
      spellCheck="false"
      data-lpignore="true"
      data-form-type="other"
      className={cx(
        'rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-2.5 text-sm font-medium text-offblack outline-none transition-colors',
        'focus:border-zinc-900 focus:bg-white disabled:cursor-not-allowed disabled:bg-zinc-100',
        className
      )}
    />
  );
}

function Textarea({ value, onChange, rows = 4, placeholder = '', disabled = false }) {
  return (
    <textarea
      value={value ?? ''}
      onChange={onChange}
      rows={rows}
      placeholder={placeholder}
      disabled={disabled}
      className="rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-2.5 text-sm font-medium text-offblack outline-none transition-colors focus:border-zinc-900 focus:bg-white resize-vertical disabled:bg-zinc-100"
    />
  );
}

function Select({ value, onChange, children, disabled = false }) {
  return (
    <select
      value={value ?? ''}
      onChange={onChange}
      disabled={disabled}
      className="rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-2.5 text-sm font-medium text-offblack outline-none transition-colors focus:border-zinc-900 focus:bg-white"
    >
      {children}
    </select>
  );
}

function Toggle({ checked, onChange, label }) {
  return (
    <label className="flex cursor-pointer items-center gap-3">
      <div
        onClick={() => onChange(!checked)}
        className={cx(
          'relative h-6 w-11 rounded-full transition-colors',
          checked ? 'bg-accent' : 'bg-zinc-200'
        )}
      >
        <span
          className={cx(
            'absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform',
            checked ? 'translate-x-5' : 'translate-x-0'
          )}
        />
      </div>
      {label && <span className="text-sm font-semibold text-zinc-600">{label}</span>}
    </label>
  );
}

function StatCard({ label, value, sub }) {
  return (
    <Card className="px-6 py-5">
      <p className="text-xs font-bold uppercase tracking-widest text-zinc-400">{label}</p>
      <p className="mt-2 text-4xl font-black tracking-tight text-offblack">{value}</p>
      {sub && <p className="mt-1 text-xs text-zinc-400">{sub}</p>}
    </Card>
  );
}

// ── 대시보드 모듈 ────────────────────────────────────────────────────────────

function DashboardModule({ data, hospital, onNav }) {
  const { consultCount = 0, boardCount = 0, popupCount = 0, recentConsults = [] } = data || {};

  return (
    <div className="space-y-6 p-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard label="총 상담 문의" value={consultCount} sub="누적" />
        <StatCard label="게시글" value={boardCount} sub="공지 · 이벤트 포함" />
        <StatCard label="활성 팝업" value={popupCount} sub="등록된 팝업" />
      </div>

      <Card>
        <div className="border-b border-zinc-100 px-6 py-4">
          <h2 className="text-sm font-black text-offblack">최근 상담 접수</h2>
        </div>
        {recentConsults.length === 0 ? (
          <p className="px-6 py-8 text-center text-sm text-zinc-400">아직 접수된 상담이 없습니다.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-zinc-100 bg-zinc-50/60">
                <tr>
                  {['접수일시','분류','이름','연락처'].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-zinc-400">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {recentConsults.map((r) => (
                  <tr key={r.id} className="border-b border-zinc-50 hover:bg-zinc-50/60">
                    <td className="px-4 py-3 text-zinc-500">{formatDate(r.created_at)}</td>
                    <td className="px-4 py-3"><span className="rounded-full bg-zinc-100 px-2 py-0.5 text-xs font-bold text-zinc-900">{r.category || '기타'}</span></td>
                    <td className="px-4 py-3 font-semibold text-offblack">{r.name}</td>
                    <td className="px-4 py-3 text-zinc-600">{r.phone}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <Card className="p-6">
        <h2 className="mb-4 text-sm font-black text-offblack">빠른 이동</h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {[
            { id: 'boards', label: '게시판 관리' },
            { id: 'popups', label: '팝업 관리' },
            { id: 'consult', label: '상담 확인' },
            { id: 'seo', label: 'SEO 설정' },
            { id: 'pages', label: '페이지 관리' },
            { id: 'domains', label: '도메인 관리' },
          ].map((m) => (
            <button
              key={m.id}
              onClick={() => onNav(m.id)}
              className="rounded-xl border border-zinc-200 px-4 py-3 text-sm font-bold text-offblack transition-colors hover:border-zinc-900 hover:text-zinc-900"
            >
              {m.label}
            </button>
          ))}
        </div>
      </Card>
    </div>
  );
}

// ── 상담 문의 모듈 ──────────────────────────────────────────────────────────

function ConsultModule({ data }) {
  const [items, setItems] = useState(data?.consultations || []);
  const [loading, setLoading] = useState(false);

  async function refresh() {
    setLoading(true);
    try {
      const res = await fetch('/api/consult', { credentials: 'same-origin' });
      if (res.ok) setItems(await res.json());
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id) {
    if (!confirm('이 상담 문의를 삭제하시겠습니까?')) return;
    const res = await fetch(`/api/consult?id=${id}`, { method: 'DELETE', credentials: 'same-origin' });
    if (res.ok) setItems(prev => prev.filter(r => r.id !== id));
  }

  return (
    <div className="space-y-4 p-6">
      <div className="flex items-center justify-between">
        <p className="text-sm text-zinc-500">총 {items.length}건</p>
        <Btn onClick={refresh} variant="secondary" size="sm" disabled={loading}>
          {loading ? '불러오는 중…' : '새로고침'}
        </Btn>
      </div>
      <Card>
        {items.length === 0 ? (
          <p className="py-12 text-center text-sm text-zinc-400">접수된 상담 문의가 없습니다.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-sm">
              <thead className="border-b border-zinc-100 bg-zinc-50/60">
                <tr>
                  {['접수일시','분류','이름','연락처','이메일','동의',''].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-zinc-400">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {items.map((r) => (
                  <tr key={r.id} className="border-b border-zinc-50 hover:bg-zinc-50/60">
                    <td className="px-4 py-3 text-zinc-500 whitespace-nowrap">{formatDate(r.created_at)}</td>
                    <td className="px-4 py-3"><span className="rounded-full bg-zinc-100 px-2 py-0.5 text-xs font-bold text-zinc-900">{r.category || '기타'}</span></td>
                    <td className="px-4 py-3 font-semibold text-offblack">{r.name}</td>
                    <td className="px-4 py-3">{r.phone}</td>
                    <td className="px-4 py-3 text-zinc-500">{r.email || '-'}</td>
                    <td className="px-4 py-3">
                      <span className={cx('rounded-full px-2 py-0.5 text-xs font-bold', r.agreed ? 'bg-emerald-50 text-emerald-600' : 'bg-zinc-100 text-zinc-400')}>
                        {r.agreed ? '동의' : '미동의'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <button onClick={() => handleDelete(r.id)} className="rounded-md px-2 py-1 text-xs text-red-500 hover:bg-red-50">삭제</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}

// ── 게시판 모듈 ─────────────────────────────────────────────────────────────

// 기본 제공 게시판(공지·이벤트). 그 외는 업체가 직접 추가한 커스텀 게시판(board_groups).
const BUILTIN_BOARDS = [
  { key: 'notice', label: '공지사항', type: 'notice', groupId: null },
  { key: 'event', label: '이벤트', type: 'event', groupId: null },
];
const EMPTY_BOARD = { type: 'notice', board_group_id: '', title: '', content: '', is_published: true, start_date: '', end_date: '' };
const EMPTY_GROUP = { name: '', slug: '', description: '', is_active: true, members_only: false, sort_order: 0 };

// 이름에서 URL 주소 자동 생성. 한글 등으로 영문 슬러그가 비면 board-xxxx 로 대체.
function autoBoardSlug(name) {
  const s = slugify(name);
  return s || `board-${Date.now().toString(36)}`;
}

function PencilIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 20h9" /><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z" />
    </svg>
  );
}
function TrashIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 6h18" /><path d="M8 6V4h8v2m-9 0v14a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1V6" />
    </svg>
  );
}

// 사이드 게시판 항목
function BoardRailItem({ active, onClick, label, count, badge, onEdit, onDelete }) {
  return (
    <div className={cx('group flex items-center gap-1 rounded-xl px-3 py-2 transition-colors', active ? 'bg-accent/10' : 'hover:bg-zinc-50')}>
      <button type="button" onClick={onClick} className="flex min-w-0 flex-1 items-center gap-2 text-left">
        <span className={cx('truncate text-sm font-bold', active ? 'text-accent' : 'text-offblack')}>{label}</span>
        {badge ? <span className="shrink-0 rounded-full bg-zinc-100 px-1.5 py-0.5 text-[10px] font-bold text-zinc-500">{badge}</span> : null}
      </button>
      <span className="shrink-0 text-xs font-bold text-zinc-400">{count}</span>
      {(onEdit || onDelete) ? (
        <span className="ml-1 hidden shrink-0 items-center gap-1.5 group-hover:flex">
          {onEdit ? <button type="button" onClick={onEdit} title="게시판 수정" className="text-zinc-400 hover:text-offblack"><PencilIcon /></button> : null}
          {onDelete ? <button type="button" onClick={onDelete} title="게시판 삭제" className="text-zinc-400 hover:text-red-500"><TrashIcon /></button> : null}
        </span>
      ) : null}
    </div>
  );
}

function parseGradeList(v) {
  if (Array.isArray(v)) return v;
  try { const a = JSON.parse(v || '[]'); return Array.isArray(a) ? a : []; } catch { return []; }
}

// 게시판 추가·수정 모달 — 이름만 필수, URL·회원전용·등급제한 등은 고급 설정.
function BoardGroupModal({ initial, onClose, onSaved, onError }) {
  const [g, setG] = useState(() => ({ ...initial, blocked_grades: parseGradeList(initial.blocked_grades) }));
  const [slugTouched, setSlugTouched] = useState(Boolean(initial.id));
  const [adv, setAdv] = useState(false);
  const [busy, setBusy] = useState(false);
  const [grades, setGrades] = useState([]);
  const isNew = !initial.id;
  const previewSlug = g.slug || autoBoardSlug(g.name) || 'board';

  useEffect(() => {
    (async () => {
      const r = await fetch('/api/admin/member-grades', { credentials: 'same-origin' });
      if (r.ok) { const b = await r.json(); setGrades(b.grades || []); }
    })();
  }, []);

  function toggleBlocked(name) {
    setG((p) => {
      const cur = p.blocked_grades || [];
      return { ...p, blocked_grades: cur.includes(name) ? cur.filter((x) => x !== name) : [...cur, name] };
    });
  }

  async function save() {
    if (!g.name.trim()) { onError('게시판 이름을 입력해 주세요.'); return; }
    setBusy(true);
    try {
      const res = await fetch('/api/board-group', {
        method: isNew ? 'POST' : 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({ ...g, slug: g.slug || autoBoardSlug(g.name) }),
      });
      const json = await res.json();
      if (!res.ok || json.error) throw new Error(json.error || '저장에 실패했습니다.');
      onSaved();
    } catch (e) {
      onError(e.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
        <h3 className="text-base font-black text-offblack">{isNew ? '새 게시판 만들기' : '게시판 수정'}</h3>
        <p className="mt-1 text-xs text-zinc-400">공지사항·이벤트 외에 후기·칼럼 등 원하는 게시판을 직접 만들 수 있어요.</p>
        <div className="mt-5 space-y-4">
          <Field label="게시판 이름">
            <Input
              value={g.name}
              onChange={(e) => { const name = e.target.value; setG((p) => ({ ...p, name, slug: slugTouched ? p.slug : autoBoardSlug(name) })); }}
              placeholder="예: 치료후기, 의료진 칼럼"
            />
          </Field>
          <button type="button" onClick={() => setAdv((v) => !v)} className="text-xs font-bold text-zinc-400 hover:text-offblack">
            {adv ? '▾ 고급 설정 숨기기' : '▸ 고급 설정 (URL 주소 · 회원 전용 · 노출)'}
          </button>
          {adv ? (
            <div className="space-y-4 rounded-xl bg-zinc-50 p-4">
              <Field label="URL 주소" hint={`사이트 주소: /community/${previewSlug}`}>
                <Input value={g.slug} onChange={(e) => { setSlugTouched(true); setG((p) => ({ ...p, slug: slugify(e.target.value) })); }} placeholder="자동 생성됩니다" />
              </Field>
              <Field label="설명 (선택)">
                <Input value={g.description} onChange={(e) => setG((p) => ({ ...p, description: e.target.value }))} placeholder="게시판 소개" />
              </Field>
              <div className="flex flex-wrap items-center gap-5">
                <Toggle checked={g.is_active} onChange={(v) => setG((p) => ({ ...p, is_active: v }))} label={g.is_active ? '사이트 노출' : '숨김'} />
                <Toggle checked={!!g.members_only} onChange={(v) => setG((p) => ({ ...p, members_only: v }))} label={g.members_only ? '회원 전용' : '전체 공개'} />
              </div>
              <p className="text-xs text-zinc-500"><b>회원 전용</b>을 켜면 비로그인 방문자에게는 목록·상세가 보이지 않습니다.</p>
              {grades.length > 0 && (
                <div>
                  <p className="mb-1.5 text-xs font-bold text-zinc-600">등급별 열람 제한 <span className="font-normal text-zinc-400">· 선택한 등급은 이 게시판을 못 봐요 (다중 선택)</span></p>
                  <div className="flex flex-wrap gap-1.5">
                    {grades.map((gr) => {
                      const on = (g.blocked_grades || []).includes(gr.name);
                      return (
                        <button
                          type="button"
                          key={gr.id}
                          onClick={() => toggleBlocked(gr.name)}
                          className={cx('rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors', on ? 'border-red-300 bg-red-50 text-red-600' : 'border-zinc-200 bg-white text-zinc-500 hover:border-zinc-300')}
                        >
                          {on ? '🚫 ' : ''}{gr.name}
                        </button>
                      );
                    })}
                  </div>
                  {(g.blocked_grades || []).length > 0 && (
                    <p className="mt-1.5 text-xs text-red-500">차단: {(g.blocked_grades || []).join(', ')} 등급은 이 게시판을 열람할 수 없습니다.</p>
                  )}
                </div>
              )}
            </div>
          ) : null}
        </div>
        <div className="mt-6 flex justify-end gap-2">
          <Btn onClick={onClose} variant="secondary" size="sm">취소</Btn>
          <Btn onClick={save} size="sm" disabled={busy}>{busy ? '저장 중…' : isNew ? '만들기' : '저장'}</Btn>
        </div>
      </div>
    </div>
  );
}

function parseAttachments(v) {
  if (Array.isArray(v)) return v;
  try { const a = JSON.parse(v || '[]'); return Array.isArray(a) ? a : []; } catch { return []; }
}

function fmtFileSize(n) {
  n = Number(n || 0);
  if (!n) return '';
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(0)} KB`;
  return `${(n / 1024 / 1024).toFixed(1)} MB`;
}

// 게시글 첨부파일 (hwp · pdf · 이미지, 10MB 미만)
function BoardAttachmentsField({ value, onChange }) {
  const atts = parseAttachments(value);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');

  async function onPick(e) {
    const files = Array.from(e.target.files || []);
    e.target.value = '';
    if (!files.length) return;
    setBusy(true); setErr('');
    try {
      const next = [...atts];
      for (const file of files) {
        const fd = new FormData();
        fd.append('file', file);
        const res = await fetch('/api/board-file', { method: 'POST', body: fd, credentials: 'same-origin' });
        const d = await res.json();
        if (!res.ok || !d.success) throw new Error(d.error || '업로드 실패');
        next.push({ name: d.name, url: d.url, size: d.size, type: d.type });
      }
      onChange(next);
    } catch (e2) {
      setErr(e2.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <label className={cx('cursor-pointer rounded-lg border border-zinc-300 bg-white px-3 py-1.5 text-xs font-semibold text-zinc-700 hover:bg-zinc-50', busy && 'opacity-60')}>
          {busy ? '업로드 중…' : '+ 파일 첨부'}
          <input type="file" multiple accept=".hwp,.hwpx,.pdf,image/*" className="hidden" onChange={onPick} disabled={busy} />
        </label>
        <span className="text-xs text-zinc-400">hwp · pdf · 이미지 / 10MB 미만</span>
      </div>
      {err && <p className="text-xs text-red-500">{err}</p>}
      {atts.length > 0 && (
        <ul className="space-y-1.5">
          {atts.map((a, i) => (
            <li key={i} className="flex items-center gap-2 rounded-lg border border-zinc-100 bg-zinc-50 px-3 py-2 text-sm">
              <span className="flex-1 truncate text-zinc-700">{a.name}</span>
              <span className="shrink-0 text-xs text-zinc-400">{fmtFileSize(a.size)}</span>
              <button type="button" onClick={() => onChange(atts.filter((_, idx) => idx !== i))} className="shrink-0 text-xs text-red-500 hover:underline">삭제</button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function BoardsModule({ data }) {
  const [boards, setBoards] = useState(data?.boards || []);
  const [groups, setGroups] = useState(data?.boardGroups || []);
  const [view, setView] = useState('list'); // 'list' | 'edit'
  const [editing, setEditing] = useState(null);
  const [selected, setSelected] = useState('all'); // 'all' | board key
  const [groupModal, setGroupModal] = useState(null); // null | group payload
  const [notice, setNotice] = useState({ tone: 'idle', message: '' });
  const [saving, setSaving] = useState(false);

  // 기본 게시판 + 커스텀 게시판을 하나의 목록으로 통합
  const boardOptions = [
    ...BUILTIN_BOARDS,
    ...groups.map(g => ({ key: `g${g.id}`, label: g.name, type: 'board', groupId: g.id, custom: true, group: g })),
  ];
  const boardKeyOf = b => (b.type === 'board' ? `g${b.board_group_id}` : b.type);
  const labelOfKey = key => boardOptions.find(o => o.key === key)?.label || key;
  const countOf = key => boards.filter(b => boardKeyOf(b) === key).length;
  const filtered = selected === 'all' ? boards : boards.filter(b => boardKeyOf(b) === selected);

  async function refreshBoards() {
    const r = await fetch('/api/board?type=all&includeDrafts=1', { credentials: 'same-origin' });
    if (r.ok) setBoards(await r.json());
  }
  async function refreshGroups() {
    const r = await fetch('/api/board-group?includeInactive=1', { credentials: 'same-origin' });
    if (r.ok) setGroups(await r.json());
  }

  async function saveBoard() {
    setSaving(true);
    try {
      const res = await fetch('/api/board', {
        method: editing.id ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify(editing),
      });
      const json = await res.json();
      if (!res.ok || json.error) throw new Error(json.error || '저장 실패');
      setNotice({ tone: 'success', message: '저장되었습니다.' });
      await refreshBoards();
      setView('list');
    } catch (e) {
      setNotice({ tone: 'error', message: e.message });
    } finally {
      setSaving(false);
    }
  }

  async function deleteBoard(id) {
    if (!confirm('이 게시글을 삭제하시겠습니까?')) return;
    const res = await fetch(`/api/board?id=${id}`, { method: 'DELETE', credentials: 'same-origin' });
    if (res.ok) setBoards(prev => prev.filter(b => b.id !== id));
  }

  async function deleteGroup(g) {
    if (!confirm(`'${g.name}' 게시판을 삭제하시겠습니까?\n이 게시판의 글은 삭제되지 않고 ‘미분류’로 남습니다.`)) return;
    await fetch(`/api/board-group?id=${g.id}`, { method: 'DELETE', credentials: 'same-origin' });
    await Promise.all([refreshGroups(), refreshBoards()]);
    if (selected === `g${g.id}`) setSelected('all');
    setNotice({ tone: 'success', message: '게시판이 삭제되었습니다.' });
  }

  function startNewPost() {
    const opt = selected !== 'all' ? boardOptions.find(o => o.key === selected) : null;
    setEditing(opt ? { ...EMPTY_BOARD, type: opt.type, board_group_id: opt.groupId ?? '' } : { ...EMPTY_BOARD });
    setNotice({ tone: 'idle', message: '' });
    setView('edit');
  }

  // ── 글 작성/수정 화면 ──
  if (view === 'edit' && editing) {
    return (
      <div className="space-y-4 p-6">
        <div className="flex items-center gap-4">
          <Btn onClick={() => { setView('list'); setEditing(null); setNotice({ tone: 'idle', message: '' }); }} variant="ghost" size="sm">← 목록으로</Btn>
          <h2 className="text-sm font-black text-offblack">{editing.id ? '글 수정' : '새 글 작성'}</h2>
        </div>
        <Notice {...notice} />
        <Card className="p-6 space-y-5">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="게시판" hint="이 글이 올라갈 게시판을 선택하세요.">
              <Select
                value={boardKeyOf(editing)}
                onChange={e => {
                  const opt = boardOptions.find(o => o.key === e.target.value);
                  if (opt) setEditing(p => ({ ...p, type: opt.type, board_group_id: opt.groupId ?? '' }));
                }}
              >
                {boardOptions.map(o => <option key={o.key} value={o.key}>{o.label}</option>)}
              </Select>
            </Field>
            <Field label="공개 설정">
              <div className="flex h-[46px] items-center">
                <Toggle checked={editing.is_published} onChange={v => setEditing(p => ({ ...p, is_published: v }))} label={editing.is_published ? '공개' : '비공개'} />
              </div>
            </Field>
          </div>
          <Field label="제목">
            <Input value={editing.title} onChange={e => setEditing(p => ({ ...p, title: e.target.value }))} placeholder="게시글 제목" />
          </Field>
          <Field label="내용">
            <BoardContentEditor
              value={editing.content}
              onChange={v => setEditing(p => ({ ...p, content: v }))}
              onImageUpload={async (file) => {
                const fd = new FormData();
                fd.append('file', file);
                const res = await fetch('/api/board-image', { method: 'POST', body: fd, credentials: 'same-origin' });
                const data = await res.json();
                if (!res.ok || !data.success) throw new Error(data.error || '업로드 실패');
                return data;
              }}
            />
          </Field>
          <Field label="첨부파일" hint="hwp · pdf · 이미지 파일 (10MB 미만). 본문 아래 다운로드 목록으로 표시됩니다.">
            <BoardAttachmentsField value={editing.attachments} onChange={v => setEditing(p => ({ ...p, attachments: v }))} />
          </Field>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="게시 시작일" hint="비워두면 즉시 게시됩니다.">
              <Input type="date" value={editing.start_date} onChange={e => setEditing(p => ({ ...p, start_date: e.target.value }))} />
            </Field>
            <Field label="게시 종료일" hint="비워두면 무기한 게시됩니다.">
              <Input type="date" value={editing.end_date} onChange={e => setEditing(p => ({ ...p, end_date: e.target.value }))} />
            </Field>
          </div>
          <div className="flex justify-end gap-3">
            <Btn onClick={() => { setView('list'); setEditing(null); }} variant="secondary">취소</Btn>
            <Btn onClick={saveBoard} disabled={saving}>{saving ? '저장 중…' : '저장'}</Btn>
          </div>
        </Card>
      </div>
    );
  }

  // ── 목록 화면: 게시판 사이드 + 글 목록 ──
  return (
    <div className="p-6">
      <Notice {...notice} />
      <div className={cx('grid gap-5 md:grid-cols-[248px_1fr]', notice.message && 'mt-4')}>
        {/* 게시판 사이드 */}
        <Card className="h-max p-3">
          <p className="px-2 pb-1 pt-1 text-[11px] font-black uppercase tracking-wider text-zinc-400">게시판</p>
          <div className="space-y-0.5">
            <BoardRailItem active={selected === 'all'} onClick={() => setSelected('all')} label="전체 글" count={boards.length} />
            {BUILTIN_BOARDS.map(o => (
              <BoardRailItem key={o.key} active={selected === o.key} onClick={() => setSelected(o.key)} label={o.label} count={countOf(o.key)} badge="기본" />
            ))}
            {groups.map(g => {
              const key = `g${g.id}`;
              return (
                <BoardRailItem
                  key={key}
                  active={selected === key}
                  onClick={() => setSelected(key)}
                  label={g.name}
                  count={countOf(key)}
                  badge={g.members_only ? '회원' : (g.is_active ? null : '숨김')}
                  onEdit={() => setGroupModal({ ...g })}
                  onDelete={() => deleteGroup(g)}
                />
              );
            })}
          </div>
          <button
            type="button"
            onClick={() => setGroupModal({ ...EMPTY_GROUP })}
            className="mt-2 w-full rounded-xl border border-dashed border-zinc-300 px-3 py-2 text-xs font-bold text-zinc-500 transition-colors hover:border-accent hover:text-accent"
          >
            + 게시판 추가
          </button>
        </Card>

        {/* 글 목록 */}
        <div className="min-w-0 space-y-3">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-sm font-black text-offblack">
              {selected === 'all' ? '전체 글' : labelOfKey(selected)}
              <span className="ml-2 text-xs font-bold text-zinc-400">{filtered.length}건</span>
            </h2>
            <Btn onClick={startNewPost} size="sm">+ 글쓰기</Btn>
          </div>
          <Card>
            {filtered.length === 0 ? (
              <div className="py-16 text-center">
                <p className="text-sm font-semibold text-zinc-400">아직 글이 없습니다.</p>
                <button type="button" onClick={startNewPost} className="mt-2 text-sm font-bold text-accent hover:underline">첫 글 작성하기 →</button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[560px] text-sm">
                  <thead className="border-b border-zinc-100 bg-zinc-50/60">
                    <tr>
                      {['게시판', '제목', '공개', '게시기간', ''].map((h, i) => (
                        <th key={i} className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-zinc-400">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map(b => (
                      <tr key={b.id} className="border-b border-zinc-50 hover:bg-zinc-50/60">
                        <td className="px-4 py-3">
                          <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-xs font-bold text-zinc-600">{labelOfKey(boardKeyOf(b))}</span>
                        </td>
                        <td className="max-w-xs truncate px-4 py-3 font-semibold text-offblack">{b.title}</td>
                        <td className="px-4 py-3">
                          <span className={cx('rounded-full px-2 py-0.5 text-xs font-bold', b.is_published ? 'bg-emerald-50 text-emerald-600' : 'bg-zinc-100 text-zinc-400')}>
                            {b.is_published ? '공개' : '비공개'}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-xs text-zinc-400">
                          {b.start_date ? b.start_date : '즉시'} ~ {b.end_date || '무기한'}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex gap-2">
                            <Btn onClick={() => { setEditing({ ...b }); setView('edit'); setNotice({ tone: 'idle', message: '' }); }} variant="secondary" size="sm">수정</Btn>
                            <Btn onClick={() => deleteBoard(b.id)} variant="danger" size="sm">삭제</Btn>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        </div>
      </div>

      {groupModal ? (
        <BoardGroupModal
          initial={groupModal}
          onClose={() => setGroupModal(null)}
          onError={(m) => setNotice({ tone: 'error', message: m })}
          onSaved={async () => { setGroupModal(null); await refreshGroups(); setNotice({ tone: 'success', message: '게시판이 저장되었습니다.' }); }}
        />
      ) : null}
    </div>
  );
}

// ── 팝업 모듈 ────────────────────────────────────────────────────────────────

const POPUP_POSITIONS = [['center','중앙'],['left','좌측'],['right','우측'],['bottom','하단']];

function PopupModule({ data }) {
  const [items, setItems] = useState(
    (data?.popups || []).map((p, i) => ({ ...p, is_active: p.is_active === 1 || p.is_active === true, sort_order: i }))
  );
  const [editing, setEditing] = useState(null);
  const [notice, setNotice] = useState({ tone: 'idle', message: '' });
  const [saving, setSaving] = useState(false);

  function newDraft() {
    return { id: `new-${Date.now()}`, title: '', content: '', is_active: true, start_date: '', end_date: '', position: 'center', image_url: '', link_url: '', sort_order: items.length };
  }

  async function save() {
    setSaving(true);
    try {
      const res = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({ type: 'popup', data: items }),
      });
      const json = await res.json();
      if (!res.ok || json.error) throw new Error(json.error);
      setNotice({ tone: 'success', message: '팝업 설정이 저장되었습니다.' });
      setEditing(null);
    } catch (e) {
      setNotice({ tone: 'error', message: e.message });
    } finally {
      setSaving(false);
    }
  }

  function updateItem(id, patch) {
    setItems(prev => prev.map(p => p.id === id ? { ...p, ...patch } : p));
    if (editing?.id === id) setEditing(prev => ({ ...prev, ...patch }));
  }

  function removeItem(id) {
    setItems(prev => prev.filter(p => p.id !== id));
    if (editing?.id === id) setEditing(null);
  }

  return (
    <div className="space-y-4 p-6">
      <div className="flex items-center justify-between">
        <p className="text-sm text-zinc-500">{items.length}개 팝업</p>
        <div className="flex gap-2">
          <Btn onClick={() => { const d = newDraft(); setItems(p => [...p, d]); setEditing(d); }} variant="secondary" size="sm">+ 팝업 추가</Btn>
          <Btn onClick={save} disabled={saving}>{saving ? '저장 중…' : '전체 저장'}</Btn>
        </div>
      </div>
      <Notice {...notice} />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[280px_1fr]">
        {/* 팝업 목록 */}
        <div className="space-y-2">
          {items.length === 0 && <p className="py-8 text-center text-sm text-zinc-400">팝업이 없습니다.</p>}
          {items.map((p) => (
            <div
              key={p.id}
              onClick={() => setEditing(p)}
              className={cx(
                'cursor-pointer rounded-xl border p-4 transition-colors',
                editing?.id === p.id ? 'border-zinc-900 bg-zinc-100' : 'border-zinc-200 bg-white hover:border-zinc-300'
              )}
            >
              <div className="flex items-center justify-between">
                <p className="text-sm font-bold text-offblack truncate max-w-[160px]">{p.title || '(제목 없음)'}</p>
                <Toggle checked={p.is_active} onChange={v => updateItem(p.id, { is_active: v })} />
              </div>
              <p className="mt-1 text-xs text-zinc-400">{POPUP_POSITIONS.find(([k])=>k===p.position)?.[1] || '중앙'}</p>
              <Btn onClick={e => { e.stopPropagation(); removeItem(p.id); }} variant="danger" size="sm" className="mt-2">삭제</Btn>
            </div>
          ))}
        </div>

        {/* 팝업 에디터 */}
        {editing ? (
          <Card className="p-6 space-y-4">
            <h3 className="text-sm font-black text-offblack">팝업 편집</h3>
            <Field label="제목">
              <Input value={editing.title} onChange={e => updateItem(editing.id, { title: e.target.value })} placeholder="팝업 제목" />
            </Field>
            <Field label="내용 (HTML 허용)">
              <Textarea value={editing.content} onChange={e => updateItem(editing.id, { content: e.target.value })} rows={5} placeholder="<p>팝업 내용을 입력하세요.</p>" />
            </Field>
            <div className="grid grid-cols-2 gap-4">
              <Field label="이미지 URL">
                <Input value={editing.image_url} onChange={e => updateItem(editing.id, { image_url: e.target.value })} placeholder="https://..." />
              </Field>
              <Field label="링크 URL">
                <Input value={editing.link_url} onChange={e => updateItem(editing.id, { link_url: e.target.value })} placeholder="https://..." />
              </Field>
              <Field label="위치">
                <Select value={editing.position} onChange={e => updateItem(editing.id, { position: e.target.value })}>
                  {POPUP_POSITIONS.map(([k,l]) => <option key={k} value={k}>{l}</option>)}
                </Select>
              </Field>
              <Field label="정렬순서">
                <Input type="number" value={editing.sort_order} onChange={e => updateItem(editing.id, { sort_order: Number(e.target.value) })} />
              </Field>
              <Field label="게시 시작일">
                <Input type="date" value={editing.start_date} onChange={e => updateItem(editing.id, { start_date: e.target.value })} />
              </Field>
              <Field label="게시 종료일">
                <Input type="date" value={editing.end_date} onChange={e => updateItem(editing.id, { end_date: e.target.value })} />
              </Field>
            </div>
          </Card>
        ) : (
          <Card className="flex items-center justify-center p-12">
            <p className="text-sm text-zinc-400">좌측에서 팝업을 선택하거나 새로 추가하세요.</p>
          </Card>
        )}
      </div>
    </div>
  );
}

// ── SEO / GEO 모듈 ───────────────────────────────────────────────────────────

const GEO_FIELDS = [
  ['clinic_name','의료기관명'],['representative','대표원장'],['telephone','대표 전화'],
  ['website_url','대표 URL'],['address','전체 주소'],['street_address','도로명 상세 주소'],
  ['address_locality','시/군/구'],['address_region','시/도'],['postal_code','우편번호'],
  ['latitude','위도'],['longitude','경도'],['medical_specialty','진료 전문 분야'],
  ['area_served','진료 권역'],['price_range','가격대'],['map_url','지도 링크'],
  ['kakao_channel_url','카카오 채널'],['naver_booking_url','네이버 예약'],
  ['naver_blog_url','네이버 블로그'],['youtube_url','유튜브'],['instagram_url','인스타그램'],
];
const GEO_TEXTAREA = new Set(['opening_hours','schema_opening_hours']);

const SEO_FIELDS = [
  ['page_label','관리용 페이지명'],['path','페이지 경로'],['title','Title 태그'],
  ['description','Meta Description'],['keywords','검색 키워드'],['og_title','OG 제목'],
  ['og_description','OG 설명'],['og_image','OG 이미지 URL'],['canonical_url','Canonical URL'],
  ['author','작성자'],['schema_type','Schema.org 타입'],['schema_name','Schema 이름'],
  ['schema_description','Schema 설명'],['aeo_summary','AEO 요약'],['local_keywords','GEO 지역 키워드'],
];
const SEO_TEXTAREA = new Set(['description','keywords','og_description','schema_description','aeo_summary','local_keywords']);

const SNIPPET_FIELDS = [
  ['common_meta_tags','공통 메타 태그','모든 사용자 페이지 head에 삽입'],
  ['common_header','공통 헤더 코드','body 시작 직후 삽입'],
  ['common_body','공통 본문 코드','콘텐츠 영역 전 삽입'],
  ['common_footer','공통 푸터 코드','body 종료 직전 삽입'],
];

function SEOModule({ data }) {
  const [tab, setTab] = useState('geo');
  const [geo, setGeo] = useState(data?.geo || {});
  const [seoList, setSeoList] = useState(data?.seoList || []);
  const [snippets, setSnippets] = useState(data?.snippets || {});
  const [doctors, setDoctors] = useState(data?.doctors || []);
  const [expandSeo, setExpandSeo] = useState(null);
  const [notice, setNotice] = useState({ tone: 'idle', message: '' });
  const [saving, setSaving] = useState(false);

  async function saveGeo() {
    setSaving(true);
    try {
      const res = await fetch('/api/settings', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'same-origin',
        body: JSON.stringify({ type: 'geo', data: geo }),
      });
      const json = await res.json();
      if (!res.ok || json.error) throw new Error(json.error);
      setNotice({ tone: 'success', message: '업체 정보가 저장되었습니다.' });
    } catch (e) { setNotice({ tone: 'error', message: e.message }); }
    finally { setSaving(false); }
  }

  async function saveSeo() {
    setSaving(true);
    try {
      const res = await fetch('/api/settings', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'same-origin',
        body: JSON.stringify({ type: 'seo', data: seoList }),
      });
      const json = await res.json();
      if (!res.ok || json.error) throw new Error(json.error);
      setNotice({ tone: 'success', message: 'SEO 설정이 저장되었습니다.' });
    } catch (e) { setNotice({ tone: 'error', message: e.message }); }
    finally { setSaving(false); }
  }

  async function saveSnippets() {
    setSaving(true);
    try {
      const res = await fetch('/api/settings', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'same-origin',
        body: JSON.stringify({ type: 'snippets', data: snippets }),
      });
      const json = await res.json();
      if (!res.ok || json.error) throw new Error(json.error);
      setNotice({ tone: 'success', message: '코드 스니펫이 저장되었습니다.' });
    } catch (e) { setNotice({ tone: 'error', message: e.message }); }
    finally { setSaving(false); }
  }

  async function saveDoctors() {
    setSaving(true);
    try {
      const res = await fetch('/api/settings', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'same-origin',
        body: JSON.stringify({ type: 'doctors', data: doctors.map((d, i) => ({ ...d, sort_order: i })) }),
      });
      const json = await res.json();
      if (!res.ok || json.error) throw new Error(json.error);
      const refreshed = await fetch('/api/settings?type=doctors', { credentials: 'same-origin' }).then(r => r.json()).catch(() => doctors);
      setDoctors(Array.isArray(refreshed) ? refreshed : doctors);
      setNotice({ tone: 'success', message: '의료진 정보가 저장되었습니다.' });
    } catch (e) { setNotice({ tone: 'error', message: e.message }); }
    finally { setSaving(false); }
  }

  return (
    <div className="space-y-4 p-6">
      <div className="flex gap-1 rounded-xl border border-zinc-200 bg-white p-1 w-fit">
        {[['geo','업체 GEO 정보'],['seo','페이지 SEO'],['doctors','의료진 (EEAT)'],['snippets','공통 코드'],['carousel','네이버 캐러셀']].map(([k,l]) => (
          <button key={k} onClick={() => { setTab(k); setNotice({ tone: 'idle', message: '' }); }} className={cx('rounded-lg px-4 py-2 text-xs font-bold transition-colors', tab===k ? 'bg-white text-zinc-900' : 'text-zinc-500 hover:text-offblack')}>
            {l}
          </button>
        ))}
      </div>
      <Notice {...notice} />

      {tab === 'geo' && (
        <Card className="p-6 space-y-5">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {GEO_FIELDS.map(([k,l]) => (
              <Field key={k} label={l}>
                {GEO_TEXTAREA.has(k)
                  ? <Textarea value={geo[k]} onChange={e => setGeo(p => ({ ...p, [k]: e.target.value }))} rows={3} />
                  : <Input value={geo[k]} onChange={e => setGeo(p => ({ ...p, [k]: e.target.value }))} />}
              </Field>
            ))}
            <Field label="진료시간 (표시용)" className="sm:col-span-2">
              <Textarea value={geo.opening_hours} onChange={e => setGeo(p => ({ ...p, opening_hours: e.target.value }))} rows={3} />
            </Field>
            <Field label="Schema 진료시간 (Schema.org 형식)">
              <Input value={geo.schema_opening_hours} onChange={e => setGeo(p => ({ ...p, schema_opening_hours: e.target.value }))} placeholder="Mo,We,Fr 09:30-18:00" />
            </Field>
            <Field label="파비콘" className="sm:col-span-2">
              <div className="flex items-center gap-3">
                {geo.favicon_url && (
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-zinc-200 bg-white">
                    <img src={geo.favicon_url} alt="favicon" className="h-6 w-6 object-contain" />
                  </div>
                )}
                <div className="flex-1">
                  <Input value={geo.favicon_url || ''} onChange={e => setGeo(p => ({ ...p, favicon_url: e.target.value }))} placeholder="/uploads/hospitals/.../favicon.png" />
                </div>
                <label className="shrink-0 cursor-pointer rounded-lg border border-zinc-200 bg-white px-3 py-2 text-xs font-bold text-zinc-600 transition hover:border-zinc-900 hover:text-zinc-900">
                  업로드
                  <input
                    type="file"
                    accept="image/x-icon,image/vnd.microsoft.icon,image/png,image/svg+xml,image/jpeg,image/webp,.ico"
                    className="hidden"
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      const fd = new FormData();
                      fd.append('file', file);
                      const r = await fetch('/api/favicon', { method: 'POST', body: fd, credentials: 'same-origin' });
                      const j = await r.json();
                      if (r.ok && j.url) {
                        setGeo(p => ({ ...p, favicon_url: j.url }));
                        setNotice({ tone: 'success', message: '파비콘이 업로드되었습니다. 저장 버튼을 눌러주세요.' });
                      } else {
                        setNotice({ tone: 'error', message: j.error || '업로드 실패' });
                      }
                      e.target.value = '';
                    }}
                  />
                </label>
                {geo.favicon_url && (
                  <button
                    type="button"
                    onClick={() => setGeo(p => ({ ...p, favicon_url: '' }))}
                    className="shrink-0 rounded-lg px-2 py-2 text-xs text-red-500 hover:bg-red-50"
                  >
                    제거
                  </button>
                )}
              </div>
              <p className="mt-1 text-xs text-zinc-400">ico/png/svg/jpg/webp 업로드 가능 (2MB 이하)</p>
            </Field>
            <Field label="OG 이미지 (소셜 공유용)" className="sm:col-span-2">
              <div className="flex items-start gap-3">
                {geo.og_image_url && (
                  <div className="flex h-[63px] w-[120px] shrink-0 items-center justify-center overflow-hidden rounded-lg border border-zinc-200 bg-zinc-50">
                    <img src={geo.og_image_url} alt="og preview" className="h-full w-full object-cover" />
                  </div>
                )}
                <div className="flex-1">
                  <Input value={geo.og_image_url || ''} onChange={e => setGeo(p => ({ ...p, og_image_url: e.target.value }))} placeholder="/uploads/hospitals/.../og-image.png" />
                  <p className="mt-1 text-xs text-zinc-400">권장 크기: <b>1200 × 630</b> · png/jpg/webp · 5MB 이하 · 카카오톡·네이버·페이스북·트위터 공유 시 미리보기로 사용됩니다.</p>
                </div>
                <label className="shrink-0 cursor-pointer rounded-lg border border-zinc-200 bg-white px-3 py-2 text-xs font-bold text-zinc-600 transition hover:border-zinc-900 hover:text-zinc-900">
                  업로드
                  <input
                    type="file"
                    accept="image/png,image/jpeg,image/webp"
                    className="hidden"
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      // 클라이언트에서 1200x630 권장 안내 (강제는 아님)
                      const img = new window.Image();
                      const url = URL.createObjectURL(file);
                      img.src = url;
                      await new Promise((res) => { img.onload = res; img.onerror = res; });
                      URL.revokeObjectURL(url);
                      const w = img.naturalWidth, h = img.naturalHeight;
                      if (w && h && (w !== 1200 || h !== 630)) {
                        const ok = window.confirm(`현재 이미지 크기: ${w}×${h}\n권장 크기: 1200×630\n그대로 업로드하시겠습니까?`);
                        if (!ok) { e.target.value = ''; return; }
                      }
                      const fd = new FormData();
                      fd.append('file', file);
                      const r = await fetch('/api/og-image', { method: 'POST', body: fd, credentials: 'same-origin' });
                      const j = await r.json();
                      if (r.ok && j.url) {
                        setGeo(p => ({ ...p, og_image_url: j.url }));
                        setNotice({ tone: 'success', message: 'OG 이미지가 업로드되었습니다. 저장 버튼을 눌러주세요.' });
                      } else {
                        setNotice({ tone: 'error', message: j.error || '업로드 실패' });
                      }
                      e.target.value = '';
                    }}
                  />
                </label>
                {geo.og_image_url && (
                  <button
                    type="button"
                    onClick={() => setGeo(p => ({ ...p, og_image_url: '' }))}
                    className="shrink-0 rounded-lg px-2 py-2 text-xs text-red-500 hover:bg-red-50"
                  >
                    제거
                  </button>
                )}
              </div>
            </Field>
          </div>
          <div className="flex justify-end"><Btn onClick={saveGeo} disabled={saving}>{saving ? '저장 중…' : '업체 정보 저장'}</Btn></div>
        </Card>
      )}

      {tab === 'seo' && (
        <div className="space-y-2">
          {seoList.map((item) => (
            <Card key={item.id}>
              <button
                onClick={() => setExpandSeo(expandSeo === item.id ? null : item.id)}
                className="flex w-full items-center justify-between px-5 py-4 text-left"
              >
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="text-sm font-bold text-offblack">{item.page_label || item.id}</p>
                  {item._is_custom && (
                    <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-[10px] font-black text-zinc-900">커스텀</span>
                  )}
                  <p className="w-full text-xs text-zinc-400">{item.path}{item.title ? ` · ${item.title}` : ''}</p>
                </div>
                <span className="shrink-0 text-zinc-400 ml-2">{expandSeo === item.id ? '▲' : '▼'}</span>
              </button>
              {expandSeo === item.id && (
                <div className="border-t border-zinc-100 p-5">
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    {SEO_FIELDS.map(([k,l]) => (
                      <Field key={k} label={l} className={SEO_TEXTAREA.has(k) ? 'sm:col-span-2' : ''}>
                        {SEO_TEXTAREA.has(k)
                          ? <Textarea value={item[k]} onChange={e => setSeoList(prev => prev.map(s => s.id===item.id ? { ...s, [k]: e.target.value } : s))} rows={3} />
                          : <Input value={item[k]} onChange={e => setSeoList(prev => prev.map(s => s.id===item.id ? { ...s, [k]: e.target.value } : s))} />}
                      </Field>
                    ))}
                  </div>
                  <div className="mt-5 rounded-xl border border-zinc-200 bg-zinc-50/60 p-4">
                    <p className="mb-3 text-xs font-black text-zinc-900">EEAT · 작성자 / 검수자 (의료 콘텐츠 신뢰 신호)</p>
                    {doctors.length === 0 ? (
                      <p className="text-xs text-zinc-400">먼저 «의료진 (EEAT)» 탭에서 의료진을 등록하세요.</p>
                    ) : (
                      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                        <Field label="작성자">
                          <Select
                            value={item.author_doctor_id == null ? '' : String(item.author_doctor_id)}
                            onChange={e => setSeoList(prev => prev.map(s => s.id===item.id ? { ...s, author_doctor_id: e.target.value } : s))}
                          >
                            <option value="">— 지정 안 함 —</option>
                            {doctors.map(d => <option key={d.id} value={String(d.id)}>{d.name}{d.job_title ? ` (${d.job_title})` : ''}</option>)}
                          </Select>
                        </Field>
                        <Field label="검수자">
                          <Select
                            value={item.reviewer_doctor_id == null ? '' : String(item.reviewer_doctor_id)}
                            onChange={e => setSeoList(prev => prev.map(s => s.id===item.id ? { ...s, reviewer_doctor_id: e.target.value } : s))}
                          >
                            <option value="">— 대표원장(기본) —</option>
                            {doctors.map(d => <option key={d.id} value={String(d.id)}>{d.name}{d.job_title ? ` (${d.job_title})` : ''}</option>)}
                          </Select>
                        </Field>
                        <Field label="최종 검수일">
                          <Input type="date" value={item.last_reviewed || ''} onChange={e => setSeoList(prev => prev.map(s => s.id===item.id ? { ...s, last_reviewed: e.target.value } : s))} />
                        </Field>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </Card>
          ))}
          <div className="flex justify-end pt-2"><Btn onClick={saveSeo} disabled={saving}>{saving ? '저장 중…' : 'SEO 설정 저장'}</Btn></div>
        </div>
      )}

      {tab === 'doctors' && (
        <div className="space-y-4">
          <Card className="p-4">
            <p className="text-xs text-zinc-500">
              의료진 정보는 schema.org <b>Physician</b> 구조화 데이터로 출력되어 검색·생성형 AI의 EEAT(전문성·권위·신뢰) 신호로 사용됩니다.
              자격·학력·학회·외부 프로필은 <b>줄바꿈으로 여러 개</b> 입력할 수 있습니다.
            </p>
          </Card>

          {doctors.map((doc, idx) => (
            <Card key={doc.id || `new-${idx}`} className="p-5 space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-sm font-black text-offblack">{doc.name || '(이름 미입력)'} {doc.job_title ? <span className="text-zinc-400 font-medium">· {doc.job_title}</span> : null}</p>
                <button
                  type="button"
                  onClick={() => setDoctors(prev => prev.filter((_, i) => i !== idx))}
                  className="rounded-lg px-2 py-1 text-xs text-red-500 hover:bg-red-50"
                >
                  삭제
                </button>
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {[['name','이름'],['job_title','직책 (예: 대표원장)'],['license_no','의사 면허번호'],['specialty','전문/진료 분야']].map(([k,l]) => (
                  <Field key={k} label={l}>
                    <Input value={doc[k] || ''} onChange={e => setDoctors(prev => prev.map((d,i) => i===idx ? { ...d, [k]: e.target.value } : d))} />
                  </Field>
                ))}
                {[['credentials','전문의·자격 (한 줄에 하나)'],['education','학력 (한 줄에 하나)'],['memberships','소속 학회 (한 줄에 하나)'],['career','경력·소개'],['same_as','외부 프로필 URL (한 줄에 하나)']].map(([k,l]) => (
                  <Field key={k} label={l} className="sm:col-span-2">
                    <Textarea value={doc[k] || ''} onChange={e => setDoctors(prev => prev.map((d,i) => i===idx ? { ...d, [k]: e.target.value } : d))} rows={3} />
                  </Field>
                ))}
                <Field label="프로필 사진" className="sm:col-span-2">
                  <div className="flex items-center gap-3">
                    {doc.photo_url && (
                      <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-zinc-200 bg-white">
                        <img src={doc.photo_url} alt="" className="h-full w-full object-cover" />
                      </div>
                    )}
                    <div className="flex-1">
                      <Input value={doc.photo_url || ''} onChange={e => setDoctors(prev => prev.map((d,i) => i===idx ? { ...d, photo_url: e.target.value } : d))} placeholder="/uploads/hospitals/.../doctor.jpg" />
                    </div>
                    <label className="shrink-0 cursor-pointer rounded-lg border border-zinc-200 bg-white px-3 py-2 text-xs font-bold text-zinc-600 transition hover:border-zinc-900 hover:text-zinc-900">
                      업로드
                      <input
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        className="hidden"
                        onChange={async (e) => {
                          const file = e.target.files?.[0];
                          if (!file) return;
                          const fd = new FormData();
                          fd.append('file', file);
                          const r = await fetch('/api/board-image', { method: 'POST', body: fd, credentials: 'same-origin' });
                          const j = await r.json();
                          if (r.ok && j.url) {
                            setDoctors(prev => prev.map((d,i) => i===idx ? { ...d, photo_url: j.url } : d));
                            setNotice({ tone: 'success', message: '사진이 업로드되었습니다. 저장 버튼을 눌러주세요.' });
                          } else {
                            setNotice({ tone: 'error', message: j.error || '업로드 실패' });
                          }
                          e.target.value = '';
                        }}
                      />
                    </label>
                  </div>
                </Field>
              </div>
            </Card>
          ))}

          <div className="flex justify-between">
            <Btn
              variant="secondary"
              onClick={() => setDoctors(prev => [...prev, { id: `new-${Date.now()}`, name: '', job_title: '', license_no: '', specialty: '', credentials: '', education: '', memberships: '', career: '', photo_url: '', same_as: '' }])}
            >
              + 의료진 추가
            </Btn>
            <Btn onClick={saveDoctors} disabled={saving}>{saving ? '저장 중…' : '의료진 저장'}</Btn>
          </div>
        </div>
      )}

      {tab === 'snippets' && (
        <Card className="p-6 space-y-5">
          {SNIPPET_FIELDS.map(([k,l,hint]) => (
            <Field key={k} label={l} hint={hint}>
              <Textarea value={snippets[k]} onChange={e => setSnippets(p => ({ ...p, [k]: e.target.value }))} rows={5} placeholder={`<!-- ${l} -->`} />
            </Field>
          ))}
          <div className="flex justify-end"><Btn onClick={saveSnippets} disabled={saving}>{saving ? '저장 중…' : '스니펫 저장'}</Btn></div>
        </Card>
      )}

      {tab === 'carousel' && (
        <NaverCarouselTab onNotice={setNotice} />
      )}
    </div>
  );
}

// ── 네이버 캐러셀 탭 ─────────────────────────────────────────────────────────

function NaverCarouselTab({ onNotice }) {
  const [carousels, setCarousels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState(null);
  const [detail, setDetail] = useState(null);
  const [items, setItems] = useState([]);
  const [meta, setMeta] = useState({ title: '', is_active: 1 });
  const [savingMeta, setSavingMeta] = useState(false);
  const [savingItems, setSavingItems] = useState(false);
  const [uploadingIdx, setUploadingIdx] = useState(null);

  async function loadList() {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/carousels', { credentials: 'same-origin' });
      const data = await res.json();
      if (!res.ok || data.error) throw new Error(data.error);
      setCarousels(data.carousels || []);
    } catch (e) { onNotice?.({ tone: 'error', message: e.message }); }
    finally { setLoading(false); }
  }

  useEffect(() => { loadList(); /* eslint-disable-next-line */ }, []);

  async function selectCarousel(id) {
    setSelectedId(id);
    setDetail(null);
    setItems([]);
    if (!id) return;
    try {
      const res = await fetch(`/api/admin/carousels/${id}`, { credentials: 'same-origin' });
      const data = await res.json();
      if (!res.ok || data.error) throw new Error(data.error);
      setDetail(data.carousel);
      setMeta({ title: data.carousel.title || '', is_active: data.carousel.is_active ? 1 : 0 });
      setItems(data.carousel.items || []);
    } catch (e) { onNotice?.({ tone: 'error', message: e.message }); }
  }

  async function addCarousel() {
    try {
      const res = await fetch('/api/admin/carousels', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'same-origin',
        body: JSON.stringify({ title: '새 캐러셀', pageSlug: 'main', itemType: 'Article' }),
      });
      const data = await res.json();
      if (!res.ok || data.error) throw new Error(data.error);
      await loadList();
      selectCarousel(data.carousel.id);
      onNotice?.({ tone: 'success', message: '캐러셀이 추가되었습니다.' });
    } catch (e) { onNotice?.({ tone: 'error', message: e.message }); }
  }

  async function saveMeta() {
    if (!selectedId) return;
    setSavingMeta(true);
    try {
      const res = await fetch(`/api/admin/carousels/${selectedId}`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' }, credentials: 'same-origin',
        body: JSON.stringify({ title: meta.title, isActive: !!meta.is_active }),
      });
      const data = await res.json();
      if (!res.ok || data.error) throw new Error(data.error);
      await loadList();
      onNotice?.({ tone: 'success', message: '캐러셀 정보가 저장되었습니다.' });
    } catch (e) { onNotice?.({ tone: 'error', message: e.message }); }
    finally { setSavingMeta(false); }
  }

  async function deleteCarousel() {
    if (!selectedId) return;
    if (!confirm('이 캐러셀과 모든 항목을 삭제하시겠습니까?')) return;
    try {
      const res = await fetch(`/api/admin/carousels/${selectedId}`, { method: 'DELETE', credentials: 'same-origin' });
      const data = await res.json();
      if (!res.ok || data.error) throw new Error(data.error);
      setSelectedId(null); setDetail(null); setItems([]);
      await loadList();
      onNotice?.({ tone: 'success', message: '캐러셀이 삭제되었습니다.' });
    } catch (e) { onNotice?.({ tone: 'error', message: e.message }); }
  }

  function addItem() {
    setItems((p) => [...p, { name: '', url: '', image_url: '', description: '' }]);
  }
  function updateItem(idx, key, value) {
    setItems((p) => p.map((it, i) => i === idx ? { ...it, [key]: value } : it));
  }
  function removeItem(idx) {
    setItems((p) => p.filter((_, i) => i !== idx));
  }

  async function uploadImage(idx, file) {
    if (!file) return;
    setUploadingIdx(idx);
    try {
      const fd = new FormData();
      fd.append('file', file);
      const res = await fetch('/api/admin/carousel-image', { method: 'POST', body: fd, credentials: 'same-origin' });
      const data = await res.json();
      if (!res.ok || data.error) throw new Error(data.error);
      updateItem(idx, 'image_url', data.url);
    } catch (e) { onNotice?.({ tone: 'error', message: e.message }); }
    finally { setUploadingIdx(null); }
  }

  async function saveItems() {
    if (!selectedId) return;
    setSavingItems(true);
    try {
      const res = await fetch(`/api/admin/carousels/${selectedId}/items`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' }, credentials: 'same-origin',
        body: JSON.stringify({ items }),
      });
      const data = await res.json();
      if (!res.ok || data.error) throw new Error(data.error);
      await loadList();
      onNotice?.({ tone: 'success', message: `${data.itemCount}개 항목이 저장되었습니다.` });
    } catch (e) { onNotice?.({ tone: 'error', message: e.message }); }
    finally { setSavingItems(false); }
  }

  return (
    <div className="grid gap-4 xl:grid-cols-[260px_1fr_360px]">
      {/* 좌: 캐러셀 목록 */}
      <Card className="h-fit">
        <div className="flex items-center justify-between border-b border-zinc-100 px-4 py-3">
          <h3 className="text-sm font-black text-offblack">캐러셀</h3>
          <button
            type="button"
            onClick={addCarousel}
            className="rounded-lg bg-accent px-3 py-1.5 text-[11px] font-bold text-white hover:brightness-110"
          >
            + 캐러셀 추가
          </button>
        </div>
        {loading ? (
          <p className="px-4 py-6 text-xs text-zinc-400">불러오는 중...</p>
        ) : carousels.length === 0 ? (
          <p className="px-4 py-6 text-xs text-zinc-400">아직 등록된 캐러셀이 없습니다.</p>
        ) : (
          <ul className="divide-y divide-zinc-100">
            {carousels.map((c) => (
              <li key={c.id}>
                <button
                  type="button"
                  onClick={() => selectCarousel(c.id)}
                  className={cx(
                    'flex w-full items-start justify-between gap-2 px-4 py-3 text-left transition',
                    selectedId === c.id ? 'bg-zinc-100' : 'hover:bg-zinc-50'
                  )}
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-bold text-offblack">{c.title || '(제목 없음)'}</p>
                    <p className="text-[10px] text-zinc-500">
                      /{c.page_slug} · {c.item_type} · 항목 {c.item_count}
                    </p>
                  </div>
                  {!c.is_active && (
                    <span className="shrink-0 rounded bg-zinc-200 px-1.5 py-0.5 text-[9px] font-bold text-zinc-600">비활성</span>
                  )}
                </button>
              </li>
            ))}
          </ul>
        )}
        <div className="border-t border-zinc-100 px-4 py-3 text-[10px] leading-relaxed text-zinc-500">
          네이버 검색 시 메인 페이지 결과에 카드 캐러셀로 노출. 활성화한 캐러셀만 JSON-LD로 출력됩니다.
          <a href="https://searchadvisor.naver.com/guide/structured-data-carousel" target="_blank" rel="noopener" className="ml-1 underline">가이드</a>
        </div>
      </Card>

      {/* 가운데: 편집 */}
      <Card className="p-5">
        {!selectedId ? (
          <div className="flex h-64 items-center justify-center">
            <p className="text-sm font-semibold text-zinc-400">왼쪽에서 캐러셀을 선택하거나 추가해 주세요.</p>
          </div>
        ) : !detail ? (
          <p className="text-sm text-zinc-400">불러오는 중...</p>
        ) : (
          <div className="space-y-5">
            <div className="flex items-end gap-3">
              <Field label="캐러셀 제목" className="flex-1">
                <Input value={meta.title} onChange={(e) => setMeta((p) => ({ ...p, title: e.target.value }))} placeholder="예: 추천 진료" />
              </Field>
              <label className="flex items-center gap-2 pb-2 text-sm font-semibold text-zinc-700">
                <input
                  type="checkbox"
                  checked={!!meta.is_active}
                  onChange={(e) => setMeta((p) => ({ ...p, is_active: e.target.checked ? 1 : 0 }))}
                  className="h-4 w-4 accent-zinc-900"
                />
                활성화
              </label>
              <Btn onClick={saveMeta} disabled={savingMeta}>{savingMeta ? '저장 중…' : '저장'}</Btn>
              <button
                type="button"
                onClick={deleteCarousel}
                className="rounded-xl border border-red-200 bg-white px-3 py-2 text-xs font-bold text-red-600 hover:bg-red-50"
              >
                삭제
              </button>
            </div>

            <div className="border-t border-zinc-100 pt-4">
              <div className="mb-2 flex items-center justify-between">
                <h4 className="text-sm font-black text-offblack">항목 ({items.length})</h4>
                <button
                  type="button"
                  onClick={addItem}
                  className="rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-[11px] font-bold text-zinc-700 hover:bg-zinc-50"
                >
                  + 항목 추가
                </button>
              </div>
              {items.length === 0 ? (
                <p className="rounded-lg border border-dashed border-zinc-200 bg-zinc-50 p-6 text-center text-xs text-zinc-400">
                  항목이 없습니다. "+ 항목 추가"로 첫 카드를 만들어 보세요.
                </p>
              ) : (
                <ul className="space-y-3">
                  {items.map((it, idx) => (
                    <li key={idx} className="rounded-xl border border-zinc-200 bg-white p-3">
                      <div className="flex items-start gap-3">
                        <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-zinc-200 bg-zinc-50">
                          {it.image_url ? (
                            <img src={it.image_url} alt="" className="h-full w-full object-cover" />
                          ) : (
                            <span className="text-[10px] text-zinc-400">이미지 없음</span>
                          )}
                        </div>
                        <div className="grid flex-1 gap-2">
                          <Input
                            value={it.name}
                            onChange={(e) => updateItem(idx, 'name', e.target.value)}
                            placeholder="제목 (예: 임플란트 안내)"
                          />
                          <Input
                            value={it.url}
                            onChange={(e) => updateItem(idx, 'url', e.target.value)}
                            placeholder="연결 URL (https://...)"
                          />
                          <Textarea
                            value={it.description}
                            onChange={(e) => updateItem(idx, 'description', e.target.value)}
                            rows={2}
                            placeholder="설명"
                          />
                          <div className="flex items-center gap-2">
                            <Input
                              value={it.image_url}
                              onChange={(e) => updateItem(idx, 'image_url', e.target.value)}
                              placeholder="이미지 URL 또는 업로드"
                              className="flex-1"
                            />
                            <label className="cursor-pointer rounded-lg border border-zinc-200 bg-white px-3 py-2 text-[11px] font-bold text-zinc-700 hover:bg-zinc-50">
                              {uploadingIdx === idx ? '업로드 중…' : '업로드'}
                              <input
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={(e) => {
                                  const f = e.target.files?.[0];
                                  if (f) uploadImage(idx, f);
                                  e.target.value = '';
                                }}
                              />
                            </label>
                            <button
                              type="button"
                              onClick={() => removeItem(idx)}
                              className="rounded-lg border border-red-200 bg-white px-3 py-2 text-[11px] font-bold text-red-600 hover:bg-red-50"
                            >
                              삭제
                            </button>
                          </div>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
              <div className="mt-3 flex justify-end">
                <Btn onClick={saveItems} disabled={savingItems}>{savingItems ? '저장 중…' : '항목 저장'}</Btn>
              </div>
            </div>
          </div>
        )}
      </Card>

      {/* 우: 미리보기 */}
      <Card className="p-4">
        <h4 className="mb-3 text-xs font-black uppercase tracking-wider text-zinc-500">미리보기</h4>
        <CarouselPreview title={detail?.title || meta.title} items={items} />
      </Card>
    </div>
  );
}

function CarouselPreview({ title, items }) {
  const list = (items || []).filter((it) => it.name || it.image_url);
  return (
    <div className="rounded-2xl border border-zinc-200 bg-white p-4">
      <div className="mb-3 flex items-start gap-2">
        <span className="flex h-6 w-6 items-center justify-center rounded bg-[#03c75a] text-[10px] font-black text-white">N</span>
        <div>
          <p className="text-[10px] text-zinc-500">www.example.com</p>
          <p className="text-[13px] font-bold text-blue-700">{title || '검색 결과 제목'}</p>
        </div>
      </div>
      <p className="mb-3 text-[11px] text-zinc-600 line-clamp-2">
        {list[0]?.description || '검색 결과 요약 텍스트가 표시됩니다.'}
      </p>
      <div className="flex gap-2 overflow-x-auto pb-1">
        {list.length === 0 ? (
          <div className="flex h-32 w-full items-center justify-center rounded-lg border border-dashed border-zinc-200 bg-zinc-50 text-[11px] text-zinc-400">
            항목을 추가하면 카드가 표시됩니다
          </div>
        ) : list.slice(0, 8).map((it, i) => (
          <div key={i} className="flex w-28 shrink-0 flex-col gap-1.5 rounded-lg border border-zinc-200 bg-white p-2">
            <div className="flex h-20 w-full items-center justify-center overflow-hidden rounded bg-zinc-100">
              {it.image_url ? (
                <img src={it.image_url} alt="" className="h-full w-full object-cover" />
              ) : (
                <span className="text-[9px] text-zinc-400">No Image</span>
              )}
            </div>
            <p className="text-[11px] font-bold text-zinc-700 line-clamp-2">{it.name || '제목'}</p>
          </div>
        ))}
      </div>
      {list.length > 0 && (
        <p className="mt-2 text-[10px] text-zinc-400">실제 노출은 네이버 검색 정책에 따라 달라질 수 있습니다.</p>
      )}
    </div>
  );
}

// ── 도메인 모듈 ─────────────────────────────────────────────────────────────

function DomainsModule({ data, session, hospital }) {
  const [domains, setDomains] = useState(data?.domains || []);
  const [logs, setLogs] = useState(data?.logs || []);
  const [form, setForm] = useState({ domain: '', isPrimary: false });
  const [notice, setNotice] = useState({ tone: 'idle', message: '도메인 연결 및 DNS 상태를 이 화면에서 관리합니다.' });
  const [submitting, setSubmitting] = useState(false);

  async function deleteDomain(id) {
    if (!confirm('이 도메인을 삭제하시겠습니까?')) return;
    try {
      const res = await fetch(`/api/admin/domains?id=${id}`, { method: 'DELETE', credentials: 'same-origin' });
      if (res.ok) {
        setDomains(prev => prev.filter(d => d.id !== id));
        setNotice({ tone: 'success', message: '도메인이 삭제되었습니다.' });
      }
    } catch (e) {
      setNotice({ tone: 'error', message: e.message });
    }
  }

  async function issueSSL(id, domain) {
    if (!confirm(`"${domain}" 도메인에 SSL 인증서를 발급하시겠습니까?\nDNS가 서버 IP로 연결되어 있어야 합니다.`)) return;
    setNotice({ tone: 'info', message: `SSL 발급 중입니다. (최대 2분 소요)` });
    setDomains(prev => prev.map(d => d.id === id ? { ...d, ssl_status: 'issuing' } : d));
    try {
      const res = await fetch('/api/admin/domains/ssl', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({ domainId: id }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setDomains(prev => prev.map(d => d.id === id ? { ...d, ssl_status: 'active', ssl_enabled: 1 } : d));
        setNotice({ tone: 'success', message: 'SSL 인증서가 발급되었습니다.' });
      } else {
        setDomains(prev => prev.map(d => d.id === id ? { ...d, ssl_status: 'failed' } : d));
        setNotice({ tone: 'error', message: (data.error || '발급 실패') + (data.detail ? '\n' + data.detail : '') });
      }
    } catch (e) {
      setDomains(prev => prev.map(d => d.id === id ? { ...d, ssl_status: 'failed' } : d));
      setNotice({ tone: 'error', message: '네트워크 오류: ' + e.message });
    }
  }

  async function addDomain(e) {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch('/api/admin/domains', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'same-origin',
        body: JSON.stringify(form),
      });
      const json = await res.json();
      if (!res.ok || json.error) throw new Error(json.error || '도메인 등록 중 오류가 발생했습니다.');
      setDomains(prev => {
        const base = form.isPrimary ? prev.map(d => ({ ...d, is_primary: 0 })) : prev;
        return [...base, json.domain];
      });
      setNotice({ tone: 'success', message: '도메인이 등록되었습니다.' });
      setForm({ domain: '', isPrimary: false });
    } catch (e) {
      setNotice({ tone: 'error', message: e.message });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-4 p-6">
      <Notice {...notice} />
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_320px]">
        <div className="space-y-4">
          <Card className="p-5 space-y-4">
            <h2 className="text-sm font-black text-offblack">도메인 등록</h2>
            <form onSubmit={addDomain} className="space-y-3">
              <Field label="도메인">
                <Input value={form.domain} onChange={e => setForm(p => ({ ...p, domain: e.target.value }))} placeholder="clinic.example.com" />
              </Field>
              <label className="flex items-center gap-3 cursor-pointer">
                <input type="checkbox" checked={form.isPrimary} onChange={e => setForm(p => ({ ...p, isPrimary: e.target.checked }))} className="h-4 w-4 accent-zinc-900" />
                <span className="text-sm font-semibold text-zinc-600">대표 도메인으로 지정</span>
              </label>
              <Btn type="submit" disabled={submitting} className="w-full">{submitting ? '등록 중…' : '도메인 등록'}</Btn>
            </form>
          </Card>

          <Card className="p-5">
            <h2 className="mb-4 text-sm font-black text-offblack">등록된 도메인</h2>
            {domains.length === 0 ? (
              <p className="py-6 text-center text-sm text-zinc-400">등록된 도메인이 없습니다.</p>
            ) : (
              <div className="space-y-3">
                {domains.map(d => (
                  <div key={d.id} className="rounded-xl border border-zinc-200 p-4">
                    <div className="flex items-center justify-between">
                      <p className="font-bold text-offblack">{d.domain}</p>
                      {d.is_primary ? <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-xs font-bold text-zinc-900">대표 도메인</span> : null}
                    </div>
                    <div className="mt-2 flex gap-2 flex-wrap">
                      <span className={cx('rounded-full px-2 py-0.5 text-xs font-bold', d.status === 'connected' ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600')}>연결 {d.status}</span>
                      <span className={cx('rounded-full px-2 py-0.5 text-xs font-bold', d.ssl_status === 'active' ? 'bg-emerald-50 text-emerald-600' : 'bg-zinc-100 text-zinc-500')}>SSL {d.ssl_status}</span>
                    </div>
                    <div className="mt-3 flex items-center gap-2">
                      {d.ssl_status !== 'active' && (
                        <button
                          onClick={() => issueSSL(d.id, d.domain)}
                          disabled={d.ssl_status === 'issuing'}
                          className="rounded-md px-3 py-1.5 text-xs font-bold text-white bg-accent hover:brightness-110 transition disabled:opacity-60"
                        >
                          {d.ssl_status === 'issuing' ? '발급 중...' : 'SSL 발급'}
                        </button>
                      )}
                      <button
                        onClick={() => deleteDomain(d.id)}
                        className="rounded-md px-3 py-1.5 text-xs font-bold text-red-500 hover:bg-red-50 transition"
                      >
                        삭제
                      </button>
                      {d.verification_token && <p className="break-all rounded-lg bg-zinc-50 px-3 py-2 text-xs font-mono text-zinc-500 flex-1 ml-auto">토큰: {d.verification_token}</p>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>

        <div className="space-y-4">
          <Card className="p-5">
            <h2 className="mb-4 text-sm font-black text-offblack">연결 가이드</h2>
            <div className="space-y-3 text-sm text-zinc-500">
              {['1. 도메인 DNS를 서버 IP(172.235.202.109)로 A레코드 연결','2. 대표 도메인은 업체당 하나 권장','3. SSL은 연결 확인 후 자동 적용','4. 연결 후 상태가 pending이면 DNS 전파를 기다리세요 (최대 48시간)'].map((t,i) => (
                <p key={i} className="leading-relaxed">{t}</p>
              ))}
            </div>
          </Card>

          <Card className="p-5">
            <h2 className="mb-4 text-sm font-black text-offblack">최근 활동 로그</h2>
            {logs.length === 0 ? (
              <p className="text-sm text-zinc-400">활동 로그가 없습니다.</p>
            ) : (
              <div className="space-y-2">
                {logs.slice(0, 10).map(l => (
                  <div key={l.id} className="rounded-lg bg-zinc-50 p-3 text-xs">
                    <p className="font-bold text-offblack">{l.action} · {l.entity_type}</p>
                    <p className="text-zinc-400 mt-0.5">{formatDate(l.created_at)}</p>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}

// ── 페이지 관리 모듈 ─────────────────────────────────────────────────────────

const DEFAULT_PAGE_TYPES = [
  { slug: 'main',          title: '메인 페이지',       path: '/' },
  { slug: 'login',         title: '로그인',           path: '/login' },
  { slug: 'register',      title: '회원가입',         path: '/register' },
  { slug: 'privacy',       title: '개인정보 처리방침', path: '/privacy' },
  { slug: 'terms',         title: '이용약관',         path: '/terms' },
  { slug: 'notice',        title: '공지사항 목록',     path: '/community/notice' },
  { slug: 'notice-detail', title: '공지사항 상세',     path: '/community/notice/[id]' },
  { slug: 'event',         title: '이벤트 목록',       path: '/community/event' },
  { slug: 'event-detail',  title: '이벤트 상세',       path: '/community/event/[id]' },
];

function PagesModule({ data, hospitalName, hospitalId }) {
  const [pages, setPages] = useState(data?.pages || []);
  const [designTarget, setDesignTarget] = useState(null); // 디자인 편집기 열린 페이지
  const [notice, setNotice] = useState({ tone: 'idle', message: '' });

  async function refreshPages() {
    const res = await fetch('/api/pages', { credentials: 'same-origin' });
    if (res.ok) setPages(await res.json());
  }

  async function togglePublish(page) {
    const res = await fetch('/api/pages', {
      method: 'PUT', headers: { 'Content-Type': 'application/json' }, credentials: 'same-origin',
      body: JSON.stringify({ ...page, is_published: page.is_published ? 0 : 1 }),
    });
    if (res.ok) setPages(prev => prev.map(p => p.id === page.id ? { ...p, is_published: p.is_published ? 0 : 1 } : p));
  }

  async function deletePage(id) {
    if (!confirm('이 페이지를 삭제하시겠습니까?')) return;
    await fetch(`/api/pages?id=${id}`, { method: 'DELETE', credentials: 'same-origin' });
    setPages(prev => prev.filter(p => p.id !== id));
  }

  // 디자인 에디터 닫기 → 목록 갱신
  function handleEditorClose() {
    setDesignTarget(null);
    refreshPages();
  }

  return (
    <>
      {/* 전체화면 디자인 에디터 오버레이 */}
      {designTarget !== null && (
        <PageDesignEditor
          page={designTarget}
          hospitalName={hospitalName}
          hospitalId={hospitalId}
          onClose={handleEditorClose}
        />
      )}

      <div className="space-y-6 p-6">
        <Notice {...notice} />

        {/* 헤더 · 푸터 영역 */}
        <section>
          <div className="mb-3 flex items-center justify-between">
            <div>
              <h2 className="text-base font-black text-offblack">공통 레이아웃</h2>
              <p className="mt-0.5 text-xs text-zinc-500">모든 페이지에 공통으로 적용되는 헤더 · 푸터 영역</p>
            </div>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {[
              { slug: '_header', label: '공통 헤더', desc: '모든 페이지 상단 네비게이션' },
              { slug: '_footer', label: '공통 푸터', desc: '모든 페이지 하단 영역' },
            ].map(layout => {
              const saved = (data?.layouts || []).find(p => p.slug === layout.slug);
              const isApplied = saved?.is_published && saved?.content?.trim();
              return (
                <Card key={layout.slug} className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-bold text-offblack">{layout.label}</p>
                      <p className="mt-0.5 text-xs text-zinc-500">{layout.desc}</p>
                    </div>
                    <span className={cx(
                      'rounded-full px-2 py-0.5 text-[10px] font-bold',
                      isApplied ? 'bg-emerald-50 text-emerald-600' : 'bg-zinc-100 text-zinc-400',
                    )}>
                      {isApplied ? '적용 중' : '미사용'}
                    </span>
                  </div>
                  <button
                    onClick={() => setDesignTarget({ slug: layout.slug, title: layout.label, path: layout.slug })}
                    className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-xl border border-zinc-200 bg-zinc-50 py-2 text-xs font-bold text-zinc-600 transition hover:border-zinc-900 hover:bg-accent-hover hover:text-white"
                  >
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                    </svg>
                    HTML · CSS · JS 편집
                  </button>
                </Card>
              );
            })}
          </div>
        </section>

        {/* 페이지 섹션 */}
        <section>
          <div className="mb-3 flex items-center justify-between">
            <div>
              <h2 className="text-base font-black text-offblack">사이트 페이지</h2>
              <p className="mt-0.5 text-xs text-zinc-500">업체 홈페이지를 구성하는 개별 페이지</p>
            </div>
            <span className="text-xs text-zinc-400">{pages.length}개 페이지</span>
          </div>

        {/* 기본 페이지 그리드 */}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {DEFAULT_PAGE_TYPES.map(def => {
            const existing = pages.find(p => p.slug === def.slug);
            const hasContent = !!(existing?.content || existing?.custom_css);
            return (
              <Card key={def.slug} className="p-4 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm font-bold text-offblack">{def.title}</p>
                    <p className="mt-0.5 text-xs font-mono text-zinc-400">{def.path}</p>
                  </div>
                  <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-[10px] font-bold text-zinc-500">기본</span>
                </div>

                {existing && (
                  <div className="mt-2 flex items-center gap-2">
                    <button
                      onClick={() => togglePublish(existing)}
                      className={cx(
                        'rounded-full px-2 py-0.5 text-xs font-bold cursor-pointer transition',
                        existing.is_published
                          ? 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100'
                          : 'bg-zinc-100 text-zinc-400 hover:bg-zinc-200'
                      )}
                    >
                      {existing.is_published ? '공개' : '비공개'}
                    </button>
                    {hasContent && (
                      <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-[10px] font-bold text-zinc-900">
                        편집됨
                      </span>
                    )}
                  </div>
                )}

                <button
                  onClick={() => setDesignTarget({ slug: def.slug, title: def.title, path: def.path })}
                  className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-xl border border-zinc-200 bg-zinc-50 py-2 text-xs font-bold text-zinc-600 transition hover:border-zinc-900 hover:bg-accent-hover hover:text-white"
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                  </svg>
                  디자인 편집
                </button>
              </Card>
            );
          })}

          {/* DB에 있는 페이지 중 DEFAULT_PAGE_TYPES에 없는 것들 */}
          {pages.filter(p => !DEFAULT_PAGE_TYPES.some(d => d.slug === p.slug)).map(p => (
            <Card key={p.id} className="p-4 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-bold text-offblack">{p.title}</p>
                  <p className="mt-0.5 text-xs font-mono text-zinc-400">/{p.slug}</p>
                </div>
                <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-[10px] font-bold text-zinc-900">커스텀</span>
              </div>
              <div className="mt-2">
                <button
                  onClick={() => togglePublish(p)}
                  className={cx(
                    'rounded-full px-2 py-0.5 text-xs font-bold cursor-pointer transition',
                    p.is_published
                      ? 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100'
                      : 'bg-zinc-100 text-zinc-400 hover:bg-zinc-200'
                  )}
                >
                  {p.is_published ? '공개' : '비공개'}
                </button>
              </div>
              <div className="mt-3 flex gap-2">
                <button
                  onClick={() => setDesignTarget({ slug: p.slug, title: p.title, path: `/${p.slug}` })}
                  className="flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-zinc-200 bg-zinc-50 py-2 text-xs font-bold text-zinc-600 transition hover:border-zinc-900 hover:bg-accent-hover hover:text-white"
                >
                  디자인 편집
                </button>
                <button
                  onClick={() => deletePage(p.id)}
                  className="rounded-xl border border-red-100 bg-red-50 px-3 py-2 text-xs font-bold text-red-500 transition hover:bg-red-100"
                >
                  삭제
                </button>
              </div>
            </Card>
          ))}

          {/* 커스텀 페이지 추가 카드 */}
          <AddCustomPageCard onAdd={refreshPages} existingCount={pages.length} existingSlugs={new Set(pages.map(p => p.slug))} />
        </div>
        </section>
      </div>
    </>
  );
}

const PRESET_PAGES = [
  { slug: 'about', title: '업체 소개', path: '/about/hospital' },
  { slug: 'doctor', title: '의료진 소개', path: '/about/doctor' },
  { slug: 'implant', title: '임플란트', path: '/implant' },
  { slug: 'esthetics', title: '심미치료', path: '/esthetics' },
  { slug: 'tmj', title: '턱관절', path: '/tmj' },
  { slug: 'wisdom-cavity', title: '사랑니/충치', path: '/wisdom-cavity' },
  { slug: 'notice', title: '공지사항', path: '/community/notice' },
  { slug: 'event', title: '이벤트', path: '/community/event' },
];

function AddCustomPageCard({ onAdd, existingCount, existingSlugs }) {
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState(null); // null | 'preset' | 'custom'
  const [form, setForm] = useState({ slug: '', title: '' });
  const [saving, setSaving] = useState(false);

  const availablePresets = PRESET_PAGES.filter(p => !existingSlugs.has(p.slug));

  async function handleAdd(e) {
    e.preventDefault();
    if (!form.slug || !form.title) return;
    setSaving(true);
    try {
      const pageType = PRESET_PAGES.some(p => p.slug === form.slug) ? 'builtin' : 'custom';
      const res = await fetch('/api/pages', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'same-origin',
        body: JSON.stringify({ ...form, content: '', custom_css: '', is_published: 1, sort_order: existingCount, page_type: pageType }),
      });
      if (res.ok) { setOpen(false); setMode(null); setForm({ slug: '', title: '' }); onAdd(); }
    } finally { setSaving(false); }
  }

  async function addPreset(preset) {
    setSaving(true);
    try {
      const res = await fetch('/api/pages', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'same-origin',
        body: JSON.stringify({ slug: preset.slug, title: preset.title, content: '', custom_css: '', is_published: 1, sort_order: existingCount, page_type: 'builtin' }),
      });
      if (res.ok) { setOpen(false); setMode(null); onAdd(); }
    } finally { setSaving(false); }
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="flex h-full min-h-[140px] w-full items-center justify-center rounded-2xl border-2 border-dashed border-zinc-200 text-sm font-bold text-zinc-400 transition hover:border-zinc-900 hover:text-zinc-900"
      >
        + 페이지 추가
      </button>
    );
  }

  if (!mode) {
    return (
      <Card className="p-4">
        <p className="mb-3 text-sm font-black text-offblack">페이지 추가</p>
        <div className="space-y-2">
          {availablePresets.length > 0 && (
            <button onClick={() => setMode('preset')} className="flex w-full items-center gap-3 rounded-xl border border-zinc-200 p-3 text-left transition hover:border-zinc-900 hover:bg-zinc-100">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-zinc-100 text-zinc-700 text-xs font-black">기본</span>
              <div><p className="text-sm font-bold text-offblack">기본 페이지 추가</p><p className="text-xs text-zinc-400">업체소개, 진료과목, 게시판 등</p></div>
            </button>
          )}
          <button onClick={() => setMode('custom')} className="flex w-full items-center gap-3 rounded-xl border border-zinc-200 p-3 text-left transition hover:border-zinc-900 hover:bg-zinc-100">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-500 text-xs font-black">+</span>
            <div><p className="text-sm font-bold text-offblack">커스텀 페이지 추가</p><p className="text-xs text-zinc-400">자유 slug/제목 입력</p></div>
          </button>
          <Btn type="button" onClick={() => setOpen(false)} variant="ghost" className="w-full mt-1">취소</Btn>
        </div>
      </Card>
    );
  }

  if (mode === 'preset') {
    return (
      <Card className="p-4">
        <p className="mb-3 text-sm font-black text-offblack">기본 페이지 선택</p>
        <div className="space-y-1.5 max-h-[300px] overflow-y-auto">
          {availablePresets.map(p => (
            <button key={p.slug} onClick={() => addPreset(p)} disabled={saving}
              className="flex w-full items-center justify-between rounded-lg border border-zinc-100 px-3 py-2.5 text-left transition hover:border-zinc-900 hover:bg-zinc-100 disabled:opacity-50">
              <div>
                <p className="text-sm font-bold text-offblack">{p.title}</p>
                <p className="text-xs text-zinc-400">{p.path}</p>
              </div>
              <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-[10px] font-bold text-zinc-500">추가</span>
            </button>
          ))}
        </div>
        <Btn type="button" onClick={() => setMode(null)} variant="ghost" className="w-full mt-3">뒤로</Btn>
      </Card>
    );
  }

  return (
    <Card className="p-4">
      <form onSubmit={handleAdd} className="space-y-3">
        <p className="text-sm font-black text-offblack">커스텀 페이지</p>
        <Field label="페이지 제목">
          <Input value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} placeholder="예: 이벤트 페이지" required />
        </Field>
        <Field label="슬러그 (URL)">
          <Input value={form.slug} onChange={e => setForm(p => ({ ...p, slug: slugify(e.target.value) }))} placeholder="event-page" required />
        </Field>
        <div className="flex gap-2">
          <Btn type="button" onClick={() => setMode(null)} variant="ghost" className="flex-1">뒤로</Btn>
          <Btn type="submit" loading={saving} className="flex-1">추가</Btn>
        </div>
      </form>
    </Card>
  );
}

// ── HospitalCMSWorkspace 메인 ─────────────────────────────────────────────────

// ── 방문 통계 모듈 ──────────────────────────────────────────────────────────

function anPctChange(cur, prev) {
  if (!prev) return cur > 0 ? null : 0; // null = 신규(비교불가)
  return Math.round(((cur - prev) / prev) * 100);
}
function anFmtDwell(sec) {
  sec = Math.round(sec || 0);
  if (sec <= 0) return '-';
  const m = Math.floor(sec / 60), s = sec % 60;
  return m > 0 ? `${m}분 ${s}초` : `${s}초`;
}
function anMobilePct(device = {}) {
  const t = (device.mobile || 0) + (device.tablet || 0) + (device.desktop || 0);
  return t ? Math.round(((device.mobile || 0) / t) * 100) : 0;
}
function anShortRef(ref) {
  try { const u = new URL(ref); return u.hostname.replace(/^www\./, '') + (u.pathname !== '/' ? u.pathname.slice(0, 18) : ''); } catch { return String(ref).slice(0, 30); }
}
function MomBadge({ value, invert }) {
  if (value === undefined) return null;
  if (value === null) return <span className="text-[11px] font-bold text-zinc-400">신규</span>;
  if (value === 0) return <span className="text-[11px] font-bold text-zinc-400">±0%</span>;
  const good = invert ? value < 0 : value > 0;
  return <span className={cx('text-[11px] font-bold', good ? 'text-emerald-600' : 'text-rose-500')}>{value > 0 ? '▲' : '▼'} {Math.abs(value)}%</span>;
}
function KpiCard({ label, value, mom, sub }) {
  return (
    <Card className="p-5">
      <p className="text-xs font-bold text-zinc-500">{label}</p>
      <div className="mt-1 flex items-end justify-between gap-2">
        <p className="text-3xl font-black text-offblack">{value}</p>
        <MomBadge value={mom} />
      </div>
      {sub && <p className="mt-0.5 text-xs text-zinc-400">{sub}</p>}
    </Card>
  );
}
function MiniStat({ label, value, mom, invert }) {
  return (
    <Card className="p-4">
      <p className="text-[11px] font-bold text-zinc-500">{label}</p>
      <div className="mt-0.5 flex items-end justify-between gap-2">
        <p className="text-lg font-black text-offblack">{value}</p>
        <MomBadge value={mom} invert={invert} />
      </div>
    </Card>
  );
}

function AnalyticsModule() {
  const [months] = useState(() => {
    const arr = [], d = new Date();
    for (let i = 0; i < 12; i++) { arr.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`); d.setMonth(d.getMonth() - 1); }
    return arr;
  });
  const [month, setMonth] = useState(months[0]);
  const [rep, setRep] = useState(null);
  const [loading, setLoading] = useState(false);

  async function load(m) {
    setLoading(true);
    try {
      const res = await fetch(`/api/analytics/stats?month=${m}`, { credentials: 'same-origin' });
      if (res.ok) setRep(await res.json());
    } finally { setLoading(false); }
  }
  useEffect(() => { load(month); /* eslint-disable-next-line */ }, [month]);

  if (loading && !rep) return <div className="p-12 text-center text-zinc-400">불러오는 중...</div>;
  if (!rep || !rep.current) return <div className="p-12 text-center text-zinc-400">데이터 없음</div>;

  const cur = rep.current, prev = rep.previous || {};
  const maxDay = Math.max(...(rep.byDay?.map(d => d.count) || [1]), 1);
  const curMobile = anMobilePct(cur.device), prevMobile = anMobilePct(prev.device || {});
  const monthLabel = (m) => `${m.slice(0, 4)}년 ${Number(m.slice(5, 7))}월`;

  return (
    <div className="space-y-4 p-6">
      {/* 헤더: 월 선택 */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-base font-black text-offblack">{monthLabel(month)} 방문 통계</p>
          <p className="text-xs text-zinc-400">전월({monthLabel(rep.prevMonth)}) 대비 비교</p>
        </div>
        <select value={month} onChange={(e) => setMonth(e.target.value)} className="rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-sm font-bold outline-none focus:border-zinc-900">
          {months.map(m => <option key={m} value={m}>{monthLabel(m)}</option>)}
        </select>
      </div>

      {/* 핵심 지표 + 전월대비 */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <KpiCard label="페이지뷰 (PV)" value={cur.pv.toLocaleString()} mom={anPctChange(cur.pv, prev.pv)} />
        <KpiCard label="순 방문자 (UV)" value={cur.uv.toLocaleString()} mom={anPctChange(cur.uv, prev.uv)} />
        <KpiCard label="모바일 비중" value={`${curMobile}%`} mom={anPctChange(curMobile, prevMobile)} sub={`PC ${100 - curMobile}%`} />
        <KpiCard label="평균 체류시간" value={anFmtDwell(cur.avgDwell)} mom={anPctChange(cur.avgDwell, prev.avgDwell)} />
      </div>

      {/* 보조 지표 */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <MiniStat label="세션 수" value={cur.sessions.toLocaleString()} mom={anPctChange(cur.sessions, prev.sessions)} />
        <MiniStat label="세션당 페이지" value={cur.pagesPerSession} mom={anPctChange(cur.pagesPerSession, prev.pagesPerSession)} />
        <MiniStat label="이탈률" value={`${cur.bounceRate}%`} mom={anPctChange(cur.bounceRate, prev.bounceRate)} invert />
        <MiniStat label="모바일 / PC (PV)" value={`${cur.device.mobile} / ${cur.device.desktop}`} />
      </div>

      {/* AI 검색 노출 (AI 크롤링) — P1 */}
      {rep.aiCrawl && <AiCrawlSection ai={rep.aiCrawl} />}

      {/* 일별 차트 */}
      <Card className="p-5">
        <h3 className="mb-4 text-sm font-black text-offblack">일별 방문 (PV)</h3>
        {rep.byDay.length === 0 ? (
          <p className="py-8 text-center text-sm text-zinc-400">데이터 없음</p>
        ) : (
          <div className="flex h-40 items-end gap-0.5">
            {rep.byDay.map(d => (
              <div key={d.day} className="flex h-full flex-1 flex-col items-center justify-end gap-1" title={`${d.day}: ${d.count}회`}>
                <div className="w-full rounded-t bg-accent transition-all" style={{ height: `${(d.count / maxDay) * 88}%`, minHeight: '2px' }} />
                <span className="text-[9px] text-zinc-400">{d.day.slice(8)}</span>
              </div>
            ))}
          </div>
        )}
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        {/* 많이 본 페이지 */}
        <Card className="p-5">
          <h3 className="mb-4 text-sm font-black text-offblack">많이 본 페이지</h3>
          <DistributionList items={rep.byPath.map(s => ({ label: s.path, count: s.count }))} />
        </Card>

        {/* 유입 소스 */}
        <Card className="p-5">
          <h3 className="mb-4 text-sm font-black text-offblack">유입 소스</h3>
          <DistributionList items={rep.bySource.map(s => ({ label: s.source, count: s.count }))} />
        </Card>

        {/* 유입 사이트 / 검색어 */}
        <Card className="p-5">
          <h3 className="mb-4 text-sm font-black text-offblack">유입 사이트 / 검색어</h3>
          {rep.topReferrers.length === 0 ? (
            <p className="py-8 text-center text-sm text-zinc-400">외부 유입 데이터 없음 (대부분 직접 유입)</p>
          ) : (
            <div className="space-y-2">
              {rep.topReferrers.map((r, i) => (
                <div key={i} className="flex items-center justify-between gap-2 text-xs">
                  {r.keyword
                    ? <span className="min-w-0 truncate font-bold text-accent">🔍 {r.keyword}</span>
                    : <span className="min-w-0 truncate text-zinc-600" title={r.referrer}>{anShortRef(r.referrer)}</span>}
                  <span className="shrink-0 font-bold text-zinc-500">{r.count.toLocaleString()}</span>
                </div>
              ))}
            </div>
          )}
          <p className="mt-3 text-[11px] text-zinc-400">검색어는 검색엔진이 가리는 경우가 많아 추출 가능한 경우만 표시됩니다.</p>
        </Card>

        {/* 디바이스 */}
        <Card className="p-5">
          <h3 className="mb-4 text-sm font-black text-offblack">디바이스 (모바일/PC)</h3>
          <DistributionList items={[
            { label: '모바일', count: cur.device.mobile },
            { label: 'PC', count: cur.device.desktop },
            { label: '태블릿', count: cur.device.tablet },
          ].filter(x => x.count > 0)} />
        </Card>
      </div>
    </div>
  );
}

// AI 검색 노출 섹션 — ChatGPT·Claude 등 AI 봇의 수집 현황 (업체 스코프)
function AiCrawlSection({ ai }) {
  const daily = ai.daily || [];
  const maxDay = Math.max(...daily.map(d => d.count), 1);
  const products = (ai.byProduct || []).map(p => ({ label: p.label, count: p.count }));
  return (
    <Card className="p-5">
      <div className="mb-1 flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-sm font-black text-offblack">🤖 AI 검색 노출 <span className="font-semibold text-zinc-400">(AI 크롤링)</span></h3>
        <span className="text-[11px] text-zinc-400">ChatGPT·Claude 등 AI가 홈페이지를 읽어간 기록</span>
      </div>
      <p className="mb-4 text-xs text-zinc-500">
        AI가 내 사이트를 많이 수집할수록 <b>AI 답변(챗GPT·AI 검색)에 인용될 가능성</b>이 높아집니다. ‘실시간 답변 조회’는 사용자가 AI에게 질문했을 때 AI가 내 사이트를 직접 확인한 횟수입니다.
      </p>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <KpiCard label="AI 수집 합계 (이번 달)" value={(ai.aiTotal ?? 0).toLocaleString()} mom={ai.momPct} />
        <MiniStat label="AI 학습·수집 (크롤러)" value={(ai.byKind?.crawler || 0).toLocaleString()} />
        <MiniStat label="AI 실시간 답변 조회" value={(ai.byKind?.assistant || 0).toLocaleString()} />
        <MiniStat label="기타 봇·도구" value={(ai.byKind?.other || 0).toLocaleString()} />
      </div>

      <div className="mt-4 grid gap-5 lg:grid-cols-2">
        <div>
          <p className="mb-2 text-xs font-bold text-zinc-500">어떤 AI가 다녀갔나</p>
          <DistributionList items={products} />
        </div>
        <div>
          <p className="mb-2 text-xs font-bold text-zinc-500">일별 추이</p>
          {daily.length === 0 ? (
            <p className="py-8 text-center text-sm text-zinc-400">이 달은 아직 AI 방문 기록이 없습니다.</p>
          ) : (
            <div className="flex h-28 items-end gap-0.5">
              {daily.map(d => (
                <div key={d.day} className="flex h-full flex-1 flex-col items-center justify-end" title={`${d.day}: ${d.count}회`}>
                  <div className="w-full rounded-t bg-violet-400" style={{ height: `${(d.count / maxDay) * 100}%`, minHeight: '2px' }} />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}

function DistributionList({ items }) {
  if (!items || items.length === 0) {
    return <p className="py-8 text-center text-sm text-zinc-400">데이터 없음</p>;
  }
  const max = Math.max(...items.map(i => i.count), 1);
  return (
    <div className="space-y-2">
      {items.map((item, i) => (
        <div key={i}>
          <div className="mb-1 flex items-center justify-between text-xs">
            <span className="truncate font-semibold text-zinc-700">{item.label}</span>
            <span className="ml-2 shrink-0 font-bold text-zinc-500">{item.count.toLocaleString()}</span>
          </div>
          <div className="h-1.5 w-full rounded-full bg-zinc-100 overflow-hidden">
            <div className="h-full rounded-full bg-accent" style={{ width: `${(item.count / max) * 100}%` }} />
          </div>
        </div>
      ))}
    </div>
  );
}

// ── 환자(회원) 관리 모듈 ─────────────────────────────────────────────────────

function PatientsModule({ data }) {
  const [tab, setTab] = useState('list');

  return (
    <div className="p-6">
      <div className="mb-4 flex gap-2 border-b border-zinc-200">
        <button
          onClick={() => setTab('list')}
          className={`-mb-px border-b-2 px-4 py-2 text-sm font-semibold ${tab === 'list' ? 'border-zinc-900 text-zinc-900' : 'border-transparent text-zinc-500 hover:text-zinc-700'}`}
        >회원 목록</button>
        <button
          onClick={() => setTab('grades')}
          className={`-mb-px border-b-2 px-4 py-2 text-sm font-semibold ${tab === 'grades' ? 'border-zinc-900 text-zinc-900' : 'border-transparent text-zinc-500 hover:text-zinc-700'}`}
        >등급 관리</button>
        <button
          onClick={() => setTab('fields')}
          className={`-mb-px border-b-2 px-4 py-2 text-sm font-semibold ${tab === 'fields' ? 'border-zinc-900 text-zinc-900' : 'border-transparent text-zinc-500 hover:text-zinc-700'}`}
        >가입 폼 설정</button>
      </div>

      {tab === 'list' ? <PatientsList data={data} /> : tab === 'grades' ? <MemberGradesEditor /> : <PatientFieldsEditor />}
    </div>
  );
}

function PatientsList({ data }) {
  const [patients, setPatients] = useState(data?.patients || []);
  const [search, setSearch] = useState('');
  const [grades, setGrades] = useState([]);
  const [gradeFilter, setGradeFilter] = useState('');
  const [detail, setDetail] = useState(null);
  const [selected, setSelected] = useState(() => new Set());
  const [bulkGrade, setBulkGrade] = useState('');
  const [bulkBusy, setBulkBusy] = useState(false);

  useEffect(() => {
    (async () => {
      const res = await fetch('/api/admin/member-grades', { credentials: 'same-origin' });
      if (res.ok) { const b = await res.json(); setGrades(b.grades || []); }
    })();
  }, []);

  const filtered = patients.filter(p =>
    (!search || p.name.includes(search) || p.email.includes(search) || (p.phone || '').includes(search)) &&
    (!gradeFilter || (p.grade || '') === gradeFilter)
  );

  function gradeColor(name) {
    const g = grades.find(x => x.name === name);
    return g?.color || '';
  }

  async function handleDelete(id) {
    if (!confirm('이 회원을 삭제하시겠습니까?')) return;
    const res = await fetch(`/api/auth/patients?id=${id}`, { method: 'DELETE', credentials: 'same-origin' });
    if (res.ok) setPatients(prev => prev.filter(p => p.id !== id));
  }

  async function setGrade(id, grade) {
    setPatients(prev => prev.map(p => p.id === id ? { ...p, grade } : p));
    const res = await fetch('/api/auth/patients', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'same-origin',
      body: JSON.stringify({ id, grade }),
    });
    if (!res.ok) {
      const b = await res.json().catch(() => ({}));
      alert(b.error || '등급 변경 실패');
    }
  }

  function toggleOne(id) {
    setSelected(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });
  }
  const filteredIds = filtered.map(p => p.id);
  const allChecked = filteredIds.length > 0 && filteredIds.every(id => selected.has(id));
  function toggleAll() {
    setSelected(prev => {
      const n = new Set(prev);
      if (allChecked) filteredIds.forEach(id => n.delete(id));
      else filteredIds.forEach(id => n.add(id));
      return n;
    });
  }

  async function applyBulkGrade() {
    const ids = [...selected];
    if (ids.length === 0) return;
    if (!confirm(`선택한 ${ids.length}명의 등급을 "${bulkGrade || '미지정'}"(으)로 일괄 변경하시겠습니까?`)) return;
    setBulkBusy(true);
    try {
      const res = await fetch('/api/auth/patients', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({ ids, grade: bulkGrade }),
      });
      const b = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(b.error || '일괄 변경 실패');
      const idSet = new Set(ids);
      setPatients(prev => prev.map(p => idSet.has(p.id) ? { ...p, grade: bulkGrade } : p));
      setSelected(new Set());
    } catch (e) {
      alert(e.message);
    } finally {
      setBulkBusy(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm text-zinc-500 shrink-0">총 {filtered.length}명{gradeFilter || search ? ` / ${patients.length}` : ''}</p>
        <div className="flex items-center gap-2">
          {grades.length > 0 && (
            <select
              value={gradeFilter}
              onChange={e => setGradeFilter(e.target.value)}
              className="rounded-lg border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-zinc-900"
            >
              <option value="">전체 등급</option>
              {grades.map(g => <option key={g.id} value={g.name}>{g.name}</option>)}
            </select>
          )}
          <input
            type="text"
            placeholder="이름 · 이메일 · 연락처 검색"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="rounded-lg border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-zinc-900 w-64"
          />
        </div>
      </div>

      {selected.size > 0 && (
        <div className="flex flex-wrap items-center gap-3 rounded-xl border border-zinc-900/15 bg-zinc-50 px-4 py-3">
          <span className="text-sm font-bold text-zinc-900">{selected.size}명 선택됨</span>
          <span className="text-zinc-300">·</span>
          <span className="text-sm text-zinc-500">등급 일괄 변경</span>
          <select
            value={bulkGrade}
            onChange={e => setBulkGrade(e.target.value)}
            className="rounded-lg border border-zinc-200 px-3 py-1.5 text-sm outline-none focus:border-zinc-900"
          >
            <option value="">미지정으로</option>
            {grades.map(g => <option key={g.id} value={g.name}>{g.name}</option>)}
          </select>
          <Btn onClick={applyBulkGrade} size="sm" disabled={bulkBusy}>{bulkBusy ? '적용 중…' : '적용'}</Btn>
          <button onClick={() => setSelected(new Set())} className="text-xs font-semibold text-zinc-400 hover:text-zinc-700">선택 해제</button>
        </div>
      )}

      <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-zinc-100 bg-zinc-50 text-left text-xs font-bold text-zinc-500">
              <th className="px-4 py-3 w-10">
                <input type="checkbox" checked={allChecked} onChange={toggleAll} title="현재 목록 전체 선택" />
              </th>
              <th className="px-4 py-3">이름</th>
              <th className="px-4 py-3">이메일</th>
              <th className="px-4 py-3">연락처</th>
              <th className="px-4 py-3 w-36">등급</th>
              <th className="px-4 py-3">가입일</th>
              <th className="px-4 py-3 w-20"></th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr><td colSpan="7" className="px-4 py-12 text-center text-zinc-400">{patients.length === 0 ? '등록된 회원이 없습니다.' : '조건에 맞는 회원이 없습니다.'}</td></tr>
            ) : (
              filtered.map(p => (
                <tr
                  key={p.id}
                  className={cx('border-b border-zinc-50 cursor-pointer', selected.has(p.id) ? 'bg-zinc-900/[0.04]' : 'hover:bg-zinc-50/50')}
                  onDoubleClick={() => setDetail(p)}
                  title="더블클릭하여 상세 정보 보기/수정"
                >
                  <td className="px-4 py-3" onClick={e => e.stopPropagation()}>
                    <input type="checkbox" checked={selected.has(p.id)} onChange={() => toggleOne(p.id)} />
                  </td>
                  <td className="px-4 py-3 font-semibold text-offblack">{p.name}</td>
                  <td className="px-4 py-3 text-zinc-600">{p.email}</td>
                  <td className="px-4 py-3 text-zinc-600">{p.phone || '-'}</td>
                  <td className="px-4 py-3">
                    {grades.length === 0 ? (
                      <span className="text-xs text-zinc-300">—</span>
                    ) : (
                      <select
                        value={p.grade || ''}
                        onChange={e => setGrade(p.id, e.target.value)}
                        className="rounded-md border border-zinc-200 px-2 py-1 text-xs outline-none focus:border-zinc-900 max-w-[130px]"
                        style={p.grade && gradeColor(p.grade) ? { borderColor: gradeColor(p.grade), color: gradeColor(p.grade), fontWeight: 600 } : undefined}
                      >
                        <option value="">미지정</option>
                        {grades.map(g => <option key={g.id} value={g.name}>{g.name}</option>)}
                      </select>
                    )}
                  </td>
                  <td className="px-4 py-3 text-zinc-400 text-xs">{p.created_at?.slice(0, 10)}</td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => handleDelete(p.id)}
                      className="rounded-md px-2 py-1 text-xs text-red-500 hover:bg-red-50"
                    >
                      삭제
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      <p className="text-xs text-zinc-400">회원을 더블클릭하면 상세 정보를 보고 수정할 수 있습니다.</p>

      {detail && (
        <PatientDetailModal
          member={detail}
          grades={grades}
          onClose={() => setDetail(null)}
          onSaved={(updated) => { setPatients(prev => prev.map(p => p.id === updated.id ? updated : p)); setDetail(null); }}
        />
      )}
    </div>
  );
}

function PatientDetailModal({ member, grades, onClose, onSaved }) {
  const BUILTIN = new Set(['name', 'phone', 'gender', 'address']);
  const [fields, setFields] = useState([]);
  const [form, setForm] = useState(() => {
    let extras = {};
    try { extras = JSON.parse(member.extras || '{}') || {}; } catch { extras = {}; }
    return {
      name: member.name || '', phone: member.phone || '', gender: member.gender || '', address: member.address || '',
      grade: member.grade || '', extras,
    };
  });
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState('');

  useEffect(() => {
    (async () => {
      const r = await fetch('/api/admin/patient-fields', { credentials: 'same-origin' });
      if (r.ok) { const b = await r.json(); setFields((b.fields || []).filter(f => f.enabled)); }
    })();
  }, []);

  function setBuiltin(key, val) { setForm(p => ({ ...p, [key]: val })); }
  function setExtra(key, label, val) { setForm(p => ({ ...p, extras: { ...p.extras, [key]: { label, value: val } } })); }

  function fieldValue(f) {
    const isBuiltin = BUILTIN.has(f.field_key) && !f.is_custom;
    return isBuiltin ? (form[f.field_key] || '') : (form.extras?.[f.field_key]?.value || '');
  }
  function onFieldChange(f, val) {
    const isBuiltin = BUILTIN.has(f.field_key) && !f.is_custom;
    if (isBuiltin) setBuiltin(f.field_key, val); else setExtra(f.field_key, f.label, val);
  }
  function renderInput(f) {
    const value = fieldValue(f);
    const cls = 'w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-zinc-900';
    if (f.field_type === 'select' && f.options) {
      const opts = String(f.options).split('|').map(s => s.trim()).filter(Boolean);
      return (
        <select value={value} onChange={e => onFieldChange(f, e.target.value)} className={cls}>
          <option value="">선택</option>
          {opts.map(o => <option key={o} value={o}>{o}</option>)}
        </select>
      );
    }
    if (f.field_type === 'textarea') {
      return <textarea value={value} onChange={e => onFieldChange(f, e.target.value)} rows={2} className={cls} />;
    }
    const type = f.field_type === 'number' ? 'number' : f.field_type === 'date' ? 'date' : f.field_type === 'tel' ? 'tel' : 'text';
    return <input type={type} value={value} onChange={e => onFieldChange(f, e.target.value)} className={cls} />;
  }

  async function save() {
    if (!form.name.trim()) { setErr('이름을 입력해 주세요.'); return; }
    setSaving(true); setErr('');
    try {
      const body = { id: member.id, name: form.name, phone: form.phone, gender: form.gender, address: form.address, grade: form.grade, extras: form.extras };
      const res = await fetch('/api/auth/patients', {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' }, credentials: 'same-origin',
        body: JSON.stringify(body),
      });
      const d = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(d.error || '저장에 실패했습니다.');
      onSaved({ ...member, name: form.name, phone: form.phone, gender: form.gender, address: form.address, grade: form.grade, extras: JSON.stringify(form.extras) });
    } catch (e) {
      setErr(e.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div className="w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl bg-white p-6 shadow-xl" onClick={e => e.stopPropagation()}>
        <h3 className="text-base font-black text-offblack">회원 정보</h3>
        <p className="mt-1 text-xs text-zinc-400">가입일 {member.created_at?.slice(0, 10) || '-'}</p>
        {err && <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{err}</p>}

        <div className="mt-5 space-y-4">
          <Field label="이메일 (로그인 ID · 변경 불가)">
            <Input value={member.email} disabled />
          </Field>
          {fields.map(f => (
            <Field key={f.field_key} label={f.required ? `${f.label} *` : f.label}>
              {renderInput(f)}
            </Field>
          ))}
          {grades.length > 0 && (
            <Field label="등급">
              <select
                value={form.grade}
                onChange={e => setForm(p => ({ ...p, grade: e.target.value }))}
                className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-zinc-900"
              >
                <option value="">미지정</option>
                {grades.map(g => <option key={g.id} value={g.name}>{g.name}</option>)}
              </select>
            </Field>
          )}
        </div>

        <div className="mt-6 flex justify-end gap-2">
          <Btn onClick={onClose} variant="secondary" size="sm">취소</Btn>
          <Btn onClick={save} size="sm" disabled={saving}>{saving ? '저장 중…' : '저장'}</Btn>
        </div>
      </div>
    </div>
  );
}

function MemberGradesEditor() {
  const [grades, setGrades] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);

  useEffect(() => {
    (async () => {
      const res = await fetch('/api/admin/member-grades', { credentials: 'same-origin' });
      if (res.ok) { const b = await res.json(); setGrades(b.grades || []); }
      setLoading(false);
    })();
  }, []);

  function update(i, patch) { setGrades(prev => prev.map((g, idx) => idx === i ? { ...g, ...patch } : g)); }
  function add() { setGrades(prev => [...prev, { name: '', color: '#2563eb', sort_order: (prev.length + 1) * 10 }]); }
  function remove(i) {
    if (!confirm('이 등급을 삭제하시겠습니까? 이 등급으로 지정된 회원은 미지정으로 바뀝니다.')) return;
    setGrades(prev => prev.filter((_, idx) => idx !== i));
  }
  function move(i, dir) {
    setGrades(prev => { const n = [...prev]; const j = i + dir; if (j < 0 || j >= n.length) return prev; [n[i], n[j]] = [n[j], n[i]]; return n; });
  }

  async function save() {
    setSaving(true); setMessage(null);
    try {
      const res = await fetch('/api/admin/member-grades', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({ grades }),
      });
      const b = await res.json();
      if (!res.ok) throw new Error(b.error || '저장 실패');
      setGrades(b.grades || []);
      setMessage({ type: 'ok', text: '저장되었습니다.' });
    } catch (e) {
      setMessage({ type: 'err', text: e.message });
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <div className="py-12 text-center text-zinc-400">로딩 중...</div>;

  return (
    <div className="space-y-5">
      <div className="rounded-xl border border-zinc-200 bg-white p-5">
        <div className="mb-1 flex items-center justify-between">
          <h3 className="text-sm font-bold text-zinc-900">회원 등급</h3>
          <button onClick={add} className="rounded-lg border border-zinc-300 bg-white px-3 py-1.5 text-xs font-semibold text-zinc-700 hover:bg-zinc-50">+ 등급 추가</button>
        </div>
        <p className="mb-4 text-xs text-zinc-500">업체에서 원하는 회원 등급을 자유롭게 만들 수 있습니다. (예: 정회원 · 준회원 · VIP) <b>회원 목록</b> 탭에서 회원마다 등급을 지정하세요.</p>

        {grades.length === 0 ? (
          <p className="py-6 text-center text-sm text-zinc-400">등급이 없습니다. ‘+ 등급 추가’로 만들어 보세요.</p>
        ) : (
          <div className="space-y-2">
            {grades.map((g, i) => (
              <div key={i} className="flex items-center gap-2 rounded-lg border border-zinc-100 p-2.5">
                <div className="flex flex-col">
                  <button onClick={() => move(i, -1)} disabled={i === 0} className="text-[10px] leading-none text-zinc-400 hover:text-zinc-700 disabled:opacity-30">▲</button>
                  <button onClick={() => move(i, 1)} disabled={i === grades.length - 1} className="text-[10px] leading-none text-zinc-400 hover:text-zinc-700 disabled:opacity-30">▼</button>
                </div>
                <input type="color" value={g.color || '#2563eb'} onChange={e => update(i, { color: e.target.value })} className="h-8 w-9 cursor-pointer rounded border border-zinc-200 bg-white p-0.5" title="등급 색상" />
                <input type="text" value={g.name} onChange={e => update(i, { name: e.target.value })} placeholder="등급 이름 (예: 정회원)" maxLength={30} className="flex-1 rounded-lg border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-zinc-900" />
                <span className="rounded-md px-2.5 py-1 text-xs font-bold" style={{ background: (g.color || '#2563eb') + '22', color: g.color || '#2563eb' }}>{g.name || '미리보기'}</span>
                <button onClick={() => remove(i)} className="rounded-md px-2 py-1 text-xs text-red-500 hover:bg-red-50">삭제</button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="flex items-center gap-3">
        <button onClick={save} disabled={saving} className="rounded-lg bg-zinc-900 px-5 py-2.5 text-sm font-semibold text-white hover:bg-zinc-800 disabled:opacity-50">{saving ? '저장 중...' : '저장'}</button>
        {message && <span className={`text-sm ${message.type === 'ok' ? 'text-green-600' : 'text-red-500'}`}>{message.text}</span>}
      </div>
    </div>
  );
}

function PatientFieldsEditor() {
  const [fields, setFields] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);

  useEffect(() => {
    (async () => {
      const res = await fetch('/api/admin/patient-fields', { credentials: 'same-origin' });
      if (res.ok) {
        const body = await res.json();
        setFields(body.fields || []);
      }
      setLoading(false);
    })();
  }, []);

  function updateField(index, patch) {
    setFields(prev => prev.map((f, i) => i === index ? { ...f, ...patch } : f));
  }

  function addCustomField() {
    setFields(prev => [
      ...prev,
      { field_key: '', label: '', field_type: 'text', is_custom: 1, enabled: 1, required: 0, options: '', display_order: (prev.length + 1) * 10 },
    ]);
  }

  function removeField(index) {
    if (!confirm('이 항목을 삭제하시겠습니까?')) return;
    setFields(prev => prev.filter((_, i) => i !== index));
  }

  function moveField(index, dir) {
    setFields(prev => {
      const next = [...prev];
      const j = index + dir;
      if (j < 0 || j >= next.length) return prev;
      [next[index], next[j]] = [next[j], next[index]];
      return next;
    });
  }

  async function save() {
    setSaving(true);
    setMessage(null);
    try {
      const res = await fetch('/api/admin/patient-fields', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({ fields }),
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error || '저장 실패');
      setFields(body.fields || []);
      setMessage({ type: 'ok', text: '저장되었습니다.' });
    } catch (e) {
      setMessage({ type: 'err', text: e.message });
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <div className="py-12 text-center text-zinc-400">로딩 중...</div>;

  const builtins = fields.filter(f => !f.is_custom);
  const customs = fields.filter(f => f.is_custom);

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-zinc-200 bg-white p-5">
        <h3 className="mb-1 text-sm font-bold text-zinc-900">공통항목</h3>
        <p className="mb-4 text-xs text-zinc-500">이메일과 비밀번호는 로그인 계정으로 항상 필수입니다.</p>
        <div className="rounded-lg border border-zinc-100 bg-zinc-50 px-4 py-3 text-sm text-zinc-600">
          이메일 · 비밀번호 (필수)
        </div>
      </div>

      <div className="rounded-xl border border-zinc-200 bg-white p-5">
        <h3 className="mb-4 text-sm font-bold text-zinc-900">일반회원 항목</h3>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-zinc-100 text-left text-xs font-bold text-zinc-500">
              <th className="pb-2">항목</th>
              <th className="pb-2 w-24 text-center">사용</th>
              <th className="pb-2 w-24 text-center">필수</th>
            </tr>
          </thead>
          <tbody>
            {builtins.map((f, i) => {
              const idx = fields.indexOf(f);
              return (
                <tr key={f.field_key} className="border-b border-zinc-50">
                  <td className="py-3 font-semibold">{f.label}</td>
                  <td className="py-3 text-center">
                    <input type="checkbox" checked={!!f.enabled} onChange={e => updateField(idx, { enabled: e.target.checked ? 1 : 0 })} />
                  </td>
                  <td className="py-3 text-center">
                    <input type="checkbox" checked={!!f.required} disabled={!f.enabled} onChange={e => updateField(idx, { required: e.target.checked ? 1 : 0 })} />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="rounded-xl border border-zinc-200 bg-white p-5">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-sm font-bold text-zinc-900">사용자 정의 항목</h3>
          <button
            onClick={addCustomField}
            className="rounded-lg border border-zinc-300 bg-white px-3 py-1.5 text-xs font-semibold text-zinc-700 hover:bg-zinc-50"
          >+ 항목 추가</button>
        </div>

        {customs.length === 0 ? (
          <p className="py-6 text-center text-sm text-zinc-400">추가된 사용자 정의 항목이 없습니다.</p>
        ) : (
          <div className="space-y-3">
            {customs.map((f) => {
              const idx = fields.indexOf(f);
              return (
                <div key={idx} className="rounded-lg border border-zinc-100 p-3">
                  <div className="flex flex-wrap items-center gap-3">
                    <input
                      type="text"
                      placeholder="항목명"
                      value={f.label}
                      onChange={e => updateField(idx, { label: e.target.value })}
                      className="min-w-0 flex-1 rounded-md border border-zinc-200 px-3 py-1.5 text-sm outline-none focus:border-zinc-900"
                    />
                    <select
                      value={f.field_type}
                      onChange={e => updateField(idx, { field_type: e.target.value })}
                      className="rounded-md border border-zinc-200 px-2 py-1.5 text-sm"
                    >
                      <option value="text">텍스트</option>
                      <option value="tel">전화번호</option>
                      <option value="number">숫자</option>
                      <option value="date">날짜</option>
                      <option value="select">선택</option>
                      <option value="textarea">긴 글</option>
                    </select>
                    <label className="flex items-center gap-1 text-xs text-zinc-600">
                      <input type="checkbox" checked={!!f.enabled} onChange={e => updateField(idx, { enabled: e.target.checked ? 1 : 0 })} />
                      사용
                    </label>
                    <label className="flex items-center gap-1 text-xs text-zinc-600">
                      <input type="checkbox" checked={!!f.required} disabled={!f.enabled} onChange={e => updateField(idx, { required: e.target.checked ? 1 : 0 })} />
                      필수
                    </label>
                    <button onClick={() => moveField(idx, -1)} className="px-2 text-zinc-400 hover:text-zinc-700">▲</button>
                    <button onClick={() => moveField(idx, 1)} className="px-2 text-zinc-400 hover:text-zinc-700">▼</button>
                    <button onClick={() => removeField(idx)} className="px-2 text-red-500 hover:text-red-700 text-xs">삭제</button>
                  </div>
                  {f.field_type === 'select' && (
                    <input
                      type="text"
                      placeholder="선택지 (| 로 구분 — 예: 남자|여자|기타)"
                      value={f.options || ''}
                      onChange={e => updateField(idx, { options: e.target.value })}
                      className="mt-2 w-full rounded-md border border-zinc-200 px-3 py-1.5 text-xs outline-none focus:border-zinc-900"
                    />
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="flex items-center justify-end gap-3">
        {message && (
          <span className={`text-sm ${message.type === 'ok' ? 'text-green-600' : 'text-red-500'}`}>{message.text}</span>
        )}
        <button
          onClick={save}
          disabled={saving}
          className="rounded-lg bg-accent px-5 py-2 text-sm font-semibold text-white hover:bg-zinc-700 disabled:opacity-50"
        >
          {saving ? '저장 중...' : '저장'}
        </button>
      </div>
    </div>
  );
}

// ── 캘린더 · 일정 모듈 (kda21 전용) ──────────────────────────────────────────

const EVENT_COLORS = ['#2563eb', '#059669', '#d97706', '#dc2626', '#7c3aed', '#0891b2', '#475569'];
const CAL_WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토'];
function p2(n) { return String(n).padStart(2, '0'); }
function ymd(y, m, d) { return `${y}-${p2(m)}-${p2(d)}`; }
function calToday() { const d = new Date(); return ymd(d.getFullYear(), d.getMonth() + 1, d.getDate()); }
function emptyEvent(date) {
  return { id: null, title: '', content: '', start_date: date || calToday(), end_date: '', start_time: '', location: '', link_url: '', category: '', color: '#2563eb', is_published: 1 };
}

function CalendarModule({ data }) {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [events, setEvents] = useState(Array.isArray(data?.events) ? data.events : []);
  const [editing, setEditing] = useState(null);
  const [notice, setNotice] = useState({ tone: '', message: '' });
  const [saving, setSaving] = useState(false);

  const reload = useCallback(async () => {
    try {
      const r = await fetch('/api/admin/calendar', { credentials: 'same-origin' });
      const j = await r.json();
      setEvents(Array.isArray(j.events) ? j.events : []);
    } catch { /* noop */ }
  }, []);
  useEffect(() => { reload(); }, [reload]);

  const firstWeekday = new Date(year, month - 1, 1).getDay();
  const daysInMonth = new Date(year, month, 0).getDate();
  const cells = [];
  for (let i = 0; i < firstWeekday; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  function eventsOnDay(d) {
    const day = ymd(year, month, d);
    return events.filter((e) => e.start_date <= day && day <= (e.end_date || e.start_date));
  }
  function gotoMonth(delta) {
    let m = month + delta, y = year;
    if (m < 1) { m = 12; y -= 1; } if (m > 12) { m = 1; y += 1; }
    setMonth(m); setYear(y);
  }

  async function save() {
    if (!editing.title.trim() || !editing.start_date) { setNotice({ tone: 'error', message: '제목과 시작일은 필수입니다.' }); return; }
    setSaving(true); setNotice({ tone: '', message: '' });
    try {
      const r = await fetch('/api/admin/calendar', {
        method: editing.id ? 'PUT' : 'POST', credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(editing),
      });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error || '저장 실패');
      setNotice({ tone: 'success', message: '저장되었습니다.' });
      setEditing(null);
      await reload();
    } catch (e) { setNotice({ tone: 'error', message: e.message }); }
    finally { setSaving(false); }
  }
  async function remove(id) {
    if (!window.confirm('이 일정을 삭제할까요?')) return;
    try {
      const r = await fetch(`/api/admin/calendar?id=${id}`, { method: 'DELETE', credentials: 'same-origin' });
      if (!r.ok) throw new Error('삭제 실패');
      setEditing(null);
      await reload();
    } catch (e) { setNotice({ tone: 'error', message: e.message }); }
  }

  const monthFrom = ymd(year, month, 1), monthTo = ymd(year, month, daysInMonth);
  const monthEvents = events
    .filter((e) => (e.end_date || e.start_date) >= monthFrom && e.start_date <= monthTo)
    .sort((a, b) => (a.start_date + a.start_time).localeCompare(b.start_date + b.start_time));

  return (
    <div className="space-y-5">
      <Card className="flex flex-wrap items-center justify-between gap-3 px-5 py-4">
        <div className="flex items-center gap-2">
          <Btn variant="ghost" size="sm" onClick={() => gotoMonth(-1)}>◀</Btn>
          <span className="min-w-[110px] text-center text-lg font-black text-offblack">{year}년 {month}월</span>
          <Btn variant="ghost" size="sm" onClick={() => gotoMonth(1)}>▶</Btn>
          <Btn variant="secondary" size="sm" onClick={() => { const d = new Date(); setYear(d.getFullYear()); setMonth(d.getMonth() + 1); }}>오늘</Btn>
        </div>
        <Btn variant="primary" size="sm" onClick={() => setEditing(emptyEvent(ymd(year, month, 1)))}>+ 일정 추가</Btn>
      </Card>

      <Notice tone={notice.tone} message={notice.message} />

      <Card className="overflow-hidden">
        <div className="grid grid-cols-7 border-b border-zinc-100 bg-zinc-50 text-center text-xs font-bold text-zinc-500">
          {CAL_WEEKDAYS.map((w, i) => (<div key={w} className={cx('py-2', i === 0 && 'text-red-500', i === 6 && 'text-blue-500')}>{w}</div>))}
        </div>
        <div className="grid grid-cols-7">
          {cells.map((d, i) => {
            if (d === null) return <div key={`b${i}`} className="min-h-[92px] border-b border-r border-zinc-50 bg-zinc-50/40" />;
            const evs = eventsOnDay(d);
            const isToday = ymd(year, month, d) === calToday();
            const col = i % 7;
            return (
              <div key={d} className="min-h-[92px] cursor-pointer border-b border-r border-zinc-50 p-1.5 hover:bg-zinc-50" onClick={() => setEditing(emptyEvent(ymd(year, month, d)))}>
                <div className={cx('mb-1 inline-flex h-5 min-w-[20px] items-center justify-center text-xs font-bold', isToday ? 'rounded-full bg-accent px-1 text-white' : col === 0 ? 'text-red-500' : col === 6 ? 'text-blue-500' : 'text-zinc-500')}>{d}</div>
                <div className="space-y-0.5">
                  {evs.slice(0, 3).map((e) => (
                    <div key={e.id} onClick={(ev) => { ev.stopPropagation(); setEditing(e); }} title={e.title}
                      className="truncate rounded px-1 py-0.5 text-[10px] font-bold text-white" style={{ background: e.color || '#2563eb', opacity: e.is_published ? 1 : 0.45 }}>
                      {e.start_time ? `${e.start_time} ` : ''}{e.title}
                    </div>
                  ))}
                  {evs.length > 3 && <div className="px-1 text-[10px] font-bold text-zinc-400">+{evs.length - 3}</div>}
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      <Card className="p-5">
        <p className="mb-3 text-sm font-black text-offblack">{month}월 일정 ({monthEvents.length})</p>
        {monthEvents.length === 0 ? <p className="text-sm text-zinc-400">등록된 일정이 없습니다. 날짜를 클릭하거나 ‘일정 추가’로 등록하세요.</p> : (
          <ul className="divide-y divide-zinc-100">
            {monthEvents.map((e) => (
              <li key={e.id} className="flex items-center gap-3 py-3">
                <span className="h-3 w-3 shrink-0 rounded-full" style={{ background: e.color || '#2563eb' }} />
                <div className="min-w-0 flex-1">
                  <p className="truncate font-bold text-offblack">{e.title}{!e.is_published && <span className="ml-2 rounded bg-zinc-100 px-1.5 py-0.5 text-[10px] font-bold text-zinc-500">비공개</span>}</p>
                  <p className="truncate text-xs text-zinc-500">{e.start_date}{e.end_date && e.end_date !== e.start_date ? ` ~ ${e.end_date}` : ''}{e.start_time ? ` ${e.start_time}` : ''}{e.location ? ` · ${e.location}` : ''}{e.category ? ` · ${e.category}` : ''}</p>
                </div>
                <Btn variant="ghost" size="sm" onClick={() => setEditing(e)}>수정</Btn>
                <Btn variant="danger" size="sm" onClick={() => remove(e.id)}>삭제</Btn>
              </li>
            ))}
          </ul>
        )}
      </Card>

      {editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => !saving && setEditing(null)}>
          <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-zinc-200 bg-white p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-black text-offblack">{editing.id ? '일정 수정' : '일정 추가'}</h3>
              <Btn variant="ghost" size="sm" onClick={() => setEditing(null)}>✕</Btn>
            </div>
            <div className="space-y-3">
              <Field label="제목 *"><Input value={editing.title} onChange={(e) => setEditing({ ...editing, title: e.target.value })} placeholder="예: 정기 학술대회" /></Field>
              <div className="grid grid-cols-2 gap-3">
                <Field label="시작일 *"><Input type="date" value={editing.start_date} onChange={(e) => setEditing({ ...editing, start_date: e.target.value })} /></Field>
                <Field label="종료일"><Input type="date" value={editing.end_date} onChange={(e) => setEditing({ ...editing, end_date: e.target.value })} /></Field>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Field label="시간"><Input type="time" value={editing.start_time} onChange={(e) => setEditing({ ...editing, start_time: e.target.value })} /></Field>
                <Field label="분류"><Input value={editing.category} onChange={(e) => setEditing({ ...editing, category: e.target.value })} placeholder="예: 학술행사" /></Field>
              </div>
              <Field label="장소"><Input value={editing.location} onChange={(e) => setEditing({ ...editing, location: e.target.value })} placeholder="예: 대구 OO컨벤션센터" /></Field>
              <Field label="상세 링크"><Input value={editing.link_url} onChange={(e) => setEditing({ ...editing, link_url: e.target.value })} placeholder="https://..." /></Field>
              <Field label="설명"><Textarea value={editing.content} onChange={(e) => setEditing({ ...editing, content: e.target.value })} rows={3} /></Field>
              <Field label="색상">
                <div className="flex gap-2">
                  {EVENT_COLORS.map((c) => (<button key={c} type="button" onClick={() => setEditing({ ...editing, color: c })} className={cx('h-7 w-7 rounded-full border-2 transition', editing.color === c ? 'border-offblack' : 'border-transparent')} style={{ background: c }} aria-label={c} />))}
                </div>
              </Field>
              <Toggle checked={!!editing.is_published} onChange={(v) => setEditing({ ...editing, is_published: v ? 1 : 0 })} label="홈페이지에 공개" />
            </div>
            <div className="mt-5 flex justify-end gap-2">
              {editing.id && <Btn variant="danger" onClick={() => remove(editing.id)}>삭제</Btn>}
              <Btn variant="secondary" onClick={() => setEditing(null)}>취소</Btn>
              <Btn variant="primary" onClick={save} disabled={saving}>{saving ? '저장 중...' : '저장'}</Btn>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const MODULE_TITLES = {
  dashboard: '대시보드',
  boards: '게시판 관리',
  popups: '팝업 · 배너',
  consult: '상담 문의',
  patients: '회원 관리',
  analytics: '방문 통계',
  calendar: '캘린더 · 일정',
  seo: 'SEO · 업체 정보',
  pages: '디자인 설정',
  domains: '도메인 관리',
};

export default function HospitalCMSWorkspace({ session, hospital, activeModule: initialModule, initialData, impersonatedBy }) {
  const [activeModule, setActiveModule] = useState(initialModule || 'dashboard');
  const [moduleData, setModuleData] = useState(initialData || {});
  const [loading, setLoading] = useState(false);

  const handleNav = useCallback(async (moduleId) => {
    if (moduleId === activeModule) return;
    setActiveModule(moduleId);
    setLoading(true);

    // URL 업데이트 (히스토리 없이)
    const params = new URLSearchParams(window.location.search);
    params.set('module', moduleId);
    window.history.replaceState(null, '', `/admin?${params.toString()}`);

    try {
      // 모듈 데이터를 서버에서 받아오는 API는 개별 API를 호출
      let data = {};
      if (moduleId === 'dashboard') {
        const [c, b, p, rc] = await Promise.all([
          fetch('/api/consult?limit=1', { credentials: 'same-origin' }).then(r => r.json()).catch(() => []),
          fetch('/api/board?type=all', { credentials: 'same-origin' }).then(r => r.json()).catch(() => []),
          fetch('/api/settings?type=popup&includeInactive=1', { credentials: 'same-origin' }).then(r => r.json()).catch(() => []),
          fetch('/api/consult?limit=8', { credentials: 'same-origin' }).then(r => r.json()).catch(() => []),
        ]);
        data = { consultCount: Array.isArray(c) ? c.length : 0, boardCount: Array.isArray(b) ? b.length : 0, popupCount: Array.isArray(p) ? p.length : 0, recentConsults: Array.isArray(rc) ? rc : [] };
      } else if (moduleId === 'consult') {
        const r = await fetch('/api/consult', { credentials: 'same-origin' });
        data = { consultations: r.ok ? await r.json() : [] };
      } else if (moduleId === 'boards') {
        const [boards, boardGroups] = await Promise.all([
          fetch('/api/board?type=all&includeDrafts=1', { credentials: 'same-origin' }).then(r => r.json()).catch(() => []),
          fetch('/api/board-group?includeInactive=1', { credentials: 'same-origin' }).then(r => r.json()).catch(() => []),
        ]);
        data = { boards, boardGroups };
      } else if (moduleId === 'popups') {
        const r = await fetch('/api/settings?type=popup&includeInactive=1', { credentials: 'same-origin' });
        data = { popups: r.ok ? await r.json() : [] };
      } else if (moduleId === 'calendar') {
        const r = await fetch('/api/admin/calendar', { credentials: 'same-origin' });
        const j = r.ok ? await r.json() : { events: [] };
        data = { events: Array.isArray(j.events) ? j.events : [] };
      } else if (moduleId === 'seo') {
        const [geo, seoList, snippets, doctors] = await Promise.all([
          fetch('/api/settings?type=geo', { credentials: 'same-origin' }).then(r => r.json()).catch(() => ({})),
          fetch('/api/settings?type=seo', { credentials: 'same-origin' }).then(r => r.json()).catch(() => []),
          fetch('/api/settings?type=snippets', { credentials: 'same-origin' }).then(r => r.json()).catch(() => ({})),
          fetch('/api/settings?type=doctors', { credentials: 'same-origin' }).then(r => r.json()).catch(() => []),
        ]);
        data = { geo, seoList, snippets, doctors };
      } else if (moduleId === 'patients') {
        const r = await fetch('/api/auth/patients', { credentials: 'same-origin' });
        data = { patients: r.ok ? await r.json() : [] };
      } else if (moduleId === 'analytics') {
        const r = await fetch('/api/analytics/stats?days=30', { credentials: 'same-origin' });
        data = { stats: r.ok ? await r.json() : null };
      } else if (moduleId === 'domains') {
        const r = await fetch('/api/admin/domains', { credentials: 'same-origin' });
        data = { domains: r.ok ? await r.json() : [] };
      } else if (moduleId === 'pages') {
        const r = await fetch('/api/pages', { credentials: 'same-origin' });
        const all = r.ok ? await r.json() : [];
        data = {
          pages: Array.isArray(all) ? all.filter(p => !['_header', '_footer'].includes(p.slug)) : [],
          layouts: Array.isArray(all) ? all.filter(p => ['_header', '_footer'].includes(p.slug)) : [],
        };
      }
      setModuleData(data);
    } finally {
      setLoading(false);
    }
  }, [activeModule]);

  return (
    <AdminShell
      session={session}
      hospitalName={hospital?.name || session?.displayName}
      activeModule={activeModule}
      onModuleChange={handleNav}
      impersonatedBy={impersonatedBy}
      currentHospitalId={hospital?.id}
    >
      <PageHeader title={MODULE_TITLES[activeModule] || activeModule} subtitle={hospital?.name} />

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-zinc-200 border-t-accent" />
        </div>
      ) : (
        <>
          {activeModule === 'dashboard' && <DashboardModule data={moduleData} hospital={hospital} onNav={handleNav} />}
          {activeModule === 'consult' && <ConsultModule data={moduleData} />}
          {activeModule === 'patients' && <PatientsModule data={moduleData} />}
          {activeModule === 'analytics' && <AnalyticsModule data={moduleData} />}
          {activeModule === 'boards' && <BoardsModule data={moduleData} />}
          {activeModule === 'popups' && <PopupModule data={moduleData} />}
          {activeModule === 'calendar' && <CalendarModule data={moduleData} />}
          {activeModule === 'seo' && <SEOModule data={moduleData} />}
          {activeModule === 'pages' && <PagesModule data={moduleData} hospitalName={hospital?.name || session?.displayName} hospitalId={hospital?.id} />}
          {activeModule === 'domains' && <DomainsModule data={moduleData} session={session} hospital={hospital} />}
        </>
      )}
    </AdminShell>
  );
}
