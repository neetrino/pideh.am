'use client';

import { Check, Users } from 'lucide-react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useMemo, useState, useTransition } from 'react';

import { AppLink } from '@/components/ui/AppLink';
import { completeParticipantCardPaymentAction } from '@/features/group-orders/actions';
import {
  CHECKOUT_PRIMARY_BTN,
  CHECKOUT_RADIO_OFF,
  CHECKOUT_RADIO_ON,
} from '@/features/checkout/ui/checkout-ui-classes';
import { isPaymentMethodTemporarilyUnavailable } from '@/features/checkout/domain/payment-methods';
import {
  offeredCheckoutOnlineProviders,
  visibleCheckoutOnlineProviders,
  type CheckoutOnlineProvider,
} from '@/features/checkout/domain/payment-modes';
import type { Dictionary } from '@/lib/i18n/get-dictionary';
import type { Locale } from '@/lib/i18n/config';

type GroupOrderPayClientProps = {
  locale: Locale;
  labels: Dictionary['groupOrder'];
  inviteToken: string;
  displayName: string;
  amountFormatted: string;
  alreadyPaid: boolean;
  amount: number;
};

type ProviderOption = {
  id: CheckoutOnlineProvider;
  name: string;
  description: string;
  logo: string;
};

function NamedLine({ template, name }: { template: string; name: string }) {
  const [before, after = ''] = template.split('{name}');

  return (
    <p className="mt-2 text-sm leading-relaxed text-pideh-ink/60">
      {before}
      <span className="font-bold text-pideh-ink">{name}</span>
      {after}
    </p>
  );
}

function ProviderChoice({
  option,
  selected,
  unavailable,
  onSelect,
}: {
  option: ProviderOption;
  selected: boolean;
  unavailable: boolean;
  onSelect: () => void;
}) {
  return (
    <label
      aria-disabled={unavailable || undefined}
      className={`flex items-center gap-3 rounded-[18px] border-2 p-3.5 transition ${
        unavailable
          ? 'cursor-not-allowed border-[#1e1e1e]/15 bg-[#1a1a1a]/12 opacity-45 grayscale'
          : `cursor-pointer ${selected ? CHECKOUT_RADIO_ON : CHECKOUT_RADIO_OFF}`
      }`}
    >
      <input
        type="radio"
        name="provider"
        value={option.id}
        checked={selected && !unavailable}
        onChange={() => {
          if (!unavailable) onSelect();
        }}
        disabled={unavailable}
        className="sr-only"
      />
      <span className="relative flex size-11 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-[#ff6b00]/15 bg-white">
        <Image src={option.logo} alt="" width={36} height={36} className="object-contain" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-bold text-pideh-ink">{option.name}</span>
        <span className="block text-xs text-pideh-ink/55">{option.description}</span>
      </span>
      <span
        className={`inline-flex size-5 shrink-0 items-center justify-center rounded-full border-2 ${
          selected && !unavailable
            ? 'border-[#ff6b00] bg-[#ff6b00] text-white'
            : 'border-[#1e1e1e]/15'
        }`}
        aria-hidden="true"
      >
        {selected && !unavailable ? <Check className="size-3" strokeWidth={3} /> : null}
      </span>
    </label>
  );
}

function PaidNotice({
  title,
  hint,
  backHref,
  backLabel,
}: {
  title: string;
  hint: string;
  backHref: string;
  backLabel: string;
}) {
  return (
    <div className="mx-auto w-full max-w-md px-4 py-8 sm:py-12">
      <article className="overflow-hidden rounded-[28px] border-2 border-[#1e1e1e]/10 bg-white text-center shadow-[0px_12px_14px_rgba(31,20,8,0.08)]">
        <div className="border-b border-[#ff6b00]/15 bg-[#fff8e7] px-6 py-6">
          <span className="mx-auto inline-flex size-12 items-center justify-center rounded-full bg-[#ff6b00] text-white">
            <Check className="size-6" aria-hidden="true" />
          </span>
          <h1 className="mt-4 font-display text-2xl leading-none text-[#1e1e1e] uppercase">{title}</h1>
          <p className="mt-3 text-sm leading-relaxed text-[#1e1e1e]/65">{hint}</p>
        </div>
        <div className="px-6 py-5">
          <AppLink
            href={backHref}
            className="inline-flex h-11 w-full items-center justify-center rounded-full bg-[#ff6b00] px-6 text-sm font-bold text-white transition hover:bg-[#e85f00]"
          >
            {backLabel}
          </AppLink>
        </div>
      </article>
    </div>
  );
}

