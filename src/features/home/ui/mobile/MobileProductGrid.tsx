import { MobileFrame440 } from '@/features/home/ui/mobile/MobileFrame440';
import { MobileProductCard } from '@/features/home/ui/mobile/MobileProductCard';
import type { Locale } from '@/lib/i18n/config';

export type MobileGridProduct = {
  id: string;
  href: string;
  title: string;
  description?: string | null;
  priceFormatted: string;
  imageUrl: string | null;
  /** Shawarma photos sit a little larger and tilted, like the pide shots. */
  tiltPhoto?: boolean;
  inStock: boolean;
  inWishlist?: boolean;
  cartQuantity?: number;
  maxQuantity?: number;
};

/** Figma row pitch between two stacked product cards (260:547 → 260:959). */
const ROW_HEIGHT = 372;

type MobileProductGridProps = {
  locale: Locale;
  products: readonly MobileGridProduct[];
  isSignedIn: boolean;
  wishlistLabel: string;
  addLabel: string;
  /** Cards eagerly loaded with a high-priority image. */
  priorityCount?: number;
};

/**
 * Two-column product grid in the Figma 440 design space.
 * Cards stay at exactly 200×340 so Button 8 never spills into the orange page.
 */
export function MobileProductGrid({
  locale,
  products,
  isSignedIn,
  wishlistLabel,
  addLabel,
  priorityCount = 0,
}: MobileProductGridProps) {
  if (products.length === 0) {
    return null;
  }

  const rows = Math.ceil(products.length / 2);

  return (
    <MobileFrame440 height={rows * ROW_HEIGHT}>
      <div className="box-border px-[14px]">
        <div className="grid grid-cols-2 gap-x-[11px] gap-y-0">
          {products.map((product, index) => (
            <div key={product.id} className="relative flex h-[372px] justify-center pt-4">
              <MobileProductCard
                href={product.href}
                title={product.title}
                description={product.description}
                priceFormatted={product.priceFormatted}
                imageUrl={product.imageUrl}
                tiltPhoto={product.tiltPhoto}
                inStock={product.inStock}
                priority={index < priorityCount}
                locale={locale}
                productId={product.id}
                inWishlist={product.inWishlist ?? false}
                cartQuantity={product.cartQuantity}
                maxQuantity={product.maxQuantity}
                isSignedIn={isSignedIn}
                wishlistLabel={wishlistLabel}
                addLabel={addLabel}
              />
            </div>
          ))}
        </div>
      </div>
    </MobileFrame440>
  );
}
