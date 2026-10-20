'use client';

import Image from 'next/image';
import { useEffect, useRef, useState, type MouseEvent, type ReactNode } from 'react';

import { PidehPillButton } from '@/components/brand/PidehPillButton';
import { beginCartBadgeAdd } from '@/features/cart/ui/cart-badge-count';
import { setActiveCartProductQuantity } from '@/features/group-orders/application/add-to-active';
import { alertIfSpendLimitExceeded } from '@/features/group-orders/ui/alert-spend-limit-exceeded';
import { PIDEH_ASSETS } from '@/features/home/ui/brand-assets';
import { MOBILE_HOME_ASSETS } from '@/features/home/ui/mobile/mobile-assets';
import enCart from '@/locales/en/cart.json';
import hyCart from '@/locales/hy/cart.json';
import ruCart from '@/locales/ru/cart.json';
import type { Locale } from '@/lib/i18n/config';

const QUANTITY_LABELS = { hy: hyCart, en: enCart, ru: ruCart } as const;

type ProductCardCartControlProps = {
  productId: string;
  locale: Locale;
  orderLabel: string;
  initialQuantity?: number;
  maxQuantity?: number;
  inStock: boolean;
  variant: 'pill' | 'compact';
};

function stopPress(event: MouseEvent<HTMLElement>): void {
  event.preventDefault();
  event.stopPropagation();
}

function useCardQuantity(
  productId: string,
  locale: Locale,
  initialQuantity: number,
  maxQuantity: number,
  inStock: boolean,
): { quantity: number; commit: (next: number) => void } {
  const [quantity, setQuantity] = useState(initialQuantity);
  const quantityRef = useRef(initialQuantity);
  const requestRef = useRef(0);

  useEffect(() => {
    quantityRef.current = initialQuantity;
    setQuantity(initialQuantity);
  }, [initialQuantity, productId]);

  function commit(next: number): void {
    if (!inStock || next === quantityRef.current) return;
    if (next < 0 || next > maxQuantity) return;
    const previous = quantityRef.current;
    quantityRef.current = next;
    setQuantity(next);
    const settle = beginCartBadgeAdd(next - previous);
    const requestId = ++requestRef.current;
    // Paint the new count first. The database write can finish later.
    window.setTimeout(() => {
      void saveQuantity(
        productId,
        locale,
        previous,
        next,
        settle,
        () => requestRef.current === requestId,
        quantityRef,
        setQuantity,
      );
    }, 0);
  }

  return { quantity, commit };
}

async function saveQuantity(
  productId: string,
  locale: Locale,
  previous: number,
  next: number,
  settle: (count: number | null) => void,
  isLatest: () => boolean,
  quantityRef: { current: number },
  setQuantity: (value: number) => void,
): Promise<void> {
  try {
    const result = await setActiveCartProductQuantity(productId, next);
    if (!isLatest()) return;
    if (!result.ok) {
      quantityRef.current = previous;
      setQuantity(previous);
      settle(null);
      alertIfSpendLimitExceeded(locale, result);
      return;
    }
    quantityRef.current = result.quantity;
    setQuantity(result.quantity);
    settle(result.itemCount);
  } catch {
    if (!isLatest()) return;
    quantityRef.current = previous;
    setQuantity(previous);
    settle(null);
  }
}

/**
 * Order action on a product card. After the first add, the same slot becomes
 * a minus / count / plus control for that cart line.
 */
export function ProductCardCartControl({
  productId,
  locale,
  orderLabel,
  initialQuantity = 0,
  maxQuantity = 99,
  inStock,
  variant,
}: ProductCardCartControlProps) {
  const labels = QUANTITY_LABELS[locale];
  const { quantity, commit } = useCardQuantity(
    productId,
    locale,
    initialQuantity,
    maxQuantity,
    inStock,
  );

  if (quantity < 1) {
    return variant === 'compact' ? (
      <CompactAdd label={orderLabel} disabled={!inStock} onAdd={() => commit(1)} />
    ) : (
      <PidehPillButton
        label={orderLabel}
        onClick={(event) => {
          stopPress(event);
          commit(1);
        }}
        disabled={!inStock}
        className="shrink-0"
      />
    );
  }

  const stepperProps = {
    quantity,
    pending: false,
    maxQuantity,
    decreaseLabel: labels.decreaseQuantity,
    increaseLabel: labels.increaseQuantity,
    onDecrease: () => commit(quantity - 1),
    onIncrease: () => commit(quantity + 1),
  };

  return variant === 'compact' ? <CompactStepper {...stepperProps} /> : <PillStepper {...stepperProps} />;
}

