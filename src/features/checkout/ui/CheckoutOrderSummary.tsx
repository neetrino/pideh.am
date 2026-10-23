'use client';

import Link from 'next/link';

import { Button } from '@/components/ui/Button';
import { CHECKOUT_APPLY_BTN, CHECKOUT_PANEL, CHECKOUT_PRIMARY_BTN } from '@/features/checkout/ui/checkout-ui-classes';

type CheckoutMemberBonus = {
  mode: 'member';
  enabled: boolean;
  availableBalance: number;
  maxRedeem: number;
  useBonuses: boolean;
  redeemAmount: number;
  earnPoints: number;
  onToggle: (enabled: boolean) => void;
  onAmountChange: (amount: number) => void;
  onUseMax: () => void;
  labels: {
    title: string;
    available: string;
    useBonuses: string;
    amount: string;
    useMax: string;
    applied: string;
    earn: string;
  };
  formatMoney: (amount: number) => string;
};

type CheckoutGuestBonus = {
  mode: 'guest';
  earnPoints: number;
  registerHref: string;
  labels: {
    warning: string;
    register: string;
  };
};

type CheckoutOrderSummaryProps = {
  title: string;
  couponTitle: string;
  couponPlaceholder: string;
  couponApplyLabel: string;
  couponApplyingLabel: string;
  giftCardTitle: string;
  giftCardPlaceholder: string;
  giftCardApplyLabel: string;
  giftCardApplyingLabel: string;
  giftCardInitialLabel: string;
  giftCardUsedLabel: string;
  giftCardRemainingLabel: string;
  giftCardPayableLabel: string;
  giftCardAppliedLabel: string;
  orderNoteLabel: string;
  orderNotePlaceholder: string;
  orderNote: string;
  onOrderNoteChange: (value: string) => void;
  discountLabel: string;
  subtotalLabel: string;
  shippingLabel: string;
  totalLabel: string;
  participantsPrepaidLabel?: string;
  participantsPrepaidFormatted?: string | null;
  subtotalFormatted: string;
  shippingFormatted: string | null;
  discountFormatted: string | null;
  totalFormatted: string;
  couponDraft: string;
  onCouponDraftChange: (value: string) => void;
  onApplyCoupon: () => void;
  couponError: string | null;
  isApplyingCoupon: boolean;
  giftCardDraft: string;
  onGiftCardDraftChange: (value: string) => void;
  onApplyGiftCard: () => void;
  giftCardError: string | null;
  isApplyingGiftCard: boolean;
  giftCardPreview: {
    code: string;
    initialAmount: number;
    redeemAmount: number;
    remainingBalance: number;
    payableAfter: number;
  } | null;
  formatMoney: (amount: number) => string;
  error: string | null;
  isSubmitting: boolean;
  placeOrderLabel: string;
  processingLabel: string;
  bonus?: CheckoutMemberBonus | CheckoutGuestBonus;
};

