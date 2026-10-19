import { describe, expect, it } from 'vitest';

import { checkoutSchema } from '@/features/checkout/schemas';
import { purchaseGiftCardSchema } from '@/features/gift-cards/schemas';
import { completeParticipantCardPaymentSchema } from '@/features/group-orders/schemas';
import {
  HIDDEN_CHECKOUT_PAYMENT_METHODS,
  isOfferedCheckoutPaymentMethod,
} from '@/features/checkout/domain/payment-methods';
import { offeredCheckoutOnlineProviders } from '@/features/checkout/domain/payment-modes';

describe('hidden checkout payment methods', () => {
  it('keeps card and Idram defined but not offered', () => {
    expect(HIDDEN_CHECKOUT_PAYMENT_METHODS).toEqual(['idram', 'arca']);
    expect(isOfferedCheckoutPaymentMethod('idram')).toBe(false);
    expect(isOfferedCheckoutPaymentMethod('arca')).toBe(false);
    expect(isOfferedCheckoutPaymentMethod('cash_on_delivery')).toBe(true);
    expect(isOfferedCheckoutPaymentMethod('terminal')).toBe(true);
    expect(offeredCheckoutOnlineProviders()).toEqual([]);
  });

  it('rejects hidden methods on new checkout, gift card, and group-order payments', () => {
    const checkout = checkoutSchema.safeParse({
      firstName: 'Ani',
      lastName: 'Petrosyan',
      contactEmail: 'ani@example.com',
      contactPhone: '+37499111222',
      shippingMethod: 'pickup',
      paymentMethod: 'arca',
      idempotencyKey: 'checkout-key-1',
      locale: 'en',
    });
    expect(checkout.success).toBe(false);

    const giftCard = purchaseGiftCardSchema.safeParse({
      amount: 5000,
      recipientName: 'Ani',
      recipientEmail: 'ani@example.com',
      purchaserName: 'Vardan',
      paymentMethod: 'idram',
      locale: 'en',
    });
    expect(giftCard.success).toBe(false);

    const groupPay = completeParticipantCardPaymentSchema.safeParse({
      inviteToken: '11111111-1111-4111-8111-111111111111',
      provider: 'arca',
    });
    expect(groupPay.success).toBe(false);
  });
});
