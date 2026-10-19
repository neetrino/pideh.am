'use server';

import { eq } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';

import { auditLogs, giftCards } from '@/db/schema';
import { withTransaction } from '@/db/transaction';
import {
  activateGiftCardRecord,
  createGiftCardRecord,
} from '@/features/gift-cards/application/create-gift-card';
import { sendGiftCardEmail } from '@/features/gift-cards/application/send-gift-card-email';
import { isPaymentMethodTemporarilyUnavailable } from '@/features/checkout/domain/payment-methods';
import { isValidGiftCardAmount } from '@/features/gift-cards/domain/gift-card-rules';
import {
  adminCreateGiftCardSchema,
  adminGiftCardIdSchema,
  purchaseGiftCardSchema,
} from '@/features/gift-cards/schemas';
import { getStoreGiftCardSettings } from '@/features/settings/application/queries';
import { requireAdmin } from '@/lib/auth/policies';
import { getCurrentUser } from '@/lib/auth/session';
import { createId } from '@/lib/id';
import { isLocale, type Locale } from '@/lib/i18n/config';
import { err, ok, type Result } from '@/lib/result';

function revalidateGiftCardPaths(locale: string, id?: string): void {
  revalidatePath(`/${locale}/admin/gift-cards`);
  revalidatePath(`/${locale}/profile/gift-cards`);
  revalidatePath(`/${locale}/profile/gift-cards/buy`);
  if (id) {
    revalidatePath(`/${locale}/admin/gift-cards/${id}`);
  }
}

/** Customer purchases a gift card and activates it for digital delivery. */
export async function purchaseGiftCardAction(
  raw: unknown,
): Promise<Result<{ id: string; code: string; status: string }>> {
  const parsed = purchaseGiftCardSchema.safeParse(raw);
  if (!parsed.success) {
    return err('VALIDATION_ERROR', 'Invalid gift card purchase payload.');
  }
  if (!isLocale(parsed.data.locale)) {
    return err('INVALID_LOCALE', 'Invalid locale.');
  }
  if (isPaymentMethodTemporarilyUnavailable(parsed.data.paymentMethod)) {
    return err('PAYMENT_UNAVAILABLE', 'This payment method is temporarily unavailable.');
  }

  const user = await getCurrentUser();
  if (!user) {
    return err('UNAUTHORIZED', 'Sign in to purchase a gift card.');
  }

  const settings = await getStoreGiftCardSettings();
  if (!isValidGiftCardAmount(parsed.data.amount, settings)) {
    return err(
      'INVALID_AMOUNT',
      `Amount must be between ${settings.minAmount} and ${settings.maxAmount} AMD.`,
    );
  }

  try {
    const result = await withTransaction(async (tx) => {
      const created = await createGiftCardRecord({
        tx,
        amount: parsed.data.amount,
        purchaserName: parsed.data.purchaserName,
        purchaserEmail: user.email,
        purchaserUserId: user.id,
        recipientName: parsed.data.recipientName,
        recipientEmail: parsed.data.recipientEmail,
        recipientPhone: parsed.data.recipientPhone,
        message: parsed.data.message,
        paymentMethod: parsed.data.paymentMethod,
        scheduledSendAt: parsed.data.scheduledSendAt ? new Date(parsed.data.scheduledSendAt) : null,
        settings,
      });

      // Digital gift cards must be ACTIVE to redeem/email. Purchase placement
      // activates immediately (same trust model as checkout payment recording).
      await activateGiftCardRecord({
        tx,
        giftCardId: created.id,
        actorUserId: user.id,
        correlationId: created.id,
        sendEmail: true,
        locale: parsed.data.locale,
      });

      await tx.insert(auditLogs).values({
        id: createId(),
        actorUserId: user.id,
        action: 'gift_card.purchase',
        targetType: 'gift_card',
        targetId: created.id,
        afterDiff: {
          amount: parsed.data.amount,
          paymentMethod: parsed.data.paymentMethod,
          code: created.code,
          status: 'ACTIVE',
        },
        correlationId: created.id,
      });

      return created;
    });

    revalidateGiftCardPaths(parsed.data.locale, result.id);
    return ok({ id: result.id, code: result.code, status: 'ACTIVE' });
  } catch (caught) {
    return err(
      'PURCHASE_FAILED',
      caught instanceof Error ? caught.message : 'Gift card purchase failed.',
    );
  }
}

