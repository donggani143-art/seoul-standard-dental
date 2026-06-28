// 메모 삭제 — 작성자 본인 또는 super_admin
import { NextResponse } from 'next/server';
import { getAdminRequestSession, isAdminApiRequest } from '@/lib/adminAuth';
import { deleteBillingMemo, getBillingMemoById } from '@/lib/billing';

export async function DELETE(request, { params }) {
  if (!isAdminApiRequest(request)) {
    return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 });
  }
  const session = getAdminRequestSession(request);

  const resolved = await params;
  const memoId = Number(resolved.memoId || 0);
  if (!memoId) return NextResponse.json({ error: 'memoId가 필요합니다.' }, { status: 400 });

  try {
    const memo = await getBillingMemoById(memoId);
    if (!memo) return NextResponse.json({ error: '메모를 찾을 수 없습니다.' }, { status: 404 });

    const isOwner = memo.account_id === session.accountId;
    const isSuper = session.role === 'super_admin';
    if (!isOwner && !isSuper) {
      return NextResponse.json({ error: '삭제 권한이 없습니다.' }, { status: 403 });
    }

    const changes = await deleteBillingMemo({ memoId });
    return NextResponse.json({ success: true, changes });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
