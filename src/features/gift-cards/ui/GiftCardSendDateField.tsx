'use client';

import { Calendar, ChevronLeft, ChevronRight } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

import {
  buildMonthCells,
  formatCalendarDate,
  monthLabel,
  parseYmd,
  weekdayLabels,
} from '@/features/checkout/ui/delivery-slot-calendar';
import { formatYerevanDate } from '@/features/delivery/domain/delivery-schedule';

type GiftCardSendDateFieldProps = {
  locale: string;
  name: string;
  disabled?: boolean;
  placeholder: string;
};

const NAV_BUTTON =
  'inline-flex size-7 items-center justify-center rounded-full border border-[#ff6b00]/25 bg-white text-[#ff6b00] transition-colors hover:bg-[#ffd54a]';

function dayClass(isSelected: boolean, isToday: boolean): string {
  if (isSelected) return 'bg-[#ff6b00] font-bold text-white';
  if (isToday) return 'bg-[#ffd54a] font-bold text-[#1e1e1e]';
  return 'font-medium text-[#1e1e1e] hover:bg-[#fff4cc]';
}

function shiftView(
  year: number,
  monthIndex: number,
  delta: number,
): { year: number; monthIndex: number } {
  const next = new Date(Date.UTC(year, monthIndex + delta, 1));
  return { year: next.getUTCFullYear(), monthIndex: next.getUTCMonth() };
}

/** Custom date + time field. Value is `YYYY-MM-DDTHH:mm` for the purchase form. */
export function GiftCardSendDateField({
  locale,
  name,
  disabled = false,
  placeholder,
}: GiftCardSendDateFieldProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [date, setDate] = useState('');
  const [time, setTime] = useState('12:00');
  const today = formatYerevanDate(new Date());
  const anchor = parseYmd(date || today);
  const [viewYear, setViewYear] = useState(anchor.year);
  const [viewMonth, setViewMonth] = useState(anchor.monthIndex);
  const value = date ? `${date}T${time}` : '';

  useEffect(() => {
    if (!open) return;
    function onPointerDown(event: MouseEvent): void {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    }
    function onKeyDown(event: KeyboardEvent): void {
      if (event.key === 'Escape') setOpen(false);
    }
    document.addEventListener('mousedown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('mousedown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open]);

  function openCalendar(): void {
    const parts = parseYmd(date || today);
    setViewYear(parts.year);
    setViewMonth(parts.monthIndex);
    setOpen((current) => !current);
  }

  const cells = buildMonthCells(viewYear, viewMonth);
  const hours = Array.from({ length: 24 }, (_, hour) => String(hour).padStart(2, '0'));
  const minutes = ['00', '15', '30', '45'];
  const [hour = '12', minute = '00'] = time.split(':');

  return (
    <div ref={rootRef} className="relative">
      <input type="hidden" name={name} value={value} />
      <button
        type="button"
        disabled={disabled}
        aria-expanded={open}
        aria-haspopup="dialog"
        onClick={openCalendar}
        className="flex h-11 w-full items-center justify-between gap-3 rounded-lg border border-gray-200 px-3 text-left text-sm disabled:opacity-50"
      >
        <span className={date ? 'text-[#1e1e1e]' : 'text-[#1e1e1e]/40'}>
          {date ? `${formatCalendarDate(date, locale)} ${time}` : placeholder}
        </span>
        <Calendar className="size-4 shrink-0 text-[#ff6b00]" aria-hidden />
      </button>

      {open ? (
        <div
          role="dialog"
          aria-label={placeholder}
          className="absolute z-30 mt-2 w-full rounded-[22px] border border-[#ff6b00]/15 bg-white p-3 shadow-lg"
        >
          <div className="mb-1 flex items-center justify-between gap-1">
            <button
              type="button"
              className={NAV_BUTTON}
              aria-label={placeholder}
              onClick={() => {
                const next = shiftView(viewYear, viewMonth, -1);
                setViewYear(next.year);
                setViewMonth(next.monthIndex);
              }}
            >
              <ChevronLeft className="size-3.5" aria-hidden />
            </button>
            <p className="font-display text-sm leading-none text-[#1e1e1e] uppercase">
              {monthLabel(viewYear, viewMonth, locale)}
            </p>
            <button
              type="button"
              className={NAV_BUTTON}
              aria-label={placeholder}
              onClick={() => {
                const next = shiftView(viewYear, viewMonth, 1);
                setViewYear(next.year);
                setViewMonth(next.monthIndex);
              }}
            >
              <ChevronRight className="size-3.5" aria-hidden />
            </button>
          </div>
          <div className="grid grid-cols-7 text-center">
            {weekdayLabels(locale).map((label) => (
              <div key={label} className="py-1 text-[10px] font-bold text-[#1e1e1e]/45">
                {label}
              </div>
            ))}
            {cells.map((cell, index) =>
              cell ? (
                <button
                  key={cell}
                  type="button"
                  onClick={() => setDate(cell)}
                  className={`mx-auto flex size-8 items-center justify-center rounded-full text-xs transition-colors ${dayClass(date === cell, cell === today)}`}
                >
                  {Number(cell.slice(-2))}
                </button>
              ) : (
                <div key={`blank-${index}`} className="size-8" />
              ),
            )}
          </div>
          <div className="mt-3 flex gap-2">
            <select
              aria-label={placeholder}
              value={hour}
              onChange={(event) => setTime(`${event.target.value}:${minute}`)}
              className="h-9 flex-1 rounded-lg border border-gray-200 px-2 text-sm"
            >
              {hours.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
            <select
              aria-label={placeholder}
              value={minutes.includes(minute) ? minute : '00'}
              onChange={(event) => setTime(`${hour}:${event.target.value}`)}
              className="h-9 flex-1 rounded-lg border border-gray-200 px-2 text-sm"
            >
              {minutes.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </div>
        </div>
      ) : null}
    </div>
  );
}
