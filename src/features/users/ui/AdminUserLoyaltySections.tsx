'use client';

import { LayoutGroup, motion, useReducedMotion } from 'motion/react';
import Link from 'next/link';
import { useState } from 'react';
import { Coins, Gift, TicketPercent } from 'lucide-react';

import { ADMIN_BADGE } from '@/features/admin/ui/status-badge';
import type { BonusTransactionView, CustomerBonusSummary } from '@/features/bonuses';
import type { CustomerGiftCardListItem } from '@/features/gift-cards';
import type { UserAssignedCoupon } from '@/features/promotions';
import {
  AdminUserLoyaltySectionShell,
  formatLoyaltyDateTime,
} from '@/features/users/ui/admin-user-loyalty-shared';
import { AdminUserRecentOrders } from '@/features/users/ui/AdminUserRecentOrders';
import type { Locale } from '@/lib/i18n/config';
import type { Dictionary } from '@/lib/i18n/get-dictionary';
import { formatMoneyAmount } from '@/lib/money/format';

type LoyaltyCopy = {
  bonusesTitle: string;
  availableBalance: string;
  totalEarned: string;
  totalRedeemed: string;
  noBonusHistory: string;
  orderLabel: string;
  bonusTypes: Record<string, string>;
  giftCardsTitle: string;
  noGiftCards: string;
  giftCardBalance: string;
  giftCardStatuses: Record<string, string>;
  couponsTitle: string;
  noCoupons: string;
  couponActive: string;
  couponInactive: string;
  couponExpires: string;
  couponNoExpiry: string;
  percentOff: string;
  fixedAmount: string;
  recentOrders: string;
  noOrders: string;
};

type RecentOrder = {
  id: string;
  orderNumber: string;
  status: string;
  paymentStatus: string;
  totalAmount: number;
  baseCurrency: string;
  placedAt: Date | string;
};

type LoyaltyTab = 'orders' | 'bonuses' | 'gifts' | 'coupons';

type AdminUserLoyaltySectionsProps = {
  locale: Locale;
  bonuses: CustomerBonusSummary;
  giftCards: CustomerGiftCardListItem[];
  coupons: UserAssignedCoupon[];
  recentOrders: RecentOrder[];
  copy: LoyaltyCopy;
  adminCopy: Dictionary['admin'];
};

function formatCouponValue(coupon: UserAssignedCoupon, copy: LoyaltyCopy, locale: Locale): string {
  if (coupon.discountType === 'PERCENTAGE') {
    return copy.percentOff.replace('{value}', String(coupon.discountValue));
  }
  return copy.fixedAmount.replace(
    '{value}',
    formatMoneyAmount(coupon.discountValue, 'AMD', locale),
  );
}

