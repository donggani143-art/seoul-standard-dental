'use client';

import { useEffect, useRef, useState } from 'react';

// ── 선택지 정의 (대부분 선택형) ──────────────────────────────────────────────
const SUBJECT_OPTIONS = ['임플란트', '교정', '심미보철', '일반진료', '소아치과', '구강외과', '치주(잇몸)', '보철(틀니)', '예방·검진', '턱관절'];
const IMPLANT_BRANDS = ['오스템', '스트라우만', '덴티움', '디오', '네오', '메가젠', '기타'];
const ORTHO_TYPES = ['투명교정(인비절라인)', '메탈교정', '세라믹교정', '설측교정', '부분교정'];
const ESTHETIC_ITEMS = ['라미네이트', '치아미백', '심미레진', '올세라믹 크라운', '잇몸성형'];
const GENERAL_ITEMS = ['충치치료', '레진', '크라운', '인레이', '신경치료', '스케일링', '잇몸치료', '사랑니 발치'];
const SEDATION_TYPES = ['웃음가스(아산화질소)', '수면마취(정맥진정)'];
const EQUIPMENT_OPTIONS = ['3D CT', '파노라마', '구강 스캐너', '구강 카메라', '임플란트 네비게이션', '수술용 현미경', '레이저', '디지털 보철장비'];
const INFORM_TOOLS = ['3D 시뮬레이션', '구강 스캐너 영상', '모형·사진', '구두 설명'];
const INFECTION_ITEMS = ['1인 1기구', '고압증기 멸균기', '핸드피스 멸균', '일회용품 사용', '에어샤워', '별도 멸균실'];
const AMENITIES = ['주차 가능', '음료 제공', '와이파이', '유아 동반', '장애인 편의', '파우더룸'];
const REVIEW_CHANNELS = ['네이버 지도', '구글 지도', '카카오맵', '기타'];
const BOOKING_CHANNELS = ['네이버 예약', '카카오톡 채널', '전화 예약', '홈페이지 예약'];
const CONSULT_CHANNELS = ['전화', '문자', '카카오톡', '홈페이지 채팅', '방문 상담'];
const TONE_OPTIONS = ['모던', '클래식', '고급스러운', '친근한', '깔끔·미니멀', '따뜻한', '신뢰감 있는'];
const SPECIAL_FEATURES = ['온라인 예약', '비용 계산기', 'AI 증상체커', '실시간 상담', '다국어', '전후사진 갤러리', '오시는 길 지도'];
const MARKETING_CHANNELS = ['네이버 파워링크', '플레이스 광고', '인스타그램', '유튜브', '블로그', '오프라인(버스·현수막)'];
const AGE_OPTIONS = ['10대 이하', '20~30대', '40~50대', '60대 이상', '전 연령'];
const PRICE_OPTIONS = ['전체 공개', '일부 공개', '비공개', '상담 후 결정'];
const FLOOR_AREA_OPTIONS = ['~50평', '50~100평', '100~200평', '200평 이상'];

const UNKNOWN = '모름';

