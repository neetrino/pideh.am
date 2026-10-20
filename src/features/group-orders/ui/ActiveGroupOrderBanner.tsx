'use client';

import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState, useTransition } from 'react';
import { createPortal } from 'react-dom';
import { Users } from 'lucide-react';

import { PAGE_CONTAINER } from '@/components/layout/page-container';
import { AppLink } from '@/components/ui/AppLink';
import { leaveGroupOrderSessionAction } from '@/features/group-orders/actions';
import { GROUP_ORDER_BANNER_SLOT_READY } from '@/features/group-orders/ui/GroupOrderBannerSlot';
import { GroupOrderConfirmDialog } from '@/features/group-orders/ui/GroupOrderConfirmDialog';
import { GroupOrderSessionWatcher } from '@/features/group-orders/ui/GroupOrderSessionWatcher';
import type { Dictionary } from '@/lib/i18n/get-dictionary';
import type { Locale } from '@/lib/i18n/config';

function BannerMessage({ template, name }: { template: string; name: string }) {
  const [before, after = ''] = template.split('{name}');

  return (
    <p className="text-[13px] leading-snug font-semibold text-pideh-ink sm:text-sm">
      {before}
      <span className="font-extrabold">{name}</span>
      {after}
    </p>
  );
}

function MobileBannerCard({
  locale,
  labels,
  organizerDisplayName,
  inviteToken,
  pending,
  onLeave,
}: {
  locale: Locale;
  labels: Dictionary['groupOrder'];
  organizerDisplayName: string;
  inviteToken: string;
  pending: boolean;
  onLeave: () => void;
}) {
  return (
    <div className="flex flex-col gap-3 rounded-[22px] bg-white px-4 py-3.5">
      <div className="flex items-start gap-3">
        <span className="inline-flex size-9 shrink-0 items-center justify-center rounded-full bg-pideh-orange text-white">
          <Users className="size-4" aria-hidden />
        </span>
        <BannerMessage template={labels.activeSessionBanner} name={organizerDisplayName} />
      </div>
      <div className="flex justify-end gap-2">
        <AppLink
          href={`/${locale}/group-orders/${inviteToken}`}
          prefetchPolicy="intent"
          className="inline-flex h-9 items-center justify-center rounded-full bg-pideh-orange px-4 text-xs font-bold text-white transition hover:brightness-105"
        >
          {labels.openGroupOrder}
        </AppLink>
        <button
          type="button"
          disabled={pending}
          className="inline-flex h-9 items-center justify-center rounded-full bg-[#e23b3b] px-4 text-xs font-bold text-white transition hover:brightness-105 disabled:opacity-50"
          onClick={onLeave}
        >
          {labels.leaveSession}
        </button>
      </div>
    </div>
  );
}

type ActiveGroupOrderBannerProps = {
  locale: Locale;
  labels: Dictionary['groupOrder'];
  organizerDisplayName: string;
  inviteToken: string;
  isOrganizer: boolean;
};

export function ActiveGroupOrderBanner({
  locale,
  labels,
  organizerDisplayName,
  inviteToken,
  isOrganizer,
}: ActiveGroupOrderBannerProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [pending, startTransition] = useTransition();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [homeSlot, setHomeSlot] = useState<HTMLElement | null>(null);
  const slotConnected = homeSlot?.isConnected === true;

  useEffect(() => {
    const desktop = window.matchMedia(
      '(min-width: 768px) and (min-height: 600px) and (orientation: landscape), (min-width: 1200px)',
    );

    function findVisibleSlot(): HTMLElement | null {
      if (desktop.matches) return null;
      const slots = document.querySelectorAll<HTMLElement>(
        '[data-group-order-banner-slot][data-slot-ready="true"]',
      );
      for (const slot of slots) {
        if (slot.isConnected && slot.getClientRects().length > 0) return slot;
      }
      return null;
    }

    function sync(): void {
      const next = findVisibleSlot();
      setHomeSlot((current) => (current === next ? current : next));
    }

    sync();
    const observer = new MutationObserver(sync);
    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['data-slot-ready'],
    });
    window.addEventListener('resize', sync);
    window.addEventListener(GROUP_ORDER_BANNER_SLOT_READY, sync);
    desktop.addEventListener('change', sync);
    return () => {
      observer.disconnect();
      window.removeEventListener('resize', sync);
      window.removeEventListener(GROUP_ORDER_BANNER_SLOT_READY, sync);
      desktop.removeEventListener('change', sync);
    };
  }, [pathname]);

  function leaveSession(): void {
    startTransition(async () => {
      await leaveGroupOrderSessionAction();
      setConfirmOpen(false);
      router.refresh();
    });
  }

  return (
    <>
      <GroupOrderSessionWatcher labels={labels} inviteToken={inviteToken} mode="poll" />
      <div className="group-order-banner shrink-0">
        {slotConnected && homeSlot
          ? createPortal(
              <MobileBannerCard
                locale={locale}
                labels={labels}
                organizerDisplayName={organizerDisplayName}
                inviteToken={inviteToken}
                pending={pending}
                onLeave={() => setConfirmOpen(true)}
              />,
              homeSlot,
            )
          : null}
        <div className={`${slotConnected ? 'max-md:hidden' : ''} py-2 ${PAGE_CONTAINER}`}>
          <div className="md:hidden">
            <MobileBannerCard
              locale={locale}
              labels={labels}
              organizerDisplayName={organizerDisplayName}
              inviteToken={inviteToken}
              pending={pending}
              onLeave={() => setConfirmOpen(true)}
            />
          </div>
          <div className="hidden items-center gap-2.5 rounded-[20px] border border-pideh-ink/10 bg-white px-3 py-2.5 md:flex">
            <span className="inline-flex size-9 shrink-0 items-center justify-center rounded-full bg-pideh-orange text-white">
              <Users className="size-4" aria-hidden />
            </span>
            <div className="min-w-0 flex-1">
              <BannerMessage template={labels.activeSessionBanner} name={organizerDisplayName} />
            </div>
            <div className="flex shrink-0 flex-row gap-1.5">
              <AppLink
                href={`/${locale}/group-orders/${inviteToken}`}
                prefetchPolicy="intent"
                className="inline-flex h-8 items-center justify-center rounded-full bg-pideh-orange px-3 text-xs font-bold text-white transition hover:brightness-105"
              >
                {labels.openGroupOrder}
              </AppLink>
              <button
                type="button"
                disabled={pending}
                className="inline-flex h-8 items-center justify-center rounded-full border border-pideh-ink/10 bg-white px-3 text-xs font-bold text-pideh-ink transition hover:border-pideh-orange hover:text-pideh-orange disabled:opacity-50"
                onClick={() => setConfirmOpen(true)}
              >
                {labels.leaveSession}
              </button>
            </div>
          </div>
        </div>
      </div>
      <GroupOrderConfirmDialog
        open={confirmOpen}
        title={isOrganizer ? labels.cancelConfirmTitle : labels.leaveConfirmTitle}
        description={isOrganizer ? labels.cancelConfirmBody : labels.leaveConfirmBody}
        stayLabel={isOrganizer ? labels.cancelStay : labels.leaveStay}
        confirmLabel={isOrganizer ? labels.cancelConfirmAction : labels.leaveConfirmAction}
        closeLabel={labels.close}
        pending={pending}
        onClose={() => {
          if (!pending) setConfirmOpen(false);
        }}
        onConfirm={leaveSession}
      />
    </>
  );
}
