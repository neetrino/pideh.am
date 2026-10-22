import 'server-only';

import {
  and,
  count,
  desc,
  eq,
  gte,
  ilike,
  inArray,
  isNotNull,
  isNull,
  lte,
  or,
  sql,
  type SQL,
} from 'drizzle-orm';

import { getDb } from '@/db/client';
import {
  orderEvents,
  orderItemModifiers,
  orderItems,
  orders,
  payments,
  products,
  users,
} from '@/db/schema';
import { customerVisibleOrdersWhere } from '@/features/orders/application/customer-order-access';
import {
  customerFacingBonusEarnedSql,
  customerFacingOrderAmountSql,
} from '@/features/orders/application/customer-facing-order-amount-sql';
import type { OrderStatus } from '@/features/orders/domain/order-status';
import type { AdminOrdersFilter } from '@/features/orders/schemas/change-status';
import { getStoreRevenue } from '@/features/settings/application/queries';

const PAGE_SIZE = 20;

export type AdminOrderListItem = {
  id: string;
  orderNumber: string;
  status: string;
  paymentStatus: string;
  /** First payment attempt method (COD / IDRAM / ARCA / TERMINAL). */
  paymentMethod: string | null;
  contactName: string;
  contactEmail: string;
  /** Linked account admin comment; null when guest order or no comment. */
  customerAdminComment: string | null;
  totalAmount: number;
  bonusRedeemedAmount: number;
  bonusEarnedAmount: number;
  baseCurrency: string;
  placedAt: Date;
  isArchived: boolean;
  /** True when no admin has opened the order drawer yet. */
  isAdminNew: boolean;
};

export type CustomerOrderListItem = AdminOrderListItem & {
  isGroup: boolean;
  itemCount: number;
  customerReviewRating: number | null;
};

export type AdminUnseenOrderAlert = {
  id: string;
  orderNumber: string;
  contactName: string;
  totalAmount: number;
  baseCurrency: string;
  paymentMethod: string | null;
  placedAt: Date;
};

export type AdminUnseenOrdersSnapshot = {
  count: number;
  /** All unseen order ids (for “heard — close all”). */
  unseenIds: string[];
  latest: AdminUnseenOrderAlert[];
};

export type OrderItemModifierSnapshot = {
  id: string;
  kind: 'ADDITION' | 'EXCEPTION';
  name: string;
  unitPriceAmount: number;
};

export type AdminOrderDetail = {
  order: typeof orders.$inferSelect;
  items: Array<
    typeof orderItems.$inferSelect & {
      modifiers: OrderItemModifierSnapshot[];
    }
  >;
  events: Array<typeof orderEvents.$inferSelect>;
  payments: Array<typeof payments.$inferSelect>;
};

function buildOrderFilters(filters: AdminOrdersFilter): SQL | undefined {
  const conditions: SQL[] = [];

  if (filters.archived === 'active') {
    conditions.push(eq(orders.isArchived, false));
  } else if (filters.archived === 'archived') {
    conditions.push(eq(orders.isArchived, true));
  }

  if (filters.kind === 'individual') {
    conditions.push(isNull(orders.groupOrderId));
  }

  if (filters.kind === 'group') {
    conditions.push(isNotNull(orders.groupOrderId));
  }

  if (filters.status) {
    conditions.push(eq(orders.status, filters.status));
  }

  if (filters.paymentStatus) {
    conditions.push(eq(orders.paymentStatus, filters.paymentStatus));
  }

  if (filters.dateFrom) {
    conditions.push(gte(orders.placedAt, new Date(`${filters.dateFrom}T00:00:00.000Z`)));
  }

  if (filters.dateTo) {
    conditions.push(lte(orders.placedAt, new Date(`${filters.dateTo}T23:59:59.999Z`)));
  }

  if (filters.q) {
    const pattern = `%${filters.q}%`;
    conditions.push(
      or(
        ilike(orders.orderNumber, pattern),
        ilike(orders.contactEmail, pattern),
        ilike(orders.contactName, pattern),
        ilike(orders.contactPhone, pattern),
      )!,
    );
  }

  if (filters.onlyNew) {
    conditions.push(isNull(orders.adminSeenAt));
  }

  return conditions.length > 0 ? and(...conditions) : undefined;
}