type StepperProps = {
  quantity: number;
  pending: boolean;
  maxQuantity: number;
  decreaseLabel: string;
  increaseLabel: string;
  onDecrease: () => void;
  onIncrease: () => void;
};

function PillStepper({
  quantity,
  pending,
  maxQuantity,
  decreaseLabel,
  increaseLabel,
  onDecrease,
  onIncrease,
}: StepperProps) {
  return (
    <div className="flex h-[58px] shrink-0 items-center justify-between gap-2 rounded-[42px] border border-[rgba(255,107,0,0.43)] bg-[#ff6b00] px-2 text-white">
      <RoundButton label={decreaseLabel} disabled={pending} onClick={onDecrease} tone="ghost">
        <Image src={PIDEH_ASSETS.pdpQtyMinus} alt="" width={14} height={14} className="size-[14px]" />
      </RoundButton>
      <span className="min-w-6 text-center text-base leading-6 font-bold" aria-live="polite">
        {quantity}
      </span>
      <RoundButton
        label={increaseLabel}
        disabled={pending || quantity >= maxQuantity}
        onClick={onIncrease}
        tone="solid"
      >
        <Image src={PIDEH_ASSETS.pdpQtyPlus} alt="" width={14} height={14} className="size-[14px]" />
      </RoundButton>
    </div>
  );
}

function CompactStepper(props: StepperProps) {
  return (
    <div className="relative z-10 flex shrink-0 items-center gap-1">
      <OutlineButton label={props.decreaseLabel} disabled={props.pending} onClick={props.onDecrease}>
        −
      </OutlineButton>
      <span className="w-6 text-center text-lg leading-none font-bold text-[#1e1e1e]" aria-live="polite">
        {props.quantity}
      </span>
      <OutlineButton
        label={props.increaseLabel}
        disabled={props.pending || props.quantity >= props.maxQuantity}
        onClick={props.onIncrease}
      >
        +
      </OutlineButton>
    </div>
  );
}

function CompactAdd({
  label,
  disabled,
  onAdd,
}: {
  label: string;
  disabled: boolean;
  onAdd: () => void;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      disabled={disabled}
      onClick={(event) => {
        stopPress(event);
        onAdd();
      }}
      className="relative z-10 box-border flex h-[56px] w-[59px] shrink-0 items-center justify-center overflow-hidden rounded-[42px] border-0 bg-[#ff6b00] p-0 transition enabled:hover:brightness-105 enabled:active:scale-95 disabled:pointer-events-none disabled:opacity-50"
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={MOBILE_HOME_ASSETS.plus}
        alt=""
        width={24}
        height={24}
        className="pointer-events-none size-6 max-w-none"
        draggable={false}
      />
    </button>
  );
}

function RoundButton({
  label,
  disabled,
  onClick,
  tone,
  children,
}: {
  label: string;
  disabled: boolean;
  onClick: () => void;
  tone: 'ghost' | 'solid';
  children: ReactNode;
}) {
  const toneClass = tone === 'solid' ? 'bg-white' : 'bg-white/45';

  return (
    <button
      type="button"
      aria-label={label}
      disabled={disabled}
      onClick={(event) => {
        stopPress(event);
        onClick();
      }}
      className={`flex size-10 items-center justify-center rounded-full ${toneClass} transition enabled:hover:brightness-105 enabled:active:scale-95 disabled:opacity-40`}
    >
      {children}
    </button>
  );
}

function OutlineButton({
  label,
  disabled,
  onClick,
  children,
}: {
  label: string;
  disabled: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      disabled={disabled}
      onClick={(event) => {
        stopPress(event);
        onClick();
      }}
      className="flex size-9 items-center justify-center rounded-full border border-[#ff6b00] text-lg leading-none font-bold text-[#ff6b00] transition enabled:active:scale-95 disabled:opacity-40"
    >
      {children}
    </button>
  );
}
