'use client';

import Image from 'next/image';
import { useRouter } from 'next/navigation';
import type { RefObject } from 'react';

import { MOBILE_HOME_ASSETS } from '@/features/home/ui/mobile/mobile-assets';
import type { ProductGalleryImage } from '@/features/products/types';
import { MobileProductImage } from '@/features/products/ui/mobile/MobileProductImage';

type MobileProductHeroProps = {
  title: string;
  image: ProductGalleryImage | null;
  galleryRef: RefObject<HTMLDivElement | null>;
  discountPercent: number | null;
  inStock: boolean;
  outOfStockLabel: string;
  backLabel: string;
  emphasizePhoto?: boolean;
};

/**
 * Figma 414:598 hero — product photo plus yellow back pill.
 * Height tracks the small viewport so the white sheet (title and price)
 * stays above the bottom dock when the page opens.
 */
export function MobileProductHero({
  title,
  image,
  galleryRef,
  discountPercent,
  inStock,
  outOfStockLabel,
  backLabel,
  emphasizePhoto = false,
}: MobileProductHeroProps) {
  const router = useRouter();

  return (
    <div className="pideh-pdp-mobile-hero relative overflow-hidden">
      {image ? (
        <MobileProductImage
          src={image.url}
          alt={image.alt || title}
          imageRef={galleryRef}
          emphasize={emphasizePhoto}
        />
      ) : (
        <div ref={galleryRef} className="absolute inset-0" />
      )}

      {discountPercent != null ? (
        <span className="absolute top-4 right-4 z-20 rounded-[12px] bg-[#ff6b00] px-3 py-1.5 text-sm font-bold text-white">
          −{discountPercent}%
        </span>
      ) : null}
      {!inStock ? (
        <span className="absolute top-4 left-4 z-20 rounded-[12px] bg-[#1e1e1e]/90 px-3 py-1.5 text-sm font-bold text-white">
          {outOfStockLabel}
        </span>
      ) : null}

      <button
        type="button"
        aria-label={backLabel}
        onClick={() => router.back()}
        className="absolute top-[47px] left-[23px] z-20 flex h-[52px] shrink-0 items-center rounded-[42px] bg-[#ffd54a] px-6 transition active:scale-95"
      >
        <Image
          src={MOBILE_HOME_ASSETS.viewAllArrow}
          alt=""
          width={20}
          height={20}
          className="size-5 rotate-180"
        />
      </button>
    </div>
  );
}
