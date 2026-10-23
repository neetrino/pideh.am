'use client';

import {
  CASH_CHANGE_NOT_NEEDED,
  cashNotesCoveringPayable,
  type CashChangeDenominationView,
} from '@/features/delivery/domain/cash-change';
import { formatMoneyAmount } from '@/lib/money/format';
import type { Locale } from '@/lib/i18n/config';

type CashChangePickerLabels = {
  title: string;
  hint: string;
  ariaLabel: string;
  notNeeded: string;
};

type CashChangePickerProps = {
  options: CashChangeDenominationView[];
  payableAmount: number;
  value: number | null;
  onChange: (amount: number) => void;
  disabled?: boolean;
  locale: Locale;
  labels: CashChangePickerLabels;
};

export function CashChangePicker({
  options,
  payableAmount,
  value,
  onChange,
  disabled = false,
  locale,
  labels,
}: CashChangePickerProps) {
  const visibleOptions = cashNotesCoveringPayable(options, payableAmount);

  if (visibleOptions.length === 0) {
    return null;
  }

  const notNeededSelected = value === CASH_CHANGE_NOT_NEEDED;

  return (
    <fieldset
      className="rounded-2xl border border-[#1e1e1e]/10 bg-[#fffaf3] p-3"
      disabled={disabled}
      data-checkout-field="cashChange"
    >
      <legend className="sr-only">{labels.title}</legend>
      <div className="flex flex-col gap-4">
        <p className="font-display text-2xl leading-none text-[#1e1e1e] uppercase">{labels.title}</p>
        <p className="text-xs text-[#1e1e1e]/60">{labels.hint}</p>
      </div>
      <div
        className="mt-2 grid grid-cols-2 gap-2.5 sm:grid-cols-4"
        role="radiogroup"
        aria-label={labels.ariaLabel}
      >
        <button
          type="button"
          role="radio"
          aria-checked={notNeededSelected}
          disabled={disabled}
          onClick={() => onChange(CASH_CHANGE_NOT_NEEDED)}
          className={`flex h-full items-center justify-center rounded-xl border-2 px-2 text-center text-xs font-bold leading-tight transition-colors ${
            notNeededSelected
              ? 'border-[#ff6b00] bg-[#fff1e6] text-[#ff6b00]'
              : 'border-[#1e1e1e]/10 bg-white text-[#1e1e1e] hover:border-[#ff6b00]/45'
          } disabled:cursor-not-allowed disabled:opacity-50`}
        >
          {labels.notNeeded}
        </button>
        {visibleOptions.map((option) => {
          const selected = value === option.amount;
          const amountLabel = formatMoneyAmount(option.amount, 'AMD', locale);
          return (
            <button
              key={option.id}
              type="button"
              role="radio"
              aria-checked={selected}
              aria-label={amountLabel}
              disabled={disabled}
              onClick={() => onChange(option.amount)}
              className={`relative overflow-hidden rounded-xl border-2 bg-white p-0 transition-colors ${
                selected ? 'border-[#ff6b00]' : 'border-[#1e1e1e]/10 hover:border-[#ff6b00]/45'
              } disabled:cursor-not-allowed disabled:opacity-50`}
            >
              <span className="block aspect-[2.15/1] w-full">
                {option.imageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element -- CDN/local media URL
                  <img
                    src={option.imageUrl}
                    alt=""
                    className="absolute inset-0 h-full w-full object-cover"
                  />
                ) : (
                  <span className="flex h-full items-center justify-center text-sm font-bold text-[#ff6b00]">
                    {amountLabel}
                  </span>
                )}
              </span>
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}