/** Lists orders for the admin surface with optional status/search filters. */
export async function listAdminOrders(
  filters: AdminOrdersFilter,
): Promise<{ rows: AdminOrderListItem[]; total: number; pageSize: number }> {
  const where = buildOrderFilters(filters);
  const offset = (filters.page - 1) * PAGE_SIZE;

  const [rows, [totalRow]] = await Promise.all([
    getDb()
      .select({
        id: orders.id,
        orderNumber: orders.orderNumber,
        status: orders.status,
        paymentStatus: orders.paymentStatus,
        paymentMethod: payments.method,
        contactName: orders.contactName,
        contactEmail: orders.contactEmail,
        customerAdminComment: users.adminComment,
        totalAmount: orders.totalAmount,
        bonusRedeemedAmount: orders.bonusRedeemedAmount,
        bonusEarnedAmount: orders.bonusEarnedAmount,
        baseCurrency: orders.baseCurrency,
        placedAt: orders.placedAt,
        isArchived: orders.isArchived,
        isAdminNew: sql<boolean>`(${orders.adminSeenAt} IS NULL)`.mapWith(Boolean),
      })
      .from(orders)
      .leftJoin(users, eq(orders.userId, users.id))
      .leftJoin(
        payments,
        and(eq(payments.orderId, orders.id), eq(payments.attemptNumber, 1)),
      )
      .where(where)
      .orderBy(desc(orders.placedAt))
      .limit(PAGE_SIZE)
      .offset(offset),
    getDb().select({ value: count() }).from(orders).where(where),
  ]);

  return {
    rows,
    total: totalRow?.value ?? 0,
    pageSize: PAGE_SIZE,
  };
}

/**
 * Lists orders visible to a customer (profile surface): owned orders plus
 * group orders where they are an ACTIVE participant.
 * Same shape as admin list rows; amounts are viewer-scoped for group orders.
 */
export async function listCustomerOrders(
  userId: string,
  filters: AdminOrdersFilter,
): Promise<{ rows: CustomerOrderListItem[]; total: number; pageSize: number }> {
  const baseWhere = buildOrderFilters(filters);
  const visibility = customerVisibleOrdersWhere(userId);
  const where = baseWhere ? and(visibility, baseWhere) : visibility;
  const offset = (filters.page - 1) * PAGE_SIZE;

  const [rows, [totalRow]] = await Promise.all([
    getDb()
      .select({
        id: orders.id,
        orderNumber: orders.orderNumber,
        status: orders.status,
        paymentStatus: orders.paymentStatus,
        paymentMethod: payments.method,
        contactName: orders.contactName,
        contactEmail: orders.contactEmail,
        customerAdminComment: sql<string | null>`CAST(NULL AS text)`,
        /** Own group-order share when applicable; admin list keeps raw total. */
        totalAmount: customerFacingOrderAmountSql(userId),
        bonusRedeemedAmount: orders.bonusRedeemedAmount,
        /** Viewer's earn row when present; else order snapshot. */
        bonusEarnedAmount: customerFacingBonusEarnedSql(userId),
        baseCurrency: orders.baseCurrency,
        placedAt: orders.placedAt,
        isArchived: orders.isArchived,
        isAdminNew: sql<boolean>`false`.mapWith(Boolean),
        isGroup: sql<boolean>`(${orders.groupOrderId} is not null)`.mapWith(Boolean),
        itemCount: sql<number>`coalesce((
          select sum(${orderItems.quantity})
          from ${orderItems}
          where ${orderItems.orderId} = ${orders.id}
        ), 0)`.mapWith(Number),
        customerReviewRating: orders.customerReviewRating,
      })
      .from(orders)
      .leftJoin(
        payments,
        and(eq(payments.orderId, orders.id), eq(payments.attemptNumber, 1)),
      )
      .where(where)
      .orderBy(desc(orders.placedAt))
      .limit(PAGE_SIZE)
      .offset(offset),
    getDb().select({ value: count() }).from(orders).where(where),
  ]);

  return {
    rows,
    total: totalRow?.value ?? 0,
    pageSize: PAGE_SIZE,
  };
}

const UNSEEN_ALERT_LIMIT = 5;
const UNSEEN_IDS_LIMIT = 200;

