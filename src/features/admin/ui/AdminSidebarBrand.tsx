'use client';

import Link from 'next/link';

import { AdminBrandLogo } from '@/features/admin/ui/AdminBrandLogo';
import { useAdminSidebarCollapse } from '@/features/admin/ui/AdminSidebarCollapseContext';
import type { Dictionary } from '@/lib/i18n/get-dictionary';

type AdminSidebarBrandProps = {
  locale: string;
  shell: Dictionary['admin']['shell'];
};

export function AdminSidebarBrand({ locale, shell }: AdminSidebarBrandProps) {
  const { collapsed, toggleCollapsed } = useAdminSidebarCollapse();

  return (
    <div
      className={`relative z-10 flex shrink-0 border-b border-white/15 bg-black/20 pb-3 pt-2 backdrop-blur-md ${
        collapsed ? 'flex-col items-center gap-2 px-1' : 'items-center justify-start pl-3 pr-12'
      }`}
    >
      {collapsed ? (
        <Link
          href={`/${locale}`}
          className="flex h-9 w-10 items-center justify-center"
          title={shell.brandHomeTitle}
        >
          <AdminBrandLogo alt={shell.brandName} size="collapsed" />
        </Link>
      ) : (
        <Link
          href={`/${locale}`}
          className="flex items-center justify-start py-1"
          title={shell.brandHomeTitle}
        >
          <AdminBrandLogo alt={shell.brandName} size="sidebar" />
        </Link>
      )}
      <button
        type="button"
        onClick={toggleCollapsed}
        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-white/20 text-white/80 transition-colors hover:border-white/40 hover:bg-white/10 hover:text-white ${
          collapsed ? '' : 'absolute right-2 top-1/2 -translate-y-1/2'
        }`}
        aria-expanded={!collapsed}
        aria-label={collapsed ? shell.expandSidebar : shell.collapseSidebar}
        title={collapsed ? shell.expandSidebar : shell.collapseSidebar}
      >
        {collapsed ? (
          <svg
            className="h-5 w-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
          </svg>
        ) : (
          <svg
            className="h-5 w-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        )}
      </button>
    </div>
  );
}
