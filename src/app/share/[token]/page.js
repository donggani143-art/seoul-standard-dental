import { loadShareTokenForView } from '@/lib/salesShare';
import { getDb } from '@/lib/db';
import { CHECKLIST_SECTIONS, CHECKLIST_TOTAL, SERVICE_KEYS, SERVICE_META, STATUS_META } from '@/components/admin/sales/salesShared';

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }) {
  const { token } = await params;
  return { title: `진행 현황 공유 — ${String(token).slice(0, 6)}…`, robots: { index: false, follow: false } };
}

async function loadShareData(token) {
  const { share, error } = await loadShareTokenForView(token);
  if (error) return { error };
  const db = await getDb();
  const [checkRows, infoRow, serviceRows] = await Promise.all([
    db.all('SELECT item_key, checked, checked_at FROM sales_checklist WHERE prospect_id = ?', [share.prospect_id]),
    db.get('SELECT subjects, strengths, refs, memo, multi, maint, seo, aeo, vat, files_text FROM sales_clinic_info WHERE prospect_id = ?', [share.prospect_id]),
    db.all('SELECT service_key, is_active, started_at, completed_at FROM sales_service_status WHERE prospect_id = ? AND is_active = 1', [share.prospect_id]),
  ]);
  const checks = {};
  checkRows.forEach((r) => { checks[r.item_key] = !!r.checked; });
  const activeServices = new Set(serviceRows.map((r) => r.service_key));
  return { share, checks, info: infoRow || {}, activeServices };
}

function ErrorPage({ title, message }) {
  return (
    <div className="min-h-screen bg-zinc-50 px-4 py-16 font-sans">
      <div className="mx-auto max-w-md rounded-2xl border border-zinc-200 bg-white p-8 text-center shadow-sm">
        <p className="text-4xl">🔒</p>
        <h1 className="mt-4 text-lg font-black text-zinc-900">{title}</h1>
        <p className="mt-2 text-sm text-zinc-500">{message}</p>
      </div>
    </div>
  );
}

