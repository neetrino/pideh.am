'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';

import { Button } from '@/components/ui/Button';
import { DateTimeField } from '@/components/ui/DateTimeField';
import { SideSheet } from '@/components/ui/SideSheet';
import {
  ADMIN_CHECKBOX,
  ADMIN_CHECKBOX_LABEL,
  ADMIN_INPUT,
  ADMIN_LABEL,
} from '@/features/admin/ui/admin-form-classes';
import { adminCreateGiftCardAction } from '@/features/gift-cards/application/admin-actions';
import type { Dictionary } from '@/lib/i18n/get-dictionary';

type GiftCardDrawerCopy = {
  drawer: Dictionary['admin']['giftCards']['drawer'];
  common: Dictionary['admin']['common'];
};

type GiftCardDrawerProps = {
  locale: string;
  open: boolean;
  onClose: () => void;
  presets: number[];
  copy: GiftCardDrawerCopy;
};

export function GiftCardDrawer({ locale, open, onClose, presets, copy }: GiftCardDrawerProps) {
  const router = useRouter();
  const [amount, setAmount] = useState(String(presets[0] ?? 20000));
  const [recipientName, setRecipientName] = useState('');
  const [recipientEmail, setRecipientEmail] = useState('');
  const [recipientPhone, setRecipientPhone] = useState('');
  const [purchaserName, setPurchaserName] = useState('White Shop');
  const [message, setMessage] = useState('');
  const [expiresAt, setExpiresAt] = useState('');
  const [sendEmail, setSendEmail] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function onSubmit(): void {
    setError(null);
    startTransition(async () => {
      const result = await adminCreateGiftCardAction(locale, {
        amount: Number(amount),
        recipientName,
        recipientEmail,
        recipientPhone: recipientPhone || undefined,
        purchaserName,
        message: message || undefined,
        expiresAt: expiresAt ? new Date(expiresAt).toISOString() : null,
        sendEmail,
        activateImmediately: true,
      });
      if (!result.ok) {
        setError(result.error.message);
        return;
      }
      onClose();
      router.refresh();
    });
  }

  return (
    <SideSheet open={open} onClose={onClose} ariaLabel={copy.drawer.newAria} variant="admin">
      <div className="shrink-0 border-b-2 border-[#1e1e1e]/10 px-5 py-4 sm:px-6">
        <h2 className="font-display text-2xl leading-[0.95] text-[#1e1e1e] uppercase sm:text-3xl">
          {copy.drawer.newTitle}
        </h2>
      </div>
      <div className="space-y-4 px-5 py-4">
        <label className="block space-y-1">
          <span className={ADMIN_LABEL}>{copy.drawer.amount}</span>
          <input
            className={ADMIN_INPUT}
            type="number"
            value={amount}
            onChange={(event) => setAmount(event.target.value)}
          />
        </label>
        <label className="block space-y-1">
          <span className={ADMIN_LABEL}>{copy.drawer.recipientName}</span>
          <input
            className={ADMIN_INPUT}
            value={recipientName}
            onChange={(event) => setRecipientName(event.target.value)}
          />
        </label>
        <label className="block space-y-1">
          <span className={ADMIN_LABEL}>{copy.drawer.recipientEmail}</span>
          <input
            className={ADMIN_INPUT}
            type="email"
            value={recipientEmail}
            onChange={(event) => setRecipientEmail(event.target.value)}
          />
        </label>
        <label className="block space-y-1">
          <span className={ADMIN_LABEL}>{copy.drawer.recipientPhone}</span>
          <input
            className={ADMIN_INPUT}
            value={recipientPhone}
            onChange={(event) => setRecipientPhone(event.target.value)}
          />
        </label>
        <label className="block space-y-1">
          <span className={ADMIN_LABEL}>{copy.drawer.purchaserName}</span>
          <input
            className={ADMIN_INPUT}
            value={purchaserName}
            onChange={(event) => setPurchaserName(event.target.value)}
          />
        </label>
        <label className="block space-y-1">
          <span className={ADMIN_LABEL}>{copy.drawer.message}</span>
          <textarea
            className={ADMIN_INPUT}
            rows={3}
            value={message}
            onChange={(event) => setMessage(event.target.value)}
          />
        </label>
        <label className="block space-y-1">
          <span className={ADMIN_LABEL}>{copy.drawer.expiresOptional}</span>
          <DateTimeField
            locale={locale}
            value={expiresAt}
            onChange={setExpiresAt}
            placeholder={copy.drawer.expiresOptional}
            timeLabel={copy.drawer.expiresOptional}
          />
        </label>
        <label className={ADMIN_CHECKBOX_LABEL}>
          <input
            type="checkbox"
            checked={sendEmail}
            onChange={(event) => setSendEmail(event.target.checked)}
            className={ADMIN_CHECKBOX}
          />
          {copy.drawer.sendEmail}
        </label>
        {error ? (
          <p className="text-sm text-red-600" role="alert">
            {error}
          </p>
        ) : null}
        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            {copy.common.cancel}
          </Button>
          <Button type="button" disabled={isPending} onClick={onSubmit}>
            {isPending ? copy.common.creating : copy.common.create}
          </Button>
        </div>
      </div>
    </SideSheet>
  );
}
