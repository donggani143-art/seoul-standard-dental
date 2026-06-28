// AI 크롤링 · 방문 통계 통합 월간 리포트 PDF 렌더링 (pdf-lib + 페이퍼로지).
// 디자인: 진행바·KPI 카드·전월대비 배지·정돈된 차트로 깔끔하고 생동감 있게.
import fs from 'node:fs';
import path from 'node:path';
import { PDFDocument, PDFName, PDFString, rgb } from 'pdf-lib';
import fontkit from '@pdf-lib/fontkit';

// ── 폰트: 페이퍼로지(번들) 우선, 없으면 나눔(서버 apt) 폴백 ──
const CWD = process.cwd();
// 사이트 웹폰트와 동일한 정식 경로(public/fonts/paperlogy/)의 TTF 를 임베드한다.
const PAPERLOGY = (w) => [
  path.join(CWD, 'public', 'fonts', 'paperlogy', `Paperlogy-${w}.ttf`),
  path.join(CWD, '.next', 'standalone', 'public', 'fonts', 'paperlogy', `Paperlogy-${w}.ttf`),
];
const FONT_SETS = {
  regular: [process.env.KR_FONT_PATH, ...PAPERLOGY('4Regular'), '/usr/share/fonts/truetype/nanum/NanumGothic.ttf', '/usr/share/fonts/nanum/NanumGothic.ttf'],
  bold: [process.env.KR_FONT_BOLD_PATH, ...PAPERLOGY('7Bold'), '/usr/share/fonts/truetype/nanum/NanumGothicBold.ttf', '/usr/share/fonts/nanum/NanumGothicBold.ttf'],
  black: [...PAPERLOGY('9Black'), ...PAPERLOGY('7Bold'), '/usr/share/fonts/truetype/nanum/NanumGothicExtraBold.ttf', '/usr/share/fonts/truetype/nanum/NanumGothicBold.ttf'],
};
function readFirst(paths) {
  for (const p of paths) {
    try { if (p && fs.existsSync(p)) return fs.readFileSync(p); } catch { /* skip */ }
  }
  return null;
}

// ── 팔레트 (프리미엄·정돈된 톤) ──
const BRAND = rgb(0.89, 0.31, 0.27);  // METALINK · AI 액센트(코랄)
const VISIT = rgb(0.16, 0.45, 0.72);  // 방문 통계 액센트(블루)
const INK   = rgb(0.11, 0.13, 0.18);  // 제목
const BODY  = rgb(0.27, 0.30, 0.35);  // 본문
const SUB   = rgb(0.50, 0.53, 0.58);  // 보조
const FAINT = rgb(0.66, 0.69, 0.73);  // 흐림
const LINE  = rgb(0.90, 0.91, 0.93);  // 구분선
const TRACK = rgb(0.92, 0.93, 0.95);  // 진행바 트랙
const CARD  = rgb(0.975, 0.978, 0.985); // 카드 배경
const POS   = rgb(0.13, 0.55, 0.38);  // 증가(긍정)
const NEG   = rgb(0.83, 0.31, 0.28);  // 감소(주의)
const POSBG = rgb(0.90, 0.96, 0.93);
const NEGBG = rgb(0.99, 0.93, 0.92);
const FLATBG = rgb(0.94, 0.95, 0.96);

const A4 = [595.28, 841.89];
const MARGIN = 46;
const CONTENT_W = A4[0] - MARGIN * 2;

function fmt(n) { return Number(n || 0).toLocaleString('ko-KR'); }
function fmtDwell(s) {
  s = Number(s || 0);
  if (s <= 0) return '—';
  const m = Math.floor(s / 60), x = s % 60;
  return m > 0 ? `${m}분 ${x}초` : `${x}초`;
}
function pctOf(part, whole) { return whole ? Math.round((part / whole) * 1000) / 10 : 0; }
function momOf(c, p) { return p > 0 ? Math.round(((c - p) / p) * 1000) / 10 : null; }

