'use client';

import { useState, useTransition } from 'react';

import type { AdminOrderDetailView } from '@/features/orders/application/order-detail-view';
import { getCustomerOrderDetailAction } from '@/features/orders/application/get-customer-order-detail';
import { OrderDetailsDrawer } from '@/features/orders/ui/OrderDetailsDrawer';
import { formatYerevanTime } from '@/features/delivery/domain/delivery-schedule';
import type { Locale } from '@/lib/i18n/config';
import type { Dictionary } from '@/lib/i18n/get-dictionary';
import { formatMoneyAmount } from '@/lib/money/format';

type BonusHistoryRow = {
  id: string;
  type: string;
  delta: number;
  createdAt: string;
  orderNumber: string | null;
};

type ProfileBonusesHistoryProps = {
  locale: Locale;
  transactions: readonly BonusHistoryRow[];
  typeLabels: Record<string, string>;
  emptyLabel: string;
  historyTitle: string;
  drawerCopy: Dictionary['admin'];
};

const BONUS_MONTH_SHORT: Record<Locale, readonly string[]> = {
  en: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
  hy: ['հնվ', 'փտվ', 'մրտ', 'ապր', 'մյս', 'հնս', 'հլս', 'օգս', 'սեպ', 'հոկ', 'նոյ', 'դեկ'],
  ru: ['янв.', 'февр.', 'мар.', 'апр.', 'мая', 'июн.', 'июл.', 'авг.', 'сенտ.', 'окт.', 'нояб.', 'дек.'],
};

/** `22 հոկ, 2026 թ. · 16:25` in Asia/Yerevan. */
function formatBonusDateTime(value: string, locale: Locale): string {
  const date = new Date(value);
  const ymd = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Yerevan',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date);
  const [yearText, monthText, dayText] = ymd.split('-');
  const month = BONUS_MONTH_SHORT[locale][Number(monthText) - 1] ?? '';
  const day = Number(dayText);
  const year = yearText ?? '';
  const time = formatYerevanTime(date);
  if (locale === 'hy') {
    return `${day} ${month}, ${year} թ. · ${time}`;
  }
  if (locale === 'ru') {
    return `${day} ${month} ${year} г. · ${time}`;
  }
  return `${month} ${day}, ${year} · ${time}`;
}

export function ProfileBonusesHistory({
  locale,
  transactions,
  typeLabels,
  emptyLabel,
  historyTitle,
  drawerCopy,
}: ProfileBonusesHistoryProps) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [detail, setDetail] = useState<AdminOrderDetailView | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

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

  function closeDrawer(): void {
    setDrawerOpen(false);
    setDetail(null);
    setError(null);
  }

  return (
    <div>
      <h2 className="mb-4 text-lg font-bold text-[#1e1e1e]">{historyTitle}</h2>
      {transactions.length === 0 ? (
        <p className="rounded-[22px] bg-[#fff8e7] px-4 py-6 text-sm text-[#1e1e1e]/65">{emptyLabel}</p>
      ) : (
        <ul className="grid grid-cols-1 gap-3 lg:grid-cols-3">
          {transactions.map((row) => {
            const positive = row.delta > 0;
            const orderNumber = row.orderNumber;
            const cardClass =
              'flex h-full min-w-0 w-full flex-col rounded-[22px] border border-[#1e1e1e]/10 bg-white p-4 text-left sm:p-5';
            const body = (
              <>
                <p className="font-display text-xl leading-none tracking-wide text-[#1e1e1e] uppercase">
                  {typeLabels[row.type] ?? row.type}
                </p>
                <div className="mt-3 flex items-baseline justify-between gap-3">
                  <p
                    className={
                      positive
                        ? 'font-display text-xl leading-none tracking-wide text-[#ff6b00]'
                        : 'font-display text-xl leading-none tracking-wide text-red-600'
                    }
                  >
                    {positive ? '+' : ''}
                    {formatMoneyAmount(row.delta, 'AMD', locale)}
                  </p>
                  <p className="shrink-0 text-sm text-[#8b93a7]">
                    {formatBonusDateTime(row.createdAt, locale)}
                  </p>
                </div>
              </>
            );

            return (
              <li key={row.id} className="min-w-0">
                {orderNumber ? (
                  <button type="button" className={`${cardClass} cursor-pointer`} onClick={() => openOrder(orderNumber)}>
                    {body}
                  </button>
                ) : (
                  <div className={cardClass}>{body}</div>
                )}
              </li>
            );
          })}
        </ul>
      )}
      <OrderDetailsDrawer
        open={drawerOpen}
        onClose={closeDrawer}
        detail={detail}
        error={error}
        isLoading={isPending}
        copy={drawerCopy}
        locale={locale}
        onReviewSubmitted={(next) => setDetail(next)}
      />
    </div>
  );
}
