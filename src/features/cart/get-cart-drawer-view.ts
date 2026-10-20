import 'server-only';

import { and, asc, eq, inArray, or } from 'drizzle-orm';

import { getCartItemCount, getCartWithItems } from '@/features/cart/cart';
import { previewCartEarnPoints } from '@/features/cart/preview-cart-earn-points';
import { peekCartOrderMode } from '@/features/cart/order-mode';
import type { CartOrderMode } from '@/features/cart/order-mode';
import { getDb } from '@/db/client';
import { mediaAssets } from '@/db/schema';
import { sumAdditionPrices } from '@/features/products/domain/modifier-selection';
import { resolveProductPrices } from '@/features/promotions/application/resolve-product-prices';
import type { Locale } from '@/lib/i18n/config';
import { getCheckoutRateSnapshot } from '@/lib/fx/service';
import { mediaPublicUrl } from '@/lib/media/public-url';
import { convertAmount } from '@/lib/money/convert';
import type { Currency } from '@/lib/money/currency';
import { defaultCurrency } from '@/lib/money/currency';
import { formatMoneyAmount } from '@/lib/money/format';

export type CartDrawerItemView = {
  id: string;
  title: string;
  /** Product page. Null when the line has no storefront slug. */
  href: string | null;
  quantity: number;
  imageUrl: string | null;
  unitPriceFormatted: string;
  lineTotalFormatted: string;
  modifierSummary: string | null;
};

export type CartDrawerView = {
  source: 'cart' | 'group';
  groupInviteToken: string | null;
  checkoutHref: string;
  itemCount: number;
  items: CartDrawerItemView[];
  subtotalFormatted: string;
  shippingFormatted: string;
  totalFormatted: string;
  subtotalAmount: number;
  shippingAmount: number;
  totalAmount: number;
  /** Loyalty points credited after delivery. 0 for guests and empty carts. */
  earnPoints: number;
  currency: Currency;
};

/** Group session plus the personal cart, so the drawer can offer both. */
export type CartDrawerBundle = {
  group: CartDrawerView | null;
  personal: CartDrawerView;
  orderMode: CartOrderMode;
};

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

function convertDisplayAmount(
  baseAmountAmd: number,
  rate: string,
  currency: Currency,
  locale: Locale,
): { amount: number; formatted: string } {
  const converted = convertAmount(baseAmountAmd, rate, defaultCurrency, currency);
  return {
    amount: Number(converted.amount),
    formatted: formatMoneyAmount(converted.amount, currency, locale),
  };
}

/** Header/mobile badge — group-order session takes precedence over personal cart. */
export async function getStorefrontCartItemCount(): Promise<number> {
  const { getActiveGroupSessionItemCount } =
    await import('@/features/group-orders/application/active-session-cart');
  if ((await peekCartOrderMode()) === 'group') {
    const groupCount = await getActiveGroupSessionItemCount();
    if (groupCount != null) {
      return groupCount;
    }
  }
  return getCartItemCount();
}

/** Builds the group session and the personal cart together. */
export async function getCartDrawerView(
  locale: Locale,
  currency: Currency,
): Promise<CartDrawerBundle> {
  const { getActiveGroupSessionCartView } =
    await import('@/features/group-orders/application/active-session-cart');
  const [group, personal, orderMode] = await Promise.all([
    getActiveGroupSessionCartView(locale, currency),
    buildPersonalCartDrawerView(locale, currency),
    peekCartOrderMode(),
  ]);
  return { group, personal, orderMode: group ? orderMode : 'personal' };
}

async function buildPersonalCartDrawerView(
  locale: Locale,
  currency: Currency,
): Promise<CartDrawerView> {
  const { items: rows } = await getCartWithItems();
  const [images, quote, prices] = await Promise.all([
    loadPrimaryProductImages(rows.map(({ product }) => product.id)),
    getCheckoutRateSnapshot(currency),
    resolveProductPrices(
      rows.map(({ product }) => ({
        id: product.id,
        priceAmount: product.priceAmount,
        compareAtAmount: product.compareAtAmount,
      })),
    ),
  ]);

  const items: CartDrawerItemView[] = [];
  let subtotalBase = 0;

  for (const { item, product, modifiers } of rows) {
    const translation = product.translations[locale] ?? product.translations.hy;
    const baseUnit = prices.get(product.id)?.unitAmount ?? product.priceAmount;
    const unitAmount = baseUnit + sumAdditionPrices(modifiers);
    const additions = modifiers.filter((row) => row.kind === 'ADDITION');
    const exceptions = modifiers.filter((row) => row.kind === 'EXCEPTION');
    const parts: string[] = [];
    if (additions.length > 0) {
      parts.push(`+ ${additions.map((row) => row.name).join(', ')}`);
    }
    if (exceptions.length > 0) {
      parts.push(`− ${exceptions.map((row) => row.name).join(', ')}`);
    }

    items.push({
      id: item.id,
      title: translation?.title ?? product.sku,
      href: translation?.slug ? `/${locale}/products/${translation.slug}` : null,
      quantity: item.quantity,
      imageUrl: images.get(product.id) ?? null,
      unitPriceFormatted: convertDisplayAmount(unitAmount, quote.rate, currency, locale).formatted,
      lineTotalFormatted: convertDisplayAmount(
        unitAmount * item.quantity,
        quote.rate,
        currency,
        locale,
      ).formatted,
      modifierSummary: parts.length > 0 ? parts.join(' · ') : null,
    });
    subtotalBase += item.quantity * unitAmount;
  }

  const subtotal = convertDisplayAmount(subtotalBase, quote.rate, currency, locale);
  const earnPoints = await previewCartEarnPoints(subtotalBase);

  return {
    source: 'cart',
    groupInviteToken: null,
    checkoutHref: `/${locale}/checkout`,
    itemCount: items.reduce((sum, item) => sum + item.quantity, 0),
    items,
    subtotalFormatted: subtotal.formatted,
    shippingFormatted: formatMoneyAmount(0, currency, locale),
    totalFormatted: subtotal.formatted,
    subtotalAmount: subtotal.amount,
    shippingAmount: 0,
    totalAmount: subtotal.amount,
    earnPoints,
    currency,
  };
}
