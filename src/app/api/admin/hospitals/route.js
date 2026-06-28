import { NextResponse } from 'next/server';
import { canAccessSuperAdmin, getAdminRequestSession } from '@/lib/adminAuth';
import { getDb } from '@/lib/db';
import { createActivityLog, createHospital, listHospitals } from '@/lib/platform';

export async function GET(request) {
  const session = getAdminRequestSession(request);

  if (!canAccessSuperAdmin(session)) {
    return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 });
  }

  try {
    const hospitals = await listHospitals();
    return NextResponse.json(hospitals);
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
    const hospital = await createHospital(payload);

    await createActivityLog({
      accountId: session.accountId,
      hospitalId: hospital.id,
      action: 'create',
      entityType: 'hospital',
      entityId: hospital.id,
      afterJson: hospital,
      ipAddress: request.headers.get('x-forwarded-for') || '',
      userAgent: request.headers.get('user-agent') || '',
    });

    return NextResponse.json({ success: true, hospital });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}

export async function PUT(request) {
  const session = getAdminRequestSession(request);
  if (!canAccessSuperAdmin(session)) {
    return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 });
  }

  try {
    const { id, name, slug, status, site_status } = await request.json();
    if (!id) return NextResponse.json({ error: 'id가 필요합니다.' }, { status: 400 });

    const db = await getDb();
    const normalizedSlug = String(slug || '').trim().toLowerCase().replace(/[^a-z0-9-]+/g, '-').replace(/^-+|-+$/g, '');

    // slug 중복 체크
    if (normalizedSlug) {
      const dup = await db.get('SELECT id FROM hospitals WHERE slug = ? AND id != ?', [normalizedSlug, id]);
      if (dup) return NextResponse.json({ error: '이미 사용 중인 슬러그입니다.' }, { status: 400 });
    }

    await db.run(
      `UPDATE hospitals SET
        name = COALESCE(?, name),
        slug = COALESCE(?, slug),
        status = COALESCE(?, status),
        site_status = COALESCE(?, site_status),
        updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [name?.trim() || null, normalizedSlug || null, status || null, site_status || null, id]
    );

    const hospital = await db.get('SELECT * FROM hospitals WHERE id = ?', [id]);

    await createActivityLog({
      accountId: session.accountId,
      hospitalId: id,
      action: 'update',
      entityType: 'hospital',
      entityId: id,
      afterJson: hospital,
      ipAddress: request.headers.get('x-forwarded-for') || '',
      userAgent: request.headers.get('user-agent') || '',
    });

    return NextResponse.json({ success: true, hospital });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request) {
  const session = getAdminRequestSession(request);
  if (!canAccessSuperAdmin(session)) {
    return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const id = Number(searchParams.get('id'));
  const cascade = searchParams.get('cascade') === '1';

  if (!id) return NextResponse.json({ error: 'id가 필요합니다.' }, { status: 400 });

  try {
    const db = await getDb();

    if (cascade) {
      // 병원의 모든 관련 데이터 삭제
      await db.exec('BEGIN');
      try {
        await db.run('DELETE FROM pages WHERE hospital_id = ?', [id]);
        await db.run('DELETE FROM boards WHERE hospital_id = ?', [id]);
        await db.run('DELETE FROM board_groups WHERE hospital_id = ?', [id]);
        await db.run('DELETE FROM consultations WHERE hospital_id = ?', [id]);
        await db.run('DELETE FROM popups WHERE hospital_id = ?', [id]);
        await db.run('DELETE FROM seo_settings WHERE hospital_id = ?', [id]);
        await db.run('DELETE FROM geo_settings WHERE hospital_id = ?', [id]);
        await db.run('DELETE FROM global_snippets WHERE hospital_id = ?', [id]);
        await db.run('DELETE FROM patients WHERE hospital_id = ?', [id]);
        await db.run('DELETE FROM hospital_domains WHERE hospital_id = ?', [id]);
        await db.run('DELETE FROM admin_accounts WHERE hospital_id = ?', [id]);
        await db.run('DELETE FROM hospitals WHERE id = ?', [id]);
        await db.exec('COMMIT');
      } catch (e) {
        await db.exec('ROLLBACK');
        throw e;
      }
    } else {
      // 관련 데이터 있는지 체크
      const [accounts, domains] = await Promise.all([
        db.get('SELECT COUNT(*) as c FROM admin_accounts WHERE hospital_id = ?', [id]),
        db.get('SELECT COUNT(*) as c FROM hospital_domains WHERE hospital_id = ?', [id]),
      ]);
      if (accounts.c > 0 || domains.c > 0) {
        return NextResponse.json({
          error: `연결된 계정 ${accounts.c}개, 도메인 ${domains.c}개가 있습니다. 전체 삭제하려면 cascade=1 옵션이 필요합니다.`,
        }, { status: 400 });
      }
      await db.run('DELETE FROM hospitals WHERE id = ?', [id]);
    }

    await createActivityLog({
      accountId: session.accountId,
      action: 'delete',
      entityType: 'hospital',
      entityId: id,
      ipAddress: request.headers.get('x-forwarded-for') || '',
      userAgent: request.headers.get('user-agent') || '',
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
