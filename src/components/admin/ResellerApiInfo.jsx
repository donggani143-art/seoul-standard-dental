'use client';

import { useEffect, useMemo, useState } from 'react';

// 리셀러 "API 정보" 모듈 — 담당 업체별 자동화 연동 정보를 복사하기 쉽게 제공

function CopyBtn({ text, small }) {
  const [done, setDone] = useState(false);
  async function copy() {
    try {
      await navigator.clipboard.writeText(String(text ?? ''));
      setDone(true);
      setTimeout(() => setDone(false), 1200);
    } catch { /* */ }
  }
  return (
    <button
      type="button"
      onClick={copy}
      className={`shrink-0 rounded-md border text-[11px] font-bold transition-colors ${small ? 'px-1.5 py-0.5' : 'px-2 py-1'} ${done ? 'border-emerald-300 bg-emerald-50 text-emerald-600' : 'border-zinc-200 bg-white text-zinc-500 hover:border-zinc-400 hover:text-zinc-800'}`}
    >
      {done ? '복사됨 ✓' : '복사'}
    </button>
  );
}

function InfoRow({ label, value, mono = true }) {
  return (
    <div className="flex items-center gap-3 border-b border-zinc-50 px-4 py-2.5 last:border-b-0">
      <span className="w-36 shrink-0 text-[12px] font-bold text-zinc-500">{label}</span>
      <span className={`min-w-0 flex-1 truncate text-[13px] text-zinc-800 ${mono ? 'font-mono' : 'font-semibold'}`}>{value || '-'}</span>
      {value ? <CopyBtn text={value} small /> : null}
    </div>
  );
}

function hospitalCopyText(h) {
  const lines = [
    `[${h.name}] API 연동 정보`,
    `Bearer 토큰: (공통 토큰 사용 — API 정보 상단에서 복사)`,
    `Host 헤더 (병원 식별): ${h.host}`,
    `병원 ID (숫자): ${h.id}`,
  ];
  if (h.domains?.length) lines.push(`커스텀 도메인: ${h.domains.join(', ')}`);
  if (h.indexnow_key_location) lines.push(`IndexNow keyLocation: ${h.indexnow_key_location}`);
  lines.push(`게시판 type: board (커스텀) / notice (공지)`);
  for (const g of h.groups || []) {
    lines.push(`— ${g.name}: 그룹 ID ${g.id} · 발행 URL ${g.post_url_pattern}`);
  }
  lines.push(`— 공지사항: 발행 URL ${h.notice_url_pattern}`);
  return lines.join('\n');
}

