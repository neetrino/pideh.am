'use client';

import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import { useRef, useState, type FormEvent } from 'react';

import { MOBILE_HOME_ASSETS } from '@/features/home/ui/mobile/mobile-assets';
import { catalogHref } from '@/features/products/application/catalog-search-params';
import {
  DEFAULT_CATALOG_PAGE_SIZE,
  DEFAULT_CATALOG_SORT,
} from '@/features/products/schemas/catalog-list';
import type { Locale } from '@/lib/i18n/config';

type MobileHeaderSearchProps = {
  locale: Locale;
  backLabel: string;
  searchLabel: string;
  searchPlaceholder: string;
};

/**
 * Figma 366:718 + 366:513 — back pill and rounded search field.
 * Submitting lands on the catalog filtered by the typed query.
 * The back pill is omitted on the home page.
 */
export function MobileHeaderSearch({
  locale,
  backLabel,
  searchLabel,
  searchPlaceholder,
}: MobileHeaderSearchProps) {
  const router = useRouter();
  const pathname = usePathname() ?? `/${locale}`;
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState('');
  const isHome = pathname === `/${locale}` || pathname === `/${locale}/`;
  const isMenu = pathname === `/${locale}/products`;
  const showBack = !isHome;

  if (!isHome && !isMenu) {
    return null;
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>): void {
    event.preventDefault();
    const trimmed = query.trim();
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
    <div className="flex items-center gap-2">
      {showBack ? (
        <button
          type="button"
          aria-label={backLabel}
          onClick={() => router.back()}
          className="flex h-[52px] shrink-0 items-center rounded-[42px] bg-[#ffd54a] px-6 transition active:scale-95"
        >
          <Image
            src={MOBILE_HOME_ASSETS.viewAllArrow}
            alt=""
            width={20}
            height={20}
            className="size-5 rotate-180"
          />
        </button>
      ) : null}

      <form
        role="search"
        onSubmit={handleSubmit}
        onClick={() => inputRef.current?.focus()}
        className="relative h-14 min-w-0 flex-1 overflow-hidden rounded-[40px] bg-white"
      >
        <label htmlFor="mobile-header-search" className="sr-only">
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
          ref={inputRef}
          id="mobile-header-search"
          type="search"
          name="q"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder={searchPlaceholder}
          autoComplete="off"
          enterKeyHint="search"
          className="font-montserrat-arm text-pideh-ink size-full bg-transparent pr-5 pl-[54px] text-base leading-[21px] font-medium outline-none placeholder:text-[rgba(179,96,37,0.5)] [&::-webkit-search-cancel-button]:appearance-none"
        />
      </form>
    </div>
  );
}
