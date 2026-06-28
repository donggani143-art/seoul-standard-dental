'use client';

import { useEffect, useRef, useState } from 'react';
import AdminShell from './AdminShell';
import SalesWorkspace from './SalesWorkspace';

// ── UI 공통 컴포넌트 ──────────────────────────────────────────────────────────

function PageHeader({ title, description, action }) {
  return (
    <div className="flex items-start justify-between border-b border-zinc-200 bg-white px-6 py-5">
      <div>
        <h1 className="text-xl font-black tracking-tight text-offblack">{title}</h1>
        {description && <p className="mt-1 text-sm text-zinc-500">{description}</p>}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}

function Card({ children, className = '' }) {
  return (
    <div className={`rounded-2xl border border-zinc-200 bg-white shadow-sm ${className}`}>
      {children}
    </div>
  );
}

function cx(...classes) {
  return classes.filter(Boolean).join(' ');
}

function Textarea({ value, onChange, rows = 3, placeholder = '', disabled = false, ...props }) {
  return (
    <textarea
      {...props}
      value={value ?? ''}
      onChange={onChange}
      rows={rows}
      placeholder={placeholder}
      disabled={disabled}
      className="w-full rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm outline-none transition focus:border-zinc-900 focus:bg-white disabled:bg-zinc-100"
    />
  );
}

function Field({ label, children, className = '' }) {
  return (
    <label className={cx('grid gap-1.5 text-sm font-semibold text-zinc-700', className)}>
      <span>{label}</span>
      {children}
    </label>
  );
}

function Input({ value, onChange, ...props }) {
  // 한글 IME 조합 중 중복 입력 방지
  const composingRef = useRef(false);
  const [local, setLocal] = useState(value ?? '');

  useEffect(() => {
    if (!composingRef.current) setLocal(value ?? '');
  }, [value]);

  return (
    <input
      {...props}
      value={local}
      onCompositionStart={() => { composingRef.current = true; }}
      onCompositionEnd={(e) => {
        composingRef.current = false;
        setLocal(e.target.value);
        onChange?.({ ...e, target: e.target });
      }}
      onChange={(e) => {
        setLocal(e.target.value);
        if (!composingRef.current) onChange?.(e);
      }}
      className="rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2.5 text-sm font-medium outline-none transition focus:border-zinc-900 focus:bg-white"
    />
  );
}

function SelectField({ children, className = '', ...props }) {
  return (
    <select
      {...props}
      className={`rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2.5 text-sm font-medium outline-none transition focus:border-zinc-900 focus:bg-white ${className}`}
    >
      {children}
    </select>
  );
}

function Btn({ children, variant = 'primary', loading, className = '', ...props }) {
  const base = 'inline-flex items-center justify-center rounded-xl px-4 py-2.5 text-sm font-bold transition disabled:opacity-60 disabled:cursor-wait';
  const variants = {
    primary: 'bg-accent text-white hover:bg-accent-hover',
    accent:  'bg-accent text-white hover:bg-zinc-700',
    ghost:   'bg-zinc-100 text-zinc-700 hover:bg-zinc-200',
  };
  return (
    <button
      {...props}
      disabled={loading || props.disabled}
      className={`${base} ${variants[variant] ?? variants.primary} ${className}`}
    >
      {loading ? '처리 중...' : children}
    </button>
  );
}

function Notice({ tone = 'idle', message }) {
  if (!message) return null;
  const styles = {
    info:    'bg-sky-50 border-sky-200 text-sky-700',
    success: 'bg-emerald-50 border-emerald-200 text-emerald-700',
    error:   'bg-red-50 border-red-200 text-red-700',
    idle:    'bg-zinc-50 border-zinc-200 text-zinc-500',
  };
  return (
    <div className={`rounded-xl border px-4 py-3 text-sm font-semibold ${styles[tone] ?? styles.idle}`}>
      {message}
    </div>
  );
}

// 상태 뱃지 — 그룹웨어 스타일 아웃라인 칩 (Metalink_Css 기준)
function Badge({ tone = 'zinc', children }) {
  const colors = {
    green:  'border-[#27ae60] text-[#27ae60]',
    amber:  'border-amber-400 text-amber-600',
    accent: 'border-zinc-400 text-zinc-700',
    zinc:   'border-zinc-300 text-zinc-500',
  };
  return (
    <span className={`inline-flex items-center rounded border px-2 py-0.5 text-[11px] font-semibold ${colors[tone] ?? colors.zinc}`}>
      {children}
    </span>
  );
}

function EmptyRow({ cols, message }) {
  return (
    <tr>
      <td colSpan={cols} className="border-b border-line py-12 text-center text-[13px] text-zinc-400">
        {message}
      </td>
    </tr>
  );
}

function TableWrapper({ children }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse">{children}</table>
    </div>
  );
}

// 표 헤더 셀 — 회색 배경 + 상하 보더 + 가운데 정렬
function Th({ children, right }) {
  return (
    <th className={`whitespace-nowrap border-y border-line bg-zinc-100 px-3 py-3 text-[13px] font-bold text-zinc-600 ${right ? 'text-right' : 'text-center'}`}>
      {children}
    </th>
  );
}

// 표 본문 셀 — 하단 보더 + 가운데 정렬
function Td({ children, mono, right, muted }) {
  return (
    <td className={`border-b border-line px-3 py-3.5 text-[13px] ${mono ? 'font-mono ' : ''}${right ? 'text-right' : 'text-center'} ${muted ? 'text-zinc-500' : 'text-zinc-800'} font-medium`}>
      {children}
    </td>
  );
}

// ── HospitalsModule ───────────────────────────────────────────────────────────

const TEMPLATE_OPTIONS = [
  { key: 'light', name: '라이트', description: '뎁스 10 · 병원소개·진료안내·커뮤니티 (클린 메디컬)' },
  { key: 'basic', name: '베이직', description: '뎁스 20 · 라이트 확장형 (준비 중)' },
];

