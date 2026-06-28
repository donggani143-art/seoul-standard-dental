'use client';
import { usePathname } from 'next/navigation';
import { useState } from 'react';

const QUICK_CONSULT_PATHS = new Set(['/', '/about/hospital']);

export default function QuickConsult() {
  const pathname = usePathname();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  if (!QUICK_CONSULT_PATHS.has(pathname)) {
    return null;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    const formData = new FormData(e.target);
    const data = {
      category: formData.get('category'),
      name: formData.get('name'),
      phone: formData.get('phone'),
      email: formData.get('email'),
      agreed: formData.get('agreed') === 'on' ? 1 : 0
    };

    try {
      const res = await fetch('/api/consult', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if(res.ok) {
        setSuccess(true);
        e.target.reset();
        setTimeout(() => setSuccess(false), 5000);
      }
    } catch(e) {
      console.error(e);
      alert('신청 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="bg-offblack py-20 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
           <h2 className="text-4xl font-bold tracking-tight text-white mb-4">빠른 상담 신청</h2>
           <p className="text-white/70">정보를 남겨주시면 가장 빠른 시간 내에 전문 상담사가 연락을 드립니다.</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-3xl p-8 md:p-12 shadow-diffusion">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div className="flex flex-col gap-2">
              <label className="font-bold text-sm text-offblack">진료과목 선택</label>
              <select name="category" required className="border border-zinc-200 rounded-xl p-4 bg-zinc-50 focus:outline-accent outline-2">
                <option value="">진료과목을 선택해주세요</option>
                <option value="임플란트">임플란트</option>
                <option value="턱관절클리닉">턱관절클리닉</option>
                <option value="사랑니발치">사랑니 당일 매복발치</option>
                <option value="심미치료">하이엔드 심미치료</option>
                <option value="기타상담">기타 상담</option>
              </select>
            </div>
            <div className="flex flex-col gap-2">
              <label className="font-bold text-sm text-offblack">이름</label>
              <input type="text" name="name" required placeholder="홍길동" className="border border-zinc-200 rounded-xl p-4 bg-zinc-50 focus:outline-accent outline-2" />
            </div>
            <div className="flex flex-col gap-2">
              <label className="font-bold text-sm text-offblack">연락처</label>
              <input type="tel" name="phone" required placeholder="010-1234-5678" className="border border-zinc-200 rounded-xl p-4 bg-zinc-50 focus:outline-accent outline-2" />
            </div>
            <div className="flex flex-col gap-2">
              <label className="font-bold text-sm text-offblack">이메일 (선택)</label>
              <input type="email" name="email" placeholder="example@email.com" className="border border-zinc-200 rounded-xl p-4 bg-zinc-50 focus:outline-accent outline-2" />
            </div>
          </div>
          
          <div className="flex items-center gap-3 mb-8 bg-zinc-50 p-4 rounded-xl border border-zinc-200">
             <input type="checkbox" id="agreed" name="agreed" required className="w-5 h-5 accent-accent" />
             <label htmlFor="agreed" className="text-sm text-zinc-600">
               [필수] 개인정보 수집 및 취급방침에 동의하며 마케팅, 이벤트 수신에 동의합니다.
             </label>
          </div>

          <button 
             type="submit" 
             disabled={loading}
             className="w-full bg-accent hover:bg-orange-600 text-white font-bold py-5 rounded-2xl transition-colors disabled:opacity-50"
          >
            {loading ? '전송 중...' : '빠른 상담 신청하기'}
          </button>
          
          {success && (
             <div className="mt-4 text-center text-accent font-bold">상담 신청이 성공적으로 접수되었습니다.</div>
          )}
        </form>
      </div>
    </section>
  );
}
