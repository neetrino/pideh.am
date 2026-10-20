'use client';

import { useMemo, useState, useTransition, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';

import { purchaseGiftCardAction } from '@/features/gift-cards/application/admin-actions';
import {
  CHECKOUT_PAYMENT_METHODS,
  isHiddenCheckoutPaymentMethod,
  isOfferedCheckoutPaymentMethod,
  type CheckoutPaymentMethod,
} from '@/features/checkout/domain/payment-methods';
import {
  CheckoutPaymentMethods,
  type PaymentOption,
} from '@/features/checkout/ui/CheckoutPaymentMethods';
import type { GiftCardSettings } from '@/features/gift-cards/domain/gift-card-rules';
import { GiftCardSendDateField } from '@/features/gift-cards/ui/GiftCardSendDateField';
import type { Locale } from '@/lib/i18n/config';
import { formatMoneyAmount } from '@/lib/money/format';

type BuyGiftCardFormCopy = {
  title: string;
  amount: string;
  customAmount: string;
  recipientName: string;
  recipientEmail: string;
  recipientPhone: string;
  purchaserName: string;
  message: string;
  sendDate: string;
  paymentMethod: string;
  cashOnDelivery: string;
  cashOnDeliveryDescription: string;
  idram: string;
  idramDescription: string;
  arca: string;
  arcaDescription: string;
  terminal: string;
  terminalDescription: string;
  submit: string;
  submitting: string;
  successPending: string;
};

type BuyGiftCardFormProps = {
  locale: Locale;
  settings: GiftCardSettings;
  defaultPurchaserName: string;
  copy: BuyGiftCardFormCopy;
  /** Called after a successful purchase (e.g. close drawer). */
  onSuccess?: () => void;
};

export function BuyGiftCardForm({
  locale,
  settings,
  defaultPurchaserName,
  copy,
  onSuccess,
}: BuyGiftCardFormProps) {
  const router = useRouter();
  const [amount, setAmount] = useState(settings.presets[0] ?? settings.minAmount);
  const [customAmount, setCustomAmount] = useState('');
  const [useCustom, setUseCustom] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<CheckoutPaymentMethod>(
    () => CHECKOUT_PAYMENT_METHODS.find(isOfferedCheckoutPaymentMethod) ?? 'cash_on_delivery',
  );
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const resolvedAmount = useMemo(() => {
    if (!useCustom) {
      return amount;
    }
    const parsed = Number(customAmount);
    return Number.isInteger(parsed) ? parsed : 0;
  }, [amount, customAmount, useCustom]);

  const paymentOptions = useMemo((): PaymentOption[] => {
    const options: PaymentOption[] = [
      {
        id: 'cash_on_delivery',
        name: copy.cashOnDelivery,
        description: copy.cashOnDeliveryDescription,
        logos: ['/assets/payments/cash-bag.png'],
      },
      {
        id: 'idram',
        name: copy.idram,
        description: copy.idramDescription,
        logos: ['/assets/payments/idram.png'],
      },
      {
        id: 'arca',
        name: copy.arca,
        description: copy.arcaDescription,
        logos: [
          '/assets/payments/arca.png',
          '/assets/payments/mastercard.png',
          '/assets/payments/visa.png',
        ],
      },
      {
        id: 'terminal',
        name: copy.terminal,
        description: copy.terminalDescription,
        logos: ['/assets/payments/terminal.png'],
      },
    ];
    return options.filter((option) => !isHiddenCheckoutPaymentMethod(option.id));
  }, [
    copy.arca,
    copy.arcaDescription,
    copy.cashOnDelivery,
    copy.cashOnDeliveryDescription,
    copy.idram,
    copy.idramDescription,
    copy.terminal,
    copy.terminalDescription,
  ]);

  function onSubmit(event: FormEvent<HTMLFormElement>): void {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    setError(null);
    setSuccess(null);

    startTransition(async () => {
      const result = await purchaseGiftCardAction({
        locale,
        amount: resolvedAmount,
        recipientName: String(data.get('recipientName') ?? ''),
        recipientEmail: String(data.get('recipientEmail') ?? ''),
        recipientPhone: String(data.get('recipientPhone') ?? '') || undefined,
        purchaserName: String(data.get('purchaserName') ?? ''),
        message: String(data.get('message') ?? '') || undefined,
        scheduledSendAt: String(data.get('scheduledSendAt') ?? '')
          ? new Date(String(data.get('scheduledSendAt'))).toISOString()
          : null,
        paymentMethod,
      });

      if (!result.ok) {
        setError(result.error.message);
        return;
      }

      setSuccess(copy.successPending);
      router.refresh();
      onSuccess?.();
    });
  }

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      <div>
        <p className="mb-2 text-sm font-medium text-gray-900">{copy.amount}</p>
        <div className="flex flex-wrap gap-2">
          {settings.presets.map((preset) => (
            <button
              key={preset}
              type="button"
              onClick={() => {
                setUseCustom(false);
                setAmount(preset);
              }}
              className={
                !useCustom && amount === preset
                  ? 'rounded-lg border border-gray-900 bg-gray-900 px-3 py-2 text-sm text-white'
                  : 'rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-800 hover:border-gray-400'
              }
            >
              {formatMoneyAmount(preset, 'AMD', locale)}
            </button>
          ))}
          <button
            type="button"
            onClick={() => setUseCustom(true)}
            className={
              useCustom
                ? 'rounded-lg border border-gray-900 bg-gray-900 px-3 py-2 text-sm text-white'
                : 'rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-800 hover:border-gray-400'
            }
          >
            {copy.customAmount}
          </button>
        </div>
        {useCustom ? (
          <input
            type="number"
            min={settings.minAmount}
            max={settings.maxAmount}
            value={customAmount}
            onChange={(event) => setCustomAmount(event.target.value)}
            className="mt-3 h-11 w-full rounded-lg border border-gray-200 px-3 text-sm"
            required
          />
        ) : null}
      </div>

      <label className="block space-y-1 text-sm">
        <span className="font-medium text-gray-900">{copy.recipientName}</span>
        <input
          name="recipientName"
          required
          maxLength={120}
          className="h-11 w-full rounded-lg border border-gray-200 px-3"
        />
      </label>
      <label className="block space-y-1 text-sm">
        <span className="font-medium text-gray-900">{copy.recipientEmail}</span>
        <input
          name="recipientEmail"
          type="email"
          required
          maxLength={254}
          className="h-11 w-full rounded-lg border border-gray-200 px-3"
        />
      </label>
      <label className="block space-y-1 text-sm">
        <span className="font-medium text-gray-900">{copy.recipientPhone}</span>
        <input
          name="recipientPhone"
          maxLength={40}
          className="h-11 w-full rounded-lg border border-gray-200 px-3"
        />
      </label>
      <label className="block space-y-1 text-sm">
        <span className="font-medium text-gray-900">{copy.purchaserName}</span>
        <input
          name="purchaserName"
          required
          maxLength={120}
          defaultValue={defaultPurchaserName}
          className="h-11 w-full rounded-lg border border-gray-200 px-3"
        />
      </label>
      <label className="block space-y-1 text-sm">
        <span className="font-medium text-gray-900">{copy.message}</span>
        <textarea
          name="message"
          maxLength={1000}
          rows={3}
          className="w-full rounded-lg border border-gray-200 px-3 py-2"
        />
      </label>
      <div className="block space-y-1 text-sm">
        <span className="font-medium text-gray-900">{copy.sendDate}</span>
        <GiftCardSendDateField
          locale={locale}
          name="scheduledSendAt"
          disabled={pending}
          placeholder={copy.sendDate}
        />
      </div>

      <CheckoutPaymentMethods
        title={copy.paymentMethod}
        options={paymentOptions}
        value={paymentMethod}
        onChange={setPaymentMethod}
        disabled={pending}
      />

      {error ? (
        <p className="text-sm text-red-600" role="alert">
          {error}
        </p>
      ) : null}
      {success ? (
        <p className="text-sm text-emerald-700" role="status">
          {success}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={pending}
        className="h-11 w-full rounded-full bg-[#ff6b00] text-sm font-bold text-white transition hover:bg-[#e85f00] disabled:cursor-not-allowed disabled:opacity-50"
      >
        {pending ? copy.submitting : copy.submit}
      </button>
    </form>
  );
}
