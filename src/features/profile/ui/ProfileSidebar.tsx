import { ProfileSidebarNav } from '@/features/profile/ui/ProfileSidebarNav';
import { logoutAction } from '@/features/auth/logout-action';
import type { Dictionary } from '@/lib/i18n/get-dictionary';
import type { Locale } from '@/lib/i18n/config';
import type { SessionUser } from '@/lib/auth/session';

type ProfileSidebarProps = {
  locale: Locale;
  user: SessionUser;
  dictionary: Dictionary['profile'];
  bonusAmount: string;
};

export function ProfileSidebar({ locale, user, dictionary, bonusAmount }: ProfileSidebarProps) {
  const logoutWithLocale = logoutAction.bind(null, locale);

  return (
    <aside
      className="flex w-full flex-col overflow-hidden rounded-[28px] border border-[#ff6b00]/15 bg-[#fff8e7]"
      aria-label={dictionary.title}
    >
      <div className="relative shrink-0 overflow-hidden border-b border-[#ff6b00]/12 p-5">
        <div
          aria-hidden
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: "url('/brand/pideh/login-food-bg.png')" }}
        />
        <div
          aria-hidden
          className="absolute inset-0 bg-gradient-to-b from-[#fff8e7]/45 via-[#fff8e7]/72 to-[#ffd54a]/80"
        />
        <div className="relative flex flex-col items-center gap-4 text-center">
          <div className="flex size-[4.5rem] items-center justify-center rounded-full bg-[#ff6b00] text-xl font-bold text-white shadow-[0_0_0_4px_#fff8e7,0_8px_20px_rgba(255,107,0,0.35)]">
            {user.firstName.slice(0, 1).toUpperCase()}
            {user.lastName.slice(0, 1).toUpperCase()}
          </div>
          <p className="font-display text-2xl leading-[0.9] text-[#1e1e1e] uppercase">
            {user.firstName} {user.lastName}
          </p>
          <div className="flex w-max max-w-full flex-col items-stretch gap-2">
            <div className="flex h-10 items-center justify-center rounded-2xl bg-white/85 px-3.5 text-center text-xs font-medium whitespace-nowrap text-[#1e1e1e]/75 sm:text-sm">
              {user.email}
            </div>
            <div className="flex h-10 items-center justify-center gap-2 rounded-2xl bg-white/85 px-3.5 text-xs font-medium whitespace-nowrap text-[#1e1e1e] sm:text-sm">
              <img
                src="/brand/pideh/piggy-points.svg"
                alt=""
                width={28}
                height={28}
                className="size-7 shrink-0"
              />
              <span>
                {dictionary.pointsShort}: {bonusAmount}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="profile-sidebar-scroll flex min-h-0 flex-1 flex-col">
        <ProfileSidebarNav
          locale={locale}
          dictionary={dictionary}
          logoutAction={logoutWithLocale}
        />
      </div>
    </aside>
  );
}
