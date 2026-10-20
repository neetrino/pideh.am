'use client';

import { useState } from 'react';

import { SelectDropdown, type SelectDropdownOption } from '@/components/ui/SelectDropdown';

type FormSelectProps = {
  name?: string;
  ariaLabel: string;
  options: ReadonlyArray<SelectDropdownOption>;
  value?: string;
  defaultValue?: string;
  allLabel?: string;
  disabled?: boolean;
  className?: string;
  onValueChange?: (value: string) => void;
};

/** Shared dropdown that can post with a form or stay controlled. */
export function FormSelect({
  name,
  ariaLabel,
  options,
  value,
  defaultValue = '',
  allLabel,
  disabled,
  className,
  onValueChange,
}: FormSelectProps) {
  const [internal, setInternal] = useState(defaultValue);
  const selected = value ?? internal;

  return (
    <SelectDropdown
      name={name}
      ariaLabel={ariaLabel}
      options={options}
      value={selected}
      allLabel={allLabel}
      disabled={disabled}
      className={className}
      deferChange={false}
      onValueChange={(next) => {
        if (value === undefined) setInternal(next);
        onValueChange?.(next);
      }}
    />
  );
}
