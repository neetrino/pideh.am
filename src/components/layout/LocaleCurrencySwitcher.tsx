'use client';

import { AnimatePresence, LayoutGroup, motion, useReducedMotion } from 'motion/react';
import { ChevronDown, Globe } from 'lucide-react';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useId, useRef, useState, useTransition } from 'react';

import { setCurrencyAction } from '@/features/preferences/set-currency-action';
import type { Locale } from '@/lib/i18n/config';
import { localeLabels, locales } from '@/lib/i18n/config';
import type { Currency } from '@/lib/money/currency';
import { currencies } from '@/lib/money/currency';

const HOVER_CLOSE_DELAY_MS = 140;

/** Short labels for the navbar trigger (e.g. `AMD / Հայ`). */
const localeShortLabels: Record<Locale, string> = {
  hy: 'Հայ',
  en: 'EN',
  ru: 'RU',
};

/** Compact codes inside the mobile menu tracks. */
const embeddedLocaleLabels: Record<Locale, string> = {
  hy: 'ՀԱՅ',
  en: 'EN',
  ru: 'РУС',
};

type LocaleCurrencySwitcherProps = {
  locale: Locale;
  currency: Currency;
  currencyLabel: string;
  languageLabel: string;
  /** Navbar pill: globe, locale, currency, chevron. */
  compact?: boolean;
  /** Always-open columns inside the mobile menu, instead of a floating dropdown. */
  embedded?: boolean;
};

function replaceLocaleInPath(pathname: string, nextLocale: Locale): string {
  const segments = pathname.split('/');
  if (segments.length > 1) {
    segments[1] = nextLocale;
    return segments.join('/') || `/${nextLocale}`;
  }
  return `/${nextLocale}`;
}

type SwitcherOptionProps = {
  selected: boolean;
  disabled?: boolean;
  layoutId: string;
  reduceMotion: boolean;
  onClick: () => void;
  children: React.ReactNode;
  ariaLabel?: string;
};

function SwitcherOption({
  selected,
  disabled,
  layoutId,
  reduceMotion,
  onClick,
  children,
  ariaLabel,
}: SwitcherOptionProps) {
  return (
    <button
      type="button"
      disabled={disabled}
      aria-label={ariaLabel}
      className={`relative flex w-full justify-center whitespace-nowrap rounded-full px-3 py-1.5 text-center text-sm transition-colors ${
        selected ? 'font-bold text-[#1e1e1e]' : 'font-medium text-[#1e1e1e]/45 hover:text-[#1e1e1e]'
      }`}
      onClick={onClick}
    >
      {selected ? (
        <motion.span
          layoutId={layoutId}
          className="absolute inset-0 rounded-full bg-[#ffd54a]"
          transition={
            reduceMotion ? { duration: 0 } : { type: 'spring', stiffness: 420, damping: 32 }
          }
        />
      ) : null}
      <span className="relative z-[1]">{children}</span>
    </button>
  );
}

function EmbeddedChoice({
  selected,
  disabled,
  onClick,
  children,
  ariaLabel,
  layoutId,
  reduceMotion,
}: {
  selected: boolean;
  disabled?: boolean;
  onClick: () => void;
  children: React.ReactNode;
  ariaLabel?: string;
  layoutId: string;
  reduceMotion: boolean;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      aria-pressed={selected}
      aria-label={ariaLabel}
      onClick={onClick}
      className={`relative flex min-w-0 flex-1 items-center justify-center rounded-full px-1 py-1.5 text-[11px] leading-none tracking-wide transition-colors duration-300 ${
        selected ? 'font-bold text-[#1e1e1e]' : 'font-semibold text-[#1e1e1e]/40'
      }`}
    >
      {selected ? (
        <motion.span
          layoutId={layoutId}
          className="absolute inset-0 rounded-full bg-white shadow-[0_1px_3px_rgba(30,30,30,0.14)]"
          transition={reduceMotion ? { duration: 0 } : { type: 'spring', stiffness: 420, damping: 32 }}
        />
      ) : null}
      <span className="relative z-[1]">{children}</span>
    </button>
  );
}

function EmbeddedTrack({
  label,
  layoutId,
  children,
}: {
  label: string;
  layoutId: string;
  children: React.ReactNode;
}) {
  return (
    <div className="min-w-0 flex-1">
      <p className="mb-1.5 px-1 text-xs font-medium text-[#1e1e1e]/45">{label}</p>
      <LayoutGroup id={layoutId}>
        <div className="flex items-center rounded-full bg-[#f1f1f1] p-1">{children}</div>
      </LayoutGroup>
    </div>
  );
}

