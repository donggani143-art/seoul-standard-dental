'use client';

import { useEffect, useState } from 'react';
import { cx } from './salesShared';

function buildShareUrl(token) {
  if (typeof window === 'undefined') return '';
  return `${window.location.origin}/q/${token}`;
}

const EXPIRE_OPTIONS = [
  { v: '', l: '만료 없음' },
  { v: '7', l: '7일' },
  { v: '30', l: '30일' },
  { v: '90', l: '90일' },
];

export default function ShareModal({ open, prospect, onClose }) {
  const [tokens, setTokens] = useState([]);
  const [loading, setLoading] = useState(false);
  const [expiresIn, setExpiresIn] = useState('30');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [copiedToken, setCopiedToken] = useState('');

  async function load() {
    if (!prospect?.id) return;
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`/api/admin/sales/prospects/${prospect.id}/share`, { credentials: 'same-origin' });
      const json = await res.json();
      if (!res.ok || json.error) throw new Error(json.error || '불러오기 실패');
      setTokens(Array.isArray(json) ? json : []);
    } catch (e) { setError(e.message); }
    finally { setLoading(false); }
  }

  useEffect(() => { if (open) { load(); setCopiedToken(''); } /* eslint-disable-next-line */ }, [open, prospect?.id]);

  async function issue() {
    setBusy(true); setError('');
    try {
      const body = { expires_in_days: expiresIn ? Number(expiresIn) : null };
      const res = await fetch(`/api/admin/sales/prospects/${prospect.id}/share`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'same-origin', body: JSON.stringify(body),
      });
      const json = await res.json();
      if (!res.ok || json.error) throw new Error(json.error || '발급 실패');
      await load();
      // 새로 발급된 토큰을 자동 복사
      const url = buildShareUrl(json.token);
      try { await navigator.clipboard.writeText(url); setCopiedToken(json.token); } catch {}
    } catch (e) { setError(e.message); }
    finally { setBusy(false); }
  }

  async function revoke(token) {
    if (!confirm('이 공유 링크를 즉시 폐기할까요? 외부에서 더 이상 접근할 수 없습니다.')) return;
    setBusy(true); setError('');
    try {
      const res = await fetch(`/api/admin/sales/prospects/${prospect.id}/share?token=${encodeURIComponent(token)}`, { method: 'DELETE', credentials: 'same-origin' });
      const json = await res.json();
      if (!res.ok || json.error) throw new Error(json.error || '폐기 실패');
      await load();
    } catch (e) { setError(e.message); }
    finally { setBusy(false); }
  }

  async function copy(token) {
    try { await navigator.clipboard.writeText(buildShareUrl(token)); setCopiedToken(token); }
    catch { setError('클립보드 복사 실패. 직접 선택해 복사하세요.'); }
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div className="w-full max-w-2xl rounded-2xl bg-white shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="border-b border-zinc-100 px-6 py-5">
          <h3 className="text-lg font-black text-offblack">질문지 링크 공유 — {prospect?.name}</h3>
          <p className="mt-1.5 text-[13px] leading-relaxed text-zinc-500">병원에 전달할 <b className="text-zinc-700">정보 입력 질문지</b> 링크입니다. 원장님이 모바일에서 선택형으로 답하면 이 거래처 데이터(병원정보·체크리스트)에 자동 반영됩니다.</p>
        </div>
        <div className="space-y-4 px-6 py-5">
          {error && <p className="rounded-xl bg-red-50 px-4 py-3 text-[13px] font-medium text-red-600">{error}</p>}

          <div className="rounded-2xl border border-zinc-200 bg-zinc-50/60 p-4">
            <p className="mb-2.5 text-[13px] font-bold text-zinc-700">새 질문지 링크 발급</p>
            <div className="flex flex-wrap items-center gap-2">
              <label className="flex items-center gap-2 text-[13px] text-zinc-600">
                만료
                <select value={expiresIn} onChange={(e) => setExpiresIn(e.target.value)} className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-[13px] outline-none transition-colors focus:border-zinc-900 focus:ring-4 focus:ring-zinc-900/5">
                  {EXPIRE_OPTIONS.map((o) => <option key={o.v} value={o.v}>{o.l}</option>)}
                </select>
              </label>
              <button onClick={issue} disabled={busy} className="rounded-lg bg-accent px-4 py-2 text-[13px] font-bold text-white transition-colors hover:bg-accent-hover disabled:opacity-50">
                {busy ? '발급 중…' : '+ 새 링크 발급'}
              </button>
              <span className="ml-auto text-[13px] text-zinc-400">발급 직후 자동으로 클립보드 복사</span>
            </div>
          </div>

          <div>
            <p className="mb-2.5 text-[13px] font-bold text-zinc-700">발급된 링크 ({tokens.length})</p>
            {loading ? (
              <p className="rounded-xl border border-dashed border-zinc-200 px-4 py-8 text-center text-[13px] text-zinc-400">불러오는 중…</p>
            ) : tokens.length === 0 ? (
              <p className="rounded-xl border border-dashed border-zinc-200 px-4 py-8 text-center text-[13px] text-zinc-400">아직 발급된 링크가 없습니다.</p>
            ) : (
              <div className="space-y-2.5">
                {tokens.map((t) => {
                  const url = buildShareUrl(t.token);
                  const isCopied = copiedToken === t.token;
                  const isExpired = t.expires_at && new Date(t.expires_at).getTime() < Date.now();
                  const isRevoked = !!t.revoked;
                  const status = isRevoked ? { label: '폐기됨', tone: 'bg-zinc-100 text-zinc-400' }
                              : isExpired ? { label: '만료', tone: 'bg-amber-50 text-amber-700' }
                              : { label: '활성', tone: 'bg-emerald-50 text-emerald-700' };
                  return (
                    <div key={t.token} className={cx('rounded-xl border bg-white p-3.5', isRevoked || isExpired ? 'border-zinc-200 opacity-60' : 'border-zinc-200')}>
                      <div className="mb-2 flex items-center justify-between gap-2">
                        <span className={cx('inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-bold', status.tone)}>{status.label}</span>
                        <span className="text-[13px] text-zinc-500">
                          조회 {t.view_count}회 · {t.expires_at ? `만료 ${String(t.expires_at).slice(0,10)}` : '만료 없음'}
                        </span>
                      </div>
                      <div className="flex gap-2">
                        <input value={url} readOnly className="flex-1 rounded-lg border border-zinc-300 bg-zinc-50 px-3 py-2 font-mono text-[12px] text-zinc-700" />
                        <button onClick={() => copy(t.token)} disabled={isRevoked || isExpired} className="shrink-0 rounded-lg border border-zinc-300 bg-white px-3.5 py-2 text-[13px] font-bold text-zinc-700 transition-colors hover:bg-zinc-50 disabled:opacity-50">
                          {isCopied ? '✓ 복사됨' : '복사'}
                        </button>
                        {!isRevoked && (
                          <button onClick={() => revoke(t.token)} className="shrink-0 rounded-lg border border-red-200 bg-white px-3.5 py-2 text-[13px] font-bold text-red-600 transition-colors hover:bg-red-50">폐기</button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
        <div className="flex justify-end border-t border-zinc-100 px-6 py-4">
          <button onClick={onClose} className="rounded-xl border border-zinc-300 bg-white px-5 py-2.5 text-sm font-bold text-zinc-700 transition-colors hover:bg-zinc-50">닫기</button>
        </div>
      </div>
    </div>
  );
}
