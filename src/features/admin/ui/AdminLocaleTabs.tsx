'use client';

import { LayoutGroup, motion, useReducedMotion } from 'motion/react';

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
  const reduceMotion = useReducedMotion() ?? false;

  return (
    <div>
      {hideLabel ? null : (
        <p className="mb-2 text-xs font-semibold tracking-wide text-gray-500 uppercase">{label}</p>
      )}
      <div className="flex flex-wrap gap-2" role="tablist" aria-label={label}>
        <LayoutGroup id="admin-locale-tabs">
          {locales.map((loc) => {
            const selected = loc === active;
            return (
              <button
                key={loc}
                type="button"
                role="tab"
                aria-selected={selected}
                onClick={() => onChange(loc)}
                className={`relative rounded-xl px-3 py-1.5 text-sm font-medium transition-colors duration-300 ${
                  selected
                    ? 'text-white'
                    : 'border border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
                }`}
              >
                {selected ? (
                  <motion.span
                    layoutId="admin-locale-tab-pill"
                    className="absolute inset-0 rounded-xl bg-gray-900"
                    transition={
                      reduceMotion ? { duration: 0 } : { type: 'spring', stiffness: 380, damping: 34 }
                    }
                  />
                ) : null}
                <span className="relative z-[1]">{localeLabels[loc]}</span>
              </button>
            );
          })}
        </LayoutGroup>
      </div>
    </div>
  );
}
