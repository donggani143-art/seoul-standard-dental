'use client';

import { useEffect, useState } from 'react';

export default function AuthButton() {
  const [patient, setPatient] = useState(null);
  const [checked, setChecked] = useState(false);
  const [showModal, setShowModal] = useState(null); // 'login' | 'register' | null
  const [form, setForm] = useState({ email: '', password: '', name: '', phone: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch('/api/auth/me', { credentials: 'same-origin' })
      .then(r => r.json())
      .then(d => { if (d.loggedIn) setPatient(d.patient); })
      .catch(() => {})
      .finally(() => setChecked(true));
  }, []);

  if (!checked) return null;

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);

    const endpoint = showModal === 'register' ? '/api/auth/register' : '/api/auth/login';
    const body = showModal === 'register'
      ? { email: form.email, password: form.password, name: form.name, phone: form.phone }
      : { email: form.email, password: form.password };

    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        setError(data.error || '오류가 발생했습니다.');
        return;
      }
      setPatient(data.patient);
      setShowModal(null);
      setForm({ email: '', password: '', name: '', phone: '' });
    } catch {
      setError('네트워크 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  }

  async function handleLogout() {
    await fetch('/api/auth/logout', { method: 'POST', credentials: 'same-origin' });
    setPatient(null);
  }

  // 로그인 상태
  if (patient) {
    return (
      <div className="fixed top-3 right-4 z-[100] flex items-center gap-2">
        <span className="rounded-full bg-white/90 px-4 py-1.5 text-xs font-bold text-offblack shadow-lg ring-1 ring-black/5 backdrop-blur">
          {patient.name}님
        </span>
        <button
          onClick={handleLogout}
          className="rounded-full bg-white/90 px-4 py-1.5 text-xs font-bold text-zinc-500 shadow-lg ring-1 ring-black/5 backdrop-blur transition hover:bg-red-500 hover:text-white"
        >
          로그아웃
        </button>
      </div>
    );
  }

  // 비로그인 상태
  return (
    <>
      <div className="fixed top-3 right-4 z-[100] flex items-center gap-2">
        <button
          onClick={() => { setShowModal('login'); setError(''); }}
          className="rounded-full bg-white/90 px-4 py-1.5 text-xs font-bold text-offblack shadow-lg ring-1 ring-black/5 backdrop-blur transition hover:bg-accent hover:text-white"
        >
          로그인
        </button>
        <button
          onClick={() => { setShowModal('register'); setError(''); }}
          className="rounded-full bg-accent px-4 py-1.5 text-xs font-bold text-white shadow-lg ring-1 ring-black/5 backdrop-blur transition hover:brightness-110"
        >
          회원가입
        </button>
      </div>

      {/* 모달 */}
      {showModal && (
        <div
          className="fixed inset-0 z-[200] flex items-center justify-center bg-black/50 backdrop-blur-sm"
          onClick={(e) => { if (e.target === e.currentTarget) setShowModal(null); }}
        >
          <div className="mx-4 w-full max-w-sm rounded-2xl bg-white p-8 shadow-2xl">
            <h2 className="mb-6 text-center text-xl font-black text-offblack">
              {showModal === 'register' ? '회원가입' : '로그인'}
            </h2>

            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              {showModal === 'register' && (
                <>
                  <input
                    type="text"
                    placeholder="이름"
                    required
                    value={form.name}
                    onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                    className="rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm outline-none focus:border-accent"
                  />
                  <input
                    type="tel"
                    placeholder="연락처 (선택)"
                    value={form.phone}
                    onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                    className="rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm outline-none focus:border-accent"
                  />
                </>
              )}
              <input
                type="email"
                placeholder="이메일"
                required
                value={form.email}
                onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                className="rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm outline-none focus:border-accent"
              />
              <input
                type="password"
                placeholder="비밀번호"
                required
                value={form.password}
                onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                className="rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm outline-none focus:border-accent"
              />

              {error && (
                <p className="text-center text-xs font-bold text-red-500">{error}</p>
              )}

              <button
                type="submit"
                disabled={loading}
                className="rounded-xl bg-accent py-3 font-bold text-white transition hover:bg-orange-600 disabled:opacity-50"
              >
                {loading ? '처리 중...' : showModal === 'register' ? '가입하기' : '로그인'}
              </button>
            </form>

            <div className="mt-4 text-center text-xs text-zinc-500">
              {showModal === 'register' ? (
                <>이미 계정이 있으신가요? <button onClick={() => { setShowModal('login'); setError(''); }} className="font-bold text-accent">로그인</button></>
              ) : (
                <>계정이 없으신가요? <button onClick={() => { setShowModal('register'); setError(''); }} className="font-bold text-accent">회원가입</button></>
              )}
            </div>

            <button
              onClick={() => setShowModal(null)}
              className="mt-4 w-full text-center text-xs text-zinc-400 hover:text-zinc-600"
            >
              닫기
            </button>
          </div>
        </div>
      )}
    </>
  );
}
