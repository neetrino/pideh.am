'use client';

import { useEffect, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';

import { Button } from '@/components/ui/Button';
import { SideSheet } from '@/components/ui/SideSheet';
import { AdminLocaleTabs } from '@/features/admin/ui/AdminLocaleTabs';
import { ADMIN_INPUT, ADMIN_LABEL } from '@/features/admin/ui/admin-form-classes';
import {
  createDeliveryLocationAction,
  updateDeliveryLocationAction,
} from '@/features/delivery/application/manage-delivery';
import type { AdminDeliveryLocation } from '@/features/delivery/application/queries';
import {
  EMPTY_DELIVERY_LOCATION_TRANSLATION,
  type DeliveryLocationTranslation,
} from '@/features/delivery/domain/delivery-location';
import { locales, type Locale } from '@/lib/i18n/config';
import { getDictionary, type Dictionary } from '@/lib/i18n/get-dictionary';

type LocationDrawerCopy = {
  locationDrawer: Dictionary['admin']['delivery']['locationDrawer'];
  common: Dictionary['admin']['common'];
};

type DeliveryLocationDrawerProps = {
  locale: string;
  open: boolean;
  onClose: () => void;
  location?: AdminDeliveryLocation | null;
  copy: LocationDrawerCopy;
};

type LocaleDrafts = Record<Locale, DeliveryLocationTranslation>;

function emptyDrafts(): LocaleDrafts {
  return {
    hy: { ...EMPTY_DELIVERY_LOCATION_TRANSLATION },
    en: { ...EMPTY_DELIVERY_LOCATION_TRANSLATION },
    ru: { ...EMPTY_DELIVERY_LOCATION_TRANSLATION },
  };
}

function draftsFromLocation(location: AdminDeliveryLocation | null): LocaleDrafts {
  if (!location) return emptyDrafts();
  const drafts = emptyDrafts();
  for (const loc of locales) {
    drafts[loc] = {
      city: location.translations[loc]?.city?.trim() || '',
      area: location.translations[loc]?.area?.trim() || '',
    };
  }
  // Legacy rows without translations: seed current UI locale fields from denormalized columns.
  if (!locales.some((loc) => drafts[loc].city && drafts[loc].area)) {
    drafts.hy = { city: location.city, area: location.area };
    drafts.en = { city: location.city, area: location.area };
    drafts.ru = { city: location.city, area: location.area };
  }
  return drafts;
}

type DeliveryLocationFormProps = {
  locale: string;
  location: AdminDeliveryLocation | null;
  onClose: () => void;
  copy: LocationDrawerCopy;
};

function DeliveryLocationForm({ locale, location, onClose, copy }: DeliveryLocationFormProps) {
  const router = useRouter();
  const isEdit = location != null;
  const [activeLocale, setActiveLocale] = useState<Locale>('hy');
  const [drafts, setDrafts] = useState<LocaleDrafts>(() => draftsFromLocation(location));
  const [priceAmount, setPriceAmount] = useState(location ? String(location.priceAmount) : '');
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    setActiveLocale('hy');
    setDrafts(draftsFromLocation(location));
    setPriceAmount(location ? String(location.priceAmount) : '');
    setError(null);
  }, [location]);

  const draft = drafts[activeLocale];
  const tabFields = getDictionary(activeLocale).admin.delivery.locationDrawer;

  function updateDraft(patch: Partial<DeliveryLocationTranslation>): void {
    setDrafts((current) => ({
      ...current,
      [activeLocale]: { ...current[activeLocale], ...patch },
    }));
  }

  return (
    <form
      className="flex min-h-0 flex-1 flex-col"
      onSubmit={(event) => {
        event.preventDefault();

        const payload = {
          priceAmount: Number(priceAmount),
          translations: drafts,
        };

        startTransition(async () => {
          setError(null);
          const result =
            isEdit && location
              ? await updateDeliveryLocationAction(locale, location.id, payload)
              : await createDeliveryLocationAction(locale, payload);

          if (!result.ok) {
            setError(result.error.message);
            return;
          }

          onClose();
          router.refresh();
        });
      }}
    >
      <div className="flex-1 space-y-8 overflow-y-auto px-5 py-5">
        <AdminLocaleTabs
          label={tabFields.translations}
          active={activeLocale}
          onChange={setActiveLocale}
        />

        <label>
          <span className={ADMIN_LABEL}>{tabFields.city}</span>
          <input
            value={draft.city}
            onChange={(event) => updateDraft({ city: event.target.value })}
            placeholder={tabFields.cityPlaceholder}
            required={activeLocale === 'hy'}
            className={ADMIN_INPUT}
            disabled={isPending}
          />
        </label>

        <label>
          <span className={ADMIN_LABEL}>{tabFields.area}</span>
          <input
            value={draft.area}
            onChange={(event) => updateDraft({ area: event.target.value })}
            placeholder={tabFields.areaPlaceholder}
            required={activeLocale === 'hy'}
            className={ADMIN_INPUT}
            disabled={isPending}
          />
        </label>

        <label>
          <span className={ADMIN_LABEL}>{copy.locationDrawer.priceAmd}</span>
          <input
            type="number"
            min={0}
            step={1}
            required
            value={priceAmount}
            onChange={(event) => setPriceAmount(event.target.value)}
            placeholder={copy.locationDrawer.pricePlaceholder}
            className={ADMIN_INPUT}
            disabled={isPending}
          />
        </label>

        {error ? <p className="text-sm text-red-700">{error}</p> : null}
      </div>

      <div className="flex items-center gap-4 border-t border-gray-200 px-5 py-4">
        <Button type="submit" disabled={isPending}>
          {isPending ? copy.common.saving : copy.common.save}
        </Button>
        <button
          type="button"
          onClick={onClose}
          className="text-sm font-medium text-gray-600 hover:text-gray-900"
        >
          {copy.common.cancel}
        </button>
      </div>
    </form>
  );
}

export function DeliveryLocationDrawer({
  locale,
  open,
  onClose,
  location = null,
  copy,
}: DeliveryLocationDrawerProps) {
  const formKey = location?.id ?? 'new';

  return (
    <SideSheet
      open={open}
      onClose={onClose}
      ariaLabel={location ? copy.locationDrawer.editAria : copy.locationDrawer.addAria}
      variant="admin"
      panelClassName="w-[min(100%,calc(100%-2.75rem))] sm:w-[min(28rem,42%)]"
    >
      <div className="shrink-0 border-b-2 border-[#1e1e1e]/10 px-5 py-4 sm:px-6">
        <h2 className="font-display text-2xl leading-[0.95] text-[#1e1e1e] uppercase sm:text-3xl">
          {location ? copy.locationDrawer.editTitle : copy.locationDrawer.addTitle}
        </h2>
      </div>

      <DeliveryLocationForm
        key={formKey}
        locale={locale}
        location={location}
        onClose={onClose}
        copy={copy}
      />
    </SideSheet>
  );
}
