import { z } from 'zod';

import { isOfferedCheckoutPaymentMethod } from '@/features/checkout/domain/payment-methods';
import {
  GROUP_ORDER_PAYMENT_MODES,
  GROUP_ORDER_STATUSES,
} from '@/features/group-orders/domain/status';

export const createGroupOrderSchema = z.object({
  paymentMode: z.enum(GROUP_ORDER_PAYMENT_MODES),
  spendLimitAmount: z.number().int().positive().nullable().optional(),
  organizerDisplayName: z.string().trim().min(1).max(80),
});

export type CreateGroupOrderInput = z.infer<typeof createGroupOrderSchema>;

export const joinGroupOrderSchema = z.object({
  inviteToken: z.string().uuid(),
  displayName: z.string().trim().min(1).max(80),
});

export type JoinGroupOrderInput = z.infer<typeof joinGroupOrderSchema>;

export const groupOrderInviteTokenSchema = z.object({
  inviteToken: z.string().uuid(),
});

export const updateSpendLimitSchema = z.object({
  inviteToken: z.string().uuid(),
  spendLimitAmount: z.number().int().positive().nullable(),
});

export const addGroupOrderItemSchema = z.object({
  inviteToken: z.string().uuid(),
  productId: z.string().uuid(),
  quantity: z.number().int().positive().max(99),
  modifierIds: z.array(z.string().uuid()).max(40).optional(),
});

export const updateGroupOrderItemQuantitySchema = z.object({
  inviteToken: z.string().uuid(),
  itemId: z.string().uuid(),
  quantity: z.number().int().min(0).max(99),
});

export const removeGroupOrderItemSchema = z.object({
  inviteToken: z.string().uuid(),
  itemId: z.string().uuid(),
});

export const removeParticipantSchema = z.object({
  inviteToken: z.string().uuid(),
  participantId: z.string().uuid(),
});

export const setJoinsClosedSchema = z.object({
  inviteToken: z.string().uuid(),
  joinsClosed: z.boolean(),
});

export const markItemsReadySchema = z.object({
  inviteToken: z.string().uuid(),
});

export const setDeliveryAmountSchema = z.object({
  inviteToken: z.string().uuid(),
  deliveryAmount: z.number().int().min(0),
});

export const setDeliveryAddressSchema = z.object({
  inviteToken: z.string().uuid(),
  deliveryAddress: z.string().trim().max(300),
  deliveryRuleId: z.string().uuid(),
  locale: z.enum(['hy', 'en', 'ru']),
});

export const adminGroupOrderIdSchema = z.object({
  groupOrderId: z.string().uuid(),
});

export const adminGroupOrdersFilterSchema = z.object({
  status: z.enum(GROUP_ORDER_STATUSES).optional(),
  paymentMode: z.enum(GROUP_ORDER_PAYMENT_MODES).optional(),
  q: z.string().trim().max(100).optional(),
  page: z.coerce.number().int().min(1).max(500).default(1),
});

export type AdminGroupOrdersFilter = z.infer<typeof adminGroupOrdersFilterSchema>;

export const adminMarkParticipantPaidSchema = z.object({
  groupOrderId: z.string().uuid(),
  participantId: z.string().uuid(),
});

export const completeParticipantCardPaymentSchema = z
  .object({
    inviteToken: z.string().uuid(),
    provider: z.enum(['idram', 'arca']),
  })
  .superRefine((value, ctx) => {
    if (!isOfferedCheckoutPaymentMethod(value.provider)) {
      ctx.addIssue({
        code: 'custom',
        path: ['provider'],
        message: 'This payment method is not available.',
      });
    }
  });

export const adminRefundParticipantSchema = z.object({
  groupOrderId: z.string().uuid(),
  participantId: z.string().uuid(),
  /** When true, also zero delivery share if participant has no remaining items. */
  recalculateDelivery: z.boolean().optional(),
});
