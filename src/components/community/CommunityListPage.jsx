import Link from 'next/link';
import JsonLd from '@/components/JsonLd';
import PageTransition from '@/components/PageTransition';
import { getBoardHref } from '@/lib/boards';

function formatDate(value) {
  return new Date(value).toLocaleDateString('ko-KR');
}

export default function CommunityListPage({
  pageJsonLd,
  title,
  description,
  posts,
  emptyMessage,
  highlight = false,
}) {
  return (
    <main className="mx-auto min-h-[70vh] max-w-7xl px-4 pb-20 pt-40">
      {pageJsonLd && <JsonLd data={pageJsonLd} />}
      <PageTransition>
        <div className="max-w-3xl">
          <h1 className="mb-4 text-4xl font-black tracking-tighter text-offblack md:text-5xl">
            {highlight ? <span className="text-accent">{title}</span> : title}
          </h1>
          <p className="mb-12 text-base leading-relaxed text-zinc-500">{description}</p>
        </div>

        {posts.length === 0 ? (
          <div className="rounded-3xl border border-zinc-200 bg-zinc-50 p-12 text-center text-zinc-400">
            {emptyMessage}
          </div>
        ) : (
          <div className="overflow-hidden rounded-3xl border border-zinc-200 bg-white shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
            <div className="grid grid-cols-12 border-b border-zinc-200 bg-zinc-50 p-6 text-sm font-bold text-zinc-600">
              <div className="col-span-2 text-center md:col-span-1">번호</div>
              <div className="col-span-10 md:col-span-8">제목</div>
              <div className="hidden col-span-3 text-center md:block">등록일</div>
            </div>

            {posts.map((item, index) => (
              <Link
                key={item.id}
                href={getBoardHref(item)}
                className="group grid cursor-pointer grid-cols-12 border-b border-zinc-100 p-6 transition-colors hover:bg-zinc-50/50"
              >
                <div className="col-span-2 text-center text-zinc-400 md:col-span-1">
                  {posts.length - index}
                </div>
                <div className="col-span-10 truncate font-medium text-offblack transition-colors group-hover:text-accent md:col-span-8">
                  {item.title}
                </div>
                <div className="hidden col-span-3 text-center text-sm text-zinc-400 md:block">
                  {formatDate(item.created_at)}
                </div>
              </Link>
            ))}
          </div>
        )}
      </PageTransition>
    </main>
  );
}