export function CheckoutOrderSummary({
  title,
  couponTitle,
  couponPlaceholder,
  couponApplyLabel,
  couponApplyingLabel,
  giftCardTitle,
  giftCardPlaceholder,
  giftCardApplyLabel,
  giftCardApplyingLabel,
  giftCardInitialLabel,
  giftCardUsedLabel,
  giftCardRemainingLabel,
  giftCardPayableLabel,
  giftCardAppliedLabel,
  orderNoteLabel,
  orderNotePlaceholder,
  orderNote,
  onOrderNoteChange,
  discountLabel,
  subtotalLabel,
  shippingLabel,
  totalLabel,
  participantsPrepaidLabel,
  participantsPrepaidFormatted,
  subtotalFormatted,
  shippingFormatted,
  discountFormatted,
  totalFormatted,
  couponDraft,
  onCouponDraftChange,
  onApplyCoupon,
  couponError,
  isApplyingCoupon,
  giftCardDraft,
  onGiftCardDraftChange,
  onApplyGiftCard,
  giftCardError,
  isApplyingGiftCard,
  giftCardPreview,
  formatMoney,
  error,
  isSubmitting,
  placeOrderLabel,
  processingLabel,
  bonus,
}: CheckoutOrderSummaryProps) {
  const codeRowClass =
    'flex h-14 items-center gap-2 rounded-[20px] border-[1.5px] border-[#1e1e1e]/12 bg-[#fff8e7] pr-1.5 pl-4';
  const codeInputClass =
    'h-full min-w-0 flex-1 bg-transparent text-sm text-[#1e1e1e] outline-none placeholder:text-[#1e1e1e]/35 disabled:opacity-60';
  const codeButtonClass = CHECKOUT_APPLY_BTN;

  return (
    <div>
      <aside className={`${CHECKOUT_PANEL} sticky top-[5.75rem] md:top-28`}>
        <h2 className="font-display mb-5 text-2xl leading-none text-[#1e1e1e] uppercase">{title}</h2>

        <div className="mb-5 flex flex-col gap-3">
          <div className={codeRowClass}>
            <input
              type="text"
              name="couponCodeDraft"
              value={couponDraft}
              onChange={(event) => onCouponDraftChange(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter') {
                  event.preventDefault();
                  onApplyCoupon();
                }
              }}
              placeholder={couponPlaceholder}
              autoComplete="off"
              disabled={isSubmitting || isApplyingCoupon}
              aria-label={couponTitle}
              className={codeInputClass}
            />
            <button
              type="button"
              className={`${codeButtonClass} mr-0.5`}
              disabled={isSubmitting || isApplyingCoupon || !couponDraft.trim()}
              onClick={onApplyCoupon}
            >
              {isApplyingCoupon ? couponApplyingLabel : couponApplyLabel}
            </button>
          </div>
          {couponError ? (
            <p className="mt-2 text-sm text-red-600" role="alert">
              {couponError}
            </p>
          ) : null}
          <div className={codeRowClass}>
            <input
              type="text"
              name="giftCardCodeDraft"
              value={giftCardDraft}
              onChange={(event) => onGiftCardDraftChange(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter') {
                  event.preventDefault();
                  onApplyGiftCard();
                }
              }}
              placeholder={giftCardPlaceholder}
              autoComplete="off"
              disabled={isSubmitting || isApplyingGiftCard}
              aria-label={giftCardTitle}
              className={codeInputClass}
            />
            <button
              type="button"
              className={`${codeButtonClass} mr-0.5`}
              disabled={isSubmitting || isApplyingGiftCard || !giftCardDraft.trim()}
              onClick={onApplyGiftCard}
            >
              {isApplyingGiftCard ? giftCardApplyingLabel : giftCardApplyLabel}
            </button>
          </div>
          {giftCardError ? (
            <p className="mt-2 text-sm text-red-600" role="alert">
              {giftCardError}
            </p>
          ) : null}
          {giftCardPreview ? (
            <dl className="mt-3 space-y-1.5 rounded-2xl bg-white px-3 py-2.5 text-xs text-[#1e1e1e]/70">
              <div className="flex justify-between gap-3">
                <dt>{giftCardInitialLabel}</dt>
                <dd className="font-bold text-[#1e1e1e]">{formatMoney(giftCardPreview.initialAmount)}</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt>{giftCardUsedLabel}</dt>
                <dd className="font-bold text-[#ff6b00]">{formatMoney(giftCardPreview.redeemAmount)}</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt>{giftCardRemainingLabel}</dt>
                <dd className="font-bold text-[#1e1e1e]">
                  {formatMoney(giftCardPreview.remainingBalance)}
                </dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt>{giftCardPayableLabel}</dt>
                <dd className="font-bold text-[#1e1e1e]">{formatMoney(giftCardPreview.payableAfter)}</dd>
              </div>
            </dl>
          ) : null}

        {bonus?.mode === 'member' && bonus.enabled ? (
          <div>
            <label className={`${codeRowClass} cursor-pointer text-sm font-bold text-[#1e1e1e]`}>
              <input
                type="checkbox"
                checked={bonus.useBonuses}
                disabled={isSubmitting || bonus.maxRedeem <= 0}
                onChange={(event) => bonus.onToggle(event.target.checked)}
                className="size-5 shrink-0 rounded border-[#ff6b00]/40 bg-white accent-[#ff6b00]"
              />
              <span className="min-w-0 flex-1 truncate">{bonus.labels.useBonuses}</span>
              <span className="shrink-0 text-sm font-medium">
                {bonus.labels.available.replace('{amount}', bonus.formatMoney(bonus.availableBalance))}
              </span>
            </label>
            {bonus.useBonuses ? (
              <div className="mt-2 flex gap-2">
                <input
                  type="number"
                  min={0}
                  max={bonus.maxRedeem}
                  step={1}
                  value={bonus.redeemAmount || ''}
                  onChange={(event) => {
                    const next = Number(event.target.value);
                    bonus.onAmountChange(Number.isFinite(next) ? Math.max(0, Math.floor(next)) : 0);
                  }}
                  disabled={isSubmitting}
                  aria-label={bonus.labels.amount}
                  className="h-10 min-w-0 flex-1 rounded-full border-[1.5px] border-[#1e1e1e]/12 bg-white px-4 text-sm text-[#1e1e1e] outline-none"
                />
                <button
                  type="button"
                  className={codeButtonClass}
                  disabled={isSubmitting || bonus.maxRedeem <= 0}
                  onClick={bonus.onUseMax}
                >
                  {bonus.labels.useMax}
                </button>
              </div>
            ) : null}
          </div>
        ) : null}
        </div>

        <label className="mb-4 block">
          <span className="mb-2 block text-sm font-bold text-[#1e1e1e]">{orderNoteLabel}</span>
          <textarea
            name="orderNote"
            value={orderNote}
            onChange={(event) => onOrderNoteChange(event.target.value)}
            rows={3}
            maxLength={500}
            placeholder={orderNotePlaceholder}
            disabled={isSubmitting}
            className="h-auto min-h-24 w-full resize-none rounded-[18px] border-[1.5px] border-[#1e1e1e]/12 bg-[#fff8e7] px-4 py-3 text-sm text-[#1e1e1e] outline-none placeholder:text-[#1e1e1e]/35"
          />
        </label>

        {bonus?.mode === 'guest' ? (
          <div className="mb-4 rounded-[18px] border border-[#ff6b00]/15 bg-[#fff8e7]/70 px-4 py-3">
            <p className="text-sm leading-snug text-[#1e1e1e]">
              {bonus.labels.warning.replace('{amount}', String(bonus.earnPoints))}
            </p>
            <Link
              href={bonus.registerHref}
              className="mt-3 inline-flex text-sm font-bold text-[#ff6b00] underline-offset-2 hover:underline"
            >
              {bonus.labels.register}
            </Link>
          </div>
        ) : null}

        <div className="mb-5 space-y-4 text-sm">
          <div className="flex items-center justify-between gap-3 text-[#1e1e1e]/80">
            <span>{subtotalLabel}</span>
            <span className="flex items-center gap-2">
              <span className="font-bold text-[#1e1e1e]">{subtotalFormatted}</span>
              {bonus?.mode === 'member' && bonus.useBonuses && bonus.redeemAmount > 0 ? (
                <span className="rounded-full border border-red-200 bg-white px-2 py-0.5 text-xs font-bold text-red-600">
                  -{bonus.formatMoney(bonus.redeemAmount)}
                </span>
              ) : null}
            </span>
          </div>
          {discountFormatted ? (
            <div className="flex items-baseline justify-between gap-3 text-[#1e1e1e]/80">
              <span>{discountLabel}</span>
              <span className="text-[#ff6b00]">-{discountFormatted}</span>
            </div>
          ) : null}
          {giftCardPreview && giftCardPreview.redeemAmount > 0 ? (
            <div className="flex items-baseline justify-between gap-3 text-[#1e1e1e]/80">
              <span>{giftCardAppliedLabel}</span>
              <span className="text-[#ff6b00]">-{formatMoney(giftCardPreview.redeemAmount)}</span>
            </div>
          ) : null}
          <div className="flex items-baseline justify-between gap-3 text-[#1e1e1e]/80">
            <span className="shrink-0">{shippingLabel}</span>
            <span className="max-w-[62%] text-right font-bold text-[#1e1e1e]">
              {shippingFormatted ?? '—'}
            </span>
          </div>
          {participantsPrepaidFormatted && participantsPrepaidLabel ? (
            <div className="flex items-baseline justify-between gap-3 text-[#1e1e1e]/80">
              <span>{participantsPrepaidLabel}</span>
              <span className="text-[#ff6b00]">-{participantsPrepaidFormatted}</span>
            </div>
          ) : null}
          {bonus?.mode === 'member' && bonus.earnPoints > 0 ? (
            <div className="flex items-baseline justify-between gap-3 text-[#ff6b00]">
              <span>{bonus.labels.earn}</span>
              <span className="font-bold">+{bonus.earnPoints}</span>
            </div>
          ) : null}
          <div className="mt-1 flex items-end justify-between gap-3 border-t border-[#1e1e1e]/10 pt-3">
            <span className="font-display text-xl leading-none text-[#1e1e1e] uppercase">
              {totalLabel}
            </span>
            <span className="font-display text-2xl leading-none text-[#1e1e1e]">{totalFormatted}</span>
          </div>
        </div>

        {error ? (
          <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        ) : null}

        <Button
          type="submit"
          variant="primary"
          size="lg"
          className={CHECKOUT_PRIMARY_BTN}
          disabled={isSubmitting}
        >
          {isSubmitting ? processingLabel : placeOrderLabel}
        </Button>
      </aside>
    </div>
  );
}
