import { MapPin } from 'lucide-react';

import type { AdminOrderDetailView } from '@/features/orders/application/order-detail-view';
import { formatOrderDrawerMoney } from '@/features/orders/ui/order-drawer-format';
import type { Dictionary } from '@/lib/i18n/get-dictionary';

type OrderDetailsDrawerShippingProps = {
  detail: AdminOrderDetailView;
  copy: Dictionary['admin'];
  variant?: 'full' | 'address';
};

export function OrderDetailsDrawerShipping({
  detail,
  copy,
  variant = 'full',
}: OrderDetailsDrawerShippingProps) {
  const d = copy.orders.drawer;

  if (variant === 'address') {
    return (
      <section className="rounded-2xl border border-gray-200 px-5 py-4">
        <h3 className="mb-4 text-base font-semibold tracking-wide text-gray-900 uppercase">
          {d.shippingAddress}
        </h3>
        <div className="flex items-start gap-2">
          <MapPin className="mt-0.5 h-5 w-5 shrink-0 text-emerald-700" aria-hidden />
          <div className="min-w-0">
            <p className="font-medium text-gray-900">{detail.addressLine}</p>
            {detail.scheduledDelivery ? (
              <p className="mt-1 text-xs text-gray-500">
                {d.deliverySlotCaption.replace('{slot}', detail.scheduledDelivery)}
              </p>
            ) : null}
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="rounded-2xl border border-gray-200 px-5 py-4">
        <h3 className="mb-4 text-base font-semibold text-gray-900">{d.shippingAddress}</h3>
        <dl className="space-y-3 text-sm">
          <div className="flex flex-wrap items-center gap-x-2">
            <dt className="text-gray-500">{d.shippingMethod}</dt>
            <dd className="font-medium text-gray-900">
              {detail.isPickup ? d.methodPickup : d.methodDelivery}
            </dd>
          </div>
          {!detail.isPickup ? (
            <div className="flex flex-wrap items-center gap-x-2">
              <dt className="text-gray-500">{d.deliveryFee}</dt>
              <dd className="font-medium text-gray-900">
                {formatOrderDrawerMoney(detail.deliveryAmount, detail.baseCurrency)}
              </dd>
            </div>
          ) : null}
          {!detail.isPickup && detail.deliveryLabel ? (
            <div className="flex flex-wrap items-center gap-x-2">
              <dt className="text-gray-500">{d.deliveryZone}</dt>
              <dd className="font-medium text-gray-900">{detail.deliveryLabel}</dd>
            </div>
          ) : null}
          {detail.isPickup ? (
            <div className="flex flex-wrap items-center gap-x-2">
              <dt className="text-gray-500">{d.pickupStore}</dt>
              <dd className="font-medium text-gray-900">{detail.storeName}</dd>
            </div>
          ) : null}
          <div className="flex items-center gap-2">
            <MapPin
              className={`h-4 w-4 shrink-0 ${
                detail.participants ? 'text-emerald-700' : 'text-gray-400'
              }`}
              aria-hidden
            />
            <dd className="min-w-0 font-medium text-gray-900">{detail.addressLine}</dd>
          </div>
          {!detail.isPickup && detail.floor ? (
            <div className="flex flex-wrap items-center gap-x-2">
              <dt className="text-gray-500">{d.floor}</dt>
              <dd className="font-medium text-gray-900">{detail.floor}</dd>
            </div>
          ) : null}
          {!detail.isPickup && detail.intercomCode ? (
            <div className="flex flex-wrap items-center gap-x-2">
              <dt className="text-gray-500">{d.intercomCode}</dt>
              <dd className="font-medium text-gray-900">{detail.intercomCode}</dd>
            </div>
          ) : null}
          {!detail.isPickup && detail.scheduledDelivery ? (
            <div className="flex flex-wrap items-center gap-x-2">
              <dt className="text-gray-500">{d.deliverySlot}</dt>
              <dd className="font-medium text-gray-900">{detail.scheduledDelivery}</dd>
            </div>
          ) : null}
          {!detail.isPickup && detail.cashChangeAmount != null ? (
            <div className="flex flex-wrap items-center gap-x-2">
              <dt className="text-gray-500">{d.cashChange}</dt>
              <dd className="flex items-center gap-2 font-medium text-gray-900">
                {detail.cashChangeImageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element -- CDN/local media URL
                  <img
                    src={detail.cashChangeImageUrl}
                    alt=""
                    className="h-8 w-12 rounded object-contain"
                  />
                ) : null}
                {formatOrderDrawerMoney(detail.cashChangeAmount, detail.baseCurrency)}
              </dd>
            </div>
          ) : null}
          {detail.addressHint ? (
            <p className="text-xs text-gray-500">{detail.addressHint}</p>
          ) : null}
        </dl>
    </section>
  );
}
