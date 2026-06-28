'use client';

import { useEffect, useState } from 'react';
import { cx } from './salesShared';

// 병원 정보 탭 — sales_clinic_info 의 진료/강점/참고/메모 부분
export default function InfoTab({ prospectId, prospect, onProspectPatch }) {
  const [info, setInfo] = useState({ subjects: '', strengths: '', refs: '', memo: '' });
  const [qa, setQa] = useState(null); // 질문지 응답 원본
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  // sales_prospects 자체의 doctor_name/phone/addr 도 함께 편집
  const [pName, setPName] = useState(prospect?.name || '');
  const [pDoctor, setPDoctor] = useState(prospect?.doctor_name || '');
  const [pPhone, setPPhone] = useState(prospect?.phone || '');
  const [pAddr, setPAddr] = useState(prospect?.addr || '');

  useEffect(() => {
    setPName(prospect?.name || '');
    setPDoctor(prospect?.doctor_name || '');
    setPPhone(prospect?.phone || '');
    setPAddr(prospect?.addr || '');
  }, [prospect?.id, prospect?.name, prospect?.doctor_name, prospect?.phone, prospect?.addr]);

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
          subjects: d.subjects || '',
          strengths: d.strengths || '',
          refs: d.refs || '',
          memo: d.memo || '',
        });
        try { setQa(d.answers_json ? JSON.parse(d.answers_json) : null); } catch { setQa(null); }
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [prospectId]);

  async function save() {
    setSaving(true);
    setError('');
    setNotice('');
    try {
      // 1) prospect 기본정보(이름/원장/전화/주소) 갱신
      const r1 = await fetch(`/api/admin/sales/prospects/${prospectId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({ name: pName.trim(), doctor_name: pDoctor.trim(), phone: pPhone.trim(), addr: pAddr.trim() }),
      });
      const j1 = await r1.json();
      if (!r1.ok || j1.error) throw new Error(j1.error || '기본정보 저장 실패');

      // 2) clinic_info 갱신
      const r2 = await fetch(`/api/admin/sales/prospects/${prospectId}/info`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify(info),
      });
      const j2 = await r2.json();
      if (!r2.ok || j2.error) throw new Error(j2.error || '진료정보 저장 실패');

      onProspectPatch?.({ name: pName.trim(), doctor_name: pDoctor.trim(), phone: pPhone.trim(), addr: pAddr.trim() });
      setNotice('병원 정보가 저장되었습니다.');
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

      <QuestionnaireAnswers qa={qa} />

      <Section title="👤 기본 정보">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Field label="치과명 *"><Input value={pName} onChange={(e) => setPName(e.target.value)} /></Field>
          <Field label="담당 원장명"><Input value={pDoctor} onChange={(e) => setPDoctor(e.target.value)} placeholder="예: 김원장" /></Field>
          <Field label="연락처"><Input value={pPhone} onChange={(e) => setPPhone(e.target.value)} placeholder="010-0000-0000" /></Field>
          <Field label="주소"><Input value={pAddr} onChange={(e) => setPAddr(e.target.value)} placeholder="병원 주소" /></Field>
        </div>
      </Section>

      <Section title="🩺 진료과목 및 특장점">
        <div className="space-y-3">
          <Field label="진료과목 (쉼표로 구분)"><Input value={info.subjects} onChange={(e) => setInfo({ ...info, subjects: e.target.value })} placeholder="예: 임플란트, 교정, 충치치료" /></Field>
          <Field label="병원 강점 및 특장점"><Textarea value={info.strengths} onChange={(e) => setInfo({ ...info, strengths: e.target.value })} placeholder="예: 15년 경력 원장, 무통마취 전문..." rows={3} /></Field>
        </div>
      </Section>

      <Section title="🔗 참고 사이트">
        <Field label="참고 URL (줄바꿈으로 구분)">
          <Textarea value={info.refs} onChange={(e) => setInfo({ ...info, refs: e.target.value })} placeholder="https://example.com" rows={3} />
        </Field>
      </Section>

      <Section title="📝 추가 요청사항 및 메모">
        <Field label="">
          <Textarea value={info.memo} onChange={(e) => setInfo({ ...info, memo: e.target.value })} placeholder="꼭 넣어야 할 메뉴, 기능, 특이사항 등..." rows={5} />
        </Field>
      </Section>

      <div className="flex justify-end">
        <button onClick={save} disabled={saving} className="rounded-xl bg-accent px-5 py-2.5 text-sm font-bold text-white transition-colors hover:bg-accent-hover disabled:opacity-50">
          {saving ? '저장 중…' : '저장'}
        </button>
      </div>
    </div>
  );
}

// 질문지(병원이 직접 입력) 응답 — 읽기 전용, 섹션별 요약
function QuestionnaireAnswers({ qa }) {
  if (!qa || typeof qa !== 'object') return null;
  const arr = (v) => (Array.isArray(v) && v.length ? v.join(', ') : '');
  const txt = (v) => (typeof v === 'string' && v.trim() && v !== '모름' ? v.trim() : '');

  const SECTIONS = [
    ['기본 정보', [
      ['병원명', txt(qa.hospital_name)], ['원장 성함', txt(qa.doctor_name)], ['출신 대학', txt(qa.doctor_school)],
      ['전문의', txt(qa.is_specialist)], ['주요 이력', txt(qa.doctor_history)], ['협진 의료진', txt(qa.co_count)],
      ['협진 분야', txt(qa.co_desc)], ['팩스', txt(qa.fax)], ['야간진료', txt(qa.hours_night)],
      ['토요일', txt(qa.hours_saturday)], ['일요일', txt(qa.hours_sunday)], ['평일·점심', txt(qa.hours_lunch)],
      ['개원연도', txt(qa.established)], ['병원 규모', txt(qa.floor_area)], ['층별 구성', txt(qa.floors)],
    ]],
    ['차별화', [
      ['병원 강점', arr(qa.strengths)], ['차별점', txt(qa.diff_point)], ['진료철학·슬로건', txt(qa.philosophy)],
      ['협진 시스템', txt(qa.coop_system)], ['환자 설명방식', arr(qa.inform_tools)], ['감염관리', arr(qa.infection_items)],
    ]],
    ['진료 과목', [
      ['대표 과목', arr(qa.subjects)], ['타겟 연령', arr(qa.target_age)], ['임플란트', txt(qa.do_implant)],
      ['임플란트 브랜드', arr(qa.implant_brands)], ['수면 임플란트', txt(qa.implant_sedation)], ['교정', txt(qa.do_ortho)],
      ['교정 종류', arr(qa.ortho_types)], ['소아치과', txt(qa.do_pedo)], ['소아 수면', txt(qa.pedo_sedation)],
      ['심미 치료', arr(qa.esthetic_items)], ['일반진료', arr(qa.general_items)], ['수면진료', txt(qa.sedation)],
      ['수면 방식', arr(qa.sedation_types)],
    ]],
    ['시설·장비', [
      ['주요 장비', arr(qa.equipment)], ['원내 기공소', txt(qa.inhouse_lab)], ['편의시설', arr(qa.amenities)],
      ['주차', txt(qa.parking)], ['소아 전용공간', txt(qa.kids_space)], ['층별 공간', txt(qa.floors_desc)],
    ]],
    ['콘텐츠', [
      ['비포/애프터', txt(qa.before_after)], ['블로그', txt(qa.blog)], ['블로그 링크', txt(qa.blog_link)],
      ['유튜브', txt(qa.youtube)], ['유튜브 링크', txt(qa.youtube_link)], ['FAQ', txt(qa.faq)],
      ['리뷰 채널', arr(qa.review_channels)],
    ]],
    ['비용·예약', [
      ['비용 공개', txt(qa.price_disclosure)], ['예약 채널', arr(qa.booking_channels)], ['예약 링크', txt(qa.booking_links)],
      ['상담 방식', arr(qa.consult_channels)],
    ]],
    ['브랜드·디자인', [
      ['브랜드 키워드', txt(qa.brand_keywords)], ['슬로건', txt(qa.slogan)], ['로고·CI', txt(qa.logo)],
      ['브랜드 컬러', txt(qa.logo_color)], ['톤앤매너', arr(qa.tone)], ['참고 사이트', txt(qa.refs)],
      ['특별 기능', arr(qa.special_features)], ['사진·영상', txt(qa.photo_shoot)],
    ]],
    ['SEO·마케팅', [
      ['1차 지역', txt(qa.target_area1)], ['2차 지역', txt(qa.target_area2)], ['핵심 키워드', txt(qa.keywords)],
      ['마케팅 채널', (() => {
        const list = Array.isArray(qa.marketing_channels) ? qa.marketing_channels.slice() : [];
        const etc = txt(qa.marketing_etc);
        const i = list.indexOf('기타');
        if (i > -1 && etc) list[i] = `기타(${etc})`;
        return list.join(', ');
      })()], ['운영 계획', txt(qa.ops_plan)],
    ]],
  ].map(([title, rows]) => [title, rows.filter(([, v]) => v)]).filter(([, rows]) => rows.length > 0);

  const driveUrl = txt(qa.drive_folder_url);
  const driveFiles = Array.isArray(qa.drive_files) ? qa.drive_files : [];
  if (SECTIONS.length === 0 && !driveUrl) return null;

  function downloadJson() {
    try {
      const base = (typeof qa.hospital_name === 'string' && qa.hospital_name.trim()) ? qa.hospital_name.trim() : '질문지';
      const stamp = new Date().toISOString().slice(0, 10);
      const blob = new Blob([JSON.stringify(qa, null, 2)], { type: 'application/json;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `질문지_${base}_${stamp}.json`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch { /* noop */ }
  }

  return (
    <div className="overflow-hidden rounded-xl border border-accent/30 bg-accent-soft/30">
      <div className="flex items-center justify-between border-b border-accent/20 bg-accent-soft/60 px-5 py-3.5">
        <h3 className="text-sm font-black text-offblack">📋 질문지 응답 <span className="font-semibold text-zinc-500">(병원이 직접 입력)</span></h3>
        <button
          type="button"
          onClick={downloadJson}
          className="inline-flex items-center gap-1 rounded-md border border-accent/40 bg-white px-2.5 py-1 text-[11px] font-bold text-accent transition hover:bg-accent hover:text-white"
        >
          ⬇ JSON 다운로드
        </button>
      </div>
      <div className="space-y-4 p-5">
        {SECTIONS.map(([title, rows]) => (
          <div key={title}>
            <p className="mb-2 text-[11px] font-black uppercase tracking-wider text-accent">{title}</p>
            <dl className="grid grid-cols-1 gap-x-5 gap-y-2 sm:grid-cols-2">
              {rows.map(([k, v]) => (
                <div key={k} className="flex gap-2 text-[13px]">
                  <dt className="shrink-0 font-bold text-zinc-500">{k}</dt>
                  <dd className="text-zinc-800">{v}</dd>
                </div>
              ))}
            </dl>
          </div>
        ))}
      </div>
      {driveUrl && (
        <div className="border-t border-accent/20 px-4 py-3">
          <a href={driveUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 rounded-lg bg-accent px-3 py-1.5 text-xs font-bold text-white hover:bg-accent-hover">
            📁 업로드 자료 폴더 열기{driveFiles.length ? ` (${driveFiles.length})` : ''}
          </a>
        </div>
      )}
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
      {label && <span className="mb-1.5 block text-[13px] font-bold text-zinc-600">{label}</span>}
      {children}
    </label>
  );
}
function Input({ className = '', ...props }) {
  return <input className={cx('w-full rounded-xl border border-zinc-300 px-3.5 py-2.5 text-[13px] outline-none transition-colors focus:border-zinc-900 focus:ring-4 focus:ring-zinc-900/5', className)} {...props} />;
}
function Textarea({ className = '', ...props }) {
  return <textarea className={cx('w-full rounded-xl border border-zinc-300 px-3.5 py-2.5 text-[13px] leading-relaxed outline-none transition-colors focus:border-zinc-900 focus:ring-4 focus:ring-zinc-900/5', className)} {...props} />;
}
