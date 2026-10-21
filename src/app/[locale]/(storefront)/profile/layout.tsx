import { notFound } from 'next/navigation';

import { ProfileMobileShell } from '@/features/profile/ui/ProfileMobileShell';
import { ProfileSidebar } from '@/features/profile/ui/ProfileSidebar';
import { requireUser } from '@/lib/auth/policies';
import { isLocale } from '@/lib/i18n/config';
import { getDictionary } from '@/lib/i18n/get-dictionary';

type ProfileLayoutProps = {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
};

export default async function ProfileLayout({ children, params }: ProfileLayoutProps) {
  const { locale: rawLocale } = await params;

  if (!isLocale(rawLocale)) {
    notFound();
  }

  const user = await requireUser(rawLocale);
  const dictionary = getDictionary(rawLocale);

  return (
    <div className="profile-desktop-page flex flex-col gap-6 pb-10 md:min-h-0 md:flex-1 md:flex-row md:gap-8 md:overflow-hidden md:pb-0">
      <div className="storefront-desktop-tree hidden w-[280px] shrink-0 md:flex md:min-h-0 md:flex-col md:self-stretch md:overflow-hidden">
        <ProfileSidebar locale={rawLocale} user={user} dictionary={dictionary.profile} />
      </div>

      <ProfileMobileShell locale={rawLocale} user={user} dictionary={dictionary.profile}>
        {children}
      </ProfileMobileShell>
    </div>
  );
}
