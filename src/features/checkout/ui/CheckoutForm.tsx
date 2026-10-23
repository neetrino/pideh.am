'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useRef, useState, useTransition, type FormEvent } from 'react';

import { CHECKOUT_PANEL } from '@/features/checkout/ui/checkout-ui-classes';
import type { CheckoutOrderProduct } from '@/features/checkout/ui/checkout-order-product';
import { previewCouponAction } from '@/features/checkout/application/preview-coupon';
import { createOrderAction } from '@/features/checkout/create-order';
import {
  isCashOnDeliveryAllowedForCheckout,
  isHiddenCheckoutPaymentMethod,
  type CheckoutPaymentMethod,
} from '@/features/checkout/domain/payment-methods';
import type { CheckoutShippingMethod } from '@/features/checkout/domain/shipping-methods';
import {
  CheckoutDetailsSections,
  type CheckoutDeliveryZoneOption,
} from '@/features/checkout/ui/CheckoutDetailsSections';
import type { PickupBranchOption } from '@/features/checkout/ui/CheckoutShippingMethods';
import { CheckoutOrderSummary } from '@/features/checkout/ui/CheckoutOrderSummary';
import { CheckoutProductsInOrder } from '@/features/checkout/ui/CheckoutProductsInOrder';
import {
  calculateBonusEarnAmount,
  calculateMaxRedeemAmount,
  clampBonusRedeemRequest,
} from '@/features/bonuses/domain/bonus-rules';
import { previewGiftCardAction } from '@/features/gift-cards/application/preview-gift-card';
import {
  bonusEligibleAfterGiftCard,
  type GiftCardRedeemPreview,
} from '@/features/gift-cards/domain/gift-card-rules';
import type { DeliveryScheduleSettings } from '@/features/delivery/domain/delivery-schedule';
import type { SelectedDeliverySlot } from '@/features/delivery/domain/delivery-schedule';
import {
  CASH_CHANGE_NOT_NEEDED,
  type CashChangeDenominationView,
} from '@/features/delivery/domain/cash-change';
import type { Locale } from '@/lib/i18n/config';
import { formatMoneyAmount } from '@/lib/money/format';

function scrollCheckoutField(field: string): void {
  const target = document.querySelector(`[data-checkout-field="${field}"]`);
  if (!(target instanceof HTMLElement)) {
    return;
  }
  target.scrollIntoView({ behavior: 'smooth', block: 'center' });
  const focusable = target.matches('input, button, select, textarea')
    ? target
    : target.querySelector('input, button, select, textarea');
  if (focusable instanceof HTMLElement) {
    focusable.focus({ preventScroll: true });
  }
}

type CheckoutLabels = {
  title: string;
  productsInOrder: string;
  itemsOne: string;
  itemsMany: string;
  removeItem: string;
  previousItems: string;
  nextItems: string;
  contactInformation: string;
  shippingMethod: string;
  shippingAddress: string;
  paymentMethod: string;
  orderSummary: string;
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
  selectDeliveryLocation: string;
  selectPaymentMethod: string;
  enterDeliveryAddress: string;
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
  selectCashChange: string;
  cashChangeTitle: string;
  cashChangeHint: string;
  cashChangeAria: string;
  cashChangeNotNeeded: string;
  cashOnDelivery: string;
  cashOnDeliveryDescription: string;
  idram: string;
  idramDescription: string;
  arca: string;
  arcaDescription: string;
  terminal: string;
  terminalDescription: string;
  couponTitle: string;
  couponPlaceholder: string;
  couponApply: string;
  couponApplying: string;
  giftCardTitle: string;
  giftCardPlaceholder: string;
  giftCardApply: string;
  giftCardApplying: string;
  giftCardInitial: string;
  giftCardUsed: string;
  giftCardRemaining: string;
  giftCardPayable: string;
  giftCardApplied: string;
  orderNoteTitle: string;
  orderNotePlaceholder: string;
  discount: string;
  subtotal: string;
  shipping: string;
  total: string;
  participantsPrepaid: string;
  yourShare: string;
  placeOrder: string;
  processing: string;
  continueShopping: string;
  cartEmpty: string;
  bonusTitle: string;
  bonusAvailable: string;
  bonusUse: string;
  bonusAmount: string;
  bonusUseMax: string;
  bonusApplied: string;
  bonusGuestWarning: string;
  bonusRegister: string;
  storePickup: string;
  storePickupDescription: string;
  deliveryOption: string;
  deliveryOptionDescription: string;
  pickupStoreHint: string;
};