/** Admin creates a gift card (optionally activates and emails immediately). */
export async function adminCreateGiftCardAction(
  locale: string,
  raw: unknown,
): Promise<Result<{ id: string; code: string }>> {
  if (!isLocale(locale)) {
    return err('INVALID_LOCALE', 'Invalid locale.');
  }

  const parsed = adminCreateGiftCardSchema.safeParse(raw);
  if (!parsed.success) {
    return err('VALIDATION_ERROR', 'Invalid gift card payload.');
  }

  const actor = await requireAdmin(locale as Locale);
  const settings = await getStoreGiftCardSettings();
  if (!isValidGiftCardAmount(parsed.data.amount, settings)) {
    return err(
      'INVALID_AMOUNT',
      `Amount must be between ${settings.minAmount} and ${settings.maxAmount} AMD.`,
    );
  }

  try {
    const result = await withTransaction(async (tx) => {
      const created = await createGiftCardRecord({
        tx,
        amount: parsed.data.amount,
        purchaserName: parsed.data.purchaserName,
        purchaserEmail: parsed.data.purchaserEmail,
        recipientName: parsed.data.recipientName,
        recipientEmail: parsed.data.recipientEmail,
        recipientPhone: parsed.data.recipientPhone,
        message: parsed.data.message,
        expiresAt: parsed.data.expiresAt ? new Date(parsed.data.expiresAt) : null,
        createdByUserId: actor.id,
        paymentMethod: 'ADMIN_ISSUE',
        settings,
      });

      if (parsed.data.activateImmediately) {
        await activateGiftCardRecord({
          tx,
          giftCardId: created.id,
          actorUserId: actor.id,
          correlationId: created.id,
          sendEmail: parsed.data.sendEmail,
          locale,
        });
      }

      await tx.insert(auditLogs).values({
        id: createId(),
        actorUserId: actor.id,
        action: 'gift_card.create',
        targetType: 'gift_card',
        targetId: created.id,
        afterDiff: {
          amount: parsed.data.amount,
          activated: parsed.data.activateImmediately,
          code: created.code,
        },
        correlationId: created.id,
      });

      return created;
    });

    revalidateGiftCardPaths(locale, result.id);
    return ok(result);
  } catch (caught) {
    return err(
      'CREATE_FAILED',
      caught instanceof Error ? caught.message : 'Gift card create failed.',
    );
  }
}

/** Admin marks payment received and activates a pending card. */
export async function adminActivateGiftCardAction(
  locale: string,
  raw: unknown,
): Promise<Result<{ code: string; sent: boolean }>> {
  if (!isLocale(locale)) {
    return err('INVALID_LOCALE', 'Invalid locale.');
  }
  const parsed = adminGiftCardIdSchema.safeParse(raw);
  if (!parsed.success) {
    return err('VALIDATION_ERROR', 'Invalid gift card id.');
  }

  const actor = await requireAdmin(locale as Locale);

  try {
    const result = await withTransaction(async (tx) => {
      const activated = await activateGiftCardRecord({
        tx,
        giftCardId: parsed.data.id,
        actorUserId: actor.id,
        correlationId: parsed.data.id,
        sendEmail: true,
        locale,
      });

      await tx.insert(auditLogs).values({
        id: createId(),
        actorUserId: actor.id,
        action: 'gift_card.activate',
        targetType: 'gift_card',
        targetId: parsed.data.id,
        afterDiff: { code: activated.code, sent: activated.sent },
        correlationId: parsed.data.id,
      });

      return activated;
    });

    revalidateGiftCardPaths(locale, parsed.data.id);
    return ok(result);
  } catch (caught) {
    return err('ACTIVATE_FAILED', caught instanceof Error ? caught.message : 'Activation failed.');
  }
}

