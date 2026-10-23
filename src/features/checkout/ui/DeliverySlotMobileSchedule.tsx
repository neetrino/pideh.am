'use client';

import { useMemo, useRef, useState } from 'react';

import { DeliveryDateStrip } from '@/features/checkout/ui/DeliveryDateStrip';
import {
  DeliverySlotWheelSheet,
  DeliverySlotWheels,
} from '@/features/checkout/ui/DeliverySlotWheelSheet';
import { parseYmd, shortMonthLabel } from '@/features/checkout/ui/delivery-slot-calendar';
import type { DeliveryDayAvailability } from '@/features/delivery/domain/delivery-schedule';

type Slot = { startTime: string; endTime: string; label: string };

type DeliverySlotMobileScheduleProps = {
  locale: string;
  disabled: boolean;
  asapLabel: string;
  datePlaceholder: string;
  timePlaceholder: string;
  dateTitle: string;
  timeTitle: string;
  applyLabel: string;
  closeLabel: string;
  asapSelected: boolean;
  days: readonly DeliveryDayAvailability[];
  pickedDate: string | null;
  pickedSlot: Slot | null;
  onAsap: () => void;
  onDateApplied: (date: string) => void;
  onTimeApplied: (date: string, slot: Slot) => void;
};

function formatClock(startTime: string): string {
  const [hour = '', minute = ''] = startTime.split(':');
  return `${hour} : ${minute}`;
}

function slotKey(slot: Slot): string {
  return `${slot.startTime}|${slot.endTime}`;
}

const BUTTON_CLASS =
  'w-full rounded-[15px] bg-[#ff6b00] px-4 py-2.5 text-center text-sm font-bold text-white transition-colors hover:bg-[#e85f00] disabled:opacity-40';

/** Phone schedule: ASAP, then date and time sheets. Time uses a wheel. */
export function DeliverySlotMobileSchedule({
  locale,
  disabled,
  asapLabel,
  datePlaceholder,
  timePlaceholder,
  dateTitle,
  timeTitle,
  applyLabel,
  closeLabel,
  asapSelected,
  days,
  pickedDate,
  pickedSlot,
  onAsap,
  onDateApplied,
  onTimeApplied,
}: DeliverySlotMobileScheduleProps) {
  const timeButtonRef = useRef<HTMLButtonElement>(null);
  const [dateOpen, setDateOpen] = useState(false);
  const [timeOpen, setTimeOpen] = useState(false);
  const [chosenDate, setChosenDate] = useState<string | null>(pickedDate);
  const [draftDate, setDraftDate] = useState(pickedDate ?? days[0]?.date ?? '');
  const [draftSlotKey, setDraftSlotKey] = useState<string | null>(null);

  const selectedDay = chosenDate ? (days.find((day) => day.date === chosenDate) ?? null) : null;
  const timeKeys = useMemo(() => (selectedDay?.slots ?? []).map(slotKey), [selectedDay]);

  const dateButtonText = chosenDate
    ? (() => {
        const part = parseYmd(chosenDate);
        return `${part.day} ${shortMonthLabel(part.monthIndex, locale)} ${part.year}`;
      })()
    : datePlaceholder;
  const timeButtonText = pickedSlot && pickedDate === chosenDate ? formatClock(pickedSlot.startTime) : timePlaceholder;
  const timeMissing = Boolean(chosenDate) && (!pickedSlot || pickedDate !== chosenDate);

  function openDate(): void {
    setDraftDate(chosenDate ?? days[0]?.date ?? '');
    setDateOpen(true);
  }

  function openTime(): void {
    if (!selectedDay || selectedDay.slots.length === 0) {
      openDate();
      return;
    }
    const current =
      pickedSlot &&
      selectedDay.slots.some(
        (slot) => slot.startTime === pickedSlot.startTime && slot.endTime === pickedSlot.endTime,
      )
        ? pickedSlot
        : selectedDay.slots[0];
    setDraftSlotKey(current ? slotKey(current) : null);
    setTimeOpen(true);
  }

  function applyDate(): void {
    setDateOpen(false);
    if (!draftDate) {
      return;
    }
    setChosenDate(draftDate);
    onDateApplied(draftDate);
    const slotMatches =
      pickedSlot != null && pickedDate === draftDate;
    if (!slotMatches) {
      window.requestAnimationFrame(() => {
        timeButtonRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      });
    }
  }

  function applyTime(): void {
    const slot = selectedDay?.slots.find((entry) => slotKey(entry) === draftSlotKey);
    setTimeOpen(false);
    if (slot && chosenDate) {
      onTimeApplied(chosenDate, slot);
    }
  }

  return (
    <div className="space-y-3 sm:hidden">
      <button
        type="button"
        disabled={disabled}
        onClick={() => {
          setChosenDate(null);
          onAsap();
        }}
        className={`${BUTTON_CLASS} ${asapSelected ? 'bg-[#e85f00]' : ''}`}
      >
        {asapLabel}
      </button>
      <div className="grid grid-cols-2 gap-3">
        <button
          type="button"
          disabled={disabled}
          onClick={openDate}
          className={`${BUTTON_CLASS} whitespace-pre-line`}
        >
          {dateButtonText}
        </button>
        <button
          ref={timeButtonRef}
          type="button"
          disabled={disabled || !chosenDate}
          onClick={openTime}
          data-checkout-field="deliveryTime"
          data-time-missing={timeMissing ? 'true' : 'false'}
          aria-invalid={timeMissing || undefined}
          className={`${BUTTON_CLASS} whitespace-pre-line ${
            timeMissing ? 'bg-red-600 ring-2 ring-inset ring-red-800 hover:bg-red-700' : ''
          }`}
        >
          {timeButtonText}
        </button>
      </div>

      <DeliverySlotWheelSheet
        open={dateOpen}
        title={dateTitle}
        applyLabel={applyLabel}
        closeLabel={closeLabel}
        onClose={() => setDateOpen(false)}
        onApply={applyDate}
      >
        <DeliveryDateStrip
          locale={locale}
          dates={days.map((day) => day.date)}
          value={draftDate || days[0]?.date || ''}
          onChange={setDraftDate}
        />
      </DeliverySlotWheelSheet>

      <DeliverySlotWheelSheet
        open={timeOpen}
        title={timeTitle}
        applyLabel={applyLabel}
        closeLabel={closeLabel}
        onClose={() => setTimeOpen(false)}
        onApply={applyTime}
      >
        {timeKeys.length > 0 ? (
          <DeliverySlotWheels
            value={{ time: draftSlotKey ?? timeKeys[0] ?? '' }}
            columns={[
              {
                name: 'time',
                options: timeKeys.map((key) => ({
                  value: key,
                  label: formatClock(key.split('|')[0] ?? ''),
                })),
              },
            ]}
            onChange={(next) => {
              if (next.time) {
                setDraftSlotKey(next.time);
              }
            }}
          />
        ) : null}
      </DeliverySlotWheelSheet>
    </div>
  );
}