function BonusTransactionRow({
  row,
  locale,
  copy,
}: {
  row: BonusTransactionView;
  locale: Locale;
  copy: LoyaltyCopy;
}) {
  const positive = row.delta > 0;
  const typeLabel = copy.bonusTypes[row.type] ?? row.type;

  return (
    <li className="flex flex-col gap-2 rounded-[18px] border border-[#1e1e1e]/10 bg-white px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <p className="text-sm font-bold uppercase tracking-wide text-[#1e1e1e]">{typeLabel}</p>
        <p
          className={`mt-0.5 text-base font-bold ${positive ? 'text-[#ff6b00]' : 'text-[#1e1e1e]'}`}
        >
          {positive ? '+' : ''}
          {formatMoneyAmount(row.delta, 'AMD', locale)}
        </p>
      </div>
      <div className="text-left text-xs text-[#1e1e1e]/55 sm:text-right">
        {row.orderNumber ? (
          <p>
            {copy.orderLabel} {row.orderNumber}
          </p>
        ) : null}
        <p>{formatLoyaltyDateTime(row.createdAt, locale)}</p>
      </div>
    </li>
  );
}

export function AdminUserLoyaltySections({
  locale,
  bonuses,
  giftCards,
  coupons,
  recentOrders,
  copy,
  adminCopy,
}: AdminUserLoyaltySectionsProps) {
  const [tab, setTab] = useState<LoyaltyTab>('orders');
  const reduceMotion = useReducedMotion() ?? false;
  const tabs: Array<{ id: LoyaltyTab; label: string }> = [
    { id: 'orders', label: copy.recentOrders },
    { id: 'bonuses', label: copy.bonusesTitle },
    { id: 'gifts', label: copy.giftCardsTitle },
    { id: 'coupons', label: copy.couponsTitle },
  ];
  const stats = [
    { label: copy.availableBalance, value: bonuses.availableBalance },
    { label: copy.totalEarned, value: bonuses.totalEarned },
    { label: copy.totalRedeemed, value: bonuses.totalRedeemed },
  ] as const;

  return (
    <div>
      <div className="mb-4 flex gap-6 overflow-x-auto border-b border-[#1e1e1e]/10" role="tablist">
        <LayoutGroup id="admin-loyalty-tabs">
          {tabs.map((item) => {
            const selected = tab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                role="tab"
                aria-selected={selected}
                onClick={() => setTab(item.id)}
                className={`relative shrink-0 pb-2 text-sm font-semibold transition-colors duration-300 ${
                  selected ? 'text-[#1a4d3a]' : 'text-[#1e1e1e]/45 hover:text-[#1e1e1e]'
                }`}
              >
                {item.label}
                {selected ? (
                  <motion.span
                    layoutId="admin-loyalty-tab-line"
                    className="absolute inset-x-0 -bottom-px h-0.5 bg-[#1a4d3a]"
                    transition={
                      reduceMotion ? { duration: 0 } : { type: 'spring', stiffness: 380, damping: 34 }
                    }
                  />
                ) : null}
              </button>
            );
          })}
        </LayoutGroup>
      </div>

      {tab === 'bonuses' ? (
      <AdminUserLoyaltySectionShell title={copy.bonusesTitle} icon={Coins} showHeader={false}>
        <div className="mb-4 grid gap-3 sm:grid-cols-3">
          {stats.map((stat) => (
            <div key={stat.label} className="rounded-[18px] bg-[#fff8e7] px-4 py-3">
              <p className="text-[11px] font-bold tracking-[0.12em] text-[#1e1e1e]/55 uppercase">
                {stat.label}
              </p>
              <p className="mt-1 text-xl font-bold text-[#1e1e1e]">
                {formatMoneyAmount(stat.value, 'AMD', locale)}
              </p>
            </div>
          ))}
        </div>
        {bonuses.transactions.length === 0 ? (
          <p className="text-sm text-[#1e1e1e]/50">{copy.noBonusHistory}</p>
        ) : (
          <ul className="space-y-2">
            {bonuses.transactions.map((row) => (
              <BonusTransactionRow key={row.id} row={row} locale={locale} copy={copy} />
            ))}
          </ul>
        )}
      </AdminUserLoyaltySectionShell>
      ) : null}

      {tab === 'gifts' ? (
      <AdminUserLoyaltySectionShell title={copy.giftCardsTitle} icon={Gift} showHeader={false}>
        {giftCards.length === 0 ? (
          <p className="text-sm text-[#1e1e1e]/50">{copy.noGiftCards}</p>
        ) : (
          <ul className="space-y-2">
            {giftCards.map((card) => (
              <li key={card.id}>
                <Link
                  href={`/${locale}/admin/gift-cards/${card.id}`}
                  className="flex flex-col gap-2 rounded-[18px] border border-[#1e1e1e]/10 px-4 py-3 transition hover:bg-[#fff8e7]/60 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div>
                    <p className="text-sm font-bold text-[#1e1e1e]">{card.code}</p>
                    <p className="mt-0.5 text-xs text-[#1e1e1e]/55">
                      {copy.giftCardBalance}: {formatMoneyAmount(card.balanceAmount, 'AMD', locale)}
                    </p>
                  </div>
                  <span className={`${ADMIN_BADGE} bg-[#ffd54a]/50 text-[#1e1e1e]`}>
                    {copy.giftCardStatuses[card.status] ?? card.status}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </AdminUserLoyaltySectionShell>
      ) : null}

      {tab === 'coupons' ? (
      <AdminUserLoyaltySectionShell title={copy.couponsTitle} icon={TicketPercent} showHeader={false}>
        {coupons.length === 0 ? (
          <p className="text-sm text-[#1e1e1e]/50">{copy.noCoupons}</p>
        ) : (
          <ul className="space-y-2">
            {coupons.map((coupon) => (
              <li
                key={coupon.id}
                className="flex flex-col gap-2 rounded-[18px] border border-[#1e1e1e]/10 px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
              >
                <div>
                  <p className="text-sm font-bold text-[#1e1e1e]">{coupon.code}</p>
                  <p className="mt-0.5 text-xs text-[#1e1e1e]/55">
                    {formatCouponValue(coupon, copy, locale)}
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2 text-xs text-[#1e1e1e]/55 sm:justify-end">
                  <span
                    className={`${ADMIN_BADGE} ${
                      coupon.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-700'
                    }`}
                  >
                    {coupon.isActive ? copy.couponActive : copy.couponInactive}
                  </span>
                  <span>
                    {coupon.endsAt
                      ? copy.couponExpires.replace(
                          '{date}',
                          (coupon.endsAt instanceof Date ? coupon.endsAt : new Date(coupon.endsAt))
                            .toISOString()
                            .slice(0, 10),
                        )
                      : copy.couponNoExpiry}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </AdminUserLoyaltySectionShell>
      ) : null}

      {tab === 'orders' ? (
      <AdminUserRecentOrders
        locale={locale}
        orders={recentOrders}
        title={copy.recentOrders}
        emptyLabel={copy.noOrders}
        copy={adminCopy}
        showHeader={false}
      />
      ) : null}
    </div>
  );
}
