'use client';

import { useEffect, useRef, useState } from 'react';
import { cx } from './salesShared';

const MULTI_OPTIONS = [
  { v: '', l: '미신청' },
  { v: '영문', l: '영문' },
  { v: '중문', l: '중문' },
  { v: '일문', l: '일문' },
  { v: '영·중문', l: '영·중문' },
  { v: '영·중·일문', l: '영·중·일문' },
];
const YN_OPTIONS = [
  { v: '', l: '미신청' },
  { v: '신청', l: '신청' },
];
const VAT_OPTIONS = [
  { v: '', l: '미확인' },
  { v: '포함', l: '포함' },
  { v: '별도', l: '별도' },
];

export default function ContractTab({ prospectId }) {
  const [info, setInfo] = useState({ multi: '', maint: '', seo: '', aeo: '', vat: '', files_text: '' });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  // 파일 업로드/목록
  const [filesList, setFilesList] = useState([]);
  const [folderUrl, setFolderUrl] = useState('');
  const [driveReady, setDriveReady] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [upMsg, setUpMsg] = useState('');
  const [progress, setProgress] = useState([]); // [{name, pct, status: wait|up|done|fail|cancel, msg}]
  const fileRef = useRef(null);
  const xhrRef = useRef(null);      // 진행 중인 전송(취소용)
  const cancelRef = useRef(false);  // 취소 플래그(남은 파일 건너뛰기)

  useEffect(() => {
    if (!prospectId) return;
    setLoading(true);
    setError('');
    setNotice('');
    fetch(`/api/admin/sales/prospects/${prospectId}/info`, { credentials: 'same-origin' })
      .then((r) => r.json())
      .then((d) => {
        if (d?.error) throw new Error(d.error);
        setInfo({
          multi: d.multi || '',
          maint: d.maint || '',
          seo: d.seo || '',
          aeo: d.aeo || '',
          vat: d.vat || '',
          files_text: d.files_text || '',
        });
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [prospectId]);

  useEffect(() => {
    if (!prospectId) return;
    fetch(`/api/admin/sales/prospects/${prospectId}/files`, { credentials: 'same-origin' })
      .then((r) => r.json())
      .then((d) => {
        if (d?.error) return;
        setFilesList(Array.isArray(d.files) ? d.files : []);
        setFolderUrl(d.folderUrl || '');
        setDriveReady(!!d.driveReady);
      })
      .catch(() => {});
  }, [prospectId]);

  // 브라우저 → 구글 드라이브 직접 업로드(파일이 앱 서버를 거치지 않음 → 대용량 가능)
  function putWithProgress(url, file, onPct) {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhrRef.current = xhr;
      xhr.open('PUT', url);
      xhr.upload.onprogress = (ev) => { if (ev.lengthComputable) onPct(Math.round((ev.loaded / ev.total) * 100)); };
      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          try { resolve(JSON.parse(xhr.responseText || '{}')); } catch { resolve({}); }
        } else {
          reject(new Error(`전송 실패 (HTTP ${xhr.status})`));
        }
      };
      xhr.onerror = () => reject(new Error('네트워크 오류로 업로드가 중단되었습니다.'));
      xhr.onabort = () => { const e = new Error('취소됨'); e.canceled = true; reject(e); };
      xhr.send(file);
    });
  }

  function cancelUpload() {
    cancelRef.current = true;
    try { xhrRef.current?.abort(); } catch { /* noop */ }
  }

  async function handleUpload(picked) {
    if (!picked.length) return;
    setUploading(true); setUpMsg('');
    cancelRef.current = false;
    setProgress(picked.map((f) => ({ name: f.name, pct: 0, status: 'wait', msg: '' })));
    const setP = (i, patch) => setProgress((prev) => prev.map((p, idx) => (idx === i ? { ...p, ...patch } : p)));
    let ok = 0;
    for (let i = 0; i < picked.length; i += 1) {
      const file = picked[i];
      if (cancelRef.current) { setP(i, { status: 'cancel' }); continue; }
      try {
        setP(i, { status: 'up' });
        // 1) 업로드 세션 발급
        const sres = await fetch(`/api/admin/sales/prospects/${prospectId}/files/session`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'same-origin',
          body: JSON.stringify({ name: file.name, type: file.type, size: file.size }),
        });
        const sj = await sres.json().catch(() => ({}));
        if (!sres.ok || !sj.uploadUrl) throw new Error(sj.message || sj.error || '업로드 세션 생성에 실패했습니다.');
        if (sj.folderUrl) setFolderUrl(sj.folderUrl);
        // 2) 브라우저 → 구글 직접 전송 (진행률)
        const meta = await putWithProgress(sj.uploadUrl, file, (pct) => setP(i, { pct }));
        // 3) 업로드 기록 저장
        const cres = await fetch(`/api/admin/sales/prospects/${prospectId}/files/complete`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'same-origin',
          body: JSON.stringify({ name: meta.name || file.name, link: meta.webViewLink || '' }),
        });
        const cj = await cres.json().catch(() => ({}));
        if (!cres.ok || cj.error) throw new Error(cj.message || cj.error || '업로드 기록 저장에 실패했습니다.');
        if (Array.isArray(cj.files)) setFilesList(cj.files);
        if (cj.folderUrl) setFolderUrl(cj.folderUrl);
        setP(i, { status: 'done', pct: 100 });
        ok += 1;
      } catch (e) {
        if (e?.canceled) setP(i, { status: 'cancel' });
        else setP(i, { status: 'fail', msg: e.message || '업로드 실패' });
      } finally {
        xhrRef.current = null;
      }
    }
    setUpMsg(cancelRef.current ? `업로드 취소됨 · ${ok}/${picked.length}개 완료` : `파일 ${ok}/${picked.length}개 업로드 완료`);
    setUploading(false);
  }

  async function save() {
    setSaving(true);
    setError('');
    setNotice('');
    try {
      const res = await fetch(`/api/admin/sales/prospects/${prospectId}/info`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify(info),
      });
      const json = await res.json();
      if (!res.ok || json.error) throw new Error(json.error || '저장 실패');
      setNotice('계약·파일 정보가 저장되었습니다.');
    } catch (e) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <div className="p-16 text-center text-sm text-zinc-400">불러오는 중…</div>;

  return (
    <div className="space-y-5">
      {error && <div className="rounded-xl bg-red-50 px-4 py-3 text-[13px] font-medium text-red-700">{error}</div>}
      {notice && <div className="rounded-xl bg-emerald-50 px-4 py-3 text-[13px] font-medium text-emerald-700">{notice}</div>}

      <Section title="📄 부가 서비스">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <Field label="다국어 버전"><Select value={info.multi} onChange={(e) => setInfo({ ...info, multi: e.target.value })} options={MULTI_OPTIONS} /></Field>
          <Field label="월 유지보수"><Select value={info.maint} onChange={(e) => setInfo({ ...info, maint: e.target.value })} options={YN_OPTIONS} /></Field>
          <Field label="네이버 SEO"><Select value={info.seo} onChange={(e) => setInfo({ ...info, seo: e.target.value })} options={YN_OPTIONS} /></Field>
          <Field label="AEO/GEO 최적화"><Select value={info.aeo} onChange={(e) => setInfo({ ...info, aeo: e.target.value })} options={YN_OPTIONS} /></Field>
          <Field label="부가세(VAT)"><Select value={info.vat} onChange={(e) => setInfo({ ...info, vat: e.target.value })} options={VAT_OPTIONS} /></Field>
        </div>
      </Section>

      <Section title="📁 계약/파일">
        {!driveReady && (
          <div className="mb-3 rounded-xl bg-amber-50 px-4 py-3 text-[13px] leading-relaxed text-amber-700">
            파일 보관소(구글 드라이브)가 연결되어 있지 않습니다. 슈퍼관리자 대시보드의 <b>📁 파일 보관소 재연결</b>에서 연결한 뒤 업로드해 주세요.
          </div>
        )}

        {filesList.length > 0 ? (
          <ul className="mb-3 divide-y divide-zinc-100 overflow-hidden rounded-xl border border-zinc-200">
            {filesList.map((f, i) => (
              <li key={i} className="flex items-center justify-between gap-3 px-4 py-2.5">
                {f.link ? (
                  <a href={f.link} target="_blank" rel="noreferrer" className="min-w-0 flex-1 truncate text-[13px] font-semibold text-zinc-800 hover:text-accent hover:underline">{f.name}</a>
                ) : (
                  <span className="min-w-0 flex-1 truncate text-[13px] font-semibold text-zinc-800">{f.name}</span>
                )}
                <span className="flex shrink-0 items-center gap-2">
                  {f.at && <span className="text-[11px] text-zinc-400">{f.at}</span>}
                  <span className={cx('rounded-full px-2 py-0.5 text-[11px] font-bold', f.source === '질문지' ? 'bg-sky-50 text-sky-600' : 'bg-zinc-100 text-zinc-500')}>{f.source}</span>
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mb-3 text-[13px] text-zinc-400">업로드된 파일이 없습니다.</p>
        )}

        <div className="flex flex-wrap items-center gap-3">
          <input ref={fileRef} type="file" multiple className="hidden" onChange={(e) => { const picked = Array.from(e.target.files || []); e.target.value = ''; handleUpload(picked); }} />
          <button
            type="button"
            disabled={uploading || !driveReady}
            onClick={() => fileRef.current?.click()}
            className="rounded-xl bg-zinc-900 px-4 py-2.5 text-[13px] font-bold text-white transition-colors hover:bg-zinc-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {uploading ? '업로드 중…' : '＋ 파일 업로드'}
          </button>
          {uploading && (
            <button
              type="button"
              onClick={cancelUpload}
              className="rounded-xl border border-red-200 bg-white px-3.5 py-2.5 text-[13px] font-bold text-red-500 transition-colors hover:bg-red-50"
            >
              업로드 취소
            </button>
          )}
          {folderUrl && (
            <a href={folderUrl} target="_blank" rel="noreferrer" className="text-[13px] font-bold text-accent hover:underline">📂 드라이브 폴더 열기 →</a>
          )}
          {upMsg && <span className="text-[12px] font-medium text-zinc-500">{upMsg}</span>}
        </div>

        {progress.length > 0 && (
          <ul className="mt-3 space-y-1.5">
            {progress.map((p, i) => (
              <li key={i} className="flex items-center gap-3 text-[12px]">
                <span className="min-w-0 flex-1 truncate font-semibold text-zinc-700">{p.name}</span>
                {p.status === 'fail' ? (
                  <span className="shrink-0 font-bold text-red-500">실패 — {p.msg}</span>
                ) : p.status === 'cancel' ? (
                  <span className="shrink-0 font-bold text-zinc-400">취소됨</span>
                ) : (
                  <>
                    <span className="h-1.5 w-36 shrink-0 overflow-hidden rounded-full bg-zinc-100">
                      <span className="block h-full rounded-full bg-zinc-900 transition-all" style={{ width: `${p.pct}%` }} />
                    </span>
                    <span className="w-12 shrink-0 text-right font-bold text-zinc-500">
                      {p.status === 'done' ? '완료' : p.status === 'wait' ? '대기' : `${p.pct}%`}
                    </span>
                  </>
                )}
              </li>
            ))}
          </ul>
        )}

        <p className="mt-2 text-[11px] text-zinc-400">
          대용량 파일(GB급)도 업로드할 수 있습니다 · 브라우저에서 드라이브로 직접 전송됩니다. <b>업로드가 끝날 때까지 이 화면을 닫지 마세요.</b>
        </p>

        <div className="mt-5 border-t border-zinc-100 pt-4">
          <Field label="파일명 메모 (참고용 · 줄바꿈으로 구분)">
            <Textarea
              value={info.files_text}
              onChange={(e) => setInfo({ ...info, files_text: e.target.value })}
              placeholder={'로고.ai\n원장프로필.jpg\n내부시설.zip'}
              rows={4}
            />
          </Field>
        </div>
      </Section>

      <div className="flex justify-end">
        <button onClick={save} disabled={saving} className="rounded-xl bg-accent px-5 py-2.5 text-sm font-bold text-white transition-colors hover:bg-accent-hover disabled:opacity-50">
          {saving ? '저장 중…' : '저장'}
        </button>
      </div>
    </div>
  );
}

function Section({ title, children }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white">
      <div className="border-b border-zinc-100 bg-zinc-50/60 px-5 py-3.5"><h3 className="text-sm font-black text-offblack">{title}</h3></div>
      <div className="p-5">{children}</div>
    </div>
  );
}
function Field({ label, children }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-[13px] font-bold text-zinc-600">{label}</span>
      {children}
    </label>
  );
}
function Select({ options = [], className = '', ...props }) {
  return (
    <select className={cx('w-full rounded-xl border border-zinc-300 bg-white px-3.5 py-2.5 text-[13px] outline-none transition-colors focus:border-zinc-900 focus:ring-4 focus:ring-zinc-900/5', className)} {...props}>
      {options.map((o) => <option key={o.v} value={o.v}>{o.l}</option>)}
    </select>
  );
}
function Textarea({ className = '', ...props }) {
  return <textarea className={cx('w-full rounded-xl border border-zinc-300 px-3.5 py-2.5 text-[13px] leading-relaxed outline-none transition-colors focus:border-zinc-900 focus:ring-4 focus:ring-zinc-900/5', className)} {...props} />;
}
