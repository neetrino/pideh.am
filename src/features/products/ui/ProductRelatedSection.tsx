import { PidehPillButton } from '@/components/brand/PidehPillButton';
import { HomeProductCard } from '@/features/home/ui/HomeProductCard';
import { getActivePlainCartQuantities } from '@/features/cart/get-active-plain-quantities';
import { getRelatedProducts } from '@/features/products/queries';
import { getWishlistProductIds } from '@/features/wishlist/queries';
import type { Dictionary } from '@/lib/i18n/get-dictionary';
import type { Locale } from '@/lib/i18n/config';
import { createDisplayPriceFormatter } from '@/lib/money/display-price';
import type { Currency } from '@/lib/money/currency';

type ProductRelatedSectionProps = {
  locale: Locale;
  productId: string;
  currency: Currency;
  isSignedIn: boolean;
  dictionary: Dictionary;
};

/** Streams below the PDP fold — does not block gallery/purchase chrome. */
export async function ProductRelatedSection({
  locale,
  productId,
  currency,
  isSignedIn,
  dictionary,
}: ProductRelatedSectionProps) {
  const related = await getRelatedProducts(locale, productId);
  const menuButton = (
    <PidehPillButton
      href={`/${locale}/products`}
      label={dictionary.home.viewAll}
      tone="yellow"
      className="max-sm:px-4 max-sm:py-2.5 max-sm:text-sm"
    />
  );

  if (related.length === 0) {
    return <section className="mt-16 flex justify-center md:mt-20">{menuButton}</section>;
  }

  const relatedIds = related.map((item) => item.id);
  const [wishlistIds, formatPrice, cartQuantities] = await Promise.all([
    getWishlistProductIds(relatedIds),
    createDisplayPriceFormatter(locale, currency),
    getActivePlainCartQuantities(relatedIds),
  ]);

  const labels = dictionary.product;

  return (
    <section className="mt-16 flex flex-col gap-8 md:mt-20">
      <div className="flex items-end justify-between gap-3">
        <h2 className="min-w-0 flex-1 font-display text-[clamp(1.55rem,6vw,4.8rem)] leading-[0.9] break-words text-white">
          {labels.related}
        </h2>
        <div className="shrink-0">{menuButton}</div>
      </div>
      <div className="flex w-full min-w-0 snap-x snap-mandatory gap-[13px] overflow-x-auto overscroll-x-contain pb-1 lg:grid lg:snap-none lg:grid-cols-4 lg:overflow-visible">
        {related.map((item) => {
          const price = formatPrice(item.priceAmount);
          const compareAt = item.compareAtAmount != null ? formatPrice(item.compareAtAmount) : null;

          return (
            <div key={item.id} className="w-[82%] shrink-0 snap-start lg:w-auto lg:shrink">
              <HomeProductCard
                href={`/${locale}/products/${item.translation.slug}`}
                title={item.translation.title}
                description={item.translation.description ?? null}
                priceFormatted={price.formatted}
                compareAtFormatted={compareAt?.formatted ?? null}
                imageUrl={item.imageUrl}
                inStock={item.stockOnHand > 0}
                locale={locale}
                productId={item.id}
                inWishlist={wishlistIds.has(item.id)}
                cartQuantity={cartQuantities[item.id] ?? 0}
                maxQuantity={item.stockOnHand}
                isSignedIn={isSignedIn}
                wishlistLabel={dictionary.nav.wishlist}
                orderLabel={dictionary.home.orderCta}
                outOfStockLabel={labels.outOfStock}
                className="min-w-0 max-w-none"
              />
            </div>
          );
        })}
      </div>
    </section>
  );
}
