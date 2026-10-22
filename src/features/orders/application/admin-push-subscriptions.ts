import 'server-only';

import { and, eq, inArray } from 'drizzle-orm';

import { getDb } from '@/db/client';
import { adminPushSubscriptions, users } from '@/db/schema';
import { createId } from '@/lib/id';

export type AdminPushSubscriptionInput = {
  endpoint: string;
  p256dh: string;
  auth: string;
  locale: string;
};

export type AdminPushSubscriptionRow = AdminPushSubscriptionInput & { id: string };

/** Stores (or re-binds) a browser push endpoint for an admin user. */
export async function upsertAdminPushSubscription(
  userId: string,
  input: AdminPushSubscriptionInput,
): Promise<void> {
  const now = new Date();
  await getDb()
    .insert(adminPushSubscriptions)
    .values({ id: createId(), userId, ...input })
    .onConflictDoUpdate({
      target: adminPushSubscriptions.endpoint,
      set: { userId, p256dh: input.p256dh, auth: input.auth, locale: input.locale, updatedAt: now },
    });
}

export async function deleteAdminPushSubscription(userId: string, endpoint: string): Promise<void> {
  await getDb()
    .delete(adminPushSubscriptions)
    .where(
      and(eq(adminPushSubscriptions.userId, userId), eq(adminPushSubscriptions.endpoint, endpoint)),
    );
}

export async function deleteAdminPushSubscriptionsByIds(ids: string[]): Promise<void> {
  if (ids.length === 0) return;
  await getDb().delete(adminPushSubscriptions).where(inArray(adminPushSubscriptions.id, ids));
}

/** Subscriptions that belong to currently active administrators. */
export async function listActiveAdminPushSubscriptions(): Promise<AdminPushSubscriptionRow[]> {
  return getDb()
    .select({
      id: adminPushSubscriptions.id,
      endpoint: adminPushSubscriptions.endpoint,
      p256dh: adminPushSubscriptions.p256dh,
      auth: adminPushSubscriptions.auth,
      locale: adminPushSubscriptions.locale,
    })
    .from(adminPushSubscriptions)
    .innerJoin(users, eq(users.id, adminPushSubscriptions.userId))
    .where(and(eq(users.role, 'ADMIN'), eq(users.status, 'ACTIVE')));
}
