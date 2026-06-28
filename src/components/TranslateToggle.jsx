'use client';

import Script from 'next/script';
import { CaretDown, Check, GlobeHemisphereWest } from '@phosphor-icons/react';
import { useEffect, useRef, useState } from 'react';

const SOURCE_LANGUAGE = 'ko';
const LANGUAGES = [
  { code: 'ko', label: 'KO', name: '한국어' },
  { code: 'en', label: 'EN', name: 'English' },
  { code: 'ja', label: 'JP', name: '日本語' },
  { code: 'zh-CN', label: 'CN', name: '中文' },
];

function getCookieDomainCandidates(hostname) {
  const candidates = [hostname];
  const parts = hostname.split('.');

  if (parts.length >= 2) {
    candidates.push(`.${parts.slice(-2).join('.')}`);
  }

  return [...new Set(candidates)];
}

function readTranslateCookie() {
  if (typeof document === 'undefined') return SOURCE_LANGUAGE;

  const entry = document.cookie
    .split('; ')
    .find((cookie) => cookie.startsWith('googtrans='));

  if (!entry) return SOURCE_LANGUAGE;

  const [, value] = entry.split('=');
  const targetLanguage = decodeURIComponent(value || '').split('/').filter(Boolean)[1];
  return targetLanguage || SOURCE_LANGUAGE;
}

function writeTranslateCookie(targetLanguage) {
  if (typeof document === 'undefined') return;

  const cookieValue = `/ko/${targetLanguage}`;
  document.cookie = `googtrans=${cookieValue};path=/`;

  for (const domain of getCookieDomainCandidates(window.location.hostname)) {
    document.cookie = `googtrans=${cookieValue};path=/;domain=${domain}`;
  }
}

function clearTranslateCookie() {
  if (typeof document === 'undefined') return;

  const expires = 'Thu, 01 Jan 1970 00:00:00 GMT';
  document.cookie = `googtrans=;expires=${expires};path=/`;

  for (const domain of getCookieDomainCandidates(window.location.hostname)) {
    document.cookie = `googtrans=;expires=${expires};path=/;domain=${domain}`;
  }
}

function updateTranslateSelect(targetLanguage) {
  const select = document.querySelector('.goog-te-combo');

  if (!select) {
    return false;
  }

  select.value = targetLanguage === SOURCE_LANGUAGE ? '' : targetLanguage;
  select.dispatchEvent(new Event('change', { bubbles: true }));
  return true;
}

export default function TranslateToggle() {
  const [activeLanguage, setActiveLanguage] = useState(() => readTranslateCookie());
  const [isOpen, setIsOpen] = useState(false);
  const rootRef = useRef(null);
  const currentLanguage =
    LANGUAGES.find((language) => language.code === activeLanguage) || LANGUAGES[0];

  useEffect(() => {
    const handlePointerDown = (event) => {
      if (!rootRef.current?.contains(event.target)) {
        setIsOpen(false);
      }
    };

    const handleEscape = (event) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('keydown', handleEscape);

    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('keydown', handleEscape);
    };
  }, []);

  const handleLanguageClick = (targetLanguage) => {
    setIsOpen(false);

    if (targetLanguage === SOURCE_LANGUAGE) {
      clearTranslateCookie();
      setActiveLanguage(SOURCE_LANGUAGE);
      window.location.reload();
      return;
    }

    writeTranslateCookie(targetLanguage);
    setActiveLanguage(targetLanguage);

    if (!updateTranslateSelect(targetLanguage)) {
      globalThis.location.assign(
        `https://translate.google.com/translate?sl=${SOURCE_LANGUAGE}&tl=${targetLanguage}&u=${encodeURIComponent(window.location.href)}`
      );
    }
  };

  return (
    <div ref={rootRef} className="notranslate relative" translate="no">
      <div id="google_translate_element" className="sr-only" />
      <Script id="google-translate-init" strategy="afterInteractive">
        {`
          window.googleTranslateElementInit = function () {
            if (!window.google || !window.google.translate || !window.google.translate.TranslateElement) {
              return;
            }

            var target = document.getElementById('google_translate_element');

            if (!target || target.childElementCount > 0) {
              return;
            }

            new window.google.translate.TranslateElement(
              {
                pageLanguage: 'ko',
                includedLanguages: 'en,ja,zh-CN',
                autoDisplay: false
              },
              'google_translate_element'
            );
          };
        `}
      </Script>
      <Script
        id="google-translate-script"
        strategy="afterInteractive"
        src="https://translate.google.com/translate_a/element.js?cb=googleTranslateElementInit"
      />

      <button
        type="button"
        onClick={() => setIsOpen((current) => !current)}
        aria-expanded={isOpen}
        className={`
          inline-flex h-11 min-w-[104px] items-center justify-center gap-2 rounded-full border px-3.5 leading-none
          transition-all duration-300
          ${
            isOpen
              ? 'border-accent bg-white shadow-[0_12px_28px_rgba(30,58,95,0.1)]'
              : 'border-zinc-200 bg-white/92 hover:border-zinc-300'
          }
        `}
      >
        <span
          className={`
            flex h-6 w-6 shrink-0 items-center justify-center rounded-full transition-colors
            ${isOpen ? 'bg-accent text-white' : 'bg-zinc-100 text-offblack'}
          `}
        >
          <GlobeHemisphereWest size={13} weight="fill" />
        </span>
        <span className="block text-sm font-black leading-none tracking-[0.02em] text-offblack">
          {currentLanguage.label}
        </span>

        <CaretDown
          size={12}
          weight="bold"
          className={`shrink-0 text-zinc-400 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>

      <div
        className={`
          absolute left-1/2 top-full mt-3 w-[200px] origin-top overflow-hidden rounded-3xl border border-zinc-200 bg-white
          shadow-[0_22px_60px_rgba(30,58,95,0.14)] transition-all duration-300
          ${
            isOpen
              ? 'pointer-events-auto translate-x-[-50%] translate-y-0 opacity-100'
              : 'pointer-events-none translate-x-[-50%] -translate-y-3 opacity-0'
          }
        `}
      >
        <div className="border-b border-zinc-100 px-5 py-4">
          <p className="text-[10px] font-black uppercase tracking-[0.24em] text-zinc-400">
            Language
          </p>
          <p className="mt-1 text-sm font-medium text-zinc-500">
            원하는 언어를 선택하세요.
          </p>
        </div>

        <div className="p-2">
          {LANGUAGES.map((language) => {
            const isActive = activeLanguage === language.code;

            return (
              <button
                key={language.code}
                type="button"
                onClick={() => handleLanguageClick(language.code)}
                aria-pressed={isActive}
                className={`
                  flex w-full items-center justify-between rounded-2xl px-4 py-3 text-left transition-colors
                  ${isActive ? 'bg-accent/8 text-offblack' : 'text-zinc-500 hover:bg-zinc-50 hover:text-offblack'}
                `}
              >
                <span>
                  <span className="block text-sm font-black">{language.name}</span>
                  <span className="mt-0.5 block text-[11px] font-bold uppercase tracking-[0.18em] text-zinc-400">
                    {language.label}
                  </span>
                </span>

                <span
                  className={`
                    flex h-7 w-7 items-center justify-center rounded-full transition-colors
                    ${isActive ? 'bg-accent text-white' : 'bg-zinc-100 text-zinc-300'}
                  `}
                >
                  <Check size={14} weight="bold" />
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
