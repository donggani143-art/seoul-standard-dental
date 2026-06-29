'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import TranslateToggle from '@/components/TranslateToggle';

const text = {
  logo: '\uC11C\uC6B8\uC815\uC11D\uCE58\uACFC',
  implant: '\uC784\uD50C\uB780\uD2B8',
  sleep: '\uC218\uBA74\uCE58\uB8CC',
  wisdom: '\uC0AC\uB791\uB2C8\u00B7\uCDA9\uCE58',
  esthetics: '\uC2EC\uBBF8\uCE58\uB8CC',
  tmj: '\uD131\uAD00\uC808',
  general: '\uC77C\uBC18\uC9C4\uB8CC',
  location: '\uC624\uC2DC\uB294 \uAE38',
};

const menus = [
  { title: text.implant, href: '/implant' },
  { title: text.sleep, href: '/sleep-implant' },
  { title: text.wisdom, href: '/wisdom-cavity' },
  { title: text.esthetics, href: '/esthetics' },
  { title: text.tmj, href: '/tmj' },
  { title: text.general, href: '/general' },
  { title: text.location, href: '/#location' },
];

export default function Navigation() {
  const pathname = usePathname();

  return (
    <nav className="fixed top-0 z-50 w-full border-b border-zinc-200/60 bg-white/90 backdrop-blur-xl transition-all duration-300">
      <div className="mx-auto flex h-20 max-w-7xl items-center justify-between gap-6 px-4">
        <Link href="/" className="shrink-0 flex flex-col text-[18px] font-bold tracking-tight text-offblack leading-none">
          <span>{text.logo}</span>
          <small className="mt-1 text-[10px] font-semibold tracking-[0.24em] text-accent">SEOUL STANDARD</small>
        </Link>

        <div className="hidden flex-1 items-center justify-end gap-7 md:flex">
          {menus.map((menu) => {
            const isActive = menu.href !== '/#location' && pathname.startsWith(menu.href);
            return (
              <Link
                key={menu.href}
                href={menu.href}
                className={['text-[15px] font-semibold transition-colors', isActive ? 'text-accent' : 'text-offblack hover:text-accent'].join(' ')}
              >
                {menu.title}
              </Link>
            );
          })}
          <TranslateToggle />
        </div>
      </div>
    </nav>
  );
}
