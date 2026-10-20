import 'server-only';

import { and, asc, eq, inArray, or } from 'drizzle-orm';

import { getDb } from '@/db/client';
import { mediaAssets } from '@/db/schema';
import { cartLineUnitAmount } from '@/features/cart/domain/line-price';
import type { CartItemWithProduct } from '@/features/cart/cart';
import type { CheckoutOrderProduct } from '@/features/checkout/ui/checkout-order-product';
import type { Locale } from '@/lib/i18n/config';
import { mediaPublicUrl } from '@/lib/media/public-url';
import { defaultCurrency } from '@/lib/money/currency';
import { formatMoneyAmount } from '@/lib/money/format';

export type { CheckoutOrderProduct };

async function loadPrimaryProductImages(productIds: string[]): Promise<Map<string, string>> {
  const map = new Map<string, string>();
  if (productIds.length === 0) {
    return map;
  }

  const rows = await getDb()
    .select({
      productId: mediaAssets.productId,
      objectKey: mediaAssets.objectKey,
    })
    .from(mediaAssets)
    .where(
      and(
        inArray(mediaAssets.productId, productIds),
        eq(mediaAssets.uploadStatus, 'READY'),
        or(eq(mediaAssets.isPrimary, true), eq(mediaAssets.role, 'PRIMARY')),
      ),
    )
    .orderBy(asc(mediaAssets.sortOrder));

  for (const row of rows) {
    if (!row.productId || map.has(row.productId)) {
      continue;
    }
    map.set(row.productId, mediaPublicUrl(row.objectKey));
  }

  return map;
}

/** Builds checkout “products in your order” display rows from cart lines. */
export async function getCheckoutOrderProducts(
  locale: Locale,
  rows: CartItemWithProduct[],
  unitAmounts: ReadonlyMap<string, number>,
): Promise<CheckoutOrderProduct[]> {
  const images = await loadPrimaryProductImages(rows.map(({ product }) => product.id));

  return rows.map(({ item, product, modifiers }) => {
    const translation = product.translations[locale] ?? product.translations.hy;
    const parts: string[] = [];
    const additions = modifiers.filter((row) => row.kind === 'ADDITION');
    const exceptions = modifiers.filter((row) => row.kind === 'EXCEPTION');
    if (additions.length > 0) {
      parts.push(`+ ${additions.map((row) => row.name).join(', ')}`);
    }
    if (exceptions.length > 0) {
      parts.push(`− ${exceptions.map((row) => row.name).join(', ')}`);
    }
    const unitAmount = unitAmounts.get(product.id) ?? product.priceAmount;
    return {
      id: item.id,
      title: translation?.title ?? product.sku,
      quantity: item.quantity,
      imageUrl: images.get(product.id) ?? null,
      modifierSummary: parts.length > 0 ? parts.join(' · ') : null,
      lineTotalFormatted: formatMoneyAmount(
        item.quantity * cartLineUnitAmount(unitAmount, modifiers),
        defaultCurrency,
        locale,
      ),
    };
  });
}
