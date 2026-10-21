'use client';

import type { CSSProperties, ReactNode } from 'react';

import { MOBILE_COPYRIGHT_NAV_CLEARANCE_PX } from '@/components/layout/NavEllipse3469';
import { LoginHeat } from '@/features/auth/ui/LoginHeat';
import { MobileCopyright } from '@/features/home/ui/mobile/MobileCopyright';

type LoginSceneProps = {
  title: string;
  children: ReactNode;
  mobileBackgroundSrc?: string;
  copyrightText: string;
};

export function LoginScene({ title, children, mobileBackgroundSrc, copyrightText }: LoginSceneProps) {
  const mobileClearance = {
    '--auth-nav-clearance': `${MOBILE_COPYRIGHT_NAV_CLEARANCE_PX}px`,
  } as CSSProperties;

  return (
    <div
      className="pideh-login relative z-10 flex min-h-dvh items-end justify-center overflow-x-clip px-5 pt-8 lg:items-center lg:px-8 lg:pt-28 lg:pb-16"
      style={mobileClearance}
    >
      <LoginHeat mobileSrc={mobileBackgroundSrc} />
      <div className="relative z-10 w-full min-w-0 max-w-[440px]">
        <div className="overflow-x-clip rounded-[28px] border-2 border-[#1e1e1e] bg-[#fff8e7]/95 p-6 shadow-[6px_6px_0_#1e1e1e] backdrop-blur-sm lg:p-8">
          <h1 className="font-display text-[clamp(1.75rem,8vw,3rem)] leading-[0.95] text-[#1e1e1e] uppercase">
            {title}
          </h1>
          <div className="mt-8 min-w-0">{children}</div>
        </div>
        <MobileCopyright className="mt-8 lg:hidden" text={copyrightText} />
      </div>
    </div>
  );
}
