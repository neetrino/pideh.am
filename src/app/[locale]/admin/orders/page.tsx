import type { ReactNode } from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';

import { AdminPageHeading } from '@/features/admin/ui/AdminPageHeading';
import { listAdminGroupOrders } from '@/features/group-orders/application/queries';
import { adminGroupOrdersFilterSchema } from '@/features/group-orders/schemas';
import { AdminGroupOrdersFilters } from '@/features/group-orders/ui/AdminGroupOrdersFilters';
import { AdminGroupOrdersView } from '@/features/group-orders/ui/AdminGroupOrdersView';
import { listAdminOrders } from '@/features/orders/application/queries';
import {
  parseAdminOrderListKind,
  type AdminOrderListKind,
} from '@/features/orders/domain/admin-order-list-kind';
import type { OrderStatus } from '@/features/orders/domain/order-status';
import { adminOrdersFilterSchema } from '@/features/orders/schemas/change-status';
import { AdminOrdersFilters } from '@/features/orders/ui/AdminOrdersFilters';
import { AdminOrdersKindSwitcher } from '@/features/orders/ui/AdminOrdersKindSwitcher';
import { AdminOrdersNewSwitch } from '@/features/orders/ui/AdminOrdersNewSwitch';
import { AdminOrdersView } from '@/features/orders/ui/AdminOrdersView';
import { AdminPushToggle } from '@/features/orders/ui/AdminPushToggle';
import { isLocale, type Locale } from '@/lib/i18n/config';
import { getDictionary, type Dictionary } from '@/lib/i18n/get-dictionary';
import { getSelectedCurrency } from '@/lib/money/display-price';
import { getWebPushPublicKey } from '@/lib/push/web-push-sender';

type AdminOrdersPageProps = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

type SearchRecord = Record<string, string | string[] | undefined>;

function firstParam(value: string | string[] | undefined): string | undefined {
  if (Array.isArray(value)) {
    return value[0];
  }
  return value;
}

function buildCheckoutOrdersQuery(
  filters: {
    q?: string;
    status?: OrderStatus;
    paymentStatus?: string;
    kind: AdminOrderListKind;
    onlyNew?: boolean;
  },
  page: number,
): string {
  const params = new URLSearchParams();
  if (filters.q) params.set('q', filters.q);
  if (filters.status) params.set('status', filters.status);
  if (filters.paymentStatus) params.set('paymentStatus', filters.paymentStatus);
  if (filters.kind === 'individual') params.set('kind', 'individual');
  if (filters.onlyNew) params.set('new', '1');
  params.set('page', String(page));
  return params.toString();
}

function buildGroupOrdersQuery(
  filters: {
    q?: string;
    status?: string;
    paymentMode?: string;
  },
  page: number,
): string {
  const params = new URLSearchParams();
  params.set('kind', 'group');
  if (filters.q) params.set('q', filters.q);
  if (filters.status) params.set('status', filters.status);
  if (filters.paymentMode) params.set('paymentMode', filters.paymentMode);
  params.set('page', String(page));
  return params.toString();
}

function AdminOrdersPageShell({
  locale,
  kind,
  onlyNew,
  copy,
  children,
}: {
  locale: Locale;
  kind: AdminOrderListKind;
  onlyNew: boolean;
  copy: Dictionary['admin'];
  children: ReactNode;
}) {
  return (
    <section>
      <AdminPageHeading className="mb-6" title={copy.orders.title} />
      <div className="mb-6 flex flex-wrap items-center gap-3">
        <AdminOrdersKindSwitcher locale={locale} kind={kind} labels={copy.orders.kindSwitcher} />
        <AdminOrdersNewSwitch
          locale={locale}
          kind={kind}
          onlyNew={onlyNew}
          labels={copy.orders.newSwitch}
        />
        <AdminPushToggle
          locale={locale}
          publicKey={getWebPushPublicKey()}
          labels={copy.orders.pushToggle}
        />
      </div>
      {children}
    </section>
  );
}

function AdminListPagination({
  locale,
  page,
  totalPages,
  query,
  previousLabel,
  nextLabel,
  pageOf,
}: {
  locale: Locale;
  page: number;
  totalPages: number;
  query: (page: number) => string;
  previousLabel: string;
  nextLabel: string;
  pageOf: string;
}) {
  if (totalPages <= 1) return null;

  return (
    <nav className="mt-4 flex items-center gap-3 text-sm text-gray-700">
      {page > 1 ? (
        <Link
          href={`/${locale}/admin/orders?${query(page - 1)}`}
          className="font-medium hover:underline"
        >
          {previousLabel}
        </Link>
      ) : null}
      <span>
        {pageOf.replace('{page}', String(page)).replace('{totalPages}', String(totalPages))}
      </span>
      {page < totalPages ? (
        <Link
          href={`/${locale}/admin/orders?${query(page + 1)}`}
          className="font-medium hover:underline"
        >
          {nextLabel}
        </Link>
      ) : null}
    </nav>
  );
}

