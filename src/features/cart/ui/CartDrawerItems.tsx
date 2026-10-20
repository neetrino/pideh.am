'use client';

import Image from 'next/image';
import { Minus, Plus, X } from 'lucide-react';
import NumberFlow from '@number-flow/react';
import { motion } from 'motion/react';

import { fadeUp } from '@/components/motion/presets';
import type { CartDrawerItemView } from '@/features/cart/get-cart-drawer-view';

type CartDrawerItemsProps = {
  items: readonly CartDrawerItemView[];
  removeLabel: string;
  decreaseLabel: string;
  increaseLabel: string;
  pending: boolean;
  onQuantity: (itemId: string, quantity: number) => void;
  onRemove: (itemId: string) => void;
};

type CartDrawerLineProps = {
  item: CartDrawerItemView;
  removeLabel: string;
  decreaseLabel: string;
  increaseLabel: string;
  pending: boolean;
  onQuantity: (itemId: string, quantity: number) => void;
  onRemove: (itemId: string) => void;
};

function QuantityStepper({
  quantity,
  decreaseLabel,
  increaseLabel,
  pending,
  onDecrease,
  onIncrease,
}: {
  quantity: number;
  decreaseLabel: string;
  increaseLabel: string;
  pending: boolean;
  onDecrease: () => void;
  onIncrease: () => void;
}) {
  return (
    <div className="inline-flex items-center gap-1 rounded-full bg-[#fff8e7] px-1 py-0.5 ring-1 ring-[#ff6b00]/20">
      <button
        type="button"
        onClick={onDecrease}
        className="flex size-7 items-center justify-center rounded-full text-[#1e1e1e] transition hover:bg-white"
        aria-label={decreaseLabel}
        disabled={pending}
      >
        <Minus className="size-3.5" aria-hidden />
      </button>
      <span className="min-w-5 text-center text-sm font-bold tabular-nums text-[#1e1e1e]">
        <NumberFlow value={quantity} respectMotionPreference />
      </span>
      <button
        type="button"
        onClick={onIncrease}
        className="flex size-7 items-center justify-center rounded-full text-[#1e1e1e] transition hover:bg-white"
        aria-label={increaseLabel}
        disabled={pending}
      >
        <Plus className="size-3.5" aria-hidden />
      </button>
    </div>
  );
}

function CartDrawerLine({
  item,
  removeLabel,
  decreaseLabel,
  increaseLabel,
  pending,
  onQuantity,
  onRemove,
}: CartDrawerLineProps) {
  return (
    <motion.li
      variants={fadeUp}
      layout
      className="rounded-[22px] border border-[#ff6b00]/15 bg-white p-3 shadow-[0_8px_20px_rgba(30,30,30,0.06)]"
    >
      <div className="flex gap-3">
        <div className="relative size-24 shrink-0 overflow-hidden rounded-2xl bg-[#fff8e7]">
          {item.imageUrl ? (
            <Image
              src={item.imageUrl}
              alt={item.title}
              fill
              sizes="96px"
              priority
              className="object-contain p-1"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-xs text-[#1e1e1e]/40">
              —
            </div>
          )}
        </div>
        <div className="flex min-w-0 flex-1 flex-col">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="line-clamp-2 text-sm font-bold text-[#1e1e1e]">{item.title}</p>
              {item.modifierSummary ? (
                <p className="mt-0.5 line-clamp-2 text-xs text-[#1e1e1e]/55">
                  {item.modifierSummary}
                </p>
              ) : null}
              <p className="mt-1 text-sm font-semibold text-[#ff6b00]">{item.lineTotalFormatted}</p>
            </div>
            <button
              type="button"
              onClick={() => onRemove(item.id)}
              className="flex size-7 shrink-0 items-center justify-center rounded-full text-[#1e1e1e]/40 transition hover:bg-[#fff8e7] hover:text-[#ff6b00]"
              aria-label={removeLabel}
              disabled={pending}
            >
              <X className="size-4" aria-hidden />
            </button>
          </div>
          <div className="mt-auto flex justify-end pt-3">
            <QuantityStepper
              quantity={item.quantity}
              decreaseLabel={decreaseLabel}
              increaseLabel={increaseLabel}
              pending={pending}
              onDecrease={() => onQuantity(item.id, item.quantity - 1)}
              onIncrease={() => onQuantity(item.id, item.quantity + 1)}
            />
          </div>
        </div>
      </div>
    </motion.li>
  );
}

export function CartDrawerItems({
  items,
  removeLabel,
  decreaseLabel,
  increaseLabel,
  pending,
  onQuantity,
  onRemove,
}: CartDrawerItemsProps) {
  return (
    <motion.ul
      className="space-y-3"
      initial="hidden"
      animate="show"
      variants={{
        hidden: {},
        show: { transition: { staggerChildren: 0.07 } },
      }}
    >
      {items.map((item) => (
        <CartDrawerLine
          key={item.id}
          item={item}
          removeLabel={removeLabel}
          decreaseLabel={decreaseLabel}
          increaseLabel={increaseLabel}
          pending={pending}
          onQuantity={onQuantity}
          onRemove={onRemove}
        />
      ))}
    </motion.ul>
  );
}
