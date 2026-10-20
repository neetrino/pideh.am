'use client';

import { useEffect, useState, type ReactNode } from 'react';

import { MOBILE_STOREFRONT_SHELL } from '@/components/layout/page-container';

/** Scroll distance over which the frosted bar eases fully in. */
const SCROLL_FADE_RANGE_PX = 88;

type MobileHeaderScrollShellProps = {
  children: ReactNode;
};

function easeOutCubic(progress: number): number {
  return 1 - (1 - progress) ** 3;
}

/**
 * Mobile-only sticky header. At the top of the page the bar is clear.
 * While scrolling, a frosted surface with a rounded bottom fades in,
 * the same way as the Kamancha storefront header.
 */
export function MobileHeaderScrollShell({ children }: MobileHeaderScrollShellProps) {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    let frame = 0;

    function readScroll(): void {
      frame = 0;
      const next = easeOutCubic(
        Math.min(1, Math.max(0, window.scrollY / SCROLL_FADE_RANGE_PX)),
      );
      setProgress((prev) => (Math.abs(prev - next) < 0.003 ? prev : next));
    }

    function onScroll(): void {
      if (frame !== 0) {
        return;
      }
      frame = window.requestAnimationFrame(readScroll);
    }

    readScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', onScroll);
      if (frame !== 0) {
        window.cancelAnimationFrame(frame);
      }
    };
  }, []);

  return (
    <div
      className={`${MOBILE_STOREFRONT_SHELL} mobile-storefront-header relative sticky top-0 z-[45] shrink-0 bg-transparent`}
      data-scrolled={progress > 0.02 ? 'true' : 'false'}
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 rounded-b-[28px] bg-[#ff6b00]"
        style={{ opacity: progress }}
      />
      <div className="relative z-10">{children}</div>
    </div>
  );
}
