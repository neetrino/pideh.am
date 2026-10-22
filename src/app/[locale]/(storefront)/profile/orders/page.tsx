import { notFound } from 'next/navigation';

import { AppLink } from '@/components/ui/AppLink';
import { listCustomerOrders } from '@/features/orders/application/queries';
import { parseAdminOrderListKind } from '@/features/orders/domain/admin-order-list-kind';
import { adminOrdersFilterSchema } from '@/features/orders/schemas/change-status';
import { CustomerOrdersView } from '@/features/orders/ui/CustomerOrdersView';
import { ProfilePageHeading } from '@/features/profile/ui/ProfilePageHeading';
import { requireUser } from '@/lib/auth/policies';
import { isLocale } from '@/lib/i18n/config';
import { getDictionary } from '@/lib/i18n/get-dictionary';

type OrdersPageProps = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function firstParam(value: string | string[] | undefined): string | undefined {
  if (Array.isArray(value)) {
    return value[0];
  }
  return value;
}

function buildOrdersQuery(kind: 'all' | 'individual' | 'group', page: number): string {
  const params = new URLSearchParams();
  if (kind !== 'all') params.set('kind', kind);
  if (page > 1) params.set('page', String(page));
  const query = params.toString();
  return query ? `?${query}` : '';
}

export default async function OrdersPage({ params, searchParams }: OrdersPageProps) {
  const { locale } = await params;
  if (!isLocale(locale)) {
    notFound();
  }

  const user = await requireUser(locale);
  const dictionary = getDictionary(locale);

  const raw = await searchParams;
  const kind = parseAdminOrderListKind(firstParam(raw.kind));
  const parsed = adminOrdersFilterSchema.safeParse({
    archived: 'active',
    kind,
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
        onlyNew: false,
        kind: 'all' as const,
      };

  const { rows, total, pageSize } = await listCustomerOrders(user.id, filters);
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return (
    <section className="profile-sheet-keep-frame space-y-6">
      <ProfilePageHeading
        eyebrow={dictionary.profile.loyaltyEyebrow}
        title={dictionary.profile.orders}
      />

      <OrderKindTabs
        locale={locale}
        kind={filters.kind ?? 'all'}
        ariaLabel={dictionary.profile.orderTabsAria}
        labels={{
          all: dictionary.profile.orderTabAll,
          individual: dictionary.profile.orderTabPersonal,
          group: dictionary.profile.orderTabGroup,
        }}
      />

      <CustomerOrdersView
        locale={locale}
        orders={rows}
        copy={dictionary.admin}
        labels={{
          orderNumber: dictionary.profile.orderNumber,
          noOrders: dictionary.profile.noOrders,
          orderPlaced: dictionary.profile.orderPlaced,
          orderItemsOne: dictionary.profile.orderItemsOne,
          orderItemsMany: dictionary.profile.orderItemsMany,
          rateOrder: dictionary.profile.rateOrder,
        }}
        initialOrderNumber={firstParam(raw.order)}
      />

      {totalPages > 1 ? (
        <nav className="flex items-center gap-3 text-sm font-medium text-[#1e1e1e]/70">
          {filters.page > 1 ? (
            <AppLink
              href={`/${locale}/profile/orders${buildOrdersQuery(filters.kind ?? 'all', filters.page - 1)}`}
              prefetchPolicy="intent"
              className="text-[#ff6b00] hover:underline"
            >
              {dictionary.profile.pagePrev}
            </AppLink>
          ) : null}
          <span>
            {dictionary.profile.pageOf
              .replace('{page}', String(filters.page))
              .replace('{total}', String(totalPages))}
          </span>
          {filters.page < totalPages ? (
            <AppLink
              href={`/${locale}/profile/orders${buildOrdersQuery(filters.kind ?? 'all', filters.page + 1)}`}
              prefetchPolicy="intent"
              className="text-[#ff6b00] hover:underline"
            >
              {dictionary.profile.pageNext}
            </AppLink>
          ) : null}
        </nav>
      ) : null}
    </section>
  );
}

function OrderKindTabs({
  locale,
  kind,
  ariaLabel,
  labels,
}: {
  locale: string;
  kind: 'all' | 'individual' | 'group';
  ariaLabel: string;
  labels: { all: string; individual: string; group: string };
}) {
  const tabs = [
    { id: 'all' as const, label: labels.all },
    { id: 'individual' as const, label: labels.individual },
    { id: 'group' as const, label: labels.group },
  ];

  return (
    <nav
      aria-label={ariaLabel}
      className="flex w-full items-center justify-between gap-1 rounded-full border border-[#1e1e1e]/10 bg-white p-1 md:w-fit md:justify-start"
    >
      {tabs.map((tab) => {
        const active = kind === tab.id;
        return (
          <AppLink
            key={tab.id}
            href={`/${locale}/profile/orders${buildOrdersQuery(tab.id, 1)}`}
            prefetchPolicy="intent"
            aria-current={active ? 'page' : undefined}
            className={`shrink-0 rounded-full px-4 py-2 text-center text-sm font-semibold whitespace-nowrap ${
              active
                ? 'border border-[#ff6b00] text-[#1e1e1e]'
                : 'border border-transparent text-[#1e1e1e]/45'
            }`}
          >
            {tab.label}
          </AppLink>
        );
      })}
    </nav>
  );
}
