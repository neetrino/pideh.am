'use client';

import { LayoutGroup, motion, useReducedMotion } from 'motion/react';
import { useMemo, useState } from 'react';

import { BuyGiftCardDrawer } from '@/features/gift-cards/ui/BuyGiftCardDrawer';
import { ProfileGiftCard } from '@/features/gift-cards/ui/ProfileGiftCard';
import type {
  CustomerGiftCardListItem,
  GiftCardDetail,
} from '@/features/gift-cards/application/queries';
import type {
  CustomerGiftCardBucket,
  GiftCardSettings,
} from '@/features/gift-cards/domain/gift-card-rules';
import type { Locale } from '@/lib/i18n/config';

type MyGiftCardsViewCopy = {
  title: string;
  buy: string;
  empty: string;
  history: string;
  balance: string;
  initial: string;
  recipient: string;
  created: string;
  expires: string;
  filters: Record<CustomerGiftCardBucket, string>;
  sectionsSwitcher: {
    aria: string;
    mine: string;
    usedByMe: string;
    boughtForOthers: string;
  };
  statuses: Record<string, string>;
  buyDrawer: {
    title: string;
    description: string;
    amount: string;
    customAmount: string;
    recipientName: string;
    recipientEmail: string;
    recipientPhone: string;
    purchaserName: string;
    message: string;
    sendDate: string;
    paymentMethod: string;
    cashOnDelivery: string;
    cashOnDeliveryDescription: string;
    idram: string;
    idramDescription: string;
    arca: string;
    arcaDescription: string;
    terminal: string;
    terminalDescription: string;
    submit: string;
    submitting: string;
    successPending: string;
  };
};

type MyGiftCardsViewProps = {
  locale: Locale;
  settings: GiftCardSettings;
  defaultPurchaserName: string;
  details: Array<{
    card: CustomerGiftCardListItem;
    detail: GiftCardDetail | null;
  }>;
  copy: MyGiftCardsViewCopy;
};

const FILTER_ORDER: CustomerGiftCardBucket[] = ['mine', 'usedByMe', 'boughtForOthers'];

export function MyGiftCardsView({
  locale,
  settings,
  defaultPurchaserName,
  details,
  copy,
}: MyGiftCardsViewProps) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerKey, setDrawerKey] = useState(0);
  const [activeFilter, setActiveFilter] = useState<CustomerGiftCardBucket>('mine');
  const reduceMotion = useReducedMotion() ?? false;

  const filteredDetails = useMemo(
    () => details.filter(({ card }) => card.bucket === activeFilter),
    [activeFilter, details],
  );

  return (
    <section className="profile-sheet-keep-frame space-y-6">
      <div className="mb-1 flex flex-col gap-4 border-b border-[#1e1e1e]/10 pb-5 sm:mb-2 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between sm:gap-3 sm:pb-6">
        <h1 className="font-display text-3xl leading-[0.9] text-[#1e1e1e] uppercase sm:text-4xl">
          {copy.title}
        </h1>
        <button
          type="button"
          onClick={() => {
            setDrawerKey((key) => key + 1);
            setDrawerOpen(true);
          }}
          className="inline-flex h-10 w-full items-center justify-center rounded-full bg-[#ff6b00] px-5 text-sm font-bold text-white transition hover:brightness-105 sm:w-auto"
        >
          {copy.buy}
        </button>
      </div>

      <div className="sm:hidden">
        <div
          role="tablist"
          aria-label={copy.sectionsSwitcher.aria}
          className="relative flex w-full items-center rounded-full bg-[#f3f4f6] p-1"
        >
          <span
            aria-hidden
            className="pointer-events-none absolute top-1 bottom-1 rounded-full bg-white shadow-sm transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]"
            style={{
              width: 'calc((100% - 0.5rem) / 3)',
              left: '0.25rem',
              transform: `translateX(${FILTER_ORDER.indexOf(activeFilter) * 100}%)`,
            }}
          />
          {FILTER_ORDER.map((bucket) => {
            const isActive = activeFilter === bucket;
            return (
              <button
                key={bucket}
                type="button"
                role="tab"
                aria-selected={isActive}
                onClick={() => setActiveFilter(bucket)}
                className={`relative z-[1] flex min-w-0 flex-1 items-center justify-center rounded-full px-1 py-2 text-center text-[11px] leading-tight transition-colors duration-300 ${
                  isActive ? 'font-bold text-[#1e1e1e]' : 'font-semibold text-[#6b7280]'
                }`}
              >
                {copy.sectionsSwitcher[bucket]}
              </button>
            );
          })}
        </div>
      </div>

      <div
        className="hidden flex-nowrap items-center gap-2 sm:flex"
        role="tablist"
        aria-label={copy.title}
      >
        <LayoutGroup id="gift-card-sections">
          {FILTER_ORDER.map((bucket) => {
            const isActive = activeFilter === bucket;
            return (
              <button
                key={bucket}
                type="button"
                role="tab"
                aria-selected={isActive}
                onClick={() => setActiveFilter(bucket)}
                className={`relative inline-flex min-h-10 flex-1 items-center justify-center rounded-full px-3 py-2 text-center text-xs leading-tight font-bold transition-colors duration-300 ${
                  isActive ? 'text-white' : 'bg-[#ff6b00]/12 text-[#1e1e1e] hover:bg-[#ff6b00]/20'
                }`}
              >
                {isActive ? (
                  <motion.span
                    layoutId="gift-card-section-pill"
                    className="absolute inset-0 rounded-full bg-[#ff6b00]"
                    transition={
                      reduceMotion ? { duration: 0 } : { type: 'spring', stiffness: 380, damping: 34 }
                    }
                  />
                ) : null}
                <span className="relative z-[1]">{copy.filters[bucket]}</span>
              </button>
            );
          })}
        </LayoutGroup>
      </div>

      {filteredDetails.length === 0 ? (
        <p className="rounded-[22px] bg-[#fff8e7] px-4 py-6 text-sm text-[#1e1e1e]/65">{copy.empty}</p>
      ) : (
        <ul className="space-y-4">
          {filteredDetails.map(({ card, detail }) => (
            <li key={card.id}>
              <ProfileGiftCard locale={locale} card={card} detail={detail} copy={copy} />
            </li>
          ))}
        </ul>
      )}

      <BuyGiftCardDrawer
        key={drawerKey}
        locale={locale}
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        settings={settings}
        defaultPurchaserName={defaultPurchaserName}
        copy={copy.buyDrawer}
      />
    </section>
  );
}
