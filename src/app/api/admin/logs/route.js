import { NextResponse } from 'next/server';
import { canAccessSuperAdmin, getAdminRequestSession } from '@/lib/adminAuth';
import { listActivityLogs } from '@/lib/platform';

export async function GET(request) {
  const session = getAdminRequestSession(request);

  if (!canAccessSuperAdmin(session)) {
    return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const limit = Math.min(Number(searchParams.get('limit') || 50), 200);
    const logs = await listActivityLogs({ limit });
    return NextResponse.json(logs);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