type CheckoutFormProps = {
  locale: Locale;
  labels: CheckoutLabels;
  productsHref: string;
  orderProducts: CheckoutOrderProduct[];
  defaultFirstName: string;
  defaultLastName: string;
  defaultEmail: string;
  defaultPhone: string;
  defaultLine1: string;
  defaultDeliveryRuleId?: string;
  subtotalAmount: number;
  deliverySchedule: DeliveryScheduleSettings;
  deliveryZones: CheckoutDeliveryZoneOption[];
  cashChangeOptions: CashChangeDenominationView[];
  storePickupAddress: string | null;
  pickupBranches: PickupBranchOption[];
  hasItems: boolean;
  bonusAvailableBalance: number | null;
  bonusAccrualPercent: number;
  bonusMaxRedeemPercent: number;
  /**
   * SPLIT group checkout: other members prepaid on the group page;
   * organizer is charged only `organizerPayableAmount`.
   */
  groupOrderCheckout?: {
    splitOthersPrepaid: boolean;
    organizerPayableAmount: number;
    othersPrepaidAmount: number;
    lockedDeliveryAmount: number | null;
  } | null;
};

/** UUID for the order request. `randomUUID` is missing in some mobile browsers. */
function createIdempotencyKey(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  const bytes = new Uint8Array(16);
  if (typeof crypto !== 'undefined' && typeof crypto.getRandomValues === 'function') {
    crypto.getRandomValues(bytes);
  } else {
    for (let index = 0; index < bytes.length; index += 1) {
      bytes[index] = Math.floor(Math.random() * 256);
    }
  }
  bytes[6] = ((bytes[6] ?? 0) & 0x0f) | 0x40;
  bytes[8] = ((bytes[8] ?? 0) & 0x3f) | 0x80;
  const hex = Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('');
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

export function CheckoutForm({
  locale,
  labels,
  productsHref,
  orderProducts,
  defaultFirstName,
  defaultLastName,
  defaultEmail,
  defaultPhone,
  defaultLine1,
  defaultDeliveryRuleId = '',
  subtotalAmount,
  deliverySchedule,
  deliveryZones,
  cashChangeOptions,
  storePickupAddress,
  pickupBranches = [],
  hasItems,
  bonusAvailableBalance,
  bonusAccrualPercent,
  bonusMaxRedeemPercent,
  groupOrderCheckout = null,
}: CheckoutFormProps) {
  const router = useRouter();
  const idempotencyKey = useMemo(() => createIdempotencyKey(), []);
  const [shippingMethod, setShippingMethod] = useState<CheckoutShippingMethod>('delivery');
  const [pickupBranchId, setPickupBranchId] = useState(pickupBranches[0]?.id ?? '');
  const [deliveryRuleId, setDeliveryRuleId] = useState(defaultDeliveryRuleId);
  const [line1, setLine1] = useState(defaultLine1);
  const [deliverySlot, setDeliverySlot] = useState<SelectedDeliverySlot | null>(null);
  const [cashChangeAmount, setCashChangeAmount] = useState<number | null>(null);
  const selectedZone = useMemo(
    () => deliveryZones.find((zone) => zone.id === deliveryRuleId) ?? null,
    [deliveryRuleId, deliveryZones],
  );
  const isGroupOrderCheckout = groupOrderCheckout != null;
  const [paymentMethod, setPaymentMethod] = useState<CheckoutPaymentMethod | null>(null);
  const [error, setError] = useState<string | null>(null);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    const form = formRef.current;
    if (!form) {
      return;
    }
    function onInvalid(event: Event): void {
      const target = event.target;
      if (target instanceof HTMLElement) {
        target.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
    form.addEventListener('invalid', onInvalid, true);
    return () => form.removeEventListener('invalid', onInvalid, true);
  }, [hasItems]);
  const [couponDraft, setCouponDraft] = useState('');
  const [appliedCouponCode, setAppliedCouponCode] = useState<string | null>(null);
  const [discountAmount, setDiscountAmount] = useState(0);
  const [couponError, setCouponError] = useState<string | null>(null);
  const [useBonuses, setUseBonuses] = useState(false);
  const [bonusRedeemAmount, setBonusRedeemAmount] = useState(0);
  const [giftCardDraft, setGiftCardDraft] = useState('');
  const [giftCardPreview, setGiftCardPreview] = useState<GiftCardRedeemPreview | null>(null);
  const [giftCardError, setGiftCardError] = useState<string | null>(null);
  const [orderNote, setOrderNote] = useState('');
  const [pending, startTransition] = useTransition();
  const [applyingCoupon, startApplyCoupon] = useTransition();
  const [applyingGiftCard, startApplyGiftCard] = useTransition();

  const shippingOptions = useMemo(
    () => [
      {
        id: 'pickup' as const,
        name: labels.storePickup,
        description: labels.storePickupDescription,
      },
      {
        id: 'delivery' as const,
        name: labels.deliveryOption,
        description: labels.deliveryOptionDescription,
      },
    ],
    [
      labels.deliveryOption,
      labels.deliveryOptionDescription,
      labels.storePickup,
      labels.storePickupDescription,
    ],
  );

  const paymentOptions = useMemo(() => {
    const options: Array<{
      id: CheckoutPaymentMethod;
      name: string;
      description: string;
      logos: string[];
    }> = [
      {
        id: 'cash_on_delivery',
        name: labels.cashOnDelivery,
        description: labels.cashOnDeliveryDescription,
        logos: ['/assets/payments/cash.png'],
      },
      {
        id: 'idram',
        name: labels.idram,
        description: labels.idramDescription,
        logos: ['/assets/payments/idram.png'],
      },
      {
        id: 'arca',
        name: labels.arca,
        description: labels.arcaDescription,
        logos: [
          '/assets/payments/arca.png',
          '/assets/payments/mastercard.png',
          '/assets/payments/visa.png',
        ],
      },
      {
        id: 'terminal',
        name: labels.terminal,
        description: labels.terminalDescription,
        logos: ['/assets/payments/terminal.png'],
      },
    ];
    return options.filter((option) => {
      if (isHiddenCheckoutPaymentMethod(option.id)) {
        return false;
      }
      if (
        option.id === 'cash_on_delivery' &&
        !isCashOnDeliveryAllowedForCheckout(isGroupOrderCheckout)
      ) {
        return false;
      }
      return true;
    });
  }, [
    isGroupOrderCheckout,
    labels.arca,
    labels.arcaDescription,
    labels.cashOnDelivery,
    labels.cashOnDeliveryDescription,
    labels.idram,
    labels.idramDescription,
    labels.terminal,
    labels.terminalDescription,
  ]);

  function formatMoney(amount: number): string {
    return formatMoneyAmount(amount, 'AMD', locale);
  }

  const isPickup = shippingMethod === 'pickup';
  const lockedDelivery = groupOrderCheckout?.lockedDeliveryAmount;
  const shippingAmount = isPickup
    ? 0
    : lockedDelivery != null
      ? lockedDelivery
      : (selectedZone?.priceAmount ?? 0);
  const merchandiseAfterDiscount = Math.max(0, subtotalAmount - discountAmount);
  const maxBonusRedeem =
    bonusAvailableBalance == null
      ? 0
      : calculateMaxRedeemAmount({
          eligibleMerchandiseAmount: merchandiseAfterDiscount,
          availableBalance: bonusAvailableBalance,
          maxRedeemPercent: bonusMaxRedeemPercent,
        });
  const appliedBonus = useBonuses ? clampBonusRedeemRequest(bonusRedeemAmount, maxBonusRedeem) : 0;
  const payableBeforeGiftCard =
    Math.max(0, merchandiseAfterDiscount - appliedBonus) + shippingAmount;
  const giftCardRedeem = giftCardPreview
    ? Math.min(giftCardPreview.redeemAmount, payableBeforeGiftCard)
    : 0;
  const cartComputedTotal = Math.max(0, payableBeforeGiftCard - giftCardRedeem);
  const isGuest = bonusAvailableBalance == null;
  const guestEarnPoints = isGuest
    ? calculateBonusEarnAmount(
        bonusEligibleAfterGiftCard({
          subtotalAmount,
          discountAmount,
          giftCardAmount: giftCardRedeem,
        }),
        bonusAccrualPercent,
      )
    : 0;
  const splitPrepaid = Boolean(groupOrderCheckout?.splitOthersPrepaid);
  const othersPrepaidAmount = groupOrderCheckout?.othersPrepaidAmount ?? 0;
  const amountDue = splitPrepaid
    ? (groupOrderCheckout?.organizerPayableAmount ?? 0)
    : cartComputedTotal;

  useEffect(() => {
    if (cashChangeAmount == null || cashChangeAmount === CASH_CHANGE_NOT_NEEDED) return;
    if (cashChangeAmount < amountDue) setCashChangeAmount(null);
  }, [amountDue, cashChangeAmount]);

  const shippingFormatted = isPickup
    ? null
    : lockedDelivery != null
      ? formatMoney(shippingAmount)
      : selectedZone
        ? formatMoney(shippingAmount)
        : labels.selectDeliveryLocation;

  function clearAppliedCoupon(): void {
    setAppliedCouponCode(null);
    setDiscountAmount(0);
    setGiftCardPreview(null);
  }

  function clearAppliedGiftCard(): void {
    setGiftCardPreview(null);
  }

  function onCouponDraftChange(value: string): void {
    setCouponDraft(value);
    setCouponError(null);
    if (appliedCouponCode) {
      clearAppliedCoupon();
    }
  }

  function onGiftCardDraftChange(value: string): void {
    setGiftCardDraft(value);
    setGiftCardError(null);
    if (giftCardPreview) {
      clearAppliedGiftCard();
    }
  }

  function onApplyCoupon(): void {
    const code = couponDraft.trim();
    if (!code) {
      return;
    }

    setCouponError(null);
    startApplyCoupon(async () => {
      const result = await previewCouponAction({ couponCode: code });
      if (!result.ok) {
        clearAppliedCoupon();
        setCouponError(result.error);
        return;
      }

      setAppliedCouponCode(result.code);
      setCouponDraft(result.code);
      setDiscountAmount(result.discountAmount);
      setCouponError(null);
      setGiftCardPreview(null);
    });
  }

  function onApplyGiftCard(): void {
    const code = giftCardDraft.trim();
    if (!code) {
      return;
    }

    setGiftCardError(null);
    startApplyGiftCard(async () => {
      const result = await previewGiftCardAction({
        giftCardCode: code,
        couponCode: appliedCouponCode ?? undefined,
        bonusRedeemAmount: useBonuses ? appliedBonus : undefined,
        deliveryAmount: shippingAmount,
      });
      if (!result.ok) {
        clearAppliedGiftCard();
        setGiftCardError(result.error);
        return;
      }

      setGiftCardDraft(result.preview.code);
      setGiftCardPreview(result.preview);
      setGiftCardError(null);
    });
  }

  if (!hasItems) {
    return (
      <div className="py-12">
        <h1 className="font-display mb-8 text-3xl leading-[0.9] text-[#1e1e1e] uppercase sm:text-4xl">
          {labels.title}
        </h1>
        <div className={`${CHECKOUT_PANEL} text-center`}>
          <p className="mb-4 text-[#1e1e1e]/65">{labels.cartEmpty}</p>
          <Link
            href={productsHref}
            className="inline-flex h-12 items-center justify-center rounded-full bg-[#ff6b00] px-8 font-bold text-white hover:bg-[#e85f00]"
          >
            {labels.continueShopping}
          </Link>
        </div>
      </div>
    );
  }

  function onSubmit(event: FormEvent<HTMLFormElement>): void {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    setError(null);

    if (shippingMethod === 'delivery') {
      if (!deliveryRuleId || !selectedZone) {
        setError(labels.selectDeliveryLocation);
        scrollCheckoutField('deliveryRuleId');
        return;
      }

      if (!line1.trim() || line1.trim().length < 3) {
        setError(labels.enterDeliveryAddress);
        scrollCheckoutField('line1');
        return;
      }

      if (document.querySelector('[data-checkout-field="deliveryTime"][data-time-missing="true"]')) {
        setError(labels.schedulePickTime.replace(/\n/g, ' '));
        scrollCheckoutField('deliveryTime');
        return;
      }
    }

    if (!paymentMethod) {
      setError(labels.selectPaymentMethod);
      scrollCheckoutField('paymentMethod');
      return;
    }

    if (
      paymentMethod === 'cash_on_delivery' &&
      cashChangeOptions.length > 0 &&
      cashChangeAmount == null
    ) {
      setError(labels.selectCashChange);
      scrollCheckoutField('cashChange');
      return;
    }

    startTransition(async () => {
      const result = await createOrderAction({
        locale,
        idempotencyKey,
        firstName: String(data.get('firstName') ?? ''),
        lastName: String(data.get('lastName') ?? ''),
        contactEmail: String(data.get('contactEmail') ?? ''),
        contactPhone: String(data.get('contactPhone') ?? ''),
        shippingMethod,
        paymentMethod,
        deliveryRuleId: shippingMethod === 'delivery' ? deliveryRuleId : undefined,
        line1:
          shippingMethod === 'delivery'
            ? line1
            : (pickupBranches.find((branch) => branch.id === pickupBranchId)?.address ??
              storePickupAddress ??
              undefined),
        floor: shippingMethod === 'delivery' ? String(data.get('floor') ?? '') : undefined,
        intercomCode:
          shippingMethod === 'delivery' ? String(data.get('intercomCode') ?? '') : undefined,
        scheduledDeliveryDate: shippingMethod === 'delivery' ? deliverySlot?.date : undefined,
        scheduledDeliveryStart: shippingMethod === 'delivery' ? deliverySlot?.startTime : undefined,
        scheduledDeliveryEnd: shippingMethod === 'delivery' ? deliverySlot?.endTime : undefined,
        cashChangeAmount:
          paymentMethod === 'cash_on_delivery' ? (cashChangeAmount ?? undefined) : undefined,
        couponCode: appliedCouponCode ?? undefined,
        bonusRedeemAmount: useBonuses ? appliedBonus : undefined,
        giftCardCode: giftCardPreview?.code,
        orderNote: orderNote.trim() || undefined,
      });

      if (!result.ok) {
        setError(result.error);
        return;
      }

      router.push(`/${locale}/checkout/success/${result.orderNumber}`);
      router.refresh();
    });
  }

  return (
    <div className="min-w-0 py-8 sm:py-12">
      <h1 className="font-display mb-8 text-[clamp(1.75rem,4vw,2.25rem)] leading-[0.9] text-[#1e1e1e] uppercase">
        {labels.title}
      </h1>

      <CheckoutProductsInOrder
        products={orderProducts}
        title={labels.productsInOrder}
        itemsOneLabel={labels.itemsOne}
        itemsManyLabel={labels.itemsMany}
        removeItemLabel={labels.removeItem}
        previousItemsLabel={labels.previousItems}
        nextItemsLabel={labels.nextItems}
        onCartChanged={clearAppliedCoupon}
      />

      <form ref={formRef} onSubmit={onSubmit}>
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
          <CheckoutDetailsSections
            labels={labels}
            locale={locale}
            pending={pending}
            shippingMethod={shippingMethod}
            onShippingMethodChange={(method) => {
              setShippingMethod(method);
              setError(null);
              setGiftCardPreview(null);
              if (method === 'pickup') {
                setDeliverySlot(null);
                setDeliveryRuleId('');
              }
            }}
            shippingOptions={shippingOptions}
            pickupBranches={pickupBranches}
            pickupBranchId={pickupBranchId}
            onPickupBranchChange={setPickupBranchId}
            storePickupAddress={storePickupAddress}
            deliverySchedule={deliverySchedule}
            deliverySlot={deliverySlot}
            onDeliverySlotChange={setDeliverySlot}
            cashChangeOptions={cashChangeOptions}
            payableAmount={amountDue}
            cashChangeAmount={cashChangeAmount}
            onCashChangeAmountChange={setCashChangeAmount}
            deliveryZones={deliveryZones}
            deliveryRuleId={deliveryRuleId}
            onDeliveryRuleIdChange={setDeliveryRuleId}
            line1={line1}
            onLine1Change={setLine1}
            paymentMethod={paymentMethod}
            onPaymentMethodChange={(method) => {
              setPaymentMethod(method);
              if (method !== 'cash_on_delivery') {
                setCashChangeAmount(null);
              }
            }}
            paymentOptions={paymentOptions}
            defaultFirstName={defaultFirstName}
            defaultLastName={defaultLastName}
            defaultEmail={defaultEmail}
            defaultPhone={defaultPhone}
          />

          <CheckoutOrderSummary
            title={labels.orderSummary}
            couponTitle={labels.couponTitle}
            couponPlaceholder={labels.couponPlaceholder}
            couponApplyLabel={labels.couponApply}
            couponApplyingLabel={labels.couponApplying}
            giftCardTitle={labels.giftCardTitle}
            giftCardPlaceholder={labels.giftCardPlaceholder}
            giftCardApplyLabel={labels.giftCardApply}
            giftCardApplyingLabel={labels.giftCardApplying}
            giftCardInitialLabel={labels.giftCardInitial}
            giftCardUsedLabel={labels.giftCardUsed}
            giftCardRemainingLabel={labels.giftCardRemaining}
            giftCardPayableLabel={labels.giftCardPayable}
            giftCardAppliedLabel={labels.giftCardApplied}
            orderNoteLabel={labels.orderNoteTitle}
            orderNotePlaceholder={labels.orderNotePlaceholder}
            orderNote={orderNote}
            onOrderNoteChange={setOrderNote}
            discountLabel={labels.discount}
            subtotalLabel={labels.subtotal}
            shippingLabel={labels.shipping}
            totalLabel={splitPrepaid ? labels.yourShare : labels.total}
            participantsPrepaidLabel={splitPrepaid ? labels.participantsPrepaid : undefined}
            participantsPrepaidFormatted={
              splitPrepaid && othersPrepaidAmount > 0 ? formatMoney(othersPrepaidAmount) : null
            }
            subtotalFormatted={formatMoney(subtotalAmount)}
            shippingFormatted={shippingFormatted}
            discountFormatted={discountAmount > 0 ? formatMoney(discountAmount) : null}
            totalFormatted={formatMoney(amountDue)}
            couponDraft={couponDraft}
            onCouponDraftChange={onCouponDraftChange}
            onApplyCoupon={onApplyCoupon}
            couponError={couponError}
            isApplyingCoupon={applyingCoupon}
            giftCardDraft={giftCardDraft}
            onGiftCardDraftChange={onGiftCardDraftChange}
            onApplyGiftCard={onApplyGiftCard}
            giftCardError={giftCardError}
            isApplyingGiftCard={applyingGiftCard}
            giftCardPreview={
              giftCardPreview
                ? {
                    code: giftCardPreview.code,
                    initialAmount: giftCardPreview.initialAmount,
                    redeemAmount: giftCardRedeem,
                    remainingBalance: giftCardPreview.balanceAmount - giftCardRedeem,
                    payableAfter: amountDue,
                  }
                : null
            }
            formatMoney={formatMoney}
            error={error}
            isSubmitting={pending}
            placeOrderLabel={labels.placeOrder}
            processingLabel={labels.processing}
            bonus={
              bonusAvailableBalance != null
                ? {
                    mode: 'member' as const,
                    enabled: true,
                    availableBalance: bonusAvailableBalance,
                    maxRedeem: maxBonusRedeem,
                    useBonuses,
                    redeemAmount: appliedBonus,
                    onToggle: (enabled) => {
                      setUseBonuses(enabled);
                      setGiftCardPreview(null);
                      if (!enabled) {
                        setBonusRedeemAmount(0);
                      } else if (bonusRedeemAmount <= 0) {
                        setBonusRedeemAmount(maxBonusRedeem);
                      }
                    },
                    onAmountChange: (amount) => {
                      setBonusRedeemAmount(amount);
                      setGiftCardPreview(null);
                    },
                    onUseMax: () => {
                      setBonusRedeemAmount(maxBonusRedeem);
                      setGiftCardPreview(null);
                    },
                    labels: {
                      title: labels.bonusTitle,
                      available: labels.bonusAvailable,
                      useBonuses: labels.bonusUse,
                      amount: labels.bonusAmount,
                      useMax: labels.bonusUseMax,
                      applied: labels.bonusApplied,
                    },
                    formatMoney,
                  }
                : guestEarnPoints > 0
                  ? {
                      mode: 'guest' as const,
                      earnPoints: guestEarnPoints,
                      registerHref: `/${locale}/register`,
                      labels: {
                        warning: labels.bonusGuestWarning,
                        register: labels.bonusRegister,
                      },
                    }
                  : undefined
            }
          />
        </div>
      </form>
    </div>
  );
}
