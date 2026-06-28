// 단일 청구 행 조회·삭제
import { NextResponse } from 'next/server';
import { getAdminRequestSession, isAdminApiRequest } from '@/lib/adminAuth';
import { deleteInvoice, getInvoiceById } from '@/lib/billing';

export async function GET(request, { params }) {
  if (!isAdminApiRequest(request)) {
    return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 });
  }
  const session = getAdminRequestSession(request);
  // 플랫폼 전체 집계 청구 — 슈퍼관리자 전용 (목록 GET 과 일관)
  if (session?.role !== 'super_admin') {
    return NextResponse.json({ error: '접근 권한이 없습니다.' }, { status: 403 });
  }

  const resolved = await params;
  const id = Number(resolved.id || 0);
  if (!id) return NextResponse.json({ error: 'id가 필요합니다.' }, { status: 400 });

  try {
    const invoice = await getInvoiceById(id);
    return NextResponse.json({ invoice });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  if (!isAdminApiRequest(request)) {
    return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 });
  }
  const session = getAdminRequestSession(request);
  if (session?.role !== 'super_admin') {
    return NextResponse.json({ error: '슈퍼관리자만 삭제할 수 있습니다.' }, { status: 403 });
  }

  const resolved = await params;
  const id = Number(resolved.id || 0);
  if (!id) return NextResponse.json({ error: 'id가 필요합니다.' }, { status: 400 });

  try {
    const changes = await deleteInvoice({ id });
    return NextResponse.json({ success: true, changes });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
