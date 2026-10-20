'use client';

import { useState } from 'react';

import { TimeField } from '@/components/ui/TimeField';
import { ADMIN_CHECKBOX, ADMIN_LABEL } from '@/features/admin/ui/admin-form-classes';
import { formatCalendarDate } from '@/features/checkout/ui/delivery-slot-calendar';
import { AdminDateField } from '@/features/delivery/ui/AdminDateField';
import type {
  DayHours,
  DeliveryScheduleSettings,
  IsoWeekday,
} from '@/features/delivery/domain/delivery-schedule';
import { timeToMinutes } from '@/features/delivery/domain/delivery-schedule';
import type { Dictionary } from '@/lib/i18n/get-dictionary';

const WEEKDAYS: IsoWeekday[] = [1, 2, 3, 4, 5, 6, 7];

type AdminDeliveryScheduleEditorProps = {
  locale: string;
  value: DeliveryScheduleSettings;
  onChange: (value: DeliveryScheduleSettings) => void;
  disabled?: boolean;
  copy: Dictionary['admin']['delivery']['schedule'];
};

function toHHmm(value: string): string {
  return value.trim().slice(0, 5);
}

function minutesToTime(total: number): string {
  const hours = Math.floor(total / 60);
  const minutes = total % 60;
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
}

/** Keeps close strictly after open for bookable days. */
function withValidOpenClose(
  hours: DayHours,
  patch: Partial<Pick<DayHours, 'openTime' | 'closeTime'>>,
): Pick<DayHours, 'openTime' | 'closeTime'> {
  const openTime = toHHmm(patch.openTime ?? hours.openTime);
  const closeTime = toHHmm(patch.closeTime ?? hours.closeTime);
  const openMinutes = timeToMinutes(openTime);
  const closeMinutes = timeToMinutes(closeTime);

  if (closeMinutes > openMinutes) {
    return { openTime, closeTime };
  }

  // Prefer extending close by 1 hour; otherwise pull open back.
  const preferredClose = openMinutes + 60;
  if (preferredClose <= 23 * 60 + 59) {
    return { openTime, closeTime: minutesToTime(preferredClose) };
  }

  const adjustedOpen = Math.max(0, closeMinutes - 60);
  return {
    openTime: minutesToTime(adjustedOpen),
    closeTime,
  };
}

