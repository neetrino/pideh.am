'use client';

import { User, Users } from 'lucide-react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import type { ReactNode } from 'react';

const OPTION_SPRING = { type: 'spring', stiffness: 380, damping: 32 } as const;
const EXPAND_EASE = [0.22, 1, 0.36, 1] as const;

type GroupOrderPaymentOptionProps = {
  selected: boolean;
  title: string;
  hint?: string;
  icon: 'user' | 'users';
  onSelect: () => void;
  children?: ReactNode;
};

export function GroupOrderPaymentOption({
  selected,
  title,
  hint,
  icon,
  onSelect,
  children,
}: GroupOrderPaymentOptionProps) {
  const reduceMotion = useReducedMotion();
  const Icon = icon === 'user' ? User : Users;

  const cardClass = selected
    ? 'border-transparent bg-white shadow-[3px_3px_0_rgba(255,107,0,0.25)]'
    : 'border-pideh-ink/10 bg-white/80 hover:border-pideh-orange/40';

  return (
    <label
      className={`relative block min-w-0 max-w-full cursor-pointer rounded-[18px] border p-4 transition-colors ${cardClass}`}
    >
      {selected ? (
        <motion.span
          layoutId="create-group-payment-frame"
          className="pointer-events-none absolute inset-0 rounded-[18px] border-2 border-pideh-orange"
          transition={reduceMotion ? { duration: 0 } : OPTION_SPRING}
        />
      ) : null}
      <input
        type="radio"
        name="group-order-payment-mode"
        checked={selected}
        onChange={onSelect}
        className="sr-only"
      />
      <span className="relative flex items-start gap-3">
        <Icon
          className={`mt-0.5 h-5 w-5 shrink-0 ${selected ? 'text-pideh-orange' : 'text-pideh-muted'}`}
          aria-hidden
        />
        <span className="min-w-0 flex-1">
          <span className="block text-sm font-semibold text-pideh-ink">{title}</span>
          {hint ? <span className="mt-0.5 block text-xs text-pideh-muted">{hint}</span> : null}
          <SpendLimitSlot selected={selected}>{children}</SpendLimitSlot>
        </span>
        <RadioMark selected={selected} reduceMotion={Boolean(reduceMotion)} />
      </span>
    </label>
  );
}

function SpendLimitSlot({ selected, children }: { selected: boolean; children?: ReactNode }) {
  const reduceMotion = useReducedMotion();

  return (
    <AnimatePresence initial={false}>
      {selected && children ? (
        <motion.span
          className="block overflow-hidden"
          initial={reduceMotion ? false : { height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          exit={reduceMotion ? { opacity: 0 } : { height: 0, opacity: 0 }}
          transition={{ duration: 0.28, ease: EXPAND_EASE }}
        >
          <span className="mt-3 block" onClick={(event) => event.stopPropagation()}>
            {children}
          </span>
        </motion.span>
      ) : null}
    </AnimatePresence>
  );
}

function RadioMark({ selected, reduceMotion }: { selected: boolean; reduceMotion: boolean }) {
  return (
    <span
      className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 ${
        selected ? 'border-pideh-orange' : 'border-pideh-ink/25'
      }`}
      aria-hidden
    >
      {selected ? (
        <motion.span
          layoutId="create-group-payment-dot"
          className="h-2.5 w-2.5 rounded-full bg-pideh-orange"
          transition={reduceMotion ? { duration: 0 } : OPTION_SPRING}
        />
      ) : null}
    </span>
  );
}
