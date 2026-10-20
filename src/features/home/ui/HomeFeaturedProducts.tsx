import { PidehPillButton } from '@/components/brand/PidehPillButton';
import { PAGE_CONTAINER } from '@/components/layout/page-container';
import { RevealOnView } from '@/components/motion/RevealOnView';
import { StaggerGroup, StaggerItem } from '@/components/motion/StaggerGroup';
import { cardShelf, pillPop, titleSweep } from '@/components/motion/presets';
import { HomeOrangeWave } from '@/features/home/ui/HomeOrangeWave';
import { HomeProductCard } from '@/features/home/ui/HomeProductCard';
import type { Locale } from '@/lib/i18n/config';

type FeaturedItem = {
  id: string;
  href: string;
  title: string;
  description?: string | null;
  priceFormatted: string;
  compareAtFormatted?: string | null;
  imageUrl: string | null;
  inStock: boolean;
  inWishlist?: boolean;
  cartQuantity?: number;
  maxQuantity?: number;
};

type HomeFeaturedProductsProps = {
  locale: Locale;
  title: string;
  viewAllLabel: string;
  viewAllHref: string;
  emptyLabel: string;
  wishlistLabel: string;
  orderLabel: string;
  outOfStockLabel: string;
  isSignedIn: boolean;
  products: readonly FeaturedItem[];
};

/**
 * Figma Featured (1:389) on Rectangle 4 (1:82) orange drip over categories yellow.
 */
export function HomeFeaturedProducts({
  locale,
  title,
  viewAllLabel,
  viewAllHref,
  emptyLabel,
  wishlistLabel,
  orderLabel,
  outOfStockLabel,
  isSignedIn,
  products,
}: HomeFeaturedProductsProps) {
  return (
    <section className="relative z-10 bg-[#ff6b00]">
      {/*
        Wave fill is #FF6B00. The drip path is inset on the lower left, so a
        transparent section leaked the lighter home shell as a gutter triangle.
        Yellow underlay still covers crest valleys so categories yellow shows.
        Clip the wave here, not the section: overflow on the section also
        slices the heading and the view-all pill on wide screens.
      */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 z-0 h-[min(42vw,420px)] bg-[#ffcf48]"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 z-0 overflow-x-clip"
        style={{ clipPath: 'inset(-260px 0 0 0)' }}
      >
        <HomeOrangeWave />
      </div>

      <div className={`relative z-[1] pt-24 pb-16 lg:pt-[240px] lg:pb-20 ${PAGE_CONTAINER}`}>
        <div className="mb-10 flex min-w-0 flex-col gap-6 lg:mb-[113px] lg:flex-row lg:items-end lg:justify-between">
          <RevealOnView variants={titleSweep} className="min-w-0">
            <h2
              className="font-display -mt-[0.22em] -mb-[0.18em] max-w-[891px] pt-[0.22em] pb-[0.18em] text-white"
              style={{
                fontSize: 'clamp(2.75rem, 9.72vw, 8.75rem)',
                lineHeight: 0.78,
              }}
            >
              {title}
            </h2>
          </RevealOnView>
          <RevealOnView variants={pillPop} delay={0.12} className="shrink-0">
            <PidehPillButton
              href={viewAllHref}
              label={viewAllLabel}
              tone="yellow"
              className="self-start lg:self-auto lg:mb-2"
            />
          </RevealOnView>
        </div>

        {products.length === 0 ? (
          <p className="text-white/90">{emptyLabel}</p>
        ) : (
          <StaggerGroup
            className="grid grid-cols-2 items-stretch gap-[13px] overflow-visible lg:grid-cols-3 xl:grid-cols-4"
            stagger={0.14}
          >
            {products.slice(0, 4).map((product) => (
              <StaggerItem
                key={product.id}
                variants={cardShelf}
                className="relative z-0 h-full min-w-0 w-full overflow-visible hover:z-50"
              >
                <HomeProductCard
                  href={product.href}
                  title={product.title}
                  description={product.description}
                  priceFormatted={product.priceFormatted}
                  compareAtFormatted={product.compareAtFormatted}
                  imageUrl={product.imageUrl}
                  inStock={product.inStock}
                  locale={locale}
                  productId={product.id}
                  inWishlist={product.inWishlist ?? false}
                  cartQuantity={product.cartQuantity}
                  maxQuantity={product.maxQuantity}
                  isSignedIn={isSignedIn}
                  wishlistLabel={wishlistLabel}
                  orderLabel={orderLabel}
                  outOfStockLabel={outOfStockLabel}
                />
              </StaggerItem>
            ))}
          </StaggerGroup>
        )}
      </div>
    </section>
  );
}