// ── UI 조각 ──────────────────────────────────────────────────────────────────
function Pill({ active, onClick, children }) {
  return (
    <button type="button" onClick={onClick}
      className={`rounded-full border px-4 py-2.5 text-[15px] font-semibold transition ${active ? 'border-accent bg-accent text-white shadow-sm' : 'border-line bg-white text-zinc-700 hover:border-accent/50'}`}>
      {children}
    </button>
  );
}
function TextField({ label, hint, ...props }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-[14px] font-bold text-zinc-700">{label}{hint && <span className="ml-1 text-[12px] font-normal text-zinc-400">{hint}</span>}</span>
      <input {...props} className="w-full rounded-xl border border-line bg-white px-4 py-3 text-[16px] text-zinc-800 outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/15" />
    </label>
  );
}
function TextArea({ label, hint, ...props }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-[14px] font-bold text-zinc-700">{label}{hint && <span className="ml-1 text-[12px] font-normal text-zinc-400">{hint}</span>}</span>
      <textarea {...props} className="w-full rounded-xl border border-line bg-white px-4 py-3 text-[16px] text-zinc-800 outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/15" />
    </label>
  );
}
function SingleSelect({ label, hint, value, options, onChange, unknownLabel = '잘 모르겠어요', showUnknown = true }) {
  return (
    <div>
      {label && <p className="mb-2 text-[15px] font-bold text-zinc-700">{label}{hint && <span className="ml-1 text-[12px] font-normal text-zinc-400">{hint}</span>}</p>}
      <div className="flex flex-wrap gap-2.5">
        {options.map((o) => <Pill key={o} active={value === o} onClick={() => onChange(o)}>{o}</Pill>)}
        {showUnknown && <Pill active={value === UNKNOWN} onClick={() => onChange(UNKNOWN)}>{unknownLabel}</Pill>}
      </div>
    </div>
  );
}
function MultiSelect({ label, hint, selected = [], options, onToggle }) {
  return (
    <div>
      {label && <p className="mb-2 text-[15px] font-bold text-zinc-700">{label}{hint && <span className="ml-1 text-[12px] font-normal text-zinc-400">{hint}</span>}</p>}
      <div className="flex flex-wrap gap-2.5">
        {options.map((o) => <Pill key={o} active={selected.includes(o)} onClick={() => onToggle(o)}>{o}</Pill>)}
      </div>
    </div>
  );
}
// 선택형 + "직접입력" (선택지에 없으면 직접 입력)
function SingleSelectInput({ label, hint, value, options, onChange, placeholder = '직접 입력해 주세요', unknownLabel = '잘 모르겠어요', showUnknown = true }) {
  const isPreset = (v) => options.includes(v) || v === UNKNOWN;
  const [openState, setOpenState] = useState(false);
  const open = openState || (!isPreset(value) && value !== '');
  const choose = (o) => { setOpenState(false); onChange(o); };
  return (
    <div>
      {label && <p className="mb-2 text-[15px] font-bold text-zinc-700">{label}{hint && <span className="ml-1 text-[12px] font-normal text-zinc-400">{hint}</span>}</p>}
      <div className="flex flex-wrap gap-2.5">
        {options.map((o) => <Pill key={o} active={!open && value === o} onClick={() => choose(o)}>{o}</Pill>)}
        {showUnknown && <Pill active={!open && value === UNKNOWN} onClick={() => choose(UNKNOWN)}>{unknownLabel}</Pill>}
        <Pill active={open} onClick={() => { setOpenState(true); if (isPreset(value)) onChange(''); }}>직접입력</Pill>
      </div>
      {open && (
        <input value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} autoFocus
          className="mt-2.5 w-full rounded-xl border border-line bg-white px-4 py-3 text-[16px] text-zinc-800 outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/15" />
      )}
    </div>
  );
}
// 복수 선택 + "기타"(직접 입력)
function MultiSelectEtc({ label, hint, selected = [], options, onToggle, etcLabel = '기타', etcValue, onEtcChange, placeholder = '직접 입력해 주세요' }) {
  const etcOn = selected.includes(etcLabel);
  return (
    <div>
      {label && <p className="mb-2 text-[15px] font-bold text-zinc-700">{label}{hint && <span className="ml-1 text-[12px] font-normal text-zinc-400">{hint}</span>}</p>}
      <div className="flex flex-wrap gap-2.5">
        {options.map((o) => <Pill key={o} active={selected.includes(o)} onClick={() => onToggle(o)}>{o}</Pill>)}
        <Pill active={etcOn} onClick={() => onToggle(etcLabel)}>{etcLabel}</Pill>
      </div>
      {etcOn && (
        <input value={etcValue || ''} onChange={(e) => onEtcChange(e.target.value)} placeholder={placeholder} autoFocus
          className="mt-2.5 w-full rounded-xl border border-line bg-white px-4 py-3 text-[16px] text-zinc-800 outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/15" />
      )}
    </div>
  );
}
function CredBlock({ title, hint, data, onChange, urlField }) {
  const d = data || {};
  return (
    <div className="rounded-xl border border-line bg-white p-4">
      <p className="text-[15px] font-bold text-zinc-800">{title}</p>
      <p className="mb-3 text-[12px] text-zinc-400">{hint || '모르거나 해당 없으면 비워두세요.'}</p>
      <div className="space-y-2.5">
        {urlField
          ? <input value={d.url || ''} onChange={(e) => onChange({ ...d, url: e.target.value })} placeholder="접속 주소(URL)" className="w-full rounded-lg border border-line bg-white px-3.5 py-2.5 text-[15px] outline-none focus:border-accent" />
          : <input value={d.provider || ''} onChange={(e) => onChange({ ...d, provider: e.target.value })} placeholder="업체/제공처 (예: 가비아, 카페24)" className="w-full rounded-lg border border-line bg-white px-3.5 py-2.5 text-[15px] outline-none focus:border-accent" />}
        <input value={d.account_id || ''} onChange={(e) => onChange({ ...d, account_id: e.target.value })} placeholder="아이디" className="w-full rounded-lg border border-line bg-white px-3.5 py-2.5 text-[15px] outline-none focus:border-accent" />
        <input value={d.account_pw || ''} onChange={(e) => onChange({ ...d, account_pw: e.target.value })} placeholder="비밀번호" type="text" className="w-full rounded-lg border border-line bg-white px-3.5 py-2.5 text-[15px] outline-none focus:border-accent" />
      </div>
    </div>
  );
}
function SubGroup({ children }) {
  return <div className="space-y-5 rounded-2xl border border-line bg-white/60 p-4">{children}</div>;
}

