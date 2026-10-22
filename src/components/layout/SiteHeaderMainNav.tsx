'use client';

import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { useEffect, useLayoutEffect, useRef, useState } from 'react';

import { AccountControls } from '@/components/layout/AccountControls';
import { LocaleCurrencySwitcher } from '@/components/layout/LocaleCurrencySwitcher';
import { PAGE_CONTAINER } from '@/components/layout/page-container';
import { AppLink } from '@/components/ui/AppLink';
import { PIDEH_ASSETS } from '@/features/home/ui/brand-assets';
import { CartDrawer } from '@/features/cart/ui/CartDrawer';
import { GroupOrderHeaderButton } from '@/features/group-orders/ui/GroupOrderHeaderButton';
import { HeaderSearch } from '@/features/products/ui/HeaderSearch';
import { WishlistHeaderLink } from '@/features/wishlist/ui/WishlistHeaderLink';
import type { Dictionary } from '@/lib/i18n/get-dictionary';
import type { Locale } from '@/lib/i18n/config';
import type { Currency } from '@/lib/money/currency';
import type { SessionUser } from '@/lib/auth/session';

type NavItem = {
  href: string;
  label: string;
};

type SiteHeaderMainNavProps = {
  locale: Locale;
  currency: Currency;
  dictionary: Dictionary;
  user: SessionUser | null;
  navItems: readonly NavItem[];
  cartItemCount: number;
  wishlistCount: number;
};

function headerSearchLabels(header: Dictionary['header']): {
  open: string;
  close: string;
  placeholder: string;
  idle: string;
  empty: string;
  viewAll: string;
} {
  return {
    open: header.search,
    close: header.searchClose,
    placeholder: header.searchPlaceholder,
    idle: header.searchIdle,
    empty: header.searchEmpty,
    viewAll: header.searchViewAll,
  };
}

type PillRect = {
  left: number;
  width: number;
};

function measureActivePill(nav: HTMLElement): PillRect | null {
  const active = nav.querySelector<HTMLElement>('[data-nav-item][aria-current="page"]');
  if (!active) {
    return null;
  }

  return { left: active.offsetLeft, width: active.offsetWidth };
}

function isActiveHref(pathname: string, href: string): boolean {
  const path = pathname.replace(/\/$/, '') || '/';
  const target = href.replace(/\/$/, '') || '/';

  if (path === target) {
    return true;
  }

  const targetParts = target.split('/').filter(Boolean);
  if (targetParts.length === 1) {
    return false;
  }

  if (target.endsWith('/products') && path.includes('/products')) {
    return true;
  }

  return path.startsWith(`${target}/`);
}

