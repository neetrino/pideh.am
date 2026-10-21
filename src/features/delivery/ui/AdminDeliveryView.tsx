'use client';

import { useMemo, useState, useTransition } from 'react';

import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { AdminPageHeading } from '@/features/admin/ui/AdminPageHeading';
import { useAdminSidebarCollapse } from '@/features/admin/ui/AdminSidebarCollapseContext';
import { saveDeliverySettingsAction } from '@/features/delivery/application/save-delivery-settings';
import type { CashChangeDenomination } from '@/features/delivery/domain/cash-change';
import type { StoreDeliverySettings } from '@/features/delivery/domain/delivery-settings';
import type { DeliveryScheduleSettings } from '@/features/delivery/domain/delivery-schedule';
import { timeToMinutes } from '@/features/delivery/domain/delivery-schedule';
import type { AdminDeliveryLocation } from '@/features/delivery/application/queries';
import { AdminCashChangeEditor } from '@/features/delivery/ui/AdminCashChangeEditor';
import { AdminDeliveryLocations } from '@/features/delivery/ui/AdminDeliveryLocations';
import { AdminDeliveryScheduleEditor } from '@/features/delivery/ui/AdminDeliveryScheduleEditor';
import type { Dictionary } from '@/lib/i18n/get-dictionary';

type AdminDeliveryViewCopy = {
  delivery: Dictionary['admin']['delivery'];
  common: Dictionary['admin']['common'];
};

type AdminDeliveryViewProps = {
  locale: string;
  settings: StoreDeliverySettings;
  locations: AdminDeliveryLocation[];
  initialImageUrls: Record<string, string>;
  copy: AdminDeliveryViewCopy;
};

function minutesToTime(total: number): string {
  const hours = Math.floor(total / 60);
  const minutes = total % 60;
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
}

function normalizeScheduleForSave(
  schedule: DeliveryScheduleSettings,
): DeliveryScheduleSettings['weekly'] {
  const weekly = { ...schedule.weekly };
  for (const day of [1, 2, 3, 4, 5, 6, 7] as const) {
    const hours = weekly[day];
    if (!hours.isOpen) continue;
    const openMinutes = timeToMinutes(hours.openTime);
    const closeMinutes = timeToMinutes(hours.closeTime);
    if (closeMinutes > openMinutes) continue;
    const preferredClose = openMinutes + 60;
    weekly[day] =
      preferredClose <= 23 * 60 + 59
        ? { ...hours, closeTime: minutesToTime(preferredClose) }
        : {
            ...hours,
            openTime: minutesToTime(Math.max(0, closeMinutes - 60)),
          };
  }
  return weekly;
}

