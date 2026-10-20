import 'server-only';

import { and, asc, desc, eq, gt, inArray, isNotNull, isNull, or, sql } from 'drizzle-orm';
import { unstable_cache } from 'next/cache';
import { cache } from 'react';

import { getDb } from '@/db/client';
import { categories, mediaAssets, productCategories, products, promotions } from '@/db/schema';
import { enrichCatalogProducts } from '@/features/products/application/catalog-product-enrichment';
import { listCatalogProducts } from '@/features/products/application/list-catalog-products';
import { listLinkedModifiersForProduct } from '@/features/products/application/product-modifiers';
import {
  DEFAULT_CATALOG_PAGE_SIZE,
  DEFAULT_CATALOG_SORT,
} from '@/features/products/schemas/catalog-list';
import type {
  CatalogProduct,
  ProductCategoryRef,
  ProductDetail,
  ProductGalleryImage,
} from '@/features/products/types';
import { CACHE_TAGS, PUBLIC_CACHE_REVALIDATE_SECONDS } from '@/lib/cache/tags';
import type { Locale } from '@/lib/i18n/config';
import { defaultCurrency } from '@/lib/money/currency';
import { mediaPublicUrl } from '@/lib/media/public-url';

export type {
  CatalogProduct,
  ProductCategoryRef,
  ProductDetail,
  ProductGalleryImage,
} from '@/features/products/types';

const RELATED_PRODUCTS_LIMIT = 4;
const RELATED_CATEGORY_SLUGS = ['sauces', 'drinks'] as const;
const HOME_OFFERS_LIMIT = 8;
const HOME_OFFERS_CANDIDATE_LIMIT = 48;
export const CATALOG_PAGE_SIZE = DEFAULT_CATALOG_PAGE_SIZE;

const activeCatalogWhere = and(eq(products.status, 'ACTIVE'), isNull(products.deletedAt));

/** Active products by id — used by wishlist (not shared-cache; IDs are user-specific). */
export async function getActiveProductsByIds(
  locale: Locale,
  productIds: string[],
): Promise<CatalogProduct[]> {
  if (productIds.length === 0) {
    return [];
  }

  const rows = await getDb()
    .select()
    .from(products)
    .where(and(inArray(products.id, productIds), activeCatalogWhere));

  return enrichCatalogProducts(rows, locale);
}

/** Paginated active catalog — thin wrapper over filtered catalog listing. */
export async function getActiveProductsPage(
  locale: Locale,
  page: number,
  categorySlug?: string,
): Promise<{ products: CatalogProduct[]; total: number; pageSize: number }> {
  const safePage = Number.isFinite(page) && page > 0 ? Math.floor(page) : 1;
  const result = await listCatalogProducts(
    locale,
    {
      sort: DEFAULT_CATALOG_SORT,
      page: safePage,
      pageSize: DEFAULT_CATALOG_PAGE_SIZE,
      category: categorySlug?.trim() || undefined,
    },
    defaultCurrency,
  );

  return {
    products: result.products,
    total: result.total,
    pageSize: result.pageSize,
  };
}

/** @deprecated Prefer getActiveProductsPage — kept for narrow internal callers. */
export async function getActiveProducts(locale: Locale): Promise<CatalogProduct[]> {
  const result = await getActiveProductsPage(locale, 1);
  if (result.total <= result.pageSize) {
    return result.products;
  }

  const rows = await getDb().select().from(products).where(activeCatalogWhere);
  return enrichCatalogProducts(rows, locale);
}

async function loadFeaturedProducts(locale: Locale): Promise<CatalogProduct[]> {
  const rows = await getDb()
    .select()
    .from(products)
    .where(
      and(eq(products.status, 'ACTIVE'), eq(products.isFeatured, true), isNull(products.deletedAt)),
    )
    .limit(8);

  return enrichCatalogProducts(rows, locale);
}

export async function getFeaturedProducts(locale: Locale): Promise<CatalogProduct[]> {
  return unstable_cache(async () => loadFeaturedProducts(locale), ['featured-products-v4', locale], {
    tags: [CACHE_TAGS.products],
    revalidate: PUBLIC_CACHE_REVALIDATE_SECONDS,
  })();
}

