import { z } from 'zod';

import {
  CHECKOUT_PAYMENT_METHODS,
  isOfferedCheckoutPaymentMethod,
} from '@/features/checkout/domain/payment-methods';
import { CHECKOUT_SHIPPING_METHODS } from '@/features/checkout/domain/shipping-methods';

export const checkoutSchema = z
  .object({
    firstName: z.string().trim().min(1).max(80),
    lastName: z.string().trim().min(1).max(80),
    contactEmail: z.string().trim().email().max(254),
    contactPhone: z.string().trim().min(5).max(40),
    shippingMethod: z.enum(CHECKOUT_SHIPPING_METHODS),
    paymentMethod: z.enum(CHECKOUT_PAYMENT_METHODS),
    city: z.string().trim().max(80).optional(),
    line1: z.string().trim().max(300).optional(),
    /** Admin delivery zone selected at checkout. */
    deliveryRuleId: z.string().uuid().optional(),
    /** Map pin coordinates for courier guidance. */
    deliveryLat: z.number().finite().min(-90).max(90).optional(),
    deliveryLng: z.number().finite().min(-180).max(180).optional(),
    line2: z.string().trim().max(160).optional(),
    floor: z.string().trim().max(20).optional(),
    intercomCode: z.string().trim().max(40).optional(),
    scheduledDeliveryDate: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/)
      .optional(),
    scheduledDeliveryStart: z
      .string()
      .regex(/^([01]\d|2[0-3]):([0-5]\d)$/)
      .optional(),
    scheduledDeliveryEnd: z
      .string()
      .regex(/^([01]\d|2[0-3]):([0-5]\d)$/)
      .optional(),
    cashChangeAmount: z.coerce.number().int().min(0).max(100_000_000).optional(),
    region: z.string().trim().max(80).optional(),
    postalCode: z.string().trim().max(32).optional(),
    idempotencyKey: z.string().trim().min(8).max(128),
    locale: z.enum(['hy', 'en', 'ru']),
    couponCode: z.string().trim().max(64).optional(),
    /** Bonus points to redeem; ignored for guests. */
    bonusRedeemAmount: z.coerce.number().int().min(0).max(100_000_000).optional(),
    /** Gift card code to redeem at checkout. */
    giftCardCode: z.string().trim().max(64).optional(),
    /** Optional note for the kitchen or courier. */
    orderNote: z.string().trim().max(500).optional(),
  })
  .superRefine((value, ctx) => {
    if (!isOfferedCheckoutPaymentMethod(value.paymentMethod)) {
      ctx.addIssue({
        code: 'custom',
        path: ['paymentMethod'],
        message: 'This payment method is not available.',
      });
    }

    if (value.shippingMethod !== 'delivery') {
      return;
    }

    if (!value.deliveryRuleId) {
      ctx.addIssue({
        code: 'custom',
        path: ['deliveryRuleId'],
        message: 'Delivery location is required.',
      });
    }
    if (!value.line1?.trim() || value.line1.trim().length < 3) {
      ctx.addIssue({
        code: 'custom',
        path: ['line1'],
        message: 'Address is required for delivery.',
      });
    }
    const scheduledParts = [
      value.scheduledDeliveryDate,
      value.scheduledDeliveryStart,
      value.scheduledDeliveryEnd,
    ];
    const scheduledCount = scheduledParts.filter(Boolean).length;
    // ASAP = all empty; scheduled = all three present. Partial is invalid.
    if (scheduledCount > 0 && scheduledCount < 3) {
      ctx.addIssue({
        code: 'custom',
        path: ['scheduledDeliveryDate'],
        message: 'Delivery date and time must be complete.',
      });
    }
  });

export type CheckoutInput = z.infer<typeof checkoutSchema>;
