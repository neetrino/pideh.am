'use client';

import Image from 'next/image';
import { usePathname } from 'next/navigation';

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
  const primaryNav = navItems.filter(
    (item) => !item.href.includes('/blog') && !item.href.endsWith('/cart'),
  );

  return (
    <header className="relative z-40 pt-3 md:pt-3.5">
      <div className={PAGE_CONTAINER}>
        <div
          data-header-pill
          className="flex h-16 w-full items-center justify-between gap-3 rounded-[90px] bg-white px-4 shadow-[0_8px_30px_rgba(0,0,0,0.08)] sm:px-6 md:h-20 md:px-8"
        >
          <AppLink
            href={`/${locale}`}
            prefetchPolicy="intent"
            data-header-logo
            className="relative h-12 w-[56px] shrink-0 md:h-16 md:w-[75px]"
            aria-label={dictionary.brand}
            onClick={(event) => {
              if (pathname === `/${locale}`) {
                event.preventDefault();
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }
            }}
          >
            <Image
              src={PIDEH_ASSETS.logo}
              alt={dictionary.brand}
              fill
              sizes="225px"
              quality={100}
              className="object-contain"
              priority
            />
          </AppLink>

          <nav
            aria-label="Primary"
            className="hidden flex-1 items-center justify-center gap-[26px] md:flex"
          >
            {primaryNav.map((item) => {
              const active = isActiveHref(pathname, item.href);
              return (
                <AppLink
                  key={item.href}
                  href={item.href}
                  prefetchPolicy="intent"
                  aria-current={active ? 'page' : undefined}
                  className={
                    active
                      ? 'inline-flex h-12 items-center rounded-[72px] bg-[#ff6b00] px-6 text-base font-bold text-white'
                      : 'text-base font-bold whitespace-nowrap text-[#364153] transition hover:text-[#ff6b00]'
                  }
                >
                  {item.label}
                </AppLink>
              );
            })}
          </nav>

          <div data-header-actions className="flex items-center gap-2 md:gap-3.5">
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

            <div className="hidden items-center gap-[19px] md:flex">
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
