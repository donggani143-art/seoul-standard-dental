import { NextResponse } from 'next/server';
import { requireSalesAuth, assertOwnedProspect } from '@/lib/salesAuth';
import { getProspect, updateProspect, deleteProspect } from '@/lib/salesProspects';

export async function GET(request, { params }) {
  const auth = requireSalesAuth(request);
  if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status });
  const { session } = auth;
  const { id } = await params;
  const numId = Number(id);
  if (!Number.isFinite(numId)) return NextResponse.json({ error: 'id가 올바르지 않습니다.' }, { status: 400 });

  const guard = await assertOwnedProspect(session, numId);
  if (guard.error) return NextResponse.json({ error: guard.error }, { status: guard.status });

  try {
    const prospect = await getProspect(numId);
    return NextResponse.json(prospect);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PATCH(request, { params }) {
  const auth = requireSalesAuth(request);
  if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status });
  const { session } = auth;
  const { id } = await params;
  const numId = Number(id);
  if (!Number.isFinite(numId)) return NextResponse.json({ error: 'id가 올바르지 않습니다.' }, { status: 400 });

  const guard = await assertOwnedProspect(session, numId);
  if (guard.error) return NextResponse.json({ error: guard.error }, { status: guard.status });

  try {
    const body = await request.json();
    const result = await updateProspect(numId, body);
    return NextResponse.json({ success: true, ...result });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  const auth = requireSalesAuth(request);
  if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status });
  const { session } = auth;
  const { id } = await params;
  const numId = Number(id);
  if (!Number.isFinite(numId)) return NextResponse.json({ error: 'id가 올바르지 않습니다.' }, { status: 400 });

  const guard = await assertOwnedProspect(session, numId);
  if (guard.error) return NextResponse.json({ error: guard.error }, { status: guard.status });

  try {
    const result = await deleteProspect(numId);
    return NextResponse.json({ success: true, ...result });
  } catch (error) {
    const status = error.code === 'PROMOTED' ? 400 : 500;
    return NextResponse.json({ error: error.message, code: error.code }, { status });
  }
}
