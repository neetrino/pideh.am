'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { usePathname } from 'next/navigation';

import {
  getAdminMenuItems,
  isAdminTabActive,
  type AdminMenuItem,
} from '@/features/admin/ui/admin-menu.config';
import { AdminBrandLogo } from '@/features/admin/ui/AdminBrandLogo';
import { AdminMenuDrawer } from '@/features/admin/ui/AdminMenuDrawer';
import { AdminNavBadge } from '@/features/admin/ui/AdminNavBadge';
import { AdminSidebarBackdrop } from '@/features/admin/ui/AdminSidebarBackdrop';
import { AdminSidebarBrand } from '@/features/admin/ui/AdminSidebarBrand';
import { useAdminSidebarCollapse } from '@/features/admin/ui/AdminSidebarCollapseContext';
import {
  ADMIN_SIDEBAR_ASIDE,
  ADMIN_SIDEBAR_MOBILE_DRAWER_WRAP,
  ADMIN_SIDEBAR_NAV,
} from '@/features/admin/ui/admin-shell-classes';
import { useAdminProductsSubnavExpanded } from '@/features/admin/ui/useAdminProductsSubnavExpanded';
import { useAdminOrderAlertsOptional } from '@/features/orders/ui/AdminOrderAlertsProvider';
import type { Dictionary } from '@/lib/i18n/get-dictionary';

type AdminSidebarProps = {
  locale: string;
  shell: Dictionary['admin']['shell'];
  nav: Dictionary['admin']['nav'];
};

function isNestedVisible(
  tab: AdminMenuItem,
  pathname: string,
  locale: string,
  collapsed: boolean,
  productsNestedExpanded: boolean,
): boolean {
  if (tab.parentGroupId !== 'products') return true;
  if (collapsed) return true;
  if (isAdminTabActive(tab.href, pathname, locale)) return true;
  return productsNestedExpanded;
}

