'use client';

import { Calendar, ChevronLeft, ChevronRight } from 'lucide-react';
import { useMemo, useState } from 'react';

import { DeliverySlotMobileSchedule } from '@/features/checkout/ui/DeliverySlotMobileSchedule';
import {
  buildMonthCells,
  monthLabel,
  parseYmd,
  startOfMonthYmd,
  weekdayLabels,
} from '@/features/checkout/ui/delivery-slot-calendar';
import {
  formatDeliverySlotSnapshot,
  formatYerevanDate,
  listAvailableDeliveryDays,
  type DeliveryScheduleSettings,
  type SelectedDeliverySlot,
} from '@/features/delivery/domain/delivery-schedule';

type DeliverySlotPickerLabels = {
  title: string;
  deliverTo: string;
  approximatelyOneHour: string;
  change: string;
  useAsap: string;
  pickDate: string;
  pickTime: string;
  deliveryDay: string;
  deliveryTime: string;
  timeHint: string;
  noSlots: string;
  prevMonth: string;
  nextMonth: string;
  apply: string;
  close: string;
};

type DeliverySlotPickerProps = {
  schedule: DeliveryScheduleSettings;
  selected: SelectedDeliverySlot | null;
  onChange: (value: SelectedDeliverySlot | null) => void;
  disabled?: boolean;
  labels: DeliverySlotPickerLabels;
  locale: string;
};

const NAV_BUTTON =
  'inline-flex size-7 items-center justify-center rounded-full border border-[#ff6b00]/25 bg-white text-[#ff6b00] transition-colors hover:bg-[#ffd54a] disabled:cursor-not-allowed disabled:opacity-35';

function dayClass(isSelected: boolean, bookable: boolean, isToday: boolean): string {
  if (isSelected) {
    return 'bg-[#ff6b00] font-bold text-white';
  }
  if (bookable && isToday) {
    return 'bg-[#ffd54a] font-bold text-[#1e1e1e] hover:bg-[#ff6b00] hover:text-white';
  }
  if (bookable) {
    return 'bg-white font-bold text-[#1e1e1e] ring-1 ring-[#ff6b00]/30 hover:bg-[#ffd54a]';
  }
  return 'cursor-not-allowed font-medium text-[#1e1e1e]/22';
}

function SlotWaitArt({ hint }: { hint: string }) {
  return (
    <div className="mt-2 flex flex-1 flex-col items-center justify-center rounded-2xl bg-[#fff8e7] px-4 py-5 text-center">
      <svg viewBox="0 0 88 88" className="size-[4.5rem]" aria-hidden>
        <circle cx="44" cy="44" r="40" fill="#fffdf8" stroke="#ff6b00" strokeWidth="3" />
        <circle cx="44" cy="44" r="28" fill="#fff4d2" />
        <circle cx="44" cy="20" r="2.4" fill="#ff6b00" />
        <circle cx="44" cy="68" r="2.4" fill="#ff6b00" />
        <circle cx="20" cy="44" r="2.4" fill="#ff6b00" />
        <circle cx="68" cy="44" r="2.4" fill="#ff6b00" />
        <path d="M44 46 V30" stroke="#1e1e1e" strokeWidth="3" strokeLinecap="round" />
        <path d="M44 46 L57 52" stroke="#ff6b00" strokeWidth="3" strokeLinecap="round" />
        <circle cx="44" cy="46" r="3.2" fill="#ff6b00" />
      </svg>
      <p className="mt-3 max-w-[16rem] text-sm leading-snug text-[#1e1e1e]/70">{hint}</p>
    </div>
  );
}

function timeClass(isSelected: boolean): string {
  if (isSelected) {
    return 'border-[#ff6b00] bg-[#ff6b00] text-white';
  }
  return 'border-[#ff6b00]/20 bg-white text-[#1e1e1e] hover:border-[#ff6b00] hover:bg-[#ffd54a]';
}

/**
 * Collapsed ASAP (~1 hour) summary by default; Change opens calendar + slots.
 */
