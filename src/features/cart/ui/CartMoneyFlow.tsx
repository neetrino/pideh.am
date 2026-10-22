'use client';

import NumberFlow from '@number-flow/react';

import { currencySymbols, type Currency } from '@/lib/money/currency';
import { getCurrencyMeta } from '@/lib/money/currency-meta';

type CartMoneyFlowProps = {
  amount: number;
  currency: Currency;
  className?: string;
};

export function CartMoneyFlow({ amount, currency, className }: CartMoneyFlowProps) {
  const meta = getCurrencyMeta(currency);
  const major = amount / 10 ** meta.scale;

  return (
    <span className={className}>
      <NumberFlow
        value={major}
        suffix={` ${currencySymbols[currency]}`}
        format={{
          minimumFractionDigits: meta.fractionDigits,
          maximumFractionDigits: meta.fractionDigits,
        }}
        respectMotionPreference
        transformTiming={{ duration: 480, easing: 'ease-out' }}
      />
    </span>
  );
}
