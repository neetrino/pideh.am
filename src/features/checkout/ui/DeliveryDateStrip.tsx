'use client';

import { useRef, useState } from 'react';

import { monthLabel, parseYmd, weekdayLabels } from '@/features/checkout/ui/delivery-slot-calendar';

type DeliveryDateStripProps = {
  locale: string;
  dates: readonly string[];
  value: string;
  onChange: (date: string) => void;
};

function toYmd(year: number, monthIndex: number, day: number): string {
  return `${year}-${String(monthIndex + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

function mondayOf(date: string): string {
  const { year, monthIndex, day } = parseYmd(date);
  const utc = new Date(Date.UTC(year, monthIndex, day));
  const weekday = utc.getUTCDay();
  const delta = weekday === 0 ? -6 : 1 - weekday;
  utc.setUTCDate(utc.getUTCDate() + delta);
  return toYmd(utc.getUTCFullYear(), utc.getUTCMonth(), utc.getUTCDate());
}

function addDays(date: string, amount: number): string {
  const { year, monthIndex, day } = parseYmd(date);
  const utc = new Date(Date.UTC(year, monthIndex, day));
  utc.setUTCDate(utc.getUTCDate() + amount);
  return toYmd(utc.getUTCFullYear(), utc.getUTCMonth(), utc.getUTCDate());
}

function buildWeeks(dates: readonly string[]): string[][] {
  if (dates.length === 0) {
    return [];
  }
  const sorted = [...dates].sort();
  const first = sorted[0];
  const last = sorted[sorted.length - 1];
  if (!first || !last) {
    return [];
  }
  const weeks: string[][] = [];
  let cursor = mondayOf(first);
  const end = mondayOf(last);
  while (cursor <= end) {
    weeks.push(Array.from({ length: 7 }, (_, index) => addDays(cursor, index)));
    cursor = addDays(cursor, 7);
  }
  return weeks;
}

/** One calendar week at a time. Swipe sideways to the next week. */
export function DeliveryDateStrip({ locale, dates, value, onChange }: DeliveryDateStripProps) {
  const available = new Set(dates);
  const weeks = buildWeeks(dates);
  const initialWeek = Math.max(
    0,
    weeks.findIndex((week) => week.includes(value)),
  );
  const [weekIndex, setWeekIndex] = useState(initialWeek);
  const [dragX, setDragX] = useState(0);
  const [glide, setGlide] = useState(false);
  const dragStartX = useRef(0);
  const dragStartAt = useRef(0);
  const dragging = useRef(false);
  const weekdays = weekdayLabels(locale);
  const visibleWeek = weeks[weekIndex] ?? weeks[0] ?? [];
  const monthSource = visibleWeek.find((date) => available.has(date)) ?? visibleWeek[3] ?? value;
  const weekCount = Math.max(weeks.length, 1);
  const monthParts = parseYmd(monthSource || value || '2026-01-01');

  function endDrag(endX: number): void {
    if (!dragging.current) {
      return;
    }
    dragging.current = false;
    const delta = endX - dragStartX.current;
    const elapsed = Math.max(Date.now() - dragStartAt.current, 1);
    const velocity = delta / elapsed;
    let next = weekIndex;
    if (delta < -24 || velocity < -0.35) {
      next += 1;
    } else if (delta > 24 || velocity > 0.35) {
      next -= 1;
    }
    next = Math.min(weeks.length - 1, Math.max(0, next));
    setGlide(true);
    setDragX(0);
    setWeekIndex(next);
  }

  return (
    <div className="-mt-1 pb-2" onPointerDown={(event) => event.stopPropagation()}>
      <p className="mb-4 text-center text-base font-semibold text-[#1e1e1e]">
        {monthLabel(monthParts.year, monthParts.monthIndex, locale)}
      </p>
      <div
        className="overflow-hidden"
        style={{ touchAction: 'none' }}
        onPointerDown={(event) => {
          event.stopPropagation();
          event.currentTarget.setPointerCapture(event.pointerId);
          dragging.current = true;
          dragStartX.current = event.clientX;
          dragStartAt.current = Date.now();
          setGlide(false);
        }}
        onPointerMove={(event) => {
          if (!dragging.current) {
            return;
          }
          setDragX(event.clientX - dragStartX.current);
        }}
        onPointerUp={(event) => endDrag(event.clientX)}
        onPointerCancel={() => endDrag(dragStartX.current)}
      >
        <div
          className="flex"
          style={{
            width: `${weekCount * 100}%`,
            transform: `translate3d(calc(${(-weekIndex * 100) / weekCount}% + ${dragX}px), 0, 0)`,
            transition: glide ? 'transform 220ms cubic-bezier(0.22, 1, 0.36, 1)' : 'none',
          }}
        >
          {weeks.map((week) => (
            <div
              key={week[0]}
              className="grid shrink-0 grid-cols-7"
              style={{ width: `${100 / weekCount}%` }}
            >
              {week.map((date) => {
                const bookable = available.has(date);
                const selected = date === value;
                const { day, monthIndex } = parseYmd(date);
                const weekday = new Date(Date.UTC(parseYmd(date).year, monthIndex, day)).getUTCDay();
                const mondayFirst = weekday === 0 ? 6 : weekday - 1;
                return (
                  <button
                    key={date}
                    type="button"
                    disabled={!bookable}
                    onClick={() => onChange(date)}
                    className="flex flex-col items-center disabled:opacity-30"
                  >
                    <span
                      className={`mb-2 text-xs font-semibold ${selected ? 'text-[#1e1e1e]' : 'text-[#1e1e1e]/40'}`}
                    >
                      {weekdays[mondayFirst]}
                    </span>
                    <span
                      className={`flex h-10 w-10 items-center justify-center rounded-full text-base font-semibold ${
                        selected ? 'bg-[#ff6b00] text-white' : 'bg-[#f3f4f6] text-[#1e1e1e]/55'
                      }`}
                    >
                      {day}
                    </span>
                  </button>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
