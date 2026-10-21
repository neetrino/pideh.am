'use client';

import Link from 'next/link';
import { ClipboardList, Plus, Settings, UserRound, type LucideIcon } from 'lucide-react';

import { fadeUp } from '@/components/motion/presets';
import { StaggerGroup, StaggerItem } from '@/components/motion/StaggerGroup';
import {
  ADMIN_CARD,
  ADMIN_GHOST_LINK,
  ADMIN_SECTION_TITLE,
} from '@/features/admin/ui/admin-form-classes';
import { AdminPageHeading } from '@/features/admin/ui/AdminPageHeading';
import { DashboardStatsGrid } from '@/features/admin/ui/DashboardStatsGrid';
import { ADMIN_BADGE, paymentStatusBadgeClass } from '@/features/admin/ui/status-badge';
import {
  AdminOrderDetailsDrawerBind,
  useAdminOrderDetailsDrawer,
} from '@/features/orders/ui/useAdminOrderDetailsDrawer';
import type { Dictionary } from '@/lib/i18n/get-dictionary';

type RecentOrder = {
  id: string;
  orderNumber: string;
  status: string;
  contactEmail: string;
  totalAmount: number;
  baseCurrency: string;
};

type TopProduct = {
  productId: string;
  title: string;
  quantity: number;
};

type AdminDashboardProps = {
  locale: string;
  copy: Dictionary['admin'];
  dash: Dictionary['admin']['dashboard'];
  navTitle: string;
  users: number;
  products: number;
  orders: number;
  revenueAmount: number;
  revenueDelta: string;
  recentOrders: readonly RecentOrder[];
  topProducts: readonly TopProduct[];
};

function formatMoney(amount: number): string {
  return amount.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

const QUICK_ACTION_DEFS = [
  {
    href: 'products/new',
    titleKey: 'addProduct' as const,
    subtitleKey: 'addProductSubtitle' as const,
    icon: Plus,
  },
  {
    href: 'orders',
    titleKey: 'manageOrders' as const,
    subtitleKey: 'manageOrdersSubtitle' as const,
    icon: ClipboardList,
  },
  {
    href: 'users',
    titleKey: 'manageUsers' as const,
    subtitleKey: 'manageUsersSubtitle' as const,
    icon: UserRound,
  },
  {
    href: 'settings',
    titleKey: 'settings' as const,
    subtitleKey: 'settingsSubtitle' as const,
    icon: Settings,
  },
] as const satisfies ReadonlyArray<{
  href: string;
  titleKey: 'addProduct' | 'manageOrders' | 'manageUsers' | 'settings';
  subtitleKey: 'addProductSubtitle' | 'manageOrdersSubtitle' | 'manageUsersSubtitle' | 'settingsSubtitle';
  icon: LucideIcon;
}>;

export function AdminDashboard({
  locale,
  copy,
  dash,
  navTitle,
  users,
  products,
  orders,
  revenueAmount,
  revenueDelta,
  recentOrders,
  topProducts,
}: AdminDashboardProps) {
  const drawer = useAdminOrderDetailsDrawer(locale);

  return (
    <section>
      <AdminPageHeading className="mb-6" title={navTitle} description={dash.welcome} />

      <DashboardStatsGrid
        locale={locale}
        copy={dash.stats}
        users={users}
        products={products}
        orders={orders}
        revenueAmount={revenueAmount}
        revenueDelta={revenueDelta}
      />

      <div className="mb-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className={`${ADMIN_CARD} p-6`}>
          <div className="mb-4 flex items-center justify-between">
            <h2 className={ADMIN_SECTION_TITLE}>{dash.recentOrders}</h2>
            <Link href={`/${locale}/admin/orders`} className={ADMIN_GHOST_LINK}>
              {dash.viewAll}
            </Link>
          </div>
          <StaggerGroup className="space-y-3">
            {recentOrders.map((order) => (
              <StaggerItem key={order.id} variants={fadeUp}>
                <button
                  type="button"
                  onClick={() => drawer.openOrder(order.orderNumber)}
                  className="block w-full rounded-2xl border border-[#1e1e1e]/10 bg-[#fff8e7] p-4 text-left transition hover:bg-[#ffd54a]/40"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="mb-1 flex flex-wrap items-center gap-2">
                        <p className="text-sm font-bold text-[#1e1e1e]">#{order.orderNumber}</p>
                        <span className={`${ADMIN_BADGE} ${paymentStatusBadgeClass(order.status)}`}>
                          {order.status}
                        </span>
                      </div>
                      <p className="truncate text-xs text-[#1e1e1e]/55">{order.contactEmail}</p>
                    </div>
                    <p className="shrink-0 text-sm font-bold text-[#ff6b00]">
                      {formatMoney(order.totalAmount)} {order.baseCurrency}
                    </p>
                  </div>
                </button>
              </StaggerItem>
            ))}
          </StaggerGroup>
          {recentOrders.length === 0 ? (
            <p className="py-8 text-center text-sm text-[#1e1e1e]/55">{dash.noRecentOrders}</p>
          ) : null}
        </div>

        <div className={`${ADMIN_CARD} p-6`}>
          <div className="mb-4 flex items-center justify-between">
            <h2 className={ADMIN_SECTION_TITLE}>{dash.topProducts}</h2>
            <Link href={`/${locale}/admin/products`} className={ADMIN_GHOST_LINK}>
              {dash.viewAll}
            </Link>
          </div>
          <StaggerGroup className="space-y-3">
            {topProducts.map((product, index) => (
              <StaggerItem key={`${product.productId}:${index}`} variants={fadeUp}>
                <div className="flex items-center gap-4 rounded-2xl border border-[#1e1e1e]/10 bg-[#fff8e7] p-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#ff6b00] text-xs font-bold text-white">
                    {index + 1}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-bold text-[#1e1e1e]">{product.title}</p>
                    <p className="text-xs text-[#1e1e1e]/55">
                      {dash.soldCount.replace('{quantity}', String(product.quantity))}
                    </p>
                  </div>
                </div>
              </StaggerItem>
            ))}
          </StaggerGroup>
          {topProducts.length === 0 ? (
            <p className="py-8 text-center text-sm text-[#1e1e1e]/55">{dash.noProductSales}</p>
          ) : null}
        </div>
      </div>

      <div className={`${ADMIN_CARD} mb-8 p-6`}>
        <h2 className={`mb-4 ${ADMIN_SECTION_TITLE}`}>{dash.quickActions}</h2>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
          {QUICK_ACTION_DEFS.map((action) => (
            <Link
              key={action.href}
              href={`/${locale}/admin/${action.href}`}
              className="flex items-center gap-3 rounded-2xl border-2 border-[#1e1e1e] bg-[#fff8e7] px-4 py-4 transition hover:bg-[#ffd54a]"
            >
              <span
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#ff6b00] text-white"
                aria-hidden
              >
                <action.icon className="h-5 w-5" strokeWidth={2.25} />
              </span>
              <div className="text-left">
                <p className="font-bold text-[#1e1e1e]">{dash[action.titleKey]}</p>
                <p className="text-xs text-[#1e1e1e]/55">{dash[action.subtitleKey]}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>
      <AdminOrderDetailsDrawerBind state={drawer} copy={copy} />
    </section>
  );
}
