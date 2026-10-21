'use client';

import { useEffect, useRef, useState, type ReactNode } from 'react';
import { usePathname } from 'next/navigation';
import {
  Gift,
  LayoutDashboard,
  Lock,
  LogOut,
  MapPin,
  Package,
  Sparkles,
  Trash2,
  User,
} from 'lucide-react';

import { AppLink } from '@/components/ui/AppLink';
import type { Dictionary } from '@/lib/i18n/get-dictionary';
import type { Locale } from '@/lib/i18n/config';

type ProfileSidebarNavProps = {
  locale: Locale;
  dictionary: Dictionary['profile'];
  logoutAction: (formData: FormData) => void | Promise<void>;
};

type NavItem = {
  href: string;
  label: string;
  icon: ReactNode;
  exact?: boolean;
};

function navClassName(active: boolean): string {
  const base =
    'relative z-[1] flex w-full items-center gap-3 rounded-xl border-l-[3px] border-transparent px-3 py-2 text-left text-sm font-medium transition-colors';
  return active
    ? `${base} text-[#1e1e1e]`
    : `${base} text-[#1e1e1e]/65 hover:bg-white/70 hover:text-[#1e1e1e]`;
}

export function ProfileSidebarNav({ locale, dictionary, logoutAction }: ProfileSidebarNavProps) {
  const pathname = usePathname();
  const navRef = useRef<HTMLElement>(null);
  const [indicator, setIndicator] = useState<{ top: number; height: number } | null>(null);

  useEffect(() => {
    const nav = navRef.current;
    if (!nav) return;

    function measure(): void {
      const current = navRef.current;
      const active = current?.querySelector<HTMLElement>('[aria-current="page"]');
      if (!current || !active) {
        setIndicator(null);
        return;
      }
      const navBox = current.getBoundingClientRect();
      const itemBox = active.getBoundingClientRect();
      setIndicator({
        top: itemBox.top - navBox.top + current.scrollTop,
        height: itemBox.height,
      });
    }

    measure();
    window.addEventListener('resize', measure);
    return () => window.removeEventListener('resize', measure);
  }, [pathname]);

  const items: NavItem[] = [
    {
      href: `/${locale}/profile`,
      label: dictionary.dashboard,
      icon: <LayoutDashboard className="h-4 w-4" />,
      exact: true,
    },
    {
      href: `/${locale}/profile/orders`,
      label: dictionary.orders,
      icon: <Package className="h-4 w-4" />,
    },
    {
      href: `/${locale}/profile/bonuses`,
      label: dictionary.bonuses,
      icon: <Sparkles className="h-4 w-4" />,
    },
    {
      href: `/${locale}/profile/gift-cards`,
      label: dictionary.giftCards,
      icon: <Gift className="h-4 w-4" />,
    },
    {
      href: `/${locale}/profile/personal-information`,
      label: dictionary.personal,
      icon: <User className="h-4 w-4" />,
    },
    {
      href: `/${locale}/profile/addresses`,
      label: dictionary.addresses,
      icon: <MapPin className="h-4 w-4" />,
    },
    {
      href: `/${locale}/profile/password`,
      label: dictionary.password,
      icon: <Lock className="h-4 w-4" />,
    },
    {
      href: `/${locale}/profile/delete-account`,
      label: dictionary.deleteAccount,
      icon: <Trash2 className="h-4 w-4" />,
    },
  ];

  return (
    <div className="flex min-h-0 flex-1 flex-col p-2 pb-1 sm:p-3 sm:pb-1.5">
      <nav
        ref={navRef}
        className="profile-sidebar-scroll relative flex min-h-0 flex-1 flex-col gap-0.5 overflow-y-auto overscroll-contain"
        aria-label={dictionary.title}
      >
        {indicator ? (
          <span
            aria-hidden
            className="pointer-events-none absolute right-0 left-0 rounded-xl border-l-[3px] border-[#ff6b00] bg-white shadow-sm transition-[transform,height] duration-300 ease-in-out motion-reduce:transition-none"
            style={{ height: indicator.height, transform: `translateY(${indicator.top}px)` }}
          />
        ) : null}
        {items.map((item) => {
          const active = item.exact
            ? pathname === item.href
            : pathname === item.href || pathname.startsWith(`${item.href}/`);

          return (
            <AppLink
              key={item.href}
              href={item.href}
              prefetchPolicy="intent"
              className={navClassName(active)}
              aria-current={active ? 'page' : undefined}
            >
              <span
                className={`flex h-8 w-8 items-center justify-center rounded-lg transition-colors duration-300 ${
                  active
                    ? 'bg-[#ff6b00] text-white shadow-sm'
                    : 'bg-white text-[#ff6b00]'
                }`}
              >
                {item.icon}
              </span>
              <span>{item.label}</span>
            </AppLink>
          );
        })}
      </nav>

      <div className="mt-1 shrink-0 border-t border-[#ff6b00]/12 pt-1">
        <form action={logoutAction}>
          <button
            type="submit"
            className="flex w-full items-center gap-3 rounded-xl border-l-[3px] border-transparent px-3 py-1 text-left text-sm font-medium text-red-600 transition-colors hover:bg-red-50 hover:text-red-700"
          >
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-red-50 text-red-500">
              <LogOut className="h-4 w-4" />
            </span>
            {dictionary.logout}
          </button>
        </form>
      </div>
    </div>
  );
}
