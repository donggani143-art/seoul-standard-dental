'use client';

import { useEffect, useState } from 'react';

export default function AdminProfileModal({ open, onClose, session }) {
  const [form, setForm] = useState({ displayName: '', email: '' });
  const [pwForm, setPwForm] = useState({ currentPassword: '', newPassword: '' });
  const [loading, setLoading] = useState(false);
  const [notice, setNotice] = useState(null);

  useEffect(() => {
    if (!open) return;
    setNotice(null);
    setPwForm({ currentPassword: '', newPassword: '' });
    fetch('/api/admin/me', { credentials: 'same-origin' })
      .then(r => r.json())
      .then(d => {
        if (d.account) setForm({ displayName: d.account.display_name || '', email: d.account.email || '' });
      })
      .catch(() => {});
  }, [open]);

  if (!open) return null;

  async function saveProfile(e) {
    e.preventDefault();
    setLoading(true);
    setNotice(null);
    try {
      const res = await fetch('/api/admin/me', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({ displayName: form.displayName, email: form.email }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || '저장 실패');
      setNotice({ tone: 'success', message: '정보가 수정되었습니다.' });
    } catch (err) {
      setNotice({ tone: 'error', message: err.message });
    } finally {
      setLoading(false);
    }
  }

  async function changePassword(e) {
    e.preventDefault();
    setLoading(true);
    setNotice(null);
    try {
      const res = await fetch('/api/admin/me', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({ currentPassword: pwForm.currentPassword, newPassword: pwForm.newPassword }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || '변경 실패');
      setNotice({ tone: 'success', message: '비밀번호가 변경되었습니다.' });
      setPwForm({ currentPassword: '', newPassword: '' });
    } catch (err) {
      setNotice({ tone: 'error', message: err.message });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-zinc-100 px-6 py-4">
          <h2 className="text-base font-black text-offblack">내 정보 수정</h2>
          <button onClick={onClose} className="text-zinc-400 hover:text-zinc-700 text-xl leading-none">&times;</button>
        </div>

        <div className="px-6 py-5 space-y-5">
          {notice && (
            <div className={`rounded-lg px-3 py-2 text-xs font-bold ${notice.tone === 'success' ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-600'}`}>
              {notice.message}
            </div>
          )}

          {/* 기본 정보 */}
          <form onSubmit={saveProfile} className="space-y-3">
            <div>
              <label className="block text-xs font-bold text-zinc-500 mb-1">이름</label>
              <input
                type="text"
                value={form.displayName}
                onChange={e => setForm(p => ({ ...p, displayName: e.target.value }))}
                autoComplete="off"
                className="w-full rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm outline-none focus:border-zinc-900 focus:bg-white"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-zinc-500 mb-1">이메일</label>
              <input
                type="email"
                value={form.email}
                onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
                autoComplete="off"
                className="w-full rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm outline-none focus:border-zinc-900 focus:bg-white"
              />
            </div>
            <div className="text-[11px] text-zinc-400">
              역할: <span className="font-bold text-zinc-600">{session?.role === 'super_admin' ? '슈퍼관리자' : '업체 관리자'}</span>
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-accent py-2.5 text-sm font-bold text-white hover:brightness-110 disabled:opacity-50"
            >
              {loading ? '저장 중...' : '정보 수정'}
            </button>
          </form>

          <div className="border-t border-zinc-100 pt-5">
            <h3 className="mb-3 text-sm font-black text-offblack">비밀번호 변경</h3>
            <form onSubmit={changePassword} className="space-y-3">
              <input
                type="password"
                placeholder="현재 비밀번호"
                value={pwForm.currentPassword}
                onChange={e => setPwForm(p => ({ ...p, currentPassword: e.target.value }))}
                required
                autoComplete="current-password"
                className="w-full rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm outline-none focus:border-zinc-900 focus:bg-white"
              />
              <input
                type="password"
                placeholder="새 비밀번호 (4자 이상)"
                minLength={4}
                value={pwForm.newPassword}
                onChange={e => setPwForm(p => ({ ...p, newPassword: e.target.value }))}
                required
                autoComplete="new-password"
                className="w-full rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm outline-none focus:border-zinc-900 focus:bg-white"
              />
              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-lg bg-zinc-700 py-2.5 text-sm font-bold text-white hover:bg-accent-hover disabled:opacity-50"
              >
                {loading ? '변경 중...' : '비밀번호 변경'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
