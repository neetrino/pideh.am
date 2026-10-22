import 'server-only';

import { eq } from 'drizzle-orm';

import { getDb } from '@/db/client';
import { orders } from '@/db/schema';
import {
  deleteAdminPushSubscriptionsByIds,
  listActiveAdminPushSubscriptions,
  type AdminPushSubscriptionRow,
} from '@/features/orders/application/admin-push-subscriptions';
import { defaultLocale, isLocale } from '@/lib/i18n/config';
import { getDictionary } from '@/lib/i18n/get-dictionary';
import type { Currency } from '@/lib/money/currency';
import { formatMoneyAmount } from '@/lib/money/format';
import { logger } from '@/lib/observability/logger';
import { getWebPushPublicKey, sendWebPush } from '@/lib/push/web-push-sender';

type OrderSummary = {
  orderNumber: string;
  contactName: string;
  totalAmount: number;
  baseCurrency: string;
};

/** Shape consumed by `public/admin-push-sw.js`. */
type AdminOrderPushPayload = {
  title: string;
  body: string;
  url: string;
  tag: string;
};

async function loadOrderSummary(orderNumber: string): Promise<OrderSummary | null> {
  const [row] = await getDb()
    .select({
      orderNumber: orders.orderNumber,
      contactName: orders.contactName,
      totalAmount: orders.totalAmount,
      baseCurrency: orders.baseCurrency,
    })
    .from(orders)
    .where(eq(orders.orderNumber, orderNumber))
    .limit(1);
  return row ?? null;
}

function buildPayload(order: OrderSummary, rawLocale: string): AdminOrderPushPayload {
  const locale = isLocale(rawLocale) ? rawLocale : defaultLocale;
  const copy = getDictionary(locale).admin.orders.newOrderAlert;
  const total = formatMoneyAmount(order.totalAmount, order.baseCurrency as Currency, locale);

  return {
    title: copy.orderTitle.replace('{orderNumber}', order.orderNumber),
    body: `${order.contactName} · ${total}`,
    url: `/${locale}/admin/orders?new=1`,
    tag: `admin-new-order-${order.orderNumber}`,
  };
}

async function deliver(subscription: AdminPushSubscriptionRow, order: OrderSummary) {
  return sendWebPush(
    { endpoint: subscription.endpoint, keys: { p256dh: subscription.p256dh, auth: subscription.auth } },
    JSON.stringify(buildPayload(order, subscription.locale)),
  );
}

/**
 * Pushes a new-order notification to every subscribed admin browser.
 * Never throws: checkout must not fail because of notification delivery.
 */
export async function notifyAdminsOfNewOrder(orderNumber: string): Promise<void> {
  if (!getWebPushPublicKey()) return;

  try {
    const [order, subscriptions] = await Promise.all([
      loadOrderSummary(orderNumber),
      listActiveAdminPushSubscriptions(),
    ]);
    if (!order || subscriptions.length === 0) return;

    const results = await Promise.allSettled(subscriptions.map((sub) => deliver(sub, order)));
    const expiredIds: string[] = [];

    results.forEach((result, index) => {
      const subscription = subscriptions[index];
      if (!subscription) return;
      if (result.status === 'fulfilled') {
        if (result.value === 'expired') expiredIds.push(subscription.id);
        return;
      }
      logger.warn('admin_push.delivery_failed', {
        orderNumber,
        subscriptionId: subscription.id,
        error: result.reason instanceof Error ? result.reason.message : 'unknown',
      });
    });

    await deleteAdminPushSubscriptionsByIds(expiredIds);
  } catch (error) {
    logger.error('admin_push.notify_failed', {
      orderNumber,
      error: error instanceof Error ? error.message : 'unknown',
    });
  }
}
