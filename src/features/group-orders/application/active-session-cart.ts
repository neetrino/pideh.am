import 'server-only';

import { and, eq, inArray, sql } from 'drizzle-orm';

import { getDb } from '@/db/client';
import {
  groupOrderItemModifiers,
  groupOrderItems,
  groupOrderParticipants,
  groupOrders,
  mediaAssets,
  products,
} from '@/db/schema';
import type { CartDrawerView } from '@/features/cart/get-cart-drawer-view';
import { previewCartEarnPoints } from '@/features/cart/preview-cart-earn-points';
import { peekGroupOrderSession } from '@/features/group-orders/session';
import type { Locale } from '@/lib/i18n/config';
import { getCheckoutRateSnapshot } from '@/lib/fx/service';
import { mediaPublicUrl } from '@/lib/media/public-url';
import { defaultCurrency } from '@/lib/money/currency';
import { convertAmount } from '@/lib/money/convert';
import type { Currency } from '@/lib/money/currency';
import { formatMoneyAmount } from '@/lib/money/format';

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

async function loadActiveGroupParticipant(): Promise<{
  inviteToken: string;
  participantId: string;
  groupOrderId: string;
} | null> {
  const session = await peekGroupOrderSession();
  if (!session.inviteToken || !session.participantId) {
    return null;
  }

  const [row] = await getDb()
    .select({
      inviteToken: groupOrders.inviteToken,
      groupOrderId: groupOrders.id,
      participantId: groupOrderParticipants.id,
    })
    .from(groupOrderParticipants)
    .innerJoin(groupOrders, eq(groupOrderParticipants.groupOrderId, groupOrders.id))
    .where(
      and(
        eq(groupOrders.inviteToken, session.inviteToken),
        eq(groupOrderParticipants.id, session.participantId),
        eq(groupOrderParticipants.status, 'ACTIVE'),
      ),
    )
    .limit(1);

  return row ?? null;
}

/** Item count for the header badge while a group-order session is active. */
export async function getActiveGroupSessionItemCount(): Promise<number | null> {
  const active = await loadActiveGroupParticipant();
  if (!active) return null;

  const [row] = await getDb()
    .select({
      total: sql<number>`coalesce(sum(${groupOrderItems.quantity}), 0)::int`,
    })
    .from(groupOrderItems)
    .where(eq(groupOrderItems.participantId, active.participantId));

  return row?.total ?? 0;
}

/** Cart-drawer payload for the current group-order participant, if any. */
export async function getActiveGroupSessionCartView(
  locale: Locale,
  currency: Currency,
): Promise<CartDrawerView | null> {
  const active = await loadActiveGroupParticipant();
  if (!active) return null;

  const db = getDb();
  const rows = await db
    .select({
      item: groupOrderItems,
      product: products,
    })
    .from(groupOrderItems)
    .innerJoin(products, eq(groupOrderItems.productId, products.id))
    .where(eq(groupOrderItems.participantId, active.participantId));

  const itemIds = rows.map((row) => row.item.id);
  const modifierRows =
    itemIds.length === 0
      ? []
      : await db
          .select()
          .from(groupOrderItemModifiers)
          .where(inArray(groupOrderItemModifiers.groupOrderItemId, itemIds));

  const modifiersByItem = new Map<string, string[]>();
  for (const row of modifierRows) {
    const list = modifiersByItem.get(row.groupOrderItemId) ?? [];
    list.push(row.nameSnapshot);
    modifiersByItem.set(row.groupOrderItemId, list);
  }

  const productIds = [...new Set(rows.map((row) => row.product.id))];
  const mediaRows =
    productIds.length === 0
      ? []
      : await db
          .select({
            productId: mediaAssets.productId,
            objectKey: mediaAssets.objectKey,
          })
          .from(mediaAssets)
          .where(
            and(
              inArray(mediaAssets.productId, productIds),
              eq(mediaAssets.role, 'PRIMARY'),
              eq(mediaAssets.uploadStatus, 'READY'),
            ),
          );

  const imageByProduct = new Map<string, string>();
  for (const row of mediaRows) {
    if (row.productId && !imageByProduct.has(row.productId)) {
      imageByProduct.set(row.productId, mediaPublicUrl(row.objectKey));
    }
  }

  const quote = await getCheckoutRateSnapshot(currency);
  let subtotalBase = 0;
  const items = rows.map((row) => {
    const translation = row.product.translations[locale] ?? row.product.translations.hy;
    subtotalBase += row.item.lineTotalAmount;
    const names = modifiersByItem.get(row.item.id) ?? [];
    return {
      id: row.item.id,
      title: translation?.title ?? row.product.sku,
      href: translation?.slug ? `/${locale}/products/${translation.slug}` : null,
      quantity: row.item.quantity,
      imageUrl: imageByProduct.get(row.product.id) ?? null,
      unitPriceFormatted: convertDisplayAmount(row.item.unitAmount, quote.rate, currency, locale)
        .formatted,
      lineTotalFormatted: convertDisplayAmount(
        row.item.lineTotalAmount,
        quote.rate,
        currency,
        locale,
      ).formatted,
      modifierSummary: names.length > 0 ? names.join(', ') : null,
    };
  });

  const subtotal = convertDisplayAmount(subtotalBase, quote.rate, currency, locale);
  const earnPoints = await previewCartEarnPoints(subtotalBase);

  return {
    source: 'group',
    groupInviteToken: active.inviteToken,
    checkoutHref: `/${locale}/group-orders/${active.inviteToken}`,
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
