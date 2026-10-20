'use client';

import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useMemo, useRef, useState, type FormEvent } from 'react';

import { AppLink } from '@/components/ui/AppLink';
import { GroupOrderBannerSlot } from '@/features/group-orders/ui/GroupOrderBannerSlot';
import {
  MobileCategoryOrbit,
  mobileActiveCategoryTitle,
} from '@/features/home/ui/mobile/MobileCategoryOrbit';
import { MOBILE_HOME_ASSETS } from '@/features/home/ui/mobile/mobile-assets';
import { buildMobileOrbitCategories } from '@/features/home/ui/mobile/mobile-orbit-categories';
import { useOrbitSwipe } from '@/features/home/ui/mobile/use-orbit-swipe';
import { catalogHref } from '@/features/products/application/catalog-search-params';
import { DEFAULT_CATALOG_PAGE_SIZE, DEFAULT_CATALOG_SORT } from '@/features/products/schemas/catalog-list';
import type { Locale } from '@/lib/i18n/config';

type CategoryItem = {
  id: string;
  title: string;
  href: string;
  slug?: string;
  imageUrl: string | null;
};

type MobileHomeHeroProps = {
  locale: Locale;
  searchLabel: string;
  pideLabel: string;
  /** Fallback titles for the 5 Figma arc slots (drink → sauce). */
  arcTitles: readonly string[];
  categories: readonly CategoryItem[];
  prevLabel: string;
  nextLabel: string;
  titleLine1: string;
  titleLine2: string;
  viewAllHref: string;
  viewAllLabel: string;
};

function activeCategoryLabelClass(label: string): string {
  const length = label.trim().length;
  if (length > 8) {
    return 'text-[10px] leading-[11px] tracking-[-0.04em]';
  }
  if (length > 5) {
    return 'text-[11px] leading-[13px] tracking-[-0.03em]';
  }
  return 'text-[14px] leading-4';
}

/**
 * Search + circular category orbit + arrows + featured title/CTA (Figma 259:369).
 * Must sit inside MobileFrame440 (440px design space).
 */
