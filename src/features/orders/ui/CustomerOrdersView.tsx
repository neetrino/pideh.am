'use client';

import { useEffect, useRef, useState, useTransition } from 'react';

import type { AdminOrderDetailView } from '@/features/orders/application/order-detail-view';
import { getCustomerOrderDetailAction } from '@/features/orders/application/get-customer-order-detail';
import { CustomerOrdersTable } from '@/features/orders/ui/CustomerOrdersTable';
import { OrderDetailsDrawer } from '@/features/orders/ui/OrderDetailsDrawer';
import { isLocale, type Locale } from '@/lib/i18n/config';
import type { Dictionary } from '@/lib/i18n/get-dictionary';

type CustomerOrdersViewOrder = {
  id: string;
  orderNumber: string;
  status: string;
  paymentStatus: string;
  totalAmount: number;
  bonusRedeemedAmount: number;
  bonusEarnedAmount: number;
  baseCurrency: string;
  placedAt: string | Date;
  itemCount: number;
  customerReviewRating?: number | null;
};

type CustomerOrdersViewProps = {
  locale: string;
  orders: CustomerOrdersViewOrder[];
  copy: Dictionary['admin'];
  labels: {
    orderNumber: string;
    noOrders: string;
    orderPlaced: string;
    orderItemsOne: string;
    orderItemsMany: string;
    rateOrder: string;
  };
  /** When set (e.g. from bonuses history), open this order on mount. */
  initialOrderNumber?: string;
};

export function CustomerOrdersView({
  locale,
  orders,
  copy,
  labels,
  initialOrderNumber,
}: CustomerOrdersViewProps) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [detail, setDetail] = useState<AdminOrderDetailView | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [ratedOrderNumbers, setRatedOrderNumbers] = useState<ReadonlySet<string>>(new Set());
  const openedInitialRef = useRef(false);

  function openOrder(orderNumber: string): void {
    setDrawerOpen(true);
    setDetail(null);
    setError(null);

    startTransition(async () => {
      const result = await getCustomerOrderDetailAction(locale, orderNumber);
      if (!result.ok) {
        setError(result.error.message);
        setDetail(null);
        return;
      }
      setDetail(result.value);
    });
  }

  useEffect(() => {
    const trimmed = initialOrderNumber?.trim();
    if (!trimmed || openedInitialRef.current) {
      return;
    }
    openedInitialRef.current = true;
    setDrawerOpen(true);
    setDetail(null);
    setError(null);

    startTransition(async () => {
      const result = await getCustomerOrderDetailAction(locale, trimmed);
      if (!result.ok) {
        setError(result.error.message);
        setDetail(null);
        return;
      }
      setDetail(result.value);
    });
  }, [initialOrderNumber, locale, startTransition]);

  function closeDrawer(): void {
    setDrawerOpen(false);
    setDetail(null);
    setError(null);
  }

  const reviewLocale: Locale | undefined = isLocale(locale) ? locale : undefined;

  return (
    <>
      <CustomerOrdersTable
        orders={orders}
        locale={locale}
        onOpenOrder={openOrder}
        copy={copy}
        labels={labels}
        ratedOrderNumbers={ratedOrderNumbers}
      />
      <OrderDetailsDrawer
        open={drawerOpen}
        onClose={closeDrawer}
        detail={detail}
        error={error}
        isLoading={isPending}
        copy={copy}
        locale={reviewLocale}
        onReviewSubmitted={(next) => {
          setRatedOrderNumbers((current) => new Set(current).add(next.orderNumber));
          setDetail(next);
        }}
      />
    </>
  );
}
