import { NextResponse } from 'next/server';
import { requireSalesAuth, assertOwnedProspect } from '@/lib/salesAuth';
import { listProspectShareTokens, createShareToken, revokeShareToken } from '@/lib/salesShare';

// GET — 해당 거래처의 공유 토큰 목록
export async function GET(request, { params }) {
  const auth = requireSalesAuth(request);
  if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status });
  const { id } = await params;
  const pid = Number(id);
  if (!Number.isFinite(pid)) return NextResponse.json({ error: 'id 오류' }, { status: 400 });
  const guard = await assertOwnedProspect(auth.session, pid);
  if (guard.error) return NextResponse.json({ error: guard.error }, { status: guard.status });
  try {
    const rows = await listProspectShareTokens(pid);
    return NextResponse.json(rows);
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

// POST — 새 공유 토큰 발급 (body: { expires_in_days })
export async function POST(request, { params }) {
  const auth = requireSalesAuth(request);
  if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status });
  const { id } = await params;
  const pid = Number(id);
  if (!Number.isFinite(pid)) return NextResponse.json({ error: 'id 오류' }, { status: 400 });
  const guard = await assertOwnedProspect(auth.session, pid);
  if (guard.error) return NextResponse.json({ error: guard.error }, { status: guard.status });

  try {
    const body = await request.json().catch(() => ({}));
    const days = Number(body.expires_in_days);
    let expiresAt = null;
    if (Number.isFinite(days) && days > 0) {
      const d = new Date(Date.now() + days * 86400000);
      expiresAt = d.toISOString();
    }
    const token = await createShareToken({ prospectId: pid, createdByAccountId: auth.session.accountId, expiresAt });
    return NextResponse.json({ success: true, token, expires_at: expiresAt });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

// DELETE — body: { token } 폐기 (revoke)
export async function DELETE(request, { params }) {
  const auth = requireSalesAuth(request);
  if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status });
  const { id } = await params;
  const pid = Number(id);
  if (!Number.isFinite(pid)) return NextResponse.json({ error: 'id 오류' }, { status: 400 });
  const guard = await assertOwnedProspect(auth.session, pid);
  if (guard.error) return NextResponse.json({ error: guard.error }, { status: guard.status });

  try {
    const url = new URL(request.url);
    const token = url.searchParams.get('token') || '';
    if (!token) return NextResponse.json({ error: 'token 필요' }, { status: 400 });
    const changes = await revokeShareToken(token);
    return NextResponse.json({ success: true, changes });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
