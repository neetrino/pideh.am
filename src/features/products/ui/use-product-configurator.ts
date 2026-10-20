'use client';

import { useMemo, useState } from 'react';

import { beginCartBadgeAdd } from '@/features/cart/ui/cart-badge-count';
import { addProductToActiveCart } from '@/features/group-orders/application/add-to-active';
import { alertIfSpendLimitExceeded } from '@/features/group-orders/ui/alert-spend-limit-exceeded';
import type { ProductModifierChoice } from '@/features/products/types';
import { formatPdpAmount, sharedPositivePrice } from '@/features/products/ui/format-pdp-price';
import type { Locale } from '@/lib/i18n/config';
import type { Currency } from '@/lib/money/currency';

type UseProductConfiguratorArgs = {
  locale: Locale;
  currency: Currency;
  fxRate: string;
  productId: string;
  stockOnHand: number;
  basePriceAmount: number;
  compareAtAmount: number | null;
  additions: ProductModifierChoice[];
  errorLabel: string;
  /** Runs after a successful add, e.g. to fly the product image to the cart. */
  onAdded: () => void;
};

export function useProductConfigurator({
  locale,
  currency,
  fxRate,
  productId,
  stockOnHand,
  basePriceAmount,
  compareAtAmount,
  additions,
  errorLabel,
  onAdded,
}: UseProductConfiguratorArgs) {
  const maxQty = Math.max(stockOnHand, 0);
  const disabled = maxQty < 1;
  const [quantity, setQuantity] = useState(maxQty > 0 ? 1 : 0);
  const [additionIds, setAdditionIds] = useState<string[]>([]);
  const [exceptionIds, setExceptionIds] = useState<string[]>([]);
  const [customerNote, setCustomerNote] = useState('');
  const [error, setError] = useState<string | null>(null);

  const additionExtras = useMemo(() => {
    const byId = new Map(additions.map((row) => [row.id, row.priceAmount]));
    return additionIds.reduce((sum, id) => sum + (byId.get(id) ?? 0), 0);
  }, [additionIds, additions]);

  const formatAmount = (amount: number) => formatPdpAmount(amount, fxRate, currency, locale);

  const extraHintPrice = sharedPositivePrice(additions.map((row) => row.priceAmount));

  function clearStatus(): void {
    setError(null);
  }

  function changeQuantity(next: number): void {
    if (disabled) return;
    setQuantity(Math.min(Math.max(1, next), maxQty));
    clearStatus();
  }

  function resetSelection(): void {
    if (disabled) return;
    setQuantity(1);
    setAdditionIds([]);
    setExceptionIds([]);
    setCustomerNote('');
    clearStatus();
  }

  function handleAdd(): void {
    if (disabled || quantity < 1) return;
    clearStatus();
    onAdded();
    const settleBadge = beginCartBadgeAdd(quantity);
    const addedQuantity = quantity;
    const modifierIds = [...additionIds, ...exceptionIds];
    const note = customerNote;
    setCustomerNote('');
    window.setTimeout(() => {
      void (async () => {
        try {
          const result = await addProductToActiveCart(productId, addedQuantity, {
            modifierIds,
            customerNote: note,
          });
          if (!result.ok) {
            settleBadge(null);
            setCustomerNote(note);
            if (alertIfSpendLimitExceeded(locale, result)) {
              return;
            }
            setError(result.error);
            return;
          }
          settleBadge(result.itemCount);
        } catch {
          settleBadge(null);
          setCustomerNote(note);
          setError(errorLabel);
        }
      })();
    }, 0);
  }

  const qty = Math.max(quantity, 1);
  const totalAmount = (basePriceAmount + additionExtras) * qty;
  const compareTotal = compareAtAmount == null ? null : (compareAtAmount + additionExtras) * qty;

  return {
    maxQty,
    disabled,
    quantity,
    additionIds,
    exceptionIds,
    customerNote,
    setCustomerNote,
    error,
    pending: false,
    extraHintPrice,
    formatAmount,
    unitPriceFormatted: formatAmount(basePriceAmount),
    totalAmount,
    totalFormatted: formatAmount(totalAmount),
    compareAtTotalFormatted: compareTotal == null ? null : formatAmount(compareTotal),
    setAdditionIds,
    setExceptionIds,
    changeQuantity,
    resetSelection,
    handleAdd,
  };
}
