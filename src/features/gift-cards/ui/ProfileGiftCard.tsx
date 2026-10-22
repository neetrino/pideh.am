'use client';

import { Calendar, ChevronDown, Clock, Gift, Tag, UserRound } from 'lucide-react';
import { useState, type ReactNode } from 'react';

import type {
  CustomerGiftCardListItem,
  GiftCardDetail,
} from '@/features/gift-cards/application/queries';
import { formatStorefrontDate } from '@/features/checkout/ui/delivery-slot-calendar';
import type { Locale } from '@/lib/i18n/config';
import { formatMoneyAmount } from '@/lib/money/format';

type ProfileGiftCardCopy = {
  balance: string;
  initial: string;
  recipient: string;
  created: string;
  expires: string;
  history: string;
  statuses: Record<string, string>;
};

type ProfileGiftCardProps = {
  locale: Locale;
  card: CustomerGiftCardListItem;
  detail: GiftCardDetail | null;
  copy: ProfileGiftCardCopy;
};

const STATUS_PILL: Record<CustomerGiftCardListItem['status'], string> = {
  ACTIVE: 'bg-[#fff4cc] text-[#8a5a20]',
  PENDING_PAYMENT: 'bg-[#fff1e6] text-[#ff6b00]',
  USED: 'bg-[#1e1e1e]/8 text-[#1e1e1e]/65',
  EXPIRED: 'bg-red-50 text-red-700',
  DISABLED: 'bg-red-50 text-red-700',
};

function formatCardDate(value: Date, locale: Locale): string {
  return formatStorefrontDate(value, locale);
}

function MetaRow({
  icon,
  label,
  value,
}: {
  icon: ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start justify-between gap-4 text-sm">
      <span className="inline-flex shrink-0 items-center gap-2 text-[#1e1e1e]/55">
        {icon}
        {label}
      </span>
      <span className="min-w-0 text-right font-medium break-words text-[#1e1e1e]">{value}</span>
    </div>
  );
}

function GiftCardHistory({
  locale,
  open,
  onToggle,
  title,
  transactions,
}: {
  locale: Locale;
  open: boolean;
  onToggle: () => void;
  title: string;
  transactions: GiftCardDetail['transactions'];
}) {
  return (
    <div className="border-t border-[#1e1e1e]/8">
      <button
        type="button"
        aria-expanded={open}
        onClick={onToggle}
        className="flex w-full items-center justify-between gap-3 px-5 py-3.5 text-left"
      >
        <span className="inline-flex items-center gap-2 text-xs font-bold tracking-wide text-[#1e1e1e] uppercase">
          <Clock className="size-4 text-[#ff6b00]" aria-hidden="true" />
          {title}
        </span>
        <ChevronDown
          className={`size-4 text-[#1e1e1e]/45 transition ${open ? 'rotate-180' : ''}`}
          aria-hidden="true"
        />
      </button>
      {open ? (
        <ul className="space-y-2 px-5 pb-4">
          {transactions.map((row) => (
            <li
              key={row.id}
              className="flex items-center justify-between gap-3 text-xs text-[#1e1e1e]/65"
            >
              <span>
                {row.type} · {formatCardDate(row.createdAt, locale)}
              </span>
              <span
                className={`font-semibold ${row.delta > 0 ? 'text-[#ff6b00]' : 'text-[#1e1e1e]'}`}
              >
                {row.delta > 0 ? '+' : ''}
                {formatMoneyAmount(row.delta, 'AMD', locale)}
              </span>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}

function GiftCardSummary({
  locale,
  card,
  copy,
}: {
  locale: Locale;
  card: CustomerGiftCardListItem;
  copy: ProfileGiftCardCopy;
}) {
  const statusLabel = copy.statuses[card.status] ?? card.status;

  return (
    <>
      <div className="px-5 pt-5 pb-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <span className="inline-flex size-11 shrink-0 items-center justify-center rounded-full bg-[#ff6b00] text-white">
              <Gift className="size-5" aria-hidden="true" />
            </span>
            <p className="truncate font-display text-lg tracking-wide text-[#1e1e1e] uppercase">
              {card.code}
            </p>
          </div>
          <span
            className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold ${STATUS_PILL[card.status]}`}
          >
            <span className="size-1.5 rounded-full bg-current" aria-hidden="true" />
            {statusLabel}
          </span>
        </div>
        <p className="mt-5 text-xs font-medium text-[#1e1e1e]/45">{copy.balance}</p>
        <p className="font-display text-4xl leading-none text-[#1e1e1e]">
          {formatMoneyAmount(card.balanceAmount, 'AMD', locale)}
        </p>
      </div>
      <div className="space-y-3 border-t border-dashed border-[#1e1e1e]/12 px-5 py-4">
        <MetaRow
          icon={<Tag className="size-4" aria-hidden="true" />}
          label={`${copy.initial}:`}
          value={formatMoneyAmount(card.initialAmount, 'AMD', locale)}
        />
        <MetaRow
          icon={<UserRound className="size-4" aria-hidden="true" />}
          label={`${copy.recipient}:`}
          value={`${card.recipientName} · ${card.recipientEmail}`}
        />
        <MetaRow
          icon={<Calendar className="size-4" aria-hidden="true" />}
          label={`${copy.created}:`}
          value={formatCardDate(card.createdAt, locale)}
        />
        {card.expiresAt ? (
          <MetaRow
            icon={<Calendar className="size-4" aria-hidden="true" />}
            label={`${copy.expires}:`}
            value={formatCardDate(card.expiresAt, locale)}
          />
        ) : null}
      </div>
    </>
  );
}

export function ProfileGiftCard({ locale, card, detail, copy }: ProfileGiftCardProps) {
  const [historyOpen, setHistoryOpen] = useState(false);
  const transactions = detail?.transactions ?? [];

  return (
    <article className="overflow-hidden rounded-[26px] border border-[#ff6b00]/15 bg-white">
      <GiftCardSummary locale={locale} card={card} copy={copy} />

      {transactions.length > 0 ? (
        <GiftCardHistory
          locale={locale}
          open={historyOpen}
          onToggle={() => setHistoryOpen((open) => !open)}
          title={copy.history}
          transactions={transactions}
        />
      ) : null}
    </article>
  );
}
