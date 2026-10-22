import { notFound, redirect } from 'next/navigation';

import { getCustomerBonusSummary } from '@/features/bonuses/application/queries';
import { formatYerevanDateTime } from '@/features/delivery/domain/delivery-schedule';
import { ProfilePageHeading } from '@/features/profile/ui/ProfilePageHeading';
import { ProfileStatCard } from '@/features/profile/ui/ProfileStatCard';
import { PROFILE_PANEL } from '@/features/profile/ui/profile-ui-classes';
import { getCurrentUser } from '@/lib/auth/session';
import { isLocale } from '@/lib/i18n/config';
import { getDictionary } from '@/lib/i18n/get-dictionary';
import { formatMoneyAmount } from '@/lib/money/format';
import { AppLink } from '@/components/ui/AppLink';

type ProfileBonusesPageProps = {
  params: Promise<{ locale: string }>;
};

function typeLabel(type: string, labels: Record<string, string>): string {
  return labels[type] ?? type;
}

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

      <div>
        <h2 className="mb-4 text-lg font-bold text-[#1e1e1e]">{copy.history}</h2>
        {summary.transactions.length === 0 ? (
          <p className="rounded-[22px] bg-[#fff8e7] px-4 py-6 text-sm text-[#1e1e1e]/65">
            {copy.empty}
          </p>
        ) : (
          <ul className={`${PROFILE_PANEL} divide-y divide-[#ff6b00]/10 p-0`}>
            {summary.transactions.map((row) => {
              const positive = row.delta > 0;
              return (
                <li
                  key={row.id}
                  className="flex flex-col gap-2 px-5 py-4 first:pt-5 sm:flex-row sm:items-center sm:justify-between sm:px-6"
                >
                  <div className="min-w-0 space-y-1">
                    <p className="text-sm font-bold text-[#1e1e1e]">
                      {typeLabel(row.type, copy.types)}
                    </p>
                    <p className="text-xs text-[#1e1e1e]/55">
                      {formatYerevanDateTime(row.createdAt)}
                      {row.orderNumber ? (
                        <>
                          {' · '}
                          <AppLink
                            href={`/${rawLocale}/profile/orders?order=${encodeURIComponent(row.orderNumber)}`}
                            className="underline-offset-2 hover:underline"
                          >
                            {copy.order} {row.orderNumber}
                          </AppLink>
                        </>
                      ) : null}
                    </p>
                    {row.type === 'EARN' ? (
                      <p className="text-xs text-[#1e1e1e]/55">
                        {row.expiresAt
                          ? copy.expires.replace('{date}', row.expiresAt.toISOString().slice(0, 10))
                          : copy.noExpiry}
                      </p>
                    ) : null}
                  </div>
                  <p
                    className={
                      positive
                        ? 'text-sm font-bold text-[#ff6b00]'
                        : 'text-sm font-bold text-[#1e1e1e]'
                    }
                  >
                    {positive ? '+' : ''}
                    {formatMoneyAmount(row.delta, 'AMD', rawLocale)}
                  </p>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </section>
  );
}
