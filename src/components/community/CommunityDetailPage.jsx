import Link from 'next/link';
import PageTransition from '@/components/PageTransition';
import { sanitizeRichHtml } from '@/lib/html';

function formatDate(value) {
  return new Date(value).toLocaleDateString('ko-KR');
}

export default function CommunityDetailPage({
  boardLabel,
  title,
  content,
  createdAt,
  listHref,
  listLabel,
}) {
  return (
    <main className="mx-auto min-h-[70vh] max-w-5xl px-4 pb-20 pt-40">
      <PageTransition>
        <div className="rounded-[2rem] border border-zinc-200 bg-white shadow-diffusion">
          <div className="border-b border-zinc-200 p-8 md:p-10">
            <div className="mb-4 flex flex-wrap items-center gap-3">
              <span className="rounded-full bg-accent/10 px-3 py-1 text-xs font-black text-accent">
                {boardLabel}
              </span>
              <span className="text-sm font-semibold text-zinc-400">{formatDate(createdAt)}</span>
            </div>
            <h1 className="text-3xl font-black tracking-tight text-offblack md:text-5xl">{title}</h1>
          </div>

          <article className="p-8 md:p-10">
            <div
              className="board-html max-w-none text-base leading-8 text-zinc-700"
              dangerouslySetInnerHTML={{ __html: sanitizeRichHtml(content) }}
            />
          </article>
        </div>

        <div className="mt-8 flex justify-end">
          <Link
            href={listHref}
            className="inline-flex items-center rounded-lg border border-zinc-300 px-5 py-3 text-sm font-bold text-zinc-700 transition-colors hover:border-accent hover:text-accent"
          >
            {listLabel}
          </Link>
        </div>
      </PageTransition>
    </main>
  );
}
