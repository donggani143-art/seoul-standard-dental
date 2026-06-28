import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { ensurePlatformSchema } from '@/lib/platform';
import { getCurrentHospital } from '@/lib/hospitalContext';
import { classifyReferrer, classifyDevice, lookupCountry, getClientIp } from '@/lib/analytics';

export async function POST(request) {
  try {
    const { path, referrer, sessionId } = await request.json();
    if (!path) return NextResponse.json({ ok: false }, { status: 400 });

    await ensurePlatformSchema();
    const hospital = await getCurrentHospital();
    const hospitalId = hospital?.hospitalId ?? null;
    if (!hospitalId) return NextResponse.json({ ok: true });

    const userAgent = request.headers.get('user-agent') || '';
    const ip = getClientIp(request);
    const host = request.headers.get('host') || '';

    const device = classifyDevice(userAgent);
    const referrerSource = classifyReferrer(referrer || '', host);

    const db = await getDb();

    // 국가 조회는 비동기로, 일단 빈 값으로 INSERT 후 업데이트
    const result = await db.run(
      'INSERT INTO page_views (hospital_id, path, referrer, referrer_source, user_agent, ip, country, device, session_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [hospitalId, path, referrer || '', referrerSource, userAgent, ip, '', device, sessionId || '']
    );

    // 비동기 국가 조회 후 업데이트
    if (ip) {
      lookupCountry(ip).then(country => {
        db.run('UPDATE page_views SET country = ? WHERE id = ?', [country, result.lastID]).catch(() => {});
      }).catch(() => {});
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }
}
