'use client';

import { useEffect, useState } from 'react';
import { CREDENTIAL_KINDS, cx } from './salesShared';

const EMPTY = { provider: '', account_id: '', account_pw: '', url: '', note: '' };

export default function CredentialsTab({ prospectId }) {
  const [data, setData] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [revealed, setRevealed] = useState({}); // kind → boolean
  const [secretMissing, setSecretMissing] = useState(false);

  useEffect(() => {
    if (!prospectId) return;
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [prospectId]);

  async function load() {
    setLoading(true);
    setError('');
    setNotice('');
    try {
      const res = await fetch(`/api/admin/sales/prospects/${prospectId}/credentials`, { credentials: 'same-origin' });
      const json = await res.json();
      if (res.status === 503 && json.code === 'NO_SECRET') {
        setSecretMissing(true);
        setError(json.error);
        return;
      }
      if (!res.ok) throw new Error(json.error || '불러오기 실패');
      const merged = {};
      CREDENTIAL_KINDS.forEach((k) => { merged[k.kind] = { ...EMPTY, ...(json[k.kind] || {}) }; });
      setData(merged);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  function patch(kind, field, value) {
    setData((prev) => ({ ...prev, [kind]: { ...(prev[kind] || EMPTY), [field]: value } }));
  }

  async function save() {
    setSaving(true);
    setError('');
    setNotice('');
    try {
      const res = await fetch(`/api/admin/sales/prospects/${prospectId}/credentials`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify(data),
      });
      const json = await res.json();
      if (!res.ok || json.error) throw new Error(json.error || '저장 실패');
      setNotice('계정 정보가 저장되었습니다.');
    } catch (e) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <div className="p-16 text-center text-sm text-zinc-400">불러오는 중…</div>;

  if (secretMissing) {
    return (
      <div className="rounded-2xl border border-amber-200 bg-amber-50 p-6">
        <p className="text-sm font-bold text-amber-900">⚠️ 암호화 키 미설정</p>
        <p className="mt-2 text-xs text-amber-800">
          계정 정보는 AES-256-GCM으로 암호화 저장됩니다. 운영 환경의 <code className="rounded bg-amber-100 px-1.5 py-0.5">SALES_CRED_SECRET</code> 환경변수가 설정되지 않아 이 탭은 비활성 상태입니다.
        </p>
        <p className="mt-2 text-xs text-amber-700">시스템 관리자에게 문의하세요.</p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="rounded-xl border border-emerald-200 bg-emerald-50/60 p-4">
        <p className="text-[13px] text-emerald-900">
          🔒 비밀번호는 AES-256-GCM으로 암호화되어 저장됩니다. <b>저장 후 변경된 비밀번호만</b> 갱신됩니다.
        </p>
      </div>

      {error && <div className="rounded-xl bg-red-50 px-4 py-3 text-[13px] font-medium text-red-700">{error}</div>}
      {notice && <div className="rounded-xl bg-emerald-50 px-4 py-3 text-[13px] font-medium text-emerald-700">{notice}</div>}

      <div className="space-y-4">
        {CREDENTIAL_KINDS.map((k) => {
          const v = data[k.kind] || EMPTY;
          const showPw = !!revealed[k.kind];
          return (
            <div key={k.kind} className="overflow-hidden rounded-2xl border border-zinc-200 bg-white">
              <div className="border-b border-zinc-100 bg-zinc-50/60 px-5 py-3.5">
                <h3 className="text-sm font-black text-offblack">{k.icon} {k.label}</h3>
              </div>
              <div className="grid grid-cols-1 gap-4 p-5 sm:grid-cols-2">
                {!k.urlField && (
                  <Field label="관리처">
                    <Input value={v.provider} onChange={(e) => patch(k.kind, 'provider', e.target.value)} placeholder={k.placeholderProvider || ''} />
                  </Field>
                )}
                {k.urlField && (
                  <Field label="Admin URL" className="sm:col-span-2">
                    <Input value={v.url} onChange={(e) => patch(k.kind, 'url', e.target.value)} placeholder="https://..." />
                  </Field>
                )}
                <Field label="아이디">
                  <Input value={v.account_id} onChange={(e) => patch(k.kind, 'account_id', e.target.value)} placeholder="아이디" />
                </Field>
                <Field label="비밀번호" className={k.urlField ? '' : 'sm:col-span-2'}>
                  <div className="flex gap-1.5">
                    <Input
                      type={showPw ? 'text' : 'password'}
                      value={v.account_pw}
                      onChange={(e) => patch(k.kind, 'account_pw', e.target.value)}
                      placeholder="비밀번호"
                      className="flex-1"
                    />
                    <button
                      type="button"
                      onClick={() => setRevealed((r) => ({ ...r, [k.kind]: !showPw }))}
                      className="shrink-0 rounded-xl border border-zinc-300 bg-white px-3.5 py-2.5 text-[13px] font-bold text-zinc-700 transition-colors hover:bg-zinc-50"
                    >
                      {showPw ? '숨김' : '표시'}
                    </button>
                  </div>
                </Field>
                <Field label="메모" className="sm:col-span-2">
                  <Input value={v.note} onChange={(e) => patch(k.kind, 'note', e.target.value)} placeholder="비고" />
                </Field>
              </div>
            </div>
          );
        })}
      </div>

      <div className="flex justify-end">
        <button
          onClick={save}
          disabled={saving}
          className="rounded-xl bg-accent px-5 py-2.5 text-sm font-bold text-white transition-colors hover:bg-accent-hover disabled:opacity-50"
        >{saving ? '저장 중…' : '저장'}</button>
      </div>
    </div>
  );
}

function Field({ label, children, className = '' }) {
  return (
    <label className={cx('block', className)}>
      <span className="mb-1.5 block text-[13px] font-bold text-zinc-600">{label}</span>
      {children}
    </label>
  );
}
function Input({ className = '', ...props }) {
  return <input className={cx('w-full rounded-xl border border-zinc-300 px-3.5 py-2.5 text-[13px] outline-none transition-colors focus:border-zinc-900 focus:ring-4 focus:ring-zinc-900/5', className)} {...props} />;
}
