'use client';

import { useLayoutEffect, useRef, useState } from 'react';
import { useReducedMotion } from 'motion/react';

import { AppLink } from '@/components/ui/AppLink';

type OrderKind = 'all' | 'individual' | 'group';

type ProfileOrderKindTabsProps = {
  locale: string;
  kind: OrderKind;
  ariaLabel: string;
  labels: { all: string; individual: string; group: string };
};

type PillBox = { x: number; w: number };

const PILL_STORAGE_KEY = 'profile-order-kind-pill';

function ordersHref(locale: string, kind: OrderKind): string {
  return kind === 'all' ? `/${locale}/profile/orders` : `/${locale}/profile/orders?kind=${kind}`;
}

/** Segmented order filter. The outline slides between options, including after navigation. */
export function ProfileOrderKindTabs({ locale, kind, ariaLabel, labels }: ProfileOrderKindTabsProps) {
  const navRef = useRef<HTMLElement>(null);
  const reduceMotion = useReducedMotion() ?? false;
  const [pill, setPill] = useState<PillBox | null>(null);
  const [slide, setSlide] = useState(false);
  const tabs: Array<{ id: OrderKind; label: string }> = [
    { id: 'all', label: labels.all },
    { id: 'individual', label: labels.individual },
    { id: 'group', label: labels.group },
  ];

  useLayoutEffect(() => {
    const nav = navRef.current;
    const active = nav?.querySelector<HTMLElement>('[data-kind-active="true"]');
    if (!nav || !active) {
      return;
    }
    const next = { x: active.offsetLeft, w: active.offsetWidth };
    let previous: PillBox | null = null;
    try {
      const raw = sessionStorage.getItem(PILL_STORAGE_KEY);
      previous = raw ? (JSON.parse(raw) as PillBox) : null;
    } catch {
      previous = null;
    }
    sessionStorage.setItem(PILL_STORAGE_KEY, JSON.stringify(next));
    const moved =
      previous !== null && (previous.x !== next.x || previous.w !== next.w) && !reduceMotion;
    if (!moved) {
      setSlide(false);
      setPill(next);
      return;
    }
    setSlide(false);
    setPill(previous);
    const frame = requestAnimationFrame(() => {
      setSlide(true);
      setPill(next);
    });
    return () => cancelAnimationFrame(frame);
  }, [kind, reduceMotion]);

  return (
    <nav
      ref={navRef}
      aria-label={ariaLabel}
      className="relative flex w-full items-center justify-between gap-1 rounded-full border border-[#1e1e1e]/10 bg-white p-1 md:w-fit md:justify-start"
    >
      {pill ? (
        <span
          aria-hidden
          className={`pointer-events-none absolute top-1 bottom-1 left-0 rounded-full border border-[#ff6b00] ${
            slide
              ? 'transition-[transform,width] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none'
              : ''
          }`}
          style={{ width: pill.w, transform: `translateX(${pill.x}px)` }}
        />
      ) : null}
      {tabs.map((tab) => {
        const active = kind === tab.id;
        return (
          <AppLink
            key={tab.id}
            href={ordersHref(locale, tab.id)}
            prefetchPolicy="intent"
            aria-current={active ? 'page' : undefined}
            data-kind-active={active ? 'true' : undefined}
            className={`relative z-[1] shrink-0 rounded-full px-4 py-2 text-center text-sm font-semibold whitespace-nowrap transition-colors duration-300 ${
              active ? 'text-[#1e1e1e]' : 'text-[#1e1e1e]/45'
            }`}
          >
            {tab.label}
          </AppLink>
        );
      })}
    </nav>
  );
}
