'use server';

import { createHash } from 'node:crypto';

import { and, eq, inArray, sql } from 'drizzle-orm';
import { cookies } from 'next/headers';
import { after } from 'next/server';

import { getProviders } from '@/config/providers';
import {
  cartItems,
  carts,
  giftCards,
  groupOrderItemModifiers,
  groupOrderItems,
  groupOrderParticipants,
  orderEvents,
  orderItemModifiers,
  orderItems,
  orders,
  payments,
  products,
  promotionUsers,
  promotions,
  stockMovements,
  users,
} from '@/db/schema';
import { withTransaction } from '@/db/transaction';
import { getCartWithItems, revalidateCartPaths } from '@/features/cart/cart';
import { cartLineUnitAmount } from '@/features/cart/domain/line-price';
import { checkoutSchema, type CheckoutInput } from '@/features/checkout/schemas';
import {
  isPaymentMethodTemporarilyUnavailable,
  toPaymentRecord,
} from '@/features/checkout/domain/payment-methods';
import { STORE_PICKUP_LABEL } from '@/features/checkout/domain/shipping-methods';
import { resolveGroupOrderCheckoutContext } from '@/features/checkout/application/group-order-checkout-context';
import { getStoreIdentity } from '@/features/settings/application/queries';
import { redeemBonusesForOrder } from '@/features/bonuses/application/bonus-ledger';
import {
  bonusEligibleMerchandiseAmount,
  calculateMaxRedeemAmount,
  clampBonusRedeemRequest,
} from '@/features/bonuses/domain/bonus-rules';
import { resolveStockAfterSale } from '@/features/products/domain/stock-levels';
import { redeemGiftCardForOrder } from '@/features/gift-cards/application/gift-card-ledger';
import {
  calculateGiftCardRedeemAmount,
  giftCardRedeemErrorMessage,
  isGiftCardRecipientActor,
  isGiftCardRedeemable,
  normalizeGiftCardCode,
} from '@/features/gift-cards/domain/gift-card-rules';
import { completeGroupOrderAfterStandardCheckout } from '@/features/group-orders/application/complete-after-checkout';
import {
  quoteZoneDelivery,
  type ZoneDeliveryQuote,
} from '@/features/delivery/application/quote-zone-delivery';
import { getDeliverySettings } from '@/features/delivery/application/get-delivery-settings';
import { DEFAULT_DELIVERY_CITY } from '@/features/delivery/domain/service-area';

type CheckoutDeliveryQuote = {
  deliveryAmount: number;
  deliveryRuleId: string | null;
  label: string;
  city: string | null;
  area: string | null;
  destinationFormattedAddress: string | null;
};
import {
  CASH_CHANGE_NOT_NEEDED,
  findActiveCashChangeByAmount,
  listActiveCashChangeDenominations,
} from '@/features/delivery/domain/cash-change';
import {
  ASAP_DELIVERY_ESTIMATE_SNAPSHOT,
  formatDeliverySlotSnapshot,
  isDeliverySlotAvailable,
} from '@/features/delivery/domain/delivery-schedule';
import { notifyAdminsOfNewOrder } from '@/features/orders/application/notify-admins-new-order';
import { loadPrimaryProductImageObjectKeys } from '@/features/orders/application/order-item-images';
import {
  ORDER_NUMBER_LOCK_KEY,
  formatOrderNumber,
  nextOrderSequence,
} from '@/features/orders/domain/order-number';
import {
  couponDiscountErrorMessage,
  evaluateCouponDiscount,
  isCouponUserEligible,
} from '@/features/promotions/domain/evaluate-coupon';
import { normalizePromotionCode } from '@/features/promotions/domain/promotion-rules';
import { resolveProductPrices } from '@/features/promotions/application/resolve-product-prices';
import { getStoreBonusSettings } from '@/features/settings/application/queries';
import { getCurrentUser } from '@/lib/auth/session';
import { getCheckoutRateSnapshot } from '@/lib/fx/service';
import { createId } from '@/lib/id';
import { convertAmount } from '@/lib/money/convert';
import { defaultCurrency } from '@/lib/money/currency';
import { CURRENCY_COOKIE_NAME, parseCurrencyCookie } from '@/lib/money/currency-cookie';

