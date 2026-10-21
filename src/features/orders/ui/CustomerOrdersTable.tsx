'use client';

import { Calendar } from 'lucide-react';

import { orderStatusBadgeClass } from '@/features/admin/ui/status-badge';
import {
  formatOrderDrawerMoney,
  orderDrawerStatusLabel,
} from '@/features/orders/ui/order-drawer-format';
import type { Dictionary } from '@/lib/i18n/get-dictionary';

type CustomerOrderRow = {
  id: string;
  orderNumber: string;
  status: string;
  totalAmount: number;
  bonusEarnedAmount: number;
  baseCurrency: string;
  placedAt: string | Date;
  itemCount: number;
};

type CustomerOrdersTableProps = {
  orders: CustomerOrderRow[];
  locale: string;
  onOpenOrder: (orderNumber: string) => void;
  copy: Dictionary['admin'];
  labels: {
    orderNumber: string;
    noOrders: string;
    orderPlaced: string;
    orderItemsOne: string;
    orderItemsMany: string;
  };
};

export function CustomerOrdersTable({
  orders,
  locale,
  onOpenOrder,
  copy,
  labels,
}: CustomerOrdersTableProps) {
  if (orders.length === 0) {
    return <p className="px-1 text-sm text-[#1e1e1e]/65">{labels.noOrders}</p>;
  }

  return (
    <ul className="grid grid-cols-1 gap-3 md:grid-cols-3">
      {orders.map((order) => (
        <li key={order.id} className="h-full">
          <OrderCard
            order={order}
            locale={locale}
            labels={labels}
            statusLabel={orderDrawerStatusLabel(order.status, copy.orders.statusLabels)}
            onOpen={() => onOpenOrder(order.orderNumber)}
          />
        </li>
      ))}
    </ul>
  );
}

function OrderCard({
  order,
  locale,
  labels,
  statusLabel,
  onOpen,
}: {
  order: CustomerOrderRow;
  locale: string;
  labels: CustomerOrdersTableProps['labels'];
  statusLabel: string;
  onOpen: () => void;
}) {
  const itemsLabel =
    order.itemCount === 1
      ? labels.orderItemsOne
      : labels.orderItemsMany.replace('{count}', String(order.itemCount));
  const placed = labels.orderPlaced.replace('{date}', formatPlacedDate(order.placedAt, locale));

  return (
    <button
      type="button"
      onClick={onOpen}
      className="flex h-full w-full flex-col rounded-[22px] border border-[#1e1e1e]/10 bg-white p-4 text-left shadow-[0_8px_24px_rgba(31,20,8,0.06)]"
    >
      <div className="flex items-start justify-between gap-3">
        <p className="font-display min-w-0 text-[1.35rem] leading-none text-[#1e1e1e] uppercase">
          {labels.orderNumber} {order.orderNumber}
        </p>
        <span
          className={`shrink-0 rounded-full px-3 py-1 text-xs font-bold ${orderStatusBadgeClass(order.status)}`}
        >
          {statusLabel}
        </span>
      </div>
      <div className="mt-3 flex items-center justify-between gap-3">
        <p className="text-[1.65rem] leading-none font-extrabold text-[#1e1e1e]">
          {formatOrderDrawerMoney(order.totalAmount, order.baseCurrency)}
        </p>
        {order.bonusEarnedAmount > 0 ? (
          <span className="rounded-full bg-[#ff6b00] px-2.5 py-1 text-sm font-bold text-white">
            +{formatOrderDrawerMoney(order.bonusEarnedAmount, order.baseCurrency)}
          </span>
        ) : null}
      </div>
      <div className="mt-auto flex items-center gap-3 pt-4">
        <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-[#1e1e1e] text-white">
          <Calendar className="size-5" aria-hidden="true" />
        </span>
        <span className="min-w-0">
          <span className="block text-sm font-bold text-[#1e1e1e]">{itemsLabel}</span>
          <span className="block text-sm text-[#1e1e1e]/55">{placed}</span>
        </span>
      </div>
    </button>
  );
}

function formatPlacedDate(value: string | Date, locale: string): string {
  const date = value instanceof Date ? value : new Date(value);
  const tag = locale === 'hy' ? 'hy-AM' : locale === 'ru' ? 'ru-RU' : 'en-US';
  return new Intl.DateTimeFormat(tag, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    timeZone: 'Asia/Yerevan',
  }).format(date);
}
