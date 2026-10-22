import { notFound } from 'next/navigation';

import { PAGE_CONTAINER, STOREFRONT_DESKTOP_ONLY } from '@/components/layout/page-container';
import { RevealOnView } from '@/components/motion/RevealOnView';
import { titleSweep } from '@/components/motion/presets';
import { listStorefrontCategories } from '@/features/categories/application/list-storefront-categories';
import { parseCatalogSearchParams } from '@/features/products/application/catalog-search-params';
import {
  listCatalogProducts,
  type CatalogListResult,
} from '@/features/products/application/list-catalog-products';
import type { CatalogSection } from '@/features/products/application/list-catalog-sections';
import type { CatalogFilters } from '@/features/products/schemas/catalog-list';
import type { CatalogProduct } from '@/features/products/types';
import { CatalogControls } from '@/features/products/ui/CatalogControls';
import { ShopProductGrid } from '@/features/products/ui/ShopProductGrid';
import { MobileCatalog } from '@/features/products/ui/mobile/MobileCatalog';
import { buildMobileCatalogSections } from '@/features/products/ui/mobile/mobile-catalog-sections';
import { getActivePlainCartQuantities } from '@/features/cart/get-active-plain-quantities';
import { getWishlistProductIds } from '@/features/wishlist/queries';
import { getCurrentUser } from '@/lib/auth/session';
import { isLocale, type Locale } from '@/lib/i18n/config';
import { getDictionary } from '@/lib/i18n/get-dictionary';
import { createDisplayPriceFormatter, getSelectedCurrency } from '@/lib/money/display-price';
import type { Currency } from '@/lib/money/currency';

/** Mobile “All” has no infinite scroll, so it needs every page in shop order. */
async function loadRemainingCatalogPages(
  locale: Locale,
  filters: CatalogFilters,
  currency: Currency,
  firstPage: CatalogListResult,
): Promise<CatalogProduct[]> {
  const pageCount = Math.ceil(firstPage.total / firstPage.pageSize);
  if (pageCount <= 1) return firstPage.products;

  const rest = await Promise.all(
    Array.from({ length: pageCount - 1 }, (_, index) =>
      listCatalogProducts(locale, { ...filters, page: index + 2 }, currency),
    ),
  );

  return [firstPage.products, ...rest.map((page) => page.products)].flat();
}

type ProductsPageProps = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function ProductsPage({ params, searchParams }: ProductsPageProps) {
  const { locale: rawLocale } = await params;
  const raw = await searchParams;

  if (!isLocale(rawLocale)) {
    notFound();
  }

  const filters = { ...parseCatalogSearchParams(raw), page: 1 };
  const dictionary = getDictionary(rawLocale);
  const catalogCopy = dictionary.catalog;
  const currency = await getSelectedCurrency();
  const [user, categoryOptions, catalog] = await Promise.all([
    getCurrentUser(),
    listStorefrontCategories(rawLocale),
    listCatalogProducts(rawLocale, filters, currency),
  ]);

  const categories = categoryOptions.map((category) => ({
    slug: category.slug,
    title: category.title,
  }));

  const activeCategory = categories.find((category) => category.slug === filters.category);
  const orderedProducts = filters.category
    ? catalog.products
    : await loadRemainingCatalogPages(rawLocale, filters, currency, catalog);
  const sections: CatalogSection[] = [
    {
      slug: filters.category ?? 'all',
      title: activeCategory?.title ?? catalogCopy.title,
      products: orderedProducts,
      total: catalog.total,
    },
  ];

  const wishlistTargets = new Set(
    catalog.products
      .map((product) => product.id)
      .concat(sections.flatMap((section) => section.products.map((product) => product.id))),
  );

  const [wishlistIds, formatPrice, cartQuantities] = await Promise.all([
    getWishlistProductIds([...wishlistTargets]),
    createDisplayPriceFormatter(rawLocale, currency),
    getActivePlainCartQuantities([...wishlistTargets]),
  ]);

  const priced = catalog.products.map((product) => {
    const price = formatPrice(product.priceAmount);
    const compareAt = product.compareAtAmount != null ? formatPrice(product.compareAtAmount) : null;

    return {
      product,
      priceFormatted: price.formatted,
      compareAtFormatted: compareAt?.formatted ?? null,
    };
  });

  const mobileSections = buildMobileCatalogSections({
    locale: rawLocale,
    filters,
    sections,
    wishlistIds,
    cartQuantities,
    formatPrice: (amount) => formatPrice(amount).formatted,
    seeAllTemplate: catalogCopy.seeAllCategory,
    withSeeAll: !filters.category,
  });

  return (
    <div className="pideh-shop">
      <MobileCatalog
        locale={rawLocale}
        dictionary={dictionary}
        filters={filters}
        categories={categories}
        sections={mobileSections}
        isSignedIn={Boolean(user)}
      />

      <div className={`pt-6 pb-28 md:pt-8 md:pb-32 ${STOREFRONT_DESKTOP_ONLY} ${PAGE_CONTAINER}`}>
        <RevealOnView variants={titleSweep}>
          <h1 className="font-display mt-5 text-[clamp(3.5rem,8vw,4.875rem)] leading-[0.95] text-[#ff6b00]">
            {catalogCopy.title}
          </h1>
        </RevealOnView>
        <div className="mt-8">
          <CatalogControls
            locale={rawLocale}
            filters={filters}
            categories={categories}
            total={catalog.total}
            labels={{
              allChip: catalogCopy.allChip,
              sortAction: catalogCopy.sortAction,
              sortManual: catalogCopy.sortManual,
              sortNewest: catalogCopy.sortNewest,
              sortPriceAsc: catalogCopy.sortPriceAsc,
              sortPriceDesc: catalogCopy.sortPriceDesc,
              sortPopular: catalogCopy.sortPopular,
              removeFilter: catalogCopy.removeFilter,
              chipSearch: catalogCopy.chipSearch,
              chipCategory: catalogCopy.chipCategory,
              chipPrice: catalogCopy.chipPrice,
              chipPriceMin: catalogCopy.chipPriceMin,
              chipPriceMax: catalogCopy.chipPriceMax,
              chipInStock: catalogCopy.chipInStock,
              chipOnSale: catalogCopy.chipOnSale,
              resultsCount: catalogCopy.resultsCount,
              resultsCountOne: catalogCopy.resultsCountOne,
            }}
          >
            <ShopProductGrid
              locale={rawLocale}
              filters={filters}
              products={priced}
              total={catalog.total}
              wishlistIds={wishlistIds}
              cartQuantities={cartQuantities}
              isSignedIn={Boolean(user)}
              emptyTitle={catalogCopy.emptyTitle}
              emptyDescription={catalogCopy.emptyDescription}
              wishlistLabel={dictionary.nav.wishlist}
              orderLabel={dictionary.home.orderCta}
              outOfStockLabel={dictionary.product.outOfStock}
            />
          </CatalogControls>
        </div>
      </div>
    </div>
  );
}
