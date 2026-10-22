'use client';

import type { ReactNode } from 'react';
import { usePathname } from 'next/navigation';
import {
  ChevronRight,
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
import { logoutAction } from '@/features/auth/logout-action';
import type { Dictionary } from '@/lib/i18n/get-dictionary';
import type { Locale } from '@/lib/i18n/config';
import type { SessionUser } from '@/lib/auth/session';

type ProfileMobileHubProps = {
  locale: Locale;
  user: SessionUser;
  dictionary: Dictionary['profile'];
  bonusAmount: string;
  /** Opens the dashboard sheet while already on the profile hub route. */
  onOpenDashboard: () => void;
};

type MenuItem = {
  href: string;
  label: string;
  icon: ReactNode;
  exact?: boolean;
  danger?: boolean;
};

const ROW_CLASS =
  'flex w-full items-center justify-between px-4 py-3.5 text-left transition-colors hover:bg-[#fff8e7]';

/**
 * Mobile profile hub. Visual language matches the desktop profile sidebar.
 */
export function ProfileMobileHub({
  locale,
  user,
  dictionary,
  bonusAmount,
  onOpenDashboard,
}: ProfileMobileHubProps) {
  const pathname = usePathname() ?? '';
  const logoutWithLocale = logoutAction.bind(null, locale);
  const displayName = `${user.firstName} ${user.lastName}`.trim();
  const hubHref = `/${locale}/profile`;
  const items = buildMenuItems(locale, hubHref, dictionary);
  const mainItems = items.filter((item) => !item.danger);
  const dangerItem = items.find((item) => item.danger);

  function isActive(item: MenuItem): boolean {
    if (item.exact) {
      return pathname === item.href || pathname === `${item.href}/`;
    }
    return pathname === item.href || pathname.startsWith(`${item.href}/`);
  }

  return (
    <div className="mx-auto flex w-full max-w-md flex-col gap-4">
      <ProfileHubHeader user={user} displayName={displayName} label={dictionary.title} />
      <AppLink
        href={`/${locale}/profile/bonuses`}
        prefetchPolicy="intent"
        className="flex items-center gap-3 rounded-[22px] border border-[#ff6b00]/15 bg-white px-4 py-3.5"
      >
        <img
          src="/brand/pideh/piggy-points.svg"
          alt=""
          width={28}
          height={28}
          className="shrink-0"
        />
        <span className="min-w-0 flex-1 truncate text-sm font-bold tracking-wide text-[#1e1e1e] uppercase">
          {dictionary.accumulatedPoints}
        </span>
        <span className="shrink-0 text-sm font-bold text-[#1e1e1e]">{bonusAmount}</span>
        <ChevronRight className="size-[18px] shrink-0 text-[#1e1e1e]/35" aria-hidden />
      </AppLink>
      <nav
        className="overflow-hidden rounded-[26px] border border-[#ff6b00]/15 bg-white"
        aria-label={dictionary.title}
      >
        <div className="divide-y divide-[#ff6b00]/10">
          {mainItems.map((item) => renderRow(item, isActive(item), onOpenDashboard))}
        </div>
        {dangerItem ? renderRow(dangerItem, isActive(dangerItem), onOpenDashboard) : null}
      </nav>
      <form action={logoutWithLocale}>
        <button
          type="submit"
          className="flex w-full items-center justify-center gap-2.5 rounded-full bg-[#ff6b00] py-3.5 text-base font-bold text-white transition hover:bg-[#e85f00]"
        >
          <LogOut className="h-5 w-5 shrink-0" aria-hidden />
          {dictionary.logout}
        </button>
      </form>
    </div>
  );
}

function ProfileHubHeader({
  user,
  displayName,
  label,
}: {
  user: SessionUser;
  displayName: string;
  label: string;
}): ReactNode {
  return (
    <section
      className="rounded-[26px] border border-[#ff6b00]/15 bg-[#fff8e7] px-4 py-4"
      aria-label={label}
    >
      <div className="flex items-center gap-3">
        <div className="flex size-14 shrink-0 items-center justify-center rounded-full bg-[#ff6b00] text-base font-bold text-white shadow-[0_0_0_3px_#fff8e7]">
          {user.firstName.slice(0, 1).toUpperCase()}
          {user.lastName.slice(0, 1).toUpperCase()}
        </div>
        <div className="min-w-0 flex-1">
          <p className="font-display truncate text-2xl leading-[0.9] text-[#1e1e1e] uppercase">
            {displayName}
          </p>
          <p className="mt-1 truncate text-xs font-medium text-[#1e1e1e]/60">{user.email}</p>
        </div>
      </div>
    </section>
  );
}

function buildMenuItems(
  locale: Locale,
  hubHref: string,
  dictionary: Dictionary['profile'],
): MenuItem[] {
  return [
    {
      href: hubHref,
      label: dictionary.dashboard,
      icon: <LayoutDashboard className="h-5 w-5" />,
      exact: true,
    },
    {
      href: `/${locale}/profile/orders`,
      label: dictionary.orders,
      icon: <Package className="h-5 w-5" />,
    },
    {
      href: `/${locale}/profile/gift-cards`,
      label: dictionary.giftCards,
      icon: <Gift className="h-5 w-5" />,
    },
    {
      href: `/${locale}/profile/personal-information`,
      label: dictionary.personal,
      icon: <User className="h-5 w-5" />,
    },
    {
      href: `/${locale}/profile/addresses`,
      label: dictionary.addresses,
      icon: <MapPin className="h-5 w-5" />,
    },
    {
      href: `/${locale}/profile/password`,
      label: dictionary.password,
      icon: <Lock className="h-5 w-5" />,
    },
    {
      href: `/${locale}/profile/delete-account`,
      label: dictionary.deleteAccount,
      icon: <Trash2 className="h-5 w-5" />,
      danger: true,
    },
  ];
}

function renderRow(item: MenuItem, active: boolean, onOpenDashboard: () => void): ReactNode {
  const content = <ProfileHubRowContent item={item} active={active} />;

  if (item.exact) {
    return (
      <button
        key={item.href}
        type="button"
        onClick={onOpenDashboard}
        aria-current={active ? 'page' : undefined}
        className={`${ROW_CLASS} ${active ? 'bg-[#fff8e7]' : ''}`}
      >
        {content}
      </button>
    );
  }

  if (item.danger) {
    return (
      <div key={item.href} className="p-3">
        <AppLink
          href={item.href}
          prefetchPolicy="intent"
          className="flex w-full items-center justify-between rounded-[22px] border border-red-200 bg-white px-3 py-3 text-left transition-colors hover:bg-red-50"
        >
          {content}
        </AppLink>
      </div>
    );
  }

  return (
    <AppLink
      key={item.href}
      href={item.href}
      prefetchPolicy="intent"
      aria-current={active ? 'page' : undefined}
      className={`${ROW_CLASS} ${active ? 'bg-[#fff8e7]' : ''}`}
    >
      {content}
    </AppLink>
  );
}

function ProfileHubRowContent({ item, active }: { item: MenuItem; active: boolean }): ReactNode {
  const well = item.danger
    ? 'bg-red-50 text-red-500'
    : active
      ? 'bg-[#ff6b00] text-white'
      : 'bg-[#fff8e7] text-[#ff6b00]';

  return (
    <>
      <span className="flex min-w-0 items-center gap-3">
        <span className={`flex size-10 shrink-0 items-center justify-center rounded-xl ${well}`}>
          {item.icon}
        </span>
        <span
          className={`truncate text-sm font-bold ${item.danger ? 'text-red-600' : 'text-[#1e1e1e]'}`}
        >
          {item.label}
        </span>
      </span>
      <ChevronRight
        className={`size-[18px] shrink-0 ${item.danger ? 'text-red-400' : 'text-[#ff6b00]/45'}`}
        aria-hidden
      />
    </>
  );
}
