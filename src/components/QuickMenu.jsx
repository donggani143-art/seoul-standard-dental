'use client';
import { motion, useScroll, useSpring } from 'framer-motion';
import { 
  CalendarCheck, 
  ChatCircle, 
  CaretUp, 
  YoutubeLogo, 
  InstagramLogo, 
  Article
} from '@phosphor-icons/react';

export default function QuickMenu() {
  const { scrollYProgress } = useScroll();
  const scaleY = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001
  });

  const handleScrollTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const navItems = [
    {
      id: 'reservation',
      icon: <CalendarCheck weight="fill" size={24} />,
      label: '예약',
      href: 'https://booking.naver.com/booking/13/bizes/1002721',
      bg: 'bg-white',
      text: 'text-offblack'
    },
    {
      id: 'kakao',
      icon: <ChatCircle weight="fill" size={24} />,
      label: '카카오톡',
      href: 'https://pf.kakao.com/_xoeuqb',
      bg: 'bg-[#FEE500]',
      text: 'text-[#371D1E]'
    },
    {
      id: 'blog',
      icon: <Article weight="fill" size={24} />,
      label: '블로그',
      href: 'https://blog.naver.com/entourage?tab=1',
      bg: 'bg-white',
      text: 'text-offblack'
    },
    {
      id: 'youtube',
      icon: <YoutubeLogo weight="fill" size={24} />,
      label: '유튜브',
      href: 'https://www.youtube.com/@%EC%9B%90%EC%A3%BC%EC%B9%98%EA%B3%BCTVv',
      bg: 'bg-white',
      text: 'text-offblack'
    },
    {
      id: 'instagram',
      icon: <InstagramLogo weight="fill" size={24} />,
      label: '인스타',
      href: 'https://www.instagram.com/wonju_dental/',
      bg: 'bg-white',
      text: 'text-offblack'
    }
  ];

  return (
    <div className="fixed bottom-8 right-8 z-50 flex flex-col gap-3 items-end pointer-events-none">
       {/* Scroll Progress indication bar inside quick menu */}
       <div className="absolute right-0 h-full w-[2px] bg-zinc-200/50 -z-10 translate-x-[20px] rounded-full overflow-hidden">
          <motion.div className="w-full bg-accent origin-top" style={{ scaleY }} />
       </div>

       {navItems.map((item) => (
         <motion.a
           key={item.id}
           href={item.href}
           target="_blank"
           rel="noreferrer"
           whileHover={{ scale: 1.1, x: -5 }}
           whileTap={{ scale: 0.95 }}
           className={`pointer-events-auto flex items-center justify-center w-14 h-14 ${item.bg} ${item.text} rounded-full shadow-lg border border-zinc-100/50 transition-colors relative group`}
         >
           {item.icon}
           <span className="absolute right-full mr-4 px-3 py-1 bg-offblack text-white text-xs font-bold rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
             {item.label}
           </span>
         </motion.a>
       ))}

       {/* Top 버튼 */}
       <motion.button 
         onClick={handleScrollTop} 
         whileHover={{ scale: 1.1 }}
         className="pointer-events-auto flex items-center justify-center w-12 h-12 bg-white/80 backdrop-blur text-zinc-400 rounded-full hover:bg-white transition-all mt-4 border border-zinc-100 shadow-sm"
       >
          <CaretUp weight="bold" size={20} />
       </motion.button>
    </div>
  );
}
