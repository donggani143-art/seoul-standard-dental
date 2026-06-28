import { NextResponse } from 'next/server';
import { canAccessSuperAdmin, getAdminRequestSession } from '@/lib/adminAuth';
import { createActivityLog, createAdminAccount, listAdminAccounts } from '@/lib/platform';

export async function GET(request) {
  const session = getAdminRequestSession(request);

  if (!canAccessSuperAdmin(session)) {
    return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 });
  }

  try {
    const accounts = await listAdminAccounts();
    return NextResponse.json(accounts);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  const session = getAdminRequestSession(request);

  if (!canAccessSuperAdmin(session)) {
    return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 });
  }

  try {
    const payload = await request.json();
    const account = await createAdminAccount(payload);

    await createActivityLog({
      accountId: session.accountId,
      hospitalId: account.hospital_id,
      action: 'create',
      entityType: 'admin_account',
      entityId: account.id,
      afterJson: {
        id: account.id,
        email: account.email,
        display_name: account.display_name,
        role: account.role,
        hospital_id: account.hospital_id,
      },
      ipAddress: request.headers.get('x-forwarded-for') || '',
      userAgent: request.headers.get('user-agent') || '',
    });

    return NextResponse.json({
      success: true,
      account: {
        id: account.id,
        email: account.email,
        display_name: account.display_name,
        role: account.role,
        hospital_id: account.hospital_id,
        status: account.status,
      },
    });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