/** Counts and lists orders that admins have not opened yet (active only). */
export async function getAdminUnseenOrdersSnapshot(): Promise<AdminUnseenOrdersSnapshot> {
  const unseenWhere = and(eq(orders.isArchived, false), isNull(orders.adminSeenAt));

  const [[countRow], idRows, latest] = await Promise.all([
    getDb().select({ value: count() }).from(orders).where(unseenWhere),
    getDb()
      .select({ id: orders.id })
      .from(orders)
      .where(unseenWhere)
      .orderBy(desc(orders.placedAt))
      .limit(UNSEEN_IDS_LIMIT),
    getDb()
      .select({
        id: orders.id,
        orderNumber: orders.orderNumber,
        contactName: orders.contactName,
        totalAmount: orders.totalAmount,
        baseCurrency: orders.baseCurrency,
        paymentMethod: payments.method,
        placedAt: orders.placedAt,
      })
      .from(orders)
      .leftJoin(
        payments,
        and(eq(payments.orderId, orders.id), eq(payments.attemptNumber, 1)),
      )
      .where(unseenWhere)
      .orderBy(desc(orders.placedAt))
      .limit(UNSEEN_ALERT_LIMIT),
  ]);

  return {
    count: countRow?.value ?? 0,
    unseenIds: idRows.map((row) => row.id),
    latest,
  };
}

/** Marks an order as seen by admin when the details drawer is opened. */
export async function markOrderAdminSeen(orderNumber: string): Promise<boolean> {
  const trimmed = orderNumber.trim();
  if (!trimmed) return false;

  const updated = await getDb()
    .update(orders)
    .set({ adminSeenAt: new Date(), updatedAt: new Date() })
    .where(and(eq(orders.orderNumber, trimmed), isNull(orders.adminSeenAt)))
    .returning({ id: orders.id });

  return updated.length > 0;
}

/** Loads a single order with line items and immutable event history. */
export async function getAdminOrderByNumber(orderNumber: string): Promise<AdminOrderDetail | null> {
  const [order] = await getDb()
    .select()
    .from(orders)
    .where(eq(orders.orderNumber, orderNumber))
    .limit(1);

  if (!order) {
    return null;
  }

  const [items, events, paymentRows] = await Promise.all([
    getDb().select().from(orderItems).where(eq(orderItems.orderId, order.id)),
    getDb()
      .select()
      .from(orderEvents)
      .where(eq(orderEvents.orderId, order.id))
      .orderBy(desc(orderEvents.createdAt)),
    getDb()
      .select()
      .from(payments)
      .where(eq(payments.orderId, order.id))
      .orderBy(desc(payments.attemptNumber)),
  ]);

  const itemIds = items.map((item) => item.id);
  const modifierRows =
    itemIds.length === 0
      ? []
      : await getDb()
          .select({
            id: orderItemModifiers.id,
            orderItemId: orderItemModifiers.orderItemId,
            kind: orderItemModifiers.kind,
            name: orderItemModifiers.nameSnapshot,
            unitPriceAmount: orderItemModifiers.unitPriceAmount,
          })
          .from(orderItemModifiers)
          .where(inArray(orderItemModifiers.orderItemId, itemIds));

  const modifiersByItem = new Map<string, OrderItemModifierSnapshot[]>();
  for (const row of modifierRows) {
    const entry = modifiersByItem.get(row.orderItemId) ?? [];
    entry.push({
      id: row.id,
      kind: row.kind,
      name: row.name,
      unitPriceAmount: row.unitPriceAmount,
    });
    modifiersByItem.set(row.orderItemId, entry);
  }

  return {
    order,
    items: items.map((item) => ({
      ...item,
      modifiers: modifiersByItem.get(item.id) ?? [],
    })),
    events,
    payments: paymentRows,
  };
}

export type DashboardMetrics = {
  users: number;
  products: number;
  orders: number;
  revenueAmount: number;
  previousRevenueAmount: number;
  recentOrders: AdminOrderListItem[];
  topProducts: Array<{ productId: string; title: string; quantity: number }>;
  from: string;
  to: string;
  previousFrom: string;
  previousTo: string;
};

function periodBounds(
  from: string,
  to: string,
): {
  start: Date;
  end: Date;
  previousStart: Date;
  previousEnd: Date;
  previousFrom: string;
  previousTo: string;
} {
  const start = new Date(`${from}T00:00:00.000Z`);
  const end = new Date(`${to}T23:59:59.999Z`);
  const durationMs = Math.max(end.getTime() - start.getTime(), 24 * 60 * 60 * 1000 - 1);
  const previousEnd = new Date(start.getTime() - 1);
  const previousStart = new Date(previousEnd.getTime() - durationMs);

  return {
    start,
    end,
    previousStart,
    previousEnd,
    previousFrom: previousStart.toISOString().slice(0, 10),
    previousTo: previousEnd.toISOString().slice(0, 10),
  };
}

