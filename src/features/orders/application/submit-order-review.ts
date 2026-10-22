'use server';

import { and, eq, isNull } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';

import { getDb } from '@/db/client';
import { orders } from '@/db/schema';
import {
  submitOrderReviewSchema,
  type SubmitOrderReviewInput,
} from '@/features/orders/schemas/submit-order-review';
import { isReviewEligibleOrderStatus, sanitizeReviewComment } from '@/features/reviews/domain/review-rules';
import { requireUser } from '@/lib/auth/policies';
import { isLocale, type Locale } from '@/lib/i18n/config';
import { logger } from '@/lib/observability/logger';
import { err, ok, type Result } from '@/lib/result';

/**
 * Customer submits a one-time 1–5 star review for a delivered order they own.
 */
export async function submitOrderReviewAction(
  locale: string,
  raw: SubmitOrderReviewInput,
): Promise<Result<{ orderNumber: string }>> {
  if (!isLocale(locale)) {
    return err('INVALID_LOCALE', 'Invalid locale.');
  }

  const parsed = submitOrderReviewSchema.safeParse(raw);
  if (!parsed.success) {
    return err('VALIDATION_ERROR', 'Invalid review payload.');
  }

  const user = await requireUser(locale as Locale);
  const comment = sanitizeReviewComment(parsed.data.comment) || null;

  const orderNumber = parsed.data.orderNumber;
  const now = new Date();

  try {
    const [order] = await getDb()
      .select({
        id: orders.id,
        userId: orders.userId,
        status: orders.status,
        customerReviewRating: orders.customerReviewRating,
      })
      .from(orders)
      .where(eq(orders.orderNumber, orderNumber))
      .limit(1);

    if (!order || order.userId !== user.id) {
      return err('NOT_FOUND', 'Order not found.');
    }

    if (!isReviewEligibleOrderStatus(order.status)) {
      return err('NOT_ELIGIBLE', 'You can review this order after it is delivered.');
    }

    if (order.customerReviewRating != null) {
      return err('ALREADY_REVIEWED', 'You already reviewed this order.');
    }

    const updated = await getDb()
      .update(orders)
      .set({
        customerReviewRating: parsed.data.rating,
        customerReviewComment: comment,
        customerReviewedAt: now,
        updatedAt: now,
      })
      .where(
        and(
          eq(orders.id, order.id),
          eq(orders.userId, user.id),
          isNull(orders.customerReviewRating),
        ),
      )
      .returning({ orderNumber: orders.orderNumber });

    if (!updated[0]) {
      return err('ALREADY_REVIEWED', 'You already reviewed this order.');
    }

    revalidatePath(`/${locale}/profile/orders`);
    revalidatePath(`/${locale}/admin/orders`);
    revalidatePath(`/${locale}/admin/orders/${orderNumber}`);

    return ok({ orderNumber });
  } catch (error) {
    logger.error('order.review.submit_failed', {
      orderNumber,
      userId: user.id,
      reason: error instanceof Error ? error.message : 'unknown',
    });
    return err('REVIEW_SUBMIT_FAILED', 'Unable to submit review.');
  }
}
