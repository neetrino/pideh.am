'use client';

import { Truck, UserRound, type LucideIcon } from 'lucide-react';

import type { CheckoutShippingMethod } from '@/features/checkout/domain/shipping-methods';
import {
  CHECKOUT_PANEL,
  CHECKOUT_RADIO,
  CHECKOUT_RADIO_OFF,
  CHECKOUT_RADIO_ON,
  CHECKOUT_SECTION_TITLE,
} from '@/features/checkout/ui/checkout-ui-classes';

const SHIPPING_ICONS: Record<CheckoutShippingMethod, LucideIcon> = {
  pickup: UserRound,
  delivery: Truck,
};

export type PickupBranchOption = {
  id: string;
  address: string;
};

type ShippingOption = {
  id: CheckoutShippingMethod;
  name: string;
  description: string;
};

type CheckoutShippingMethodsProps = {
  title: string;
  options: ShippingOption[];
  value: CheckoutShippingMethod;
  onChange: (method: CheckoutShippingMethod) => void;
  disabled: boolean;
  pickupBranches: PickupBranchOption[];
  pickupBranchId: string;
  onPickupBranchChange: (branchId: string) => void;
};

export function CheckoutShippingMethods({
  title,
  options,
  value,
  onChange,
  disabled,
  pickupBranches,
  pickupBranchId,
  onPickupBranchChange,
}: CheckoutShippingMethodsProps) {
  const showBranches = value === 'pickup' && pickupBranches.length > 0;

  return (
    <section className={CHECKOUT_PANEL}>
      <h2 className={`${CHECKOUT_SECTION_TITLE} !mb-3`}>{title}</h2>
      <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
        {options.map((option) => {
          const selected = value === option.id;
          const Icon = SHIPPING_ICONS[option.id];

          return (
            <label
              key={option.id}
              className={`flex cursor-pointer items-start gap-2 rounded-2xl border-2 p-2.5 transition-colors sm:p-3 ${
                selected ? CHECKOUT_RADIO_ON : CHECKOUT_RADIO_OFF
              }`}
            >
              <input
                type="radio"
                name="shippingMethod"
                value={option.id}
                checked={selected}
                onChange={() => onChange(option.id)}
                className={`${CHECKOUT_RADIO} mt-0.5`}
                disabled={disabled}
              />
              <span className="min-w-0">
                <span className="flex items-center gap-1.5 text-sm font-bold leading-tight text-[#1e1e1e]">
                  <Icon className="size-4 shrink-0 text-[#ff6b00]" aria-hidden />
                  {option.name}
                </span>
                <span className="mt-1 block text-xs leading-snug text-[#1e1e1e]/60">
                  {option.description}
                </span>
              </span>
            </label>
          );
        })}
      </div>
      {showBranches ? (
        <div className="mt-3 space-y-2">
          {pickupBranches.map((branch) => {
            const selected = pickupBranchId === branch.id;

            return (
              <label
                key={branch.id}
                className={`flex cursor-pointer items-center gap-3 rounded-2xl border px-3 py-2.5 transition-colors ${
                  selected ? CHECKOUT_RADIO_ON : CHECKOUT_RADIO_OFF
                }`}
              >
                <input
                  type="radio"
                  name="pickupBranch"
                  value={branch.id}
                  checked={selected}
                  onChange={() => onPickupBranchChange(branch.id)}
                  className={CHECKOUT_RADIO}
                  disabled={disabled}
                />
                <span className="text-sm font-medium text-[#1e1e1e]">{branch.address}</span>
              </label>
            );
          })}
        </div>
      ) : null}
    </section>
  );
}
