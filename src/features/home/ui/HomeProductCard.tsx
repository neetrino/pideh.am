"use client";

import { motion, useReducedMotion } from "motion/react";
import { type PointerEvent } from "react";

import { AppLink } from "@/components/ui/AppLink";
import { PIDEH_ASSETS } from "@/features/home/ui/brand-assets";
import { ProductCardCartControl } from "@/features/home/ui/ProductCardCartControl";
import {
  PRODUCT_CARD_SPRING,
  PRODUCT_CARD_TAP,
} from "@/features/home/ui/product-card-motion";
import { ProductCardPhoto } from "@/features/home/ui/ProductCardPhoto";
import { WishlistButton } from "@/features/wishlist/ui/WishlistButton";
import type { Locale } from "@/lib/i18n/config";

function stopCardPress(event: PointerEvent<HTMLElement>): void {
  event.stopPropagation();
}

type HomeProductCardProps = {
  href: string;
  title: string;
  description?: string | null;
  priceFormatted: string;
  compareAtFormatted?: string | null;
  imageUrl: string | null;
  inStock: boolean;
  priority?: boolean;
  locale: Locale;
  productId: string;
  inWishlist: boolean;
  isSignedIn: boolean;
  wishlistLabel: string;
  orderLabel: string;
  cartQuantity?: number;
  maxQuantity?: number;
  outOfStockLabel?: string;
  className?: string;
};

export function HomeProductCard({
  href,
  title,
  description,
  priceFormatted,
  compareAtFormatted = null,
  imageUrl,
  inStock,
  priority = false,
  locale,
  productId,
  inWishlist,
  isSignedIn,
  wishlistLabel,
  orderLabel,
  cartQuantity = 0,
  maxQuantity,
  outOfStockLabel,
  className = "",
}: HomeProductCardProps) {
  const reduceMotion = useReducedMotion();
  const summary = description?.trim() ?? "";

  return (
    <motion.div
      className={`group relative z-0 h-full w-full max-w-full overflow-visible hover:z-50 ${className}`}
      style={{ transformOrigin: "50% 100%" }}
      transition={PRODUCT_CARD_SPRING}
      whileTap={reduceMotion ? undefined : PRODUCT_CARD_TAP}
    >
      <article className="pideh-product-card relative flex h-full w-full flex-col items-start gap-[11px] overflow-visible rounded-[26px] bg-white px-4 pt-[27px] pb-4 shadow-none min-[1200px]:shadow-[0px_12px_14px_rgba(31,20,8,0.11)]">
        <AppLink
          href={href}
          prefetchPolicy={priority ? "intent" : "auto"}
          aria-hidden="true"
          tabIndex={-1}
          className="absolute inset-0 z-[1] rounded-[26px]"
        />
        <div className="relative z-30 w-full overflow-visible">
          <ProductCardPhoto
            href={href}
            title={title}
            imageUrl={imageUrl}
            priority={priority}
          />
          <span className="absolute top-0 right-0 z-40" onPointerDown={stopCardPress}>
            <WishlistButton
              locale={locale}
              productId={productId}
              initialInWishlist={inWishlist}
              isSignedIn={isSignedIn}
              label={wishlistLabel}
              size="sm"
              emptyIconSrc={PIDEH_ASSETS.shopHeart}
              emptyIconWidth={34}
              emptyIconHeight={34}
              className="h-[34px] w-[34px] bg-transparent text-[#ff6b00] shadow-none transition duration-200 hover:scale-110 hover:bg-transparent"
            />
          </span>
        </div>

        <h3 className="relative z-[2] h-[50px] w-full shrink-0 overflow-hidden text-[20px] leading-[1.25] font-extrabold text-[#1e1e1e]">
          <AppLink href={href} prefetchPolicy="auto" className="line-clamp-2 block">
            {title}
          </AppLink>
        </h3>

        <p className="line-clamp-2 h-[35px] w-full min-w-0 shrink-0 overflow-hidden text-sm leading-[1.25] text-[#6b6b6b]">
          {summary || "\u00A0"}
        </p>

        <div className="relative z-10 mt-auto flex w-full flex-col gap-[11px]">
          <div className="flex h-[26px] w-full shrink-0 items-baseline gap-2 overflow-hidden">
            <p className="text-[21px] leading-[1.25] font-extrabold text-[#1e1e1e]">
              {priceFormatted}
            </p>
            {compareAtFormatted ? (
              <p className="text-sm text-[#6b6b6b] line-through">
                {compareAtFormatted}
              </p>
            ) : null}
          </div>

          {!inStock && outOfStockLabel ? (
            <p className="text-sm font-semibold text-red-600">{outOfStockLabel}</p>
          ) : null}

          <div className="w-full" onPointerDown={stopCardPress}>
            <ProductCardCartControl
              productId={productId}
              locale={locale}
              orderLabel={orderLabel}
              initialQuantity={cartQuantity}
              maxQuantity={maxQuantity}
              inStock={inStock}
              variant="pill"
            />
          </div>
        </div>
      </article>
    </motion.div>
  );
}