export function AdminSidebar({ locale, shell, nav }: AdminSidebarProps) {
  const pathname = usePathname() ?? `/${locale}/admin`;
  const tabs = getAdminMenuItems(locale, nav);
  const { collapsed } = useAdminSidebarCollapse();
  const [productsNestedExpanded, toggleProductsNested] = useAdminProductsSubnavExpanded(
    pathname,
    locale,
  );
  const alerts = useAdminOrderAlertsOptional();
  const unseenCount = alerts?.unseenCount ?? 0;
  const navRef = useRef<HTMLElement>(null);
  const [indicator, setIndicator] = useState<{ top: number; height: number } | null>(null);

  useEffect(() => {
    function measure(): void {
      const nav = navRef.current;
      const active = nav?.querySelector<HTMLElement>('[data-nav-active="true"]');
      if (!nav || !active) {
        setIndicator(null);
        return;
      }
      const navBox = nav.getBoundingClientRect();
      const itemBox = active.getBoundingClientRect();
      setIndicator({
        top: itemBox.top - navBox.top + nav.scrollTop,
        height: itemBox.height,
      });
    }

    measure();
    window.addEventListener('resize', measure);
    return () => window.removeEventListener('resize', measure);
  }, [pathname, collapsed, productsNestedExpanded, unseenCount]);

  const asideWidthClass = collapsed ? 'lg:w-16' : 'lg:w-64';

  return (
    <>
      <div className={ADMIN_SIDEBAR_MOBILE_DRAWER_WRAP}>
        <div className="flex items-center justify-between gap-3">
          <Link href={`/${locale}`} className="min-w-0 shrink" title={shell.brandHomeTitle}>
            <AdminBrandLogo alt={shell.brandName} size="mobile" />
          </Link>
          <AdminMenuDrawer locale={locale} pathname={pathname} shell={shell} nav={nav} />
        </div>
      </div>
      <aside className={`${ADMIN_SIDEBAR_ASIDE} ${asideWidthClass}`}>
        <AdminSidebarBackdrop />
        <div className="relative z-10 flex min-h-0 flex-1 flex-col">
          <AdminSidebarBrand locale={locale} shell={shell} />
          <nav
            ref={navRef}
            className={`${ADMIN_SIDEBAR_NAV} !space-y-0 gap-1 ${collapsed ? 'px-1' : 'px-2'}`}
          >
            {indicator ? (
              <span
                aria-hidden
                className={`pointer-events-none absolute top-0 rounded-full bg-[#ff6b00] shadow-[0_8px_24px_rgba(255,107,0,0.45)] transition-[transform,height] duration-300 ease-in-out motion-reduce:transition-none ${
                  collapsed ? 'right-1 left-1' : 'right-2 left-2'
                }`}
                style={{ height: indicator.height, transform: `translateY(${indicator.top}px)` }}
              />
            ) : null}
            {tabs.map((tab) => {
              if (!isNestedVisible(tab, pathname, locale, collapsed, productsNestedExpanded)) {
                return null;
              }

              const isActive = isAdminTabActive(tab.href, pathname, locale);
              const ordersBadge =
                tab.id === 'orders' ? (
                  <AdminNavBadge
                    count={unseenCount}
                    collapsed={collapsed}
                    ariaLabel={shell.newOrdersBadgeAria}
                  />
                ) : null;
              const rowClasses = `relative z-[1] flex w-full shrink-0 items-center rounded-full text-sm font-bold transition-colors ${
                collapsed ? 'justify-center px-0 py-3' : 'gap-3 px-4 py-3'
              } ${tab.isSubCategory && !collapsed ? 'pl-12' : ''} ${
                isActive
                  ? 'text-white'
                  : 'text-white/80 hover:bg-white/12 hover:text-white'
              }`;

              if (tab.id === 'products' && !collapsed) {
                return (
                  <div
                    key={tab.id}
                    data-nav-active={isActive ? 'true' : undefined}
                    className={`relative z-[1] flex w-full min-w-0 shrink-0 overflow-hidden rounded-full ${
                      isActive ? 'text-white' : 'bg-transparent'
                    }`}
                  >
                    <Link
                      href={tab.href}
                      title={tab.label}
                      className={`flex min-w-0 flex-1 items-center gap-3 px-4 py-3 text-left text-sm font-bold transition-all ${
                        isActive
                          ? 'text-white hover:bg-[#e85f00]'
                          : 'text-white/70 hover:bg-white/10 hover:text-white'
                      }`}
                    >
                      <span className={`shrink-0 ${isActive ? 'text-white' : 'text-white/45'}`}>
                        {tab.icon}
                      </span>
                      <span className="min-w-0 truncate">{tab.label}</span>
                    </Link>
                    <button
                      type="button"
                      aria-expanded={productsNestedExpanded}
                      aria-label={shell.toggleProductSubpages}
                      title={shell.toggleProductSubpages}
                      onClick={(event) => {
                        event.preventDefault();
                        toggleProductsNested();
                      }}
                      className={`shrink-0 border-l px-2 py-3 transition-colors ${
                        isActive
                          ? 'border-white/25 text-white hover:bg-white/10'
                          : 'border-white/10 text-white/60 hover:bg-white/10 hover:text-white'
                      }`}
                    >
                      <svg
                        className={`h-5 w-5 transition-transform ${productsNestedExpanded ? '' : '-rotate-90'}`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                        aria-hidden
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 9l-7 7-7-7"
                        />
                      </svg>
                    </button>
                  </div>
                );
              }

              return (
                <Link
                  key={tab.id}
                  href={tab.href}
                  title={tab.label}
                  data-nav-active={isActive ? 'true' : undefined}
                  className={rowClasses}
                >
                  <span className={`shrink-0 ${isActive ? 'text-white' : 'text-white/45'}`}>
                    {tab.icon}
                  </span>
                  {collapsed ? null : (
                    <>
                      <span className="min-w-0 flex-1 truncate">{tab.label}</span>
                      {ordersBadge}
                    </>
                  )}
                  {collapsed ? ordersBadge : null}
                </Link>
              );
            })}
          </nav>
        </div>
      </aside>
    </>
  );
}
