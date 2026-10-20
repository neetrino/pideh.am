'use client';

import { SelectDropdown } from '@/components/ui/SelectDropdown';

type TimeFieldProps = {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  ariaLabel: string;
  className?: string;
};

const QUARTER_HOURS = [0, 15, 30, 45];

const TIMES = Array.from({ length: 24 }, (_, hour) =>
  QUARTER_HOURS.map((minute) => {
    const label = `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
    return { value: label, label };
  }),
).flat();

/** One `HH:mm` list, so the field reads as a time. */
export function TimeField({ value, onChange, disabled = false, ariaLabel, className = '' }: TimeFieldProps) {
  const normalized = value.slice(0, 5);
  const options = TIMES.some((item) => item.value === normalized)
    ? TIMES
    : [{ value: normalized, label: normalized }, ...TIMES];

  return (
    <SelectDropdown
      ariaLabel={ariaLabel}
      value={options.some((item) => item.value === normalized) ? normalized : TIMES[0].value}
      options={options}
      disabled={disabled}
      deferChange={false}
      className={className}
      onValueChange={onChange}
    />
  );
}
