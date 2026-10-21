'use client';

import { useEffect, useId, useRef, useState, type ReactNode } from 'react';
import { ChevronDown } from 'lucide-react';

export const DROPDOWN_ANIMATION_MS = 280;

/** Shifts a panel so it stays inside the viewport, including its offset shadow. */
export function alignPanelToViewport(anchor: HTMLElement, panel: HTMLElement): void {
  const margin = 16;
  panel.style.right = 'auto';
  panel.style.left = '0px';
  const width = panel.getBoundingClientRect().width;
  const anchorBox = anchor.getBoundingClientRect();
  const maxLeft = window.innerWidth - margin - width;
  const desiredLeft = Math.min(Math.max(anchorBox.left, margin), Math.max(margin, maxLeft));
  panel.style.left = `${desiredLeft - anchorBox.left}px`;
}

export type SelectDropdownOption = {
  label: string;
  value: string;
};

type SelectDropdownProps = {
  name?: string;
  ariaLabel: string;
  value: string;
  /** When set, shows an empty-value row at the top of the list. */
  allLabel?: string;
  options: ReadonlyArray<SelectDropdownOption>;
  className?: string;
  disabled?: boolean;
  onValueChange: (value: string) => void;
  /** Wait for close animation before calling onValueChange. Default true. */
  deferChange?: boolean;
  /** Replaces the default trigger button contents and chrome. */
  trigger?: ReactNode;
  /** Keeps the field chrome and puts custom content beside the chevron. */
  triggerContent?: ReactNode;
  /**
   * `brand` — Pideh cream panel, ink border, offset shadow (storefront).
   * Default keeps the neutral admin/forms chrome.
   */
  tone?: 'default' | 'brand';
};

