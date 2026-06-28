'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { CaretDown } from '@phosphor-icons/react';
import TranslateToggle from '@/components/TranslateToggle';

const staticMenus = [
  {
    title: '원주치과 소개',
    href: '/about',
    subItems: [
      {
        name: '원장님 소개',
        path: '/about/doctor',
        desc: '진단과 설명을 직접 담당하는 대표원장 소개',
      },
      {
        name: '업체 소개',
        path: '/about/hospital',
        desc: '진료시간과 오시는 길, 업체 이용 안내',
      },
    ],
  },
  {
    title: '진료과목 소개',
    href: '/implant',
    subItems: [
      {
        name: '프리미엄 임플란트',
        path: '/implant',
        desc: '3D 진단과 보철 계획을 함께 보는 임플란트',
      },
      {
        name: '턱관절 클리닉',
        path: '/tmj',
        desc: '통증과 개구 제한을 함께 보는 TMJ 진료',
      },
      {
        name: '사랑니 · 충치치료',
        path: '/wisdom-cavity',
        desc: '발치와 보존 가능성을 함께 판단하는 진료',
      },
      {
        name: '심미치료',
        path: '/esthetics',
        desc: '치아 형태와 색 조화를 고려한 심미 진료',
      },
    ],
  },
];

function isPathActive(pathname, targetPath) {
  return pathname === targetPath || pathname.startsWith(`${targetPath}/`);
}

export default function Navigation() {
  const pathname = usePathname();
  const [activeDropdown, setActiveDropdown] = useState(null);
  const [boardGroups, setBoardGroups] = useState([]);

  useEffect(() => {
    let cancelled = false;

    fetch('/api/board-group')
      .then((response) => response.json())
      .then((data) => {
        if (!cancelled && Array.isArray(data)) {
          setBoardGroups(data);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setBoardGroups([]);
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const menuData = useMemo(() => {
    const communityItems = [
      {
        name: '공지사항',
        path: '/community/notice',
        desc: '업체 운영과 공지 소식을 확인하세요.',
      },
      {
        name: '이벤트',
        path: '/community/event',
        desc: '현재 진행 중인 혜택과 프로모션 안내',
      },
      ...boardGroups.map((group) => ({
        name: group.name,
        path: `/community/${group.slug}`,
        desc: group.description || `${group.name} 게시판으로 이동`,
      })),
    ];

    return [
      ...staticMenus,
      {
        title: '커뮤니티',
        href: '/community',
        subItems: communityItems,
      },
    ];
  }, [boardGroups]);

  return (
    <nav
      className="fixed top-0 z-50 w-full border-b border-zinc-200/60 bg-white/85 backdrop-blur-xl transition-all duration-300"
      onMouseLeave={() => setActiveDropdown(null)}
    >
      <div className="mx-auto flex h-20 max-w-7xl items-center justify-between gap-6 px-4">
        <Link href="/" className="shrink-0 flex items-center gap-1 text-[17px] font-bold tracking-tight text-offblack md:text-xl">
          <span>Wonju</span>
          <span className="text-accent">Dental</span>
          <span>Clinic</span>
        </Link>

        <div className="hidden flex-1 items-center justify-end gap-8 md:flex">
          {menuData.map((menu, index) => {
            const isActive = pathname.startsWith(menu.href);
            const activeClass = isActive
              ? 'font-bold text-accent'
              : 'font-medium text-offblack hover:text-accent';

            return (
              <div
                key={menu.title}
                className="group relative flex h-full cursor-pointer items-center"
                onMouseEnter={() => setActiveDropdown(index)}
              >
                <div className={`flex items-center gap-1 text-[15px] transition-colors ${activeClass}`}>
                  {menu.title}
                  <CaretDown
                    size={14}
                    weight="bold"
                    className={`transition-transform ${activeDropdown === index ? 'rotate-180' : ''}`}
                  />
                </div>

                <div
                  className={`absolute left-1/2 top-full w-[360px] -translate-x-1/2 origin-top rounded-2xl border border-zinc-200 bg-white p-4 shadow-xl transition-all duration-200 ${
                    activeDropdown === index
                      ? 'pointer-events-auto mt-2 scale-100 opacity-100'
                      : 'pointer-events-none mt-0 scale-95 opacity-0'
                  }`}
                >
                  <div className="flex flex-col gap-1">
                    {menu.subItems.map((subItem) => {
                      const isSubActive = isPathActive(pathname, subItem.path);

                      return (
                        <Link
                          key={subItem.path}
                          href={subItem.path}
                          className={`block rounded-xl p-4 transition-colors ${
                            isSubActive ? 'bg-accent/5' : 'hover:bg-zinc-50'
                          }`}
                        >
                          <div
                            className={`mb-1 font-bold ${
                              isSubActive ? 'text-accent' : 'text-offblack'
                            }`}
                          >
                            {subItem.name}
                          </div>
                          <div className="text-sm text-zinc-500">{subItem.desc}</div>
                        </Link>
                      );
                    })}
                  </div>
                </div>
              </div>
            );
          })}

          <div className="flex h-full items-center">
            <TranslateToggle />
          </div>
        </div>
      </div>
    </nav>
  );
}
