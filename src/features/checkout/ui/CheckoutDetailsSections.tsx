'use client';

import {
  CHECKOUT_FIELD,
  CHECKOUT_LABEL,
  CHECKOUT_PANEL,
  CHECKOUT_SECTION_TITLE,
} from '@/features/checkout/ui/checkout-ui-classes';
import { AddressAutocomplete } from '@/components/ui/AddressAutocomplete';
import { SelectDropdown } from '@/components/ui/SelectDropdown';
import type { CheckoutPaymentMethod } from '@/features/checkout/domain/payment-methods';
import type { CheckoutShippingMethod } from '@/features/checkout/domain/shipping-methods';
import { CashChangePicker } from '@/features/checkout/ui/CashChangePicker';
import {
  CheckoutPaymentMethods,
  type PaymentOption,
} from '@/features/checkout/ui/CheckoutPaymentMethods';
import {
  CheckoutShippingMethods,
  type PickupBranchOption,
} from '@/features/checkout/ui/CheckoutShippingMethods';
import { DeliverySlotPicker } from '@/features/checkout/ui/DeliverySlotPicker';
import type { CashChangeDenominationView } from '@/features/delivery/domain/cash-change';
import type { DeliveryScheduleSettings } from '@/features/delivery/domain/delivery-schedule';
import type { SelectedDeliverySlot } from '@/features/delivery/domain/delivery-schedule';
import type { Locale } from '@/lib/i18n/config';

export type CheckoutDeliveryZoneOption = {
  id: string;
  label: string;
  priceAmount: number;
};

type CheckoutDetailsLabels = {
  contactInformation: string;
  shippingMethod: string;
  shippingAddress: string;
  paymentMethod: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address: string;
  floor: string;
  intercomCode: string;
  phonePlaceholder: string;
  addressPlaceholder: string;
  floorPlaceholder: string;
  intercomCodePlaceholder: string;
  deliveryLocation: string;
  selectLocation: string;
  scheduleTitle: string;
  scheduleDeliverTo: string;
  scheduleApproximatelyOneHour: string;
  scheduleChange: string;
  scheduleUseAsap: string;
  schedulePickDate: string;
  schedulePickTime: string;
  scheduleDeliveryDay: string;
  scheduleDeliveryTime: string;
  scheduleTimeHint: string;
  scheduleNoSlots: string;
  schedulePrevMonth: string;
  scheduleNextMonth: string;
  scheduleApply: string;
  scheduleClose: string;
  cashChangeTitle: string;
  cashChangeHint: string;
  cashChangeAria: string;
  cashChangeNotNeeded: string;
  pickupStoreHint: string;
};

type ShippingOption = {
  id: CheckoutShippingMethod;
  name: string;
  description: string;
};

type CheckoutDetailsSectionsProps = {
  labels: CheckoutDetailsLabels;
  locale: Locale;
  pending: boolean;
  shippingMethod: CheckoutShippingMethod;
  onShippingMethodChange: (method: CheckoutShippingMethod) => void;
  shippingOptions: ShippingOption[];
  pickupBranches: PickupBranchOption[];
  pickupBranchId: string;
  onPickupBranchChange: (branchId: string) => void;
  storePickupAddress: string | null;
  deliverySchedule: DeliveryScheduleSettings;
  deliverySlot: SelectedDeliverySlot | null;
  onDeliverySlotChange: (value: SelectedDeliverySlot | null) => void;
  cashChangeOptions: CashChangeDenominationView[];
  cashChangeAmount: number | null;
  onCashChangeAmountChange: (amount: number) => void;
  deliveryZones: CheckoutDeliveryZoneOption[];
  deliveryRuleId: string;
  onDeliveryRuleIdChange: (id: string) => void;
  line1: string;
  onLine1Change: (value: string) => void;
  paymentMethod: CheckoutPaymentMethod | null;
  onPaymentMethodChange: (method: CheckoutPaymentMethod) => void;
  paymentOptions: PaymentOption[];
  defaultFirstName: string;
  defaultLastName: string;
  defaultEmail: string;
  defaultPhone: string;
};

