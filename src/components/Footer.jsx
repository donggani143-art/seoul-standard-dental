import { getGeoSettings } from '@/lib/seo';

export default async function Footer() {
  const geo = await getGeoSettings();

  return (
    <footer className="bg-zinc-50 border-t border-zinc-200/50 mt-32 pt-20 pb-10">
      <div className="max-w-7xl mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 mb-16">
          <div>
            <h3 className="text-2xl font-bold tracking-tight text-offblack mb-4">원주치과</h3>
            <p className="text-zinc-500 max-w-[35ch] leading-relaxed">
              당신 치아의 평생 주치의로서 변치 않는 정직한 진료를 약속합니다.
            </p>
          </div>
          <div className="flex flex-col gap-2 text-sm text-zinc-500">
            <p><strong className="text-offblack">진료시간</strong> {geo?.opening_hours || '평일 09:30 - 18:30'}</p>
            <p><strong className="text-offblack">대표자명</strong> {geo?.representative || '김영욱'}</p>
            <p><strong className="text-offblack">의료기관명</strong> {geo?.clinic_name || '원주치과의원'}</p>
            <p><strong className="text-offblack">대표전화</strong> {geo?.telephone || '033-734-2875'}</p>
            <p><strong className="text-offblack">오시는길</strong> {geo?.address || '강원특별자치도 원주시 원주치과 (단계동)'}</p>
          </div>
        </div>
        <div className="text-center text-zinc-400 text-sm pt-8 border-t border-zinc-200">
          <p>&copy; {new Date().getFullYear()} 원주치과의원. All Rights Reserved.</p>
        </div>
      </div>
    </footer>
  );
}
