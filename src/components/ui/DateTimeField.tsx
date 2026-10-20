'use client';

import { useState } from 'react';

import { DateField } from '@/components/ui/DateField';
import { TimeField } from '@/components/ui/TimeField';

type DateTimeFieldProps = {
  locale: string;
  /** `YYYY-MM-DDTHH:mm`. */
  value?: string;
  defaultValue?: string;
  onChange?: (value: string) => void;
  name?: string;
  placeholder: string;
  timeLabel: string;
  disabled?: boolean;
};

function split(value: string): { date: string; time: string } {
  const [date = '', time = '12:00'] = value.split('T');
  return { date, time: time.slice(0, 5) || '12:00' };
}

/** Site date + time field. Posts `YYYY-MM-DDTHH:mm` when `name` is set. */
export function DateTimeField({
  locale,
  value,
  defaultValue = '',
  onChange,
  name,
  placeholder,
  timeLabel,
  disabled = false,
}: DateTimeFieldProps) {
  const initial = split(defaultValue);
  const [date, setDate] = useState(initial.date);
  const [time, setTime] = useState(initial.time);
  const controlled = value !== undefined;
  const current = controlled ? split(value) : { date, time };
  const posted = current.date ? `${current.date}T${current.time}` : '';

  function update(nextDate: string, nextTime: string): void {
    if (!controlled) {
      setDate(nextDate);
      setTime(nextTime);
    }
    onChange?.(nextDate ? `${nextDate}T${nextTime}` : '');
  }

  return (
    <div className="space-y-2">
      {name ? <input type="hidden" name={name} value={posted} /> : null}
      <DateField
        locale={locale}
        value={current.date}
        placeholder={placeholder}
        disabled={disabled}
        onChange={(nextDate) => update(nextDate, current.time)}
      />
      <TimeField
        ariaLabel={timeLabel}
        value={current.time}
        disabled={disabled || !current.date}
        onChange={(nextTime) => update(current.date, nextTime)}
      />
    </div>
  );
}
