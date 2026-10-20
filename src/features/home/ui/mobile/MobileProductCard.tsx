'use client';

import Image from 'next/image';

import { AppLink } from '@/components/ui/AppLink';
import { ProductCardCartControl } from '@/features/home/ui/ProductCardCartControl';
import { MOBILE_HOME_ASSETS } from '@/features/home/ui/mobile/mobile-assets';
import { WishlistButton } from '@/features/wishlist/ui/WishlistButton';
import type { Locale } from '@/lib/i18n/config';

type MobileProductCardProps = {
  href: string;
  title: string;
  description?: string | null;
  priceFormatted: string;
  imageUrl: string | null;
  tiltPhoto?: boolean;
  inStock: boolean;
  locale: Locale;
  productId: string;
  inWishlist: boolean;
  isSignedIn: boolean;
  wishlistLabel: string;
  addLabel: string;
  cartQuantity?: number;
  maxQuantity?: number;
  priority?: boolean;
};

/**
 * Figma Product 260:512 — fixed 200×340 design space (scaled via MobileFrame440).
 * Button 8 stays inside the white rounded rect (never spills into the orange page).
 *
 * @see https://www.figma.com/design/zyLVZFDhohLYxwuohIrPDN/Pideh-Dev?node-id=260-512
 */
export function MobileProductCard({
  href,
  title,
  description,
  priceFormatted,
  imageUrl,
  tiltPhoto = false,
  inStock,
  locale,
  productId,
  inWishlist,
  isSignedIn,
  wishlistLabel,
  addLabel,
  cartQuantity = 0,
  maxQuantity,
  priority = false,
}: MobileProductCardProps) {
  const summary = description?.trim() ?? "";

  return (
    <article
      data-node-id="260:512"
      className="relative box-border flex h-[340px] w-[200px] flex-col gap-2 overflow-visible rounded-[26px] bg-white pt-[27px] pr-4 pb-4 pl-3.5 shadow-none"
    >
      <AppLink
        href={href}
        prefetchPolicy={priority ? 'intent' : 'auto'}
        aria-hidden="true"
        tabIndex={-1}
        className="absolute inset-0 z-[1] rounded-[26px]"
      />
      <div
        data-node-id="260:513"
        className={`relative z-20 mx-auto shrink-0 ${tiltPhoto ? 'h-[148px] w-[176px]' : 'h-[120px] w-[164px]'}`}
      >
        <AppLink
          href={href}
          prefetchPolicy={priority ? 'intent' : 'auto'}
          className="absolute inset-0 block"
        >
          {imageUrl ? (
            <span className="pointer-events-none absolute inset-0">
              <Image
                src={imageUrl}
                alt={title}
                width={164}
                height={120}
                sizes="164px"
                priority={priority}
                className={`size-full object-contain object-center${
                  tiltPhoto ? ' origin-center scale-125 -rotate-[18deg]' : ''
                }`}
              />
            </span>
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-gray-50 text-sm text-gray-400">
              —
            </div>
          )}
        </AppLink>
        <WishlistButton
          locale={locale}
          productId={productId}
          initialInWishlist={inWishlist}
          isSignedIn={isSignedIn}
          label={wishlistLabel}
          size="sm"
          emptyIconSrc={MOBILE_HOME_ASSETS.heartOutline}
          emptyIconWidth={34}
          emptyIconHeight={34}
          className="absolute -top-3 -right-1.5 z-20 size-[34px] bg-transparent text-[#ff6b00] shadow-none"
        />
      </div>

      <div
        data-node-id="260:519"
        className="font-montserrat-arm h-[19px] w-full shrink-0 overflow-hidden text-base leading-[1.25] font-extrabold text-[#1e1e1e]"
      >
        <AppLink href={href} prefetchPolicy="auto" className="relative z-[2] block truncate">
          {title}
        </AppLink>
      </div>

      <p
        data-node-id="260:520"
        className="font-noto-armenian line-clamp-3 h-12 w-full shrink-0 overflow-hidden text-sm leading-[1.14] text-[#6b6b6b]"
      >
        {summary || '\u00A0'}
      </p>

      <div
        data-node-id="260:875"
        className={
          cartQuantity > 0
            ? 'relative mt-auto h-[72px] w-full shrink-0'
            : 'mt-auto flex h-[56px] w-full shrink-0 items-center gap-2'
        }
      >
        <p
          data-node-id="260:522"
          className={`font-montserrat-arm min-w-0 truncate text-[21px] leading-[1.25] font-extrabold text-[#1e1e1e] ${
            cartQuantity > 0 ? 'absolute inset-x-0 top-0' : 'flex-1'
          }`}
        >
          {priceFormatted}
        </p>
        <div className={cartQuantity > 0 ? 'absolute right-0 bottom-0' : 'contents'}>
        <ProductCardCartControl
          productId={productId}
          locale={locale}
          orderLabel={addLabel}
          initialQuantity={cartQuantity}
          maxQuantity={maxQuantity}
          inStock={inStock}
          variant="compact"
        />
        </div>
      </div>
    </article>
  );
}
