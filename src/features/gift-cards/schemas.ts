import { z } from 'zod';

import {
  CHECKOUT_PAYMENT_METHODS,
  isOfferedCheckoutPaymentMethod,
} from '@/features/checkout/domain/payment-methods';

export const purchaseGiftCardSchema = z
  .object({
    amount: z.coerce.number().int().min(1).max(100_000_000),
    recipientName: z.string().trim().min(1).max(120),
    recipientEmail: z.string().trim().email().max(254),
    recipientPhone: z.string().trim().max(40).optional(),
    purchaserName: z.string().trim().min(1).max(120),
    message: z.string().trim().max(1000).optional(),
    scheduledSendAt: z.string().datetime().optional().nullable(),
    paymentMethod: z.enum(CHECKOUT_PAYMENT_METHODS),
    locale: z.enum(['hy', 'en', 'ru']),
  })
  .superRefine((value, ctx) => {
    if (!isOfferedCheckoutPaymentMethod(value.paymentMethod)) {
      ctx.addIssue({
        code: 'custom',
        path: ['paymentMethod'],
        message: 'This payment method is not available.',
      });
    }
  });

export type PurchaseGiftCardInput = z.infer<typeof purchaseGiftCardSchema>;

export const adminCreateGiftCardSchema = z.object({
  amount: z.coerce.number().int().min(1).max(100_000_000),
  recipientName: z.string().trim().min(1).max(120),
  recipientEmail: z.string().trim().email().max(254),
  recipientPhone: z.string().trim().max(40).optional(),
  purchaserName: z.string().trim().min(1).max(120).default('White Shop'),
  purchaserEmail: z.string().trim().email().max(254).optional(),
  message: z.string().trim().max(1000).optional(),
  expiresAt: z.string().datetime().optional().nullable(),
  sendEmail: z.boolean().default(true),
  activateImmediately: z.boolean().default(true),
});

export type AdminCreateGiftCardInput = z.infer<typeof adminCreateGiftCardSchema>;

export const adminGiftCardIdSchema = z.object({
  id: z.string().uuid(),
});
