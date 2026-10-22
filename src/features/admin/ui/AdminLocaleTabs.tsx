'use client';

import { localeLabels, locales, type Locale } from '@/lib/i18n/config';

type AdminLocaleTabsProps = {
  label: string;
  /** Keeps `label` for assistive tech only. */
  hideLabel?: boolean;
  active: Locale;
  onChange: (locale: Locale) => void;
};

/** Language tabs for admin forms that store a separate copy per locale. */
export function AdminLocaleTabs({ label, hideLabel = false, active, onChange }: AdminLocaleTabsProps) {
  return (
    <div>
      {hideLabel ? null : (
        <p className="mb-2 text-xs font-semibold tracking-wide text-gray-500 uppercase">{label}</p>
      )}
      <div className="flex flex-wrap gap-2" role="tablist" aria-label={label}>
        {locales.map((loc) => {
          const selected = loc === active;
          return (
            <button
              key={loc}
              type="button"
              role="tab"
              aria-selected={selected}
              onClick={() => onChange(loc)}
              className={`rounded-xl px-3 py-1.5 text-sm font-medium transition-colors ${
                selected
                  ? 'bg-gray-900 text-white'
                  : 'border border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
              }`}
            >
              {localeLabels[loc]}
            </button>
          );
        })}
      </div>
    </div>
  );
}