function HospitalsModule({ hospitals: initial }) {
  const [hospitals, setHospitals] = useState(initial || []);
  const [form, setForm] = useState({ name: '', slug: '', template: 'light' });
  const [loading, setLoading] = useState(false);
  const [notice, setNotice] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({ name: '', slug: '', site_status: 'active' });
  const [modalOpen, setModalOpen] = useState(false);

  function openCreate() {
    setEditingId(null);
    setForm({ name: '', slug: '', template: 'light' });
    setNotice(null);
    setModalOpen(true);
  }
  function openEdit(h) {
    setEditingId(h.id);
    setEditForm({ name: h.name, slug: h.slug, site_status: h.site_status || 'active' });
    setNotice(null);
    setModalOpen(true);
  }
  function closeModal() {
    setModalOpen(false);
    setEditingId(null);
  }

  async function saveEdit(id) {
    try {
      const res = await fetch('/api/admin/hospitals', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({ id, ...editForm }),
      });
      const data = await res.json();
      if (!res.ok || data.error) throw new Error(data.error);
      setHospitals(p => p.map(h => h.id === id ? { ...h, ...data.hospital } : h));
      setEditingId(null);
      setModalOpen(false);
      setNotice({ tone: 'success', message: '업체 정보가 수정되었습니다.' });
    } catch (err) {
      setNotice({ tone: 'error', message: err.message });
    }
  }

  async function deleteHospital(id, name) {
    if (!confirm(`"${name}" 업체를 삭제하시겠습니까?\n연결된 계정/도메인이 있으면 삭제가 거부됩니다.`)) return;
    try {
      const res = await fetch(`/api/admin/hospitals?id=${id}`, { method: 'DELETE', credentials: 'same-origin' });
      const data = await res.json();
      if (!res.ok || data.error) {
        if (confirm(`${data.error}\n\n전체 데이터(계정/도메인/페이지/상담 등)를 모두 삭제하시겠습니까? (복구 불가)`)) {
          const res2 = await fetch(`/api/admin/hospitals?id=${id}&cascade=1`, { method: 'DELETE', credentials: 'same-origin' });
          const d2 = await res2.json();
          if (!res2.ok || d2.error) throw new Error(d2.error || '삭제 실패');
        } else return;
      }
      setHospitals(p => p.filter(h => h.id !== id));
      setNotice({ tone: 'success', message: '업체가 삭제되었습니다.' });
    } catch (err) {
      setNotice({ tone: 'error', message: err.message });
    }
  }

  function set(key) {
    return (e) => setForm((p) => ({ ...p, [key]: e.target.value }));
  }

  async function handleCreate(e) {
    e.preventDefault();
    setLoading(true);
    setNotice(null);
    try {
      const res = await fetch('/api/admin/hospitals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
        credentials: 'same-origin',
      });
      const data = await res.json();
      if (!res.ok || data.error) throw new Error(data.error || '오류가 발생했습니다.');
      setHospitals((p) => [...p, { ...data.hospital, domain_count: 0, account_count: 0 }]);
      setForm({ name: '', slug: '', template: 'light' });
      setModalOpen(false);
      setNotice({ tone: 'success', message: `${data.hospital.name} 업체가 생성되었습니다.` });
    } catch (err) {
      setNotice({ tone: 'error', message: err.message });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col">
      <PageHeader
        title="업체 관리"
        description="새 업체를 등록하고 현황을 확인합니다."
        action={
          <button
            onClick={openCreate}
            className="rounded-lg bg-[#2c2c2c] px-4 py-2.5 text-sm font-bold text-white transition hover:bg-black"
          >
            + 업체 등록
          </button>
        }
      />
      <div className="space-y-4 p-6">
        {notice && <Notice tone={notice.tone} message={notice.message} />}

        <Card>
          <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-100">
            <h2 className="font-black text-offblack">
              등록된 업체
              <span className="ml-2 text-sm font-semibold text-zinc-400">{hospitals.length}개</span>
            </h2>
          </div>
          <TableWrapper>
            <thead>
              <tr>
                <Th>업체명</Th>
                <Th>슬러그</Th>
                <Th>상태</Th>
                <Th right>도메인</Th>
                <Th right>계정</Th>
                <Th right>관리</Th>
              </tr>
            </thead>
            <tbody>
              {hospitals.length === 0 ? (
                <EmptyRow cols={6} message="등록된 업체가 없습니다." />
              ) : hospitals.map((h) => (
                <tr
                  key={h.id}
                  onDoubleClick={() => openEdit(h)}
                  className="cursor-pointer hover:bg-zinc-50"
                >
                  <Td>{h.name}</Td>
                  <Td muted>{h.slug}</Td>
                  <td className="border-b border-line px-3 py-3.5 text-center">
                    <Badge tone={h.status === 'active' ? 'green' : 'zinc'}>{h.status}</Badge>
                  </td>
                  <Td right muted>{h.domain_count ?? 0}</Td>
                  <Td right muted>{h.account_count ?? 0}</Td>
                  <td className="border-b border-line px-3 py-3.5 text-center whitespace-nowrap">
                    <button onClick={() => openEdit(h)} className="mr-3 text-xs font-bold text-zinc-900 hover:underline">수정</button>
                    <button onClick={() => deleteHospital(h.id, h.name)} className="text-xs font-bold text-red-500 hover:underline">삭제</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </TableWrapper>
          <p className="flex items-center gap-2 px-5 py-3 text-xs text-zinc-400">
            <span className="inline-flex h-3.5 w-3.5 items-center justify-center rounded-full bg-accent text-[9px] font-bold text-white">i</span>
            행을 더블클릭하면 업체 정보를 수정할 수 있습니다.
          </p>
        </Card>
      </div>

      {/* ── 업체 등록/수정 모달 ── */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={closeModal}>
          <div
            className="w-full max-w-md max-h-[90vh] overflow-y-auto rounded-2xl bg-white shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-black/20 bg-[#3a3a3a] px-5 py-4">
              <h3 className="text-[15px] font-bold text-white">{editingId ? '업체 수정' : '업체 생성'}</h3>
              <button onClick={closeModal} className="text-white/70 hover:text-white" aria-label="닫기">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>

            {editingId ? (
              <form onSubmit={(e) => { e.preventDefault(); saveEdit(editingId); }} className="space-y-3 p-5">
                <Field label="업체명">
                  <Input value={editForm.name} onChange={e => setEditForm(p => ({ ...p, name: e.target.value }))} required />
                </Field>
                <Field label="슬러그 (영문)">
                  <Input value={editForm.slug} onChange={e => setEditForm(p => ({ ...p, slug: e.target.value }))} required />
                </Field>
                <Field label="사이트 상태">
                  <SelectField value={editForm.site_status} onChange={e => setEditForm(p => ({ ...p, site_status: e.target.value }))}>
                    <option value="active">active</option>
                    <option value="draft">draft</option>
                  </SelectField>
                </Field>
                <div className="flex justify-end gap-2 pt-2">
                  <button type="button" onClick={closeModal} className="rounded-lg border border-zinc-300 bg-white px-4 py-2.5 text-sm font-bold text-zinc-700 hover:bg-zinc-50">취소</button>
                  <button type="submit" className="rounded-lg bg-[#2c2c2c] px-4 py-2.5 text-sm font-bold text-white hover:bg-black">수정</button>
                </div>
              </form>
            ) : (
              <form onSubmit={handleCreate} className="space-y-3 p-5">
                <Field label="업체명">
                  <Input value={form.name} onChange={set('name')} placeholder="예: 서울하이치과" required />
                </Field>
                <Field label="슬러그 (영문)">
                  <Input value={form.slug} onChange={set('slug')} placeholder="seoul-high-dental" required />
                </Field>
                <Field label="초기 템플릿">
                  <div className="grid grid-cols-1 gap-2">
                    {TEMPLATE_OPTIONS.map(t => (
                      <label key={t.key} className={`flex items-start gap-3 cursor-pointer rounded-lg border p-3 transition ${form.template === t.key ? 'border-zinc-900 bg-zinc-100' : 'border-zinc-200 hover:border-zinc-300'}`}>
                        <input
                          type="radio"
                          name="template"
                          value={t.key}
                          checked={form.template === t.key}
                          onChange={(e) => setForm(p => ({ ...p, template: e.target.value }))}
                          className="mt-0.5 accent-zinc-900"
                        />
                        <div>
                          <p className="text-sm font-bold text-offblack">{t.name}</p>
                          <p className="text-xs text-zinc-500 mt-0.5">{t.description}</p>
                        </div>
                      </label>
                    ))}
                  </div>
                </Field>
                <div className="flex justify-end gap-2 pt-2">
                  <button type="button" onClick={closeModal} className="rounded-lg border border-zinc-300 bg-white px-4 py-2.5 text-sm font-bold text-zinc-700 hover:bg-zinc-50">취소</button>
                  <Btn type="submit" loading={loading}>업체 생성</Btn>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ── AccountsModule ────────────────────────────────────────────────────────────

function AccountsModule({ accounts: initial, hospitals }) {
  const [accounts, setAccounts] = useState(initial || []);
  const [form, setForm] = useState({
    email: '', displayName: '', password: '', role: 'hospital_admin', hospitalId: '',
  });
  const [loading, setLoading] = useState(false);
  const [notice, setNotice] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);

  function openCreate() {
    setForm({ email: '', displayName: '', password: '', role: 'hospital_admin', hospitalId: '' });
    setNotice(null);
    setModalOpen(true);
  }
  function closeModal() { setModalOpen(false); }

  function set(key) {
    return (e) => setForm((p) => ({ ...p, [key]: e.target.value }));
  }

  async function handleCreate(e) {
    e.preventDefault();
    setLoading(true);
    setNotice(null);
    try {
      // hospital_admin만 hospitalId 필수, super_admin/reseller는 null
      const payload = {
        ...form,
        hospitalId: form.role === 'hospital_admin' ? Number(form.hospitalId || 0) : null,
      };
      const res = await fetch('/api/admin/accounts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        credentials: 'same-origin',
      });
      const data = await res.json();
      if (!res.ok || data.error) throw new Error(data.error || '오류가 발생했습니다.');
      const hospital = hospitals.find((h) => h.id === data.account.hospital_id);
      setAccounts((p) => [...p, { ...data.account, hospital_name: hospital?.name ?? null }]);
      setForm({ email: '', displayName: '', password: '', role: 'hospital_admin', hospitalId: '' });
      setModalOpen(false);
      setNotice({ tone: 'success', message: `${data.account.display_name} 계정이 생성되었습니다.` });
    } catch (err) {
      setNotice({ tone: 'error', message: err.message });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col">
      <PageHeader
        title="계정 관리"
        description="업체 관리자 계정을 추가하고 현황을 확인합니다."
        action={
          <button
            onClick={openCreate}
            className="rounded-lg bg-[#2c2c2c] px-4 py-2.5 text-sm font-bold text-white transition hover:bg-black"
          >
            + 계정 생성
          </button>
        }
      />
      <div className="space-y-4 p-6">
        {notice && <Notice tone={notice.tone} message={notice.message} />}

        <Card>
          <div className="px-5 py-4 border-b border-zinc-100">
            <h2 className="font-black text-offblack">
              계정 목록
              <span className="ml-2 text-sm font-semibold text-zinc-400">{accounts.length}개</span>
            </h2>
          </div>
          <TableWrapper>
            <thead>
              <tr>
                <Th>이름</Th>
                <Th>이메일</Th>
                <Th>권한</Th>
                <Th>소속 업체</Th>
                <Th>상태</Th>
              </tr>
            </thead>
            <tbody>
              {accounts.length === 0 ? (
                <EmptyRow cols={5} message="등록된 계정이 없습니다." />
              ) : accounts.map((a) => (
                <tr key={a.id} className="hover:bg-zinc-50">
                  <Td>{a.display_name}</Td>
                  <Td muted>{a.email}</Td>
                  <td className="border-b border-line px-3 py-3.5 text-center">
                    <Badge tone={a.role === 'super_admin' ? 'accent' : a.role === 'reseller' ? 'amber' : 'green'}>
                      {a.role === 'super_admin' ? '슈퍼관리자' : a.role === 'reseller' ? '리셀러' : '업체 관리자'}
                    </Badge>
                  </td>
                  <Td muted>{a.role === 'reseller' ? '—' : (a.hospital_name ?? '—')}</Td>
                  <td className="border-b border-line px-3 py-3.5 text-center">
                    <Badge tone={a.status === 'active' ? 'green' : 'zinc'}>{a.status ?? 'active'}</Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </TableWrapper>
        </Card>
      </div>

      {/* ── 계정 생성 모달 ── */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={closeModal}>
          <div className="w-full max-w-md max-h-[90vh] overflow-y-auto rounded-2xl bg-white shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-black/20 bg-[#3a3a3a] px-5 py-4">
              <h3 className="text-[15px] font-bold text-white">계정 생성</h3>
              <button onClick={closeModal} className="text-white/70 hover:text-white" aria-label="닫기">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>
            <form onSubmit={handleCreate} className="space-y-3 p-5">
              <Field label="이메일">
                <Input type="email" value={form.email} onChange={set('email')} placeholder="admin@hospital.com" required />
              </Field>
              <Field label="이름">
                <Input value={form.displayName} onChange={set('displayName')} placeholder="홍길동" required />
              </Field>
              <Field label="초기 비밀번호">
                <Input type="password" value={form.password} onChange={set('password')} placeholder="초기 비밀번호" required />
              </Field>
              <Field label="권한">
                <SelectField value={form.role} onChange={set('role')}>
                  <option value="hospital_admin">업체 관리자</option>
                  <option value="reseller">리셀러</option>
                  <option value="super_admin">슈퍼관리자</option>
                </SelectField>
              </Field>
              {form.role === 'hospital_admin' && (
                <Field label="소속 업체">
                  <SelectField value={form.hospitalId} onChange={set('hospitalId')}>
                    <option value="">업체 선택</option>
                    {hospitals.map((h) => (
                      <option key={h.id} value={h.id}>{h.name}</option>
                    ))}
                  </SelectField>
                </Field>
              )}
              {form.role === 'reseller' && (
                <p className="rounded-lg bg-zinc-50 px-3 py-2 text-xs text-zinc-500">
                  리셀러는 계정 생성 후 <strong className="text-zinc-700">"리셀러 관리"</strong> 메뉴에서 담당 업체를 배정해 주세요.
                </p>
              )}
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={closeModal} className="rounded-lg border border-zinc-300 bg-white px-4 py-2.5 text-sm font-bold text-zinc-700 hover:bg-zinc-50">취소</button>
                <Btn type="submit" loading={loading}>계정 생성</Btn>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// ── DomainsModule ─────────────────────────────────────────────────────────────

function DomainsModule({ domains: initial, hospitals }) {
  const [domains, setDomains] = useState(initial || []);
  const [form, setForm] = useState({ hospitalId: '', domain: '', isPrimary: true });
  const [loading, setLoading] = useState(false);
  const [notice, setNotice] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);

  function openCreate() {
    setForm({ hospitalId: '', domain: '', isPrimary: true });
    setNotice(null);
    setModalOpen(true);
  }
  function closeModal() { setModalOpen(false); }

  function set(key) {
    return (e) => setForm((p) => ({ ...p, [key]: e.target.value }));
  }

  async function handleCreate(e) {
    e.preventDefault();
    setLoading(true);
    setNotice(null);
    try {
      const res = await fetch('/api/admin/domains', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          hospitalId: Number(form.hospitalId || 0),
          domain: form.domain,
          isPrimary: form.isPrimary,
        }),
        credentials: 'same-origin',
      });
      const data = await res.json();
      if (!res.ok || data.error) throw new Error(data.error || '오류가 발생했습니다.');
      const hospital = hospitals.find((h) => h.id === data.domain.hospital_id);
      setDomains((p) => [...p, { ...data.domain, hospital_name: hospital?.name ?? null }]);
      setForm({ hospitalId: '', domain: '', isPrimary: true });
      setModalOpen(false);
      setNotice({ tone: 'success', message: `${data.domain.domain} 도메인이 등록되었습니다.` });
    } catch (err) {
      setNotice({ tone: 'error', message: err.message });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col">
      <PageHeader
        title="도메인 관리"
        description="업체별 도메인을 등록하고 연결 상태를 확인합니다."
        action={
          <button
            onClick={openCreate}
            className="rounded-lg bg-[#2c2c2c] px-4 py-2.5 text-sm font-bold text-white transition hover:bg-black"
          >
            + 도메인 등록
          </button>
        }
      />
      <div className="space-y-4 p-6">
        {notice && <Notice tone={notice.tone} message={notice.message} />}

        <Card>
          <div className="px-5 py-4 border-b border-zinc-100">
            <h2 className="font-black text-offblack">
              도메인 목록
              <span className="ml-2 text-sm font-semibold text-zinc-400">{domains.length}개</span>
            </h2>
          </div>
          <TableWrapper>
            <thead>
              <tr>
                <Th>도메인</Th>
                <Th>업체</Th>
                <Th>연결 상태</Th>
                <Th>SSL</Th>
                <Th>구분</Th>
              </tr>
            </thead>
            <tbody>
              {domains.length === 0 ? (
                <EmptyRow cols={5} message="등록된 도메인이 없습니다." />
              ) : domains.map((d) => (
                <tr key={d.id} className="hover:bg-zinc-50">
                  <td className="border-b border-line px-3 py-3.5 text-center font-mono text-[13px] font-semibold text-zinc-800">{d.domain}</td>
                  <Td muted>{d.hospital_name ?? '—'}</Td>
                  <td className="border-b border-line px-3 py-3.5 text-center">
                    <Badge tone={d.status === 'connected' ? 'green' : 'amber'}>{d.status}</Badge>
                  </td>
                  <td className="border-b border-line px-3 py-3.5 text-center">
                    <Badge tone={d.ssl_status === 'active' ? 'green' : 'zinc'}>{d.ssl_status ?? 'none'}</Badge>
                  </td>
                  <Td muted>{d.is_primary ? '대표' : '추가'}</Td>
                </tr>
              ))}
            </tbody>
          </TableWrapper>
        </Card>
      </div>

      {/* ── 도메인 등록 모달 ── */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={closeModal}>
          <div className="w-full max-w-md max-h-[90vh] overflow-y-auto rounded-2xl bg-white shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-black/20 bg-[#3a3a3a] px-5 py-4">
              <h3 className="text-[15px] font-bold text-white">도메인 등록</h3>
              <button onClick={closeModal} className="text-white/70 hover:text-white" aria-label="닫기">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>
            <form onSubmit={handleCreate} className="space-y-3 p-5">
              <Field label="업체">
                <SelectField value={form.hospitalId} onChange={set('hospitalId')} required>
                  <option value="">업체 선택</option>
                  {hospitals.map((h) => (
                    <option key={h.id} value={h.id}>{h.name}</option>
                  ))}
                </SelectField>
              </Field>
              <Field label="도메인">
                <Input value={form.domain} onChange={set('domain')} placeholder="clinic.example.com" required />
              </Field>
              <label className="flex cursor-pointer items-center gap-2 text-sm font-semibold text-zinc-700">
                <input
                  type="checkbox"
                  checked={form.isPrimary}
                  onChange={(e) => setForm((p) => ({ ...p, isPrimary: e.target.checked }))}
                  className="h-4 w-4 accent-zinc-900"
                />
                대표 도메인으로 설정
              </label>
              <div className="rounded-xl bg-zinc-50 p-3 text-xs text-zinc-500 space-y-1 border border-zinc-100">
                <p className="font-bold text-zinc-600">DNS 설정 안내</p>
                <p>도메인 DNS A 레코드를 서버 IP로 설정 후 등록하세요.</p>
                <p className="font-mono font-bold text-zinc-700">172.235.202.109</p>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={closeModal} className="rounded-lg border border-zinc-300 bg-white px-4 py-2.5 text-sm font-bold text-zinc-700 hover:bg-zinc-50">취소</button>
                <Btn type="submit" loading={loading}>도메인 등록</Btn>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// ── AiCrawlsModule (슈퍼관리자 전용 AI 크롤링 통계) ───────────────────────────

function aiReportMonths(n = 12) {
  const out = [];
  const d = new Date();
  d.setDate(1);
  for (let i = 0; i < n; i++) {
    out.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);
    d.setMonth(d.getMonth() - 1);
  }
  return out;
}
function aiMonthLabel(m) {
  const [y, mm] = m.split('-');
  return `${y}년 ${Number(mm)}월`;
}
function aiFmtDwell(s) {
  s = Number(s || 0);
  if (s <= 0) return '—';
  const m = Math.floor(s / 60), x = s % 60;
  return m > 0 ? `${m}분 ${x}초` : `${x}초`;
}
function aiMomPct(c, p) {
  c = Number(c || 0); p = Number(p || 0);
  if (p <= 0) return null;
  return Math.round(((c - p) / p) * 1000) / 10;
}
function aiMobilePct(cur) {
  if (!cur || !cur.pv) return 0;
  const mob = cur.device?.mobile || 0;
  return Math.round((mob / cur.pv) * 100);
}
// 전월 대비 배지 (방문 증가=블루 긍정, 감소=레드 주의)
function AiMomBadge({ cur, prev }) {
  const m = aiMomPct(cur, prev);
  if (m === null) return <span className="text-[11px] font-bold text-zinc-300">신규</span>;
  const up = m > 0, flat = m === 0;
  return (
    <span className={`text-[11px] font-black ${flat ? 'text-zinc-400' : up ? 'text-blue-600' : 'text-rose-500'}`}>
      {flat ? '─' : up ? '▲' : '▼'} {Math.abs(m)}%
    </span>
  );
}

function AiCrawlsModule() {
  const [days, setDays] = useState(30);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [reportMonth, setReportMonth] = useState(() => aiReportMonths(1)[0]);
  const [downloading, setDownloading] = useState(false);
  const [visitorMap, setVisitorMap] = useState({});       // { [hospital_id]: {pv, uv, mobilePct} }
  const [visitorSummary, setVisitorSummary] = useState(null); // 플랫폼 전체 월간 방문 요약
  const [visitorLoading, setVisitorLoading] = useState(false);

  async function downloadReport(month, hospitalId) {
    if (downloading) return;
    setDownloading(true);
    setError('');
    try {
      const qs = new URLSearchParams({ month });
      if (hospitalId) qs.set('hospitalId', String(hospitalId));
      const res = await fetch(`/api/admin/ai-crawls/report?${qs.toString()}`, { credentials: 'same-origin' });
      if (!res.ok) {
        const j = await res.json().catch(() => null);
        throw new Error(j?.error || `리포트 생성 실패 (${res.status})`);
      }
      const blob = await res.blob();
      let name = `metalink-ai-crawl-${month}.pdf`;
      const cd = res.headers.get('Content-Disposition') || '';
      const mm = cd.match(/filename\*=UTF-8''([^;]+)/i);
      if (mm) { try { name = decodeURIComponent(mm[1]); } catch { /* keep default */ } }
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = name;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (e) {
      setError(e.message);
    } finally {
      setDownloading(false);
    }
  }

  async function load(d) {
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`/api/admin/ai-crawls?days=${d}`, { credentials: 'same-origin' });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || '불러오기 실패');
      setData(json);
    } catch (e) {
      setError(e.message);
      setData(null);
    } finally {
      setLoading(false);
    }
  }

  // 선택한 달의 방문 통계(업체별 + 플랫폼 요약)를 함께 불러온다.
  async function loadVisitor(month) {
    setVisitorLoading(true);
    try {
      const [byRes, sumRes] = await Promise.all([
        fetch(`/api/admin/analytics/by-hospital?month=${month}`, { credentials: 'same-origin' }),
        fetch(`/api/analytics/stats?month=${month}`, { credentials: 'same-origin' }),
      ]);
      const byJson = await byRes.json().catch(() => null);
      const sumJson = await sumRes.json().catch(() => null);
      setVisitorMap(byRes.ok && byJson?.byHospital ? byJson.byHospital : {});
      setVisitorSummary(sumRes.ok && sumJson?.mode === 'month' ? sumJson : null);
    } catch {
      setVisitorMap({});
      setVisitorSummary(null);
    } finally {
      setVisitorLoading(false);
    }
  }

  useEffect(() => { load(days); }, [days]);
  useEffect(() => { loadVisitor(reportMonth); }, [reportMonth]);

  return (
    <div className="flex flex-col">
      <PageHeader
        title="AI 크롤링 · 방문 통계"
        description="AI 크롤러·봇의 접근(왼쪽)과 실제 방문자(사람) 통계를 한 화면에서 봅니다. 업체별 PDF 버튼은 두 리포트를 합친 통합 PDF를 내려받습니다. 슈퍼관리자 전용."
        action={
          <SelectField value={String(days)} onChange={(e) => setDays(Number(e.target.value))}>
            <option value="7">최근 7일</option>
            <option value="30">최근 30일</option>
            <option value="90">최근 90일</option>
          </SelectField>
        }
      />

      <div className="p-6 space-y-5">
      {error && <Notice tone="error" message={error} />}
      {loading && <Card className="p-8"><p className="text-sm font-semibold text-zinc-400">불러오는 중...</p></Card>}

      {!loading && data && (
        <>
          <Card className="border-accent/30 bg-accent/[0.03] p-5">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <p className="text-sm font-black text-offblack">📄 월간 통합 PDF 리포트 <span className="ml-1 rounded bg-blue-100 px-1.5 py-0.5 text-[10px] font-bold text-blue-700">AI크롤링 + 방문통계</span></p>
                <p className="mt-0.5 text-xs text-zinc-500">선택한 달의 <b>AI 크롤링</b>(전월 대비·AI 제품별 가시성·봇별)과 <b>실제 방문자 통계</b>(PV/UV·모바일·체류시간·유입·많이 본 페이지)를 한 PDF로 내려받습니다. 아래 표의 <b>PDF</b> 버튼은 업체별 통합 리포트로 각 거래처에 전달할 수 있습니다. 월 선택은 아래 방문 지표에도 함께 반영됩니다.</p>
              </div>
              <div className="flex items-center gap-2">
                <SelectField value={reportMonth} onChange={(e) => setReportMonth(e.target.value)} aria-label="리포트 대상 월">
                  {aiReportMonths(12).map((m) => (
                    <option key={m} value={m}>{aiMonthLabel(m)}</option>
                  ))}
                </SelectField>
                <Btn variant="primary" loading={downloading} onClick={() => downloadReport(reportMonth, null)}>
                  플랫폼 전체 리포트
                </Btn>
              </div>
            </div>
          </Card>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Card className="p-4">
              <p className="text-xs font-bold text-zinc-500">총 크롤링</p>
              <p className="mt-1 text-2xl font-black text-offblack">{data.total.toLocaleString()}</p>
            </Card>
            <Card className="p-4">
              <p className="text-xs font-bold text-zinc-500">업체 수</p>
              <p className="mt-1 text-2xl font-black text-offblack">{data.hospitals.length}</p>
            </Card>
            <Card className="p-4">
              <p className="text-xs font-bold text-zinc-500">봇 종류</p>
              <p className="mt-1 text-2xl font-black text-offblack">{data.byBot.length}</p>
            </Card>
            <Card className="p-4">
              <p className="text-xs font-bold text-zinc-500">기간</p>
              <p className="mt-1 text-2xl font-black text-offblack">{data.days}일</p>
            </Card>
          </div>

          {/* 방문 통계 (실제 방문자) — 선택한 월 기준 */}
          <Card className="border-blue-200/70 bg-blue-50/40 p-5">
            <div className="mb-3 flex items-center justify-between">
              <p className="text-sm font-black text-offblack">
                👥 방문 통계 · {aiMonthLabel(reportMonth)}
                <span className="ml-1.5 rounded bg-blue-100 px-1.5 py-0.5 text-[10px] font-bold text-blue-700">실제 방문자(사람)</span>
              </p>
              {visitorLoading && <span className="text-xs font-semibold text-zinc-400">불러오는 중…</span>}
            </div>
            {visitorSummary && (visitorSummary.current?.pv || 0) > 0 ? (
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                <div className="rounded-xl bg-white p-4 shadow-sm">
                  <p className="text-xs font-bold text-zinc-500">페이지뷰 (PV)</p>
                  <p className="mt-1 text-2xl font-black text-offblack">{(visitorSummary.current?.pv || 0).toLocaleString()}</p>
                  <AiMomBadge cur={visitorSummary.current?.pv} prev={visitorSummary.previous?.pv} />
                </div>
                <div className="rounded-xl bg-white p-4 shadow-sm">
                  <p className="text-xs font-bold text-zinc-500">방문자 (UV·세션)</p>
                  <p className="mt-1 text-2xl font-black text-offblack">{(visitorSummary.current?.uv || 0).toLocaleString()}</p>
                  <AiMomBadge cur={visitorSummary.current?.uv} prev={visitorSummary.previous?.uv} />
                </div>
                <div className="rounded-xl bg-white p-4 shadow-sm">
                  <p className="text-xs font-bold text-zinc-500">모바일 비중</p>
                  <p className="mt-1 text-2xl font-black text-offblack">{aiMobilePct(visitorSummary.current)}%</p>
                  <span className="text-[11px] font-bold text-zinc-400">PC·태블릿 {100 - aiMobilePct(visitorSummary.current)}%</span>
                </div>
                <div className="rounded-xl bg-white p-4 shadow-sm">
                  <p className="text-xs font-bold text-zinc-500">평균 체류시간</p>
                  <p className="mt-1 text-2xl font-black text-offblack">{aiFmtDwell(visitorSummary.current?.avgDwell)}</p>
                  <span className="text-[11px] font-bold text-zinc-400">세션당 {visitorSummary.current?.pagesPerSession ?? 0}p · 이탈 {visitorSummary.current?.bounceRate ?? 0}%</span>
                </div>
              </div>
            ) : (
              <p className="text-sm text-zinc-400">{visitorLoading ? '' : `${aiMonthLabel(reportMonth)} 방문 기록이 없습니다.`}</p>
            )}
          </Card>

          <Card className="p-5">
            <p className="mb-3 text-sm font-black text-offblack">봇별 합계</p>
            {data.byBot.length === 0 ? (
              <p className="text-sm text-zinc-400">기록 없음</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {data.byBot.map((b) => (
                  <span key={b.bot + b.kind} className="rounded-full border border-zinc-200 bg-zinc-50 px-3 py-1.5 text-xs font-bold text-zinc-700">
                    {b.bot} <span className="text-zinc-400">· {b.kind === 'assistant' ? 'AI 실시간' : b.kind === 'crawler' ? 'AI 크롤러' : '기타 봇'}</span> <span className="ml-1 text-accent">{b.count.toLocaleString()}</span>
                  </span>
                ))}
              </div>
            )}
          </Card>

          <Card>
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-zinc-100 px-5 py-3">
              <p className="text-sm font-black text-offblack">업체별 AI 크롤링 + 방문 통계</p>
              <p className="text-xs text-zinc-400">
                <span className="font-bold text-zinc-500">AI·봇</span>은 최근 {data.days}일 · <span className="font-bold text-blue-600">방문</span>은 {aiMonthLabel(reportMonth)} 기준
              </p>
            </div>
            <TableWrapper>
              <table className="w-full min-w-[920px] text-sm">
                <thead>
                  <tr className="border-b border-zinc-100 text-left">
                    <Th>업체</Th>
                    <Th right>AI·봇 크롤링</Th>
                    <Th right><span className="text-blue-600">방문 PV</span></Th>
                    <Th right><span className="text-blue-600">방문자 UV</span></Th>
                    <Th right><span className="text-blue-600">모바일</span></Th>
                    <Th>봇 구성</Th>
                    <Th right>통합 PDF</Th>
                  </tr>
                </thead>
                <tbody>
                  {data.hospitals.length === 0 ? (
                    <EmptyRow cols={7} message="기간 내 AI 크롤링 기록이 없습니다." />
                  ) : (
                    data.hospitals.map((h) => {
                      const vh = visitorMap[h.hospital_id] || null;
                      return (
                      <tr key={h.hospital_id ?? 'none'} className="border-b border-zinc-50">
                        <Td>
                          <span className="font-bold text-offblack">{h.hospital_name}</span>
                          {h.hospital_slug && <span className="ml-1 text-xs text-zinc-400">/{h.hospital_slug}</span>}
                          {h.last_seen && <span className="block text-[11px] text-zinc-300">마지막 크롤링 {String(h.last_seen).replace('T', ' ').slice(0, 16)}</span>}
                        </Td>
                        <Td right mono>{h.total.toLocaleString()}</Td>
                        <Td right mono>{vh ? vh.pv.toLocaleString() : <span className="text-zinc-300">—</span>}</Td>
                        <Td right mono>{vh ? vh.uv.toLocaleString() : <span className="text-zinc-300">—</span>}</Td>
                        <Td right mono>{vh && vh.pv > 0 ? `${vh.mobilePct}%` : <span className="text-zinc-300">—</span>}</Td>
                        <Td>
                          <div className="flex flex-wrap gap-1">
                            {h.bots.map((b) => (
                              <span key={b.bot} className="rounded-md bg-zinc-100 px-2 py-0.5 text-[11px] font-bold text-zinc-700">
                                {b.bot} {b.count}
                              </span>
                            ))}
                          </div>
                        </Td>
                        <Td right>
                          <button
                            onClick={() => downloadReport(reportMonth, h.hospital_id)}
                            disabled={downloading || !h.hospital_id}
                            title={`${aiMonthLabel(reportMonth)} ${h.hospital_name} 통합 리포트(AI크롤링+방문통계)`}
                            className="rounded-md border border-zinc-200 px-2.5 py-1 text-[11px] font-bold text-zinc-700 transition hover:bg-zinc-50 disabled:opacity-40"
                          >
                            PDF
                          </button>
                        </Td>
                      </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </TableWrapper>
          </Card>
          <p className="text-xs text-zinc-400">
            ※ <b>AI·봇</b>은 서버사이드 User-Agent 기반 집계입니다(사람 브라우저 제외). AI 크롤러는 종류별, 그 외 봇·자동화 도구는 ‘기타 봇’으로 분류됩니다. AI가 답변에서 업체를 “추천/언급”한 횟수나 실제 사용자 질문은 외부에서 취득 불가하여 포함되지 않습니다.<br />
            ※ <b className="text-blue-600">방문 통계</b>는 실제 방문자(사람) 페이지뷰 기준이며 선택한 달(KST)로 집계됩니다. 체류시간은 세션 내 연속 페이지 간격 추정치, 검색어는 엔진이 노출한 경우에만 표시됩니다.
          </p>
        </>
      )}
      </div>
    </div>
  );
}

// ── LogsModule ────────────────────────────────────────────────────────────────

function LogsModule({ logs: initial }) {
  const [logs, setLogs] = useState(initial || []);
  const [loading, setLoading] = useState(false);

  async function refresh() {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/logs');
      const data = await res.json();
      if (Array.isArray(data)) setLogs(data);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col">
      <PageHeader
        title="활동 로그"
        description="관리자 활동 기록을 최신 순으로 확인합니다."
        action={<Btn onClick={refresh} loading={loading} variant="ghost">새로고침</Btn>}
      />
      <div className="p-6">
        <Card>
          <TableWrapper>
            <thead>
              <tr>
                <Th>시간</Th>
                <Th>작업</Th>
                <Th>대상</Th>
                <Th>업체</Th>
                <Th>관리자</Th>
              </tr>
            </thead>
            <tbody>
              {logs.length === 0 ? (
                <EmptyRow cols={5} message="활동 로그가 없습니다." />
              ) : logs.map((log) => (
                <tr key={log.id} className="hover:bg-zinc-50">
                  <td className="border-b border-line px-3 py-3.5 text-center text-xs font-semibold text-zinc-400 whitespace-nowrap">
                    {log.created_at}
                  </td>
                  <Td>{log.action}</Td>
                  <Td muted>{log.entity_type}</Td>
                  <Td muted>{log.hospital_name ?? '공통'}</Td>
                  <Td muted>{log.display_name ?? 'system'}</Td>
                </tr>
              ))}
            </tbody>
          </TableWrapper>
        </Card>
      </div>
    </div>
  );
}

// ── BillingsModule ────────────────────────────────────────────────────────────

function formatKRW(value) {
  const n = Number(value || 0);
  return n.toLocaleString('ko-KR') + '원';
}

function formatNumber(value) {
  return Number(value || 0).toLocaleString('ko-KR');
}

const STATUS_LABEL = {
  preparing: '구축대기', // legacy alias
  building_pending: '구축대기',
  building_active: '구축진행',
  building_done: '구축완료',
  managing_pending: '관리대기',
  managing_active: '관리진행',
  open: '관리진행', // legacy alias
  terminated: '계약해지',
};
const STATUS_TONE = {
  preparing: 'amber',
  building_pending: 'amber',
  building_active: 'amber',
  building_done: 'green',
  managing_pending: 'green',
  managing_active: 'green',
  open: 'green',
  terminated: 'zinc',
};
const STATUS_OPTIONS = [
  ['building_pending', '구축대기'],
  ['building_active', '구축진행'],
  ['building_done', '구축완료'],
  ['managing_pending', '관리대기'],
  ['managing_active', '관리진행'],
  ['terminated', '계약해지'],
];
const STATUS_BG_CLASS = {
  preparing: 'bg-blue-100 text-blue-800',
  building_pending: 'bg-blue-100 text-blue-800',
  building_active: 'bg-blue-100 text-blue-800',
  building_done: 'bg-teal-100 text-teal-800',
  managing_pending: 'bg-sky-100 text-sky-800',
  managing_active: 'bg-emerald-100 text-emerald-800',
  open: 'bg-emerald-100 text-emerald-800',
  terminated: 'bg-zinc-200 text-zinc-700',
};

function InlineStatusSelect({ status, onChange, disabled }) {
  return (
    <select
      value={status}
      onClick={(e) => e.stopPropagation()}
      onChange={(e) => { e.stopPropagation(); onChange(e.target.value); }}
      disabled={disabled}
      className={cx(
        'rounded-full px-3 py-1 text-xs font-bold border-0 outline-none cursor-pointer appearance-none',
        STATUS_BG_CLASS[status] || 'bg-zinc-100 text-zinc-700',
        disabled && 'opacity-70 cursor-not-allowed'
      )}
    >
      {STATUS_OPTIONS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
    </select>
  );
}
const PAYMENT_LABEL = { unpaid: '미납', paid: '완납', partial: '부분납' };

function diffDays(targetIso) {
  if (!targetIso) return null;
  const t = new Date(targetIso + 'T23:59:59');
  if (isNaN(t.getTime())) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const ms = t - today;
  return Math.floor(ms / (1000 * 60 * 60 * 24));
}

export function BillingsModule({ billings: initial, hospitals, session }) {
  const [tab, setTab] = useState('registration');
  const isSuper = session?.role === 'super_admin';
  const tabs = [
    ['registration', '정산 등록 현황'],
    ['invoices', '월별 정산'],
    ...(isSuper ? [['reseller', '리셀러 정산']] : []),
  ];

  return (
    <div className="flex flex-col">
      <div className="flex items-center gap-1 border-b border-zinc-200 bg-white px-6 pt-3">
        {tabs.map(([k, l]) => (
          <button
            key={k}
            type="button"
            onClick={() => setTab(k)}
            className={cx(
              'border-b-2 px-4 py-2.5 text-sm font-bold transition',
              tab === k ? 'border-accent text-accent' : 'border-transparent text-zinc-500 hover:text-offblack'
            )}
          >
            {l}
          </button>
        ))}
      </div>
      {tab === 'registration' ? (
        <BillingRegistrationView billings={initial || []} hospitals={hospitals || []} session={session} />
      ) : tab === 'reseller' ? (
        <ResellerSettlementView />
      ) : (
        <PaymentsView session={session} />
      )}
    </div>
  );
}

// ── 리셀러 정산 뷰 (슈퍼관리자 전용) ─────────────────────────────────────────
// 방향: 리셀러 → 본사 납부. 청구 기준(이 달 청구된 설치비·월관리비 × 정산율 = 리셀러가 낼 금액).
function ResellerSettlementView() {
  const [months] = useState(() => {
    const arr = [], d = new Date();
    for (let i = 0; i < 12; i++) { arr.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`); d.setMonth(d.getMonth() - 1); }
    return arr;
  });
  const [month, setMonth] = useState(months[0]);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [openId, setOpenId] = useState(null);
  const [rateEdit, setRateEdit] = useState(null); // {account_id, build_pct, monthly_pct}
  const [busy, setBusy] = useState(false);

  async function load(m) {
    setLoading(true);
    try {
      const r = await fetch(`/api/admin/billings/reseller-settlements?month=${m}`, { credentials: 'same-origin' });
      if (r.ok) setData(await r.json());
    } finally { setLoading(false); }
  }
  useEffect(() => { load(month); /* eslint-disable-next-line */ }, [month]);

  async function saveRates() {
    if (!rateEdit) return;
    setBusy(true);
    try {
      const r = await fetch('/api/admin/billings/reseller-settlements', {
        method: 'PUT', headers: { 'Content-Type': 'application/json' }, credentials: 'same-origin',
        body: JSON.stringify({ action: 'rates', ...rateEdit }),
      });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error || '저장 실패');
      setRateEdit(null);
      await load(month);
    } catch (e) { alert(e.message); } finally { setBusy(false); }
  }

  async function setStatus(accountId, status) {
    const label = status === 'paid' ? '입금완료' : '미입금';
    if (!confirm(`이 리셀러의 ${month} 정산을 "${label}"로 변경할까요?${status === 'paid' ? '\n현재 집계 금액이 스냅샷으로 저장됩니다.' : ''}`)) return;
    setBusy(true);
    try {
      const r = await fetch('/api/admin/billings/reseller-settlements', {
        method: 'PUT', headers: { 'Content-Type': 'application/json' }, credentials: 'same-origin',
        body: JSON.stringify({ action: 'status', account_id: accountId, month, status }),
      });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error || '변경 실패');
      await load(month);
    } catch (e) { alert(e.message); } finally { setBusy(false); }
  }

  const monthLabel = (m) => `${m.slice(0, 4)}년 ${Number(m.slice(5, 7))}월`;
  const ITEM_KO = { build: '설치비(구축)', maintenance: '월관리비' };

  if (loading && !data) return <div className="p-12 text-center text-zinc-400">불러오는 중...</div>;
  if (!data) return <div className="p-12 text-center text-zinc-400">데이터 없음</div>;

  return (
    <div className="space-y-4 p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-black text-offblack">{monthLabel(month)} 리셀러 정산 <span className="text-sm font-bold text-zinc-400">(리셀러 → 본사 납부)</span></h2>
          <p className="mt-1 text-xs text-zinc-500">
            <b>청구 기준</b> — 이 달 청구된 설치비(1회)·월관리비(매월)에 정산율을 적용한 금액을 리셀러가 본사에 납부합니다. 정산율 미설정 시 100%(전액)입니다.
          </p>
        </div>
        <select value={month} onChange={(e) => setMonth(e.target.value)} className="rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-sm font-bold outline-none focus:border-zinc-900">
          {months.map((m) => <option key={m} value={m}>{monthLabel(m)}</option>)}
        </select>
      </div>

      {/* 요약 */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">
        <div className="rounded-xl border border-zinc-200 bg-white p-4">
          <p className="text-xs font-bold text-zinc-500">이번 달 청구 합계 (전체 업체)</p>
          <p className="mt-1 text-2xl font-black text-offblack">{formatKRW(data.totals.billed)}</p>
        </div>
        <div className="rounded-xl border border-zinc-200 bg-white p-4">
          <p className="text-xs font-bold text-zinc-500">리셀러 납부 예정 합계</p>
          <p className="mt-1 text-2xl font-black text-accent">{formatKRW(data.totals.due)}</p>
        </div>
        <div className="rounded-xl border border-zinc-200 bg-white p-4">
          <p className="text-xs font-bold text-zinc-500">입금 완료</p>
          <p className="mt-1 text-2xl font-black text-emerald-600">{formatKRW(data.totals.collected)}</p>
        </div>
      </div>

      {data.overlapHospitalIds?.length > 0 && (
        <div className="rounded-xl bg-amber-50 px-4 py-3 text-[13px] font-medium text-amber-700">
          ⚠️ 두 명 이상의 리셀러에게 배정된 업체가 {data.overlapHospitalIds.length}곳 있습니다 — 이중 정산 위험이 있으니 "리셀러 관리"에서 배정을 정리해 주세요.
        </div>
      )}

      {/* 리셀러 카드 */}
      {data.resellers.length === 0 ? (
        <p className="rounded-xl border border-zinc-200 bg-white py-12 text-center text-sm text-zinc-400">활성 리셀러 계정이 없습니다.</p>
      ) : (
        data.resellers.map((r) => {
          const open = openId === r.account_id;
          const st = r.settlement;
          const editing = rateEdit?.account_id === r.account_id;
          return (
            <div key={r.account_id} className="overflow-hidden rounded-2xl border border-zinc-200 bg-white">
              {/* 헤더 행 */}
              <div className="flex flex-wrap items-center gap-3 px-5 py-4">
                <button type="button" onClick={() => setOpenId(open ? null : r.account_id)} className="flex min-w-0 flex-1 items-center gap-3 text-left">
                  <span className={cx('shrink-0 text-[11px] transition-transform', open && 'rotate-90')}>▶</span>
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-black text-offblack">{r.name}</span>
                    <span className="block truncate text-[11px] text-zinc-400">{r.email} · 담당 업체 {r.hospital_count}곳</span>
                  </span>
                </button>

                {/* 정산율 */}
                {editing ? (
                  <span className="flex items-center gap-1.5 text-xs" onClick={(e) => e.stopPropagation()}>
                    설치 <input type="number" min="0" max="100" value={rateEdit.build_pct} onChange={(e) => setRateEdit((p) => ({ ...p, build_pct: e.target.value }))} className="w-16 rounded-md border border-zinc-300 px-2 py-1 text-right text-xs" />%
                    관리 <input type="number" min="0" max="100" value={rateEdit.monthly_pct} onChange={(e) => setRateEdit((p) => ({ ...p, monthly_pct: e.target.value }))} className="w-16 rounded-md border border-zinc-300 px-2 py-1 text-right text-xs" />%
                    <button onClick={saveRates} disabled={busy} className="rounded-md bg-zinc-900 px-2.5 py-1 text-[11px] font-bold text-white">저장</button>
                    <button onClick={() => setRateEdit(null)} className="text-[11px] text-zinc-400">취소</button>
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={() => setRateEdit({ account_id: r.account_id, build_pct: r.build_pct, monthly_pct: r.monthly_pct })}
                    className="shrink-0 rounded-full border border-zinc-200 px-3 py-1 text-[11px] font-bold text-zinc-600 hover:border-zinc-400"
                    title="정산율 수정 (본사가 받는 비율)"
                  >
                    정산율 — 설치 {r.build_pct}% · 관리 {r.monthly_pct}% ✎
                  </button>
                )}

                {/* 금액 + 상태 */}
                <span className="shrink-0 text-right">
                  <span className="block text-lg font-black text-offblack">{formatKRW(r.due)}</span>
                  <span className="block text-[11px] text-zinc-400">설치 {formatKRW(r.build_due)} + 관리 {formatKRW(r.monthly_due)}</span>
                  {r.unpaid_prev?.length > 0 && (
                    <span className="block text-[11px] font-bold text-red-500">이전 미입금 {r.unpaid_prev.length}개월 · {formatKRW(r.unpaid_prev.reduce((s, x) => s + x.due, 0))}</span>
                  )}
                </span>
                {st.status === 'paid' ? (
                  <span className="flex shrink-0 flex-col items-end gap-1">
                    <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-700">입금완료 {st.paid_at}</span>
                    {st.drift !== 0 && <span className="text-[11px] font-bold text-amber-600">입금 처리 후 청구 변동 {st.drift > 0 ? '+' : ''}{formatKRW(st.drift)}</span>}
                    <button onClick={() => setStatus(r.account_id, 'pending')} disabled={busy} className="text-[11px] text-zinc-400 hover:text-red-500">입금 취소</button>
                  </span>
                ) : (
                  <button
                    onClick={() => setStatus(r.account_id, 'paid')}
                    disabled={busy || r.due === 0}
                    className="shrink-0 rounded-lg bg-zinc-900 px-4 py-2 text-xs font-bold text-white hover:bg-zinc-700 disabled:opacity-40"
                  >
                    입금완료 처리
                  </button>
                )}
              </div>

              {/* 상세 내역 */}
              {open && (
                <div className="border-t border-zinc-100 bg-zinc-50/40 px-5 py-4">
                  <div className="mb-2 flex flex-wrap gap-4 text-xs text-zinc-600">
                    <span>설치비 청구 <b>{formatKRW(r.build_base)}</b> × {r.build_pct}% = <b className="text-offblack">{formatKRW(r.build_due)}</b></span>
                    <span>월관리비 청구 <b>{formatKRW(r.monthly_base)}</b> × {r.monthly_pct}% = <b className="text-offblack">{formatKRW(r.monthly_due)}</b></span>
                  </div>
                  {r.unpaid_prev?.length > 0 && (
                    <p className="mb-2 text-xs font-bold text-red-500">
                      ⚠ 이전 미입금: {r.unpaid_prev.map((x) => `${Number(x.month.slice(5, 7))}월 ${formatKRW(x.due)}`).join(' · ')}
                    </p>
                  )}
                  {r.items.length === 0 ? (
                    <p className="py-6 text-center text-sm text-zinc-400">이 달 청구 내역이 없습니다.</p>
                  ) : (
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="border-b border-zinc-200 text-left text-[11px] font-bold text-zinc-500">
                          <th className="py-2">업체</th>
                          <th className="py-2">항목</th>
                          <th className="py-2">회차</th>
                          <th className="py-2">업체 수납상태</th>
                          <th className="py-2 text-right">청구액</th>
                        </tr>
                      </thead>
                      <tbody>
                        {r.items.map((it, i) => (
                          <tr key={i} className="border-b border-zinc-100">
                            <td className="py-2 font-semibold text-zinc-800">{it.hospital_name}</td>
                            <td className="py-2">{ITEM_KO[it.item_type] || it.item_type}</td>
                            <td className="py-2 text-zinc-500">{it.installment_no}회차</td>
                            <td className="py-2">
                              <span className={cx('rounded-full px-2 py-0.5 text-[10px] font-bold', it.payment_status === 'paid' ? 'bg-emerald-50 text-emerald-600' : it.payment_status === 'partial' ? 'bg-amber-50 text-amber-600' : 'bg-zinc-100 text-zinc-500')}>
                                {PAYMENT_LABEL[it.payment_status] || it.payment_status}
                              </span>
                            </td>
                            <td className="py-2 text-right font-bold">{formatKRW(it.amount)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              )}
            </div>
          );
        })
      )}
    </div>
  );
}

// ── 결제 내역 뷰 (이미지 레이아웃) ────────────────────────────────────────────

const PAYMENT_STATUS_LABEL = { unpaid: '미납', paid: '완료', partial: '부분납', failed: '실패' };
const PAYMENT_STATUS_TONE = { unpaid: 'amber', paid: 'green', partial: 'amber', failed: 'red' };
const ITEM_LABEL_MAP = { build: '구축비', maintenance: '유지관리비' };

function PaymentsView({ session }) {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [paymentStatus, setPaymentStatus] = useState('');
  const [year, setYear] = useState('');
  const [month, setMonth] = useState('');
  const [editing, setEditing] = useState(null);
  const [notice, setNotice] = useState(null);
  const [overdueOnly, setOverdueOnly] = useState(false);
  const [selected, setSelected] = useState(() => new Set());

  const isSuper = session?.role === 'super_admin';

  async function load() {
    setLoading(true);
    setSelected(new Set());
    try {
      const params = new URLSearchParams();
      if (search) params.set('search', search);
      if (paymentStatus) params.set('paymentStatus', paymentStatus);
      if (year) params.set('year', year);
      if (month) params.set('month', month);
      const res = await fetch(`/api/admin/billings/payments?${params}`, { credentials: 'same-origin' });
      const data = await res.json();
      if (!res.ok || data.error) throw new Error(data.error);
      setRows(data.rows || []);
    } catch (e) {
      setNotice({ tone: 'error', message: e.message });
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => { load(); /* eslint-disable-next-line */ }, [search, paymentStatus, year, month]);

  async function regenerateMonth() {
    const m = prompt('자동 생성할 청구월 (YYYY-MM)', new Date().toISOString().slice(0, 7));
    if (!m) return;
    try {
      const res = await fetch('/api/admin/billings/payments/regenerate', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'same-origin',
        body: JSON.stringify({ month: m }),
      });
      const data = await res.json();
      if (!res.ok || data.error) throw new Error(data.error);
      await load();
      setNotice({ tone: 'success', message: `${m} 자동 생성 완료` });
    } catch (e) { setNotice({ tone: 'error', message: e.message }); }
  }

  async function regenerateAll() {
    if (!confirm('등록 현황 데이터로 모든 월 결제 행을 자동 재계산합니다. (입금 정보는 보존)')) return;
    try {
      const res = await fetch('/api/admin/billings/payments/regenerate', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'same-origin',
        body: JSON.stringify({}),
      });
      const data = await res.json();
      if (!res.ok || data.error) throw new Error(data.error);
      await load();
      setNotice({ tone: 'success', message: `전체 ${data.processed}/${data.totalMonths}개월 재계산 완료` });
    } catch (e) { setNotice({ tone: 'error', message: e.message }); }
  }

  async function exportExcel() {
    if (rows.length === 0) { alert('내보낼 데이터가 없습니다.'); return; }
    const headers = ['거래처', '항목', '구분', '청구기간', '청구금액', '입금수단', '입금일', '상태'];
    const lines = [headers.join('\t')];
    for (const r of rows) {
      lines.push([
        r.hospital_name,
        ITEM_LABEL_MAP[r.item_type] || r.item_type,
        `${r.installment_no}회차${r.auto_generated ? '(자동)' : ''}`,
        r.billing_month,
        r.amount,
        r.payment_method || '',
        r.paid_at || '',
        PAYMENT_STATUS_LABEL[r.payment_status] || r.payment_status,
      ].join('\t'));
    }
    const blob = new Blob(['﻿' + lines.join('\n')], { type: 'text/tab-separated-values;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `결제내역_${new Date().toISOString().slice(0, 10)}.tsv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  const years = Array.from(new Set(rows.map((r) => (r.billing_month || '').slice(0, 4)).filter(Boolean))).sort().reverse();

  // ── 정산 요약·일괄처리 (기존 데이터 미변경, 화면 계산만) ──
  const curMonth = new Date().toISOString().slice(0, 7);
  const isOverdue = (r) => r.payment_status !== 'paid' && (r.billing_month || '') < curMonth;
  const displayRows = overdueOnly ? rows.filter(isOverdue) : rows;
  const due = (r) => Math.max(0, (Number(r.amount) || 0) - (Number(r.paid_amount) || 0));
  const sums = displayRows.reduce((a, r) => {
    const amt = Number(r.amount) || 0;
    a.billed += amt;
    if (r.payment_status === 'paid') { a.paidAmt += amt; a.paidCnt++; }
    else { a.paidAmt += Number(r.paid_amount) || 0; a.dueAmt += due(r); a.dueCnt++; }
    if (isOverdue(r)) { a.odAmt += due(r); a.odCnt++; }
    return a;
  }, { billed: 0, paidAmt: 0, paidCnt: 0, dueAmt: 0, dueCnt: 0, odAmt: 0, odCnt: 0 });

  const selectableRows = displayRows.filter((r) => r.payment_status !== 'paid');
  const selectedRows = displayRows.filter((r) => selected.has(r.id));
  const selectedDue = selectedRows.reduce((s, r) => s + due(r), 0);
  const allSelected = selectableRows.length > 0 && selectableRows.every((r) => selected.has(r.id));

  function toggleSel(id) { setSelected((p) => { const n = new Set(p); n.has(id) ? n.delete(id) : n.add(id); return n; }); }
  function toggleSelAll() { setSelected(allSelected ? new Set() : new Set(selectableRows.map((r) => r.id))); }

  async function bulkSettle() {
    if (!selectedRows.length) return;
    if (!confirm(`선택한 ${selectedRows.length}건(미수금 ${formatNumber(selectedDue)}원)을 '수금 완료'로 처리합니다.\n입금일은 오늘로 기록됩니다. 계속할까요?`)) return;
    const today = new Date().toISOString().slice(0, 10);
    try {
      for (const r of selectedRows) {
        const res = await fetch(`/api/admin/billings/payments/${r.id}`, {
          method: 'PUT', headers: { 'Content-Type': 'application/json' }, credentials: 'same-origin',
          body: JSON.stringify({ paidAmount: Number(r.amount) || 0, paidAt: today, paymentMethod: r.payment_method || '', status: 'paid' }),
        });
        const data = await res.json();
        if (!res.ok || data.error) throw new Error(data.error);
      }
      setSelected(new Set());
      await load();
      setNotice({ tone: 'success', message: `${selectedRows.length}건 수금 완료 처리되었습니다.` });
    } catch (e) { setNotice({ tone: 'error', message: e.message }); }
  }

  function quick(kind) {
    setSelected(new Set());
    if (kind === 'all') { setSearch(''); setPaymentStatus(''); setYear(''); setMonth(''); setOverdueOnly(false); }
    else if (kind === 'due') { setOverdueOnly(false); setPaymentStatus('unpaid'); }
    else if (kind === 'overdue') { setPaymentStatus(''); setOverdueOnly(true); }
    else if (kind === 'thisMonth') { setOverdueOnly(false); setYear(curMonth.slice(0, 4)); setMonth(curMonth); }
  }
  const chipCls = (on) => cx('rounded-full border px-3.5 py-1.5 text-xs font-bold transition', on ? 'border-accent bg-accent text-white' : 'border-zinc-300 bg-white text-zinc-600 hover:border-accent hover:text-accent');

  return (
    <div className="p-6 space-y-4">
      {notice && <Notice tone={notice.tone} message={notice.message} />}

      {/* 헤더 + 액션 */}
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-xl font-black text-offblack flex items-center gap-2">
            <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-accent-soft text-accent">◐</span>
            결제내역
          </h2>
          <p className="mt-1 text-sm text-zinc-500">전체 결제 내역을 조회하고 관리할 수 있습니다.</p>
        </div>
        <div className="flex gap-2">
          {isSuper && (
            <>
              <button type="button" onClick={regenerateMonth} className="rounded-lg border border-accent/40 bg-accent-soft px-3 py-1.5 text-xs font-bold text-accent hover:bg-accent-soft">
                선택 월 자동 생성
              </button>
              <button type="button" onClick={regenerateAll} className="rounded-lg border border-zinc-300 bg-white px-3 py-1.5 text-xs font-bold text-zinc-700 hover:bg-zinc-50">
                전체 재계산
              </button>
            </>
          )}
          <button type="button" onClick={exportExcel} className="rounded-lg border border-zinc-300 bg-white px-3 py-1.5 text-xs font-bold text-zinc-700 hover:bg-zinc-50">
            ↓ 내보내기
          </button>
        </div>
      </div>

      {/* 정산 요약 (현재 조회 조건 기준) */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <SummaryCard icon="₩" iconBg="bg-accent-soft text-accent" label="청구 총액" value={`${formatNumber(sums.billed)}원`} sub={`${displayRows.length}건`} />
        <SummaryCard icon="✓" iconBg="bg-emerald-100 text-emerald-600" label="수금 완료" value={`${formatNumber(sums.paidAmt)}원`} sub={`${sums.paidCnt}건`} />
        <SummaryCard icon="!" iconBg="bg-amber-100 text-amber-600" label="미수금" value={`${formatNumber(sums.dueAmt)}원`} sub={`${sums.dueCnt}건`} />
        <SummaryCard icon="⏰" iconBg="bg-red-100 text-red-600" label="연체" value={`${formatNumber(sums.odAmt)}원`} sub={`${sums.odCnt}건`} />
      </div>

      {/* 빠른 필터 */}
      <div className="flex flex-wrap items-center gap-2">
        <button type="button" onClick={() => quick('all')} className={chipCls(!paymentStatus && !overdueOnly && !month)}>전체</button>
        <button type="button" onClick={() => quick('thisMonth')} className={chipCls(month === curMonth && !overdueOnly)}>이번 달</button>
        <button type="button" onClick={() => quick('due')} className={chipCls(paymentStatus === 'unpaid' && !overdueOnly)}>미수금만</button>
        <button type="button" onClick={() => quick('overdue')} className={chipCls(overdueOnly)}>연체만</button>
        <span className="ml-auto text-xs text-zinc-400">표시 {displayRows.length}건</span>
      </div>

      {/* 필터 */}
      <div className="rounded-xl border border-zinc-200 bg-white p-4 space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative flex-1 min-w-[180px] max-w-xs">
            <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="회사명으로 검색"
              className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm outline-none focus:border-zinc-900" />
          </div>
          <SelectField value={paymentStatus} onChange={(e) => setPaymentStatus(e.target.value)} className="w-32">
            <option value="">입금상태</option>
            <option value="unpaid">미납</option>
            <option value="partial">부분납</option>
            <option value="paid">완료</option>
          </SelectField>
          <SelectField value={year} onChange={(e) => setYear(e.target.value)} className="w-28">
            <option value="">연도</option>
            {[...new Set([new Date().getFullYear(), new Date().getFullYear() - 1, ...years])].map((y) => (
              <option key={y} value={String(y)}>{y}</option>
            ))}
          </SelectField>
          <SelectField value={month} onChange={(e) => setMonth(e.target.value)} className="w-32">
            <option value="">월</option>
            {Array.from({ length: 12 }, (_, i) => {
              const yy = year || new Date().getFullYear();
              const mm = String(i + 1).padStart(2, '0');
              return <option key={mm} value={`${yy}-${mm}`}>{i + 1}월</option>;
            })}
          </SelectField>
          {(search || paymentStatus || year || month || overdueOnly) && (
            <button type="button" onClick={() => { setSearch(''); setPaymentStatus(''); setYear(''); setMonth(''); setOverdueOnly(false); }}
              className="text-xs text-zinc-500 hover:text-offblack underline">필터 초기화</button>
          )}
        </div>
      </div>

      {/* 일괄 수금처리 바 */}
      {isSuper && selected.size > 0 && (
        <div className="flex flex-wrap items-center gap-3 rounded-xl border border-accent/40 bg-accent-soft px-4 py-3">
          <span className="text-sm font-bold text-accent">{selectedRows.length}건 선택 · 미수금 {formatNumber(selectedDue)}원</span>
          <button type="button" onClick={bulkSettle} className="rounded-lg bg-accent px-3.5 py-1.5 text-xs font-bold text-white hover:opacity-90">선택 수금완료 처리</button>
          <button type="button" onClick={() => setSelected(new Set())} className="text-xs font-bold text-zinc-500 underline hover:text-offblack">선택 해제</button>
        </div>
      )}

      {/* 테이블 */}
      <div className="rounded-xl border border-zinc-200 bg-white overflow-x-auto">
        <table className="w-full min-w-[900px] text-sm">
          <thead>
            <tr className="border-b border-zinc-200 bg-zinc-50">
              {isSuper && <th className="w-10 px-3 py-3 text-center"><input type="checkbox" checked={allSelected} onChange={toggleSelAll} className="h-4 w-4 rounded border-zinc-300 accent-accent" aria-label="전체 선택" /></th>}
              <th className="px-4 py-3 text-left text-xs font-bold text-zinc-600">거래처</th>
              <th className="px-4 py-3 text-center text-xs font-bold text-zinc-600">구분</th>
              <th className="px-4 py-3 text-center text-xs font-bold text-zinc-600">청구기간</th>
              <th className="px-4 py-3 text-right text-xs font-bold text-zinc-600">청구금액</th>
              <th className="px-4 py-3 text-left text-xs font-bold text-zinc-600">입금수단</th>
              <th className="px-4 py-3 text-center text-xs font-bold text-zinc-600">입금일</th>
              <th className="px-4 py-3 text-center text-xs font-bold text-zinc-600">상태</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={isSuper ? 8 : 7} className="py-8 text-center text-zinc-400">불러오는 중...</td></tr>
            ) : displayRows.length === 0 ? (
              <tr><td colSpan={isSuper ? 8 : 7} className="py-12 text-center text-zinc-400">조회된 결제 내역이 없습니다.</td></tr>
            ) : displayRows.map((r) => {
              const itemLabel = ITEM_LABEL_MAP[r.item_type] || r.item_type;
              const [yyyy, mm] = (r.billing_month || '').split('-');
              return (
                <tr
                  key={r.id}
                  className={cx('border-b border-zinc-100 hover:bg-zinc-50', isSuper && 'cursor-pointer', isOverdue(r) && 'bg-red-50/40')}
                  onClick={() => isSuper && setEditing(r)}
                >
                  {isSuper && (
                    <td className="px-3 py-3 text-center" onClick={(e) => e.stopPropagation()}>
                      {r.payment_status !== 'paid' && (
                        <input type="checkbox" checked={selected.has(r.id)} onChange={() => toggleSel(r.id)} className="h-4 w-4 rounded border-zinc-300 accent-accent" />
                      )}
                    </td>
                  )}
                  <td className="px-4 py-3">
                    <p className="font-bold text-offblack">{r.hospital_name}</p>
                    <p className="text-xs text-zinc-500">{itemLabel}</p>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className="font-semibold text-zinc-700">{r.installment_no}회차</span>
                    {r.auto_generated ? <span className="ml-1 inline-flex rounded bg-accent-soft px-1.5 py-0.5 text-[10px] font-bold text-accent">자동</span> : null}
                  </td>
                  <td className="px-4 py-3 text-center text-zinc-600">{yyyy && mm ? `${yyyy}년 ${parseInt(mm, 10)}월` : r.billing_month}</td>
                  <td className="px-4 py-3 text-right font-bold text-offblack">{formatNumber(r.amount)}원</td>
                  <td className="px-4 py-3">
                    {r.payment_method ? <span className="text-xs text-zinc-700">{r.payment_method}</span> : <span className="text-zinc-300">-</span>}
                  </td>
                  <td className="px-4 py-3 text-center text-xs text-zinc-600">{r.paid_at || '-'}</td>
                  <td className="px-4 py-3 text-center">
                    <Badge tone={PAYMENT_STATUS_TONE[r.payment_status] || 'zinc'}>{PAYMENT_STATUS_LABEL[r.payment_status] || r.payment_status}</Badge>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {editing && (
        <PaymentSettleModal
          payment={editing}
          onClose={() => setEditing(null)}
          onSaved={async () => { await load(); setEditing(null); }}
        />
      )}
    </div>
  );
}

function SummaryCard({ icon, iconBg, label, value, sub }) {
  return (
    <div className="rounded-2xl border border-zinc-200 bg-white p-4 flex items-center gap-3">
      <span className={cx('flex h-11 w-11 items-center justify-center rounded-full text-lg font-black', iconBg)}>{icon}</span>
      <div className="min-w-0">
        <p className="text-xs text-zinc-500">{label}</p>
        <p className="text-xl font-black text-offblack truncate">{value}</p>
        {sub != null && <p className="text-[11px] font-bold text-zinc-400">{sub}</p>}
      </div>
    </div>
  );
}

function PaymentSettleModal({ payment, onClose, onSaved }) {
  const [form, setForm] = useState({
    paidAmount: String(payment.paid_amount || payment.amount || 0),
    paidAt: payment.paid_at || new Date().toISOString().slice(0, 10),
    paymentMethod: payment.payment_method || '',
    status: payment.payment_status === 'failed' ? 'unpaid' : (payment.payment_status || 'paid'),
  });
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState(null);

  function set(key) { return (e) => setForm((p) => ({ ...p, [key]: e.target.value })); }

  async function save() {
    setSaving(true); setNotice(null);
    try {
      const res = await fetch(`/api/admin/billings/payments/${payment.id}`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' }, credentials: 'same-origin',
        body: JSON.stringify({
          paidAmount: Number(form.paidAmount || 0),
          paidAt: form.paidAt || null,
          paymentMethod: form.paymentMethod,
          status: form.status,
        }),
      });
      const data = await res.json();
      if (!res.ok || data.error) throw new Error(data.error);
      await onSaved?.();
    } catch (e) { setNotice({ tone: 'error', message: e.message }); }
    finally { setSaving(false); }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-lg font-black text-offblack">입금 처리</h3>
          <button type="button" onClick={onClose} className="text-zinc-400 hover:text-offblack text-2xl leading-none">×</button>
        </div>
        <p className="text-xs text-zinc-500">
          {payment.hospital_name} · {ITEM_LABEL_MAP[payment.item_type] || payment.item_type} · {payment.billing_month} · {payment.installment_no}회차
        </p>
        <p className="mt-1 text-xs text-zinc-500">청구금액 <strong>{formatNumber(payment.amount)}원</strong></p>
        {notice && <Notice tone={notice.tone} message={notice.message} />}
        <div className="mt-3 grid gap-3">
          <Field label="상태">
            <SelectField value={form.status} onChange={set('status')}>
              <option value="paid">완료</option>
              <option value="partial">부분납</option>
              <option value="unpaid">미납</option>
            </SelectField>
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="입금액 (원)">
              <Input type="number" min="0" value={form.paidAmount} onChange={set('paidAmount')} />
            </Field>
            <Field label="입금일">
              <Input type="date" value={form.paidAt} onChange={set('paidAt')} />
            </Field>
          </div>
          <Field label="입금수단">
            <Input value={form.paymentMethod} onChange={set('paymentMethod')} placeholder="계좌이체 / 현금 / 자동이체 등" />
          </Field>
        </div>
        <div className="mt-4 flex justify-end gap-2 border-t border-zinc-100 pt-3">
          <button type="button" onClick={onClose} className="rounded-xl border border-zinc-200 bg-white px-4 py-2 text-sm font-bold text-zinc-700 hover:bg-zinc-50">취소</button>
          <Btn onClick={save} disabled={saving}>{saving ? '저장 중…' : '저장'}</Btn>
        </div>
      </div>
    </div>
  );
}

// ── 등록 현황 뷰 ────────────────────────────────────────────────────────────

function BillingRegistrationView({ billings: initial, hospitals, session }) {
  const [billings, setBillings] = useState(initial);
  const [candidates, setCandidates] = useState([]);
  const [subTab, setSubTab] = useState('all');
  const [search, setSearch] = useState('');
  const [editingHospitalId, setEditingHospitalId] = useState(null);
  const [createTarget, setCreateTarget] = useState(null); // 'h:ID' — 미등록 업체 칩에서 열 때
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [notice, setNotice] = useState(null);

  const isSuper = session?.role === 'super_admin';

  async function refresh() {
    try {
      const res = await fetch('/api/admin/billings', { credentials: 'same-origin' });
      const data = await res.json();
      if (Array.isArray(data?.billings)) setBillings(data.billings);
      if (Array.isArray(data?.candidates)) setCandidates(data.candidates);
    } catch {/* ignore */}
  }
  useEffect(() => { refresh(); /* eslint-disable-next-line */ }, []);

  async function changeStatus(hospitalId, nextStatus) {
    try {
      const res = await fetch(`/api/admin/billings/${hospitalId}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({ status: nextStatus }),
      });
      const data = await res.json();
      if (!res.ok || data.error) throw new Error(data.error);
      await refresh();
      setNotice({ tone: 'success', message: '상태가 변경되었습니다.' });
    } catch (e) {
      setNotice({ tone: 'error', message: e.message });
    }
  }

  // 6단계 status를 3개 서브탭으로 묶어서 필터
  const SUBTAB_BUCKETS = {
    preparing: ['preparing', 'building_pending', 'building_active', 'building_done'],
    open: ['open', 'managing_pending', 'managing_active'],
    terminated: ['terminated'],
  };
  function matchesSubTab(status, tab) {
    if (tab === 'all') return true;
    return (SUBTAB_BUCKETS[tab] || []).includes(status);
  }

  const filtered = billings.filter((b) => {
    const status = b.status || 'building_pending';
    if (!matchesSubTab(status, subTab)) return false;
    if (search) {
      const q = search.toLowerCase();
      if (!String(b.hospital_name || '').toLowerCase().includes(q) &&
          !String(b.hospital_slug || '').toLowerCase().includes(q)) return false;
    }
    return true;
  });

  const counts = {
    preparing: billings.filter((b) => matchesSubTab(b.status || 'building_pending', 'preparing')).length,
    open: billings.filter((b) => matchesSubTab(b.status, 'open')).length,
    terminated: billings.filter((b) => matchesSubTab(b.status, 'terminated')).length,
    all: billings.length,
  };
  const managingMonthly = billings
    .filter((b) => matchesSubTab(b.status, 'open'))
    .reduce((s, b) => s + Number(b.monthly_fee || 0), 0);

  return (
    <div className="p-6 space-y-4">
      {notice && <Notice tone={notice.tone} message={notice.message} />}

      {/* 요약 카드 */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <div className="rounded-xl border border-zinc-200 bg-white p-4">
          <p className="text-xs font-bold text-zinc-500">관리중 업체</p>
          <p className="mt-1 text-2xl font-black text-offblack">{counts.open}<span className="text-sm font-bold text-zinc-400">곳</span></p>
        </div>
        <div className="rounded-xl border border-zinc-200 bg-white p-4">
          <p className="text-xs font-bold text-zinc-500">월관리비 합계 (관리중)</p>
          <p className="mt-1 text-2xl font-black text-accent">{formatKRW(managingMonthly)}</p>
        </div>
        <div className="rounded-xl border border-zinc-200 bg-white p-4">
          <p className="text-xs font-bold text-zinc-500">구축 단계</p>
          <p className="mt-1 text-2xl font-black text-offblack">{counts.preparing}<span className="text-sm font-bold text-zinc-400">곳</span></p>
        </div>
        <div className={cx('rounded-xl border p-4', candidates.length > 0 ? 'border-amber-300 bg-amber-50/60' : 'border-zinc-200 bg-white')}>
          <p className="text-xs font-bold text-zinc-500">정산 미등록 업체</p>
          <p className={cx('mt-1 text-2xl font-black', candidates.length > 0 ? 'text-amber-600' : 'text-offblack')}>{candidates.length}<span className="text-sm font-bold text-zinc-400">곳</span></p>
        </div>
      </div>

      {/* 정산 미등록 업체 — 클릭 한 번으로 영업·업체 데이터가 채워진 등록 폼 */}
      {isSuper && candidates.length > 0 && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50/40 p-4">
          <p className="text-sm font-bold text-amber-800">
            정산 미등록 업체 {candidates.length}곳
            <span className="ml-2 font-medium text-amber-600/80">— 클릭하면 영업관리·업체 데이터가 자동 입력된 등록 폼이 열립니다.</span>
          </p>
          <div className="mt-2.5 flex flex-wrap gap-2">
            {candidates.map((c) => (
              <button
                key={c.hospital_id}
                type="button"
                onClick={() => { setCreateTarget(`h:${c.hospital_id}`); setShowCreateForm(true); }}
                className="rounded-full border border-amber-300 bg-white px-3 py-1.5 text-xs font-bold text-zinc-700 transition hover:border-amber-500 hover:shadow-sm"
              >
                {c.name}
                {c.reseller_name && <span className="ml-1 font-normal text-zinc-400">· {c.reseller_name}</span>}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="rounded-2xl border border-zinc-200 bg-white p-5">
        <h2 className="text-lg font-black text-offblack">정산 등록 현황</h2>

        {/* 필터: 업체명 검색만 */}
        <div className="mt-4 flex items-center gap-2">
          <div className="relative flex-1 max-w-md">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="업체명 또는 슬러그로 검색"
              className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm outline-none focus:border-zinc-900"
            />
          </div>
          {search && (
            <button type="button" onClick={() => setSearch('')} className="text-xs text-zinc-500 hover:text-offblack underline">
              초기화
            </button>
          )}
        </div>

        {/* 서브탭 */}
        <div className="mt-4 flex items-center gap-1 border-b border-zinc-200">
          {[['preparing', '준비중', counts.preparing], ['open', '오픈', counts.open], ['terminated', '해지', counts.terminated], ['all', '전체', counts.all]].map(([k, l, n]) => (
            <button
              key={k}
              type="button"
              onClick={() => setSubTab(k)}
              className={cx(
                'border-b-2 px-5 py-2 text-sm font-bold transition',
                subTab === k ? 'border-accent text-accent' : 'border-transparent text-zinc-500 hover:text-offblack'
              )}
            >
              {l} <span className="text-xs font-normal opacity-60">{n}</span>
            </button>
          ))}
        </div>

        {/* 테이블 — 업체당 1행, 셀 안에 2줄 스택으로 압축 (행 클릭 = 상세/수정) */}
        <div className="mt-3 overflow-x-auto">
          <table className="w-full min-w-[960px] text-xs">
            <thead>
              <tr className="border-b-2 border-zinc-200 bg-zinc-50 text-zinc-600">
                <th className="px-2 py-2.5 text-center font-bold w-12">번호</th>
                <th className="px-3 py-2.5 text-left font-bold">고객사 <span className="font-normal text-zinc-400">(담당자 · 연락처)</span></th>
                <th className="px-3 py-2.5 text-left font-bold">영업대행사</th>
                <th className="px-2 py-2.5 text-center font-bold w-28">관리현황</th>
                <th className="px-3 py-2.5 text-right font-bold">구축비 <span className="font-normal text-zinc-400">(기간·결제)</span></th>
                <th className="px-3 py-2.5 text-right font-bold">월관리비 <span className="font-normal text-zinc-400">(기간·결제)</span></th>
                <th className="px-3 py-2.5 text-left font-bold w-40">메모</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={7} className="py-12 text-center text-sm text-zinc-400">조회된 데이터가 없습니다.</td></tr>
              ) : filtered.map((b, idx) => {
                const status = b.status || 'building_pending';
                const clientSub = [b.client_manager_name, b.client_phone].filter(Boolean).join(' · ');
                const agencySub = [b.agency_manager_name, b.agency_phone].filter(Boolean).join(' · ');
                return (
                  <tr key={b.id} className="border-b border-zinc-100 hover:bg-zinc-50 cursor-pointer" onClick={() => setEditingHospitalId(b.hospital_id)}>
                    <td className="px-2 py-2.5 text-center text-zinc-400">{String(filtered.length - idx).padStart(3, '0')}</td>
                    <td className="px-3 py-2.5">
                      <span className="block font-bold text-accent">{b.hospital_name}</span>
                      <span className="block text-[11px] text-zinc-400">{clientSub || '-'}</span>
                    </td>
                    <td className="px-3 py-2.5">
                      <span className="block font-semibold text-zinc-700">{b.agency_name || '-'}</span>
                      {agencySub && <span className="block text-[11px] text-zinc-400">{agencySub}</span>}
                    </td>
                    <td className="px-2 py-2.5 text-center" onClick={(e) => e.stopPropagation()}>
                      <InlineStatusSelect
                        status={status}
                        onChange={(next) => changeStatus(b.hospital_id, next)}
                        disabled={!isSuper}
                      />
                    </td>
                    <td className="px-3 py-2.5 text-right whitespace-nowrap">
                      <span className="block font-bold text-zinc-800">
                        {Number(b.setup_fee) > 0 ? formatNumber(b.setup_fee) : '-'}
                        {Number(b.setup_fee) > 0 && (
                          b.build_paid
                            ? <span className="ml-1 font-bold text-emerald-600">완납</span>
                            : <span className="ml-1 font-bold text-amber-500">미납</span>
                        )}
                      </span>
                      <span className="block text-[11px] text-zinc-400">{b.setup_date ? `${b.setup_date}${b.build_end_date ? ` ~ ${b.build_end_date}` : ' ~'}` : '-'}</span>
                    </td>
                    <td className="px-3 py-2.5 text-right whitespace-nowrap">
                      <span className="block font-bold text-zinc-800">
                        {Number(b.monthly_fee) > 0 ? `월 ${formatNumber(b.monthly_fee)}` : '-'}
                        {Number(b.monthly_fee) > 0 && (
                          b.maintenance_paid
                            ? <span className="ml-1 font-bold text-emerald-600">완납</span>
                            : <span className="ml-1 font-bold text-amber-500">미납</span>
                        )}
                      </span>
                      <span className="block text-[11px] text-zinc-400">{b.subscription_start_date ? `${b.subscription_start_date}${b.contract_end_date ? ` ~ ${b.contract_end_date}` : ' ~'}` : '-'}</span>
                    </td>
                    <td className="px-3 py-2.5 text-zinc-500 max-w-[200px] truncate" title={b.notes || ''}>{b.notes || '-'}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* 하단: 등록 버튼 */}
        {isSuper && (
          <div className="mt-4 flex items-center justify-between">
            <button
              type="button"
              onClick={() => setShowCreateForm(true)}
              className="rounded-lg bg-accent px-4 py-2 text-sm font-bold text-white hover:bg-accent-hover"
            >
              정산 등록
            </button>
          </div>
        )}
      </div>

      {/* 편집 모달 */}
      {editingHospitalId !== null && (
        <BillingEditModal
          hospitalId={editingHospitalId}
          hospitals={hospitals}
          session={session}
          onClose={() => setEditingHospitalId(null)}
          onSaved={async () => { await refresh(); }}
        />
      )}
      {showCreateForm && (
        <BillingEditModal
          hospitalId={null}
          hospitals={hospitals.filter((h) => !billings.some((b) => b.hospital_id === h.id))}
          candidates={candidates}
          initialTarget={createTarget}
          session={session}
          onClose={() => { setShowCreateForm(false); setCreateTarget(null); }}
          onSaved={async () => { await refresh(); }}
        />
      )}
    </div>
  );
}

function StatusToggle({ status, canEdit, onChange }) {
  const tone = STATUS_TONE[status] || 'zinc';
  const label = STATUS_LABEL[status] || status;
  if (!canEdit) {
    return <Badge tone={tone}>{label}</Badge>;
  }
  return (
    <div className="inline-flex flex-col items-center gap-1">
      <Badge tone={tone}>{label}</Badge>
      {status === 'preparing' && (
        <button
          type="button"
          onClick={() => onChange('open')}
          className="rounded bg-emerald-500 px-2 py-0.5 text-[10px] font-bold text-white hover:bg-emerald-600"
        >
          서비스 오픈
        </button>
      )}
      {status === 'open' && (
        <button
          type="button"
          onClick={() => { if (confirm('해지 처리하시겠습니까?')) onChange('terminated'); }}
          className="rounded bg-zinc-500 px-2 py-0.5 text-[10px] font-bold text-white hover:bg-zinc-600"
        >
          해지
        </button>
      )}
      {status === 'terminated' && (
        <button
          type="button"
          onClick={() => onChange('preparing')}
          className="rounded bg-amber-500 px-2 py-0.5 text-[10px] font-bold text-white hover:bg-amber-600"
        >
          재개
        </button>
      )}
    </div>
  );
}

function BillingEditModal({ hospitalId, hospitals, session, onClose, onSaved, candidates = [], initialTarget = null }) {
  const [selectedHospitalId, setSelectedHospitalId] = useState(hospitalId);
  // 등록 대상: 'h:ID'(생성된 업체) | 'p:ID'(영업 거래처) | ''
  const [target, setTarget] = useState(initialTarget || '');
  const [autoFilled, setAutoFilled] = useState(null); // 자동 채움 안내 문구
  const [prospects, setProspects] = useState([]);
  const [form, setForm] = useState({
    // 고객사
    clientManagerName: '', clientPhone: '',
    // 영업대행사
    agencyName: '', agencyManagerName: '', agencyPhone: '',
    // 관리현황
    status: 'building_pending',
    // 홈페이지 구축
    setupDate: '', buildEndDate: '', buildPaid: 0, setupFee: '',
    // 홈페이지 유지관리
    subscriptionStartDate: '', contractEndDate: '', maintenancePaid: 0, monthlyFee: '',
    // 메모
    notes: '',
    // 추가
    contractMonths: '12', serviceOpenDate: '', terminatedDate: '', managerName: '',
  });
  const [memos, setMemos] = useState([]);
  const [memoBody, setMemoBody] = useState('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [savingMemo, setSavingMemo] = useState(false);
  const [notice, setNotice] = useState(null);

  const isSuper = session?.role === 'super_admin';
  const isEdit = hospitalId !== null;

  useEffect(() => {
    if (!selectedHospitalId) return;
    setLoading(true);
    fetch(`/api/admin/billings/${selectedHospitalId}`, { credentials: 'same-origin' })
      .then((r) => r.json())
      .then((data) => {
        const b = data?.billing;
        if (b) {
          setForm({
            clientManagerName: b.client_manager_name || '',
            clientPhone: b.client_phone || '',
            agencyName: b.agency_name || '',
            agencyManagerName: b.agency_manager_name || '',
            agencyPhone: b.agency_phone || '',
            status: b.status || 'building_pending',
            setupDate: b.setup_date || '',
            buildEndDate: b.build_end_date || '',
            buildPaid: b.build_paid ? 1 : 0,
            setupFee: String(b.setup_fee ?? ''),
            subscriptionStartDate: b.subscription_start_date || '',
            contractEndDate: b.contract_end_date || '',
            maintenancePaid: b.maintenance_paid ? 1 : 0,
            monthlyFee: String(b.monthly_fee ?? ''),
            notes: b.notes || '',
            contractMonths: String(b.contract_months ?? 12),
            serviceOpenDate: b.service_open_date || '',
            terminatedDate: b.terminated_date || '',
            managerName: b.manager_name || '',
          });
          setMemos(b.memos || []);
        }
      })
      .finally(() => setLoading(false));
  }, [selectedHospitalId]);

  // 등록 모드: 리셀러가 등록한 영업 거래처 목록 로드
  useEffect(() => {
    if (isEdit) return;
    fetch('/api/admin/sales/prospects', { credentials: 'same-origin' })
      .then((r) => r.json())
      .then((d) => { if (Array.isArray(d)) setProspects(d); })
      .catch(() => {});
  }, [isEdit]);

  // 대상 선택 → 영업관리·업체 데이터로 자동 채움
  function applyTarget(value) {
    setTarget(value);
    setAutoFilled(null);
    if (!value) return;
    if (value.startsWith('h:')) {
      const c = candidates.find((x) => x.hospital_id === Number(value.slice(2)));
      if (!c) return;
      const filled = [];
      setForm((f) => {
        const next = { ...f };
        if (c.doctor_name) { next.clientManagerName = c.doctor_name; filled.push('담당자(원장)'); }
        if (c.prospect_phone) { next.clientPhone = c.prospect_phone; filled.push('연락처'); }
        if (c.reseller_name) { next.agencyName = c.reseller_name; filled.push('대행사(리셀러)'); }
        if (!next.setupDate && c.created_at) { next.setupDate = String(c.created_at).slice(0, 10); filled.push('구축 시작일(업체 생성일)'); }
        if (c.site_status === 'active') { next.status = 'managing_active'; filled.push('상태(사이트 운영중→관리진행)'); }
        return next;
      });
      setAutoFilled(filled.length ? `"${c.name}" 데이터에서 자동 입력: ${filled.join(', ')} — 확인 후 저장하세요.` : null);
    } else if (value.startsWith('p:')) {
      const p = prospects.find((x) => x.id === Number(value.slice(2)));
      if (!p) return;
      const filled = [];
      setForm((f) => {
        const next = { ...f };
        if (p.doctor_name) { next.clientManagerName = p.doctor_name; filled.push('담당자(원장)'); }
        if (p.phone) { next.clientPhone = p.phone; filled.push('연락처'); }
        if (p.reseller_name) { next.agencyName = p.reseller_name; filled.push('대행사(리셀러)'); }
        return next;
      });
      setAutoFilled(filled.length ? `영업 거래처 "${p.name}"에서 자동 입력: ${filled.join(', ')} — 확인 후 저장하세요.` : null);
    }
  }

  // 미등록 업체 칩에서 열린 경우 — 후보 목록이 준비되면 즉시 자동 채움
  useEffect(() => {
    if (!isEdit && initialTarget) applyTarget(initialTarget);
    // eslint-disable-next-line
  }, []);

  function set(key) {
    return (e) => setForm((p) => ({ ...p, [key]: e.target.value }));
  }
  function setFlag(key) {
    return (e) => setForm((p) => ({ ...p, [key]: e.target.checked ? 1 : 0 }));
  }

  async function save() {
    if (isEdit ? !selectedHospitalId : !target) {
      setNotice({ tone: 'error', message: isEdit ? '업체를 선택해 주세요.' : '정산 대상(생성된 업체 또는 영업 거래처)을 선택해 주세요.' });
      return;
    }
    setSaving(true); setNotice(null);
    try {
      let targetBody;
      if (isEdit) {
        targetBody = { hospitalId: selectedHospitalId };
      } else if (target.startsWith('h:')) {
        const hid = Number(target.slice(2));
        const c = candidates.find((x) => x.hospital_id === hid);
        // 연결된 영업 거래처가 있으면 정산에도 함께 연결
        targetBody = { hospitalId: hid, ...(c?.prospect_id ? { prospectId: c.prospect_id } : {}) };
      } else {
        targetBody = { prospectId: Number(target.slice(2)) };
      }
      const res = await fetch('/api/admin/billings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({
          ...targetBody,
          clientManagerName: form.clientManagerName,
          clientPhone: form.clientPhone,
          agencyName: form.agencyName,
          agencyManagerName: form.agencyManagerName,
          agencyPhone: form.agencyPhone,
          status: form.status,
          setupDate: form.setupDate || null,
          buildEndDate: form.buildEndDate || null,
          buildPaid: !!form.buildPaid,
          setupFee: Number(form.setupFee || 0),
          subscriptionStartDate: form.subscriptionStartDate || null,
          contractEndDate: form.contractEndDate || null,
          maintenancePaid: !!form.maintenancePaid,
          monthlyFee: Number(form.monthlyFee || 0),
          notes: form.notes,
          contractMonths: Number(form.contractMonths || 0),
          serviceOpenDate: form.serviceOpenDate || null,
          terminatedDate: form.terminatedDate || null,
          managerName: form.managerName,
        }),
      });
      const data = await res.json();
      if (!res.ok || data.error) throw new Error(data.error);
      await onSaved?.();
      setNotice({ tone: 'success', message: '저장되었습니다.' });
    } catch (e) {
      setNotice({ tone: 'error', message: e.message });
    } finally {
      setSaving(false);
    }
  }

  async function remove() {
    if (!selectedHospitalId || !isEdit) return;
    if (!confirm('이 업체의 정산 정보와 모든 메모를 삭제하시겠습니까?')) return;
    try {
      const res = await fetch(`/api/admin/billings/${selectedHospitalId}`, { method: 'DELETE', credentials: 'same-origin' });
      const data = await res.json();
      if (!res.ok || data.error) throw new Error(data.error);
      await onSaved?.();
      onClose?.();
    } catch (e) {
      setNotice({ tone: 'error', message: e.message });
    }
  }

  async function postMemo() {
    if (!selectedHospitalId || !memoBody.trim()) return;
    setSavingMemo(true);
    try {
      const res = await fetch(`/api/admin/billings/${selectedHospitalId}/memos`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({ body: memoBody }),
      });
      const data = await res.json();
      if (!res.ok || data.error) throw new Error(data.error);
      setMemoBody('');
      const r = await fetch(`/api/admin/billings/${selectedHospitalId}`, { credentials: 'same-origin' });
      const d = await r.json();
      if (d?.billing) setMemos(d.billing.memos || []);
    } catch (e) {
      setNotice({ tone: 'error', message: e.message });
    } finally {
      setSavingMemo(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <div
        className="w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-black text-offblack">{isEdit ? '정산 정보 관리' : '정산 등록'}</h3>
          <button type="button" onClick={onClose} className="text-zinc-400 hover:text-offblack text-2xl leading-none">×</button>
        </div>

        {notice && <Notice tone={notice.tone} message={notice.message} />}

        {!isEdit && (
          <Field label="정산 대상 선택">
            <SelectField value={target} onChange={(e) => applyTarget(e.target.value)}>
              <option value="">정산 대상 선택 — 생성된 업체 또는 영업 거래처</option>
              {candidates.length > 0 && (
                <optgroup label={`생성된 업체 · 정산 미등록 (${candidates.length})`}>
                  {candidates.map((c) => (
                    <option key={`h${c.hospital_id}`} value={`h:${c.hospital_id}`}>
                      {c.name}{c.reseller_name ? ` · ${c.reseller_name}` : ''}
                    </option>
                  ))}
                </optgroup>
              )}
              <optgroup label="영업 거래처 (리셀러 등록)">
                {prospects.map((p) => (
                  <option key={`p${p.id}`} value={`p:${p.id}`}>
                    {p.name}{p.reseller_name ? ` · ${p.reseller_name}` : ''}{p.doctor_name ? ` · ${p.doctor_name}` : ''}{p.linked_hospital_id ? ' (연결됨)' : ''}
                  </option>
                ))}
              </optgroup>
            </SelectField>
            <p className="mt-1 text-[11px] text-zinc-400">
              선택하면 영업관리·업체 데이터(담당자·연락처·리셀러·생성일)가 자동 입력됩니다. 영업 거래처 선택 시 정산용 업체로 자동 연결됩니다.
            </p>
            {autoFilled && (
              <p className="mt-2 rounded-lg bg-sky-50 px-3 py-2 text-[12px] font-medium text-sky-700">✦ {autoFilled}</p>
            )}
          </Field>
        )}

        {loading ? (
          <p className="py-8 text-center text-sm text-zinc-400">불러오는 중...</p>
        ) : (
          <div className="space-y-4 mt-3">
            {/* 관리현황 */}
            <div className="rounded-xl border border-zinc-200 p-3">
              <p className="mb-2 text-xs font-bold text-zinc-500">관리현황</p>
              <Field label="상태">
                <SelectField value={form.status} onChange={set('status')} disabled={!isSuper}>
                  {STATUS_OPTIONS.map(([v, l]) => (<option key={v} value={v}>{l}</option>))}
                </SelectField>
              </Field>
            </div>

            {/* 고객사 */}
            <div className="rounded-xl border border-pink-200 bg-pink-50/30 p-3">
              <p className="mb-2 text-xs font-bold text-zinc-500">고객사</p>
              <div className="grid gap-3 md:grid-cols-2">
                <Field label="담당자">
                  <Input value={form.clientManagerName} onChange={set('clientManagerName')} placeholder="담당자명" disabled={!isSuper} />
                </Field>
                <Field label="연락처">
                  <Input value={form.clientPhone} onChange={set('clientPhone')} placeholder="010-0000-0000" disabled={!isSuper} />
                </Field>
              </div>
            </div>

            {/* 영업대행사 */}
            <div className="rounded-xl border border-accent/40 bg-accent-soft/40 p-3">
              <p className="mb-2 text-xs font-bold text-zinc-500">영업대행사</p>
              <div className="grid gap-3 md:grid-cols-3">
                <Field label="대행사명">
                  <Input value={form.agencyName} onChange={set('agencyName')} placeholder="예: 한번마케팅" disabled={!isSuper} />
                </Field>
                <Field label="담당자">
                  <Input value={form.agencyManagerName} onChange={set('agencyManagerName')} placeholder="담당자명" disabled={!isSuper} />
                </Field>
                <Field label="연락처">
                  <Input value={form.agencyPhone} onChange={set('agencyPhone')} placeholder="010-0000-0000" disabled={!isSuper} />
                </Field>
              </div>
            </div>

            {/* 홈페이지 구축 정보 */}
            <div className="rounded-xl border border-pink-200 bg-pink-50/30 p-3">
              <p className="mb-2 text-xs font-bold text-zinc-500">홈페이지 구축 정보 (원, VAT 포함)</p>
              <div className="grid gap-3 md:grid-cols-2">
                <Field label="구축 시작일">
                  <Input type="date" value={form.setupDate} onChange={set('setupDate')} disabled={!isSuper} />
                </Field>
                <Field label="구축 종료일">
                  <Input type="date" value={form.buildEndDate} onChange={set('buildEndDate')} disabled={!isSuper} />
                </Field>
                <Field label="구축비 (원)">
                  <Input type="number" min="0" value={form.setupFee} onChange={set('setupFee')} disabled={!isSuper} />
                </Field>
                <label className="flex items-center gap-2 pt-6 text-sm font-semibold text-zinc-700">
                  <input
                    type="checkbox"
                    checked={!!form.buildPaid}
                    onChange={setFlag('buildPaid')}
                    disabled={!isSuper}
                    className="h-4 w-4 accent-emerald-600"
                  />
                  결제 완료
                </label>
              </div>
            </div>

            {/* 홈페이지 유지관리 정보 */}
            <div className="rounded-xl border border-emerald-200 bg-emerald-50/30 p-3">
              <p className="mb-2 text-xs font-bold text-zinc-500">홈페이지 유지관리 정보 (원, VAT 포함)</p>
              <div className="grid gap-3 md:grid-cols-2">
                <Field label="관리 시작일">
                  <Input type="date" value={form.subscriptionStartDate} onChange={set('subscriptionStartDate')} disabled={!isSuper} />
                </Field>
                <Field label="관리 종료일">
                  <Input type="date" value={form.contractEndDate} onChange={set('contractEndDate')} disabled={!isSuper} />
                </Field>
                <Field label="유지관리비 (원)">
                  <Input type="number" min="0" value={form.monthlyFee} onChange={set('monthlyFee')} disabled={!isSuper} />
                </Field>
                <label className="flex items-center gap-2 pt-6 text-sm font-semibold text-zinc-700">
                  <input
                    type="checkbox"
                    checked={!!form.maintenancePaid}
                    onChange={setFlag('maintenancePaid')}
                    disabled={!isSuper}
                    className="h-4 w-4 accent-emerald-600"
                  />
                  결제 완료
                </label>
              </div>
              <div className="mt-3 grid gap-3 md:grid-cols-2">
                <Field label="계약 기간 (개월)">
                  <Input type="number" min="0" value={form.contractMonths} onChange={set('contractMonths')} disabled={!isSuper} />
                </Field>
                {form.status === 'terminated' && (
                  <Field label="해지일">
                    <Input type="date" value={form.terminatedDate} onChange={set('terminatedDate')} disabled={!isSuper} />
                  </Field>
                )}
              </div>
            </div>

            <Field label="메모">
              <Textarea value={form.notes} onChange={set('notes')} rows={3} placeholder="결제 방식, 특이사항 등" disabled={!isSuper} />
            </Field>

            {isSuper && (
              <div className="flex justify-end gap-2 border-t border-zinc-100 pt-3">
                {isEdit && (
                  <button type="button" onClick={remove} className="rounded-xl border border-red-200 bg-white px-4 py-2 text-sm font-bold text-red-600 hover:bg-red-50">
                    삭제
                  </button>
                )}
                <Btn onClick={save} disabled={saving}>{saving ? '저장 중…' : '저장'}</Btn>
              </div>
            )}

            {/* 메모 */}
            {isEdit && (
              <div className="border-t border-zinc-100 pt-4">
                <h4 className="text-sm font-black text-offblack">메모 ({memos.length})</h4>
                <div className="mt-2 flex items-start gap-2">
                  <Textarea value={memoBody} onChange={(e) => setMemoBody(e.target.value)} rows={2} placeholder="메모 입력..." />
                  <Btn onClick={postMemo} disabled={savingMemo || !memoBody.trim()}>등록</Btn>
                </div>
                <ul className="mt-3 space-y-2">
                  {memos.length === 0 ? (
                    <li className="text-xs text-zinc-400">등록된 메모가 없습니다.</li>
                  ) : memos.map((m) => (
                    <li key={m.id} className="rounded-lg border border-zinc-100 bg-zinc-50/60 px-3 py-2 text-sm">
                      <div className="flex items-center gap-2">
                        <Badge tone={m.role === 'super_admin' ? 'accent' : 'amber'}>
                          {m.role === 'super_admin' ? '슈퍼' : m.role === 'reseller' ? '리셀러' : m.role}
                        </Badge>
                        <span className="text-[11px] font-bold text-zinc-700">{m.account_name || m.account_email || '—'}</span>
                        <span className="text-[10px] text-zinc-400">{(m.created_at || '').slice(0, 16).replace('T', ' ')}</span>
                      </div>
                      <p className="mt-1 whitespace-pre-wrap text-zinc-700">{m.body}</p>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ── 월별 정산 뷰 ────────────────────────────────────────────────────────────

function InvoicesView({ session }) {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [year, setYear] = useState('');
  const [paymentStatus, setPaymentStatus] = useState('');
  const [editing, setEditing] = useState(null); // { id?, ... } 또는 null
  const [paymentTarget, setPaymentTarget] = useState(null);
  const [notice, setNotice] = useState(null);

  const isSuper = session?.role === 'super_admin';

  async function load() {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (year) params.set('year', year);
      if (paymentStatus) params.set('paymentStatus', paymentStatus);
      const res = await fetch(`/api/admin/billings/invoices?${params}`, { credentials: 'same-origin' });
      const data = await res.json();
      if (!res.ok || data.error) throw new Error(data.error);
      setInvoices(data.invoices || []);
    } catch (e) {
      setNotice({ tone: 'error', message: e.message });
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => { load(); /* eslint-disable-next-line */ }, [year, paymentStatus]);

  async function deleteInvoice(id) {
    if (!confirm('이 청구 행을 삭제하시겠습니까?')) return;
    try {
      const res = await fetch(`/api/admin/billings/invoices/${id}`, { method: 'DELETE', credentials: 'same-origin' });
      const data = await res.json();
      if (!res.ok || data.error) throw new Error(data.error);
      await load();
      setNotice({ tone: 'success', message: '청구가 삭제되었습니다.' });
    } catch (e) {
      setNotice({ tone: 'error', message: e.message });
    }
  }

  // 연도 옵션
  const years = Array.from(new Set(invoices.map((i) => (i.billing_month || '').slice(0, 4)).filter(Boolean))).sort().reverse();

  return (
    <div className="p-6 space-y-4">
      {notice && <Notice tone={notice.tone} message={notice.message} />}

      <div className="rounded-2xl border border-zinc-200 bg-white p-5">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-black text-offblack">월별 정산</h2>
          {isSuper && (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={async () => {
                  const m = prompt('자동 생성할 청구월 (YYYY-MM)', new Date().toISOString().slice(0, 7));
                  if (!m) return;
                  try {
                    const res = await fetch('/api/admin/billings/invoices/regenerate', {
                      method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'same-origin',
                      body: JSON.stringify({ month: m }),
                    });
                    const data = await res.json();
                    if (!res.ok || data.error) throw new Error(data.error);
                    await load();
                    setNotice({ tone: 'success', message: `${m} 자동 생성 완료 (${data.action || ''})` });
                  } catch (e) { setNotice({ tone: 'error', message: e.message }); }
                }}
                className="rounded-lg border border-accent/40 bg-accent-soft px-3 py-1.5 text-xs font-bold text-accent hover:bg-accent-soft"
              >
                선택 월 자동 생성
              </button>
              <button
                type="button"
                onClick={async () => {
                  if (!confirm('등록 현황 데이터를 기준으로 모든 월 청구를 자동 재계산합니다. (입금액은 보존)')) return;
                  try {
                    const res = await fetch('/api/admin/billings/invoices/regenerate', {
                      method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'same-origin',
                      body: JSON.stringify({}),
                    });
                    const data = await res.json();
                    if (!res.ok || data.error) throw new Error(data.error);
                    await load();
                    setNotice({ tone: 'success', message: `전체 ${data.processed}/${data.totalMonths}개월 재생성 완료` });
                  } catch (e) { setNotice({ tone: 'error', message: e.message }); }
                }}
                className="rounded-lg border border-zinc-300 bg-white px-3 py-1.5 text-xs font-bold text-zinc-700 hover:bg-zinc-50"
              >
                전체 재계산
              </button>
            </div>
          )}
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-2">
          <SelectField value={year} onChange={(e) => setYear(e.target.value)} className="w-32">
            <option value="">-청구연도-</option>
            {years.map((y) => (<option key={y} value={y}>{y}</option>))}
            {[new Date().getFullYear(), new Date().getFullYear() - 1].map((y) => (
              !years.includes(String(y)) ? <option key={y} value={String(y)}>{y}</option> : null
            ))}
          </SelectField>
          <SelectField value={paymentStatus} onChange={(e) => setPaymentStatus(e.target.value)} className="w-32">
            <option value="">-결제 상태-</option>
            <option value="unpaid">미납</option>
            <option value="partial">부분납</option>
            <option value="paid">완납</option>
          </SelectField>
        </div>

        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[1200px] text-sm">
            <thead>
              <tr className="border-b border-zinc-200 bg-zinc-50 text-xs">
                <th className="px-3 py-2.5 text-center font-bold text-zinc-600">청구월</th>
                <th className="px-3 py-2.5 text-center font-bold text-zinc-600">정산시작일</th>
                <th className="px-3 py-2.5 text-center font-bold text-zinc-600">정산종료일</th>
                <th className="px-3 py-2.5 text-center font-bold text-zinc-600">청구건수</th>
                <th className="px-3 py-2.5 text-right font-bold text-zinc-600">공급가액</th>
                <th className="px-3 py-2.5 text-right font-bold text-zinc-600">부가세</th>
                <th className="px-3 py-2.5 text-right font-bold text-zinc-600">당월 정산액</th>
                <th className="px-3 py-2.5 text-right font-bold text-zinc-600">당월미납액</th>
                <th className="px-3 py-2.5 text-right font-bold text-zinc-600">누적 미납액</th>
                <th className="px-3 py-2.5 text-right font-bold text-zinc-600">총 납부금액</th>
                <th className="px-3 py-2.5 text-right font-bold text-zinc-600">입금액</th>
                <th className="px-3 py-2.5 text-center font-bold text-zinc-600">결제상태</th>
                <th className="px-3 py-2.5 text-center font-bold text-zinc-600">상세</th>
                <th className="px-3 py-2.5 text-center font-bold text-zinc-600">결제처리</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={14} className="py-8 text-center text-sm text-zinc-400">불러오는 중...</td></tr>
              ) : invoices.length === 0 ? (
                <tr><td colSpan={14} className="py-12 text-center text-sm text-zinc-400">조회된 데이터가 없습니다.</td></tr>
              ) : invoices.map((inv) => (
                <tr key={inv.id} className="border-b border-zinc-100 hover:bg-zinc-50">
                  <td className="px-3 py-3 text-center font-bold text-offblack">{inv.billing_month}</td>
                  <td className="px-3 py-3 text-center text-zinc-600">{inv.period_start}</td>
                  <td className="px-3 py-3 text-center text-zinc-600">{inv.period_end}</td>
                  <td className="px-3 py-3 text-center text-zinc-600">{inv.item_count}</td>
                  <td className="px-3 py-3 text-right text-zinc-700">{formatNumber(inv.supply_amount)}</td>
                  <td className="px-3 py-3 text-right text-zinc-700">{formatNumber(inv.vat)}</td>
                  <td className="px-3 py-3 text-right font-bold text-offblack">{formatNumber(inv.settlement_amount)}</td>
                  <td className="px-3 py-3 text-right font-bold text-red-600">{formatNumber(inv.monthly_unpaid)}</td>
                  <td className="px-3 py-3 text-right font-bold text-red-600">{formatNumber(inv.cumulative_unpaid)}</td>
                  <td className="px-3 py-3 text-right text-zinc-700">{formatNumber(inv.total_paid)}</td>
                  <td className="px-3 py-3 text-right text-zinc-700">{formatNumber(inv.paid_amount)}</td>
                  <td className="px-3 py-3 text-center">
                    <Badge tone={inv.payment_status === 'paid' ? 'green' : inv.payment_status === 'partial' ? 'amber' : 'zinc'}>
                      {PAYMENT_LABEL[inv.payment_status] || inv.payment_status}
                    </Badge>
                  </td>
                  <td className="px-3 py-3 text-center">
                    <button
                      type="button"
                      onClick={() => setEditing(inv)}
                      className="rounded-lg bg-accent px-3 py-1.5 text-xs font-bold text-white hover:bg-accent-hover"
                    >
                      상세보기
                    </button>
                  </td>
                  <td className="px-3 py-3 text-center">
                    {isSuper ? (
                      <button
                        type="button"
                        onClick={() => setPaymentTarget(inv)}
                        className="rounded-lg border border-zinc-300 bg-white px-3 py-1.5 text-xs font-bold text-zinc-700 hover:bg-zinc-50"
                      >
                        결제처리
                      </button>
                    ) : (
                      <span className="text-zinc-400">-</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {isSuper && (
          <div className="mt-4">
            <button
              type="button"
              onClick={() => setEditing({})}
              className="rounded-lg bg-accent px-4 py-2 text-sm font-bold text-white hover:bg-accent-hover"
            >
              청구 등록
            </button>
          </div>
        )}
      </div>

      {editing !== null && (
        <InvoiceEditModal
          initial={editing}
          isSuper={isSuper}
          onClose={() => setEditing(null)}
          onSaved={async () => { await load(); setEditing(null); }}
          onDelete={editing.id ? () => deleteInvoice(editing.id) : null}
        />
      )}
      {paymentTarget && (
        <PaymentModal
          invoice={paymentTarget}
          onClose={() => setPaymentTarget(null)}
          onSaved={async () => { await load(); setPaymentTarget(null); }}
        />
      )}
    </div>
  );
}

function InvoiceEditModal({ initial, isSuper, onClose, onSaved, onDelete }) {
  const [form, setForm] = useState({
    id: initial.id || null,
    billingMonth: initial.billing_month || '',
    periodStart: initial.period_start || '',
    periodEnd: initial.period_end || '',
    itemCount: String(initial.item_count ?? 0),
    supplyAmount: String(initial.supply_amount ?? 0),
    vat: String(initial.vat ?? 0),
    settlementAmount: String(initial.settlement_amount ?? 0),
    paidAmount: String(initial.paid_amount ?? 0),
    paidAt: initial.paid_at || '',
    notes: initial.notes || '',
  });
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState(null);

  // 공급가액·부가세 변경 시 정산액 자동 계산 (수동 override 가능)
  function set(key) {
    return (e) => {
      const v = e.target.value;
      setForm((p) => {
        const next = { ...p, [key]: v };
        if (key === 'supplyAmount' || key === 'vat') {
          next.settlementAmount = String((Number(next.supplyAmount) || 0) + (Number(next.vat) || 0));
        }
        return next;
      });
    };
  }

  async function save() {
    setSaving(true); setNotice(null);
    try {
      const res = await fetch('/api/admin/billings/invoices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({
          id: form.id,
          billingMonth: form.billingMonth,
          periodStart: form.periodStart,
          periodEnd: form.periodEnd,
          itemCount: Number(form.itemCount || 0),
          supplyAmount: Number(form.supplyAmount || 0),
          vat: Number(form.vat || 0),
          settlementAmount: Number(form.settlementAmount || 0),
          paidAmount: Number(form.paidAmount || 0),
          paidAt: form.paidAt || null,
          notes: form.notes,
        }),
      });
      const data = await res.json();
      if (!res.ok || data.error) throw new Error(data.error);
      await onSaved?.();
    } catch (e) {
      setNotice({ tone: 'error', message: e.message });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-black text-offblack">{form.id ? '청구 상세' : '청구 등록'}</h3>
          <button type="button" onClick={onClose} className="text-zinc-400 hover:text-offblack text-2xl leading-none">×</button>
        </div>
        {notice && <Notice tone={notice.tone} message={notice.message} />}
        <div className="grid gap-3 md:grid-cols-3 mt-3">
          <Field label="청구월 (YYYY-MM)">
            <Input value={form.billingMonth} onChange={set('billingMonth')} placeholder="2026-05" disabled={!isSuper} />
          </Field>
          <Field label="정산 시작일">
            <Input type="date" value={form.periodStart} onChange={set('periodStart')} disabled={!isSuper} />
          </Field>
          <Field label="정산 종료일">
            <Input type="date" value={form.periodEnd} onChange={set('periodEnd')} disabled={!isSuper} />
          </Field>
          <Field label="청구건수">
            <Input type="number" min="0" value={form.itemCount} onChange={set('itemCount')} disabled={!isSuper} />
          </Field>
          <Field label="공급가액 (원)">
            <Input type="number" min="0" value={form.supplyAmount} onChange={set('supplyAmount')} disabled={!isSuper} />
          </Field>
          <Field label="부가세 (원)">
            <Input type="number" min="0" value={form.vat} onChange={set('vat')} disabled={!isSuper} />
          </Field>
          <Field label="당월 정산액 (자동)">
            <Input type="number" min="0" value={form.settlementAmount} onChange={set('settlementAmount')} disabled={!isSuper} />
          </Field>
          <Field label="입금액 (원)">
            <Input type="number" min="0" value={form.paidAmount} onChange={set('paidAmount')} disabled={!isSuper} />
          </Field>
          <Field label="입금일">
            <Input type="date" value={form.paidAt} onChange={set('paidAt')} disabled={!isSuper} />
          </Field>
        </div>
        <Field label="비고" className="mt-3">
          <Textarea value={form.notes} onChange={set('notes')} rows={2} disabled={!isSuper} />
        </Field>
        {isSuper && (
          <div className="mt-4 flex justify-end gap-2 border-t border-zinc-100 pt-3">
            {onDelete && (
              <button type="button" onClick={onDelete} className="rounded-xl border border-red-200 bg-white px-4 py-2 text-sm font-bold text-red-600 hover:bg-red-50">
                삭제
              </button>
            )}
            <Btn onClick={save} disabled={saving}>{saving ? '저장 중…' : '저장'}</Btn>
          </div>
        )}
      </div>
    </div>
  );
}

function PaymentModal({ invoice, onClose, onSaved }) {
  const [paidAmount, setPaidAmount] = useState(String(invoice.paid_amount || 0));
  const [paidAt, setPaidAt] = useState(invoice.paid_at || new Date().toISOString().slice(0, 10));
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState(null);

  async function save() {
    setSaving(true); setNotice(null);
    try {
      const res = await fetch(`/api/admin/billings/invoices/${invoice.id}/payment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({ paidAmount: Number(paidAmount || 0), paidAt: paidAt || null }),
      });
      const data = await res.json();
      if (!res.ok || data.error) throw new Error(data.error);
      await onSaved?.();
    } catch (e) {
      setNotice({ tone: 'error', message: e.message });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-lg font-black text-offblack">결제 처리 — {invoice.billing_month}</h3>
          <button type="button" onClick={onClose} className="text-zinc-400 hover:text-offblack text-2xl leading-none">×</button>
        </div>
        <p className="text-xs text-zinc-500">정산액 {formatNumber(invoice.settlement_amount)}원 / 현재 입금 {formatNumber(invoice.paid_amount)}원</p>
        {notice && <Notice tone={notice.tone} message={notice.message} />}
        <div className="mt-3 grid gap-3">
          <Field label="입금액 (원)">
            <Input type="number" min="0" value={paidAmount} onChange={(e) => setPaidAmount(e.target.value)} />
          </Field>
          <Field label="입금일">
            <Input type="date" value={paidAt} onChange={(e) => setPaidAt(e.target.value)} />
          </Field>
        </div>
        <div className="mt-4 flex justify-end gap-2 border-t border-zinc-100 pt-3">
          <button type="button" onClick={onClose} className="rounded-xl border border-zinc-200 bg-white px-4 py-2 text-sm font-bold text-zinc-700 hover:bg-zinc-50">취소</button>
          <Btn onClick={save} disabled={saving}>{saving ? '저장 중…' : '결제 반영'}</Btn>
        </div>
      </div>
    </div>
  );
}

// ── 레거시 BillingsModule (보존만 — 실제 사용 안 함) ───────────────────────────

// eslint-disable-next-line no-unused-vars
function BillingsModule_LEGACY({ billings: initial, hospitals, session }) {
  const [billings, setBillings] = useState(initial || []);
  const [editingHospitalId, setEditingHospitalId] = useState(null);
  const [editForm, setEditForm] = useState({
    setupFee: '', monthlyFee: '', setupDate: '', subscriptionStartDate: '', notes: '',
  });
  const [memos, setMemos] = useState([]);
  const [memoBody, setMemoBody] = useState('');
  const [savingBilling, setSavingBilling] = useState(false);
  const [savingMemo, setSavingMemo] = useState(false);
  const [notice, setNotice] = useState(null);

  const isSuper = session?.role === 'super_admin';

  // 미등록 업체 (정산이 없는 업체) 목록
  const billingHospitalIds = new Set(billings.map((b) => b.hospital_id));
  const unregisteredHospitals = (hospitals || []).filter((h) => !billingHospitalIds.has(h.id));

  async function refreshBillings() {
    try {
      const res = await fetch('/api/admin/billings');
      const data = await res.json();
      if (Array.isArray(data?.billings)) setBillings(data.billings);
    } catch {/* ignore */}
  }

  async function startEdit(hospitalId) {
    setNotice(null);
    setEditingHospitalId(hospitalId);
    setMemos([]);
    setMemoBody('');
    try {
      const res = await fetch(`/api/admin/billings/${hospitalId}`);
      const data = await res.json();
      const b = data?.billing;
      if (b) {
        setEditForm({
          setupFee: String(b.setup_fee ?? ''),
          monthlyFee: String(b.monthly_fee ?? ''),
          setupDate: b.setup_date || '',
          subscriptionStartDate: b.subscription_start_date || '',
          notes: b.notes || '',
        });
        setMemos(b.memos || []);
      } else {
        setEditForm({ setupFee: '', monthlyFee: '', setupDate: '', subscriptionStartDate: '', notes: '' });
        setMemos([]);
      }
    } catch (err) {
      setNotice({ tone: 'error', message: err.message });
    }
  }

  function setEdit(key) {
    return (e) => setEditForm((p) => ({ ...p, [key]: e.target.value }));
  }

  async function saveBilling() {
    if (!editingHospitalId) return;
    setSavingBilling(true);
    setNotice(null);
    try {
      const res = await fetch('/api/admin/billings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({
          hospitalId: editingHospitalId,
          setupFee: Number(editForm.setupFee || 0),
          monthlyFee: Number(editForm.monthlyFee || 0),
          setupDate: editForm.setupDate || null,
          subscriptionStartDate: editForm.subscriptionStartDate || null,
          notes: editForm.notes || '',
        }),
      });
      const data = await res.json();
      if (!res.ok || data.error) throw new Error(data.error);
      await refreshBillings();
      setNotice({ tone: 'success', message: '정산 정보가 저장되었습니다.' });
    } catch (err) {
      setNotice({ tone: 'error', message: err.message });
    } finally {
      setSavingBilling(false);
    }
  }

  async function deleteBilling() {
    if (!editingHospitalId) return;
    if (!confirm('이 업체의 정산 정보와 모든 메모를 삭제하시겠습니까?')) return;
    try {
      const res = await fetch(`/api/admin/billings/${editingHospitalId}`, { method: 'DELETE', credentials: 'same-origin' });
      const data = await res.json();
      if (!res.ok || data.error) throw new Error(data.error);
      setEditingHospitalId(null);
      setMemos([]);
      await refreshBillings();
      setNotice({ tone: 'success', message: '정산 정보가 삭제되었습니다.' });
    } catch (err) {
      setNotice({ tone: 'error', message: err.message });
    }
  }

  async function postMemo() {
    if (!editingHospitalId || !memoBody.trim()) return;
    setSavingMemo(true);
    try {
      const res = await fetch(`/api/admin/billings/${editingHospitalId}/memos`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({ body: memoBody }),
      });
      const data = await res.json();
      if (!res.ok || data.error) throw new Error(data.error);
      setMemoBody('');
      await startEdit(editingHospitalId);
      await refreshBillings();
    } catch (err) {
      setNotice({ tone: 'error', message: err.message });
    } finally {
      setSavingMemo(false);
    }
  }

  async function deleteMemo(memoId) {
    if (!confirm('메모를 삭제하시겠습니까?')) return;
    try {
      const res = await fetch(`/api/admin/billings/memos/${memoId}`, { method: 'DELETE', credentials: 'same-origin' });
      const data = await res.json();
      if (!res.ok || data.error) throw new Error(data.error);
      await startEdit(editingHospitalId);
    } catch (err) {
      setNotice({ tone: 'error', message: err.message });
    }
  }

  const editingHospital = (hospitals || []).find((h) => h.id === editingHospitalId);

  return (
    <div className="flex flex-col">
      <PageHeader
        title="정산 관리"
        description="업체별 세팅비·월 비용·세팅일·구독 시작일을 등록하고, 메모로 진행 사항을 기록합니다."
      />
      <div className="grid gap-6 p-6 xl:grid-cols-[420px_1fr]">
        <Card>
          <div className="px-5 py-4 border-b border-zinc-100">
            <h2 className="font-black text-offblack">
              정산 등록 업체
              <span className="ml-2 text-sm font-semibold text-zinc-400">{billings.length}개</span>
            </h2>
          </div>
          <ul className="divide-y divide-zinc-100">
            {billings.length === 0 ? (
              <li className="px-5 py-10 text-center text-sm font-semibold text-zinc-400">
                등록된 정산 정보가 없습니다.
              </li>
            ) : billings.map((b) => (
              <li key={b.hospital_id}>
                <button
                  type="button"
                  onClick={() => startEdit(b.hospital_id)}
                  className={`flex w-full items-start justify-between gap-3 px-5 py-3 text-left transition ${editingHospitalId === b.hospital_id ? 'bg-zinc-100' : 'hover:bg-zinc-50'}`}
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-bold text-offblack">{b.hospital_name}</p>
                    <p className="truncate text-[11px] text-zinc-500">
                      세팅 {formatKRW(b.setup_fee)} · 월 {formatKRW(b.monthly_fee)}
                    </p>
                    <p className="text-[10px] text-zinc-400">
                      구독 시작 {b.subscription_start_date || '미정'}
                    </p>
                  </div>
                  {b.memo_count > 0 && (
                    <span className="shrink-0 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-700">
                      메모 {b.memo_count}
                    </span>
                  )}
                </button>
              </li>
            ))}
          </ul>

          {unregisteredHospitals.length > 0 && (
            <div className="border-t border-zinc-100">
              <div className="px-5 py-3 text-[11px] font-bold uppercase tracking-wider text-zinc-400">
                미등록 업체 {unregisteredHospitals.length}개
              </div>
              <ul className="max-h-64 overflow-y-auto divide-y divide-zinc-50">
                {unregisteredHospitals.map((h) => (
                  <li key={h.id}>
                    <button
                      type="button"
                      onClick={() => startEdit(h.id)}
                      className={`flex w-full items-center justify-between gap-2 px-5 py-2 text-left transition ${editingHospitalId === h.id ? 'bg-zinc-100' : 'hover:bg-zinc-50'}`}
                    >
                      <span className="truncate text-sm text-zinc-700">{h.name}</span>
                      <span className="shrink-0 text-[10px] text-zinc-400">미등록</span>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </Card>

        <Card className="p-5">
          {!editingHospitalId ? (
            <div className="flex h-64 items-center justify-center">
              <p className="text-sm font-semibold text-zinc-400">왼쪽에서 업체를 선택해 주세요.</p>
            </div>
          ) : (
            <div className="space-y-5">
              <div>
                <h3 className="font-black text-offblack">{editingHospital?.name || '업체'}</h3>
                <p className="mt-0.5 text-xs text-zinc-500">{editingHospital?.slug}</p>
              </div>
              {notice && <Notice tone={notice.tone} message={notice.message} />}

              <div className="grid gap-3 md:grid-cols-2">
                <Field label="세팅비 (원)">
                  <Input type="number" min="0" value={editForm.setupFee} onChange={setEdit('setupFee')} placeholder="500000" />
                </Field>
                <Field label="월 비용 (원)">
                  <Input type="number" min="0" value={editForm.monthlyFee} onChange={setEdit('monthlyFee')} placeholder="50000" />
                </Field>
                <Field label="세팅 날짜">
                  <Input type="date" value={editForm.setupDate} onChange={setEdit('setupDate')} />
                </Field>
                <Field label="구독 시작일">
                  <Input type="date" value={editForm.subscriptionStartDate} onChange={setEdit('subscriptionStartDate')} />
                </Field>
              </div>
              <Field label="비고">
                <textarea
                  value={editForm.notes}
                  onChange={setEdit('notes')}
                  rows={3}
                  placeholder="결제 방식, 특이사항 등"
                  className="w-full rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm outline-none transition focus:border-zinc-900 focus:bg-white"
                />
              </Field>
              <div className="flex items-center justify-end gap-2">
                {billings.find((b) => b.hospital_id === editingHospitalId) && (
                  <button
                    type="button"
                    onClick={deleteBilling}
                    className="rounded-xl border border-red-200 bg-white px-4 py-2 text-sm font-bold text-red-600 hover:bg-red-50"
                  >
                    삭제
                  </button>
                )}
                <Btn onClick={saveBilling} loading={savingBilling}>저장</Btn>
              </div>

              <div className="border-t border-zinc-100 pt-5">
                <h4 className="text-sm font-black text-offblack">메모 ({memos.length})</h4>
                <p className="mt-1 text-xs text-zinc-500">슈퍼관리자와 담당 리셀러가 작성합니다.</p>

                <div className="mt-3 flex items-start gap-2">
                  <textarea
                    value={memoBody}
                    onChange={(e) => setMemoBody(e.target.value)}
                    rows={2}
                    placeholder="메모 입력..."
                    className="flex-1 rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm outline-none transition focus:border-zinc-900 focus:bg-white"
                  />
                  <Btn onClick={postMemo} loading={savingMemo} disabled={!memoBody.trim()}>등록</Btn>
                </div>

                <ul className="mt-4 space-y-2">
                  {memos.length === 0 ? (
                    <li className="text-xs text-zinc-400">등록된 메모가 없습니다.</li>
                  ) : memos.map((m) => (
                    <li key={m.id} className="rounded-lg border border-zinc-100 bg-zinc-50/60 px-3 py-2 text-sm">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <Badge tone={m.role === 'super_admin' ? 'accent' : 'amber'}>
                            {m.role === 'super_admin' ? '슈퍼' : m.role === 'reseller' ? '리셀러' : m.role}
                          </Badge>
                          <span className="text-[11px] font-bold text-zinc-700">{m.account_name || m.account_email || '—'}</span>
                          <span className="text-[10px] text-zinc-400">{(m.created_at || '').slice(0, 16).replace('T', ' ')}</span>
                        </div>
                        {(isSuper || m.account_id === session?.accountId) && (
                          <button
                            type="button"
                            onClick={() => deleteMemo(m.id)}
                            className="text-[11px] text-zinc-400 hover:text-red-600"
                          >
                            삭제
                          </button>
                        )}
                      </div>
                      <p className="mt-1 whitespace-pre-wrap text-zinc-700">{m.body}</p>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}

// ── ResellersModule ───────────────────────────────────────────────────────────

function ResellersModule({ resellers: initial, hospitals }) {
  const [resellers, setResellers] = useState(initial || []);
  const [selectedId, setSelectedId] = useState(null);
  const [assignments, setAssignments] = useState([]);  // hospital id 배열
  const [loadingAssign, setLoadingAssign] = useState(false);
  const [savingAssign, setSavingAssign] = useState(false);
  const [notice, setNotice] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);

  function closeModal() { setModalOpen(false); setSelectedId(null); }

  const selectedReseller = resellers.find((r) => r.id === selectedId) || null;

  // 선택된 리셀러 → 배정된 업체 ID 로드
  async function selectReseller(accountId) {
    setSelectedId(accountId);
    setAssignments([]);
    setNotice(null);
    if (!accountId) return;
    setModalOpen(true);
    setLoadingAssign(true);
    try {
      const res = await fetch(`/api/admin/resellers?accountId=${accountId}`);
      const data = await res.json();
      if (!res.ok || data.error) throw new Error(data.error);
      setAssignments((data.assignments || []).map((r) => r.hospital_id));
    } catch (err) {
      setNotice({ tone: 'error', message: err.message });
    } finally {
      setLoadingAssign(false);
    }
  }

  function toggleHospital(hid) {
    setAssignments((p) => p.includes(hid) ? p.filter((x) => x !== hid) : [...p, hid]);
  }

  async function saveAssignments() {
    if (!selectedId) return;
    setSavingAssign(true);
    setNotice(null);
    try {
      const res = await fetch('/api/admin/resellers', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({ accountId: selectedId, hospitalIds: assignments }),
      });
      const data = await res.json();
      if (!res.ok || data.error) throw new Error(data.error);

      // 리셀러 목록의 배정 업체 수 갱신
      setResellers((p) => p.map((r) => r.id === selectedId ? { ...r, assigned_count: assignments.length } : r));
      setNotice({ tone: 'success', message: '담당 업체가 저장되었습니다.' });
    } catch (err) {
      setNotice({ tone: 'error', message: err.message });
    } finally {
      setSavingAssign(false);
    }
  }

  return (
    <div className="flex flex-col">
      <PageHeader
        title="리셀러 관리"
        description="리셀러 계정에 담당 업체를 배정합니다. 리셀러는 배정된 업체의 정산 정보만 조회·메모할 수 있습니다."
      />
      <div className="space-y-4 p-6">
        {notice && !modalOpen && <Notice tone={notice.tone} message={notice.message} />}
        <Card>
          <div className="px-5 py-4 border-b border-zinc-100">
            <h2 className="font-black text-offblack">
              리셀러 계정
              <span className="ml-2 text-sm font-semibold text-zinc-400">{resellers.length}개</span>
            </h2>
            <p className="mt-1 text-xs text-zinc-500">계정은 "계정 관리"에서 권한을 "리셀러"로 선택해 생성합니다. 행을 클릭하면 담당 업체를 배정합니다.</p>
          </div>
          <ul className="divide-y divide-zinc-100">
            {resellers.length === 0 ? (
              <li className="px-5 py-10 text-center text-sm font-semibold text-zinc-400">
                생성된 리셀러 계정이 없습니다.
              </li>
            ) : resellers.map((r) => (
              <li key={r.id}>
                <button
                  type="button"
                  onClick={() => selectReseller(r.id)}
                  className="flex w-full items-center justify-between gap-3 px-5 py-3 text-left transition hover:bg-zinc-50"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-bold text-offblack">{r.display_name}</p>
                    <p className="truncate text-xs text-zinc-500">{r.email}</p>
                  </div>
                  <span className="shrink-0 rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-bold text-amber-700">
                    {r.assigned_count}개
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </Card>
      </div>

      {/* ── 담당 업체 배정 모달 ── */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={closeModal}>
          <div className="flex w-full max-w-2xl max-h-[90vh] flex-col overflow-hidden rounded-2xl bg-white shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between border-b border-black/20 bg-[#3a3a3a] px-5 py-4">
              <div className="min-w-0">
                <h3 className="truncate text-[15px] font-bold text-white">담당 업체 배정</h3>
                {selectedReseller && <p className="truncate text-[11px] text-white/55">{selectedReseller.display_name} · {selectedReseller.email}</p>}
              </div>
              <button onClick={closeModal} className="text-white/70 hover:text-white" aria-label="닫기">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>
            <div className="flex-1 space-y-4 overflow-y-auto p-5">
              <p className="text-xs text-zinc-500">선택된 업체의 정산만 이 리셀러가 조회·메모할 수 있습니다.</p>
              {notice && <Notice tone={notice.tone} message={notice.message} />}
              {loadingAssign ? (
                <p className="text-sm text-zinc-400">불러오는 중...</p>
              ) : (
                <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
                  {hospitals.length === 0 ? (
                    <p className="text-sm text-zinc-400">등록된 업체가 없습니다.</p>
                  ) : hospitals.map((h) => {
                    const checked = assignments.includes(h.id);
                    return (
                      <label
                        key={h.id}
                        className={`flex cursor-pointer items-start gap-3 rounded-lg border p-3 transition ${checked ? 'border-zinc-900 bg-zinc-50' : 'border-zinc-200 hover:border-zinc-300'}`}
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => toggleHospital(h.id)}
                          className="mt-0.5 accent-zinc-900"
                        />
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-bold text-offblack">{h.name}</p>
                          <p className="truncate text-xs text-zinc-500">{h.slug}</p>
                        </div>
                      </label>
                    );
                  })}
                </div>
              )}
            </div>
            <div className="flex items-center justify-between border-t border-zinc-100 px-5 py-4">
              <p className="text-xs text-zinc-500">선택: <strong className="text-zinc-700">{assignments.length}개</strong></p>
              <div className="flex gap-2">
                <button type="button" onClick={closeModal} className="rounded-lg border border-zinc-300 bg-white px-4 py-2.5 text-sm font-bold text-zinc-700 hover:bg-zinc-50">닫기</button>
                <Btn onClick={saveAssignments} loading={savingAssign}>배정 저장</Btn>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── SuperAdminWorkspace (메인) ─────────────────────────────────────────────────

export default function SuperAdminWorkspace({ session, activeModule: initialModule, initialData }) {
  const [activeModule, setActiveModule] = useState(initialModule || 'hospitals');
  const [moduleData, setModuleData] = useState(initialData || {});
  const [hospitals, setHospitals] = useState(initialData?.hospitals || []);
  const [isLoading, setIsLoading] = useState(false);

  // accounts / domains / resellers / billings 모듈로 직접 진입 시 hospital 목록 로드
  useEffect(() => {
    const needsHospitals = ['accounts', 'domains', 'resellers', 'billings'].includes(activeModule);
    if (needsHospitals && hospitals.length === 0) {
      fetch('/api/admin/hospitals')
        .then((r) => r.json())
        .then((data) => { if (Array.isArray(data)) setHospitals(data); })
        .catch(() => {});
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleNav(moduleId) {
    if (moduleId === activeModule) return;
    setActiveModule(moduleId);
    window.history.replaceState({}, '', `/admin?module=${moduleId}`);
    setIsLoading(true);

    try {
      let data = {};
      if (moduleId === 'hospitals') {
        const res = await fetch('/api/admin/hospitals');
        const list = await res.json();
        data = { hospitals: list };
        if (Array.isArray(list)) setHospitals(list);
      } else if (moduleId === 'accounts') {
        const [aRes, hRes] = await Promise.all([
          fetch('/api/admin/accounts'),
          fetch('/api/admin/hospitals'),
        ]);
        const [accounts, hList] = await Promise.all([aRes.json(), hRes.json()]);
        data = { accounts };
        if (Array.isArray(hList)) setHospitals(hList);
      } else if (moduleId === 'domains') {
        const [dRes, hRes] = await Promise.all([
          fetch('/api/admin/domains'),
          fetch('/api/admin/hospitals'),
        ]);
        const [domains, hList] = await Promise.all([dRes.json(), hRes.json()]);
        data = { domains };
        if (Array.isArray(hList)) setHospitals(hList);
      } else if (moduleId === 'logs') {
        const res = await fetch('/api/admin/logs');
        const logs = await res.json();
        data = { logs };
      } else if (moduleId === 'resellers') {
        const [rRes, hRes] = await Promise.all([
          fetch('/api/admin/resellers'),
          fetch('/api/admin/hospitals'),
        ]);
        const rJson = await rRes.json();
        const hList = await hRes.json();
        data = { resellers: rJson?.resellers ?? [], hospitals: Array.isArray(hList) ? hList : [] };
        if (Array.isArray(hList)) setHospitals(hList);
      } else if (moduleId === 'billings') {
        const [bRes, hRes] = await Promise.all([
          fetch('/api/admin/billings'),
          fetch('/api/admin/hospitals'),
        ]);
        const bJson = await bRes.json();
        const hList = await hRes.json();
        data = { billings: bJson?.billings ?? [], hospitals: Array.isArray(hList) ? hList : [] };
        if (Array.isArray(hList)) setHospitals(hList);
      }
      setModuleData(data);
    } catch (err) {
      console.error('모듈 로드 오류:', err);
    } finally {
      setIsLoading(false);
    }
  }

  function renderModule() {
    if (isLoading) {
      return (
        <div className="flex h-64 items-center justify-center">
          <p className="text-sm font-semibold text-zinc-400">데이터를 불러오는 중...</p>
        </div>
      );
    }

    switch (activeModule) {
      case 'hospitals':
        return <HospitalsModule hospitals={moduleData.hospitals ?? hospitals} />;
      case 'accounts':
        return <AccountsModule accounts={moduleData.accounts ?? []} hospitals={hospitals} />;
      case 'domains':
        return <DomainsModule domains={moduleData.domains ?? []} hospitals={hospitals} />;
      case 'logs':
        return <LogsModule logs={moduleData.logs ?? []} />;
      case 'aicrawls':
        return <AiCrawlsModule />;
      case 'resellers':
        return <ResellersModule resellers={moduleData.resellers ?? []} hospitals={moduleData.hospitals ?? hospitals} />;
      case 'billings':
        return <BillingsModule billings={moduleData.billings ?? []} hospitals={moduleData.hospitals ?? hospitals} session={session} />;
      case 'sales':
        return <SalesWorkspace readOnly />;
      default:
        return null;
    }
  }

  return (
    <AdminShell
      session={session}
      activeModule={activeModule}
      onModuleChange={handleNav}
    >
      {renderModule()}
    </AdminShell>
  );
}