/** Admin disables an active/pending card. */
export async function adminDisableGiftCardAction(
  locale: string,
  raw: unknown,
): Promise<Result<{ id: string }>> {
  if (!isLocale(locale)) {
    return err('INVALID_LOCALE', 'Invalid locale.');
  }
  const parsed = adminGiftCardIdSchema.safeParse(raw);
  if (!parsed.success) {
    return err('VALIDATION_ERROR', 'Invalid gift card id.');
  }

  const actor = await requireAdmin(locale as Locale);
  const now = new Date();

  try {
    await withTransaction(async (tx) => {
      const [card] = await tx
        .select({ id: giftCards.id, status: giftCards.status })
        .from(giftCards)
        .where(eq(giftCards.id, parsed.data.id))
        .for('update')
        .limit(1);
      if (!card) {
        throw new Error('GIFT_CARD_NOT_FOUND');
      }
      if (card.status === 'DISABLED') {
        return;
      }

      await tx
        .update(giftCards)
        .set({
          status: 'DISABLED',
          disabledAt: now,
          disabledReason: 'Disabled by admin',
          updatedAt: now,
        })
        .where(eq(giftCards.id, card.id));

      await tx.insert(auditLogs).values({
        id: createId(),
        actorUserId: actor.id,
        action: 'gift_card.disable',
        targetType: 'gift_card',
        targetId: card.id,
        correlationId: card.id,
      });
    });

    revalidateGiftCardPaths(locale, parsed.data.id);
    return ok({ id: parsed.data.id });
  } catch (caught) {
    return err('DISABLE_FAILED', caught instanceof Error ? caught.message : 'Disable failed.');
  }
}

/** Resends the gift card code email (active cards only). */
export async function adminResendGiftCardEmailAction(
  locale: string,
  raw: unknown,
): Promise<Result<{ sent: boolean }>> {
  if (!isLocale(locale)) {
    return err('INVALID_LOCALE', 'Invalid locale.');
  }
  const parsed = adminGiftCardIdSchema.safeParse(raw);
  if (!parsed.success) {
    return err('VALIDATION_ERROR', 'Invalid gift card id.');
  }

  const actor = await requireAdmin(locale as Locale);

  try {
    const result = await withTransaction(async (tx) => {
      const [card] = await tx
        .select()
        .from(giftCards)
        .where(eq(giftCards.id, parsed.data.id))
        .for('update')
        .limit(1);
      if (!card) {
        throw new Error('GIFT_CARD_NOT_FOUND');
      }
      if (card.status !== 'ACTIVE' && card.status !== 'USED') {
        throw new Error('GIFT_CARD_NOT_ACTIVE');
      }

      await sendGiftCardEmail({
        to: card.recipientEmail,
        recipientName: card.recipientName,
        purchaserName: card.purchaserName,
        code: card.code,
        amount: card.initialAmount,
        message: card.message,
        expiresAt: card.expiresAt,
        locale,
      });

      const now = new Date();
      await tx
        .update(giftCards)
        .set({ sentAt: now, updatedAt: now })
        .where(eq(giftCards.id, card.id));

      await tx.insert(auditLogs).values({
        id: createId(),
        actorUserId: actor.id,
        action: 'gift_card.resend_email',
        targetType: 'gift_card',
        targetId: card.id,
        correlationId: card.id,
      });

      return { sent: true };
    });

    revalidateGiftCardPaths(locale, parsed.data.id);
    return ok(result);
  } catch (caught) {
    return err('RESEND_FAILED', caught instanceof Error ? caught.message : 'Resend failed.');
  }
}
