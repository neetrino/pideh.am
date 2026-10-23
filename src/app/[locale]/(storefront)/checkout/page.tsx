import { notFound } from 'next/navigation';

import { cartLineUnitAmount } from '@/features/cart/domain/line-price';
import { getCartWithItems } from '@/features/cart/cart';
import { getUserBonusBalance } from '@/features/bonuses/application/queries';
import { getGroupOrderCheckoutUiFlags } from '@/features/checkout/application/group-order-checkout-context';
import { getCheckoutOrderProducts } from '@/features/checkout/application/get-checkout-order-products';
import { CheckoutForm } from '@/features/checkout/ui/CheckoutForm';
import { getDeliverySettings } from '@/features/delivery/application/get-delivery-settings';
import { listCheckoutDeliveryOptions } from '@/features/delivery/application/queries';
import {
  cashChangeImageSrc,
  listActiveCashChangeDenominations,
} from '@/features/delivery/domain/cash-change';
import { findDeliveryZoneIdByAddress } from '@/features/delivery/domain/delivery-location';
import { getDefaultShippingAddress } from '@/features/profile/application/address-queries';
import { resolveProductPrices } from '@/features/promotions/application/resolve-product-prices';
import { getStoreBonusSettings, getStoreIdentity } from '@/features/settings/application/queries';
import { getCurrentUser } from '@/lib/auth/session';
import { isLocale } from '@/lib/i18n/config';
import { getDictionary } from '@/lib/i18n/get-dictionary';
import { mediaPublicUrl } from '@/lib/media/public-url';

type CheckoutPageProps = {
  params: Promise<{ locale: string }>;
};

