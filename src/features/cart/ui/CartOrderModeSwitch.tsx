'use client';

import { LayoutGroup, motion, useReducedMotion } from 'motion/react';

type CartOrderMode = 'group' | 'personal';

type CartOrderModeSwitchProps = {
  mode: CartOrderMode;
  groupLabel: string;
  personalLabel: string;
  hint: string;
  disabled: boolean;
  onChange: (mode: CartOrderMode) => void;
};

/** Chooses the open group order or a regular personal order. */
export function CartOrderModeSwitch({
  mode,
  groupLabel,
  personalLabel,
  hint,
  disabled,
  onChange,
}: CartOrderModeSwitchProps) {
  const reduceMotion = useReducedMotion() ?? false;

  return (
    <div className="mt-3">
      <p className="mb-2 text-xs leading-4 text-[#1e1e1e]/60">{hint}</p>
      <div className="grid grid-cols-2 gap-1 rounded-full bg-white p-1">
        <LayoutGroup id="cart-order-mode">
          <ModeButton
            active={mode === 'group'}
            disabled={disabled}
            label={groupLabel}
            reduceMotion={reduceMotion}
            onClick={() => onChange('group')}
          />
          <ModeButton
            active={mode === 'personal'}
            disabled={disabled}
            label={personalLabel}
            reduceMotion={reduceMotion}
            onClick={() => onChange('personal')}
          />
        </LayoutGroup>
      </div>
    </div>
  );
}

function ModeButton({
  active,
  disabled,
  label,
  reduceMotion,
  onClick,
}: {
  active: boolean;
  disabled: boolean;
  label: string;
  reduceMotion: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      aria-pressed={active}
      onClick={onClick}
      className={`relative min-h-10 rounded-full px-2 text-xs font-bold transition-colors duration-300 disabled:opacity-60 ${
        active ? 'text-white' : 'text-[#1e1e1e]'
      }`}
    >
      {active ? (
        <motion.span
          layoutId="cart-order-mode-pill"
          className="absolute inset-0 rounded-full bg-[#ff6b00]"
          transition={reduceMotion ? { duration: 0 } : { type: 'spring', stiffness: 380, damping: 34 }}
        />
      ) : null}
      <span className="relative z-[1]">{label}</span>
    </button>
  );
}
