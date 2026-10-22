import { index, pgTable, text, uniqueIndex, uuid } from 'drizzle-orm/pg-core';

import { createdAtColumn, idColumn, updatedAtColumn } from '@/db/schema/columns';
import { users } from '@/db/schema/identity';

/** Browser Web Push endpoints that receive admin new-order notifications. */
export const adminPushSubscriptions = pgTable(
  'admin_push_subscriptions',
  {
    id: idColumn(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    endpoint: text('endpoint').notNull(),
    p256dh: text('p256dh').notNull(),
    auth: text('auth').notNull(),
    /** Admin UI locale at subscribe time; used to localize notification text. */
    locale: text('locale').notNull(),
    createdAt: createdAtColumn(),
    updatedAt: updatedAtColumn(),
  },
  (table) => [
    uniqueIndex('admin_push_subscriptions_endpoint_uidx').on(table.endpoint),
    index('admin_push_subscriptions_user_idx').on(table.userId),
  ],
);