export default async function CheckoutPage({ params }: CheckoutPageProps) {
  const { locale: rawLocale } = await params;
  if (!isLocale(rawLocale)) {
    notFound();
  }

  const dictionary = getDictionary(rawLocale);
  const copy = dictionary.checkout;
  const [
    user,
    { items },
    deliverySettings,
    deliveryZones,
    bonusSettings,
    storeIdentity,
    groupFlags,
  ] = await Promise.all([
    getCurrentUser(),
    getCartWithItems(),
    getDeliverySettings(),
    listCheckoutDeliveryOptions(rawLocale),
    getStoreBonusSettings(),
    getStoreIdentity(),
    getGroupOrderCheckoutUiFlags(),
  ]);
  const [defaultAddress, prices, bonusAvailableBalance] = await Promise.all([
    user ? getDefaultShippingAddress(user.id) : Promise.resolve(null),
    resolveProductPrices(
      items.map(({ product }) => ({
        id: product.id,
        priceAmount: product.priceAmount,
        compareAtAmount: product.compareAtAmount,
      })),
    ),
    user ? getUserBonusBalance(user.id) : Promise.resolve(null),
  ]);
  const orderProducts = await getCheckoutOrderProducts(
    rawLocale,
    items,
    new Map(
      items.map(({ product }) => [
        product.id,
        prices.get(product.id)?.unitAmount ?? product.priceAmount,
      ]),
    ),
  );
  const subtotal = items.reduce((sum, { item, product, modifiers }) => {
    const base = prices.get(product.id)?.unitAmount ?? product.priceAmount;
    return sum + item.quantity * cartLineUnitAmount(base, modifiers);
  }, 0);

  const cashChangeOptions = listActiveCashChangeDenominations(
    deliverySettings.cashChangeDenominations,
  ).map((item) => ({
    id: item.id,
    amount: item.amount,
    imageUrl: cashChangeImageSrc(item.imageObjectKey, mediaPublicUrl),
  }));

  const storePickupAddress = deliverySettings.originAddress.trim() || storeIdentity.name || null;
  const pickupBranches = [
    { id: 'andranik', address: dictionary.contact.storeAddress },
    { id: 'koghbatsi', address: dictionary.contact.storeAddressSecondary },
  ].filter((branch) => branch.address.trim().length > 0);

  return (
    <CheckoutForm
      locale={rawLocale}
      productsHref={`/${rawLocale}/products`}
      hasItems={items.length > 0}
      orderProducts={orderProducts}
      defaultFirstName={defaultAddress?.recipientFirstName ?? user?.firstName ?? ''}
      defaultLastName={defaultAddress?.recipientLastName ?? user?.lastName ?? ''}
      defaultEmail={user?.email ?? ''}
      defaultPhone={defaultAddress?.phone ?? user?.phone ?? ''}
      defaultLine1={groupFlags.defaultDeliveryAddress ?? defaultAddress?.line1 ?? ''}
      defaultDeliveryRuleId={
        defaultAddress
          ? findDeliveryZoneIdByAddress(deliveryZones, defaultAddress)
          : ''
      }
      subtotalAmount={subtotal}
      deliverySchedule={deliverySettings.schedule}
      deliveryZones={deliveryZones.map((zone) => ({
        id: zone.id,
        label: zone.label,
        priceAmount: zone.priceAmount,
      }))}
      cashChangeOptions={cashChangeOptions}
      storePickupAddress={storePickupAddress}
      pickupBranches={pickupBranches}
      bonusAvailableBalance={bonusAvailableBalance}
      bonusAccrualPercent={bonusSettings.accrualPercent}
      bonusMaxRedeemPercent={bonusSettings.maxRedeemPercent}
      groupOrderCheckout={
        groupFlags.isGroupOrderCheckout
          ? {
              splitOthersPrepaid: groupFlags.splitOthersPrepaid,
              organizerPayableAmount: groupFlags.organizerPayableAmount,
              othersPrepaidAmount: groupFlags.othersPrepaidAmount,
              lockedDeliveryAmount: groupFlags.lockedDeliveryAmount,
            }
          : null
      }
      labels={{
        title: copy.title,
        productsInOrder: copy.productsInOrder,
        itemsOne: copy.itemsOne,
        itemsMany: copy.itemsMany,
        removeItem: copy.removeItem,
        previousItems: copy.previousItems,
        nextItems: copy.nextItems,
        contactInformation: copy.contactInformation,
        shippingMethod: copy.shippingMethod,
        shippingAddress: copy.shippingAddress,
        paymentMethod: copy.paymentMethod,
        orderSummary: copy.orderSummary,
        firstName: copy.form.firstName,
        lastName: copy.form.lastName,
        email: copy.form.email,
        phone: copy.form.phone,
        address: copy.form.address,
        floor: copy.form.floor,
        intercomCode: copy.form.intercomCode,
        phonePlaceholder: copy.placeholders.phone,
        addressPlaceholder: copy.placeholders.address,
        floorPlaceholder: copy.placeholders.floor,
        intercomCodePlaceholder: copy.placeholders.intercomCode,
        deliveryLocation: copy.form.deliveryLocation,
        selectLocation: copy.form.selectLocation,
        selectDeliveryLocation: copy.shipping.selectDeliveryLocation,
        selectPaymentMethod: copy.payment.selectPaymentMethod,
        enterDeliveryAddress: copy.shipping.enterDeliveryAddress,
        scheduleTitle: copy.schedule.title,
        scheduleDeliverTo: copy.schedule.deliverTo,
        scheduleApproximatelyOneHour: copy.schedule.approximatelyOneHour,
        scheduleChange: copy.schedule.change,
        scheduleUseAsap: copy.schedule.useAsap,
        schedulePickDate: copy.schedule.pickDate,
        schedulePickTime: copy.schedule.pickTime,
        scheduleDeliveryDay: copy.schedule.deliveryDay,
        scheduleDeliveryTime: copy.schedule.deliveryTime,
        scheduleTimeHint: copy.schedule.timeHint,
        scheduleNoSlots: copy.schedule.noSlots,
        schedulePrevMonth: copy.schedule.prevMonth,
        scheduleNextMonth: copy.schedule.nextMonth,
        scheduleApply: copy.schedule.apply,
        scheduleClose: copy.schedule.close,
        selectCashChange: copy.cashChange.select,
        cashChangeTitle: copy.cashChange.title,
        cashChangeHint: copy.cashChange.hint,
        cashChangeAria: copy.cashChange.aria,
        cashChangeNotNeeded: copy.cashChange.notNeeded,
        cashOnDelivery: copy.payment.cashOnDelivery,
        cashOnDeliveryDescription: copy.payment.cashOnDeliveryDescription,
        idram: copy.payment.idram,
        idramDescription: copy.payment.idramDescription,
        arca: copy.payment.arca,
        arcaDescription: copy.payment.arcaDescription,
        terminal: copy.payment.terminal,
        terminalDescription: copy.payment.terminalDescription,
        couponTitle: copy.coupon.title,
        couponPlaceholder: copy.coupon.placeholder,
        couponApply: copy.coupon.apply,
        couponApplying: copy.coupon.applying,
        giftCardTitle: copy.giftCard.title,
        giftCardPlaceholder: copy.giftCard.placeholder,
        giftCardApply: copy.giftCard.apply,
        giftCardApplying: copy.giftCard.applying,
        giftCardInitial: copy.giftCard.initial,
        giftCardUsed: copy.giftCard.used,
        giftCardRemaining: copy.giftCard.remaining,
        giftCardPayable: copy.giftCard.payable,
        giftCardApplied: copy.giftCard.applied,
        orderNoteTitle: copy.orderNote.title,
        orderNotePlaceholder: copy.orderNote.placeholder,
        discount: copy.summary.discount,
        subtotal: copy.summary.subtotal,
        shipping: copy.summary.shipping,
        total: copy.summary.total,
        participantsPrepaid: copy.summary.participantsPrepaid,
        yourShare: copy.summary.yourShare,
        placeOrder: copy.buttons.placeOrder,
        processing: copy.buttons.processing,
        continueShopping: copy.buttons.continueShopping,
        cartEmpty: copy.errors.cartEmpty,
        bonusTitle: copy.bonus.title,
        bonusAvailable: copy.bonus.available,
        bonusUse: copy.bonus.use,
        bonusAmount: copy.bonus.amount,
        bonusUseMax: copy.bonus.useMax,
        bonusApplied: copy.bonus.applied,
        bonusEarn: copy.bonus.earn,
        bonusGuestWarning: copy.bonus.guestWarning,
        bonusRegister: copy.bonus.register,
        storePickup: copy.shipping.storePickup,
        storePickupDescription: copy.shipping.storePickupDescription,
        deliveryOption: copy.shipping.delivery,
        deliveryOptionDescription: copy.shipping.deliveryDescription,
        pickupStoreHint: copy.shipping.pickupStoreHint,
      }}
    />
  );
}
