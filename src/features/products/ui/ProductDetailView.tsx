import { Suspense } from 'react';

import { PAGE_CONTAINER, STOREFRONT_DESKTOP_FLEX } from '@/components/layout/page-container';
import { ProductDetailConfigurator } from '@/features/products/ui/ProductDetailConfigurator';
import { ProductRelatedSection } from '@/features/products/ui/ProductRelatedSection';
import type { ProductDetail } from '@/features/products/types';
import { MobileProductDetail } from '@/features/products/ui/mobile/MobileProductDetail';
import type { Dictionary } from '@/lib/i18n/get-dictionary';
import type { Locale } from '@/lib/i18n/config';
import type { Currency } from '@/lib/money/currency';

function isShawarmaSlug(slug: string): boolean {
  const normalized = slug.trim().toLowerCase();
  return (
    normalized.includes('shaur') ||
    normalized.includes('shawar') ||
    normalized.includes('shwar') ||
    normalized.includes('շաուրմ')
  );
}

type ProductDetailViewProps = {
  locale: Locale;
  currency: Currency;
  fxRate: string;
  product: ProductDetail;
  isSignedIn: boolean;
  inWishlist: boolean;
  dictionary: Dictionary;
  jsonLd: Record<string, unknown>;
  relatedSlot: React.ReactNode;
};

export function ProductDetailView({
  locale,
  currency,
  fxRate,
  product,
  isSignedIn,
  inWishlist,
  dictionary,
  jsonLd,
  relatedSlot,
}: ProductDetailViewProps) {
  const labels = dictionary.product;
  const configuratorLabels = {
    ingredients: labels.ingredients,
    additions: labels.additions,
    exceptions: labels.exceptions,
    extraPriceHint: labels.extraPriceHint,
    quantity: labels.quantity,
    decreaseQuantity: dictionary.cartDrawer.decreaseQuantity,
    increaseQuantity: dictionary.cartDrawer.increaseQuantity,
    addToCart: labels.addToCart,
    outOfStock: labels.outOfStock,
    error: labels.addError,
    resetSelection: labels.resetSelection,
    specialRequests: labels.specialRequests,
    specialRequestsPlaceholder: labels.specialRequestsPlaceholder,
  };
  const emphasizePhoto =
    isShawarmaSlug(product.translation.title) ||
    product.categories.some(
      (category) => isShawarmaSlug(category.slug) || isShawarmaSlug(category.title),
    );
  const configurator = {
    locale,
    currency,
    fxRate,
    productId: product.id,
    title: product.translation.title.replace(/շաուրմա/g, 'Շաուրմա'),
    description: product.translation.description,
    images: product.images,
    discountPercent: product.discountPercent,
    stockOnHand: product.stockOnHand,
    basePriceAmount: product.priceAmount,
    compareAtAmount: product.compareAtAmount,
    additions: product.additions ?? [],
    exceptions: product.exceptions ?? [],
    inWishlist,
    isSignedIn,
    wishlistLabel: dictionary.nav.wishlist,
    labels: configuratorLabels,
  };

  return (
    <div>
      <MobileProductDetail
        {...configurator}
        backLabel={dictionary.catalog.back}
        emphasizePhoto={emphasizePhoto}
        copyrightText={dictionary.footer.copyrightMobile.replace('{year}', String(new Date().getFullYear()))}
        relatedSlot={
          <Suspense fallback={null}>
            <ProductRelatedSection
              locale={locale}
              productId={product.id}
              currency={currency}
              isSignedIn={isSignedIn}
              dictionary={dictionary}
            />
          </Suspense>
        }
      />

      <article className={`${STOREFRONT_DESKTOP_FLEX} flex-col`}>
        <div className="pt-6 pb-20 md:pt-8 md:pb-28">
          <div className={PAGE_CONTAINER}>
            <ProductDetailConfigurator {...configurator} emphasizePhoto={emphasizePhoto} />

            {relatedSlot}
          </div>
        </div>
      </article>

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
    </div>
  );
}
