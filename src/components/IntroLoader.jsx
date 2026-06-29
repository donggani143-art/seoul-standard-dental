'use client';

import { motion, useReducedMotion } from 'framer-motion';
import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';

const INTRO_TEXT = '당신 치아의 평생 주치의';
const BRAND_TEXT = 'Seoul Standard Dental Clinic';

export default function IntroLoader() {
  const pathname = usePathname();
  const [typedText, setTypedText] = useState('');
  const [phase, setPhase] = useState('typing');
  const [isVisible, setIsVisible] = useState(true);
  const shouldReduceMotion = useReducedMotion();

  useEffect(() => {
    if (shouldReduceMotion) {
      const hideTimer = window.setTimeout(() => setIsVisible(false), 0);

      return () => window.clearTimeout(hideTimer);
    }

    let index = 0;
    const timeouts = [];
    const typeInterval = window.setInterval(() => {
      index += 1;
      setTypedText(INTRO_TEXT.slice(0, index));

      if (index >= INTRO_TEXT.length) {
        window.clearInterval(typeInterval);
        timeouts.push(window.setTimeout(() => setPhase('brand'), 900));
        timeouts.push(window.setTimeout(() => setPhase('move'), 2300));
        timeouts.push(window.setTimeout(() => setPhase('complete'), 3600));
        timeouts.push(window.setTimeout(() => setIsVisible(false), 4100));
      }
    }, 95);

    return () => {
      window.clearInterval(typeInterval);
      timeouts.forEach((timeoutId) => window.clearTimeout(timeoutId));
    };
  }, [shouldReduceMotion]);

  if (pathname !== '/' || !isVisible) {
    return null;
  }

  const showIntroText = phase === 'typing';
  const showBrandText = phase !== 'typing';
  const brandMoveTarget =
    phase === 'move' || phase === 'complete'
      ? {
          left: 'var(--intro-logo-left)',
          opacity: phase === 'complete' ? 0 : 1,
          scale: 0.56,
          top: '1.7rem',
          x: 0,
          y: 0,
        }
      : {
          left: '50%',
          opacity: showBrandText ? 1 : 0,
          scale: 1,
          top: '50%',
          x: '-50%',
          y: '-50%',
        };

  return (
    <motion.div
      aria-hidden={phase === 'complete'}
      className="fixed inset-0 z-[9999] flex items-center justify-center overflow-hidden bg-white text-offblack"
      initial={{ opacity: 1 }}
      animate={{ opacity: phase === 'complete' ? 0 : 1 }}
      transition={{ duration: 0.6, ease: 'easeOut' }}
      style={{
        '--intro-logo-left': 'max(1rem, calc((100vw - 80rem) / 2 + 1rem))',
      }}
    >
      <motion.div
        aria-live="polite"
        className="absolute left-1/2 top-1/2 w-[min(90vw,720px)] text-center"
        initial={{ opacity: 1, x: '-50%', y: '-50%' }}
        animate={{
          opacity: showIntroText ? 1 : 0,
          x: '-50%',
          y: showIntroText ? '-50%' : 'calc(-50% - 16px)',
        }}
        transition={{ duration: 0.7, ease: 'easeOut' }}
      >
        <span className="inline-flex min-h-[1.25em] items-center text-3xl font-semibold text-offblack md:text-5xl">
          {typedText}
          {showIntroText && (
            <motion.span
              aria-hidden="true"
              className="ml-1 h-[1em] w-px bg-accent"
              animate={{ opacity: [1, 0, 1] }}
              transition={{ duration: 1.1, repeat: Infinity, ease: 'linear' }}
            />
          )}
        </span>
      </motion.div>

      <motion.div
        aria-label={BRAND_TEXT}
        className="fixed left-1/2 top-1/2 origin-top-left whitespace-nowrap text-3xl font-bold tracking-tight text-offblack md:text-4xl"
        initial={{ opacity: 0, scale: 1, x: '-50%', y: '-50%' }}
        animate={brandMoveTarget}
        transition={{
          duration: phase === 'move' ? 1.25 : 0.7,
          ease: [0.22, 1, 0.36, 1],
        }}
      >
        <span>Seoul</span>
        <span className="text-accent"> Standard </span>
        <span>Dental Clinic</span>
      </motion.div>
    </motion.div>
  );
}