/** Admin controls for weekly hours, slot size, and closed dates. */
export function AdminDeliveryScheduleEditor({
  locale,
  value,
  onChange,
  disabled = false,
  copy,
}: AdminDeliveryScheduleEditorProps) {
  const [closedDraft, setClosedDraft] = useState('');

  const weekdayLabels: Record<IsoWeekday, string> = {
    1: copy.monday,
    2: copy.tuesday,
    3: copy.wednesday,
    4: copy.thursday,
    5: copy.friday,
    6: copy.saturday,
    7: copy.sunday,
  };

  function updateWeekly(
    day: IsoWeekday,
    patch: Partial<DeliveryScheduleSettings['weekly'][IsoWeekday]>,
  ): void {
    const current = value.weekly[day];
    const nextHours: DayHours = { ...current, ...patch };
    if (patch.openTime != null || patch.closeTime != null) {
      const times = withValidOpenClose(current, {
        openTime: patch.openTime,
        closeTime: patch.closeTime,
      });
      nextHours.openTime = times.openTime;
      nextHours.closeTime = times.closeTime;
    }

    onChange({
      ...value,
      weekly: {
        ...value.weekly,
        [day]: nextHours,
      },
    });
  }

  function addClosedDate(): void {
    const date = closedDraft.trim();
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return;
    if (value.closedDates.includes(date)) {
      setClosedDraft('');
      return;
    }
    onChange({
      ...value,
      closedDates: [...value.closedDates, date].sort(),
    });
    setClosedDraft('');
  }

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-base font-semibold text-gray-900">{copy.title}</h2>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <label>
          <span className={ADMIN_LABEL}>{copy.slotLength}</span>
          <input
            type="number"
            min={15}
            max={240}
            step={15}
            value={value.slotMinutes}
            disabled={disabled}
            className={ADMIN_INPUT}
            onChange={(event) =>
              onChange({
                ...value,
                slotMinutes: Number(event.target.value),
              })
            }
          />
        </label>
        <label>
          <span className={ADMIN_LABEL}>{copy.bookableDaysAhead}</span>
          <input
            type="number"
            min={1}
            max={60}
            value={value.maxDaysAhead}
            disabled={disabled}
            className={ADMIN_INPUT}
            onChange={(event) =>
              onChange({
                ...value,
                maxDaysAhead: Number(event.target.value),
              })
            }
          />
        </label>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-gray-200">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-50 text-left text-gray-600">
            <tr>
              <th className="px-3 py-2 font-medium">{copy.day}</th>
              <th className="px-3 py-2 font-medium">{copy.open}</th>
              <th className="px-3 py-2 font-medium">{copy.from}</th>
              <th className="px-3 py-2 font-medium">{copy.to}</th>
            </tr>
          </thead>
          <tbody>
            {WEEKDAYS.map((day) => {
              const hours = value.weekly[day];
              return (
                <tr key={day} className="border-t border-gray-100">
                  <td className="px-3 py-2 font-medium text-gray-900">{weekdayLabels[day]}</td>
                  <td className="px-3 py-2">
                    <input
                      type="checkbox"
                      checked={hours.isOpen}
                      disabled={disabled}
                      className={ADMIN_CHECKBOX}
                      onChange={(event) => updateWeekly(day, { isOpen: event.target.checked })}
                    />
                  </td>
                  <td className="px-3 py-2">
                    <TimeField
                      ariaLabel={weekdayLabels[day]}
                      value={hours.openTime}
                      disabled={disabled || !hours.isOpen}
                      onChange={(next) => updateWeekly(day, { openTime: toHHmm(next) })}
                    />
                  </td>
                  <td className="px-3 py-2">
                    <TimeField
                      ariaLabel={weekdayLabels[day]}
                      value={hours.closeTime}
                      disabled={disabled || !hours.isOpen}
                      onChange={(next) => updateWeekly(day, { closeTime: toHHmm(next) })}
                    />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div>
        <span className={ADMIN_LABEL}>{copy.closedDates}</span>
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <AdminDateField
            value={closedDraft}
            disabled={disabled}
            locale={locale}
            placeholder={copy.closedDatePlaceholder}
            prevMonthLabel={copy.prevMonth}
            nextMonthLabel={copy.nextMonth}
            onChange={setClosedDraft}
          />
          <button
            type="button"
            disabled={disabled || !closedDraft}
            onClick={addClosedDate}
            className="inline-flex h-10 items-center rounded-xl border border-gray-300 bg-white px-4 text-sm font-medium text-gray-800 hover:bg-gray-50 disabled:opacity-50"
          >
            {copy.closeThisDay}
          </button>
        </div>
        {value.closedDates.length > 0 ? (
          <ul className="mt-3 flex flex-wrap gap-2">
            {value.closedDates.map((date) => (
              <li
                key={date}
                className="inline-flex items-center gap-2 rounded-full border border-gray-200 bg-gray-50 px-3 py-1 text-sm text-gray-800"
              >
                {formatCalendarDate(date, locale)}
                <button
                  type="button"
                  disabled={disabled}
                  className="text-gray-500 hover:text-red-700"
                  aria-label={copy.removeClosedDateAria.replace('{date}', date)}
                  onClick={() =>
                    onChange({
                      ...value,
                      closedDates: value.closedDates.filter((entry) => entry !== date),
                    })
                  }
                >
                  ×
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-2 text-xs text-gray-500">{copy.noClosedDates}</p>
        )}
      </div>
    </div>
  );
}