export function SiteHeaderMainNav({
  locale,
  currency,
  dictionary,
  user,
  navItems,
  cartItemCount,
  wishlistCount,
}: SiteHeaderMainNavProps) {
  const pathname = usePathname();
  const searchLabels = headerSearchLabels(dictionary.header);
  const primaryNav = navItems.filter((item) => !item.href.endsWith('/cart'));
  const navRef = useRef<HTMLElement>(null);
  const [pill, setPill] = useState<PillRect | null>(null);
  const [motionReady, setMotionReady] = useState(false);

  useLayoutEffect(() => {
    const nav = navRef.current;
    if (!nav || motionReady) {
      return;
    }

    setPill(measureActivePill(nav));
  }, [motionReady, pathname]);

  useEffect(() => {
    const nav = navRef.current;
    if (!nav) {
      return;
    }

    const frame = requestAnimationFrame(() => {
      setMotionReady(true);
    });
    const observer = new ResizeObserver(() => {
      setPill(measureActivePill(nav));
    });
    observer.observe(nav);

    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
    };
  }, []);

  useEffect(() => {
    const nav = navRef.current;
    if (!nav || !motionReady) {
      return;
    }

    setPill(measureActivePill(nav));
  }, [motionReady, pathname]);

  return (
    <header className="relative z-40 pt-3 md:pt-3.5">
      <div className={PAGE_CONTAINER}>
        <div
          data-header-pill
          className="flex h-16 w-full items-center justify-between gap-3 rounded-[90px] bg-white px-4 shadow-[0_8px_30px_rgba(0,0,0,0.08)] sm:px-6 md:h-20 md:px-5"
        >
          <AppLink
            href={`/${locale}`}
            prefetchPolicy="intent"
            data-header-logo
            className="relative ml-2 h-12 w-[62px] shrink-0 md:ml-3 md:h-14 md:w-[72px]"
            aria-label={dictionary.brand}
            onClick={(event) => {
              if (pathname === `/${locale}`) {
                event.preventDefault();
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }
            }}
          >
            <Image
              src={PIDEH_ASSETS.wordmark}
              alt={dictionary.brand}
              fill
              sizes="72px"
              unoptimized
              className="object-contain"
              priority
            />
          </AppLink>

          <nav
            ref={navRef}
            aria-label="Primary"
            className="relative hidden flex-1 items-center justify-center gap-0.5 md:flex"
          >
            {pill ? (
              <span
                aria-hidden
                className={
                  motionReady
                    ? 'pointer-events-none absolute top-1/2 left-0 z-0 h-12 rounded-[72px] bg-[#ff6b00] transition-[transform,width] duration-300 ease-in-out motion-reduce:transition-none'
                    : 'pointer-events-none absolute top-1/2 left-0 z-0 h-12 rounded-[72px] bg-[#ff6b00]'
                }
                style={{ width: pill.width, transform: `translate(${pill.left}px, -50%)` }}
              />
            ) : null}
            {primaryNav.map((item) => {
              const active = isActiveHref(pathname, item.href);
              return (
                <AppLink
                  key={item.href}
                  href={item.href}
                  prefetchPolicy="intent"
                  data-nav-item
                  aria-current={active ? 'page' : undefined}
                  className={
                    active
                      ? 'relative z-10 inline-flex h-12 items-center rounded-[72px] px-3 text-base font-bold whitespace-nowrap text-white transition-colors duration-300 motion-reduce:transition-none'
                      : 'relative z-10 inline-flex h-12 items-center rounded-[72px] px-3 text-base font-bold whitespace-nowrap text-[#364153] transition-colors duration-300 hover:text-[#ff6b00] motion-reduce:transition-none'
                  }
                >
                  {item.label}
                </AppLink>
              );
            })}
          </nav>

          <div data-header-actions className="flex items-center gap-2">
            <GroupOrderHeaderButton
              locale={locale}
              labels={dictionary.groupOrder}
              defaultName={user ? [user.firstName, user.lastName].filter(Boolean).join(' ') : ''}
            />
            <div className="hidden items-center gap-2 md:flex">
              <LocaleCurrencySwitcher
                locale={locale}
                currency={currency}
                currencyLabel={dictionary.header.currency}
                languageLabel={dictionary.header.language}
                compact
              />
              <div className="flex items-center [&>*+*]:-ml-2.5">
                <HeaderSearch locale={locale} currency={currency} labels={searchLabels} />
                <WishlistHeaderLink
                  locale={locale}
                  label={dictionary.nav.wishlist}
                  count={wishlistCount}
                />
                <CartDrawer
                  locale={locale}
                  currency={currency}
                  dictionary={dictionary}
                  itemCount={cartItemCount}
                />
              </div>
            </div>

            <div className="hidden items-center gap-3 md:flex">
              {user ? (
                <AccountControls
                  locale={locale}
                  loginLabel={dictionary.header.login}
                  logoutLabel={dictionary.header.logout}
                  profileLabel={dictionary.header.profile}
                  adminLabel={dictionary.header.admin}
                  user={user}
                />
              ) : (
                <>
                  <AppLink
                    href={`/${locale}/login`}
                    prefetchPolicy="intent"
                    className="text-base font-bold text-[#101828]"
                  >
                    {dictionary.header.login}
                  </AppLink>
                  <AppLink
                    href={`/${locale}/register`}
                    prefetchPolicy="intent"
                    className="inline-flex h-10 items-center justify-center rounded-[32px] bg-[#ff6900] px-5 text-base font-bold text-white transition hover:brightness-105"
                  >
                    {dictionary.header.createAccount}
                  </AppLink>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
