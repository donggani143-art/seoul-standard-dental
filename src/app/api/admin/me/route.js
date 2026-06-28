import { NextResponse } from 'next/server';
import {
  ADMIN_SESSION_COOKIE,
  createAdminSessionToken,
  getAdminCookieOptions,
  getAdminRequestSession,
} from '@/lib/adminAuth';
import { getDb } from '@/lib/db';
import { createPasswordHash, verifyPasswordHash } from '@/lib/platform';

export async function GET(request) {
  const session = getAdminRequestSession(request);
  if (!session) {
    return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 });
  }

  const db = await getDb();
  const account = await db.get(
    'SELECT id, email, display_name, role, hospital_id, status, last_login_at, created_at FROM admin_accounts WHERE id = ?',
    [session.accountId]
  );

  if (!account) {
    return NextResponse.json({ error: '계정을 찾을 수 없습니다.' }, { status: 404 });
  }

  return NextResponse.json({ account });
}

export async function PUT(request) {
  const session = getAdminRequestSession(request);
  if (!session) {
    return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 });
  }

  try {
    const { displayName, email, currentPassword, newPassword } = await request.json();
    const db = await getDb();

    const account = await db.get('SELECT * FROM admin_accounts WHERE id = ?', [session.accountId]);
    if (!account) {
      return NextResponse.json({ error: '계정을 찾을 수 없습니다.' }, { status: 404 });
    }

    // 비밀번호 변경 요청 시 현재 비밀번호 확인
    if (newPassword) {
      if (!currentPassword) {
        return NextResponse.json({ error: '현재 비밀번호를 입력해 주세요.' }, { status: 400 });
      }
      if (newPassword.length < 4) {
        return NextResponse.json({ error: '새 비밀번호는 4자 이상이어야 합니다.' }, { status: 400 });
      }
      if (!verifyPasswordHash(currentPassword, account.password_hash)) {
        return NextResponse.json({ error: '현재 비밀번호가 일치하지 않습니다.' }, { status: 401 });
      }
    }

    // 이메일 중복 체크 (변경 시)
    const newEmail = email?.trim().toLowerCase();
    if (newEmail && newEmail !== account.email) {
      const dup = await db.get(
        'SELECT id FROM admin_accounts WHERE email = ? AND id != ?',
        [newEmail, account.id]
      );
      if (dup) {
        return NextResponse.json({ error: '이미 사용 중인 이메일입니다.' }, { status: 409 });
      }
    }

    const updates = [];
    const params = [];
    if (displayName?.trim()) { updates.push('display_name = ?'); params.push(displayName.trim()); }
    if (newEmail) { updates.push('email = ?'); params.push(newEmail); }
    if (newPassword) { updates.push('password_hash = ?'); params.push(createPasswordHash(newPassword)); }

    if (updates.length === 0) {
      return NextResponse.json({ error: '변경할 내용이 없습니다.' }, { status: 400 });
    }

    updates.push('updated_at = CURRENT_TIMESTAMP');
    params.push(account.id);
    await db.run(`UPDATE admin_accounts SET ${updates.join(', ')} WHERE id = ?`, params);

    const updated = await db.get(
      'SELECT id, email, display_name, role, hospital_id, status FROM admin_accounts WHERE id = ?',
      [account.id]
    );

    // 세션 토큰 재발급 (이메일/이름 변경 반영)
    const response = NextResponse.json({ ok: true, account: updated });
    const token = createAdminSessionToken({
      ...updated,
      legacyCms: true,
    });
    response.cookies.set(ADMIN_SESSION_COOKIE, token, getAdminCookieOptions(request));
    return response;
  } catch (error) {
    return NextResponse.json({ error: error.message || '오류가 발생했습니다.' }, { status: 500 });
  }
}