async function loadOfferProducts(locale: Locale): Promise<CatalogProduct[]> {
  const promoRows = await getDb()
    .select({
      productId: promotions.productId,
      categoryId: promotions.categoryId,
    })
    .from(promotions)
    .where(and(eq(promotions.kind, 'AUTOMATIC'), eq(promotions.isActive, true)));

  const promoProductIds = promoRows
    .map((row) => row.productId)
    .filter((id): id is string => id != null);
  const promoCategoryIds = promoRows
    .map((row) => row.categoryId)
    .filter((id): id is string => id != null);

  const categoryProductIds =
    promoCategoryIds.length > 0
      ? (
          await getDb()
            .select({ productId: productCategories.productId })
            .from(productCategories)
            .where(inArray(productCategories.categoryId, promoCategoryIds))
        ).map((row) => row.productId)
      : [];

  const targetedIds = [...new Set([...promoProductIds, ...categoryProductIds])];

  const saleCondition =
    targetedIds.length > 0
      ? or(
          and(
            isNotNull(products.compareAtAmount),
            gt(products.compareAtAmount, products.priceAmount),
          ),
          inArray(products.id, targetedIds),
        )
      : and(
          isNotNull(products.compareAtAmount),
          gt(products.compareAtAmount, products.priceAmount),
        );

  const [saleRows, recentRows] = await Promise.all([
    getDb()
      .select()
      .from(products)
      .where(and(activeCatalogWhere, saleCondition))
      .orderBy(desc(products.updatedAt))
      .limit(HOME_OFFERS_CANDIDATE_LIMIT),
    getDb()
      .select()
      .from(products)
      .where(activeCatalogWhere)
      .orderBy(desc(products.updatedAt))
      .limit(HOME_OFFERS_CANDIDATE_LIMIT),
  ]);

  const byId = new Map<string, typeof products.$inferSelect>();
  for (const row of [...saleRows, ...recentRows]) {
    if (!byId.has(row.id)) {
      byId.set(row.id, row);
    }
  }

  const enriched = await enrichCatalogProducts([...byId.values()], locale);
  return enriched
    .filter((product) => product.discountPercent != null && product.discountPercent > 0)
    .slice(0, HOME_OFFERS_LIMIT);
}

/** Active products currently on sale for the home offers section. */
export async function getOfferProducts(locale: Locale): Promise<CatalogProduct[]> {
  return unstable_cache(async () => loadOfferProducts(locale), ['offer-products', locale], {
    tags: [CACHE_TAGS.products],
    revalidate: PUBLIC_CACHE_REVALIDATE_SECONDS,
  })();
}

export async function getProductBySlug(
  locale: Locale,
  slug: string,
): Promise<CatalogProduct | null> {
  const [product] = await getDb()
    .select()
    .from(products)
    .where(
      and(
        eq(products.status, 'ACTIVE'),
        isNull(products.deletedAt),
        sql`${products.translations}->${locale}->>'slug' = ${slug}`,
      ),
    )
    .limit(1);

  if (!product) {
    return null;
  }

  const [enriched] = await enrichCatalogProducts([product], locale);
  return enriched ?? null;
}

async function loadProductGallery(
  productId: string,
  locale: Locale,
  fallbackTitle: string,
): Promise<ProductGalleryImage[]> {
  const rows = await getDb()
    .select({
      id: mediaAssets.id,
      objectKey: mediaAssets.objectKey,
      isPrimary: mediaAssets.isPrimary,
      sortOrder: mediaAssets.sortOrder,
      altTranslations: mediaAssets.altTranslations,
    })
    .from(mediaAssets)
    .where(and(eq(mediaAssets.productId, productId), eq(mediaAssets.uploadStatus, 'READY')))
    .orderBy(asc(mediaAssets.sortOrder));

  return rows
    .map((row) => ({
      id: row.id,
      url: mediaPublicUrl(row.objectKey),
      alt: row.altTranslations?.[locale] ?? fallbackTitle,
      isPrimary: row.isPrimary,
    }))
    .sort((a, b) => Number(b.isPrimary) - Number(a.isPrimary));
}

