'use client';

import { Info, X } from 'lucide-react';
import { AnimatePresence, LayoutGroup, motion, useReducedMotion } from 'motion/react';
import { useRouter } from 'next/navigation';
import { useEffect, useId, useState, useTransition } from 'react';
import { createPortal } from 'react-dom';

import { PidehPillButton } from '@/components/brand/PidehPillButton';
import { createGroupOrderAction } from '@/features/group-orders/actions';
import type { GroupOrderPaymentMode } from '@/features/group-orders/domain/status';
import { GroupOrderPaymentOption } from '@/features/group-orders/ui/GroupOrderPaymentOption';
import type { Locale } from '@/lib/i18n/config';
import type { Dictionary } from '@/lib/i18n/get-dictionary';

const PANEL_EASE = [0.22, 1, 0.36, 1] as const;

type GroupOrderLabels = Dictionary['groupOrder'];

type CreateGroupOrderModalProps = {
  open: boolean;
  onClose: () => void;
  locale: Locale;
  labels: GroupOrderLabels;
  defaultName?: string;
};

export function CreateGroupOrderModal({
  open,
  onClose,
  locale,
  labels,
  defaultName = '',
}: CreateGroupOrderModalProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return createPortal(
    <AnimatePresence>
      {open ? (
        <CreateGroupOrderDialog
          key="create-group-order"
          locale={locale}
          labels={labels}
          defaultName={defaultName}
          onClose={onClose}
        />
      ) : null}
    </AnimatePresence>,
    document.body,
  );
}

function CreateGroupOrderDialog({
  locale,
  labels,
  defaultName = '',
  onClose,
}: Omit<CreateGroupOrderModalProps, 'open'>) {
  const router = useRouter();
  const titleId = useId();
  const descriptionId = useId();
  const reduceMotion = useReducedMotion();
  const [pending, startTransition] = useTransition();
  const [paymentMode, setPaymentMode] = useState<GroupOrderPaymentMode>('ORGANIZER_PAYS_ALL');
  const [name, setName] = useState(defaultName);
  const [spendLimit, setSpendLimit] = useState('');
  const [error, setError] = useState<string | null>(null);

  useModalLock(pending, onClose);

  function submit(): void {
    const spendLimitAmount = parseSpendLimit(paymentMode, spendLimit);
    if (spendLimitAmount === 'invalid') {
      setError(labels.errorGeneric);
      return;
    }

    setError(null);
    startTransition(async () => {
      const result = await createGroupOrderAction({
        paymentMode,
        organizerDisplayName: name.trim() || labels.organizer,
        spendLimitAmount,
      });
      if (!result.ok) {
        setError(result.error);
        return;
      }
      onClose();
      router.push(`/${locale}/group-orders/${result.inviteToken}`);
    });
  }

  return (
    <motion.div
      className="fixed inset-0 z-[220] flex items-center justify-center px-2 py-4 sm:p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: reduceMotion ? 0.01 : 0.28 }}
    >
      <button
        type="button"
        className="absolute inset-0 bg-transparent backdrop-blur-[6px] sm:bg-pideh-ink/40"
        aria-label={labels.close}
        onClick={onClose}
      />
      <motion.div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={descriptionId}
        initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 20, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 14, scale: 0.98 }}
        transition={{ duration: 0.32, ease: PANEL_EASE }}
        className="relative z-[1] flex max-h-[min(92dvh,calc(100dvh-2rem))] w-full min-w-0 max-w-none flex-col overflow-hidden rounded-[28px] border-2 border-pideh-ink bg-pideh-cream shadow-none sm:max-w-[min(440px,calc(100%-2rem))] sm:shadow-[8px_8px_0_#1e1e1e]"
      >
        <div className="relative border-b-2 border-pideh-ink/10 bg-pideh-yellow/35 px-6 pt-5 pb-4">
          <CloseButton label={labels.close} onClose={onClose} />
          <h2
            id={titleId}
            className="pr-12 text-xl leading-[1.25] font-extrabold tracking-tight text-pideh-ink"
          >
            {labels.createTitle}
          </h2>
          <p
            id={descriptionId}
            className="mt-2 hidden min-w-0 text-sm leading-relaxed break-words text-pretty text-pideh-muted sm:block"
          >
            {labels.createDescription}
          </p>
        </div>
        <div className="flex min-h-0 flex-1 flex-col px-6 pb-6 pt-5">
          <GroupOrderCreateFields
            labels={labels}
            name={name}
            spendLimit={spendLimit}
            paymentMode={paymentMode}
            error={error}
            onNameChange={setName}
            onSpendLimitChange={setSpendLimit}
            onPaymentModeChange={setPaymentMode}
          />
          <PidehPillButton
            label={labels.start}
            onClick={submit}
            disabled={pending || !name.trim()}
            className="mt-5 w-full"
          />
        </div>
      </motion.div>
    </motion.div>
  );
}

