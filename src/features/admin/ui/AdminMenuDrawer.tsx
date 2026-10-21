'use client';

import Link from 'next/link';
import { useState } from 'react';

import { SideSheet } from '@/components/ui/SideSheet';

import {
  getAdminMenuItems,
  isAdminTabActive,
  type AdminMenuItem,
} from '@/features/admin/ui/admin-menu.config';
import { AdminBrandLogo } from '@/features/admin/ui/AdminBrandLogo';
import { AdminNavBadge } from '@/features/admin/ui/AdminNavBadge';
import { AdminSidebarBackdrop } from '@/features/admin/ui/AdminSidebarBackdrop';
import { useAdminProductsSubnavExpanded } from '@/features/admin/ui/useAdminProductsSubnavExpanded';
import { useAdminOrderAlertsOptional } from '@/features/orders/ui/AdminOrderAlertsProvider';
import type { Dictionary } from '@/lib/i18n/get-dictionary';

type AdminMenuDrawerProps = {
  locale: string;
  pathname: string;
  shell: Dictionary['admin']['shell'];
  nav: Dictionary['admin']['nav'];
};

function isNestedVisible(
  tab: AdminMenuItem,
  pathname: string,
  locale: string,
  productsNestedExpanded: boolean,
): boolean {
  if (tab.parentGroupId !== 'products') return true;
  if (isAdminTabActive(tab.href, pathname, locale)) return true;
  return productsNestedExpanded;
}

export function AdminMenuDrawer({ locale, pathname, shell, nav }: AdminMenuDrawerProps) {
  const [open, setOpen] = useState(false);
  const tabs = getAdminMenuItems(locale, nav);
  const [productsNestedExpanded, toggleProductsNested] = useAdminProductsSubnavExpanded(
    pathname,
    locale,
  );
  const alerts = useAdminOrderAlertsOptional();
  const unseenCount = alerts?.unseenCount ?? 0;

  return (
    <div className="lg:hidden">
      <button
        type="button"
        aria-expanded={open}
        aria-controls="admin-menu-drawer-panel"
        onClick={() => setOpen((prev) => !prev)}
        className="inline-flex items-center gap-2 rounded-full border-2 border-[#1e1e1e] bg-[#ffd54a] px-4 py-2 text-sm font-extrabold uppercase tracking-wide text-[#1e1e1e] shadow-[2px_2px_0_#1e1e1e]"
      >
        <svg
          className="h-4 w-4"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M4 6H20M4 12H16M4 18H12" />
        </svg>
        {shell.menu}
      </button>

      <SideSheet
        open={open}
        onClose={() => setOpen(false)}
        ariaLabel={shell.adminMenuAria}
        side="left"
        variant="admin"
        panelInnerClassName="relative overflow-hidden rounded-r-[28px] border-r-2 border-[#1e1e1e] bg-[#140a04] text-white shadow-[-8px_0_24px_rgba(30,30,30,0.18)]"
      >
        <AdminSidebarBackdrop />
        <div id="admin-menu-drawer-panel" className="relative z-10 flex min-h-0 flex-1 flex-col">
          <div className="flex justify-start border-b border-white/10 px-4 py-4">
            <Link
              href={`/${locale}`}
              className="inline-flex items-center justify-start"
              title={shell.brandHomeTitle}
              onClick={() => setOpen(false)}
            >
              <AdminBrandLogo alt={shell.brandName} size="sidebar" />
            </Link>
          </div>

          <nav className="flex-1 divide-y divide-white/10 overflow-y-auto">
            {tabs.map((tab) => {
              if (!isNestedVisible(tab, pathname, locale, productsNestedExpanded)) {
                return null;
              }

              const isActive = isAdminTabActive(tab.href, pathname, locale);

              if (tab.id === 'products') {
                return (
                  <div
                    key={tab.id}
                    className={`flex w-full ${isActive ? 'bg-[#ff6b00] text-white' : ''}`}
                  >
                    <Link
                      href={tab.href}
                      onClick={() => setOpen(false)}
                      className={`flex min-w-0 flex-1 items-center gap-3 px-4 py-3 text-sm font-bold ${
                        isActive ? 'text-white' : 'text-white/70 hover:bg-white/10'
                      } ${tab.isSubCategory ? 'pl-10' : ''}`}
                    >
                      <span className="shrink-0">{tab.icon}</span>
                      <span className="truncate">{tab.label}</span>
                    </Link>
                    <button
                      type="button"
                      aria-expanded={productsNestedExpanded}
                      aria-label={shell.toggleProductSubpages}
                      onClick={toggleProductsNested}
                      className={`shrink-0 border-l px-3 py-3 ${
                        isActive ? 'border-white/25 text-white' : 'border-white/10 text-white/60'
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
                  onClick={() => setOpen(false)}
                  className={`flex items-center gap-3 px-4 py-3 text-sm font-bold ${
                    tab.isSubCategory ? 'pl-10' : ''
                  } ${isActive ? 'bg-[#ff6b00] text-white' : 'text-white/70 hover:bg-white/10'}`}
                >
                  <span className="shrink-0">{tab.icon}</span>
                  <span className="min-w-0 flex-1 truncate">{tab.label}</span>
                  {tab.id === 'orders' ? (
                    <AdminNavBadge count={unseenCount} ariaLabel={shell.newOrdersBadgeAria} />
                  ) : null}
                </Link>
              );
            })}
          </nav>
        </div>
      </SideSheet>
    </div>
  );
}
