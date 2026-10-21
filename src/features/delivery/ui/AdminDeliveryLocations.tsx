'use client';

import { Pencil, Plus, Trash2 } from 'lucide-react';
import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';

import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { deleteDeliveryLocationAction } from '@/features/delivery/application/manage-delivery';
import type { AdminDeliveryLocation } from '@/features/delivery/application/queries';
import { DeliveryLocationDrawer } from '@/features/delivery/ui/DeliveryLocationDrawer';
import { formatMoneyAmount } from '@/lib/money/format';
import type { Dictionary } from '@/lib/i18n/get-dictionary';

type AdminDeliveryLocationsCopy = {
  delivery: Dictionary['admin']['delivery'];
  common: Dictionary['admin']['common'];
};

type AdminDeliveryLocationsProps = {
  locale: string;
  locations: AdminDeliveryLocation[];
  copy: AdminDeliveryLocationsCopy;
  isActive: boolean;
  onActiveChange: (value: boolean) => void;
  activeDisabled?: boolean;
};

export function AdminDeliveryLocations({
  locale,
  locations,
  copy,
  isActive,
  onActiveChange,
  activeDisabled,
}: AdminDeliveryLocationsProps) {
  const router = useRouter();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editing, setEditing] = useState<AdminDeliveryLocation | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function openCreate(): void {
    setEditing(null);
    setDrawerOpen(true);
  }

  function openEdit(location: AdminDeliveryLocation): void {
    setEditing(location);
    setDrawerOpen(true);
  }

  function onDelete(id: string): void {
    startTransition(async () => {
      setError(null);
      const result = await deleteDeliveryLocationAction(locale, id);
      if (!result.ok) {
        setError(result.error.message);
        return;
      }
      router.refresh();
    });
  }

  return (
    <>
      <Card className="flex h-full min-h-0 flex-col p-6">
        <div className="relative mb-4">
          <div className="pr-[14rem]">
            <h2 className="text-base font-semibold text-gray-900">{copy.delivery.locations.title}</h2>
            <p className="mt-1 text-sm text-gray-600">{copy.delivery.locations.hint}</p>
          </div>
          <Button
            type="button"
            size="sm"
            onClick={openCreate}
            disabled={isPending}
            className="absolute top-0 right-0 inline-flex items-center gap-1.5 bg-[#ff6b00] whitespace-nowrap text-white hover:bg-[#e85f00]"
          >
            <Plus className="h-4 w-4" aria-hidden />
            {copy.delivery.locations.add}
          </Button>
        </div>

        {error ? <p className="mb-3 text-sm text-red-700">{error}</p> : null}

        {locations.length === 0 ? (
          <p className="rounded-xl border border-dashed border-[#ff6b00]/25 bg-[#fff8e7] px-4 py-6 text-center text-sm text-[#1e1e1e]/70">
            {copy.delivery.locations.empty}
          </p>
        ) : (
          <ul className="divide-y divide-[#ff6b00]/15 overflow-hidden rounded-xl border border-[#ff6b00]/20">
            {locations.map((location) => (
              <li key={location.id} className="flex items-center justify-between gap-3 px-4 py-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-[#1e1e1e]">
                    {location.city}
                    {location.area ? ` · ${location.area}` : ''}
                  </p>
                  <p className="text-sm text-[#ff6b00]">
                    {formatMoneyAmount(location.priceAmount, 'AMD', locale)}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-1">
                  <button
                    type="button"
                    onClick={() => openEdit(location)}
                    className="rounded-lg p-2 text-[#1e1e1e]/55 hover:bg-[#ffd54a]/40 hover:text-[#1e1e1e]"
                    disabled={isPending}
                    aria-label={copy.common.edit}
                  >
                    <Pencil className="h-4 w-4" aria-hidden />
                  </button>
                  <button
                    type="button"
                    onClick={() => onDelete(location.id)}
                    className="rounded-lg p-2 text-[#1e1e1e]/55 hover:bg-red-50 hover:text-red-700"
                    disabled={isPending}
                    aria-label={copy.common.delete}
                  >
                    <Trash2 className="h-4 w-4" aria-hidden />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}

        <label className="mt-4 inline-flex items-center gap-2 text-sm text-[#1e1e1e]">
          <input
            type="checkbox"
            checked={isActive}
            onChange={(event) => onActiveChange(event.target.checked)}
            disabled={activeDisabled}
            className="h-4 w-4 rounded border-[#1e1e1e]/20 accent-[#ff6b00]"
          />
          <span className="font-bold">{copy.delivery.offerDelivery}</span>
        </label>
      </Card>

      <DeliveryLocationDrawer
        locale={locale}
        open={drawerOpen}
        onClose={() => {
          setDrawerOpen(false);
          setEditing(null);
        }}
        location={editing}
        copy={{
          locationDrawer: copy.delivery.locationDrawer,
          common: copy.common,
        }}
      />
    </>
  );
}