function GroupOrderCreateFields({
  labels,
  name,
  spendLimit,
  paymentMode,
  error,
  onNameChange,
  onSpendLimitChange,
  onPaymentModeChange,
}: {
  labels: GroupOrderLabels;
  name: string;
  spendLimit: string;
  paymentMode: GroupOrderPaymentMode;
  error: string | null;
  onNameChange: (value: string) => void;
  onSpendLimitChange: (value: string) => void;
  onPaymentModeChange: (value: GroupOrderPaymentMode) => void;
}) {
  return (
    <div className="min-h-0 min-w-0 flex-1 space-y-4 overflow-x-hidden overflow-y-auto">
      <label className="block">
        <span className="mb-2 block text-sm font-semibold text-pideh-ink">
          {labels.organizerNameLabel}
        </span>
        <input
          value={name}
          onChange={(event) => onNameChange(event.target.value)}
          placeholder={labels.organizerNamePlaceholder}
          autoComplete="name"
          className="w-full rounded-full border-2 border-pideh-ink/10 bg-white px-4 py-3 text-sm font-medium text-pideh-ink outline-none transition focus:border-pideh-orange focus:ring-2 focus:ring-pideh-orange/35"
        />
      </label>
      <LayoutGroup>
        <fieldset className="min-w-0 space-y-3">
          <legend className="sr-only">{labels.createTitle}</legend>
          <GroupOrderPaymentOption
            selected={paymentMode === 'ORGANIZER_PAYS_ALL'}
            title={labels.paymentModeOrganizer}
            hint={labels.paymentModeOrganizerHint}
            icon="user"
            onSelect={() => onPaymentModeChange('ORGANIZER_PAYS_ALL')}
          >
            <div className="flex w-full min-w-0 items-center rounded-full border border-pideh-orange/25 bg-pideh-cream px-4 py-2.5">
              <input
                inputMode="numeric"
                value={spendLimit}
                onChange={(event) => onSpendLimitChange(event.target.value)}
                placeholder={labels.spendLimitLabel}
                className="w-full min-w-0 flex-1 bg-transparent text-sm font-medium text-pideh-ink outline-none placeholder:text-pideh-muted"
              />
              <span className="pl-2 text-sm font-bold text-pideh-orange">֏</span>
            </div>
          </GroupOrderPaymentOption>
          <GroupOrderPaymentOption
            selected={paymentMode === 'SPLIT_PER_PARTICIPANT'}
            title={labels.paymentModeSplit}
            icon="users"
            onSelect={() => onPaymentModeChange('SPLIT_PER_PARTICIPANT')}
          />
        </fieldset>
      </LayoutGroup>
      <p className="flex min-w-0 items-start gap-2 text-xs leading-relaxed text-pideh-muted">
        <Info className="mt-0.5 h-4 w-4 shrink-0 text-pideh-orange" aria-hidden />
        <span className="min-w-0 break-words">{labels.infoNote}</span>
      </p>
      {error ? (
        <p className="text-sm text-red-600" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}

function CloseButton({ label, onClose }: { label: string; onClose: () => void }) {
  return (
    <button
      type="button"
      onClick={onClose}
      className="absolute top-4 right-4 inline-flex h-9 w-9 items-center justify-center rounded-full bg-pideh-orange text-white transition hover:bg-pideh-orange-hot"
      aria-label={label}
    >
      <X className="h-4 w-4" strokeWidth={2.5} />
    </button>
  );
}

function parseSpendLimit(
  paymentMode: GroupOrderPaymentMode,
  spendLimit: string,
): number | null | 'invalid' {
  const limitRaw = spendLimit.trim();
  if (paymentMode !== 'ORGANIZER_PAYS_ALL' || !limitRaw) return null;
  const amount = Number.parseInt(limitRaw, 10);
  if (!Number.isInteger(amount) || amount < 1) return 'invalid';
  return amount;
}

function useModalLock(pending: boolean, onClose: () => void): void {
  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    function handleKeyDown(event: KeyboardEvent): void {
      if (event.key === 'Escape' && !pending) onClose();
    }

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [pending, onClose]);
}
