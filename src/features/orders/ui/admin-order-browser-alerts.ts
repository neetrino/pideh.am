'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';

import type { AdminUnseenOrderAlert } from '@/features/orders/application/queries';
import type { Dictionary } from '@/lib/i18n/get-dictionary';
import type { Currency } from '@/lib/money/currency';
import { formatMoneyAmount } from '@/lib/money/format';

type AlertCopy = Dictionary['admin']['orders']['newOrderAlert'];

/** Shared with Web Push notifications so both channels collapse into one per order. */
const NOTIFICATION_TAG_PREFIX = 'admin-new-order-';
const TITLE_BADGE_PATTERN = /^\(\d+\)\s/;

function notificationsSupported(): boolean {
  return typeof window !== 'undefined' && 'Notification' in window;
}

/**
 * Shows an OS-level notification for a new order while the admin tab is hidden,
 * so the alert is visible from other tabs and applications.
 */
export function showNewOrderSystemNotification(
  order: AdminUnseenOrderAlert,
  copy: AlertCopy,
  locale: string,
  waitingCount: number,
): void {
  if (!notificationsSupported() || Notification.permission !== 'granted') return;
  if (document.visibilityState === 'visible') return;

  const total = formatMoneyAmount(order.totalAmount, order.baseCurrency as Currency, locale);
  const notification = new Notification(
    copy.orderTitle.replace('{orderNumber}', order.orderNumber),
    {
      body: `${copy.header.replace('{count}', String(waitingCount))}\n${order.contactName} · ${total}`,
      tag: `${NOTIFICATION_TAG_PREFIX}${order.orderNumber}`,
      requireInteraction: true,
    },
  );
  notification.onclick = () => {
    window.focus();
    notification.close();
  };
}

/** Prefixes the document title with the unseen order count, e.g. "(2) Admin". */
export function useUnseenOrdersTitleBadge(count: number): void {
  const pathname = usePathname();

  useEffect(() => {
    const baseTitle = document.title.replace(TITLE_BADGE_PATTERN, '');
    document.title = count > 0 ? `(${count}) ${baseTitle}` : baseTitle;
  }, [count, pathname]);

  useEffect(
    () => () => {
      document.title = document.title.replace(TITLE_BADGE_PATTERN, '');
    },
    [],
  );
}
