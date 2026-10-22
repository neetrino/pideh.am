'use server';

import { z } from 'zod';

import {
  deleteAdminPushSubscription,
  upsertAdminPushSubscription,
} from '@/features/orders/application/admin-push-subscriptions';
import { requireAdmin } from '@/lib/auth/policies';
import { isLocale, type Locale } from '@/lib/i18n/config';
import { logger } from '@/lib/observability/logger';
import { err, ok, type Result } from '@/lib/result';

const MAX_ENDPOINT_LENGTH = 2048;
const MAX_KEY_LENGTH = 256;
const base64UrlKey = z
  .string()
  .min(1)
  .max(MAX_KEY_LENGTH)
  .regex(/^[A-Za-z0-9_-]+=*$/);

const endpointSchema = z
  .string()
  .max(MAX_ENDPOINT_LENGTH)
  .url()
  .refine((value) => value.startsWith('https://'), 'Push endpoint must be HTTPS.');

const subscriptionSchema = z.object({
  endpoint: endpointSchema,
  keys: z.object({ p256dh: base64UrlKey, auth: base64UrlKey }),
});

export type AdminPushSubscriptionPayload = z.infer<typeof subscriptionSchema>;

/** Registers the current browser to receive new-order push notifications. */
export async function saveAdminPushSubscriptionAction(
  locale: string,
  subscription: AdminPushSubscriptionPayload,
): Promise<Result<{ saved: true }>> {
  if (!isLocale(locale)) return err('INVALID_LOCALE', 'Invalid locale.');
  const admin = await requireAdmin(locale as Locale);

  const parsed = subscriptionSchema.safeParse(subscription);
  if (!parsed.success) return err('VALIDATION_ERROR', 'Invalid push subscription.');

  try {
    await upsertAdminPushSubscription(admin.id, {
      endpoint: parsed.data.endpoint,
      p256dh: parsed.data.keys.p256dh,
      auth: parsed.data.keys.auth,
      locale,
    });
    return ok({ saved: true });
  } catch (error) {
    logger.error('admin_push.subscribe_failed', {
      userId: admin.id,
      error: error instanceof Error ? error.message : 'unknown',
    });
    return err('INTERNAL_ERROR', 'Unable to enable notifications.');
  }
}

/** Stops push notifications for the current browser. */
export async function removeAdminPushSubscriptionAction(
  locale: string,
  endpoint: string,
): Promise<Result<{ removed: true }>> {
  if (!isLocale(locale)) return err('INVALID_LOCALE', 'Invalid locale.');
  const admin = await requireAdmin(locale as Locale);

  const parsed = endpointSchema.safeParse(endpoint);
  if (!parsed.success) return err('VALIDATION_ERROR', 'Invalid push endpoint.');

  await deleteAdminPushSubscription(admin.id, parsed.data);
  return ok({ removed: true });
}
