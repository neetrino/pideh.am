'use client';

import { Pencil, Trash2 } from 'lucide-react';
import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';

import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import {
  ADMIN_TABLE,
  ADMIN_TABLE_OUTER_SCROLL,
  ADMIN_TABLE_ROW,
  ADMIN_TABLE_TBODY,
  ADMIN_TABLE_TD,
  ADMIN_TABLE_TD_CENTER,
  ADMIN_TABLE_TH,
  ADMIN_TABLE_TH_CENTER,
  ADMIN_TABLE_THEAD,
} from '@/features/admin/ui/admin-table-classes';
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
};

export function AdminDeliveryLocations({ locale, locations, copy }: AdminDeliveryLocationsProps) {
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
        <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <h2 className="text-base font-semibold text-gray-900">{copy.delivery.locations.title}</h2>
            <p className="mt-1 text-sm text-gray-600">{copy.delivery.locations.hint}</p>
          </div>
          <Button type="button" onClick={openCreate} disabled={isPending}>
            {copy.delivery.locations.add}
          </Button>
        </div>

        {error ? <p className="mb-3 text-sm text-red-700">{error}</p> : null}

        {locations.length === 0 ? (
          <p className="text-sm text-gray-600">{copy.delivery.locations.empty}</p>
        ) : (
          <div className={ADMIN_TABLE_OUTER_SCROLL}>
            <table className={ADMIN_TABLE}>
              <thead className={ADMIN_TABLE_THEAD}>
                <tr>
                  <th className={ADMIN_TABLE_TH}>{copy.delivery.locationDrawer.city}</th>
                  <th className={`${ADMIN_TABLE_TH_CENTER} !text-center`}>
                    {copy.delivery.locationDrawer.area}
                  </th>
                  <th className={`${ADMIN_TABLE_TH_CENTER} !text-center`}>
                    {copy.delivery.locationDrawer.priceAmd}
                  </th>
                  <th className={`${ADMIN_TABLE_TH_CENTER} !text-center`}>
                    {copy.common.actions}
                  </th>
                </tr>
              </thead>
              <tbody className={ADMIN_TABLE_TBODY}>
                {locations.map((location) => (
                  <tr key={location.id} className={ADMIN_TABLE_ROW}>
                    <td className={ADMIN_TABLE_TD}>{location.city}</td>
                    <td className={`${ADMIN_TABLE_TD_CENTER} !text-center`}>{location.area}</td>
                    <td className={ADMIN_TABLE_TD_CENTER}>
                      {formatMoneyAmount(location.priceAmount, 'AMD', locale)}
                    </td>
                    <td className={ADMIN_TABLE_TD_CENTER}>
                      <div className="flex items-center justify-center gap-1">
                        <button
                          type="button"
                          onClick={() => openEdit(location)}
                          className="rounded p-1.5 text-gray-500 hover:bg-gray-100 hover:text-gray-900"
                          disabled={isPending}
                          aria-label={copy.common.edit}
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => onDelete(location.id)}
                          className="rounded p-1.5 text-red-600 hover:bg-red-50"
                          disabled={isPending}
                          aria-label={copy.common.delete}
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
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