// ── ctx / 페이지 ──
function makeCtx(doc, fonts) {
  const ctx = { doc, fonts, page: null, y: 0, w: A4[0], h: A4[1] };
  newPage(ctx);
  return ctx;
}
function newPage(ctx) {
  ctx.page = ctx.doc.addPage(A4);
  ctx.y = ctx.h - MARGIN;
}
function ensure(ctx, need) {
  if (ctx.y - need < MARGIN + 26) newPage(ctx);
}
function F(ctx, w) { return w === 'k' ? ctx.fonts.black : w === 'b' ? ctx.fonts.bold : ctx.fonts.regular; }

// 폭 말줄임
function clip(font, str, size, maxW) {
  let s = String(str ?? '');
  if (!maxW || font.widthOfTextAtSize(s, size) <= maxW) return s;
  while (s.length > 1 && font.widthOfTextAtSize(s + '…', size) > maxW) s = s.slice(0, -1);
  return s + '…';
}
// 절대 좌표 텍스트
function put(ctx, str, { x, y, size = 10, w = 'r', color = BODY, maxW }) {
  const font = F(ctx, w);
  ctx.page.drawText(clip(font, str, size, maxW), { x, y, size, font, color });
}
function putRight(ctx, str, { xRight, y, size = 10, w = 'r', color = BODY }) {
  const font = F(ctx, w);
  const s = String(str ?? '');
  ctx.page.drawText(s, { x: xRight - font.widthOfTextAtSize(s, size), y, size, font, color });
}
// 흐름(ctx.y) 텍스트
function text(ctx, str, opts = {}) { put(ctx, str, { ...opts, y: ctx.y }); }
function textRight(ctx, str, opts = {}) { putRight(ctx, str, { ...opts, y: ctx.y }); }
function hr(ctx, color = LINE, thickness = 0.7) {
  ctx.page.drawLine({ start: { x: MARGIN, y: ctx.y }, end: { x: ctx.w - MARGIN, y: ctx.y }, thickness, color });
}

// 클릭 가능한 링크(URI) 주석
function addLink(ctx, { x, y, w, h, url }) {
  try {
    const annot = ctx.doc.context.obj({
      Type: 'Annot', Subtype: 'Link', Rect: [x, y, x + w, y + h], Border: [0, 0, 0],
      A: { Type: 'Action', S: 'URI', URI: PDFString.of(url) },
    });
    const ref = ctx.doc.context.register(annot);
    let annots = ctx.page.node.Annots();
    if (!annots) { annots = ctx.doc.context.obj([]); ctx.page.node.set(PDFName.of('Annots'), annots); }
    annots.push(ref);
  } catch { /* 링크 실패는 무시 */ }
}

// 섹션 헤더 (번호 탭 + 제목)
function section(ctx, no, title, accent = BRAND) {
  ensure(ctx, 46);
  ctx.y -= 26;
  if (no == null) {
    ctx.page.drawRectangle({ x: MARGIN + 3, y: ctx.y, width: 10, height: 10, color: accent });
    put(ctx, title, { x: MARGIN + 24, y: ctx.y, size: 12.5, w: 'b', color: INK });
  } else {
    ctx.page.drawRectangle({ x: MARGIN, y: ctx.y - 3, width: 16, height: 16, color: accent });
    put(ctx, String(no), { x: MARGIN + 5.2, y: ctx.y + 1, size: 9.5, w: 'k', color: rgb(1, 1, 1) });
    put(ctx, title, { x: MARGIN + 24, y: ctx.y, size: 12.5, w: 'b', color: INK });
  }
  ctx.y -= 9;
  hr(ctx);
  ctx.y -= 2;
}