/**
 * Combined currency + language control matching MaMarie navbar:
 * pill trigger `AMD / Հայ`, two-column dropdown.
 */
function CurrencyLanguageGrid({
  locale,
  currency,
  currencyLabel,
  languageLabel,
  pending,
  reduceMotion,
  onCurrency,
  onLocale,
  fill,
}: {
  locale: Locale;
  currency: Currency;
  currencyLabel: string;
  languageLabel: string;
  pending: boolean;
  reduceMotion: boolean;
  onCurrency: (next: Currency) => void;
  onLocale: (next: Locale) => void;
  fill: boolean;
}) {
  return (
    <div
      className={`flex overflow-hidden rounded-[22px] border-2 border-[#1e1e1e] bg-[#fff8e7] py-2.5 shadow-[6px_6px_0_#1e1e1e] ${
        fill ? 'w-full shadow-none' : 'w-max'
      }`}
    >
      <div className={`border-r-2 border-[#1e1e1e]/12 ${fill ? 'min-w-0 flex-1' : 'w-max'}`}>
        <p className="whitespace-nowrap px-3 pb-1.5 text-center text-[10px] font-extrabold tracking-[0.16em] text-[#ff6b00] uppercase">
          {currencyLabel}
        </p>
        <ul role="listbox" aria-label={currencyLabel} className="px-1.5">
          {currencies.map((code) => (
            <li key={code} role="option" aria-selected={code === currency}>
              <SwitcherOption
                selected={code === currency}
                disabled={pending}
                layoutId="pideh-currency-pill"
                reduceMotion={reduceMotion}
                onClick={() => onCurrency(code)}
              >
                {code}
              </SwitcherOption>
            </li>
          ))}
        </ul>
      </div>
      <div className={fill ? 'min-w-0 flex-1' : 'w-max'}>
        <p className="whitespace-nowrap px-3 pb-1.5 text-center text-[10px] font-extrabold tracking-[0.16em] text-[#ff6b00] uppercase">
          {languageLabel}
        </p>
        <ul role="listbox" aria-label={languageLabel} className="px-1.5">
          {locales.map((code) => (
            <li key={code} role="option" aria-selected={code === locale}>
              <SwitcherOption
                selected={code === locale}
                layoutId="pideh-locale-pill"
                reduceMotion={reduceMotion}
                ariaLabel={`${localeShortLabels[code]}: ${localeLabels[code]}`}
                onClick={() => onLocale(code)}
              >
                {localeLabels[code]}
              </SwitcherOption>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

export function LocaleCurrencySwitcher({
  locale,
  currency,
  currencyLabel,
  languageLabel,
  compact = false,
  embedded = false,
}: LocaleCurrencySwitcherProps) {
  const router = useRouter();
  const pathname = usePathname() ?? `/${locale}`;
  const [pending, startTransition] = useTransition();
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const menuId = useId();
  const reduceMotion = useReducedMotion() ?? false;

  function clearCloseTimer(): void {
    if (closeTimerRef.current !== null) {
      clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }
  }

  function openMenu(): void {
    clearCloseTimer();
    setOpen(true);
  }

  function closeMenu(): void {
    clearCloseTimer();
    setOpen(false);
  }

  function scheduleClose(): void {
    clearCloseTimer();
    closeTimerRef.current = setTimeout(() => {
      setOpen(false);
      closeTimerRef.current = null;
    }, HOVER_CLOSE_DELAY_MS);
  }

  useEffect(() => {
    return () => clearCloseTimer();
  }, []);

  useEffect(() => {
    if (!open) return;

    function handlePointerDown(event: MouseEvent): void {
      if (!rootRef.current?.contains(event.target as Node)) {
        closeMenu();
      }
    }

    function handleKeyDown(event: KeyboardEvent): void {
      if (event.key === 'Escape') closeMenu();
    }

    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
    // closeMenu is a stable event helper declared in the component body.
    // eslint-disable-next-line react-hooks/exhaustive-deps -- see closeMenu
  }, [open]);

  function selectCurrency(next: Currency): void {
    if (next === currency) {
      closeMenu();
      return;
    }
    startTransition(async () => {
      await setCurrencyAction(next);
      closeMenu();
      router.refresh();
    });
  }

  function selectLocale(next: Locale): void {
    if (next === locale) {
      closeMenu();
      return;
    }
    closeMenu();
    router.push(replaceLocaleInPath(pathname, next));
  }

  if (embedded) {
    return (
      <div className="flex items-start gap-4">
        <EmbeddedTrack label={languageLabel} layoutId="embedded-locale">
          {locales.map((code) => (
            <EmbeddedChoice
              key={code}
              layoutId="embedded-locale-pill"
              reduceMotion={reduceMotion}
              selected={code === locale}
              ariaLabel={`${embeddedLocaleLabels[code]}: ${localeLabels[code]}`}
              onClick={() => selectLocale(code)}
            >
              {embeddedLocaleLabels[code]}
            </EmbeddedChoice>
          ))}
        </EmbeddedTrack>
        <EmbeddedTrack label={currencyLabel} layoutId="embedded-currency">
          {currencies.map((code) => (
            <EmbeddedChoice
              key={code}
              layoutId="embedded-currency-pill"
              reduceMotion={reduceMotion}
              selected={code === currency}
              disabled={pending}
              onClick={() => selectCurrency(code)}
            >
              {code}
            </EmbeddedChoice>
          ))}
        </EmbeddedTrack>
      </div>
    );
  }

  return (
    <div
      ref={rootRef}
      className={open ? 'relative z-[300]' : 'relative z-0'}
      onMouseEnter={openMenu}
      onMouseLeave={scheduleClose}
    >
      <button
        type="button"
        className={
          compact
            ? 'flex h-11 items-center gap-2 rounded-full bg-[#ffd54a] px-4 text-[15px] leading-none font-bold text-[#1a3a28] shadow-[0_8px_30px_rgba(0,0,0,0.08)]'
            : 'flex h-9 shrink-0 items-center gap-1 rounded-full border-2 border-[#1e1e1e] bg-[#fff8e7] py-0 pr-2.5 pl-3 text-[#1e1e1e] shadow-[2px_2px_0_#1e1e1e] transition hover:bg-[#ffd54a]'
        }
        aria-expanded={open}
        aria-haspopup="dialog"
        aria-controls={menuId}
        aria-label={`${currency} / ${localeShortLabels[locale]}`}
        onClick={() => (open ? closeMenu() : openMenu())}
      >
        {compact ? (
          <>
            <Globe className="size-[18px] shrink-0" strokeWidth={2.25} aria-hidden />
            <span className="font-noto-armenian whitespace-nowrap tracking-normal">
              {localeShortLabels[locale]}
              <span className="px-1 font-semibold" aria-hidden>
                /
              </span>
              {currency}
            </span>
            <ChevronDown
              className={`size-4 shrink-0 transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] ${open ? 'rotate-180' : ''}`}
              aria-hidden
            />
          </>
        ) : (
          <>
            <span className="flex min-w-0 flex-1 items-center justify-center whitespace-nowrap text-[15px] font-bold leading-none tabular-nums">
              <span>{currency}</span>
              <span className="inline-block w-[2px]" aria-hidden />
              <span>/</span>
              <span className="inline-block w-[2px]" aria-hidden />
              <span className="font-noto-armenian font-semibold tracking-normal">
                {localeShortLabels[locale]}
              </span>
            </span>
            <ChevronDown
              className={`h-4 w-4 shrink-0 text-[#1e1e1e] transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] ${open ? 'rotate-180' : ''}`}
              aria-hidden
            />
          </>
        )}
      </button>

      <AnimatePresence>
        {open ? (
          <motion.div
            id={menuId}
            role="dialog"
            aria-label={`${currencyLabel} / ${languageLabel}`}
            initial={reduceMotion ? false : { opacity: 0, y: -8, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={reduceMotion ? { opacity: 0 } : { opacity: 0, y: -8, scale: 0.96 }}
            transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
            className="absolute right-0 top-full z-[310] origin-top pt-2"
          >
            <LayoutGroup>
              <CurrencyLanguageGrid
                locale={locale}
                currency={currency}
                currencyLabel={currencyLabel}
                languageLabel={languageLabel}
                pending={pending}
                reduceMotion={reduceMotion}
                onCurrency={selectCurrency}
                onLocale={selectLocale}
                fill={false}
              />
            </LayoutGroup>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