/** Admin dashboard cards with previous-period revenue comparison. */
export async function getAdminDashboardMetrics(input: {
  from: string;
  to: string;
}): Promise<DashboardMetrics> {
  const revenue = await getStoreRevenue();
  const bounds = periodBounds(input.from, input.to);
  const revenueStatuses = revenue.statuses as OrderStatus[];

  const [
    [usersRow],
    [productsRow],
    [ordersRow],
    [revenueRow],
    [previousRevenueRow],
    recentOrders,
    topProductRows,
  ] = await Promise.all([
    getDb().select({ value: count() }).from(users),
    getDb().select({ value: count() }).from(products).where(eq(products.status, 'ACTIVE')),
    getDb()
      .select({ value: count() })
      .from(orders)
      .where(
        and(
          eq(orders.isArchived, false),
          gte(orders.placedAt, bounds.start),
          lte(orders.placedAt, bounds.end),
        ),
      ),
    getDb()
      .select({
        value: sql<number>`coalesce(sum(${orders.totalAmount}), 0)`.mapWith(Number),
      })
      .from(orders)
      .where(
        and(
          eq(orders.isArchived, false),
          gte(orders.placedAt, bounds.start),
          lte(orders.placedAt, bounds.end),
          inArray(orders.status, revenueStatuses),
        ),
      ),
    getDb()
      .select({
        value: sql<number>`coalesce(sum(${orders.totalAmount}), 0)`.mapWith(Number),
      })
      .from(orders)
      .where(
        and(
          eq(orders.isArchived, false),
          gte(orders.placedAt, bounds.previousStart),
          lte(orders.placedAt, bounds.previousEnd),
          inArray(orders.status, revenueStatuses),
        ),
      ),
    getDb()
      .select({
        id: orders.id,
        orderNumber: orders.orderNumber,
        status: orders.status,
        paymentStatus: orders.paymentStatus,
        paymentMethod: payments.method,
        contactName: orders.contactName,
        contactEmail: orders.contactEmail,
        customerAdminComment: users.adminComment,
        totalAmount: orders.totalAmount,
        bonusRedeemedAmount: orders.bonusRedeemedAmount,
        bonusEarnedAmount: orders.bonusEarnedAmount,
        baseCurrency: orders.baseCurrency,
        placedAt: orders.placedAt,
        isArchived: orders.isArchived,
        isAdminNew: sql<boolean>`(${orders.adminSeenAt} IS NULL)`.mapWith(Boolean),
      })
      .from(orders)
      .leftJoin(users, eq(orders.userId, users.id))
      .leftJoin(
        payments,
        and(eq(payments.orderId, orders.id), eq(payments.attemptNumber, 1)),
      )
      .where(eq(orders.isArchived, false))
      .orderBy(desc(orders.placedAt))
      .limit(5),
    getDb()
      .select({
        productId: orderItems.productId,
        title: orderItems.productTitleSnapshot,
        quantity: sql<number>`coalesce(sum(${orderItems.quantity}), 0)`.mapWith(Number),
      })
      .from(orderItems)
      .innerJoin(orders, eq(orderItems.orderId, orders.id))
      .where(
        and(
          eq(orders.isArchived, false),
          gte(orders.placedAt, bounds.start),
          lte(orders.placedAt, bounds.end),
          inArray(orders.status, revenueStatuses),
        ),
      )
      .groupBy(orderItems.productId, orderItems.productTitleSnapshot)
      .orderBy(desc(sql`sum(${orderItems.quantity})`))
      .limit(5),
  ]);

  return {
    users: usersRow?.value ?? 0,
    products: productsRow?.value ?? 0,
    orders: ordersRow?.value ?? 0,
    revenueAmount: revenueRow?.value ?? 0,
    previousRevenueAmount: previousRevenueRow?.value ?? 0,
    recentOrders,
    topProducts: topProductRows.map((row) => ({
      productId: row.productId ?? `snapshot:${row.title}`,
      title: row.title,
      quantity: row.quantity,
    })),
    from: input.from,
    to: input.to,
    previousFrom: bounds.previousFrom,
    previousTo: bounds.previousTo,
  };
}
