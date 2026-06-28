// 관리자 일정 CRUD — 세션 인증 + 본인 병원 스코프(getScopedHospitalId).
import { NextResponse } from 'next/server';
import { getAdminRequestSession, getScopedHospitalId, isAdminApiRequest } from '@/lib/adminAuth';
import {
  createCalendarEvent, deleteCalendarEvent, listCalendarEvents, updateCalendarEvent,
} from '@/lib/calendar';

export const dynamic = 'force-dynamic';

function resolveHospital(request) {
  if (!isAdminApiRequest(request)) return { error: '인증이 필요합니다.', status: 401 };
  const session = getAdminRequestSession(request);
  const hospitalId = getScopedHospitalId(session);
  if (!hospitalId) return { error: '업체를 선택해 주세요.', status: 400 };
  return { hospitalId };
}

export async function GET(request) {
  const r = resolveHospital(request);
  if (r.error) return NextResponse.json({ error: r.error }, { status: r.status });
  const { searchParams } = new URL(request.url);
  const from = searchParams.get('from') || undefined;
  const to = searchParams.get('to') || undefined;
  try {
    const events = await listCalendarEvents({ hospitalId: r.hospitalId, from, to, includeUnpublished: true });
    return NextResponse.json({ events });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function POST(request) {
  const r = resolveHospital(request);
  if (r.error) return NextResponse.json({ error: r.error }, { status: r.status });
  try {
    const body = await request.json();
    const event = await createCalendarEvent(r.hospitalId, body);
    return NextResponse.json({ event });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 400 });
  }
}

export async function PUT(request) {
  const r = resolveHospital(request);
  if (r.error) return NextResponse.json({ error: r.error }, { status: r.status });
  try {
    const body = await request.json();
    const id = Number(body.id);
    if (!Number.isInteger(id)) return NextResponse.json({ error: '잘못된 ID' }, { status: 400 });
    const event = await updateCalendarEvent(id, r.hospitalId, body);
    if (!event) return NextResponse.json({ error: '일정을 찾을 수 없습니다.' }, { status: 404 });
    return NextResponse.json({ event });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 400 });
  }
}

export async function DELETE(request) {
  const r = resolveHospital(request);
  if (r.error) return NextResponse.json({ error: r.error }, { status: r.status });
  const { searchParams } = new URL(request.url);
  const id = Number(searchParams.get('id'));
  if (!Number.isInteger(id)) return NextResponse.json({ error: '잘못된 ID' }, { status: 400 });
  try {
    const ok = await deleteCalendarEvent(id, r.hospitalId);
    return NextResponse.json({ ok });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}