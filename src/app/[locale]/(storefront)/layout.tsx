import { cookies } from 'next/headers';
import { notFound } from 'next/navigation';

import { MobileBottomNavIsland } from '@/components/layout/MobileBottomNavIsland';
import { MobileStorefrontHeader } from '@/components/layout/MobileStorefrontHeader';
import { PAGE_CONTAINER } from '@/components/layout/page-container';
import { SiteFooter } from '@/components/layout/SiteFooter';
import { SiteHeader } from '@/components/layout/SiteHeader';
import { MaintenanceGate } from '@/components/layout/MaintenanceGate';
import { TidioChat } from '@/components/layout/TidioChat';
import { TidioMobileLift } from '@/components/layout/TidioMobileLift';
import { resolveActiveGroupOrderSession } from '@/features/group-orders/application/active-banner';
import { ActiveGroupOrderBanner } from '@/features/group-orders/ui/ActiveGroupOrderBanner';
import { GroupOrderSessionWatcher } from '@/features/group-orders/ui/GroupOrderSessionWatcher';
import { PromoPopupIsland } from '@/features/popups/ui/PromoPopupIsland';
import { isLocale, type Locale } from '@/lib/i18n/config';
import { getDictionary } from '@/lib/i18n/get-dictionary';
import { CURRENCY_COOKIE_NAME, parseCurrencyCookie } from '@/lib/money/currency-cookie';

type StorefrontLayoutProps = {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
};

export default async function StorefrontLayout({ children, params }: StorefrontLayoutProps) {
  const { locale: rawLocale } = await params;

  if (!isLocale(rawLocale)) {
    notFound();
  }

  const locale: Locale = rawLocale;
  const dictionary = getDictionary(locale);
  const cookieStore = await cookies();
  const currency = parseCurrencyCookie(cookieStore.get(CURRENCY_COOKIE_NAME)?.value);
  const groupOrderSession = await resolveActiveGroupOrderSession();

  return (
    <div className="storefront-shell flex min-h-dvh min-w-0 flex-1 flex-col bg-[#fff8e7]">
      <MobileStorefrontHeader locale={locale} currency={currency} dictionary={dictionary} />
      <SiteHeader locale={locale} currency={currency} dictionary={dictionary} />
      {groupOrderSession.kind === 'active' ? (
        <ActiveGroupOrderBanner
          locale={locale}
          labels={dictionary.groupOrder}
          organizerDisplayName={groupOrderSession.banner.organizerDisplayName}
          inviteToken={groupOrderSession.banner.inviteToken}
          isOrganizer={groupOrderSession.banner.isOrganizer}
        />
      ) : null}
      {groupOrderSession.kind === 'cancelled' ? (
        <GroupOrderSessionWatcher
          labels={dictionary.groupOrder}
          inviteToken={groupOrderSession.inviteToken}
          mode="alert-cancelled"
        />
      ) : null}
      {groupOrderSession.kind === 'ended' ? (
        <GroupOrderSessionWatcher labels={dictionary.groupOrder} mode="clear-ended" />
      ) : null}
      <main className={`storefront-main min-w-0 flex-1 py-10 pb-24 lg:pb-10 ${PAGE_CONTAINER}`}>
        <MaintenanceGate>{children}</MaintenanceGate>
      </main>
      <SiteFooter dictionary={dictionary} locale={locale} />
      <MobileBottomNavIsland locale={locale} currency={currency} dictionary={dictionary} />
      <PromoPopupIsland closeLabel={dictionary.nav.closeMenu} />
      <TidioChat />
      <TidioMobileLift />
    </div>
  );
}
