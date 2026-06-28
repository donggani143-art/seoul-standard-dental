// 공개 일정 조회 API — 홈페이지 캘린더 스니펫이 호출. 인증 불필요(게시된 일정만).
import { NextResponse } from 'next/server';
import { getCurrentHospital } from '@/lib/hospitalContext';
import { listCalendarEvents } from '@/lib/calendar';

export const dynamic = 'force-dynamic';

function monthRange(month) {
  const m = /^(\d{4})-(\d{2})$/.exec(String(month || ''));
  if (!m) return null;
  const y = Number(m[1]);
  const mo = Number(m[2]);
  if (mo < 1 || mo > 12) return null;
  const last = new Date(y, mo, 0).getDate();
  const p2 = (n) => String(n).padStart(2, '0');
  return { from: `${y}-${p2(mo)}-01`, to: `${y}-${p2(mo)}-${p2(last)}` };
}

export async function GET(request) {
  const { searchParams } = new URL(request.url);

  // 병원 식별: 명시적 hospitalId 우선, 없으면 현재 호스트
  let hospitalId = null;
  const hid = searchParams.get('hospitalId');
  if (hid && Number.isInteger(Number(hid))) {
    hospitalId = Number(hid);
  } else {
    const hospital = await getCurrentHospital();
    hospitalId = hospital?.hospitalId ?? null;
  }
  if (!hospitalId) return NextResponse.json({ events: [] });

  let from = searchParams.get('from') || undefined;
  let to = searchParams.get('to') || undefined;
  const month = searchParams.get('month');
  if (month) {
    const r = monthRange(month);
    if (r) { from = r.from; to = r.to; }
  }

  try {
    const events = await listCalendarEvents({ hospitalId, from, to, includeUnpublished: false });
    return NextResponse.json({ events }, { headers: { 'Cache-Control': 'public, max-age=0, s-maxage=60' } });
  } catch (e) {
    return NextResponse.json({ events: [], error: e.message }, { status: 500 });
  }
}