'use client';

import { useEffect, useState, type ReactNode } from 'react';
import { User, Users } from 'lucide-react';

import type {
  GroupOrderDetailView,
  GroupOrderParticipantView,
} from '@/features/group-orders/application/queries';
import type { Dictionary } from '@/lib/i18n/get-dictionary';

const SUMMARY_HEADER_GAP_PX = 16;

function useSummaryStickyTop(): number {
  const [top, setTop] = useState(SUMMARY_HEADER_GAP_PX);

  useEffect(() => {
    function update(): void {
      const headers = document.querySelectorAll<HTMLElement>('.site-header, [data-site-header]');
      let bottom = 0;
      headers.forEach((header) => {
        const style = window.getComputedStyle(header);
        if (style.display === 'none' || style.visibility === 'hidden') return;
        const rect = header.getBoundingClientRect();
        if (rect.height < 1 || rect.width < 1) return;
        bottom = Math.max(bottom, rect.bottom);
      });
      setTop(Math.round((bottom > 0 ? bottom : 0) + SUMMARY_HEADER_GAP_PX));
    }

    update();
    window.addEventListener('resize', update);
    window.addEventListener('scroll', update, { passive: true });
    const observer = new ResizeObserver(update);
    document.querySelectorAll('.site-header, [data-site-header]').forEach((header) => {
      observer.observe(header);
    });

    return () => {
      window.removeEventListener('resize', update);
      window.removeEventListener('scroll', update);
      observer.disconnect();
    };
  }, []);

  return top;
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4 text-sm text-pideh-ink">
      <span className="text-pideh-muted">{label}</span>
      <span className="text-right font-semibold">{value}</span>
    </div>
  );
}

type GroupOrderSummaryProps = {
  labels: Dictionary['groupOrder'];
  view: GroupOrderDetailView;
  currentParticipant: GroupOrderParticipantView | undefined;
  actions?: ReactNode;
};

export function GroupOrderSummary({
  labels,
  view,
  currentParticipant,
  actions,
}: GroupOrderSummaryProps) {
  const stickyTop = useSummaryStickyTop();
  const showDeliveryShare =
    view.paymentMode === 'SPLIT_PER_PARTICIPANT' &&
    view.currentParticipantId != null &&
    currentParticipant != null;

  return (
    <div className="z-20 w-full space-y-3 lg:sticky lg:self-start" style={{ top: stickyTop }}>
      <section className="rounded-[26px] border-2 border-pideh-ink/10 bg-white px-5 py-6 shadow-[0px_12px_14px_rgba(31,20,8,0.08)] sm:px-6 sm:py-7">
        <h2 className="font-display mb-6 flex items-start gap-2 text-xl leading-none text-pideh-ink uppercase">
          {view.paymentMode === 'ORGANIZER_PAYS_ALL' ? (
            <User className="mt-0.5 h-5 w-5 shrink-0 text-pideh-orange" aria-hidden />
          ) : (
            <Users className="mt-0.5 h-5 w-5 shrink-0 text-pideh-orange" aria-hidden />
          )}
          <span className="min-w-0">
            {view.paymentMode === 'ORGANIZER_PAYS_ALL'
              ? labels.payingOrganizer.replace('{name}', view.organizerDisplayName)
              : labels.payingSplit}
          </span>
        </h2>

        <div className="space-y-4">
          <SummaryRow label={labels.subtotal} value={view.merchandiseTotalFormatted} />
          <SummaryRow
            label={labels.limitRowLabel}
            value={view.spendLimitFormatted ?? labels.noLimit}
          />
          <SummaryRow
            label={labels.deliveryAddressLabel}
            value={view.deliveryAddress ?? labels.noDeliveryAddress}
          />
          <div className="flex justify-between gap-4 text-sm text-pideh-ink">
            <span className="text-pideh-muted">{labels.delivery}</span>
            <span className="text-right font-semibold">
              {view.deliveryFormatted}
              {view.deliveryDistanceLabel ? (
                <span className="font-medium text-pideh-muted"> ({view.deliveryDistanceLabel})</span>
              ) : null}
            </span>
          </div>
          {showDeliveryShare && currentParticipant ? (
            <SummaryRow
              label={labels.yourDeliveryShare}
              value={currentParticipant.deliveryShareFormatted}
            />
          ) : null}
          <div className="border-t border-pideh-ink/10 pt-4">
            <div className="flex justify-between text-lg font-extrabold text-pideh-ink">
              <span>{labels.total}</span>
              <span className="text-pideh-orange">{view.grandTotalFormatted}</span>
            </div>
          </div>
        </div>
      </section>
      {actions}
    </div>
  );
}
