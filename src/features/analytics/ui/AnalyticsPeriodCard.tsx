'use client';

import { CalendarDays, Download } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState, useTransition, type FormEvent } from 'react';

import { DateField } from '@/components/ui/DateField';
import { SelectDropdown } from '@/components/ui/SelectDropdown';
import { ADMIN_LABEL } from '@/features/admin/ui/admin-form-classes';
import {
  ANALYTICS_PERIOD_PRESETS,
  formatAnalyticsDisplayDate,
  rangeForAnalyticsPeriod,
  type AnalyticsPeriodPreset,
} from '@/features/analytics/domain/date-range';
import type { Dictionary } from '@/lib/i18n/get-dictionary';

type AnalyticsPeriodCardProps = {
  locale: string;
  from: string;
  to: string;
  preset: AnalyticsPeriodPreset;
  exportQuery: string;
  rangeInvalid: boolean;
  copy: Dictionary['admin'];
};

export function AnalyticsPeriodCard({
  locale,
  from,
  to,
  preset,
  exportQuery,
  rangeInvalid,
  copy,
}: AnalyticsPeriodCardProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [forceCustom, setForceCustom] = useState(preset === 'custom');
  const selectedPreset: AnalyticsPeriodPreset = forceCustom ? 'custom' : preset;

  const presetLabel = (p: AnalyticsPeriodPreset): string => {
    const map: Record<AnalyticsPeriodPreset, string> = {
      last_7_days: copy.analytics.period.last7Days,
      last_30_days: copy.analytics.period.last30Days,
      last_90_days: copy.analytics.period.last90Days,
      this_month: copy.analytics.period.thisMonth,
      custom: copy.analytics.period.customRange,
    };
    return map[p];
  };

  function navigate(nextFrom: string, nextTo: string): void {
    const params = new URLSearchParams({ from: nextFrom, to: nextTo });
    setForceCustom(false);
    startTransition(() => {
      router.push(`/${locale}/admin/analytics?${params.toString()}`);
    });
  }

  function onPeriodChange(value: string): void {
    const next = value as AnalyticsPeriodPreset;
    if (next === 'custom') {
      setForceCustom(true);
      return;
    }
    const range = rangeForAnalyticsPeriod(next);
    navigate(range.from, range.to);
  }

  function onCustomSubmit(event: FormEvent<HTMLFormElement>): void {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const nextFrom = String(data.get('from') ?? '');
    const nextTo = String(data.get('to') ?? '');
    if (!nextFrom || !nextTo) {
      return;
    }
    navigate(nextFrom, nextTo);
  }

  return (
    <div className="mb-5 rounded-[18px] border border-[#1e1e1e]/8 bg-white px-4 py-4 shadow-[0_8px_20px_rgba(30,30,30,0.04)] sm:px-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 text-sm font-medium text-[#1e1e1e]">
            <CalendarDays className="size-4 shrink-0 text-[#ff6b00]" aria-hidden />
            <p>
              {formatAnalyticsDisplayDate(from)} – {formatAnalyticsDisplayDate(to)}
            </p>
          </div>

          <div className="mt-3 max-w-xs">
            <span className={ADMIN_LABEL}>{copy.analytics.period.label}</span>
            <SelectDropdown
              ariaLabel={copy.analytics.period.aria}
              value={selectedPreset}
              options={ANALYTICS_PERIOD_PRESETS.map((option) => ({
                label: presetLabel(option),
                value: option,
              }))}
              disabled={pending}
              deferChange={false}
              className="mt-1"
              onValueChange={onPeriodChange}
            />
          </div>

          {selectedPreset === 'custom' ? (
            <form onSubmit={onCustomSubmit} className="mt-3 flex flex-wrap items-end gap-3">
              <label className="min-w-0 w-full flex-1 sm:min-w-[140px]">
                <span className={ADMIN_LABEL}>{copy.analytics.period.from}</span>
                <DateField locale={locale} name="from" defaultValue={from} placeholder={copy.analytics.period.from} />
              </label>
              <label className="min-w-0 w-full flex-1 sm:min-w-[140px]">
                <span className={ADMIN_LABEL}>{copy.analytics.period.to}</span>
                <DateField locale={locale} name="to" defaultValue={to} placeholder={copy.analytics.period.to} />
              </label>
              <button
                type="submit"
                disabled={pending}
                className="rounded-full bg-[#ff6b00] px-4 py-2.5 text-sm font-bold text-white transition hover:bg-[#e85f00] disabled:opacity-60"
              >
                {copy.analytics.period.apply}
              </button>
            </form>
          ) : null}

          {rangeInvalid ? (
            <p className="mt-2 text-sm text-[#c2410c]">{copy.analytics.period.invalidRange}</p>
          ) : null}
        </div>

        <a
          href={`/api/exports/admin/analytics?${exportQuery}`}
          className="inline-flex items-center gap-1.5 text-sm font-bold text-[#ff6b00] underline-offset-2 hover:underline"
        >
          <Download className="size-4" aria-hidden />
          {copy.analytics.period.downloadCsv}
        </a>
      </div>
    </div>
  );
}