export function CheckoutDetailsSections({
  labels,
  locale,
  pending,
  shippingMethod,
  onShippingMethodChange,
  shippingOptions,
  pickupBranches,
  pickupBranchId,
  onPickupBranchChange,
  storePickupAddress,
  deliverySchedule,
  deliverySlot,
  onDeliverySlotChange,
  cashChangeOptions,
  cashChangeAmount,
  onCashChangeAmountChange,
  deliveryZones,
  deliveryRuleId,
  onDeliveryRuleIdChange,
  line1,
  onLine1Change,
  paymentMethod,
  onPaymentMethodChange,
  paymentOptions,
  defaultFirstName,
  defaultLastName,
  defaultEmail,
  defaultPhone,
}: CheckoutDetailsSectionsProps) {
  const isDelivery = shippingMethod === 'delivery';

  return (
    <div className="space-y-6 lg:col-span-2">
      <section className={CHECKOUT_PANEL}>
        <h2 className={CHECKOUT_SECTION_TITLE}>{labels.contactInformation}</h2>
        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <label className={CHECKOUT_LABEL}>
              {labels.firstName}
              <input
                name="firstName"
                required
                defaultValue={defaultFirstName}
                disabled={pending}
                className={CHECKOUT_FIELD}
                autoComplete="given-name"
              />
            </label>
            <label className={CHECKOUT_LABEL}>
              {labels.lastName}
              <input
                name="lastName"
                required
                defaultValue={defaultLastName}
                disabled={pending}
                className={CHECKOUT_FIELD}
                autoComplete="family-name"
              />
            </label>
          </div>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <label className={CHECKOUT_LABEL}>
              {labels.email}
              <input
                name="contactEmail"
                type="email"
                required
                defaultValue={defaultEmail}
                disabled={pending}
                className={CHECKOUT_FIELD}
                autoComplete="email"
              />
            </label>
            <label className={CHECKOUT_LABEL}>
              {labels.phone}
              <input
                name="contactPhone"
                required
                defaultValue={defaultPhone}
                placeholder={labels.phonePlaceholder}
                disabled={pending}
                className={CHECKOUT_FIELD}
                autoComplete="tel"
              />
            </label>
          </div>
        </div>
      </section>

      <CheckoutShippingMethods
        title={labels.shippingMethod}
        options={shippingOptions}
        value={shippingMethod}
        onChange={onShippingMethodChange}
        disabled={pending}
        pickupBranches={pickupBranches}
        pickupBranchId={pickupBranchId}
        onPickupBranchChange={onPickupBranchChange}
      />

      {isDelivery ? (
      <section className={CHECKOUT_PANEL}>
        <h2 className={CHECKOUT_SECTION_TITLE}>{labels.shippingAddress}</h2>
        <div className="space-y-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="min-w-0 space-y-1.5" data-checkout-field="deliveryRuleId">
                  <span className="text-sm font-bold text-[#1e1e1e]">{labels.deliveryLocation}</span>
                  <SelectDropdown
                    ariaLabel={labels.deliveryLocation}
                    value={deliveryRuleId}
                    allLabel={labels.selectLocation}
                    options={deliveryZones.map((zone) => ({
                      value: zone.id,
                      label: zone.label,
                    }))}
                    onValueChange={onDeliveryRuleIdChange}
                    disabled={pending || deliveryZones.length === 0}
                    tone="brand"
                    className="w-full"
                  />
                </div>
                <div className="min-w-0 space-y-1.5" data-checkout-field="line1">
                  <span className="text-sm font-bold text-[#1e1e1e]">{labels.address}</span>
                  <AddressAutocomplete
                    name="line1"
                    required
                    value={line1}
                    onValueChange={onLine1Change}
                    placeholder={labels.addressPlaceholder}
                    disabled={pending}
                    className={CHECKOUT_FIELD}
                    languageCode={locale}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <label className={CHECKOUT_LABEL}>
                  {labels.floor}
                  <input
                    name="floor"
                    disabled={pending}
                    placeholder={labels.floorPlaceholder}
                    className={CHECKOUT_FIELD}
                  />
                </label>
                <label className={CHECKOUT_LABEL}>
                  {labels.intercomCode}
                  <input
                    name="intercomCode"
                    disabled={pending}
                    placeholder={labels.intercomCodePlaceholder}
                    className={CHECKOUT_FIELD}
                  />
                </label>
              </div>
              <DeliverySlotPicker
                schedule={deliverySchedule}
                selected={deliverySlot}
                onChange={onDeliverySlotChange}
                disabled={pending}
                locale={locale}
                labels={{
                  title: labels.scheduleTitle,
                  deliverTo: labels.scheduleDeliverTo,
                  approximatelyOneHour: labels.scheduleApproximatelyOneHour,
                  change: labels.scheduleChange,
                  useAsap: labels.scheduleUseAsap,
                  pickDate: labels.schedulePickDate,
                  pickTime: labels.schedulePickTime,
                  deliveryDay: labels.scheduleDeliveryDay,
                  deliveryTime: labels.scheduleDeliveryTime,
                  apply: labels.scheduleApply,
                  close: labels.scheduleClose,
                  timeHint: labels.scheduleTimeHint,
                  noSlots: labels.scheduleNoSlots,
                  prevMonth: labels.schedulePrevMonth,
                  nextMonth: labels.scheduleNextMonth,
                }}
              />
        </div>
      </section>
      ) : pickupBranches.length === 0 ? (
        <section className={CHECKOUT_PANEL}>
          <p className="text-sm text-[#1e1e1e]/65">
            {storePickupAddress
              ? `${labels.pickupStoreHint} ${storePickupAddress}`
              : labels.pickupStoreHint}
          </p>
        </section>
      ) : null}

      <CheckoutPaymentMethods
        title={labels.paymentMethod}
        options={paymentOptions}
        value={paymentMethod}
        onChange={onPaymentMethodChange}
        disabled={pending}
        afterCash={
          <CashChangePicker
            options={cashChangeOptions}
            value={cashChangeAmount}
            onChange={onCashChangeAmountChange}
            disabled={pending}
            locale={locale}
            labels={{
              title: labels.cashChangeTitle,
              hint: labels.cashChangeHint,
              ariaLabel: labels.cashChangeAria,
              notNeeded: labels.cashChangeNotNeeded,
            }}
          />
        }
      />
    </div>
  );
}
