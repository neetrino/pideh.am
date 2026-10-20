import { notFound } from 'next/navigation';

import {
  MOBILE_STOREFRONT_SHELL,
  STOREFRONT_DESKTOP_ONLY,
} from '@/components/layout/page-container';
import { RevealOnView } from '@/components/motion/RevealOnView';
import { StaggerGroup, StaggerItem } from '@/components/motion/StaggerGroup';
import { cardShelf, fadeUp, titleSweep } from '@/components/motion/presets';
import { HomeProductCard } from '@/features/home/ui/HomeProductCard';
import { MobileProductGrid } from '@/features/home/ui/mobile/MobileProductGrid';
import { getActivePlainCartQuantities } from '@/features/cart/get-active-plain-quantities';
import { listWishlistProducts } from '@/features/wishlist/queries';
import { WishlistEmptyState } from '@/features/wishlist/ui/WishlistEmptyState';
import { getCurrentUser } from '@/lib/auth/session';
import { isLocale } from '@/lib/i18n/config';
import { getDictionary } from '@/lib/i18n/get-dictionary';
import { createDisplayPriceFormatter, getSelectedCurrency } from '@/lib/money/display-price';

type WishlistPageProps = {
  params: Promise<{ locale: string }>;
};

function WishlistHeading({
  title,
  subtitle,
}: {
  title: string;
  subtitle?: string;
}) {
  return (
    <>
      <RevealOnView variants={titleSweep}>
        <h1 className="font-display mt-5 text-[clamp(2.75rem,7vw,4.25rem)] leading-[0.95] text-[#ff6b00]">
          {title}
        </h1>
      </RevealOnView>
      {subtitle ? (
        <RevealOnView variants={fadeUp} delay={0.12}>
          <p className="font-noto-armenian mt-2 text-sm text-[#6b6b6b]">{subtitle}</p>
        </RevealOnView>
      ) : null}
    </>
  );
}

export default async function WishlistPage({ params }: WishlistPageProps) {
  const { locale: rawLocale } = await params;

  if (!isLocale(rawLocale)) {
    notFound();
  }

  const dictionary = getDictionary(rawLocale);
  const copy = dictionary.wishlist;
  const title = dictionary.nav.wishlist;
  const [user, currency, products] = await Promise.all([
    getCurrentUser(),
    getSelectedCurrency(),
    listWishlistProducts(rawLocale),
  ]);

  if (!user) {
    const loginHref = `/${rawLocale}/login?next=${encodeURIComponent(`/${rawLocale}/wishlist`)}`;

    return (
      <section>
        <WishlistHeading title={title} />
        <RevealOnView variants={fadeUp} delay={0.12} className="mt-8">
          <WishlistEmptyState
            title={copy.signInTitle}
            description={copy.signInPrompt}
            ctaHref={loginHref}
            ctaLabel={dictionary.header.login}
          />
        </RevealOnView>
      </section>
    );
  }

  const [formatPrice, cartQuantities] = await Promise.all([
    createDisplayPriceFormatter(rawLocale, currency),
    getActivePlainCartQuantities(products.map((product) => product.id)),
  ]);
  const priced = products.map((product) => {
    const price = formatPrice(product.priceAmount);
    const compareAt = product.compareAtAmount != null ? formatPrice(product.compareAtAmount) : null;

    return {
      product,
      priceFormatted: price.formatted,
      compareAtFormatted: compareAt?.formatted ?? null,
    };
  });

  const countLabel =
    priced.length === 1 ? copy.countOne : copy.countMany.replace('{count}', String(priced.length));

  return (
    <section>
      <WishlistHeading
        title={title}
        subtitle={priced.length > 0 ? countLabel : undefined}
      />

      <div className="mt-8">
        {priced.length === 0 ? (
          <RevealOnView variants={fadeUp} delay={0.12}>
            <WishlistEmptyState
              title={copy.empty}
              description={copy.emptyDescription}
              ctaHref={`/${rawLocale}/products`}
              ctaLabel={copy.browseCta}
            />
          </RevealOnView>
        ) : (
          <>
            <div className={MOBILE_STOREFRONT_SHELL}>
              <MobileProductGrid
                locale={rawLocale}
                products={priced.map(({ product, priceFormatted }) => ({
                  id: product.id,
                  href: `/${rawLocale}/products/${product.translation.slug}`,
                  title: product.translation.title,
                  description: product.translation.description ?? null,
                  priceFormatted,
                  imageUrl: product.imageUrl,
                  inStock: product.stockOnHand > 0,
                  inWishlist: true,
                  cartQuantity: cartQuantities[product.id] ?? 0,
                  maxQuantity: product.stockOnHand,
                }))}
                isSignedIn
                wishlistLabel={title}
                addLabel={dictionary.home.orderCta}
                priorityCount={2}
              />
            </div>
            <div className={STOREFRONT_DESKTOP_ONLY}>
              <StaggerGroup
                className="grid grid-cols-1 justify-items-stretch gap-[13px] overflow-visible sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 [&_.pideh-product-card]:shadow-none"
                stagger={0.08}
                delayChildren={0.04}
              >
                {priced.map(({ product, priceFormatted, compareAtFormatted }, index) => (
                  <StaggerItem
                    key={product.id}
                    variants={cardShelf}
                    className="relative z-0 w-full min-w-0 overflow-visible hover:z-50"
                  >
                    <HomeProductCard
                      href={`/${rawLocale}/products/${product.translation.slug}`}
                      title={product.translation.title}
                      description={product.translation.description ?? null}
                      priceFormatted={priceFormatted}
                      compareAtFormatted={compareAtFormatted}
                      imageUrl={product.imageUrl}
                      inStock={product.stockOnHand > 0}
                      priority={index < 4}
                      locale={rawLocale}
                      productId={product.id}
                      inWishlist
                      cartQuantity={cartQuantities[product.id] ?? 0}
                      maxQuantity={product.stockOnHand}
                      isSignedIn
                      wishlistLabel={title}
                      orderLabel={dictionary.home.orderCta}
                      outOfStockLabel={dictionary.product.outOfStock}
                      className="max-w-none"
                    />
                  </StaggerItem>
                ))}
              </StaggerGroup>
            </div>
          </>
        )}
      </div>
    </section>
  );
}
