'use client';

import { CreditCard, Package, type LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';

import { SideSheet } from '@/components/ui/SideSheet';
import type { AdminOrderDetailView } from '@/features/orders/application/order-detail-view';
import { OrderDetailsDrawerItems } from '@/features/orders/ui/OrderDetailsDrawerItems';
import { OrderDetailsDrawerParticipants } from '@/features/orders/ui/OrderDetailsDrawerParticipants';
import { OrderDetailsDrawerReview } from '@/features/orders/ui/OrderDetailsDrawerReview';
import { OrderDetailsDrawerShipping } from '@/features/orders/ui/OrderDetailsDrawerShipping';
import { OrderDetailsDrawerSummary } from '@/features/orders/ui/OrderDetailsDrawerSummary';
import { OrderDetailsDrawerTotals } from '@/features/orders/ui/OrderDetailsDrawerTotals';
import { orderDrawerStatusLabel } from '@/features/orders/ui/order-drawer-format';
import type { Locale } from '@/lib/i18n/config';
import type { Dictionary } from '@/lib/i18n/get-dictionary';

type OrderDetailsDrawerProps = {
  open: boolean;
  onClose: () => void;
  detail: AdminOrderDetailView | null;
  error: string | null;
  isLoading: boolean;
  copy: Dictionary['admin'];
  /** Required when the customer review form can be shown. */
  locale?: Locale;
  onReviewSubmitted?: (detail: AdminOrderDetailView) => void;
  /** Admin-only content (internal notes); never pass from customer surfaces. */
  adminNotesSlot?: ReactNode;
};

export function OrderDetailsDrawer({
  open,
  onClose,
  detail,
  error,
  isLoading,
  copy,
  locale,
  onReviewSubmitted,
  adminNotesSlot,
}: OrderDetailsDrawerProps) {
  const isGroup = detail?.participants != null && detail.participants.length > 0;
  const labels = copy.orders.statusLabels;
  const statusLabel = detail ? orderDrawerStatusLabel(detail.status, labels) : '';
  const paymentLabel = detail ? orderDrawerStatusLabel(detail.paymentStatus, labels) : '';

  return (
    <SideSheet
      open={open}
      onClose={onClose}
      ariaLabel={copy.orders.drawer.ariaLabel}
      variant="admin"
      zIndexClassName="z-[200]"
    >
      <div className="shrink-0 border-b-2 border-[#1e1e1e]/10 px-5 py-4 sm:px-6">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <h2 className="font-display text-2xl leading-[0.95] text-[#1e1e1e] uppercase sm:text-3xl">
              {copy.orders.drawer.title}
            </h2>
            {detail ? (
              <div className="mt-2 flex flex-nowrap items-center gap-2">
                <p className="text-sm text-gray-500">#{detail.orderNumber}</p>
                {isGroup ? (
                  <span className="inline-flex rounded-full bg-[#1a4d3a] px-2.5 py-0.5 text-xs font-bold text-white">
                    {copy.orders.kindSwitcher.group}
                  </span>
                ) : null}
                <OrderStatusPills
                  className="sm:hidden"
                  statusLabel={statusLabel}
                  paymentLabel={paymentLabel}
                  statusAriaLabel={`${copy.orders.drawer.status} ${statusLabel}`}
                  paymentAriaLabel={`${copy.orders.drawer.payment} ${paymentLabel}`}
                />
              </div>
            ) : null}
          </div>
          {detail ? (
            <OrderStatusPills
              className="hidden shrink-0 sm:flex"
              statusLabel={statusLabel}
              paymentLabel={paymentLabel}
              statusAriaLabel={`${copy.orders.drawer.status} ${statusLabel}`}
              paymentAriaLabel={`${copy.orders.drawer.payment} ${paymentLabel}`}
            />
          ) : null}
        </div>
      </div>

      <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-6 py-5">
        {isLoading ? (
          <p className="py-4 text-sm text-gray-600">{copy.orders.drawer.loading}</p>
        ) : null}
        {error ? <p className="py-4 text-sm text-red-700">{error}</p> : null}
        {!isLoading && !error && detail ? (
          <>
            {detail.customerNote ? (
              <section className="rounded-2xl border border-[#ff6b00]/30 bg-[#fff8e7] px-5 py-4">
                <h3 className="mb-2 text-base font-semibold text-[#ff6b00]">
                  {copy.orders.drawer.customerNote}
                </h3>
                <p className="text-sm font-medium whitespace-pre-wrap text-[#1e1e1e]">
                  {detail.customerNote}
                </p>
              </section>
            ) : null}
            {adminNotesSlot}
            <OrderDetailsDrawerSummary detail={detail} copy={copy} variant={isGroup ? 'customer' : 'full'} />
            <OrderDetailsDrawerShipping
              detail={detail}
              copy={copy}
              variant={isGroup ? 'address' : 'full'}
            />
            {isGroup && detail.participants ? (
              <OrderDetailsDrawerParticipants
                detail={detail}
                participants={detail.participants}
                copy={copy}
              />
            ) : (
              <OrderDetailsDrawerItems detail={detail} copy={copy} />
            )}
            <OrderDetailsDrawerTotals
              detail={detail}
              copy={copy}
              variant={isGroup ? 'group' : 'full'}
            />
            <OrderDetailsDrawerReview
              detail={detail}
              copy={copy.orders.drawer}
              locale={locale}
              onReviewSubmitted={onReviewSubmitted}
            />
          </>
        ) : null}
      </div>
    </SideSheet>
  );
}

function OrderStatusPills({
  className,
  statusLabel,
  paymentLabel,
  statusAriaLabel,
  paymentAriaLabel,
}: {
  className: string;
  statusLabel: string;
  paymentLabel: string;
  statusAriaLabel: string;
  paymentAriaLabel: string;
}) {
  return (
    <div className={`flex flex-nowrap items-center gap-2 ${className}`}>
      <OrderMetaPill icon={Package} label={statusLabel} ariaLabel={statusAriaLabel} />
      <OrderMetaPill icon={CreditCard} label={paymentLabel} ariaLabel={paymentAriaLabel} />
    </div>
  );
}

function OrderMetaPill({
  icon: Icon,
  label,
  ariaLabel,
}: {
  icon: LucideIcon;
  label: string;
  ariaLabel: string;
}) {
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full bg-[#fff4cc] px-3 py-1.5 text-sm font-bold text-[#8a5a20]"
      aria-label={ariaLabel}
    >
      <Icon className="size-4 shrink-0" aria-hidden />
      {label}
    </span>
  );
}
