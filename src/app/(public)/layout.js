import AnalyticsTracker from '@/components/AnalyticsTracker';
import DynamicHtml from '@/components/DynamicHtml';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import PageScript from '@/components/PageScript';
import Popup from '@/components/Popup';
import JsonLd from '@/components/JsonLd';
import { headers } from 'next/headers';
import { buildClinicJsonLd, buildMetadata, getGlobalSnippets } from '@/lib/seo';
import { getPageDesign } from '@/lib/pageDesign';
import { getCurrentHospital } from '@/lib/hospitalContext';
import { classifyAiBot, recordAiCrawl } from '@/lib/aiCrawl';

export async function generateMetadata() {
  return buildMetadata('home');
}

function RawHtmlSnippet({ html, name }) {
  if (!html?.trim()) return null;
  return (
    <div
      className="contents"
      data-global-snippet={name}
      suppressHydrationWarning
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}

export default async function PublicLayout({ children }) {
  // AI 봇 크롤링 통계 기록 (서버사이드, 베스트 에포트 — 봇 UA일 때만 동작)
  try {
    const hdrs = await headers();
    const ua = hdrs.get('user-agent') || '';
    if (classifyAiBot(ua)) {
      const aiHospital = await getCurrentHospital();
      await recordAiCrawl({
        hospitalId: aiHospital?.hospitalId ?? null,
        path: hdrs.get('x-pathname') || '',
        userAgent: ua,
        ip: (hdrs.get('x-forwarded-for') || '').split(',')[0].trim(),
      });
    }
  } catch {
    /* 통계 기록 실패는 무시 */
  }

  const [clinicJsonLd, snippets, headerDesign, footerDesign] = await Promise.all([
    buildClinicJsonLd(),
    getGlobalSnippets(),
    getPageDesign('_header'),
    getPageDesign('_footer'),
  ]);

  return (
    <>
      <RawHtmlSnippet name="header" html={snippets?.common_header} />
      <JsonLd data={clinicJsonLd} />
      <AnalyticsTracker />

      {/* 헤더: DB 콘텐츠가 있으면 DB, 없으면 React 컴포넌트 */}
      {headerDesign?.content ? (
        <>
          {headerDesign.custom_css && (
            <style dangerouslySetInnerHTML={{ __html: headerDesign.custom_css }} />
          )}
          <DynamicHtml html={headerDesign.content} />
          {headerDesign.custom_js && <PageScript js={headerDesign.custom_js} />}
        </>
      ) : (
        <Navigation />
      )}

      <Popup />
      <RawHtmlSnippet name="body" html={snippets?.common_body} />
      {children}

      {/* 푸터: DB 콘텐츠가 있으면 DB, 없으면 React 컴포넌트 */}
      {footerDesign?.content ? (
        <>
          {footerDesign.custom_css && (
            <style dangerouslySetInnerHTML={{ __html: footerDesign.custom_css }} />
          )}
          <DynamicHtml html={footerDesign.content} />
          {footerDesign.custom_js && <PageScript js={footerDesign.custom_js} />}
        </>
      ) : (
        <Footer />
      )}

      <RawHtmlSnippet name="footer" html={snippets?.common_footer} />
    </>
  );
}
