import { notFound } from 'next/navigation';

import { STOREFRONT_DESKTOP_ONLY } from '@/components/layout/page-container';

import { listStorefrontCategories } from '@/features/categories/application/list-storefront-categories';
import { listActiveHeroSlides } from '@/features/hero/application/queries';
import { listOrbitPidePhotos } from '@/features/home/application/list-orbit-pide-images';
import { HomeCategories } from '@/features/home/ui/HomeCategories';
import { HomeCtaBanner } from '@/features/home/ui/HomeCtaBanner';
import { HomeFeaturedProducts } from '@/features/home/ui/HomeFeaturedProducts';
import { HOME_FEATURE_VISUALS, HomeFeatures } from '@/features/home/ui/HomeFeatures';
import { HeroVideoPreload } from '@/features/home/ui/HeroVideoPreload';
import { HomeHero } from '@/features/home/ui/HomeHero';
import { HomeReviews } from '@/features/home/ui/HomeReviews';
import { MobileHome } from '@/features/home/ui/mobile/MobileHome';
import { getActivePlainCartQuantities } from '@/features/cart/get-active-plain-quantities';
import { getFeaturedProducts, type CatalogProduct } from '@/features/products/queries';
import { getWishlistProductIds } from '@/features/wishlist/queries';
import { getCurrentUser } from '@/lib/auth/session';
import { isLocale, type Locale } from '@/lib/i18n/config';
import { getDictionary } from '@/lib/i18n/get-dictionary';
import { createDisplayPriceFormatter, getSelectedCurrency } from '@/lib/money/display-price';

type HomePageProps = {
  params: Promise<{ locale: string }>;
};

type DisplayPriceFormatter = Awaited<ReturnType<typeof createDisplayPriceFormatter>>;

function toProductCards(
  products: CatalogProduct[],
  locale: Locale,
  formatPrice: DisplayPriceFormatter,
  wishlistIds: Set<string>,
  cartQuantities: Record<string, number>,
) {
  return products.map((product) => {
    const price = formatPrice(product.priceAmount);
    const compareAt = product.compareAtAmount != null ? formatPrice(product.compareAtAmount) : null;

    return {
      id: product.id,
      href: `/${locale}/products/${product.translation.slug}`,
      title: product.translation.title,
      description: product.translation.description ?? null,
      priceFormatted: price.formatted,
      compareAtFormatted: compareAt?.formatted ?? null,
      imageUrl: product.imageUrl,
      inStock: product.stockOnHand > 0,
      inWishlist: wishlistIds.has(product.id),
      cartQuantity: cartQuantities?.[product.id] ?? 0,
      maxQuantity: product.stockOnHand,
    };
  });
}

export default async function HomePage({ params }: HomePageProps) {
  const { locale: rawLocale } = await params;

  if (!isLocale(rawLocale)) {
    notFound();
  }

  const locale: Locale = rawLocale;
  const dictionary = getDictionary(locale);
  const [heroSlides, categories, featuredProducts, orbitPhotos, currency, user] =
    await Promise.all([
      listActiveHeroSlides(locale),
      listStorefrontCategories(locale),
      getFeaturedProducts(locale),
      listOrbitPidePhotos(locale),
      getSelectedCurrency(),
      getCurrentUser(),
    ]);

  const productIds = featuredProducts.map((product) => product.id);
  const [wishlistIds, formatPrice, cartQuantities] = await Promise.all([
    getWishlistProductIds(productIds),
    createDisplayPriceFormatter(locale, currency),
    getActivePlainCartQuantities(productIds),
  ]);

  const featuredCards = toProductCards(
    featuredProducts,
    locale,
    formatPrice,
    wishlistIds,
    cartQuantities,
  );

  const featureTitles = {
    delivery: dictionary.home.features.deliveryTitle,
    prep: dictionary.home.features.prepTitle,
    quality: dictionary.home.features.qualityTitle,
    support: dictionary.home.features.supportTitle,
  } as const;

  const categoryCards = categories.map((category) => ({
    id: category.id,
    title: category.title,
    href: `/${locale}/products?category=${encodeURIComponent(category.slug)}`,
    slug: category.slug,
    imageUrl: category.imageUrl,
    productCount: category.productCount,
  }));

  return (
    <div className="pideh-home">
      <HeroVideoPreload />
      <MobileHome
        locale={locale}
        dictionary={dictionary}
        categories={categoryCards}
        products={featuredCards}
        currency={currency}
        isSignedIn={Boolean(user)}
      />

      <div className={STOREFRONT_DESKTOP_ONLY}>
        <HomeHero
          slides={heroSlides}
          fallbackTitleAccent={dictionary.home.heroTitleLine2}
          fallbackCtaLabel={dictionary.home.viewAllMenu}
          fallbackCtaHref={`/${locale}/products`}
        />

        <HomeCategories
          title={dictionary.home.categoriesTitle}
          viewAllLabel={dictionary.home.viewAllMenu}
          viewAllHref={`/${locale}/products`}
          demoProductTitle={dictionary.home.categoryDemoTitle}
          orbitPhotos={orbitPhotos.map((photo) => ({
            imageUrl: photo.url,
            title: photo.title,
            href: `/${locale}/products/${photo.slug}`,
          }))}
        />

        <HomeFeaturedProducts
          locale={locale}
          title={dictionary.home.featuredTitle}
          viewAllLabel={dictionary.home.viewAllMenu}
          viewAllHref={`/${locale}/products`}
          emptyLabel={dictionary.home.emptyFeatured}
          wishlistLabel={dictionary.nav.wishlist}
          orderLabel={dictionary.home.orderCta}
          outOfStockLabel={dictionary.product.outOfStock}
          isSignedIn={Boolean(user)}
          products={featuredCards}
        />

        <HomeFeatures
          titleLine1={dictionary.home.whyUsTitleLine1}
          titleLine2={dictionary.home.whyUsTitleLine2}
          items={HOME_FEATURE_VISUALS.map((visual) => ({
            title: featureTitles[visual.key],
            imageSrc: visual.imageSrc,
            imageBox: visual.imageBox,
            imageCrop: visual.imageCrop,
            labelBox: visual.labelBox,
          }))}
        />

        <HomeReviews title={dictionary.home.reviewsTitle} reviews={dictionary.home.reviews} />

        <HomeCtaBanner
          titleLine1={dictionary.home.ctaTitleLine1}
          titleLine2={dictionary.home.ctaTitleLine2}
          description={dictionary.home.ctaDescription}
          ctaLabel={dictionary.home.orderCta}
          ctaHref={`/${locale}/products`}
        />
      </div>
    </div>
  );
}