export default async function ShareViewPage({ params }) {
  const { token } = await params;
  const data = await loadShareData(token);

  if (data.error === 'NOT_FOUND') return <ErrorPage title="링크를 찾을 수 없습니다" message="잘못된 주소이거나 삭제된 공유 링크입니다." />;
  if (data.error === 'REVOKED')   return <ErrorPage title="폐기된 링크입니다" message="이 공유 링크는 발급자가 폐기했습니다." />;
  if (data.error === 'EXPIRED')   return <ErrorPage title="만료된 링크입니다" message="유효 기간이 지난 공유 링크입니다." />;

  const { share, checks, info, activeServices } = data;
  const done = Object.values(checks).filter(Boolean).length;
  const pct = Math.round((done / CHECKLIST_TOTAL) * 100);
  const status = STATUS_META[share.status] || STATUS_META.lead;

  return (
    <div className="min-h-screen bg-zinc-50 font-sans">
      {/* 상단 — 메타링크 브랜드 + 읽기 전용 알림 */}
      <header className="border-b border-zinc-200 bg-white">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-6 py-4">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-zinc-400">METALINK · Sales Progress</p>
            <p className="mt-0.5 text-sm font-black text-zinc-900">{share.name} 진행 현황</p>
          </div>
          <span className="rounded-full bg-zinc-100 px-3 py-1 text-[11px] font-bold text-zinc-600">읽기 전용</span>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-6 py-8 space-y-6">
        {/* 개요 */}
        <section className="rounded-2xl border border-zinc-200 bg-white p-6">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-xl font-black text-zinc-900">{share.name}</h2>
            <span className="inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-bold border-zinc-200 bg-zinc-100 text-zinc-700">{status.label}</span>
            {share.linked_hospital_id && (
              <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-bold text-emerald-700">운영 업체: {share.hospital_name}</span>
            )}
          </div>
          <p className="mt-2 text-sm text-zinc-600">
            {share.doctor_name && <>원장 {share.doctor_name}</>}
            {share.doctor_name && share.phone && <> · </>}
            {share.phone}
          </p>
          {share.addr && <p className="mt-0.5 text-xs text-zinc-500">{share.addr}</p>}

          <div className="mt-5 flex items-center gap-3">
            <div className="flex-1">
              <div className="mb-1.5 flex items-center justify-between">
                <span className="text-xs font-bold text-zinc-600">진행 체크리스트</span>
                <span className="text-xs font-bold text-zinc-700">{done} / {CHECKLIST_TOTAL} ({pct}%)</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-zinc-100">
                <div className="h-full bg-emerald-500 transition-all" style={{ width: `${pct}%` }} />
              </div>
            </div>
          </div>
        </section>

        {/* 진행 중인 서비스 */}
        <section className="rounded-2xl border border-zinc-200 bg-white p-6">
          <h3 className="mb-3 text-sm font-black text-zinc-900">진행 중인 서비스</h3>
          {activeServices.size === 0 ? (
            <p className="text-xs text-zinc-400">현재 진행 중인 서비스가 없습니다.</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {SERVICE_KEYS.filter((k) => activeServices.has(k)).map((k) => (
                <span key={k} className="inline-flex items-center rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700">
                  ✓ {SERVICE_META[k].label}
                </span>
              ))}
            </div>
          )}
        </section>

        {/* 체크리스트 진행 상세 */}
        <section className="rounded-2xl border border-zinc-200 bg-white p-6">
          <h3 className="mb-4 text-sm font-black text-zinc-900">체크리스트 상세</h3>
          <div className="space-y-4">
            {CHECKLIST_SECTIONS.map((sec) => {
              const sd = sec.items.filter((it) => checks[it.id]).length;
              return (
                <div key={sec.title}>
                  <div className="mb-2 flex items-center justify-between border-b border-zinc-100 pb-1.5">
                    <h4 className="text-xs font-black text-zinc-800">{sec.title}</h4>
                    <span className="text-[11px] font-bold text-zinc-500">{sd} / {sec.items.length}</span>
                  </div>
                  <ul className="space-y-1.5">
                    {sec.items.map((it) => {
                      const ch = !!checks[it.id];
                      return (
                        <li key={it.id} className="flex items-start gap-2 text-xs">
                          <span className={`mt-0.5 inline-flex h-4 w-4 shrink-0 items-center justify-center rounded ${ch ? 'bg-emerald-500 text-white' : 'border border-zinc-300'}`}>{ch ? '✓' : ''}</span>
                          <span className={ch ? 'text-zinc-400 line-through' : 'text-zinc-700'}>{it.text}</span>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              );
            })}
          </div>
        </section>

        {/* 병원 메모 (있을 때만) */}
        {(info.subjects || info.strengths || info.memo) && (
          <section className="rounded-2xl border border-zinc-200 bg-white p-6">
            <h3 className="mb-3 text-sm font-black text-zinc-900">병원 정보</h3>
            {info.subjects && <p className="text-xs"><b className="text-zinc-700">진료과목:</b> <span className="text-zinc-600">{info.subjects}</span></p>}
            {info.strengths && <p className="mt-2 text-xs"><b className="text-zinc-700">강점:</b> <span className="whitespace-pre-line text-zinc-600">{info.strengths}</span></p>}
            {info.memo && <p className="mt-2 text-xs"><b className="text-zinc-700">메모:</b> <span className="whitespace-pre-line text-zinc-600">{info.memo}</span></p>}
          </section>
        )}

        <p className="text-center text-[11px] text-zinc-400">
          본 페이지는 외부 공유용 읽기 전용 화면이며 계정·비밀번호 등 민감 정보는 노출되지 않습니다.
        </p>
      </main>
    </div>
  );
}