// 전월대비 배지
function momBadge(cur, prev) {
  const m = momOf(cur, prev);
  if (m === null) return { text: '신규', tone: 'flat' };
  return { text: `${m > 0 ? '▲' : m < 0 ? '▼' : ''} ${Math.abs(m)}%`, tone: m > 0 ? 'pos' : m < 0 ? 'neg' : 'flat' };
}
function drawBadge(ctx, badge, x, y, size = 8) {
  const col = badge.tone === 'pos' ? POS : badge.tone === 'neg' ? NEG : SUB;
  const bg = badge.tone === 'pos' ? POSBG : badge.tone === 'neg' ? NEGBG : FLATBG;
  const font = F(ctx, 'b');
  const tw = font.widthOfTextAtSize(badge.text, size);
  const pad = 5;
  ctx.page.drawRectangle({ x, y: y - 3, width: tw + pad * 2, height: size + 6, color: bg });
  ctx.page.drawText(badge.text, { x: x + pad, y, size, font, color: col });
  return tw + pad * 2;
}

// KPI 카드 (label · 큰 숫자 · 배지/보조)
function kpiCards(ctx, cards, accent = BRAND) {
  const n = cards.length;
  const gap = 11;
  const cw = (CONTENT_W - gap * (n - 1)) / n;
  const ch = 62;
  ensure(ctx, ch + 6);
  ctx.y -= ch;
  const top = ctx.y + ch;
  cards.forEach((c, i) => {
    const x = MARGIN + i * (cw + gap);
    ctx.page.drawRectangle({ x, y: ctx.y, width: cw, height: ch, color: CARD, borderColor: LINE, borderWidth: 0.8 });
    ctx.page.drawRectangle({ x, y: top - 3, width: cw, height: 3, color: c.accent || accent });
    put(ctx, c.label, { x: x + 11, y: top - 18, size: 8, w: 'b', color: SUB, maxW: cw - 20 });
    put(ctx, c.value, { x: x + 11, y: top - 40, size: c.value.length > 7 ? 15 : 18, w: 'k', color: INK, maxW: cw - 20 });
    if (c.badge) drawBadge(ctx, c.badge, x + 11, top - 54);
    else if (c.sub) put(ctx, c.sub, { x: x + 11, y: top - 53, size: 8, w: 'r', color: FAINT, maxW: cw - 20 });
  });
  ctx.y -= 4;
}

// 진행바 행 (label · 값/비중 · 트랙+채움)
function progressRow(ctx, { label, value, pct, color }) {
  ensure(ctx, 26);
  ctx.y -= 13;
  put(ctx, label, { x: MARGIN, y: ctx.y, size: 9.5, w: 'b', color: INK, maxW: CONTENT_W - 150 });
  putRight(ctx, value, { xRight: ctx.w - MARGIN, y: ctx.y, size: 9.5, w: 'b', color: BODY });
  ctx.y -= 8;
  const th = 5;
  ctx.page.drawRectangle({ x: MARGIN, y: ctx.y, width: CONTENT_W, height: th, color: TRACK });
  const fw = Math.max(2, Math.min(1, (pct || 0) / 100) * CONTENT_W);
  ctx.page.drawRectangle({ x: MARGIN, y: ctx.y, width: fw, height: th, color });
  ctx.y -= 5;
}

// 표: columns=[{label,x,w,align}], rows=[[cell..]] (cell: str | {v,w,color})
function table(ctx, columns, rows, { rowH = 19, accent = BRAND } = {}) {
  ensure(ctx, rowH + 8);
  ctx.y -= rowH;
  for (const c of columns) {
    if (c.align === 'right') putRight(ctx, c.label, { xRight: c.x + c.w, y: ctx.y, size: 8, w: 'b', color: SUB });
    else put(ctx, c.label, { x: c.x, y: ctx.y, size: 8, w: 'b', color: SUB, maxW: c.w });
  }
  ctx.y -= 5;
  hr(ctx);
  rows.forEach((row, i) => {
    ensure(ctx, rowH);
    ctx.y -= rowH;
    if (i % 2 === 1) ctx.page.drawRectangle({ x: MARGIN, y: ctx.y - 4.5, width: CONTENT_W, height: rowH, color: rgb(0.972, 0.975, 0.982) });
    columns.forEach((c, ci) => {
      const cell = row[ci];
      const obj = cell && typeof cell === 'object';
      const val = obj ? cell.v : cell;
      const w = (obj && cell.w) || 'r';
      const color = (obj && cell.color) || BODY;
      if (c.align === 'right') putRight(ctx, val, { xRight: c.x + c.w, y: ctx.y, size: 9.5, w, color });
      else put(ctx, val, { x: c.x, y: ctx.y, size: 9.5, w, color, maxW: c.w });
    });
  });
  ctx.y -= 7;
}

