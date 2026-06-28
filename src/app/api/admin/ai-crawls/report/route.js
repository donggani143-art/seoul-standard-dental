// AI 크롤링 월간 PDF 리포트 — 슈퍼관리자 전용
import { getAdminRequestSession, isAdminApiRequest } from '@/lib/adminAuth';
import { getDb } from '@/lib/db';
import { ensurePlatformSchema } from '@/lib/platform';
import { buildAiCrawlReport, isValidMonth, monthLabelKo } from '@/lib/aiCrawlReport';
import { buildVisitorMonthlyReport } from '@/lib/visitorReport';
import { renderAiCrawlReportPdf } from '@/lib/aiCrawlPdf';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request) {
  if (!isAdminApiRequest(request)) {
    return Response.json({ error: '인증이 필요합니다.' }, { status: 401 });
  }
  const session = getAdminRequestSession(request);
  if (!session || session.role !== 'super_admin') {
    return Response.json({ error: '접근 권한이 없습니다.' }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const month = searchParams.get('month') || '';
  if (!isValidMonth(month)) {
    return Response.json({ error: '월 형식이 올바르지 않습니다. (YYYY-MM)' }, { status: 400 });
  }
  let hospitalId = null;
  const hid = searchParams.get('hospitalId');
  if (hid) {
    const n = Number(hid);
    if (!Number.isInteger(n) || n <= 0) {
      return Response.json({ error: '업체 ID가 올바르지 않습니다.' }, { status: 400 });
    }
    hospitalId = n;
  }

  try {
    await ensurePlatformSchema();
    const db = await getDb();

    if (hospitalId) {
      const exists = await db.get('SELECT id FROM hospitals WHERE id = ?', [hospitalId]);
      if (!exists) return Response.json({ error: '업체를 찾을 수 없습니다.' }, { status: 404 });
    }

    const report = await buildAiCrawlReport(db, { month, hospitalId });
    // 방문 통계(사람 방문자)를 같은 달 기준으로 붙여 통합 리포트로 만든다.
    try {
      report.visitor = await buildVisitorMonthlyReport(db, { month, hospitalId });
    } catch { report.visitor = null; }
    const pdf = await renderAiCrawlReportPdf(report);

    const scopePart = report.scope === 'hospital'
      ? (report.hospital?.slug || `h${hospitalId}`)
      : 'platform';
    const asciiName = `metalink-report-${month}-${scopePart}.pdf`;
    const koName = `통합리포트_AI크롤링·방문통계_${monthLabelKo(month)}_${report.scope === 'hospital' ? (report.hospital?.name || '') : '플랫폼전체'}.pdf`;
    const dispoStar = encodeURIComponent(koName);

    return new Response(Buffer.from(pdf), {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${asciiName}"; filename*=UTF-8''${dispoStar}`,
        'Cache-Control': 'private, no-store',
        'Content-Length': String(pdf.length),
      },
    });
  } catch (error) {
    return Response.json({ error: error.message || '리포트 생성 실패' }, { status: 500 });
  }
}