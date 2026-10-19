import { and, eq } from 'drizzle-orm';

import { getDb } from '@/db/client';
import { groupOrderParticipants } from '@/db/schema';
import { assertParticipantAccess } from '@/features/group-orders/application/access';
import { advanceSplitGroupOrderIfAllPaid } from '@/features/group-orders/application/advance-after-payments';
import { appendGroupOrderEvent } from '@/features/group-orders/application/money';
import { isSuccessfulParticipantPayment } from '@/features/group-orders/domain/spend-limit';
import { isPaymentMethodTemporarilyUnavailable } from '@/features/checkout/domain/payment-methods';
import type { CheckoutOnlineProvider } from '@/features/checkout/domain/payment-modes';
import { createId } from '@/lib/id';

export type ParticipantPaymentResult =
  { ok: true; advancedToCheckout: boolean } | { ok: false; error: string };

export type ParticipantPaymentView =
  | {
      ok: true;
      inviteToken: string;
      displayName: string;
      amount: number;
      amountFormatted: string;
      alreadyPaid: boolean;
      currency: 'AMD';
    }
  | { ok: false; error: string };

/**
 * Completes a participant's split-share card payment on the group-order page.
 *
 * Real Idram/Arca adapters are still OPEN-002; this path records the chosen
 * provider, marks the participant PAID, and advances the group when everyone
 * who owes money has paid. Swap the capture step for a PSP redirect later.
 */
export async function completeParticipantCardPayment(input: {
  inviteToken: string;
  provider: CheckoutOnlineProvider;
}): Promise<ParticipantPaymentResult> {
  if (isPaymentMethodTemporarilyUnavailable(input.provider)) {
    return { ok: false, error: 'This payment method is temporarily unavailable.' };
  }

  const access = await assertParticipantAccess(input.inviteToken);
  if (!access.ok) return access;

  const { groupOrder, participant } = access;

  if (groupOrder.paymentMode !== 'SPLIT_PER_PARTICIPANT') {
    return {
      ok: false,
      error: 'Card payment per participant is only for split payment mode.',
    };
  }
  if (participant.role === 'ORGANIZER') {
    return {
      ok: false,
      error: 'The organizer pays their share on the checkout page.',
    };
  }
  if (groupOrder.status !== 'AWAITING_PAYMENTS') {
    return {
      ok: false,
      error: 'This group order is not awaiting payments.',
    };
  }
  if (isSuccessfulParticipantPayment(participant.paymentStatus)) {
    return { ok: true, advancedToCheckout: false };
  }
  if (participant.finalAmount <= 0) {
    return { ok: false, error: 'Nothing to pay for this participant.' };
  }

  const paymentId = createId();
  const db = getDb();

  await db
    .update(groupOrderParticipants)
    .set({
      paymentStatus: 'PAID',
      paymentId,
      updatedAt: new Date(),
    })
    .where(
      and(
        eq(groupOrderParticipants.id, participant.id),
        eq(groupOrderParticipants.groupOrderId, groupOrder.id),
      ),
    );

  await appendGroupOrderEvent(db, {
    groupOrderId: groupOrder.id,
    eventType: 'PAYMENT_STATUS',
    actorParticipantId: participant.id,
    payload: {
      participantId: participant.id,
      status: 'PAID',
      provider: input.provider,
      paymentId,
      amount: participant.finalAmount,
      source: 'participant_card',
    },
  });

  const { advanced } = await advanceSplitGroupOrderIfAllPaid({
    db,
    groupOrderId: groupOrder.id,
    actorParticipantId: participant.id,
  });

  return { ok: true, advancedToCheckout: advanced };
}

export async function getParticipantPaymentContext(input: {
  inviteToken: string;
  formatAmount: (amount: number) => string;
}): Promise<ParticipantPaymentView> {
  const access = await assertParticipantAccess(input.inviteToken);
  if (!access.ok) return access;

  const { groupOrder, participant } = access;
  if (groupOrder.paymentMode !== 'SPLIT_PER_PARTICIPANT') {
    return { ok: false, error: 'Split payment mode required.' };
  }
  if (participant.role === 'ORGANIZER') {
    return {
      ok: false,
      error: 'The organizer pays their share on the checkout page.',
    };
  }
  if (
    groupOrder.status !== 'AWAITING_PAYMENTS' &&
    !isSuccessfulParticipantPayment(participant.paymentStatus)
  ) {
    return { ok: false, error: 'This group order is not awaiting payments.' };
  }

  return {
    ok: true,
    inviteToken: input.inviteToken,
    displayName: participant.displayName,
    amount: participant.finalAmount,
    amountFormatted: input.formatAmount(participant.finalAmount),
    alreadyPaid: isSuccessfulParticipantPayment(participant.paymentStatus),
    currency: 'AMD',
  };
}