export function GroupOrderPayClient({
  locale,
  labels,
  inviteToken,
  displayName,
  amountFormatted,
  alreadyPaid,
  amount,
}: GroupOrderPayClientProps) {
  const router = useRouter();
  const [provider, setProvider] = useState<CheckoutOnlineProvider | null>(
    () => offeredCheckoutOnlineProviders()[0] ?? visibleCheckoutOnlineProviders()[0] ?? null,
  );
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const backHref = `/${locale}/group-orders/${inviteToken}`;
  const providers = useMemo(() => {
    const visible = new Set(visibleCheckoutOnlineProviders());
    const options: ProviderOption[] = [
      {
        id: 'arca',
        name: labels.payArca,
        description: labels.payArcaDescription,
        logo: '/assets/payments/arca.png',
      },
      {
        id: 'idram',
        name: labels.payIdram,
        description: labels.payIdramDescription,
        logo: '/assets/payments/idram.png',
      },
    ];
    return options.filter((option) => visible.has(option.id));
  }, [labels.payArca, labels.payArcaDescription, labels.payIdram, labels.payIdramDescription]);

  if (alreadyPaid || amount <= 0) {
    return (
      <PaidNotice
        title={labels.payAlreadyPaidTitle}
        hint={labels.payAlreadyPaidHint}
        backHref={backHref}
        backLabel={labels.payBackToGroup}
      />
    );
  }

  return (
    <div className="mx-auto w-full max-w-md px-4 py-8 sm:py-12">
      <article className="overflow-hidden rounded-[26px] border-2 border-pideh-ink/10 bg-white shadow-[0px_12px_14px_rgba(31,20,8,0.08)]">
        <div className="border-t-[3px] border-t-[#ff6b00] px-5 pt-5 pb-4">
          <div className="flex items-start gap-3">
            <span className="inline-flex size-11 shrink-0 items-center justify-center rounded-full bg-[#ff6b00] text-white">
              <Users className="size-5" aria-hidden="true" />
            </span>
            <div className="min-w-0">
              <p className="text-[11px] font-bold tracking-[0.16em] text-[#ff6b00] uppercase">
                {labels.activeSessionEyebrow}
              </p>
              <h1 className="mt-1 font-display text-2xl leading-none text-pideh-ink uppercase">
                {labels.payTitle}
              </h1>
            </div>
          </div>
          <NamedLine template={labels.payDescription} name={displayName} />
          <div className="mt-5 rounded-[18px] bg-[#fff8e7] px-4 py-3">
            <p className="font-display text-4xl leading-none text-pideh-ink">{amountFormatted}</p>
            <p className="mt-2 text-xs leading-relaxed text-pideh-ink/55">{labels.payAmountHint}</p>
          </div>
        </div>

        {providers.length > 0 ? (
          <fieldset className="space-y-3 border-t border-dashed border-[#1e1e1e]/12 px-5 py-4">
            <legend className="text-sm font-bold text-pideh-ink">{labels.paySelectProvider}</legend>
            {providers.map((option) => {
              const unavailable = isPaymentMethodTemporarilyUnavailable(option.id);
              return (
                <ProviderChoice
                  key={option.id}
                  option={option}
                  unavailable={unavailable}
                  selected={provider === option.id}
                  onSelect={() => setProvider(option.id)}
                />
              );
            })}
          </fieldset>
        ) : null}

        <div className="px-5 pb-5">
          {error ? (
            <p className="mb-3 rounded-[18px] border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </p>
          ) : null}
          {provider != null ? (
            <button
              type="button"
              className={`${CHECKOUT_PRIMARY_BTN} cursor-pointer transition disabled:cursor-not-allowed disabled:opacity-50`}
              disabled={pending || isPaymentMethodTemporarilyUnavailable(provider)}
              onClick={() => {
                setError(null);
                startTransition(async () => {
                  const result = await completeParticipantCardPaymentAction({
                    inviteToken,
                    provider,
                  });
                  if (!result.ok) {
                    setError(result.error ?? labels.errorGeneric);
                    return;
                  }
                  router.push(backHref);
                  router.refresh();
                });
              }}
            >
              {pending ? labels.payProcessing : labels.payConfirm}
            </button>
          ) : null}
          <AppLink
            href={backHref}
            className="mt-3 block text-center text-sm font-bold text-pideh-ink/55 transition hover:text-[#ff6b00]"
          >
            {labels.payBackToGroup}
          </AppLink>
        </div>
      </article>
    </div>
  );
}
