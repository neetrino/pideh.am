'use client';

import { Calendar } from 'lucide-react';

import { AppLink } from '@/components/ui/AppLink';
import { fadeUp } from '@/components/motion/presets';
import { StaggerGroup, StaggerItem } from '@/components/motion/StaggerGroup';
import { orderStatusBadgeClass } from '@/features/admin/ui/status-badge';
import {
  formatOrderDrawerMoney,
  orderDrawerStatusLabel,
} from '@/features/orders/ui/order-drawer-format';
import { ProfilePageHeading } from '@/features/profile/ui/ProfilePageHeading';
import { ProfileStatCard } from '@/features/profile/ui/ProfileStatCard';
import { PROFILE_PANEL } from '@/features/profile/ui/profile-ui-classes';
import type { ProfileRecentOrder } from '@/features/profile/application/dashboard-queries';
import type { Dictionary } from '@/lib/i18n/get-dictionary';
import type { Locale } from '@/lib/i18n/config';

type ProfileDashboardProps = {
  locale: Locale;
  firstName: string;
  dictionary: Dictionary['profile'];
  statusLabels: Dictionary['admin']['orders']['statusLabels'];
  stats: {
    totalOrders: number;
    pendingOrders: number;
    completedOrders: number;
    totalSpent: number;
  };
  recentOrders: readonly ProfileRecentOrder[];
};

export function ProfileDashboard({
  locale,
  firstName,
  dictionary,
  statusLabels,
  stats,
  recentOrders,
}: ProfileDashboardProps) {
  return (
    <section className="profile-sheet-keep-frame space-y-8">
      <ProfilePageHeading
        eyebrow={dictionary.loyaltyEyebrow}
        title={dictionary.dashboard}
        description={`${dictionary.welcome}, ${firstName}.`}
      />

      <StaggerGroup className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <StaggerItem variants={fadeUp}>
          <ProfileStatCard label={dictionary.totalOrders} value={stats.totalOrders} />
        </StaggerItem>
        <StaggerItem variants={fadeUp}>
          <ProfileStatCard label={dictionary.pendingOrders} value={stats.pendingOrders} />
        </StaggerItem>
        <StaggerItem variants={fadeUp}>
          <ProfileStatCard label={dictionary.completedOrders} value={stats.completedOrders} />
        </StaggerItem>
        <StaggerItem variants={fadeUp}>
          <ProfileStatCard label={dictionary.totalSpent} value={stats.totalSpent} suffix=" ֏" />
        </StaggerItem>
      </StaggerGroup>

      <div className={`${PROFILE_PANEL} p-5 sm:p-7`}>
        <div className="mb-5 flex items-center justify-between gap-3">
          <h2 className="text-lg font-bold text-[#1e1e1e]">{dictionary.recentOrders}</h2>
          <AppLink
            href={`/${locale}/profile/orders`}
            prefetchPolicy="intent"
            className="text-sm font-bold text-[#ff6b00] underline-offset-2 hover:underline"
          >
            {dictionary.viewAllOrders}
          </AppLink>
        </div>

        {recentOrders.length === 0 ? (
          <p className="rounded-2xl bg-[#fff8e7] px-4 py-6 text-sm text-[#1e1e1e]/65">
            {dictionary.noOrders}
          </p>
        ) : (
          <ul className="grid grid-cols-1 gap-3 lg:grid-cols-3">
            {recentOrders.slice(0, 3).map((order) => (
              <li key={order.id} className="h-full">
                <RecentOrderCard
                  locale={locale}
                  order={order}
                  orderNumberLabel={dictionary.orderNumber}
                  itemsOneLabel={dictionary.orderItemsOne}
                  itemsManyLabel={dictionary.orderItemsMany}
                  placedLabel={dictionary.orderPlaced}
                  statusLabel={orderDrawerStatusLabel(order.status, statusLabels)}
                />
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}

function RecentOrderCard({
  locale,
  order,
  orderNumberLabel,
  itemsOneLabel,
  itemsManyLabel,
  placedLabel,
  statusLabel,
}: {
  locale: Locale;
  order: ProfileRecentOrder;
  orderNumberLabel: string;
  itemsOneLabel: string;
  itemsManyLabel: string;
  placedLabel: string;
  statusLabel: string;
}) {
  const itemsLabel =
    order.itemCount === 1
      ? itemsOneLabel
      : itemsManyLabel.replace('{count}', String(order.itemCount));
  const placed = placedLabel.replace('{date}', formatPlacedDate(order.placedAt, locale));

  return (
    <AppLink
      href={`/${locale}/profile/orders?order=${encodeURIComponent(order.orderNumber)}`}
      prefetchPolicy="intent"
      className="flex h-full flex-col rounded-[22px] border border-[#1e1e1e]/10 bg-white p-4 text-left shadow-[0_8px_24px_rgba(31,20,8,0.06)] transition hover:bg-[#fff8e7]"
    >
      <span className="flex items-start justify-between gap-3">
        <span className="font-display min-w-0 text-[1.35rem] leading-none text-[#1e1e1e] uppercase">
          {orderNumberLabel} {order.orderNumber}
        </span>
        <span
          className={`shrink-0 rounded-full px-3 py-1 text-xs font-bold ${orderStatusBadgeClass(order.status)}`}
        >
          {statusLabel}
        </span>
      </span>
      <span className="mt-3 flex items-center justify-between gap-3">
        <span className="text-[1.65rem] leading-none font-extrabold text-[#1e1e1e]">
          {formatOrderDrawerMoney(order.totalAmount, order.baseCurrency)}
        </span>
        {order.bonusEarnedAmount > 0 ? (
          <span className="rounded-full bg-[#ff6b00] px-2.5 py-1 text-sm font-bold text-white">
            +{formatOrderDrawerMoney(order.bonusEarnedAmount, order.baseCurrency)}
          </span>
        ) : null}
      </span>
      <span className="mt-auto flex items-center gap-3 pt-4">
        <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-[#1e1e1e] text-white">
          <Calendar className="size-5" aria-hidden="true" />
        </span>
        <span className="min-w-0">
          <span className="block text-sm font-bold text-[#1e1e1e]">{itemsLabel}</span>
          <span className="block text-sm text-[#1e1e1e]/55">{placed}</span>
        </span>
      </span>
    </AppLink>
  );
}

function formatPlacedDate(value: Date, locale: string): string {
  const tag = locale === 'hy' ? 'hy-AM' : locale === 'ru' ? 'ru-RU' : 'en-US';
  return new Intl.DateTimeFormat(tag, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    timeZone: 'Asia/Yerevan',
  }).format(value);
}