// 일별 바차트 (정돈 · 가이드라인 · 피크 라벨)
function barChart(ctx, daily, color = BRAND) {
  if (!daily.length) return;
  ensure(ctx, 96);
  const max = Math.max(...daily.map((d) => d.count), 1);
  const areaX = MARGIN, areaW = CONTENT_W;
  const top = ctx.y - 4, chartH = 60, baseY = top - chartH;
  // 50% 가이드라인
  ctx.page.drawLine({ start: { x: areaX, y: baseY + chartH / 2 }, end: { x: areaX + areaW, y: baseY + chartH / 2 }, thickness: 0.4, color: rgb(0.95, 0.95, 0.96), dashArray: [2, 3] });
  const gap = daily.length > 45 ? 1 : 2;
  const bw = Math.max(1.4, (areaW - gap * (daily.length - 1)) / daily.length);
  let peakI = 0;
  daily.forEach((d, i) => { if (d.count > daily[peakI].count) peakI = i; });
  const light = rgb(color.red + (1 - color.red) * 0.5, color.green + (1 - color.green) * 0.5, color.blue + (1 - color.blue) * 0.5);
  daily.forEach((d, i) => {
    const bh = Math.max(0.8, (d.count / max) * chartH);
    const x = areaX + i * (bw + gap);
    ctx.page.drawRectangle({ x, y: baseY, width: bw, height: bh, color: i === peakI ? color : light });
  });
  // 베이스라인
  ctx.page.drawLine({ start: { x: areaX, y: baseY }, end: { x: areaX + areaW, y: baseY }, thickness: 0.7, color: LINE });
  ctx.y = baseY - 12;
  put(ctx, daily[0].day.slice(5), { x: areaX, y: ctx.y, size: 7.5, w: 'r', color: FAINT });
  putRight(ctx, daily[daily.length - 1].day.slice(5), { xRight: areaX + areaW, y: ctx.y, size: 7.5, w: 'r', color: FAINT });
  const peakLbl = `최대 ${fmt(max)} (${daily[peakI].day.slice(5)})`;
  put(ctx, peakLbl, { x: areaX + areaW / 2 - F(ctx, 'b').widthOfTextAtSize(peakLbl, 7.5) / 2, y: ctx.y, size: 7.5, w: 'b', color });
  ctx.y -= 8;
}

/**
 * @param {object} report buildAiCrawlReport 결과(+report.visitor)
 * @returns {Promise<Uint8Array>}
 */