export function AdminDeliveryView({
  locale,
  settings,
  locations,
  initialImageUrls,
  copy,
}: AdminDeliveryViewProps) {
  const [isActive, setIsActive] = useState(settings.isActive);
  const [schedule, setSchedule] = useState<DeliveryScheduleSettings>(settings.schedule);
  const [cashChangeDenominations, setCashChangeDenominations] = useState<CashChangeDenomination[]>(
    settings.cashChangeDenominations,
  );
  const [imageUrls, setImageUrls] = useState(initialImageUrls);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const { collapsed } = useAdminSidebarCollapse();
  const stickyBarOffsetClass = collapsed ? 'lg:left-16' : 'lg:left-64';
  const [savedSnapshot, setSavedSnapshot] = useState(() => ({
    isActive: settings.isActive,
    schedule: settings.schedule,
    cashChangeDenominations: settings.cashChangeDenominations,
    imageUrls: initialImageUrls,
  }));

  const sortedDenominations = useMemo(
    () =>
      [...cashChangeDenominations].sort((a, b) => a.sortOrder - b.sortOrder || a.amount - b.amount),
    [cashChangeDenominations],
  );

  const isDirty = useMemo(() => {
    if (isActive !== savedSnapshot.isActive) return true;
    if (JSON.stringify(schedule) !== JSON.stringify(savedSnapshot.schedule)) return true;
    const savedDenominations = [...savedSnapshot.cashChangeDenominations].sort(
      (a, b) => a.sortOrder - b.sortOrder || a.amount - b.amount,
    );
    if (JSON.stringify(sortedDenominations) !== JSON.stringify(savedDenominations)) return true;
    if (JSON.stringify(imageUrls) !== JSON.stringify(savedSnapshot.imageUrls)) return true;
    return false;
  }, [imageUrls, isActive, savedSnapshot, schedule, sortedDenominations]);

  function onSave(): void {
    if (!isDirty) return;
    startTransition(async () => {
      setError(null);
      setMessage(null);
      const weekly = normalizeScheduleForSave(schedule);
      const nextSchedule = { ...schedule, weekly };
      setSchedule(nextSchedule);
      const nextDenominations = sortedDenominations.map((item, index) => ({
        ...item,
        sortOrder: index,
      }));
      const result = await saveDeliverySettingsAction(locale, {
        originAddress: settings.originAddress,
        originLat: settings.originLat,
        originLng: settings.originLng,
        pricePerKmAmount: settings.pricePerKmAmount,
        isActive,
        schedule: {
          slotMinutes: nextSchedule.slotMinutes,
          maxDaysAhead: nextSchedule.maxDaysAhead,
          weekly,
          closedDates: nextSchedule.closedDates,
        },
        cashChangeDenominations: nextDenominations,
      });
      if (!result.ok) {
        setError(result.error.message);
        return;
      }
      setCashChangeDenominations(nextDenominations);
      setSavedSnapshot({
        isActive,
        schedule: nextSchedule,
        cashChangeDenominations: nextDenominations,
        imageUrls,
      });
      setMessage(copy.delivery.saved);
    });
  }

  function onCancel(): void {
    setIsActive(savedSnapshot.isActive);
    setSchedule(savedSnapshot.schedule);
    setCashChangeDenominations(savedSnapshot.cashChangeDenominations);
    setImageUrls(savedSnapshot.imageUrls);
    setError(null);
    setMessage(null);
  }

  return (
    <section className="pb-24">
      <AdminPageHeading
        className="mb-6"
        title={copy.delivery.title}
        description={copy.delivery.subtitle}
      />

      {error ? <p className="mb-3 text-sm text-red-700">{error}</p> : null}
      {message ? <p className="mb-3 text-sm text-green-700">{message}</p> : null}

      <form
        className="grid items-stretch gap-6 xl:grid-cols-2"
        onSubmit={(event) => {
          event.preventDefault();
          onSave();
        }}
      >
        <AdminDeliveryLocations
          locale={locale}
          locations={locations}
          copy={copy}
          isActive={isActive}
          onActiveChange={setIsActive}
          activeDisabled={isPending}
        />

        <Card className="flex h-full flex-col p-6">
          <AdminDeliveryScheduleEditor
            locale={locale}
            value={schedule}
            onChange={setSchedule}
            disabled={isPending}
            copy={copy.delivery.schedule}
          />
        </Card>

        <Card className="p-6 xl:col-span-2">
          <AdminCashChangeEditor
            locale={locale}
            value={sortedDenominations}
            imageUrls={imageUrls}
            onChange={setCashChangeDenominations}
            onImageUrlsChange={setImageUrls}
            disabled={isPending}
            copy={copy.delivery.cashChange}
          />
        </Card>

        <div
          className={`fixed inset-x-0 bottom-0 z-20 border-t border-[#ff6b00]/20 bg-[#fff8e7] px-4 py-2.5 shadow-[0_-8px_24px_rgba(255,107,0,0.12)] sm:px-6 lg:px-8 ${stickyBarOffsetClass}`}
        >
          <div className="flex items-center justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={isPending || !isDirty}
              className="min-w-[160px] px-10"
            >
              {copy.common.cancel}
            </Button>
            <Button
              type="submit"
              disabled={isPending || !isDirty}
              className="min-w-[180px] bg-[#ff6b00] px-10 text-white hover:bg-[#e85f00]"
            >
              {isPending ? copy.common.saving : copy.common.save}
            </Button>
          </div>
        </div>
      </form>
    </section>
  );
}
