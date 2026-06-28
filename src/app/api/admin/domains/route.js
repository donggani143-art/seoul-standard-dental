import { NextResponse } from 'next/server';
import { canAccessSuperAdmin, getAdminRequestSession } from '@/lib/adminAuth';
import { getDb } from '@/lib/db';
import {
  createActivityLog,
  createHospitalDomain,
  listHospitalDomains,
} from '@/lib/platform';

export async function GET(request) {
  const session = getAdminRequestSession(request);

  if (!session) {
    return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const requestedHospitalId = Number(searchParams.get('hospitalId') || 0) || null;
    const hospitalId = canAccessSuperAdmin(session)
      ? (requestedHospitalId ?? session.impersonateHospitalId ?? null)
      : session.hospitalId;
    const domains = await listHospitalDomains({ hospitalId });
    return NextResponse.json(domains);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  const session = getAdminRequestSession(request);

  if (!session) {
    return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 });
  }

  try {
    const payload = await request.json();
    const hospitalId = canAccessSuperAdmin(session)
      ? (Number(payload.hospitalId || 0) || session.impersonateHospitalId || null)
      : session.hospitalId;

    if (!hospitalId) {
      return NextResponse.json({ error: '업체 정보가 필요합니다.' }, { status: 400 });
    }

    const domain = await createHospitalDomain({
      hospitalId,
      domain: payload.domain,
      isPrimary: Boolean(payload.isPrimary),
    });

    await createActivityLog({
      accountId: session.accountId,
      hospitalId,
      action: 'create',
      entityType: 'hospital_domain',
      entityId: domain.id,
      afterJson: domain,
      ipAddress: request.headers.get('x-forwarded-for') || '',
      userAgent: request.headers.get('user-agent') || '',
    });

    return NextResponse.json({ success: true, domain });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}

export async function DELETE(request) {
  const session = getAdminRequestSession(request);

  if (!session) {
    return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');

  if (!id) {
    return NextResponse.json({ error: 'id가 필요합니다.' }, { status: 400 });
  }

  try {
    const db = await getDb();

    const hospitalClause = canAccessSuperAdmin(session) ? '' : 'AND hospital_id = ?';
    const params = canAccessSuperAdmin(session) ? [id] : [id, session.hospitalId];

    const result = await db.run(`DELETE FROM hospital_domains WHERE id = ? ${hospitalClause}`, params);

    await createActivityLog({
      accountId: session.accountId,
      hospitalId: session.hospitalId,
      action: 'delete',
      entityType: 'hospital_domain',
      entityId: id,
      ipAddress: request.headers.get('x-forwarded-for') || '',
      userAgent: request.headers.get('user-agent') || '',
    });

    return NextResponse.json({ success: true, changes: result.changes });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
