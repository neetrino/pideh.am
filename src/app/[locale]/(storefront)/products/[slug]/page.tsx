import type { Metadata } from 'next';
import { Suspense } from 'react';
import { notFound } from 'next/navigation';

import { getEnv } from '@/config/env';
import { getProductDetailBySlug } from '@/features/products/queries';
import { ProductDetailView } from '@/features/products/ui/ProductDetailView';
import { ProductRelatedSection } from '@/features/products/ui/ProductRelatedSection';
import { isProductInWishlist } from '@/features/wishlist/queries';
import { getCurrentUser } from '@/lib/auth/session';
import { isLocale, type Locale } from '@/lib/i18n/config';
import { getDictionary } from '@/lib/i18n/get-dictionary';
import { createDisplayPriceFormatter, getSelectedCurrency } from '@/lib/money/display-price';

type ProductPageProps = {
  params: Promise<{ locale: string; slug: string }>;
};

function buildProductJsonLd(input: {
  locale: Locale;
  slug: string;
  title: string;
  description?: string;
  sku: string;
  priceAmount: number;
  imageUrl: string | null;
  inStock: boolean;
}): Record<string, unknown> {
  const appUrl = getEnv().NEXT_PUBLIC_APP_URL.replace(/\/$/, '');
  const url = `${appUrl}/${input.locale}/products/${input.slug}`;

  return {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: input.title,
    sku: input.sku,
    url,
    ...(input.description ? { description: input.description } : {}),
    ...(input.imageUrl ? { image: input.imageUrl } : {}),
    offers: {
      '@type': 'Offer',
      url,
      priceCurrency: 'AMD',
      price: String(input.priceAmount),
      availability: input.inStock ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
    },
  };
}

function SectionFallback() {
  return <div className="h-40 animate-pulse rounded-[24px] bg-white/20" aria-hidden="true" />;
}

export async function generateMetadata({ params }: ProductPageProps): Promise<Metadata> {
  const { locale: rawLocale, slug } = await params;
  if (!isLocale(rawLocale)) {
    return {};
  }

  const product = await getProductDetailBySlug(rawLocale, slug);
  if (!product) {
    return {};
  }

  const title = product.translation.seoTitle ?? product.translation.title;
  const description = product.translation.seoDescription ?? product.translation.description;
  const canonicalPath = `/${rawLocale}/products/${product.translation.slug}`;

  return {
    title,
    description,
    alternates: { canonical: canonicalPath },
    openGraph: {
      title,
      description,
      type: 'website',
      url: canonicalPath,
      ...(product.imageUrl ? { images: [{ url: product.imageUrl }] } : {}),
    },
  };
}

export default async function ProductPage({ params }: ProductPageProps) {
  const { locale: rawLocale, slug } = await params;
  if (!isLocale(rawLocale)) {
    notFound();
  }

  const locale: Locale = rawLocale;
  const dictionary = getDictionary(locale);
  const [product, user, currency] = await Promise.all([
    getProductDetailBySlug(locale, slug),
    getCurrentUser(),
    getSelectedCurrency(),
  ]);
  if (!product) {
    notFound();
  }

  const [inWishlist, formatPrice] = await Promise.all([
    isProductInWishlist(product.id),
    createDisplayPriceFormatter(locale, currency),
  ]);
  const price = formatPrice(product.priceAmount);

  const jsonLd = buildProductJsonLd({
    locale,
    slug: product.translation.slug,
    title: product.translation.title,
    description: product.translation.description,
    sku: product.sku,
    priceAmount: product.priceAmount,
    imageUrl: product.images[0]?.url ?? product.imageUrl,
    inStock: product.stockOnHand > 0,
  });

  const isSignedIn = Boolean(user);

  return (
    <div className="pideh-pdp">
      <ProductDetailView
        locale={locale}
        currency={currency}
        fxRate={price.rate}
        product={product}
        isSignedIn={isSignedIn}
        inWishlist={inWishlist}
        dictionary={dictionary}
        jsonLd={jsonLd}
        relatedSlot={
          <Suspense fallback={<SectionFallback />}>
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
    </div>
  );
}
