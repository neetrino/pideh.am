'use client';

import { useCallback, useEffect, useState, type ReactNode } from 'react';
import { usePathname, useRouter } from 'next/navigation';

import { STOREFRONT_DESKTOP_MEDIA } from '@/components/layout/page-container';
import { ProfileMobileHub } from '@/features/profile/ui/ProfileMobileHub';
import { ProfileMobileTabSheet } from '@/features/profile/ui/ProfileMobileTabSheet';
import type { Dictionary } from '@/lib/i18n/get-dictionary';
import type { Locale } from '@/lib/i18n/config';
import type { SessionUser } from '@/lib/auth/session';

type ProfileMobileShellProps = {
  locale: Locale;
  user: SessionUser;
  dictionary: Dictionary['profile'];
  children: ReactNode;
};

function isProfileHubPath(pathname: string, locale: Locale): boolean {
  const hubHref = `/${locale}/profile`;
  return pathname === hubHref || pathname === `${hubHref}/`;
}

/**
 * Mobile profile shell: hub always visible; section content in a bottom sheet.
 * Desktop content column is landscape tablet + wide screens. Renders `children` once (matchMedia).
 */
export function ProfileMobileShell({
  locale,
  user,
  dictionary,
  children,
}: ProfileMobileShellProps) {
  const pathname = usePathname() ?? '';
  const router = useRouter();
  const isHub = isProfileHubPath(pathname, locale);
  const [hubSheetOpen, setHubSheetOpen] = useState(false);
  /** Keeps sub-route content mounted while the close keyframe plays. */
  const [closingToHub, setClosingToHub] = useState(false);
  const [isDesktop, setIsDesktop] = useState<boolean | null>(null);

  useEffect(() => {
    const media = window.matchMedia(STOREFRONT_DESKTOP_MEDIA);
    function sync(): void {
      setIsDesktop(media.matches);
    }
    sync();
    media.addEventListener('change', sync);
    return () => media.removeEventListener('change', sync);
  }, []);

  useEffect(() => {
    if (isHub) {
      setHubSheetOpen(false);
      setClosingToHub(false);
    }
  }, [isHub, pathname]);

  const sheetOpen = (!isHub || hubSheetOpen) && !closingToHub;

  const closeSheet = useCallback(() => {
    if (isHub) {
      setHubSheetOpen(false);
      return;
    }
    setClosingToHub(true);
  }, [isHub]);

  const handleSheetExited = useCallback(() => {
    if (!closingToHub) return;
    // Keep `closingToHub` true until the hub route mounts — otherwise
    // `sheetOpen` flips back on and the sheet re-opens with a jerk.
    router.push(`/${locale}/profile`);
  }, [closingToHub, locale, router]);

  const openHubDashboard = useCallback(() => {
    setHubSheetOpen(true);
  }, []);

  const hub = (
    <ProfileMobileHub
      locale={locale}
      user={user}
      dictionary={dictionary}
      onOpenDashboard={openHubDashboard}
    />
  );

  const desktopColumn = (
    <div className="profile-desktop-content profile-sticky-band min-w-0 flex-1">{children}</div>
  );

  // SSR / pre-hydration: hub on phone + iPad portrait via CSS; desktop from landscape / 1200+.
  if (isDesktop === null) {
    return (
      <>
        <div className="profile-mobile-page w-full md:hidden">{hub}</div>
        <div className="profile-desktop-content profile-sticky-band storefront-desktop-tree hidden min-w-0 flex-1 md:block">
          {children}
        </div>
      </>
    );
  }

  if (isDesktop) {
    return desktopColumn;
  }

  return (
    <div className="profile-mobile-page w-full">
      {hub}
      <ProfileMobileTabSheet
        open={sheetOpen}
        onClose={closeSheet}
        onExited={handleSheetExited}
        ariaLabel={dictionary.title}
      >
        {children}
      </ProfileMobileTabSheet>
    </div>
  );
}
