'use client';

import { useEffect, useRef, useState } from 'react';

const ID_KEY = 'metalink_admin_saved_id';
const PW_KEY = 'metalink_admin_saved_pw';

export default function AdminLoginForm({ initialModule, hasError }) {
  const emailRef = useRef(null);
  const passwordRef = useRef(null);
  const [error, setError] = useState(hasError ? '이메일 또는 비밀번호가 올바르지 않습니다.' : '');
  const [isPending, setIsPending] = useState(false);
  const [saveId, setSaveId] = useState(false);
  const [savePw, setSavePw] = useState(false);

  useEffect(() => {
    if (hasError) setError('이메일 또는 비밀번호가 올바르지 않습니다.');
  }, [hasError]);

  // 마운트 시 저장된 아이디/비밀번호 복원
  useEffect(() => {
    try {
      const savedId = window.localStorage.getItem(ID_KEY);
      const savedPw = window.localStorage.getItem(PW_KEY);
      if (savedId) {
        if (emailRef.current) emailRef.current.value = savedId;
        setSaveId(true);
      }
      if (savedPw) {
        if (passwordRef.current) passwordRef.current.value = savedPw;
        setSavePw(true);
      }
    } catch {
      /* localStorage 접근 불가(시크릿 모드 등) — 무시 */
    }
  }, []);

  async function handleSubmit(event) {
    event.preventDefault();
    if (isPending) return;
    setError('');
    setIsPending(true);

    // 토글 상태에 따라 아이디/비밀번호 저장 또는 삭제
    try {
      const email = emailRef.current?.value ?? '';
      const password = passwordRef.current?.value ?? '';
      if (saveId) window.localStorage.setItem(ID_KEY, email);
      else window.localStorage.removeItem(ID_KEY);
      if (savePw) window.localStorage.setItem(PW_KEY, password);
      else window.localStorage.removeItem(PW_KEY);
    } catch {
      /* localStorage 접근 불가 — 저장 생략 */
    }

    try {
      const res = await fetch('/admin/login', {
        method: 'POST',
        body: new FormData(event.currentTarget),
        credentials: 'same-origin',
        headers: { Accept: 'application/json', 'X-Requested-With': 'XMLHttpRequest' },
      });
      const payload = await res.json().catch(() => null);
      if (!res.ok || !payload?.ok) {
        setError(payload?.message || '로그인 처리 중 오류가 발생했습니다.');
        passwordRef.current?.focus();
        return;
      }
      window.location.assign(payload.redirectTo || `/admin?module=${initialModule}`);
    } catch {
      setError('네트워크 오류가 발생했습니다.');
    } finally {
      setIsPending(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="grid gap-3" noValidate>
      <input type="hidden" name="module" value={initialModule} />

      <label className="flex h-[52px] items-center gap-3 rounded border-2 border-[#e8533f] bg-white px-4">
        <span className="text-[#e8533f]" aria-hidden="true">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="8" r="4"/><path d="M4 21v-1a8 8 0 0 1 16 0v1"/></svg>
        </span>
        <input ref={emailRef} name="email" type="text" autoComplete="username" placeholder="아이디" className="flex-1 bg-transparent text-[15px] text-zinc-800 placeholder-zinc-400 outline-none" />
      </label>

      <label className="flex h-[52px] items-center gap-3 rounded border border-zinc-300 bg-white px-4 focus-within:border-[#e8533f]">
        <span className="text-zinc-400" aria-hidden="true">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
        </span>
        <input ref={passwordRef} name="password" type="password" required autoComplete="current-password" placeholder="Password" className="flex-1 bg-transparent text-[15px] text-zinc-800 placeholder-zinc-400 outline-none" />
      </label>

      <div className="mt-1 flex items-center gap-5 text-[13px] text-zinc-700">
        <button
          type="button"
          role="switch"
          aria-checked={saveId}
          onClick={() => setSaveId((v) => !v)}
          className="flex items-center gap-2 outline-none"
        >
          <span className={`relative inline-flex h-[18px] w-8 shrink-0 items-center rounded-full transition-colors ${saveId ? 'bg-[#e8533f]' : 'bg-zinc-300'}`}>
            <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform ${saveId ? 'translate-x-[15px]' : 'translate-x-0.5'}`} />
          </span>
          <span>아이디 저장</span>
        </button>
        <button
          type="button"
          role="switch"
          aria-checked={savePw}
          onClick={() => setSavePw((v) => !v)}
          className="flex items-center gap-2 outline-none"
        >
          <span className={`relative inline-flex h-[18px] w-8 shrink-0 items-center rounded-full transition-colors ${savePw ? 'bg-[#e8533f]' : 'bg-zinc-300'}`}>
            <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform ${savePw ? 'translate-x-[15px]' : 'translate-x-0.5'}`} />
          </span>
          <span>비밀번호 저장</span>
        </button>
      </div>

      {error ? (
        <p className="rounded border border-red-200 bg-red-50 px-3 py-2 text-[12px] font-semibold text-red-600" aria-live="polite">{error}</p>
      ) : null}

      <button type="submit" disabled={isPending} className={`mt-1 flex h-[52px] items-center justify-center rounded bg-[#e8533f] text-[16px] font-bold text-white transition hover:bg-[#c64a38] ${isPending ? 'cursor-wait opacity-80' : 'cursor-pointer'}`}>
        {isPending ? '로그인 중...' : '로그인'}
      </button>
    </form>
  );
}