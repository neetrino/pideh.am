'use client';

import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import { Users } from 'lucide-react';

import { PAGE_CONTAINER } from '@/components/layout/page-container';
import { AppLink } from '@/components/ui/AppLink';
import { leaveGroupOrderSessionAction } from '@/features/group-orders/actions';
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
  const [pending, startTransition] = useTransition();
  const [confirmOpen, setConfirmOpen] = useState(false);

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
        <div className={`py-2 ${PAGE_CONTAINER}`}>
          <div className="flex items-center gap-2.5 rounded-[20px] border border-pideh-ink/10 bg-white px-3 py-2.5 shadow-[0_8px_18px_rgba(31,20,8,0.08)]">
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
                className="inline-flex h-8 items-center justify-center rounded-full border border-pideh-ink/10 bg-pideh-cream px-3 text-xs font-bold text-pideh-ink transition hover:border-pideh-orange hover:text-pideh-orange disabled:opacity-50"
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
