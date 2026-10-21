import 'server-only';

import { and, eq, isNull, or, sql } from 'drizzle-orm';
import { unstable_cache } from 'next/cache';

import { getDb } from '@/db/client';
import { categories, mediaAssets, productCategories, products } from '@/db/schema';
import {
  resolveOrbitPidePhotos,
  type OrbitPideImageRow,
  type OrbitPidePhoto,
} from '@/features/home/application/orbit-pide-images';
import { CACHE_TAGS, PUBLIC_CACHE_REVALIDATE_SECONDS } from '@/lib/cache/tags';
import type { Locale } from '@/lib/i18n/config';
import { mediaPublicUrl } from '@/lib/media/public-url';

function productSlug(translations: (typeof products.$inferSelect)['translations']): string {
  return translations.en?.slug ?? translations.hy?.slug ?? translations.ru?.slug ?? '';
}

function productTitle(
  translations: (typeof products.$inferSelect)['translations'],
  locale: Locale,
): string {
  return (
    translations[locale]?.title ??
    translations.hy?.title ??
    translations.en?.title ??
    translations.ru?.title ??
    ''
  ).trim();
}

async function loadOrbitPideImageRows(locale: Locale): Promise<OrbitPideImageRow[]> {
  const rows = await getDb()
    .select({
      translations: products.translations,
      objectKey: mediaAssets.objectKey,
    })
    .from(products)
    .innerJoin(productCategories, eq(productCategories.productId, products.id))
    .innerJoin(categories, eq(categories.id, productCategories.categoryId))
    .innerJoin(mediaAssets, eq(mediaAssets.productId, products.id))
    .where(
      and(
        eq(products.status, 'ACTIVE'),
        isNull(products.deletedAt),
        eq(mediaAssets.uploadStatus, 'READY'),
        or(eq(mediaAssets.isPrimary, true), eq(mediaAssets.role, 'PRIMARY')),
        sql`(
          ${categories.translations}->'hy'->>'slug' = 'pide'
          OR ${categories.translations}->'en'->>'slug' = 'pide'
        )`,
      ),
    );

  return rows
    .map((row) => ({
      slug: productSlug(row.translations),
      url: mediaPublicUrl(row.objectKey),
      title: productTitle(row.translations, locale),
    }))
    .filter((row) => row.slug.length > 0);
}

/** Distinct pide product photos and names for the desktop categories orbit. */
export async function listOrbitPidePhotos(locale: Locale): Promise<OrbitPidePhoto[]> {
  return unstable_cache(
    async () => resolveOrbitPidePhotos(await loadOrbitPideImageRows(locale)),
    ['orbit-pide-photos-v2', locale],
    {
      tags: [CACHE_TAGS.products],
      revalidate: PUBLIC_CACHE_REVALIDATE_SECONDS,
    },
  )();
}