async function AdminGroupOrdersSection({
  locale,
  raw,
  copy,
}: {
  locale: Locale;
  raw: SearchRecord;
  copy: Dictionary['admin'];
}) {
  const parsed = adminGroupOrdersFilterSchema.safeParse({
    status: firstParam(raw.status) || undefined,
    paymentMode: firstParam(raw.paymentMode) || undefined,
    q: firstParam(raw.q) || undefined,
    page: firstParam(raw.page) ?? '1',
  });
  const filters = parsed.success
    ? parsed.data
    : { page: 1 as const, status: undefined, paymentMode: undefined, q: undefined };
  const currency = await getSelectedCurrency();
  const { rows, total, pageSize } = await listAdminGroupOrders(filters);
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return (
    <>
      <AdminGroupOrdersFilters
        total={total}
        status={filters.status}
        paymentMode={filters.paymentMode}
        q={filters.q}
        copy={copy.groupOrders}
      />
      <AdminGroupOrdersView
        locale={locale}
        currency={currency}
        rows={rows}
        copy={copy.groupOrders}
        adminCopy={copy}
      />
      <AdminListPagination
        locale={locale}
        page={filters.page}
        totalPages={totalPages}
        query={(page) => buildGroupOrdersQuery(filters, page)}
        previousLabel={copy.common.previous}
        nextLabel={copy.common.next}
        pageOf={copy.common.pageOf}
      />
    </>
  );
}

async function AdminCheckoutOrdersSection({
  locale,
  kind,
  raw,
  copy,
}: {
  locale: Locale;
  kind: Exclude<AdminOrderListKind, 'group'>;
  raw: SearchRecord;
  copy: Dictionary['admin'];
}) {
  const parsed = adminOrdersFilterSchema.safeParse({
    status: firstParam(raw.status) || undefined,
    paymentStatus: firstParam(raw.paymentStatus) || undefined,
    archived: 'active',
    q: firstParam(raw.q) || undefined,
    kind,
    onlyNew: firstParam(raw.new) || undefined,
    page: firstParam(raw.page) ?? '1',
  });
  const filters = parsed.success
    ? parsed.data
    : {
        page: 1 as const,
        archived: 'active' as const,
        status: undefined,
        paymentStatus: undefined,
        dateFrom: undefined,
        dateTo: undefined,
        q: undefined,
        kind,
        onlyNew: false,
      };
  const { rows, total, pageSize } = await listAdminOrders(filters);
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return (
    <>
      <AdminOrdersFilters
        total={total}
        status={filters.status}
        paymentStatus={filters.paymentStatus}
        q={filters.q}
        kind={kind}
        onlyNew={Boolean(filters.onlyNew)}
        copy={copy}
      />
      <AdminOrdersView locale={locale} orders={rows} copy={copy} />
      <AdminListPagination
        locale={locale}
        page={filters.page}
        totalPages={totalPages}
        query={(page) =>
          buildCheckoutOrdersQuery(
            { ...filters, kind, onlyNew: Boolean(filters.onlyNew) },
            page,
          )
        }
        previousLabel={copy.common.previous}
        nextLabel={copy.common.next}
        pageOf={copy.common.pageOf}
      />
    </>
  );
}

export default async function AdminOrdersPage({ params, searchParams }: AdminOrdersPageProps) {
  const { locale: rawLocale } = await params;
  if (!isLocale(rawLocale)) {
    notFound();
  }
  const locale = rawLocale;

  const copy = getDictionary(locale).admin;
  const raw = await searchParams;
  const kind = parseAdminOrderListKind(firstParam(raw.kind));
  const onlyNew =
    firstParam(raw.new) === '1' || firstParam(raw.new) === 'true';

  return (
    <AdminOrdersPageShell locale={locale} kind={kind} onlyNew={onlyNew} copy={copy}>
      {kind === 'group' ? (
        <AdminGroupOrdersSection locale={locale} raw={raw} copy={copy} />
      ) : (
        <AdminCheckoutOrdersSection locale={locale} kind={kind} raw={raw} copy={copy} />
      )}
    </AdminOrdersPageShell>
  );
}