export default function QuestionnaireForm({ token, prospect, info = {}, answers = {} }) {
  const total = 9;
  const [step, setStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');
  const [files, setFiles] = useState([]);
  const [uploadMsg, setUploadMsg] = useState('');
  const [upProg, setUpProg] = useState([]); // [{name, pct, status: wait|up|done|fail|cancel}]
  const [visible, setVisible] = useState(true);
  const draftTimer = useRef(null);
  const upXhrRef = useRef(null);     // 진행 중인 전송(취소용)
  const upCancelRef = useRef(false); // 취소 플래그(남은 파일 건너뛰기)
  const LS_KEY = `qdraft_${token}`;

  const splitCsv = (v) => (v ? String(v).split(',').map((s) => s.trim()).filter(Boolean) : []);

  const [a, setA] = useState(() => ({
    // ① 기본 정보
    hospital_name: answers.hospital_name || prospect?.name || '',
    doctor_name: answers.doctor_name || prospect?.doctor_name || '',
    doctor_school: answers.doctor_school || '',
    is_specialist: answers.is_specialist || '',
    doctor_history: answers.doctor_history || '',
    co_count: answers.co_count || '',
    co_desc: answers.co_desc || '',
    phone: answers.phone || prospect?.phone || '',
    addr: answers.addr || prospect?.addr || '',
    fax: answers.fax || '',
    hours_weekday: answers.hours_weekday || '',
    hours_saturday: answers.hours_saturday || '',
    hours_sunday: answers.hours_sunday || '',
    hours_lunch: answers.hours_lunch || '',
    hours_night: answers.hours_night || '',
    established: answers.established || '',
    floor_area: answers.floor_area || '',
    floors: answers.floors || '',
    // ② 차별화
    subjects: answers.subjects || splitCsv(info.subjects),
    strengths: answers.strengths || splitCsv(info.strengths),
    diff_point: answers.diff_point || '',
    philosophy: answers.philosophy || '',
    coop_system: answers.coop_system || '',
    inform_tools: answers.inform_tools || [],
    infection_items: answers.infection_items || [],
    // ③ 진료 과목
    target_age: answers.target_age || [],
    do_implant: answers.do_implant || '',
    implant_brands: answers.implant_brands || [],
    implant_sedation: answers.implant_sedation || '',
    do_ortho: answers.do_ortho || '',
    ortho_types: answers.ortho_types || [],
    do_pedo: answers.do_pedo || '',
    pedo_sedation: answers.pedo_sedation || '',
    esthetic_items: answers.esthetic_items || [],
    general_items: answers.general_items || [],
    sedation: answers.sedation || '',
    sedation_types: answers.sedation_types || [],
    // ④ 시설·장비
    equipment: answers.equipment || [],
    inhouse_lab: answers.inhouse_lab || '',
    amenities: answers.amenities || [],
    parking: answers.parking || '',
    kids_space: answers.kids_space || '',
    floors_desc: answers.floors_desc || '',
    // ⑤ 콘텐츠
    before_after: answers.before_after || '',
    blog: answers.blog || '',
    blog_link: answers.blog_link || '',
    youtube: answers.youtube || '',
    youtube_link: answers.youtube_link || '',
    faq: answers.faq || '',
    review_channels: answers.review_channels || [],
    // ⑥ 비용·예약
    price_disclosure: answers.price_disclosure || '',
    booking_channels: answers.booking_channels || [],
    booking_links: answers.booking_links || '',
    consult_channels: answers.consult_channels || [],
    // ⑦ 브랜드·디자인
    brand_keywords: answers.brand_keywords || '',
    slogan: answers.slogan || '',
    logo: answers.logo || '',
    logo_color: answers.logo_color || '',
    tone: answers.tone || [],
    refs: answers.refs || info.refs || '',
    special_features: answers.special_features || [],
    photo_shoot: answers.photo_shoot || '',
    // ⑧ SEO·마케팅
    target_area1: answers.target_area1 || '',
    target_area2: answers.target_area2 || '',
    keywords: answers.keywords || '',
    marketing_channels: answers.marketing_channels || [],
    marketing_etc: answers.marketing_etc || '',
    ops_plan: answers.ops_plan || '',
    // ⑨ 계정·자료·요청
    creds: answers.creds || { domain: {}, hosting: {}, admin: {}, ftp: {} },
    memo: answers.memo || info.memo || '',
  }));

  function set(key, val) { setA((p) => ({ ...p, [key]: val })); }
  function toggleArr(key, val) {
    setA((p) => { const cur = p[key] || []; return { ...p, [key]: cur.includes(val) ? cur.filter((x) => x !== val) : [...cur, val] }; });
  }
  function setCred(kind, val) { setA((p) => ({ ...p, creds: { ...p.creds, [kind]: val } })); }

  // localStorage 복원
  useEffect(() => {
    try { const raw = localStorage.getItem(LS_KEY); if (raw) { const s = JSON.parse(raw); if (s && typeof s === 'object') setA((p) => ({ ...p, ...s })); } } catch { /* */ }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 자동 임시저장
  useEffect(() => {
    if (done) return;
    try { localStorage.setItem(LS_KEY, JSON.stringify(a)); } catch { /* */ }
    if (draftTimer.current) clearTimeout(draftTimer.current);
    draftTimer.current = setTimeout(() => {
      fetch(`/api/q/${token}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ draft: true, answers: a }), keepalive: true }).catch(() => {});
    }, 1500);
    return () => { if (draftTimer.current) clearTimeout(draftTimer.current); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [a, done]);

  function goStep(next) {
    setVisible(false);
    setTimeout(() => { setStep(next); setVisible(true); window.scrollTo({ top: 0, behavior: 'smooth' }); }, 180);
  }

  function friendlyErr(code) {
    const m = {
      REVOKED: '이미 제출이 완료된 링크입니다. 담당자에게 새 링크를 요청해 주세요.',
      EXPIRED: '링크 사용 기간이 만료되었습니다. 담당자에게 새 링크를 요청해 주세요.',
      NOT_FOUND: '유효하지 않은 링크입니다. 주소를 다시 확인하거나 담당자에게 문의해 주세요.',
    };
    return m[code] || code;
  }

  // 브라우저 → 구글 드라이브 직접 전송(파일이 앱 서버를 거치지 않음 → 대용량 가능)
  function uploadPut(url, file, onPct) {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      upXhrRef.current = xhr;
      xhr.open('PUT', url);
      xhr.upload.onprogress = (ev) => { if (ev.lengthComputable) onPct(Math.round((ev.loaded / ev.total) * 100)); };
      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          try { resolve(JSON.parse(xhr.responseText || '{}')); } catch { resolve({}); }
        } else reject(new Error(`전송 실패 (HTTP ${xhr.status})`));
      };
      xhr.onerror = () => reject(new Error('네트워크 오류'));
      xhr.onabort = () => { const e = new Error('취소됨'); e.canceled = true; reject(e); };
      xhr.send(file);
    });
  }

  function cancelUpload() {
    upCancelRef.current = true;
    try { upXhrRef.current?.abort(); } catch { /* */ }
  }

  async function submit() {
    setSubmitting(true); setError('');
    try {
      let drive = null;
      // 파일 업로드 — 어떤 실패(네트워크·인증만료·취소)도 제출을 막지 않는다
      if (files.length > 0) {
        setUploadMsg('파일 업로드 중… 완료까지 화면을 닫지 마세요.');
        upCancelRef.current = false;
        setUpProg(files.map((f) => ({ name: f.name, pct: 0, status: 'wait' })));
        const setP = (i, patch) => setUpProg((prev) => prev.map((p, idx) => (idx === i ? { ...p, ...patch } : p)));
        const uploaded = [];
        let folderUrl = '';
        let storeMsg = '';
        for (let i = 0; i < files.length; i += 1) {
          if (upCancelRef.current) { setP(i, { status: 'cancel' }); continue; }
          const file = files[i];
          try {
            setP(i, { status: 'up' });
            const sres = await fetch(`/api/q/${token}/upload/session`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ name: file.name, type: file.type, size: file.size }),
            });
            const sj = await sres.json().catch(() => ({}));
            if (!sres.ok || !sj.uploadUrl) {
              if (sj.error === 'DRIVE_NOT_CONFIGURED' || sj.error === 'DRIVE_AUTH_EXPIRED') {
                storeMsg = sj.message || '※ 파일 보관소 미설정 — 파일 없이 제출을 계속합니다.';
                setP(i, { status: 'fail' });
                break;
              }
              throw new Error(sj.message || sj.error || '업로드 준비 실패');
            }
            folderUrl = sj.folderUrl || folderUrl;
            const meta = await uploadPut(sj.uploadUrl, file, (pct) => setP(i, { pct }));
            uploaded.push({ name: meta.name || file.name, link: meta.webViewLink || '' });
            setP(i, { status: 'done', pct: 100 });
          } catch (e) {
            setP(i, e?.canceled ? { status: 'cancel' } : { status: 'fail' });
          } finally {
            upXhrRef.current = null;
          }
        }
        if (uploaded.length > 0) drive = { drive_folder_url: folderUrl, drive_files: uploaded };
        setUploadMsg(
          storeMsg
          || (uploaded.length === files.length
            ? `파일 ${uploaded.length}개 업로드 완료`
            : `※ 파일 ${uploaded.length}/${files.length}개 업로드됨 — 나머지는 추후 담당자에게 별도 전달해 주세요. 질문지는 정상 제출됩니다.`)
        );
      }
      const payload = { ...a, ...(drive || {}) };
      const res = await fetch(`/api/q/${token}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      const json = await res.json().catch(() => ({ error: '제출 응답을 처리하지 못했습니다. 잠시 후 다시 시도해 주세요.' }));
      if (!res.ok || json.error) throw new Error(friendlyErr(json.error) || '제출에 실패했습니다.');
      try { localStorage.removeItem(LS_KEY); } catch { /* */ }
      setDone(true);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (e) { setError(e.message); } finally { setSubmitting(false); }
  }

  if (done) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-base px-6 text-center font-sans">
        <div className="w-full max-w-md rounded-2xl border border-line bg-white p-8 shadow-sm">
          <p className="text-5xl">🎉</p>
          <h1 className="mt-5 text-xl font-black text-offblack">제출이 완료되었습니다</h1>
          <p className="mt-3 text-[15px] leading-relaxed text-zinc-600">소중한 정보 감사합니다.<br />입력해 주신 내용을 바탕으로<br />홈페이지 제작을 진행하겠습니다.</p>
          <p className="mt-6 text-[13px] text-zinc-400">이 창은 닫으셔도 됩니다.</p>
        </div>
      </div>
    );
  }

  const greetingName = prospect?.name || '원장님';

  if (step === 0) {
    return (
      <div className="flex min-h-screen flex-col bg-base font-sans">
        <div className="flex flex-1 flex-col items-center justify-center px-6 text-center">
          <div className="w-full max-w-md">
            <span className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-accent-soft text-3xl">🏥</span>
            <p className="mt-6 text-[13px] font-bold uppercase tracking-widest text-accent">홈페이지 제작 사전 정보</p>
            <h1 className="mt-3 text-[22px] font-black leading-snug text-offblack">{greetingName} 원장님 안녕하세요.<br />홈페이지 제작을 위한<br />질문을 시작할게요.</h1>
            <p className="mt-4 text-[15px] leading-relaxed text-zinc-500">대부분 선택형이라 부담 없이 답하실 수 있어요.<br /><b className="text-zinc-700">모르거나 해당 없는 항목은 건너뛰셔도</b> 됩니다 😊</p>
          </div>
        </div>
        <div className="sticky bottom-0 border-t border-line bg-white/90 px-6 py-4 backdrop-blur">
          <button onClick={() => goStep(1)} className="w-full rounded-xl bg-accent py-4 text-[16px] font-bold text-white transition hover:bg-accent-hover">시작하기 →</button>
        </div>
      </div>
    );
  }

  const steps = {
    1: { icon: '🏥', title: '기본 정보', desc: '병원·원장님 기본 정보를 알려주세요.', body: (
      <div className="space-y-5">
        <TextField label="병원명(상호명)" value={a.hospital_name} onChange={(e) => set('hospital_name', e.target.value)} placeholder="예) ○○치과의원" />
        <SubGroup>
          <TextField label="대표 원장 성함" value={a.doctor_name} onChange={(e) => set('doctor_name', e.target.value)} placeholder="예) 홍길동" />
          <TextField label="출신 대학·전공" hint="(선택)" value={a.doctor_school} onChange={(e) => set('doctor_school', e.target.value)} placeholder="예) ○○대 치과대학" />
          <SingleSelect label="전문의 자격" value={a.is_specialist} options={['전문의', '일반의']} onChange={(v) => set('is_specialist', v)} />
          <TextField label="주요 이력" hint="(선택, 교수·연구·수상 등)" value={a.doctor_history} onChange={(e) => set('doctor_history', e.target.value)} placeholder="예) 前 ○○대 외래교수" />
        </SubGroup>
        <SingleSelect label="협진 의료진 수" value={a.co_count} options={['없음', '1~2명', '3~5명', '6명 이상']} onChange={(v) => set('co_count', v)} />
        <TextField label="협진 의료진 전문분야" hint="(선택)" value={a.co_desc} onChange={(e) => set('co_desc', e.target.value)} placeholder="예) 보철 전문의 1, 교정 전문의 1" />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <TextField label="대표 전화" type="tel" value={a.phone} onChange={(e) => set('phone', e.target.value)} placeholder="02-1234-5678" />
          <TextField label="팩스" hint="(선택)" value={a.fax} onChange={(e) => set('fax', e.target.value)} placeholder="(있다면)" />
        </div>
        <TextField label="병원 주소" value={a.addr} onChange={(e) => set('addr', e.target.value)} placeholder="도로명 주소" />
        <SubGroup>
          <SingleSelectInput label="야간 진료" value={a.hours_night} options={['없음', '주 1~2회', '매일']} onChange={(v) => set('hours_night', v)} placeholder="예) 화·목 21:00까지" />
          <SingleSelectInput label="토요일 진료" value={a.hours_saturday} options={['오전만', '오후까지', '휴진']} onChange={(v) => set('hours_saturday', v)} placeholder="예) 09:00~14:00 (점심 없이)" />
          <SingleSelectInput label="일요일·공휴일" value={a.hours_sunday} options={['진료', '휴진']} onChange={(v) => set('hours_sunday', v)} placeholder="예) 공휴일만 진료 / 둘째·넷째 일요일 진료" />
          <TextField label="평일 진료시간·점심시간" hint="(선택)" value={a.hours_lunch} onChange={(e) => set('hours_lunch', e.target.value)} placeholder="예) 평일 09:30~18:30 / 점심 13:00~14:00" />
        </SubGroup>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <TextField label="개원 연도" hint="(선택)" value={a.established} onChange={(e) => set('established', e.target.value)} placeholder="예) 2015" />
          <div>
            <SingleSelect label="병원 규모" value={a.floor_area} options={FLOOR_AREA_OPTIONS} onChange={(v) => set('floor_area', v)} showUnknown={false} />
          </div>
        </div>
        <TextField label="층수·층별 구성" hint="(선택)" value={a.floors} onChange={(e) => set('floors', e.target.value)} placeholder="예) 3~4층, 4층 수술실" />
      </div>
    )},
    2: { icon: '⭐', title: '차별화 포인트', desc: '우리 병원만의 강점과 진료 철학을 알려주세요.', body: (
      <div className="space-y-6">
        <MultiSelect label="병원 강점" hint="복수 선택" selected={a.strengths} options={['무통마취', '당일진료', '풍부한 경력', '최신 장비', '1:1 맞춤상담', '감염관리 철저', '합리적 비용', '협진 시스템']} onToggle={(v) => toggleArr('strengths', v)} />
        <TextField label="가장 큰 차별점" hint="(한 문장)" value={a.diff_point} onChange={(e) => set('diff_point', e.target.value)} placeholder="예) CT 당일 판독 가능" />
        <TextField label="진료 철학·슬로건" hint="(선택)" value={a.philosophy} onChange={(e) => set('philosophy', e.target.value)} placeholder="예) 정성을 다하는 진료" />
        <SingleSelect label="협진 시스템 운영" value={a.coop_system} options={['운영함', '운영 안 함']} onChange={(v) => set('coop_system', v)} />
        <MultiSelect label="환자 설명(인폼드 컨센트) 방식" hint="복수 선택" selected={a.inform_tools} options={INFORM_TOOLS} onToggle={(v) => toggleArr('inform_tools', v)} />
        <MultiSelect label="감염관리 시스템" hint="복수 선택" selected={a.infection_items} options={INFECTION_ITEMS} onToggle={(v) => toggleArr('infection_items', v)} />
      </div>
    )},
    3: { icon: '🦷', title: '진료 과목', desc: '진료 과목과 세부 내용을 선택해 주세요.', body: (
      <div className="space-y-6">
        <MultiSelect label="대표 진료 과목" hint="복수 선택" selected={a.subjects} options={SUBJECT_OPTIONS} onToggle={(v) => toggleArr('subjects', v)} />
        <MultiSelect label="주 타겟 연령대" hint="복수 선택" selected={a.target_age} options={AGE_OPTIONS} onToggle={(v) => toggleArr('target_age', v)} />
        <SubGroup>
          <SingleSelect label="임플란트 진료" value={a.do_implant} options={['함', '안 함']} onChange={(v) => set('do_implant', v)} />
          {a.do_implant === '함' && <>
            <MultiSelect label="사용 픽스처 브랜드" hint="복수 선택" selected={a.implant_brands} options={IMPLANT_BRANDS} onToggle={(v) => toggleArr('implant_brands', v)} />
            <SingleSelect label="수면 임플란트" value={a.implant_sedation} options={['가능', '불가']} onChange={(v) => set('implant_sedation', v)} />
          </>}
        </SubGroup>
        <SubGroup>
          <SingleSelect label="교정 진료" value={a.do_ortho} options={['함', '안 함']} onChange={(v) => set('do_ortho', v)} />
          {a.do_ortho === '함' && <MultiSelect label="교정 종류" hint="복수 선택" selected={a.ortho_types} options={ORTHO_TYPES} onToggle={(v) => toggleArr('ortho_types', v)} />}
        </SubGroup>
        <SubGroup>
          <SingleSelect label="소아치과 진료" value={a.do_pedo} options={['함', '안 함']} onChange={(v) => set('do_pedo', v)} />
          {a.do_pedo === '함' && <SingleSelect label="소아 수면·웃음가스" value={a.pedo_sedation} options={['가능', '불가']} onChange={(v) => set('pedo_sedation', v)} />}
        </SubGroup>
        <MultiSelect label="심미 치료 항목" hint="복수 선택" selected={a.esthetic_items} options={ESTHETIC_ITEMS} onToggle={(v) => toggleArr('esthetic_items', v)} />
        <MultiSelect label="일반진료 항목" hint="복수 선택" selected={a.general_items} options={GENERAL_ITEMS} onToggle={(v) => toggleArr('general_items', v)} />
        <SubGroup>
          <SingleSelect label="수면진료(진정요법)" value={a.sedation} options={['운영함', '운영 안 함']} onChange={(v) => set('sedation', v)} />
          {a.sedation === '운영함' && <MultiSelect label="수면진료 방식" hint="복수 선택" selected={a.sedation_types} options={SEDATION_TYPES} onToggle={(v) => toggleArr('sedation_types', v)} />}
        </SubGroup>
      </div>
    )},
    4: { icon: '🏗️', title: '시설·장비', desc: '병원 시설과 보유 장비를 선택해 주세요.', body: (
      <div className="space-y-6">
        <MultiSelect label="주요 의료 장비" hint="복수 선택" selected={a.equipment} options={EQUIPMENT_OPTIONS} onToggle={(v) => toggleArr('equipment', v)} />
        <SingleSelect label="원내 기공소" value={a.inhouse_lab} options={['운영함', '운영 안 함']} onChange={(v) => set('inhouse_lab', v)} />
        <MultiSelect label="편의시설" hint="복수 선택" selected={a.amenities} options={AMENITIES} onToggle={(v) => toggleArr('amenities', v)} />
        <TextField label="주차 안내" hint="(선택)" value={a.parking} onChange={(e) => set('parking', e.target.value)} placeholder="예) 건물 지하 20대 / 발렛" />
        <SingleSelect label="소아 전용 공간" value={a.kids_space} options={['있음', '없음']} onChange={(v) => set('kids_space', v)} />
        <TextField label="층별 진료 공간 구성" hint="(선택)" value={a.floors_desc} onChange={(e) => set('floors_desc', e.target.value)} placeholder="예) 2층 일반/3층 수술/4층 교정" />
      </div>
    )},
    5: { icon: '📸', title: '콘텐츠', desc: '홈페이지에 담을 콘텐츠 현황을 알려주세요.', body: (
      <div className="space-y-6">
        <SingleSelect label="비포/애프터 케이스 제공" value={a.before_after} options={['제공 가능', '일부 가능', '불가']} onChange={(v) => set('before_after', v)} />
        <SubGroup>
          <SingleSelect label="원장 컬럼·블로그" value={a.blog} options={['운영 중', '운영 예정', '없음']} onChange={(v) => set('blog', v)} />
          <TextField label="블로그 링크" hint="(선택)" value={a.blog_link} onChange={(e) => set('blog_link', e.target.value)} placeholder="https://blog.naver.com/..." />
        </SubGroup>
        <SubGroup>
          <SingleSelect label="유튜브·영상 콘텐츠" value={a.youtube} options={['있음', '없음', '제작 예정']} onChange={(v) => set('youtube', v)} />
          <TextField label="유튜브 채널 링크" hint="(선택)" value={a.youtube_link} onChange={(e) => set('youtube_link', e.target.value)} placeholder="https://youtube.com/..." />
        </SubGroup>
        <SingleSelect label="FAQ 제공 가능" value={a.faq} options={['가능', '불가']} onChange={(v) => set('faq', v)} />
        <MultiSelect label="환자 리뷰 채널" hint="복수 선택" selected={a.review_channels} options={REVIEW_CHANNELS} onToggle={(v) => toggleArr('review_channels', v)} />
      </div>
    )},
    6: { icon: '💳', title: '비용·예약·상담', desc: '비용 공개와 예약·상담 방식을 알려주세요.', body: (
      <div className="space-y-6">
        <SingleSelect label="비용 안내 공개 범위" value={a.price_disclosure} options={PRICE_OPTIONS} onChange={(v) => set('price_disclosure', v)} showUnknown={false} />
        <MultiSelect label="예약 채널" hint="복수 선택" selected={a.booking_channels} options={BOOKING_CHANNELS} onToggle={(v) => toggleArr('booking_channels', v)} />
        <TextField label="예약 링크" hint="(선택)" value={a.booking_links} onChange={(e) => set('booking_links', e.target.value)} placeholder="네이버 예약·카카오 채널 링크" />
        <MultiSelect label="상담 방식" hint="복수 선택" selected={a.consult_channels} options={CONSULT_CHANNELS} onToggle={(v) => toggleArr('consult_channels', v)} />
      </div>
    )},
    7: { icon: '🎨', title: '브랜드·디자인', desc: '홈페이지 디자인 방향을 선택해 주세요.', body: (
      <div className="space-y-6">
        <TextField label="브랜드 핵심 메시지·키워드" hint="(선택)" value={a.brand_keywords} onChange={(e) => set('brand_keywords', e.target.value)} placeholder="예) 정확함, 따뜻함, 첨단" />
        <TextField label="홈페이지 슬로건" hint="(선택)" value={a.slogan} onChange={(e) => set('slogan', e.target.value)} placeholder="예) 당신의 미소를 완성하는 치과" />
        <SubGroup>
          <SingleSelect label="로고·CI 보유" value={a.logo} options={['있음(제공 가능)', '없음(제작 필요)']} onChange={(v) => set('logo', v)} />
          <TextField label="브랜드 컬러" hint="(선택, 컬러코드)" value={a.logo_color} onChange={(e) => set('logo_color', e.target.value)} placeholder="예) #1a6b4a" />
        </SubGroup>
        <MultiSelect label="선호 톤앤매너" hint="복수 선택" selected={a.tone} options={TONE_OPTIONS} onToggle={(v) => toggleArr('tone', v)} />
        <TextArea label="참고 사이트" hint="(선택, 줄바꿈으로 여러 개)" value={a.refs} onChange={(e) => set('refs', e.target.value)} rows={2} placeholder="https://example.com" />
        <MultiSelect label="원하는 특별 기능" hint="복수 선택" selected={a.special_features} options={SPECIAL_FEATURES} onToggle={(v) => toggleArr('special_features', v)} />
        <SingleSelect label="원내 사진·영상 촬영" value={a.photo_shoot} options={['촬영 가능', '기존 사진 보유', '불가']} onChange={(v) => set('photo_shoot', v)} />
      </div>
    )},
    8: { icon: '📈', title: 'SEO·마케팅', desc: '검색 노출·마케팅 정보를 알려주세요.', body: (
      <div className="space-y-6">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <TextField label="1차 타겟 지역" hint="(선택)" value={a.target_area1} onChange={(e) => set('target_area1', e.target.value)} placeholder="예) 행복특별시 사랑동" />
          <TextField label="2차 타겟 지역" hint="(선택)" value={a.target_area2} onChange={(e) => set('target_area2', e.target.value)} placeholder="예) 기쁨시·소망시" />
        </div>
        <TextField label="핵심 타겟 키워드" hint="(선택, 쉼표로 구분)" value={a.keywords} onChange={(e) => set('keywords', e.target.value)} placeholder='예) 사랑동 임플란트, 기쁨시 교정' />
        <MultiSelectEtc label="현재 운영 중인 마케팅 채널" hint="복수 선택" selected={a.marketing_channels} options={MARKETING_CHANNELS} onToggle={(v) => toggleArr('marketing_channels', v)} etcValue={a.marketing_etc} onEtcChange={(v) => set('marketing_etc', v)} placeholder="예) 당근마켓, 지역 맘카페" />
        <SingleSelect label="오픈 후 운영·업데이트" value={a.ops_plan} options={['내부 직원 담당', '에이전시 위탁', '미정']} onChange={(v) => set('ops_plan', v)} />
      </div>
    )},
    9: { icon: '🔑', title: '계정·자료', desc: '이전 홈페이지 계정과 자료를 등록해 주세요. (선택)', body: (
      <div className="space-y-6">
        <div className="space-y-3">
          <p className="text-[15px] font-bold text-zinc-700">계정·접속 정보 <span className="text-[12px] font-normal text-zinc-400">(아는 항목만)</span></p>
          <CredBlock title="도메인 관리 계정" hint="가비아·카페24 등" data={a.creds.domain} onChange={(v) => setCred('domain', v)} />
          <CredBlock title="호스팅 계정" hint="카페24·아임웹 등" data={a.creds.hosting} onChange={(v) => setCred('hosting', v)} />
          <CredBlock title="기존 홈페이지 Admin" hint="관리자 페이지 접속 정보" data={a.creds.admin} onChange={(v) => setCred('admin', v)} urlField />
          <CredBlock title="FTP 접속 정보" hint="서버 파일 관리용" data={a.creds.ftp} onChange={(v) => setCred('ftp', v)} />
        </div>
        <TextArea label="추가 요청사항" hint="(선택)" value={a.memo} onChange={(e) => set('memo', e.target.value)} rows={3} placeholder="꼭 넣어야 할 메뉴·기능, 특이사항 등" />
        <div>
          <p className="mb-2 text-[15px] font-bold text-zinc-700">자료 업로드 <span className="text-[12px] font-normal text-zinc-400">(로고·사진·자료 등, 선택)</span></p>
          <label className="flex cursor-pointer items-center justify-center gap-2 rounded-xl border-2 border-dashed border-line bg-white py-6 text-[14px] font-semibold text-zinc-500 transition hover:border-accent hover:text-accent">
            <input type="file" multiple className="hidden" onChange={(e) => { const picked = Array.from(e.target.files || []); setFiles((prev) => [...prev, ...picked]); e.target.value = ''; }} />
            📎 파일 선택 (사진·로고·문서)
          </label>
          {files.length > 0 && (
            <ul className="mt-2 space-y-1.5">
              {files.map((f, i) => (
                <li key={i} className="flex items-center justify-between rounded-lg border border-line bg-white px-3 py-2 text-[13px]">
                  <span className="truncate text-zinc-700">📄 {f.name}</span>
                  <button type="button" onClick={() => setFiles((prev) => prev.filter((_, j) => j !== i))} className="ml-2 shrink-0 text-zinc-400 hover:text-red-500">✕</button>
                </li>
              ))}
            </ul>
          )}
          {upProg.length > 0 && (
            <ul className="mt-2 space-y-1.5">
              {upProg.map((p, i) => (
                <li key={i} className="flex items-center gap-3 text-[12px]">
                  <span className="min-w-0 flex-1 truncate font-semibold text-zinc-700">{p.name}</span>
                  {p.status === 'fail' ? (
                    <span className="shrink-0 font-bold text-red-500">실패</span>
                  ) : p.status === 'cancel' ? (
                    <span className="shrink-0 font-bold text-zinc-400">취소됨</span>
                  ) : (
                    <>
                      <span className="h-1.5 w-28 shrink-0 overflow-hidden rounded-full bg-zinc-100">
                        <span className="block h-full rounded-full bg-accent transition-all" style={{ width: `${p.pct}%` }} />
                      </span>
                      <span className="w-11 shrink-0 text-right font-bold text-zinc-500">
                        {p.status === 'done' ? '완료' : p.status === 'wait' ? '대기' : `${p.pct}%`}
                      </span>
                    </>
                  )}
                </li>
              ))}
            </ul>
          )}
          {submitting && upProg.some((p) => p.status === 'up' || p.status === 'wait') && (
            <button
              type="button"
              onClick={cancelUpload}
              className="mt-2 rounded-lg border border-red-200 bg-white px-3 py-1.5 text-[12px] font-bold text-red-500 transition hover:bg-red-50"
            >
              업로드 취소
            </button>
          )}
          {uploadMsg && <p className="mt-2 text-[12px] font-medium text-zinc-500">{uploadMsg}</p>}
          <p className="mt-2 text-[12px] text-zinc-400">제출 시 자료가 담당자 보관함에 자동 업로드됩니다. 대용량 파일(GB급)도 가능하며, 업로드가 끝날 때까지 화면을 닫지 말아 주세요.</p>
        </div>
      </div>
    )},
  };

  const cur = steps[step];
  const isLast = step === total;

  return (
    <div className="flex min-h-screen flex-col bg-base font-sans">
      <header className="sticky top-0 z-10 border-b border-line bg-white px-5 pt-4 pb-3">
        <div className="mb-2 flex items-center justify-between">
          <span className="text-[13px] font-bold text-zinc-500">{greetingName} 원장님</span>
          <span className="text-[13px] font-bold text-accent">{step} / {total}</span>
        </div>
        <div className="h-1.5 overflow-hidden rounded-full bg-zinc-100">
          <div className="h-full rounded-full bg-accent transition-all duration-300" style={{ width: `${(step / total) * 100}%` }} />
        </div>
      </header>

      <main className="flex-1 overflow-y-auto px-6 py-7">
        <div className="mx-auto max-w-lg transition-opacity duration-200 ease-out" style={{ opacity: visible ? 1 : 0 }}>
          <div className="flex items-start gap-3">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-accent-soft text-xl">{cur.icon}</span>
            <div>
              <h2 className="text-[20px] font-black text-offblack">{cur.title}</h2>
              <p className="mt-1 text-[14px] text-zinc-500">{cur.desc}</p>
            </div>
          </div>
          <div className="mt-7">{cur.body}</div>
          {error && <p className="mt-5 rounded-lg bg-red-50 px-4 py-3 text-[13px] font-medium text-red-600">{error}</p>}
        </div>
      </main>

      <footer className="sticky bottom-0 flex gap-3 border-t border-line bg-white/90 px-6 py-4 backdrop-blur">
        <button onClick={() => goStep(step - 1)} className="rounded-xl border border-line bg-white px-5 py-4 text-[15px] font-bold text-zinc-600 transition hover:bg-zinc-50">이전</button>
        {isLast ? (
          <button onClick={submit} disabled={submitting} className="flex-1 rounded-xl bg-accent py-4 text-[16px] font-bold text-white transition hover:bg-accent-hover disabled:opacity-50">{submitting ? '제출 중…' : '제출하기 ✓'}</button>
        ) : (
          <button onClick={() => goStep(step + 1)} className="flex-1 rounded-xl bg-accent py-4 text-[16px] font-bold text-white transition hover:bg-accent-hover">다음 →</button>
        )}
      </footer>
    </div>
  );
}