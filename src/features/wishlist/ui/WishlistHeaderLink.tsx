'use client';

import { Heart } from 'lucide-react';

import { AppLink } from '@/components/ui/AppLink';
import { useWishlistBadgeCount } from '@/features/wishlist/ui/wishlist-badge-count';
import type { Locale } from '@/lib/i18n/config';

type WishlistHeaderLinkProps = {
  locale: Locale;
  label: string;
  count: number;
};

export function WishlistHeaderLink({ locale, label, count }: WishlistHeaderLinkProps) {
  const badgeCount = useWishlistBadgeCount(count);

  return (
    <AppLink
      href={`/${locale}/wishlist`}
      prefetchPolicy="intent"
      aria-label={label}
      className="relative z-10 inline-flex h-11 w-11 items-center justify-center rounded-full text-[#1e1e1e] transition-colors duration-150 hover:bg-[#ffd54a] hover:text-[#1e1e1e]"
    >
      <Heart className="h-5 w-5" aria-hidden="true" />
      {badgeCount > 0 ? (
        <span className="absolute top-1 right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-[#ff6b00] px-1 text-[10px] font-semibold text-white">
          {badgeCount > 99 ? '99+' : badgeCount}
        </span>
      ) : null}
    </AppLink>
  );
}