export async function renderAiCrawlReportPdf(report) {
  const regBuf = readFirst(FONT_SETS.regular);
  if (!regBuf) throw new Error('한글 폰트를 찾을 수 없습니다. (페이퍼로지 번들 또는 fonts-nanum 필요)');
  const boldBuf = readFirst(FONT_SETS.bold) || regBuf;
  const blackBuf = readFirst(FONT_SETS.black) || boldBuf;

  const doc = await PDFDocument.create();
  doc.registerFontkit(fontkit);
  // subset:false — 한글 글리프 누락 방지(폰트가 가벼워 용량 부담 적음)
  const fonts = {
    regular: await doc.embedFont(regBuf, { subset: false }),
    bold: await doc.embedFont(boldBuf, { subset: false }),
    black: await doc.embedFont(blackBuf, { subset: false }),
  };
  const ctx = makeCtx(doc, fonts);
  const isHospital = report.scope === 'hospital';
  const scopeLabel = isHospital ? (report.hospital?.name || `업체 #${report.hospital?.id}`) : '플랫폼 전체';
  const combined = !!report.visitor;

  // ── 헤더 ──
  ctx.page.drawRectangle({ x: 0, y: ctx.h - 6, width: ctx.w, height: 6, color: BRAND });
  put(ctx, 'METALINK', { x: MARGIN, y: ctx.y - 4, size: 10.5, w: 'k', color: BRAND });
  put(ctx, 'MONTHLY REPORT', { x: MARGIN + 78, y: ctx.y - 4, size: 8, w: 'b', color: FAINT });
  const genKst = kstStr(report.generatedAt);
  putRight(ctx, `생성 ${genKst} (KST)`, { xRight: ctx.w - MARGIN, y: ctx.y - 4, size: 8, w: 'r', color: FAINT });
  ctx.y -= 30;
  put(ctx, combined ? 'AI 크롤링 · 방문 통계 통합 리포트' : 'AI 크롤링 월간 리포트', { x: MARGIN, y: ctx.y, size: combined ? 19 : 22, w: 'k', color: INK });
  ctx.y -= 19;
  put(ctx, `${report.monthLabel}`, { x: MARGIN, y: ctx.y, size: 12, w: 'b', color: BRAND });
  put(ctx, scopeLabel, { x: MARGIN + F(ctx, 'b').widthOfTextAtSize(report.monthLabel, 12) + 10, y: ctx.y, size: 12, w: 'b', color: INK });
  // 병원 사이트 클릭 링크
  if (isHospital && report.hospital?.slug) {
    const url = `https://${report.hospital.slug}.metacms.kr`;
    const lbl = `${report.hospital.slug}.metacms.kr  ↗`;
    const lblW = F(ctx, 'b').widthOfTextAtSize(lbl, 9);
    putRight(ctx, lbl, { xRight: ctx.w - MARGIN, y: ctx.y, size: 9, w: 'b', color: VISIT });
    addLink(ctx, { x: ctx.w - MARGIN - lblW, y: ctx.y - 2, w: lblW, h: 13, url });
  }
  ctx.y -= 10;
  hr(ctx, INK, 1.2);

  // ════════ AI 크롤링 ════════
  ctx.y -= 18;
  sectionBand(ctx, 'AI 크롤링 · 봇 접근', BRAND);

  kpiCards(ctx, [
    { label: '총 봇 접근', value: fmt(report.total), badge: momBadge(report.total, report.prevTotal) },
    { label: 'AI (크롤러+실시간)', value: fmt(report.aiTotal), sub: `전체의 ${pctOf(report.aiTotal, report.total)}%` },
    { label: 'AI 크롤러', value: fmt(report.byKind.crawler), sub: '학습·색인' },
    { label: isHospital ? 'AI 실시간 답변' : '활성 업체', value: isHospital ? fmt(report.byKind.assistant) : fmt(report.hospitals.length), sub: isHospital ? '어시스턴트' : '기록 있는 업체' },
  ], BRAND);

  // 접근 종류별 — 진행바
  section(ctx, 1, '접근 종류별 구성', BRAND);
  const k = report.byKind;
  progressRow(ctx, { label: 'AI 크롤러 (학습·색인)', value: `${fmt(k.crawler)} · ${pctOf(k.crawler, report.total)}%`, pct: pctOf(k.crawler, report.total), color: BRAND });
  progressRow(ctx, { label: 'AI 실시간 답변 (어시스턴트)', value: `${fmt(k.assistant)} · ${pctOf(k.assistant, report.total)}%`, pct: pctOf(k.assistant, report.total), color: rgb(0.95, 0.55, 0.3) });
  progressRow(ctx, { label: '기타 봇 · 자동화 도구', value: `${fmt(k.other)} · ${pctOf(k.other, report.total)}%`, pct: pctOf(k.other, report.total), color: FAINT });

  // AI 제품별 — 진행바
  section(ctx, 2, 'AI 제품별 가시성  (어떤 AI가 사이트를 수집했나)', BRAND);
  if (report.byProduct.length === 0) {
    ctx.y -= 14; text(ctx, '기간 내 AI 제품 접근 기록 없음', { size: 9.5, w: 'r', color: SUB });
  } else {
    for (const p of report.byProduct) {
      progressRow(ctx, { label: p.label, value: `${fmt(p.count)} · AI 내 ${pctOf(p.count, report.aiTotal)}%`, pct: pctOf(p.count, report.aiTotal), color: BRAND });
    }
  }

  // 봇별 상세 — 표
  section(ctx, 3, '봇별 상세', BRAND);
  const topBots = report.byBot.slice(0, 14);
  if (topBots.length === 0) { ctx.y -= 14; text(ctx, '기록 없음', { size: 9.5, w: 'r', color: SUB }); }
  else table(ctx, [
    { label: '봇', x: MARGIN, w: 250 },
    { label: '분류', x: MARGIN + 258, w: 130 },
    { label: '건수', x: MARGIN + 388, w: CONTENT_W - 388, align: 'right' },
  ], topBots.map((b) => [{ v: b.bot, w: 'b' }, report.kindLabel[b.kind] || b.kind, fmt(b.count)]));

  // 업체별 순위(플랫폼)
  if (!isHospital) {
    section(ctx, 4, '업체별 AI 크롤링 순위', BRAND);
    if (report.hospitals.length === 0) { ctx.y -= 14; text(ctx, '기록 없음', { size: 9.5, w: 'r', color: SUB }); }
    else table(ctx, [
      { label: '업체', x: MARGIN, w: 200 },
      { label: '총 접근', x: MARGIN + 205, w: 70, align: 'right' },
      { label: 'AI', x: MARGIN + 280, w: 55, align: 'right' },
      { label: '주요 봇', x: MARGIN + 345, w: CONTENT_W - 345 },
    ], report.hospitals.slice(0, 28).map((h) => [
      { v: h.hospital_name, w: 'b' }, fmt(h.total), { v: fmt(h.ai_total), color: BRAND, w: 'b' },
      h.bots.slice(0, 3).map((b) => `${b.bot} ${b.count}`).join(', '),
    ]));
  }

  // 일별 추이
  section(ctx, isHospital ? 4 : 5, '일별 추이  (AI · 봇 접근)', BRAND);
  barChart(ctx, report.daily, BRAND);

  // ════════ 방문 통계 ════════
  if (report.visitor) visitorPart(ctx, report.visitor, isHospital);

  // ── 방법론 / 푸터 ──
  ensure(ctx, 76);
  ctx.y -= 16; hr(ctx);
  ctx.y -= 14;
  const notes = [
    'AI · 봇 통계는 서버사이드 User-Agent 기반 집계입니다(KST 달력 월, 사람 브라우저 제외). AI 크롤러는 종류별, 그 외 봇·자동화 도구는 「기타 봇」으로 분류됩니다.',
    '「AI 실시간 답변」은 ChatGPT-User · Claude-User 등 사용자 질문에 답하려 실시간 수집한 접근으로, AI 답변 노출 가능성과 직접 연관됩니다.',
    'AI가 답변에서 업체를 추천·언급한 횟수나 실제 사용자 질문은 외부에서 취득 불가하여 포함되지 않습니다.',
    ...(report.visitor ? ['방문 통계는 실제 방문자(사람) 페이지뷰 기준입니다. 체류시간은 세션 내 연속 페이지 간격 추정치(1초~30분), 검색어는 엔진이 노출한 경우만 표시됩니다.'] : []),
  ];
  for (const n of notes) {
    ensure(ctx, 13);
    put(ctx, '·', { x: MARGIN, y: ctx.y, size: 8, w: 'b', color: FAINT });
    put(ctx, n, { x: MARGIN + 8, y: ctx.y, size: 7.6, w: 'r', color: SUB, maxW: CONTENT_W - 8 });
    ctx.y -= 11.5;
  }

  // 페이지 번호 / 바닥글
  const pages = doc.getPages();
  pages.forEach((p, i) => {
    p.drawRectangle({ x: 0, y: 0, width: ctx.w, height: 22, color: rgb(0.985, 0.987, 0.99) });
    p.drawText(`METALINK · ${combined ? 'AI 크롤링 · 방문 통계 통합 리포트' : 'AI 크롤링 리포트'}`, { x: MARGIN, y: 8, size: 7.5, font: fonts.regular, color: FAINT });
    const pno = `${i + 1} / ${pages.length}`;
    p.drawText(pno, { x: ctx.w - MARGIN - fonts.bold.widthOfTextAtSize(pno, 7.5), y: 8, size: 7.5, font: fonts.bold, color: SUB });
  });

  return doc.save();
}