export function MobileHomeHero({
  locale,
  searchLabel,
  pideLabel,
  arcTitles,
  categories,
  prevLabel,
  nextLabel,
  titleLine1,
  titleLine2,
  viewAllHref,
  viewAllLabel,
}: MobileHomeHeroProps) {
  const router = useRouter();
  const reduceMotion = useReducedMotion();
  const searchInputRef = useRef<HTMLInputElement>(null);
  const bannerSlotRef = useRef<HTMLDivElement>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const viewAllRef = useRef<HTMLDivElement>(null);
  const productsHref = `/${locale}/products`;
  const [searchQuery, setSearchQuery] = useState('');
  const [spin, setSpin] = useState(0);

  useEffect(() => {
    const slot = bannerSlotRef.current;
    const heading = headingRef.current;
    const viewAll = viewAllRef.current;
    if (!slot || !heading || !viewAll) return;

    const headingTop = 432;
    const viewAllTop = 505;
    const bannerTop = 440;
    const gap = 16;

    function apply(): void {
      const card = slot?.firstElementChild;
      const bannerHeight =
        card instanceof HTMLElement ? card.offsetHeight : (slot?.offsetHeight ?? 0);
      const shift = bannerHeight > 0 ? bannerHeight + gap + (bannerTop - headingTop) : 0;
      heading?.style.setProperty('top', `${headingTop + shift}px`);
      viewAll?.style.setProperty('top', `${viewAllTop + shift}px`);

      const spacer = slot?.closest('[data-mobile-frame]')?.querySelector<HTMLElement>(
        '[data-mobile-frame-spacer]',
      );
      if (!spacer) return;
      const base = Number(spacer.dataset.frameHeight);
      if (!Number.isFinite(base) || base <= 0) return;
      const scale = spacer.clientWidth / 440;
      spacer.style.height = `${(base + shift) * (scale > 0 ? scale : 1)}px`;
      const canvas = spacer.firstElementChild;
      if (canvas instanceof HTMLElement) {
        canvas.style.height = `${base + shift}px`;
      }
    }

    apply();
    const resizeObserver = new ResizeObserver(apply);
    resizeObserver.observe(slot);
    const mutationObserver = new MutationObserver(() => {
      apply();
      const card = slot.firstElementChild;
      if (card instanceof HTMLElement) resizeObserver.observe(card);
    });
    mutationObserver.observe(slot, { childList: true, subtree: true });
    window.addEventListener('resize', apply);
    return () => {
      resizeObserver.disconnect();
      mutationObserver.disconnect();
      window.removeEventListener('resize', apply);
    };
  }, []);

  const orbitCategories = useMemo(
    () => buildMobileOrbitCategories(categories, arcTitles, pideLabel, productsHref),
    [arcTitles, categories, pideLabel, productsHref],
  );

  const step = useCallback((delta: number) => {
    setSpin((current) => current + delta);
  }, []);

  const { handlers: orbitSwipeHandlers } = useOrbitSwipe(step);

  const activeLabel = mobileActiveCategoryTitle(spin, orbitCategories);

  function handleSearchSubmit(event: FormEvent<HTMLFormElement>): void {
    event.preventDefault();
    const trimmed = searchQuery.trim();
    router.push(
      catalogHref(locale, {
        q: trimmed || undefined,
        sort: DEFAULT_CATALOG_SORT,
        page: 1,
        pageSize: DEFAULT_CATALOG_PAGE_SIZE,
      }),
    );
  }

  return (
    <>
      {/* Search — 260:440 (inline input; Enter submits to catalog) */}
      <form
        role="search"
        onSubmit={handleSearchSubmit}
        className="absolute top-[150px] left-1/2 z-40 h-14 w-[286px] -translate-x-1/2 overflow-hidden rounded-[40px] bg-white"
        onClick={() => searchInputRef.current?.focus()}
      >
        <label htmlFor="mobile-home-search" className="sr-only">
          {searchLabel}
        </label>
        <span className="pointer-events-none absolute top-[9px] left-[9px] size-[39px]">
          <Image
            src={MOBILE_HOME_ASSETS.search}
            alt=""
            width={39}
            height={39}
            className="size-full"
          />
        </span>
        <input
          ref={searchInputRef}
          id="mobile-home-search"
          type="search"
          name="q"
          value={searchQuery}
          onChange={(event) => setSearchQuery(event.target.value)}
          placeholder={searchLabel}
          autoComplete="off"
          enterKeyHint="search"
          className="font-montserrat-arm size-full bg-transparent pr-5 pl-[54px] text-base leading-[21px] font-medium text-pideh-ink outline-none placeholder:text-[rgba(179,96,37,0.5)] [&::-webkit-search-cancel-button]:appearance-none"
        />
      </form>

      {/* Yellow highlight + active label (label stays inside the disc) */}
      <div
        data-node-id="260:466"
        className="pointer-events-none absolute top-[271px] left-[calc(50%-45px)] z-20 size-[90px] overflow-hidden rounded-full bg-[#ffd54a]"
      >
        <AnimatePresence mode="popLayout" initial={false}>
          <motion.p
            key={activeLabel}
            className={`absolute inset-x-2 bottom-[7px] z-40 overflow-hidden text-center font-medium text-ellipsis whitespace-nowrap text-[#ff6b00] ${activeCategoryLabelClass(activeLabel)}`}
            initial={reduceMotion ? false : { opacity: 0, y: -16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={reduceMotion ? undefined : { opacity: 0, y: 14 }}
            transition={{ duration: reduceMotion ? 0.12 : 0.65, ease: [0.22, 1, 0.36, 1] }}
          >
            {activeLabel}
          </motion.p>
        </AnimatePresence>
      </div>

      {/* Drag/swipe anywhere below search (arrows and view-all stay on top). */}
      <div
        aria-hidden
        className="absolute inset-x-0 top-[168px] z-[28] h-[420px] touch-pan-y"
        {...orbitSwipeHandlers}
      />

      <MobileCategoryOrbit
        spin={spin}
        productsHref={productsHref}
        categories={orbitCategories}
        swipeHandlers={orbitSwipeHandlers}
      />

      {/* Arrows — 260:379 */}
      <div className="absolute top-[384px] left-1/2 z-40 flex h-[47px] w-[108px] -translate-x-1/2 items-center gap-1.5">
        <button
          type="button"
          aria-label={prevLabel}
          className="relative size-[51px] touch-manipulation transition active:scale-95"
          onClick={() => step(-1)}
        >
          <Image
            src={MOBILE_HOME_ASSETS.arrowLeft}
            alt=""
            width={51}
            height={51}
            className="size-full rotate-180 -scale-y-100"
          />
        </button>
        <button
          type="button"
          aria-label={nextLabel}
          className="relative size-[51px] touch-manipulation transition active:scale-95"
          onClick={() => step(1)}
        >
          <Image
            src={MOBILE_HOME_ASSETS.arrowRight}
            alt=""
            width={51}
            height={51}
            className="size-full"
          />
        </button>
      </div>

      <GroupOrderBannerSlot
        ref={bannerSlotRef}
        className="absolute top-[440px] left-4 z-50 w-[408px]"
      />

      {/* Featured title — 260:492 */}
      <h2
        ref={headingRef}
        className="font-display absolute top-[432px] left-[calc(50%-203px)] z-20 h-[130px] w-[290px] text-[50px] leading-[0.84] text-white"
      >
        <span className="mb-0 block">{titleLine1}</span>
        <span className="block">{titleLine2}</span>
      </h2>

      {/* View-all — 260:548 */}
      <div ref={viewAllRef} className="absolute top-[505px] left-[358px] z-40">
        <AppLink
          href={viewAllHref}
          prefetchPolicy="intent"
          aria-label={viewAllLabel}
          className="flex items-center gap-1 overflow-hidden rounded-[42px] bg-[#ffd54a] px-6 py-4"
        >
          <Image
            src={MOBILE_HOME_ASSETS.viewAllArrow}
            alt=""
            width={20}
            height={20}
            className="size-5"
          />
        </AppLink>
      </div>
    </>
  );
}