async function loadProductCategories(
  productId: string,
  locale: Locale,
): Promise<ProductCategoryRef[]> {
  const rows = await getDb()
    .select({
      id: categories.id,
      translations: categories.translations,
      isPrimary: productCategories.isPrimary,
      sortOrder: productCategories.sortOrder,
    })
    .from(productCategories)
    .innerJoin(categories, eq(productCategories.categoryId, categories.id))
    .where(
      and(
        eq(productCategories.productId, productId),
        eq(categories.status, 'ACTIVE'),
        isNull(categories.deletedAt),
      ),
    )
    .orderBy(asc(productCategories.sortOrder));

  return rows
    .map((row) => {
      const translation = row.translations[locale] ?? row.translations.hy;
      if (!translation) return null;
      return {
        id: row.id,
        title: translation.title,
        slug: translation.slug,
      } satisfies ProductCategoryRef;
    })
    .filter((row): row is ProductCategoryRef => row !== null);
}

async function loadProductDetailBySlug(
  locale: Locale,
  slug: string,
): Promise<ProductDetail | null> {
  const product = await getProductBySlug(locale, slug);
  if (!product) {
    return null;
  }

  const [images, productCats, linkedModifiers] = await Promise.all([
    loadProductGallery(product.id, locale, product.translation.title),
    loadProductCategories(product.id, locale),
    listLinkedModifiersForProduct(product.id),
  ]);

  const gallery =
    images.length > 0
      ? images
      : product.imageUrl
        ? [
            {
              id: product.id,
              url: product.imageUrl,
              alt: product.translation.title,
              isPrimary: true,
            },
          ]
        : [];

  return {
    ...product,
    images: gallery,
    categories: productCats,
    additions: linkedModifiers
      .filter((row) => row.kind === 'ADDITION')
      .map((row) => ({
        id: row.id,
        name: row.name,
        priceAmount: row.priceAmount,
      })),
    exceptions: linkedModifiers
      .filter((row) => row.kind === 'EXCEPTION')
      .map((row) => ({
        id: row.id,
        name: row.name,
        priceAmount: 0,
      })),
  };
}

/** Full PDP payload — request-deduped; tagged per-slug so edits don't bust other PDPs. */
export const getProductDetailBySlug = cache(
  async (locale: Locale, slug: string): Promise<ProductDetail | null> => {
    return unstable_cache(
      async () => loadProductDetailBySlug(locale, slug),
      ['product-detail-v4', locale, slug],
      {
        tags: [CACHE_TAGS.productDetail, CACHE_TAGS.productSlug(locale, slug)],
        revalidate: PUBLIC_CACHE_REVALIDATE_SECONDS,
      },
    )();
  },
);

function upsellCategoryMatch() {
  const matches = (['hy', 'en', 'ru'] as const).map((locale) => {
    const slugList = sql.join(
      RELATED_CATEGORY_SLUGS.map((slug) => sql`${slug}`),
      sql`, `,
    );
    return sql`${categories.translations}->${locale}->>'slug' in (${slugList})`;
  });

  return sql`(${sql.join(matches, sql` OR `)})`;
}

function pickRandomIds(ids: string[], limit: number): string[] {
  const unique = [...new Set(ids)];
  for (let index = unique.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    const current = unique[index];
    const swap = unique[swapIndex];
    if (current === undefined || swap === undefined) {
      continue;
    }
    unique[index] = swap;
    unique[swapIndex] = current;
  }
  return unique.slice(0, limit);
}

/** Sauces and drinks shown under a product. The current product is left out. */
export const getRelatedProducts = cache(async function getRelatedProducts(
  locale: Locale,
  productId: string,
): Promise<CatalogProduct[]> {
  const links = await getDb()
    .select({ productId: products.id })
    .from(products)
    .innerJoin(productCategories, eq(productCategories.productId, products.id))
    .innerJoin(categories, eq(categories.id, productCategories.categoryId))
    .where(
      and(
        activeCatalogWhere,
        sql`${products.id} <> ${productId}`,
        eq(categories.status, 'ACTIVE'),
        isNull(categories.deletedAt),
        upsellCategoryMatch(),
      ),
    );

  const relatedIds = pickRandomIds(
    links.map((link) => link.productId),
    RELATED_PRODUCTS_LIMIT,
  );

  if (relatedIds.length === 0) {
    return [];
  }

  const rows = await getDb()
    .select()
    .from(products)
    .where(and(inArray(products.id, relatedIds), activeCatalogWhere));
  const byId = new Map(rows.map((row) => [row.id, row]));
  const ordered = relatedIds.flatMap((id) => {
    const row = byId.get(id);
    return row ? [row] : [];
  });

  return enrichCatalogProducts(ordered, locale);
});
