import type { ReactNode } from 'react';

import type { AdminOrderDetailView } from '@/features/orders/application/order-detail-view';
import type { Dictionary } from '@/lib/i18n/get-dictionary';

type OrderDetailsDrawerSummaryProps = {
  detail: AdminOrderDetailView;
  copy: Dictionary['admin'];
  variant?: 'full' | 'customer';
};

export function OrderDetailsDrawerSummary({
  detail,
  copy,
  variant = 'full',
}: OrderDetailsDrawerSummaryProps) {
  const d = copy.orders.drawer;

  return (
    <section className="rounded-2xl border border-gray-200 bg-white px-5 py-4">
      <h3
        className={`mb-4 text-base font-semibold text-gray-900 ${
          variant === 'customer' ? 'uppercase tracking-wide' : ''
        }`}
      >
        {d.customer}
      </h3>
      <dl className="space-y-3 text-sm">
        <DetailRow label={d.name} value={detail.contactName} />
        <DetailRow label={d.phoneNumber} value={detail.contactPhone} />
        <DetailRow label={d.email} value={detail.contactEmail} />
      </dl>
    </section>
  );
}

function DetailRow({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
      <dt className="text-gray-500">{label}</dt>
      <dd className="font-medium text-gray-900">{value}</dd>
    </div>
  );
}
