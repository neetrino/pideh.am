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

function ProfilePointsIcon(): ReactNode {
  return (
    <svg viewBox="0 0 36 36" className="h-4 w-4" aria-hidden>
      <path
        fill="currentColor"
        d="M35.8425 12.9375C35.7126 12.5065 35.4811 12.113 35.1675 11.79C34.9284 11.5315 34.6211 11.3459 34.281 11.2545C34.4475 11.5177 34.5982 11.8215 34.7107 12.1455C34.8382 12.477 34.9155 12.8272 34.9425 13.1962C34.9801 13.5131 34.9801 13.8334 34.9425 14.1503C34.8725 13.9153 34.7646 13.6934 34.623 13.4933C34.3438 13.1172 33.9716 12.8202 33.543 12.6315C33.0676 12.4185 32.5304 12.3885 32.0343 12.5471C31.5381 12.7057 31.1179 13.0418 30.8542 13.491C30.7417 13.6755 30.6517 13.875 30.5842 14.0895C27.9247 9.6615 23.139 6.72975 17.667 6.72975C17.388 6.72975 17.1112 6.73725 16.8367 6.75225C15.1391 6.75493 13.4499 6.99192 11.817 7.4565C11.6775 6.48 10.395 4.5 4.5 4.5L6.3 10.1475C5.16787 11.0622 4.21634 12.18 3.49425 13.4437L0 13.5C0 13.5 -0.3825 22.5 2.25 22.5H3.465C4.29339 23.9012 5.39985 25.1179 6.71625 26.0752L6.75 31.4977H9.18C12.1275 31.4977 13.5 31.4977 13.5 29.8102V28.9328C15.7697 29.351 18.0973 29.3449 20.3647 28.9147L20.25 29.8102C20.25 31.4977 21.645 31.4977 24.615 31.4977H27V26.1203C29.1084 24.6561 30.6263 22.4888 31.2817 20.007C31.41 19.9462 31.5382 19.953 31.6687 19.953C31.7992 19.953 31.9275 19.9462 32.0557 19.9305C32.6205 19.827 33.1357 19.6065 33.5835 19.2937C34.1886 18.8656 34.6518 18.2661 34.9132 17.5725C34.9762 17.3625 35.0235 17.1435 35.055 16.9155L35.0572 16.893C35.5545 16.3035 35.8942 15.5655 36 14.7533C36.0899 14.1325 36.0345 13.4994 35.838 12.9038L35.8425 12.9375ZM7.8975 12.9375C8.34505 12.9375 8.77427 13.1153 9.09074 13.4318C9.40721 13.7482 9.585 14.1774 9.585 14.625C9.585 15.0726 9.40721 15.5018 9.09074 15.8182C8.77427 16.1347 8.34505 16.3125 7.8975 16.3125C7.44995 16.3125 7.02072 16.1347 6.70426 15.8182C6.38779 15.5018 6.21 15.0726 6.21 14.625C6.21 14.1774 6.38779 13.7482 6.70426 13.4318C7.02072 13.1153 7.44995 12.9375 7.8975 12.9375ZM13.23 11.25C12.9759 11.3324 12.7008 11.3218 12.4539 11.22C12.207 11.1181 12.0044 10.9318 11.8822 10.6942C11.844 10.5762 11.8312 10.4514 11.8447 10.328C11.8582 10.2046 11.8978 10.0855 11.9607 9.97858C12.0236 9.87163 12.1086 9.77923 12.2098 9.70751C12.3111 9.63579 12.4265 9.58636 12.5482 9.5625C14.028 9.20708 15.5469 9.04075 17.0685 9.0675L17.2957 9.06525C18.8107 9.06825 20.2725 9.24225 21.681 9.58725C21.9645 9.64125 22.2705 9.99675 22.2705 10.4242C22.2698 10.5151 22.2554 10.6054 22.2277 10.692C22.1494 10.8382 22.0384 10.9644 21.9034 11.0608C21.7684 11.1571 21.613 11.2211 21.4492 11.2478H21.105C19.848 10.9451 18.5594 10.794 17.2665 10.7977H17.0662C15.705 10.7977 14.382 10.962 13.1152 11.2725L13.23 11.25ZM32.805 17.8425C32.5 18.0609 32.1529 18.2134 31.7857 18.2902L31.5 18.315V17.3025C31.8712 17.5837 32.3415 17.7525 32.85 17.7525H32.8972L32.805 17.8425ZM32.985 16.3125C32.7758 16.3418 32.5628 16.3035 32.377 16.2031C32.1912 16.1027 32.0424 15.9455 31.9522 15.7545C31.8478 15.5584 31.7934 15.3396 31.7938 15.1175C31.7942 14.8953 31.8494 14.6767 31.9545 14.481C32.0608 14.3321 32.2184 14.2278 32.3969 14.1879C32.5755 14.148 32.7624 14.1755 32.922 14.265C33.1259 14.3433 33.3012 14.4815 33.425 14.6614C33.5487 14.8414 33.6149 15.0546 33.615 15.273C33.6581 15.5851 33.6574 15.9039 33.6127 16.2157C33.4037 16.2553 33.1909 16.2719 32.9782 16.2653L32.985 16.3125Z"
      />
    </svg>
  );
}

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
      label: dictionary.accumulatedPoints,
      icon: <ProfilePointsIcon />,
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
