import { notFound, redirect } from 'next/navigation';

import { getCustomerBonusSummary } from '@/features/bonuses/application/queries';
import { ProfileBonusesHistory } from '@/features/profile/ui/ProfileBonusesHistory';
import { ProfilePageHeading } from '@/features/profile/ui/ProfilePageHeading';
import { ProfileStatCard } from '@/features/profile/ui/ProfileStatCard';
import { getCurrentUser } from '@/lib/auth/session';
import { isLocale } from '@/lib/i18n/config';
import { getDictionary } from '@/lib/i18n/get-dictionary';

type ProfileBonusesPageProps = {
  params: Promise<{ locale: string }>;
};

export default async function ProfileBonusesPage({ params }: ProfileBonusesPageProps) {
  const { locale: rawLocale } = await params;
  if (!isLocale(rawLocale)) {
    notFound();
  }

  const user = await getCurrentUser();
  if (!user) {
    redirect(`/${rawLocale}/login`);
  }

  const dictionary = getDictionary(rawLocale);
  const copy = dictionary.profile.bonusesPage;
  const summary = await getCustomerBonusSummary(user.id);

  return (
    <section className="profile-sheet-keep-frame space-y-8">
      <ProfilePageHeading
        eyebrow={dictionary.profile.loyaltyEyebrow}
        title={dictionary.profile.bonuses}
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <ProfileStatCard label={copy.available} value={summary.availableBalance} suffix=" ֏" />
        <ProfileStatCard label={copy.totalEarned} value={summary.totalEarned} suffix=" ֏" />
        <ProfileStatCard label={copy.totalRedeemed} value={summary.totalRedeemed} suffix=" ֏" />
      </div>

      <ProfileBonusesHistory
        locale={rawLocale}
        historyTitle={copy.history}
        emptyLabel={copy.empty}
        typeLabels={copy.types}
        drawerCopy={dictionary.admin}
        transactions={summary.transactions.map((row) => ({
          id: row.id,
          type: row.type,
          delta: row.delta,
          createdAt: row.createdAt.toISOString(),
          orderNumber: row.orderNumber,
        }))}
      />
    </section>
  );
}