// 큰 구분 밴드(AI / 방문 통계)
function sectionBand(ctx, title, accent) {
  ensure(ctx, 30);
  ctx.page.drawRectangle({ x: MARGIN, y: ctx.y - 5, width: CONTENT_W, height: 22, color: accent });
  put(ctx, title, { x: MARGIN + 12, y: ctx.y + 1, size: 11.5, w: 'k', color: rgb(1, 1, 1) });
  ctx.y -= 24;
}

// 방문 통계 파트
function visitorPart(ctx, v, isHospital) {
  const cur = v.current || {}, prv = v.previous || {};
  const cd = cur.device || {}, pd = prv.device || {};
  const mobilePct = pctOf(cd.mobile, cur.pv);
  const pcPct = pctOf((cd.desktop || 0) + (cd.tablet || 0), cur.pv);

  ctx.y -= 20;
  sectionBand(ctx, '방문 통계 · 실제 방문자(사람)', VISIT);

  kpiCards(ctx, [
    { label: '페이지뷰 (PV)', value: fmt(cur.pv), badge: momBadge(cur.pv, prv.pv), accent: VISIT },
    { label: '방문자 (UV · 세션)', value: fmt(cur.uv), badge: momBadge(cur.uv, prv.uv), accent: VISIT },
    { label: '모바일 비중', value: `${mobilePct}%`, sub: `PC·태블릿 ${pcPct}%`, accent: VISIT },
    { label: '평균 체류시간', value: fmtDwell(cur.avgDwell), sub: `세션당 ${cur.pagesPerSession ?? 0}p · 이탈 ${cur.bounceRate ?? 0}%`, accent: VISIT },
  ], VISIT);

  // 전월 대비 요약 표
  section(ctx, null,'핵심 지표 · 전월 대비', VISIT);
  table(ctx, [
    { label: '지표', x: MARGIN, w: 170 },
    { label: '이번 달', x: MARGIN + 175, w: 95, align: 'right' },
    { label: '지난 달', x: MARGIN + 280, w: 95, align: 'right' },
    { label: '전월 대비', x: MARGIN + 385, w: CONTENT_W - 385, align: 'right' },
  ], [
    ['페이지뷰 (PV)', { v: fmt(cur.pv), w: 'b' }, fmt(prv.pv), momText(cur.pv, prv.pv)],
    ['방문자 (UV · 세션)', { v: fmt(cur.uv), w: 'b' }, fmt(prv.uv), momText(cur.uv, prv.uv)],
    ['모바일 비중', { v: `${mobilePct}%`, w: 'b' }, `${pctOf(pd.mobile, prv.pv)}%`, ''],
    ['평균 체류시간', { v: fmtDwell(cur.avgDwell), w: 'b' }, fmtDwell(prv.avgDwell), ''],
    ['세션당 페이지', { v: String(cur.pagesPerSession ?? 0), w: 'b' }, String(prv.pagesPerSession ?? 0), ''],
    ['이탈률', { v: `${cur.bounceRate ?? 0}%`, w: 'b' }, `${prv.bounceRate ?? 0}%`, ''],
  ]);

  // 디바이스 — 진행바
  if (cur.pv > 0) {
    section(ctx, null,'디바이스 구성', VISIT);
    progressRow(ctx, { label: '모바일', value: `${fmt(cd.mobile)} · ${mobilePct}%`, pct: mobilePct, color: VISIT });
    progressRow(ctx, { label: 'PC (데스크톱)', value: `${fmt(cd.desktop)} · ${pctOf(cd.desktop, cur.pv)}%`, pct: pctOf(cd.desktop, cur.pv), color: rgb(0.4, 0.6, 0.82) });
    if (cd.tablet) progressRow(ctx, { label: '태블릿', value: `${fmt(cd.tablet)} · ${pctOf(cd.tablet, cur.pv)}%`, pct: pctOf(cd.tablet, cur.pv), color: rgb(0.6, 0.72, 0.88) });
  }

  // 많이 본 페이지
  if (v.byPath?.length) {
    section(ctx, null,'많이 본 페이지', VISIT);
    const max = v.byPath[0]?.count || 1;
    for (const r of v.byPath.slice(0, 10)) {
      progressRow(ctx, { label: r.path, value: `${fmt(r.count)} · ${pctOf(r.count, cur.pv)}%`, pct: (r.count / max) * 100, color: VISIT });
    }
  }

  // 유입 소스
  if (v.bySource?.length) {
    section(ctx, null,'유입 소스  (검색 · 소셜 · 직접)', VISIT);
    const max = v.bySource[0]?.count || 1;
    for (const r of v.bySource.slice(0, 8)) {
      progressRow(ctx, { label: r.source || 'Direct', value: `${fmt(r.count)} · ${pctOf(r.count, cur.pv)}%`, pct: (r.count / max) * 100, color: VISIT });
    }
  }

  // 유입 검색어
  const kw = (v.topReferrers || []).filter((r) => r.keyword);
  if (kw.length) {
    section(ctx, null,'유입 검색어  (엔진이 노출한 경우)', VISIT);
    table(ctx, [
      { label: '검색어', x: MARGIN, w: 400 },
      { label: '유입수', x: MARGIN + 405, w: CONTENT_W - 405, align: 'right' },
    ], kw.slice(0, 10).map((r) => [{ v: r.keyword, w: 'b' }, fmt(r.count)]));
  }

  // 방문 일별 추이
  if (v.byDay?.length) {
    section(ctx, null,'방문 일별 추이 (PV)', VISIT);
    barChart(ctx, v.byDay.map((d) => ({ day: d.day, count: d.count })), VISIT);
  }
}

// 표 셀용 전월대비 텍스트
function momText(cur, prev) {
  const m = momOf(cur, prev);
  if (m === null) return { v: '신규', w: 'b', color: SUB };
  return { v: `${m > 0 ? '▲' : m < 0 ? '▼' : ''} ${Math.abs(m)}%`, w: 'b', color: m > 0 ? POS : m < 0 ? NEG : SUB };
}

// ISO(UTC) → KST 표시 문자열
function kstStr(iso) {
  try {
    const d = new Date(iso);
    const k = new Date(d.getTime() + 9 * 3600 * 1000);
    const p = (n) => String(n).padStart(2, '0');
    return `${k.getUTCFullYear()}-${p(k.getUTCMonth() + 1)}-${p(k.getUTCDate())} ${p(k.getUTCHours())}:${p(k.getUTCMinutes())}`;
  } catch { return String(iso || '').replace('T', ' ').slice(0, 16); }
}