function hashValue(value: string): string {
  return createHash('sha256').update(value).digest('hex');
}

export type CreateOrderResult = { ok: true; orderNumber: string } | { ok: false; error: string };

/** Creates a COD order with server-side totals, stock decrement, and cart clear. */
export async function createOrderAction(raw: CheckoutInput): Promise<CreateOrderResult> {
  const parsed = checkoutSchema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, error: 'Invalid checkout data.' };
  }

  const input = parsed.data;
  if (isPaymentMethodTemporarilyUnavailable(input.paymentMethod)) {
    return { ok: false, error: 'This payment method is temporarily unavailable.' };
  }
  const user = await getCurrentUser();
  const { cart, items } = await getCartWithItems();
  const cookieStore = await cookies();
  const displayCurrency = parseCurrencyCookie(cookieStore.get(CURRENCY_COOKIE_NAME)?.value);

  if (items.length === 0 || !cart) {
    return { ok: false, error: 'Cart is empty.' };
  }

  let rateSnapshot;
  try {
    rateSnapshot = await getCheckoutRateSnapshot(displayCurrency);
  } catch {
    return { ok: false, error: 'Exchange rate unavailable. Try again shortly.' };
  }

  let deliveryQuote: CheckoutDeliveryQuote | null = null;
  let deliverySlotSnapshot: string | null = null;
  let cashChangeAmount: number | undefined;
  let cashChangeImageKey: string | undefined;
  const [deliverySettings, storeIdentity, groupCheckout] = await Promise.all([
    getDeliverySettings(),
    getStoreIdentity(),
    resolveGroupOrderCheckoutContext(),
  ]);

  if (input.shippingMethod === 'delivery') {
    if (
      groupCheckout.active &&
      groupCheckout.deliveryAmount >= 0 &&
      groupCheckout.deliveryAddress
    ) {
      deliveryQuote = {
        deliveryAmount: groupCheckout.deliveryAmount,
        deliveryRuleId: null,
        label: groupCheckout.deliveryDistanceLabel ?? 'group-order',
        city: null,
        area: null,
        destinationFormattedAddress: groupCheckout.deliveryAddress,
      };
    } else {
      if (!input.deliveryRuleId) {
        return { ok: false, error: 'Select a delivery location.' };
      }
      const quoted = await quoteZoneDelivery(input.deliveryRuleId, input.locale);
      if (!quoted.ok) {
        return { ok: false, error: quoted.error };
      }
      const zone: ZoneDeliveryQuote = quoted.quote;
      deliveryQuote = {
        deliveryAmount: zone.deliveryAmount,
        deliveryRuleId: zone.deliveryRuleId,
        label: zone.label,
        city: zone.city,
        area: zone.area,
        destinationFormattedAddress: input.line1?.trim() || null,
      };
    }

    const hasScheduledSlot = Boolean(
      input.scheduledDeliveryDate &&
        input.scheduledDeliveryStart &&
        input.scheduledDeliveryEnd,
    );
    if (hasScheduledSlot) {
      const selectedSlot = {
        date: input.scheduledDeliveryDate ?? '',
        startTime: input.scheduledDeliveryStart ?? '',
        endTime: input.scheduledDeliveryEnd ?? '',
      };
      if (!isDeliverySlotAvailable(deliverySettings.schedule, selectedSlot)) {
        return {
          ok: false,
          error: 'Selected delivery time is no longer available.',
        };
      }
      deliverySlotSnapshot = formatDeliverySlotSnapshot(selectedSlot);
    } else {
      deliverySlotSnapshot = ASAP_DELIVERY_ESTIMATE_SNAPSHOT;
    }
  }

  if (groupCheckout.active && input.paymentMethod === 'cash_on_delivery') {
    return {
      ok: false,
      error: 'Cash on delivery is not available for group orders.',
    };
  }

  if (input.paymentMethod === 'cash_on_delivery') {
    const activeCashChange = listActiveCashChangeDenominations(
      deliverySettings.cashChangeDenominations,
    );
    if (activeCashChange.length > 0) {
      if (input.cashChangeAmount == null) {
        return {
          ok: false,
          error: 'Please select the banknote you will pay with.',
        };
      }
      if (input.cashChangeAmount === CASH_CHANGE_NOT_NEEDED) {
        cashChangeAmount = undefined;
      } else {
        const matched = findActiveCashChangeByAmount(
          deliverySettings.cashChangeDenominations,
          input.cashChangeAmount,
        );
        if (!matched) {
          return {
            ok: false,
            error: 'Selected cash-change amount is no longer available.',
          };
        }
        cashChangeAmount = matched.amount;
        cashChangeImageKey = matched.imageObjectKey ?? undefined;
      }
    }
  }

  const contactName = `${input.firstName} ${input.lastName}`.trim();
  const scopeHash = hashValue(user?.id ?? cart.guestTokenHash ?? cart.id);
  const keyHash = hashValue(input.idempotencyKey);
  const fingerprint = hashValue(
    JSON.stringify({
      cartId: cart.id,
      items: items.map(({ item, modifiers }) => ({
        productId: item.productId,
        quantity: item.quantity,
        selectionKey: item.selectionKey,
        modifierIds: modifiers.map((modifier) => modifier.id).sort(),
      })),
      email: input.contactEmail.toLowerCase(),
      shippingMethod: input.shippingMethod,
      paymentMethod: input.paymentMethod,
      line1: input.line1?.trim() || null,
      deliveryAmount: deliveryQuote?.deliveryAmount ?? 0,
      deliveryRuleId: deliveryQuote?.deliveryRuleId ?? null,
      scheduledDeliveryDate:
        input.shippingMethod === 'delivery' ? input.scheduledDeliveryDate : null,
      scheduledDeliveryStart:
        input.shippingMethod === 'delivery' ? input.scheduledDeliveryStart : null,
      cashChangeAmount: cashChangeAmount ?? null,
      bonusRedeemAmount: input.bonusRedeemAmount ?? 0,
      giftCardCode: input.giftCardCode ? normalizeGiftCardCode(input.giftCardCode) : null,
    }),
  );

  try {
    const orderNumber = await withTransaction(async (tx) => {
      const [existing] = await tx
        .select({ orderNumber: orders.orderNumber })
        .from(orders)
        .where(
          and(
            eq(orders.idempotencyScopeHash, scopeHash),
            eq(orders.idempotencyKeyHash, keyHash),
            eq(orders.requestFingerprint, fingerprint),
          ),
        )
        .limit(1);

      if (existing) {
        return existing.orderNumber;
      }

      const pickupLine1 =
        input.line1?.trim() ||
        deliverySettings.originAddress.trim() ||
        storeIdentity.name ||
        'Store pickup';

      const address = {
        recipientFirstName: input.firstName,
        recipientLastName: input.lastName,
        phone: input.contactPhone,
        countryCode: 'AM',
        region: deliveryQuote?.area?.trim() || input.region,
        city: deliveryQuote?.city?.trim() || input.city?.trim() || DEFAULT_DELIVERY_CITY,
        line1:
          input.shippingMethod === 'pickup'
            ? pickupLine1
            : deliveryQuote?.destinationFormattedAddress || input.line1?.trim() || '',
        line2: input.line2,
        postalCode: input.postalCode,
        ...(input.orderNote?.trim() ? { orderNote: input.orderNote.trim() } : {}),
        ...(input.shippingMethod === 'delivery'
          ? {
              floor: input.floor?.trim() || undefined,
              intercomCode: input.intercomCode?.trim() || undefined,
              ...(input.scheduledDeliveryDate &&
              input.scheduledDeliveryStart &&
              input.scheduledDeliveryEnd
                ? {
                    scheduledDeliveryDate: input.scheduledDeliveryDate,
                    scheduledDeliveryStart: input.scheduledDeliveryStart,
                    scheduledDeliveryEnd: input.scheduledDeliveryEnd,
                  }
                : {}),
              ...(cashChangeAmount != null
                ? {
                    cashChangeAmount,
                    cashChangeImageKey,
                  }
                : {}),
            }
          : cashChangeAmount != null
            ? {
                cashChangeAmount,
                cashChangeImageKey,
              }
            : {}),
      };

      let subtotal = 0;
      const lineSnapshots: Array<{
        productId: string;
        title: string;
        sku: string;
        imageKey: string | null;
        quantity: number;
        unitAmount: number;
        unitDisplayAmount: number;
        compareAtAmount: number | null;
        lineDiscountAmount: number;
        lineTotal: number;
        groupOrderParticipantId: string | null;
        participantNameSnapshot: string | null;
        customerNote: string | null;
        modifiers: Array<{
          modifierId: string;
          kind: 'ADDITION' | 'EXCEPTION';
          name: string;
          unitPriceAmount: number;
        }>;
      }> = [];

      const qtyByProduct = new Map<string, number>();
      for (const { item, product } of items) {
        if (product.status !== 'ACTIVE') {
          throw new Error('A product in the cart is unavailable.');
        }
        qtyByProduct.set(product.id, (qtyByProduct.get(product.id) ?? 0) + item.quantity);
      }

      const lockedById = new Map<string, typeof products.$inferSelect>();
      for (const [productId, neededQty] of qtyByProduct) {
        const [locked] = await tx
          .select()
          .from(products)
          .where(eq(products.id, productId))
          .for('update')
          .limit(1);

        if (!locked || locked.stockOnHand < neededQty) {
          throw new Error('Insufficient stock for one or more items.');
        }
        lockedById.set(productId, locked);
      }

      const [pricedUnits, primaryImageKeys] = await Promise.all([
        resolveProductPrices(
          [...lockedById.values()].map((product) => ({
            id: product.id,
            priceAmount: product.priceAmount,
            compareAtAmount: product.compareAtAmount,
          })),
        ),
        loadPrimaryProductImageObjectKeys([...lockedById.keys()]),
      ]);

      const remainingStock = new Map(
        [...lockedById.entries()].map(([id, product]) => [id, product.stockOnHand]),
      );

      for (const { item, product, modifiers } of items) {
        const locked = lockedById.get(product.id);
        if (!locked) {
          throw new Error('A product in the cart is unavailable.');
        }

        const resolved = pricedUnits.get(locked.id);
        const baseUnit = resolved?.unitAmount ?? locked.priceAmount;
        const unitAmount = cartLineUnitAmount(baseUnit, modifiers);
        const compareAtAmount = resolved?.compareAtAmount ?? null;
        const lineDiscountAmount = Math.max(
          0,
          (resolved?.listAmount ?? locked.priceAmount) - baseUnit,
        );
        const lineTotal = unitAmount * item.quantity;
        const unitDisplayAmount = Number(
          convertAmount(unitAmount, rateSnapshot.rate, defaultCurrency, displayCurrency).amount,
        );
        subtotal += lineTotal;

        const nextStock = (remainingStock.get(locked.id) ?? locked.stockOnHand) - item.quantity;
        remainingStock.set(locked.id, nextStock);

        lineSnapshots.push({
          productId: locked.id,
          title: locked.translations.en?.title ?? locked.translations.hy?.title ?? locked.sku,
          sku: locked.sku,
          imageKey: primaryImageKeys.get(locked.id) ?? null,
          quantity: item.quantity,
          unitAmount,
          unitDisplayAmount,
          compareAtAmount,
          lineDiscountAmount,
          lineTotal,
          groupOrderParticipantId: null,
          participantNameSnapshot: null,
          customerNote: item.customerNote,
          modifiers: modifiers.map((modifier) => ({
            modifierId: modifier.id,
            kind: modifier.kind,
            name: modifier.name,
            unitPriceAmount: modifier.kind === 'ADDITION' ? modifier.priceAmount : 0,
          })),
        });
      }

      if (groupCheckout.active) {
        const groupLines = await tx
          .select({
            item: groupOrderItems,
            participantId: groupOrderParticipants.id,
            participantName: groupOrderParticipants.displayName,
            product: products,
          })
          .from(groupOrderItems)
          .innerJoin(
            groupOrderParticipants,
            eq(groupOrderItems.participantId, groupOrderParticipants.id),
          )
          .innerJoin(products, eq(groupOrderItems.productId, products.id))
          .where(eq(groupOrderItems.groupOrderId, groupCheckout.groupOrderId));

        if (groupLines.length === 0) {
          throw new Error('Group order has no items to checkout.');
        }

        const missingImageProductIds = [
          ...new Set(
            groupLines.map((row) => row.product.id).filter((id) => !primaryImageKeys.has(id)),
          ),
        ];
        if (missingImageProductIds.length > 0) {
          const extraKeys = await loadPrimaryProductImageObjectKeys(missingImageProductIds);
          for (const [productId, objectKey] of extraKeys) {
            primaryImageKeys.set(productId, objectKey);
          }
        }

        const groupLineIds = groupLines.map((row) => row.item.id);
        const groupMods =
          groupLineIds.length === 0
            ? []
            : await tx
                .select()
                .from(groupOrderItemModifiers)
                .where(inArray(groupOrderItemModifiers.groupOrderItemId, groupLineIds));
        const modsByGroupLine = new Map<string, typeof groupMods>();
        for (const mod of groupMods) {
          const list = modsByGroupLine.get(mod.groupOrderItemId) ?? [];
          list.push(mod);
          modsByGroupLine.set(mod.groupOrderItemId, list);
        }

        lineSnapshots.length = 0;
        subtotal = 0;
        for (const row of groupLines) {
          const locked = lockedById.get(row.product.id);
          if (!locked) {
            throw new Error('A product in the cart is unavailable.');
          }
          const resolved = pricedUnits.get(locked.id);
          const unitAmount = row.item.unitAmount;
          const compareAtAmount = resolved?.compareAtAmount ?? null;
          const lineDiscountAmount = Math.max(
            0,
            (resolved?.listAmount ?? locked.priceAmount) -
              (resolved?.unitAmount ?? locked.priceAmount),
          );
          const lineTotal = row.item.lineTotalAmount;
          const unitDisplayAmount = Number(
            convertAmount(unitAmount, rateSnapshot.rate, defaultCurrency, displayCurrency).amount,
          );
          subtotal += lineTotal;
          const mods = modsByGroupLine.get(row.item.id) ?? [];
          lineSnapshots.push({
            productId: locked.id,
            title: locked.translations.en?.title ?? locked.translations.hy?.title ?? locked.sku,
            sku: locked.sku,
            imageKey: primaryImageKeys.get(locked.id) ?? null,
            quantity: row.item.quantity,
            unitAmount,
            unitDisplayAmount,
            compareAtAmount,
            lineDiscountAmount,
            lineTotal,
            groupOrderParticipantId: row.participantId,
            participantNameSnapshot: row.participantName,
            customerNote: row.item.customerNote,
            modifiers: mods.map((mod) => ({
              modifierId: mod.modifierId,
              kind:
                mod.kindSnapshot === 'EXCEPTION' ? ('EXCEPTION' as const) : ('ADDITION' as const),
              name: mod.nameSnapshot,
              unitPriceAmount: mod.priceAmountSnapshot,
            })),
          });
        }
      }

      const stockAfterOrder = remainingStock;

      const deliveryAmount = deliveryQuote?.deliveryAmount ?? 0;

      let discountAmount = 0;
      let appliedPromotion: typeof promotions.$inferSelect | null = null;
      if (input.couponCode) {
        const code = normalizePromotionCode(input.couponCode);
        const [coupon] = await tx
          .select()
          .from(promotions)
          .where(and(eq(promotions.kind, 'COUPON'), eq(promotions.code, code)))
          .for('update')
          .limit(1);

        const nowCheck = new Date();
        const evaluated = evaluateCouponDiscount(coupon, subtotal, nowCheck);
        if (!evaluated.ok || !coupon) {
          throw new Error(
            couponDiscountErrorMessage(evaluated.ok ? 'INVALID_OR_INACTIVE' : evaluated.error),
          );
        }

        const allowlistRows = await tx
          .select({ userId: promotionUsers.userId })
          .from(promotionUsers)
          .where(eq(promotionUsers.promotionId, coupon.id));
        if (
          !isCouponUserEligible(
            allowlistRows.map((row) => row.userId),
            user?.id,
          )
        ) {
          throw new Error(couponDiscountErrorMessage('USER_NOT_ELIGIBLE'));
        }

        discountAmount = evaluated.discountAmount;
        appliedPromotion = coupon;

        await tx
          .update(promotions)
          .set({
            usedCount: sql`${promotions.usedCount} + 1`,
            updatedAt: nowCheck,
          })
          .where(eq(promotions.id, coupon.id));
      }

      const merchandiseAfterDiscount = bonusEligibleMerchandiseAmount(subtotal, discountAmount);
      let bonusRedeemedAmount = 0;
      if (user?.id && (input.bonusRedeemAmount ?? 0) > 0) {
        const bonusSettings = await getStoreBonusSettings();
        const [lockedCustomer] = await tx
          .select({
            id: users.id,
            bonusBalance: users.bonusBalance,
          })
          .from(users)
          .where(eq(users.id, user.id))
          .for('update')
          .limit(1);

        if (!lockedCustomer) {
          throw new Error('Unable to apply bonuses.');
        }

        const maxRedeem = calculateMaxRedeemAmount({
          eligibleMerchandiseAmount: merchandiseAfterDiscount,
          availableBalance: lockedCustomer.bonusBalance,
          maxRedeemPercent: bonusSettings.maxRedeemPercent,
        });
        bonusRedeemedAmount = clampBonusRedeemRequest(input.bonusRedeemAmount ?? 0, maxRedeem);
      } else if ((input.bonusRedeemAmount ?? 0) > 0 && !user?.id) {
        throw new Error('Bonuses are available for registered customers only.');
      }

      const payableBeforeGiftCard =
        Math.max(0, merchandiseAfterDiscount - bonusRedeemedAmount) + deliveryAmount;

      let giftCardId: string | null = null;
      let giftCardCodeSnapshot: string | null = null;
      let giftCardAmount = 0;
      if (input.giftCardCode?.trim()) {
        const code = normalizeGiftCardCode(input.giftCardCode);
        const [card] = await tx
          .select()
          .from(giftCards)
          .where(eq(giftCards.code, code))
          .for('update')
          .limit(1);

        if (
          !card ||
          !isGiftCardRedeemable({
            status: card.status,
            balanceAmount: card.balanceAmount,
            expiresAt: card.expiresAt,
          })
        ) {
          throw new Error(
            giftCardRedeemErrorMessage({
              found: Boolean(card),
              status: card?.status,
              balanceAmount: card?.balanceAmount,
              expiresAt: card?.expiresAt ?? null,
            }),
          );
        }

        const redeemActor = user ? { id: user.id, email: user.email } : null;
        if (
          !isGiftCardRecipientActor({
            actor: redeemActor,
            recipientUserId: card.recipientUserId,
            recipientEmail: card.recipientEmail,
          })
        ) {
          throw new Error(
            giftCardRedeemErrorMessage({
              found: true,
              status: card.status,
              balanceAmount: card.balanceAmount,
              expiresAt: card.expiresAt,
              recipientDenied: redeemActor ? 'mismatch' : 'unauthenticated',
            }),
          );
        }

        giftCardAmount = calculateGiftCardRedeemAmount({
          balanceAmount: card.balanceAmount,
          payableBeforeGiftCard,
        });
        if (giftCardAmount <= 0) {
          throw new Error('Gift card cannot be applied to this order.');
        }

        giftCardId = card.id;
        giftCardCodeSnapshot = card.code;

        if (user?.id && card.recipientUserId == null) {
          await tx
            .update(giftCards)
            .set({ recipientUserId: user.id, updatedAt: new Date() })
            .where(and(eq(giftCards.id, card.id), sql`${giftCards.recipientUserId} is null`));
        }
      }

      const totalAmount = Math.max(0, payableBeforeGiftCard - giftCardAmount);
      if (
        input.paymentMethod === 'cash_on_delivery' &&
        cashChangeAmount != null &&
        cashChangeAmount < totalAmount
      ) {
        throw new Error('Selected banknote is smaller than the amount due.');
      }
      const orderId = createId();
      await tx.execute(sql`select pg_advisory_xact_lock(${ORDER_NUMBER_LOCK_KEY})`);
      const [maxRow] = await tx
        .select({
          maxSeq: sql<number | null>`max(cast(substring(${orders.orderNumber} from 2) as integer))`,
        })
        .from(orders)
        .where(sql`${orders.orderNumber} ~ '^p[0-9]+$'`);
      const number = formatOrderNumber(nextOrderSequence(maxRow?.maxSeq ?? null));
      const now = new Date();

      await tx.insert(orders).values({
        id: orderId,
        orderNumber: number,
        userId: user?.id,
        contactEmail: input.contactEmail.toLowerCase(),
        contactPhone: input.contactPhone,
        contactName,
        status: 'PENDING',
        paymentStatus: 'PENDING',
        baseCurrency: defaultCurrency,
        displayCurrency,
        exchangeRate: rateSnapshot.rate,
        exchangeRateSource: rateSnapshot.source,
        exchangeRateAsOf: rateSnapshot.asOf,
        subtotalAmount: subtotal,
        discountAmount,
        taxAmount: 0,
        deliveryAmount,
        bonusRedeemedAmount,
        bonusEarnedAmount: 0,
        giftCardId,
        giftCardCodeSnapshot,
        giftCardAmount,
        totalAmount,
        shippingAddress: address,
        billingAddress: address,
        promotionId: appliedPromotion?.id,
        promotionCodeSnapshot: appliedPromotion?.code ?? null,
        promotionTypeSnapshot: appliedPromotion?.discountType ?? null,
        promotionValueSnapshot: appliedPromotion?.discountValue ?? null,
        promotionDiscountAmount: appliedPromotion ? discountAmount : null,
        deliveryRuleId: deliveryQuote?.deliveryRuleId ?? null,
        deliveryLabelSnapshot:
          input.shippingMethod === 'pickup'
            ? STORE_PICKUP_LABEL
            : deliveryQuote?.label || 'Delivery',
        deliveryEstimateSnapshot:
          input.shippingMethod === 'pickup'
            ? storeIdentity.name
            : [deliveryQuote?.label ?? null, deliverySlotSnapshot].filter(Boolean).join(' · ') ||
              null,
        idempotencyScopeHash: scopeHash,
        idempotencyKeyHash: keyHash,
        requestFingerprint: fingerprint,
        locale: input.locale,
        placedAt: now,
        groupOrderId: groupCheckout.active ? groupCheckout.groupOrderId : null,
      });

      if (user?.id && bonusRedeemedAmount > 0) {
        await redeemBonusesForOrder({
          tx,
          userId: user.id,
          orderId,
          amount: bonusRedeemedAmount,
          correlationId: number,
        });
      }

      if (giftCardId && giftCardAmount > 0) {
        await redeemGiftCardForOrder({
          tx,
          giftCardId,
          orderId,
          amount: giftCardAmount,
          correlationId: number,
        });
      }

      for (const line of lineSnapshots) {
        const orderItemId = createId();
        await tx.insert(orderItems).values({
          id: orderItemId,
          orderId,
          productId: line.productId,
          productTitleSnapshot: line.title,
          productSkuSnapshot: line.sku,
          productImageKeySnapshot: line.imageKey,
          quantity: line.quantity,
          unitBaseAmount: line.unitAmount,
          unitDisplayAmount: line.unitDisplayAmount,
          compareAtAmount: line.compareAtAmount,
          discountAmount: line.lineDiscountAmount * line.quantity,
          lineTotalAmount: line.lineTotal,
          currency: defaultCurrency,
          groupOrderParticipantId: line.groupOrderParticipantId,
          participantNameSnapshot: line.participantNameSnapshot,
          customerNote: line.customerNote,
        });

        if (line.modifiers.length > 0) {
          await tx.insert(orderItemModifiers).values(
            line.modifiers.map((modifier) => ({
              id: createId(),
              orderItemId,
              modifierId: modifier.modifierId,
              kind: modifier.kind,
              nameSnapshot: modifier.name,
              unitPriceAmount: modifier.unitPriceAmount,
            })),
          );
        }
      }

      for (const [productId, nextStock] of stockAfterOrder) {
        const resolved = resolveStockAfterSale(nextStock);
        await tx
          .update(products)
          .set({
            stockOnHand: resolved.stockOnHand,
            version: sql`${products.version} + 1`,
            updatedAt: now,
          })
          .where(eq(products.id, productId));

        const orderedQty = qtyByProduct.get(productId) ?? 0;
        await tx.insert(stockMovements).values({
          id: createId(),
          productId,
          delta: -orderedQty,
          reason: 'ORDER',
          orderId,
          resultingBalance: nextStock,
          correlationId: number,
        });

        if (resolved.replenished) {
          await tx.insert(stockMovements).values({
            id: createId(),
            productId,
            delta: resolved.refillDelta,
            reason: 'ADMIN_ADJUSTMENT',
            orderId,
            resultingBalance: resolved.stockOnHand,
            correlationId: number,
          });
        }
      }

      const payment = await getProviders().payment.createPayment({
        orderId,
        amount: BigInt(
          groupCheckout.active && groupCheckout.splitOthersPrepaid
            ? groupCheckout.organizerPayableAmount
            : totalAmount,
        ),
        currency: defaultCurrency,
        idempotencyKey: input.idempotencyKey,
      });
      const paymentRecord = toPaymentRecord(input.paymentMethod);
      const organizerParticipantId = groupCheckout.active
        ? (groupCheckout.participants.find((p) => p.role === 'ORGANIZER')?.id ?? null)
        : null;

      await tx.insert(payments).values({
        id: createId(),
        orderId,
        provider: paymentRecord.provider,
        method: paymentRecord.method,
        providerReference: payment.providerReference,
        amount:
          groupCheckout.active && groupCheckout.splitOthersPrepaid
            ? groupCheckout.organizerPayableAmount
            : totalAmount,
        currency: defaultCurrency,
        status: 'PENDING',
        attemptNumber: 1,
        groupOrderParticipantId: organizerParticipantId,
      });

      await tx.insert(orderEvents).values({
        id: createId(),
        orderId,
        eventType: 'STATUS_CHANGE',
        fromState: null,
        toState: 'PENDING',
        actorUserId: user?.id,
        isCustomerVisible: true,
        payload: { source: 'checkout' },
      });

      await tx.delete(cartItems).where(eq(cartItems.cartId, cart.id));
      await tx
        .update(carts)
        .set({ status: 'CONVERTED', updatedAt: now })
        .where(eq(carts.id, cart.id));

      await completeGroupOrderAfterStandardCheckout({
        orderId,
        orderNumber: number,
        tx,
      });

      return number;
    });

    await revalidateCartPaths();
    after(() => notifyAdminsOfNewOrder(orderNumber));
    return { ok: true, orderNumber };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unable to place order.';
    return { ok: false, error: message };
  }
}