export function SelectDropdown({
  name,
  ariaLabel,
  value,
  allLabel,
  options,
  className = '',
  disabled = false,
  onValueChange,
  deferChange = true,
  trigger,
  triggerContent,
  tone = 'default',
}: SelectDropdownProps) {
  const [open, setOpen] = useState(false);
  const [elevated, setElevated] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const pendingChangeRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const listId = useId();
  const isBrand = tone === 'brand';

  const selectedLabel =
    options.find((option) => option.value === value)?.label ?? allLabel ?? value;

  useEffect(() => {
    return () => {
      if (pendingChangeRef.current) {
        clearTimeout(pendingChangeRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (open) {
      setElevated(true);
      return;
    }
    const timer = setTimeout(() => setElevated(false), DROPDOWN_ANIMATION_MS);
    return () => clearTimeout(timer);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const anchor = rootRef.current;
    const panel = panelRef.current;
    if (!anchor || !panel) return;

    function place(): void {
      if (anchor && panel) alignPanelToViewport(anchor, panel);
    }

    place();
    const frame = requestAnimationFrame(place);
    window.addEventListener('resize', place);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener('resize', place);
    };
  }, [open, options, allLabel]);

  useEffect(() => {
    if (!open) return;

    function handlePointerDown(event: MouseEvent): void {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent): void {
      if (event.key === 'Escape') setOpen(false);
    }

    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [open]);

  function selectValue(next: string): void {
    setOpen(false);
    if (!deferChange) {
      onValueChange(next);
      return;
    }
    if (pendingChangeRef.current) {
      clearTimeout(pendingChangeRef.current);
    }
    pendingChangeRef.current = setTimeout(() => {
      pendingChangeRef.current = null;
      onValueChange(next);
    }, DROPDOWN_ANIMATION_MS);
  }

  return (
    <div ref={rootRef} className={`relative ${elevated ? 'z-50' : 'z-0'} ${className}`}>
      {name ? <input type="hidden" name={name} value={value} /> : null}
      {triggerContent ? (
        <div className="flex h-11 w-full items-center gap-3 rounded-2xl border border-gray-200 bg-white px-4 pr-3 text-sm text-gray-900">
          <div className="min-w-0 flex-1">{triggerContent}</div>
          <button
            type="button"
            disabled={disabled}
            className="flex shrink-0 items-center outline-none disabled:opacity-50"
            aria-label={ariaLabel}
            aria-haspopup="listbox"
            aria-expanded={open}
            aria-controls={listId}
            onClick={() => setOpen((current) => !current)}
          >
            <ChevronDown
              className={`h-4 w-4 shrink-0 text-gray-400 transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] ${open ? 'rotate-180' : ''}`}
              aria-hidden
            />
          </button>
        </div>
      ) : (
      <button
        type="button"
        disabled={disabled}
        className={
          trigger
            ? 'w-full rounded-[30px] outline-none focus-visible:ring-2 focus-visible:ring-[#ff6b00] focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50'
            : 'flex h-11 w-full items-center justify-between gap-3 rounded-2xl border border-gray-200 bg-white px-4 pr-3 text-left text-sm text-gray-900 outline-none transition-colors hover:border-gray-300 disabled:cursor-not-allowed disabled:opacity-50'
        }
        aria-label={ariaLabel}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listId}
        onClick={() => setOpen((current) => !current)}
      >
        {trigger ?? (
          <>
            <span className="min-w-0 truncate">{selectedLabel}</span>
            <ChevronDown
              className={`h-4 w-4 shrink-0 text-gray-400 transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] ${open ? 'rotate-180' : ''}`}
              aria-hidden
            />
          </>
        )}
      </button>
      )}

      <div
        ref={panelRef}
        className={`absolute top-[calc(100%+0.5rem)] left-0 z-[100] grid transition-[grid-template-rows,opacity,transform] ease-[cubic-bezier(0.22,1,0.36,1)] ${
          isBrand ? 'w-max min-w-full max-w-[min(100vw-2rem,24rem)]' : 'w-full'
        } ${
          open
            ? 'translate-y-0 grid-rows-[1fr] opacity-100'
            : 'pointer-events-none -translate-y-1 grid-rows-[0fr] opacity-0'
        }`}
        style={{ transitionDuration: `${DROPDOWN_ANIMATION_MS}ms` }}
        aria-hidden={!open}
      >
        <div className={isBrand ? 'min-h-0 overflow-hidden pr-2 pb-2' : 'min-h-0 overflow-hidden'}>
          <div
            id={listId}
            role="listbox"
            aria-label={ariaLabel}
            className={
              isBrand
                ? 'max-h-72 overflow-y-auto rounded-[20px] border-2 border-[#1e1e1e] bg-[#fff8e7] p-1.5 shadow-[5px_5px_0_#1e1e1e]'
                : 'max-h-72 overflow-y-auto rounded-2xl border border-gray-100 bg-white py-2'
            }
          >
            {allLabel !== undefined ? (
              <SelectDropdownOptionRow
                label={allLabel}
                selected={value === ''}
                tone={tone}
                onSelect={() => selectValue('')}
              />
            ) : null}
            {options.map((option) => (
              <SelectDropdownOptionRow
                key={option.value}
                label={option.label}
                selected={value === option.value}
                tone={tone}
                onSelect={() => selectValue(option.value)}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

type SelectDropdownOptionRowProps = {
  label: string;
  selected: boolean;
  onSelect: () => void;
  tone?: 'default' | 'brand';
};

export function SelectDropdownOptionRow({
  label,
  selected,
  onSelect,
  tone = 'default',
}: SelectDropdownOptionRowProps) {
  const isBrand = tone === 'brand';

  return (
    <button
      type="button"
      role="option"
      aria-selected={selected}
      className={
        isBrand
          ? selected
            ? 'flex w-full items-center gap-3 rounded-[14px] px-3 py-2.5 text-left text-sm font-semibold whitespace-nowrap text-[#1e1e1e] transition-colors hover:bg-[#ff6b00]/12'
            : 'flex w-full items-center gap-3 rounded-[14px] px-3 py-2.5 text-left text-sm font-medium whitespace-nowrap text-[#1e1e1e] transition-colors hover:bg-[#ff6b00]/12'
          : 'flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm text-gray-800 hover:bg-gray-50'
      }
      onClick={onSelect}
    >
      <span
        className={
          selected
            ? isBrand
              ? 'flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-[5px] bg-[#ff6b00] text-white'
              : 'flex h-4 w-4 shrink-0 items-center justify-center rounded bg-[#ff6b00] text-white'
            : isBrand
              ? 'flex h-[18px] w-[18px] shrink-0 rounded-[5px] border border-[#1e1e1e]/15 bg-white'
              : 'flex h-4 w-4 shrink-0 rounded border border-gray-200 bg-white'
        }
        aria-hidden
      >
        {selected ? (
          <svg viewBox="0 0 12 12" className="h-3 w-3" fill="none">
            <path
              d="M2.5 6.2 4.8 8.5 9.5 3.5"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        ) : null}
      </span>
      <span className={isBrand ? 'shrink-0' : 'min-w-0 truncate'}>{label}</span>
    </button>
  );
}
