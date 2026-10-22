import 'server-only';

import {
  and,
  asc,
  desc,
  eq,
  getTableColumns,
  gte,
  gt,
  isNotNull,
  isNull,
  lte,
  sql,
  type SQL,
} from 'drizzle-orm';
import { unstable_cache } from 'next/cache';

import { getDb } from '@/db/client';
import { categories, orderItems, productCategories, products } from '@/db/schema';
import { enrichCatalogProducts } from '@/features/products/application/catalog-product-enrichment';
import type { CatalogFilters } from '@/features/products/schemas/catalog-list';
import type { CatalogProduct } from '@/features/products/types';
import { CACHE_TAGS, PUBLIC_CACHE_REVALIDATE_SECONDS } from '@/lib/cache/tags';
import { getCheckoutRateSnapshot } from '@/lib/fx/service';
import type { Locale } from '@/lib/i18n/config';
import { convertAmountToBase } from '@/lib/money/convert';
import type { Currency } from '@/lib/money/currency';
import { defaultCurrency } from '@/lib/money/currency';
import { getCurrencyMeta } from '@/lib/money/currency-meta';

export type CatalogListResult = {
  products: CatalogProduct[];
  total: number;
  pageSize: number;
  page: number;
};

const activeCatalogWhere = and(eq(products.status, 'ACTIVE'), isNull(products.deletedAt));

function displayMajorToBaseAmd(
  majorUnits: number,
  displayCurrency: Currency,
  rate: string,
): number {
  const scale = getCurrencyMeta(displayCurrency).scale;
  const minor = BigInt(majorUnits) * 10n ** BigInt(scale);
  const base = convertAmountToBase(minor, rate, displayCurrency, defaultCurrency);
  return Number(base.amount);
}

async function resolveActiveCategoryIdBySlug(locale: Locale, slug: string): Promise<string | null> {
  const normalized = slug.trim();
  if (!normalized) {
    return null;
  }

  const [row] = await getDb()
    .select({ id: categories.id })
    .from(categories)
    .where(
      and(
        eq(categories.status, 'ACTIVE'),
        isNull(categories.deletedAt),
        sql`${categories.translations}->${locale}->>'slug' = ${normalized}`,
      ),
    )
    .limit(1);

  return row?.id ?? null;
}

async function buildWhere(
  locale: Locale,
  filters: CatalogFilters,
  minPriceAmd: number | undefined,
  maxPriceAmd: number | undefined,
): Promise<SQL | undefined> {
  const conditions: SQL[] = [activeCatalogWhere as SQL];

  if (filters.q) {
    const pattern = `%${filters.q}%`;
    conditions.push(
      sql`(
        ${products.translations}->${locale}->>'title' ILIKE ${pattern}
        OR ${products.translations}->${locale}->>'slug' ILIKE ${pattern}
        OR ${products.sku} ILIKE ${pattern}
      )`,
    );
  }

  if (minPriceAmd != null) {
    conditions.push(gte(products.priceAmount, minPriceAmd));
  }
  if (maxPriceAmd != null) {
    conditions.push(lte(products.priceAmount, maxPriceAmd));
  }

  if (filters.inStock) {
    conditions.push(gt(products.stockOnHand, 0));
  }

  if (filters.onSale) {
    conditions.push(
      and(
        isNotNull(products.compareAtAmount),
        gt(products.compareAtAmount, products.priceAmount),
      ) as SQL,
    );
  }

  if (filters.category) {
    const categoryId = await resolveActiveCategoryIdBySlug(locale, filters.category);
    if (!categoryId) {
      return sql`false`;
    }

    conditions.push(
      sql`exists (
        select 1 from ${productCategories}
        where ${productCategories.productId} = ${products.id}
          and ${productCategories.categoryId} = ${categoryId}
      )`,
    );
  }

  return and(...conditions);
}

function orderByClause(sort: CatalogFilters['sort'], soldExpr: SQL) {
  switch (sort) {
    case 'price_asc':
      return [asc(products.priceAmount), desc(products.createdAt), desc(products.id)] as const;
    case 'price_desc':
      return [desc(products.priceAmount), desc(products.createdAt), desc(products.id)] as const;
    case 'popular':
      return [desc(soldExpr), desc(products.createdAt), desc(products.id)] as const;
    case 'newest':
      return [desc(products.createdAt), desc(products.id)] as const;
    case 'manual':
    default:
      return [asc(products.sortOrder), desc(products.createdAt), desc(products.id)] as const;
  }
}

async function loadCatalogProductsPage(
  locale: Locale,
  filters: CatalogFilters,
  displayCurrency: Currency,
): Promise<CatalogListResult> {
  const quote = await getCheckoutRateSnapshot(displayCurrency);
  const minPriceAmd =
    filters.minPrice != null
      ? displayMajorToBaseAmd(filters.minPrice, displayCurrency, quote.rate)
      : undefined;
  const maxPriceAmd =
    filters.maxPrice != null
      ? displayMajorToBaseAmd(filters.maxPrice, displayCurrency, quote.rate)
      : undefined;

  const where = await buildWhere(locale, filters, minPriceAmd, maxPriceAmd);
  const offset = (filters.page - 1) * filters.pageSize;

  const popularity = getDb()
    .select({
      productId: orderItems.productId,
      sold: sql<number>`coalesce(sum(${orderItems.quantity}), 0)::int`.as('sold'),
    })
    .from(orderItems)
    .where(isNotNull(orderItems.productId))
    .groupBy(orderItems.productId)
    .as('popularity');

  const soldExpr = sql`coalesce(${popularity.sold}, 0)`;
  const orderBy = orderByClause(filters.sort, soldExpr);

  const [[countRow], rows] = await Promise.all([
    getDb()
      .select({ count: sql<number>`count(*)::int` })
      .from(products)
      .where(where),
    filters.sort === 'popular'
      ? getDb()
          .select(getTableColumns(products))
          .from(products)
          .leftJoin(popularity, eq(products.id, popularity.productId))
          .where(where)
          .orderBy(...orderBy)
          .limit(filters.pageSize)
          .offset(offset)
      : getDb()
          .select()
          .from(products)
          .where(where)
          .orderBy(...orderBy)
          .limit(filters.pageSize)
          .offset(offset),
  ]);

  const enriched = await enrichCatalogProducts(rows, locale);

  return {
    products: enriched,
    total: countRow?.count ?? 0,
    pageSize: filters.pageSize,
    page: filters.page,
  };
}

/**
 * Paginated storefront catalog with URL-driven filters and stable sort (CAT-001/005).
 * Price bounds are interpreted in the shopper's display currency, then converted to AMD.
 */
export async function listCatalogProducts(
  locale: Locale,
  filters: CatalogFilters,
  displayCurrency: Currency,
): Promise<CatalogListResult> {
  const cacheKey = [
    'catalog-products-page-v6',
    locale,
    displayCurrency,
    filters.q ?? '',
    String(filters.minPrice ?? ''),
    String(filters.maxPrice ?? ''),
    filters.category ?? '',
    filters.inStock ? '1' : '0',
    filters.onSale ? '1' : '0',
    filters.sort,
    String(filters.page),
    String(filters.pageSize),
  ];

  return unstable_cache(
    async () => loadCatalogProductsPage(locale, filters, displayCurrency),
    cacheKey,
    {
      tags: [CACHE_TAGS.products, CACHE_TAGS.categories],
      revalidate: PUBLIC_CACHE_REVALIDATE_SECONDS,
    },
  )();
}