export default function ResellerApiInfo() {
  const [data, setData] = useState(null);
  const [err, setErr] = useState('');
  const [q, setQ] = useState('');
  const [showToken, setShowToken] = useState(false);
  const [openId, setOpenId] = useState(null);

  useEffect(() => {
    fetch('/api/admin/reseller/api-info', { credentials: 'same-origin' })
      .then((r) => r.json())
      .then((d) => { if (d?.error) setErr(d.error); else setData(d); })
      .catch(() => setErr('정보를 불러오지 못했습니다.'));
  }, []);

  const hospitals = useMemo(() => {
    const list = data?.hospitals || [];
    const term = q.trim().toLowerCase();
    if (!term) return list;
    return list.filter((h) => (h.name || '').toLowerCase().includes(term) || (h.slug || '').toLowerCase().includes(term) || String(h.id) === term);
  }, [data, q]);

  if (err) return <div className="p-8"><div className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">{err}</div></div>;
  if (!data) return <div className="p-16 text-center text-sm text-zinc-400">불러오는 중…</div>;

  const token = data.token || '';

  return (
    <div className="mx-auto max-w-4xl space-y-5 p-6">
      <div>
        <h2 className="text-lg font-black text-offblack">API 정보</h2>
        <p className="mt-1 text-[13px] text-zinc-500">
          자동화(외부 연동) 서비스에 필요한 업체별 정보입니다. 각 값 옆 <b>복사</b> 버튼으로 바로 복사하세요.
        </p>
      </div>

      {/* 공통 정보 */}
      <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white">
        <div className="border-b border-zinc-100 bg-zinc-50/60 px-5 py-3"><h3 className="text-sm font-black text-offblack">🔑 공통 정보 (모든 업체 동일)</h3></div>
        <div>
          <div className="flex items-center gap-3 border-b border-zinc-50 px-4 py-2.5">
            <span className="w-36 shrink-0 text-[12px] font-bold text-zinc-500">Bearer 토큰</span>
            <span className="min-w-0 flex-1 truncate font-mono text-[13px] text-zinc-800">
              {token ? (showToken ? token : '••••••••••••••••••••••••') : '(미설정 — 슈퍼관리자에게 문의)'}
            </span>
            {token && (
              <>
                <button type="button" onClick={() => setShowToken((v) => !v)} className="shrink-0 rounded-md border border-zinc-200 px-1.5 py-0.5 text-[11px] font-bold text-zinc-500 hover:border-zinc-400 hover:text-zinc-800">
                  {showToken ? '숨김' : '표시'}
                </button>
                <CopyBtn text={token} small />
              </>
            )}
          </div>
          <InfoRow label="인증 헤더" value="Authorization: Bearer <토큰>" />
          <InfoRow label="게시판 type" value="board (커스텀 게시판) · notice (공지사항)" mono={false} />
          {data.indexnow_key ? <InfoRow label="IndexNow Key" value={data.indexnow_key} /> : null}
        </div>
        <p className="border-t border-zinc-100 bg-amber-50/60 px-4 py-2 text-[11px] text-amber-700">
          ⚠️ 이 토큰으로 API 전체에 접근할 수 있습니다. 외부에 노출되지 않도록 주의해 주세요.
        </p>
      </div>

      {/* 업체 검색 */}
      <div className="flex items-center justify-between gap-3">
        <p className="text-[13px] font-bold text-zinc-600">담당 업체 {hospitals.length}곳</p>
        <input
          type="search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="업체명 · 주소(slug) · ID 검색"
          className="w-64 rounded-lg border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-zinc-900"
        />
      </div>

      {/* 업체 카드 */}
      {hospitals.length === 0 ? (
        <p className="rounded-xl border border-zinc-200 bg-white py-12 text-center text-sm text-zinc-400">
          {q ? '검색 결과가 없습니다.' : '배정된 업체가 없습니다.'}
        </p>
      ) : (
        <div className="space-y-3">
          {hospitals.map((h) => {
            const open = openId === h.id;
            return (
              <div key={h.id} className="overflow-hidden rounded-2xl border border-zinc-200 bg-white">
                <button
                  type="button"
                  onClick={() => setOpenId(open ? null : h.id)}
                  className="flex w-full items-center gap-3 px-5 py-3.5 text-left transition-colors hover:bg-zinc-50/60"
                >
                  <span className={`shrink-0 text-[12px] transition-transform ${open ? 'rotate-90' : ''}`}>▶</span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-black text-offblack">{h.name}</span>
                    <span className="block truncate font-mono text-[11px] text-zinc-400">{h.host}</span>
                  </span>
                  <span className="shrink-0 rounded-full bg-zinc-100 px-2.5 py-0.5 font-mono text-[11px] font-bold text-zinc-600">ID {h.id}</span>
                  {h.status && <span className="shrink-0 rounded-full bg-sky-50 px-2.5 py-0.5 text-[11px] font-bold text-sky-600">{h.status}</span>}
                </button>

                {open && (
                  <div className="border-t border-zinc-100">
                    <InfoRow label="Host 헤더 (병원 식별)" value={h.host} />
                    <InfoRow label="병원 ID (숫자)" value={String(h.id)} />
                    {h.domains?.length > 0 && <InfoRow label="커스텀 도메인" value={h.domains.join(', ')} />}
                    <InfoRow label="공지 발행 URL" value={h.notice_url_pattern} />
                    {h.indexnow_key_location ? <InfoRow label="IndexNow keyLocation" value={h.indexnow_key_location} /> : null}

                    <div className="border-b border-zinc-50 px-4 py-2.5">
                      <p className="mb-2 text-[12px] font-bold text-zinc-500">게시판 그룹 ({h.groups.length}개)</p>
                      {h.groups.length === 0 ? (
                        <p className="text-[12px] text-zinc-400">커스텀 게시판이 없습니다. (notice type은 그룹 ID 없이 사용)</p>
                      ) : (
                        <div className="space-y-2">
                          {h.groups.map((g) => (
                            <div key={g.id} className="rounded-lg border border-zinc-100 bg-zinc-50/50 px-3 py-2">
                              <div className="flex items-center gap-2">
                                <span className="min-w-0 flex-1 truncate text-[13px] font-bold text-zinc-800">{g.name}</span>
                                {g.members_only ? <span className="shrink-0 rounded-full bg-violet-50 px-2 py-0.5 text-[10px] font-bold text-violet-600">회원전용</span> : null}
                                <span className="shrink-0 font-mono text-[12px] text-zinc-500">그룹 ID {g.id}</span>
                                <CopyBtn text={String(g.id)} small />
                              </div>
                              <div className="mt-1.5 flex items-center gap-2">
                                <span className="min-w-0 flex-1 truncate font-mono text-[11px] text-zinc-500">{g.post_url_pattern}</span>
                                <CopyBtn text={g.post_url_pattern} small />
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="flex justify-end px-4 py-3">
                      <CopyBtn text={hospitalCopyText(h)} />
                      <span className="ml-2 self-center text-[11px] text-zinc-400">← 이 업체 정보 전체 복사</span>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