export function DeliverySlotPicker({
  schedule,
  selected,
  onChange,
  disabled = false,
  labels,
  locale,
}: DeliverySlotPickerProps) {
  const [isEditing, setIsEditing] = useState(false);
  const availableDays = useMemo(() => listAvailableDeliveryDays(schedule), [schedule]);
  const availableByDate = useMemo(() => {
    const map = new Map<string, (typeof availableDays)[number]>();
    for (const day of availableDays) {
      map.set(day.date, day);
    }
    return map;
  }, [availableDays]);

  const todayYmd = formatYerevanDate(new Date());
  const todayParts = parseYmd(todayYmd);
  const [viewYear, setViewYear] = useState(todayParts.year);
  const [viewMonth, setViewMonth] = useState(todayParts.monthIndex);
  const selectedDay = selected ? (availableByDate.get(selected.date) ?? null) : null;
  const weekdays = weekdayLabels(locale);
  const cells = buildMonthCells(viewYear, viewMonth);

  const maxDate = availableDays[availableDays.length - 1]?.date ?? todayYmd;
  const maxParts = parseYmd(maxDate);
  const viewMonthYmd = startOfMonthYmd(viewYear, viewMonth);
  const canPrev = viewMonthYmd > startOfMonthYmd(todayParts.year, todayParts.monthIndex);
  const canNext = viewMonthYmd < startOfMonthYmd(maxParts.year, maxParts.monthIndex);
  const summaryValue = selected
    ? formatDeliverySlotSnapshot(selected)
    : labels.approximatelyOneHour;

  function selectDate(date: string): void {
    const day = availableByDate.get(date);
    const first = day?.slots[0];
    if (!day || !first || disabled) {
      return;
    }
    onChange({ date, startTime: first.startTime, endTime: first.endTime });
  }

  function shiftMonth(delta: number): void {
    const next = new Date(Date.UTC(viewYear, viewMonth + delta, 1));
    setViewYear(next.getUTCFullYear());
    setViewMonth(next.getUTCMonth());
  }

  function selectAsap(): void {
    onChange(null);
    setIsEditing(false);
  }

  function selectSlot(slot: SelectedDeliverySlot): void {
    onChange(slot);
    setIsEditing(false);
  }

  return (
    <div className="space-y-3">
      <div className="mb-3 flex items-center justify-between gap-3">
        <h3 className="text-base font-bold text-[#1e1e1e]">{labels.title}</h3>
        <button
          type="button"
          disabled={disabled || availableDays.length === 0}
          onClick={() => setIsEditing((open) => !open)}
          className="shrink-0 text-sm font-semibold text-[#ff6b00] transition-opacity hover:opacity-80 disabled:opacity-40 sm:hidden"
        >
          {labels.change}
        </button>
      </div>

      <div className="flex items-center gap-3">
        <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-[#fff1e6]">
          <Calendar className="size-5 text-[#ff6b00]" aria-hidden />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm text-[#1e1e1e]">{labels.deliverTo}</p>
          <p className="truncate text-sm font-semibold text-[#1e1e1e]">{summaryValue}</p>
        </div>
        <button
          type="button"
          disabled={disabled || availableDays.length === 0}
          onClick={() => setIsEditing((open) => !open)}
          className="hidden h-10 shrink-0 items-center rounded-full bg-[#ff6b00] px-6 text-sm font-semibold text-white shadow-md transition-colors hover:bg-[#e85f00] disabled:cursor-not-allowed disabled:opacity-40 sm:inline-flex"
        >
          {labels.change}
        </button>
      </div>

      {availableDays.length === 0 ? (
        <p className="text-sm text-red-700">{labels.noSlots}</p>
      ) : null}

      {isEditing && availableDays.length > 0 ? (
        <>
          <DeliverySlotMobileSchedule
            locale={locale}
            disabled={disabled}
            asapLabel={labels.useAsap}
            datePlaceholder={labels.pickDate}
            timePlaceholder={labels.pickTime}
            dateTitle={labels.deliveryDay}
            timeTitle={labels.deliveryTime}
            applyLabel={labels.apply}
            closeLabel={labels.close}
            asapSelected={selected == null}
            days={availableDays}
            pickedDate={selected?.date ?? null}
            pickedSlot={
              selected
                ? {
                    startTime: selected.startTime,
                    endTime: selected.endTime,
                    label: `${selected.startTime}–${selected.endTime}`,
                  }
                : null
            }
            onAsap={selectAsap}
            onDateApplied={() => undefined}
            onTimeApplied={(date, slot) => {
              onChange({
                date,
                startTime: slot.startTime,
                endTime: slot.endTime,
              });
              setIsEditing(false);
            }}
          />
          <div className="hidden overflow-hidden rounded-[22px] border border-[#ff6b00]/15 bg-white sm:block">
          <div className="border-b border-[#ff6b00]/10 px-3 pt-3">
            <button
              type="button"
              disabled={disabled}
              onClick={selectAsap}
              className={`mb-3 inline-flex h-10 w-full items-center justify-center rounded-full px-4 text-sm font-bold transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${
                selected == null
                  ? 'bg-[#ff6b00] text-white'
                  : 'bg-[#fff8e7] text-[#1e1e1e] hover:bg-[#ffd54a]'
              }`}
            >
              {labels.useAsap}
            </button>
          </div>
          <div className="hidden items-stretch gap-3 p-3 sm:grid md:grid-cols-[15.5rem_minmax(0,1fr)]">
            <div className="rounded-2xl bg-[#fff8e7]/80 p-2">
              <p className="mb-2 font-display text-xs leading-none tracking-wide text-[#ff6b00] uppercase">
                {labels.pickDate}
              </p>
              <div className="mb-1 flex items-center justify-between gap-1">
                <button
                  type="button"
                  disabled={disabled || !canPrev}
                  onClick={() => shiftMonth(-1)}
                  className={NAV_BUTTON}
                  aria-label={labels.prevMonth}
                >
                  <ChevronLeft className="size-3.5" aria-hidden />
                </button>
                <p className="font-display text-sm leading-none text-[#1e1e1e] uppercase">
                  {monthLabel(viewYear, viewMonth, locale)}
                </p>
                <button
                  type="button"
                  disabled={disabled || !canNext}
                  onClick={() => shiftMonth(1)}
                  className={NAV_BUTTON}
                  aria-label={labels.nextMonth}
                >
                  <ChevronRight className="size-3.5" aria-hidden />
                </button>
              </div>
              <div className="grid grid-cols-7 text-center">
                {weekdays.map((label) => (
                  <div key={label} className="py-1 text-[10px] font-bold text-[#1e1e1e]/45">
                    {label}
                  </div>
                ))}
                {cells.map((date, index) =>
                  date ? (
                    <button
                      key={date}
                      type="button"
                      disabled={disabled || !availableByDate.has(date)}
                      onClick={() => selectDate(date)}
                      className={`mx-auto flex size-7 items-center justify-center rounded-full text-xs transition-colors ${dayClass(
                        selected?.date === date,
                        availableByDate.has(date),
                        selected == null && date === todayYmd,
                      )}`}
                    >
                      {Number(date.slice(-2))}
                    </button>
                  ) : (
                    <div key={`blank-${index}`} className="size-7" />
                  ),
                )}
              </div>
            </div>

            <div className="flex h-full flex-col">
              <p className="mb-2 font-display text-xs leading-none tracking-wide text-[#ff6b00] uppercase">
                {labels.pickTime}
              </p>
              {selectedDay ? (
                <div className="grid grid-cols-3 gap-1">
                  {selectedDay.slots.map((slot) => {
                    const isSelected =
                      selected?.startTime === slot.startTime &&
                      selected?.endTime === slot.endTime;
                    return (
                      <button
                        key={slot.label}
                        type="button"
                        disabled={disabled}
                        onClick={() =>
                          selectSlot({
                            date: selectedDay.date,
                            startTime: slot.startTime,
                            endTime: slot.endTime,
                          })
                        }
                        className={`h-7 rounded-full border px-1 text-[11px] font-semibold transition-colors ${timeClass(isSelected)}`}
                      >
                        {slot.label}
                      </button>
                    );
                  })}
                </div>
              ) : (
                <SlotWaitArt hint={labels.timeHint} />
              )}
            </div>
          </div>
        </div>
        </>
      ) : null}
    </div>
  );
}
