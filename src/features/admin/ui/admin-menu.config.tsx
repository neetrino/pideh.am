import type { ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';
import {
  ChartColumn,
  ClipboardList,
  Gift,
  Images,
  LayoutDashboard,
  Mail,
  Megaphone,
  Newspaper,
  Package,
  Percent,
  Settings,
  Star,
  Tags,
  TicketPercent,
  UserRound,
  UtensilsCrossed,
} from 'lucide-react';

import type { Dictionary } from '@/lib/i18n/get-dictionary';

export type AdminMenuItem = {
  id: string;
  label: string;
  href: string;
  icon: ReactNode;
  isSubCategory?: boolean;
  parentGroupId?: 'products';
};

function navIcon(Icon: LucideIcon): ReactNode {
  return <Icon className="h-5 w-5" strokeWidth={2} aria-hidden="true" />;
}

/** Admin nav for capabilities that exist in this project (no brands/attributes). */
export function getAdminMenuItems(
  locale: string,
  nav: Dictionary['admin']['nav'],
): AdminMenuItem[] {
  const base = `/${locale}/admin`;

  return [
    {
      id: 'dashboard',
      label: nav.dashboard,
      href: base,
      icon: navIcon(LayoutDashboard),
    },
    {
      id: 'orders',
      label: nav.orders,
      href: `${base}/orders`,
      icon: navIcon(ClipboardList),
    },
    {
      id: 'products',
      label: nav.products,
      href: `${base}/products`,
      icon: navIcon(UtensilsCrossed),
    },
    {
      id: 'categories',
      label: nav.categories,
      href: `${base}/categories`,
      isSubCategory: true,
      parentGroupId: 'products',
      icon: navIcon(Tags),
    },
    {
      id: 'reviews',
      label: nav.reviews,
      href: `${base}/reviews`,
      icon: navIcon(Star),
    },
    {
      id: 'delivery',
      label: nav.delivery,
      href: `${base}/delivery`,
      icon: navIcon(Package),
    },
    {
      id: 'discounts',
      label: nav.discounts,
      href: `${base}/discounts`,
      icon: navIcon(Percent),
    },
    {
      id: 'coupons',
      label: nav.coupons,
      href: `${base}/coupons`,
      icon: navIcon(TicketPercent),
    },
    {
      id: 'gift-cards',
      label: nav.giftCards,
      href: `${base}/gift-cards`,
      icon: navIcon(Gift),
    },
    {
      id: 'users',
      label: nav.users,
      href: `${base}/users`,
      icon: navIcon(UserRound),
    },
    {
      id: 'analytics',
      label: nav.analytics,
      href: `${base}/analytics`,
      icon: navIcon(ChartColumn),
    },
    {
      id: 'hero',
      label: nav.hero,
      href: `${base}/hero`,
      icon: navIcon(Images),
    },
    {
      id: 'popups',
      label: nav.popups,
      href: `${base}/popups`,
      icon: navIcon(Megaphone),
    },
    {
      id: 'blog',
      label: nav.blog,
      href: `${base}/blog`,
      icon: navIcon(Newspaper),
    },
    {
      id: 'messages',
      label: nav.messages,
      href: `${base}/messages`,
      icon: navIcon(Mail),
    },
    {
      id: 'settings',
      label: nav.settings,
      href: `${base}/settings`,
      icon: navIcon(Settings),
    },
  ];
}

export function isAdminTabActive(tabHref: string, pathname: string, locale: string): boolean {
  const dashboardHref = `/${locale}/admin`;
  if (tabHref === dashboardHref) {
    return pathname === dashboardHref || pathname === `${dashboardHref}/`;
  }
  return pathname === tabHref || pathname.startsWith(`${tabHref}/`);
}
