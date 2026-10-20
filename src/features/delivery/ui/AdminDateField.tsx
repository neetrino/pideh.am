'use client';

import { DateField } from '@/components/ui/DateField';

type AdminDateFieldProps = {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  locale: string;
  placeholder: string;
  prevMonthLabel: string;
  nextMonthLabel: string;
};

/** Admin date control. Uses the shared site calendar. */
export function AdminDateField({
  value,
  onChange,
  disabled = false,
  locale,
  placeholder,
}: AdminDateFieldProps) {
  return (
    <DateField
      locale={locale}
      value={value}
      onChange={onChange}
      disabled={disabled}
      placeholder={placeholder}
    />
  );
}
