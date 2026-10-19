'use client';

import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useMemo, useState, useTransition, useEffect, useRef, type ReactNode } from 'react';
import { Copy, Share2, Trash2, Users, X } from 'lucide-react';

import { PidehPillButton } from '@/components/brand/PidehPillButton';
import { visibleCheckoutOnlineProviders } from '@/features/checkout/domain/payment-modes';
import { AppLink } from '@/components/ui/AppLink';
import { AddressAutocomplete } from '@/components/ui/AddressAutocomplete';
import { SelectDropdown } from '@/components/ui/SelectDropdown';
import {
  cancelGroupOrderAction,
  joinGroupOrderAction,
  leaveGroupOrderSessionAction,
  loadGroupOrderDetailAction,
  lockGroupOrderAction,
  markItemsReadyAction,
  prepareGroupOrderCheckoutAction,
  removeGroupOrderItemAction,
  removeParticipantAction,
  setDeliveryAddressAction,
  setJoinsClosedAction,
  updateSpendLimitAction,
} from '@/features/group-orders/actions';
import type { GroupOrderDetailView } from '@/features/group-orders/application/queries';
import { GroupOrderConfirmDialog } from '@/features/group-orders/ui/GroupOrderConfirmDialog';
import type { Dictionary } from '@/lib/i18n/get-dictionary';
import type { Locale } from '@/lib/i18n/config';
import type { Currency } from '@/lib/money/currency';

type GroupOrderDeliveryZone = {
  id: string;
  label: string;
};

function zoneIdForLabel(zones: GroupOrderDeliveryZone[], label: string | null): string {
  if (!label) return '';
  return zones.find((zone) => zone.label === label)?.id ?? '';
}

type GroupOrderPageClientProps = {
  locale: Locale;
  currency: Currency;
  labels: Dictionary['groupOrder'];
  deliveryZones: GroupOrderDeliveryZone[];
  initialView: GroupOrderDetailView | null;
  inviteToken: string;
  needsJoin: boolean;
};

const GROUP_CARD =
  'rounded-[26px] border-2 border-pideh-ink/10 bg-white p-5 shadow-[0px_12px_14px_rgba(31,20,8,0.08)]';

const GROUP_ORDER_POLL_MS = 8_000;

const INPUT_CLASS =
  'w-full rounded-full border-2 border-pideh-ink/10 bg-pideh-cream px-4 py-2.5 text-sm font-medium text-pideh-ink outline-none transition focus:border-pideh-orange focus:ring-2 focus:ring-pideh-orange/30';

function GhostPillButton({
  children,
  onClick,
  disabled,
  compact = false,
  className = '',
}: {
  children: ReactNode;
  onClick: () => void;
  disabled?: boolean;
  compact?: boolean;
  className?: string;
}) {
  const size = compact ? 'gap-1 px-3 py-1.5 text-xs' : 'gap-1.5 px-4 py-2.5 text-sm';
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={`inline-flex items-center justify-center rounded-full border-2 border-pideh-ink/15 bg-white font-bold text-pideh-ink transition hover:border-pideh-orange hover:text-pideh-orange disabled:cursor-not-allowed disabled:opacity-50 ${size} ${className}`}
    >
      {children}
    </button>
  );
}

function paymentLabel(
  status: string,
  labels: Dictionary['groupOrder'],
  options?: { paysAtCheckout?: boolean },
): string {
  if (options?.paysAtCheckout) {
    return labels.statusPaysAtCheckout;
  }
  switch (status) {
    case 'PAID':
      return labels.statusPaid;
    case 'FAILED':
      return labels.statusFailed;
    case 'NOT_REQUIRED':
      return labels.statusNotRequired;
    case 'REFUNDED':
      return labels.statusRefunded;
    case 'MARKED_RECEIVED':
      return labels.statusMarkedReceived;
    default:
      return labels.statusPending;
  }
}

export function GroupOrderPageClient({
  locale,
  currency,
  labels,
  initialView,
  inviteToken,
  needsJoin,
  deliveryZones,
}: GroupOrderPageClientProps) {
  const router = useRouter();
  const [view, setView] = useState(initialView);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [joinName, setJoinName] = useState('');
  const [spendLimit, setSpendLimit] = useState(initialView?.spendLimitAmount?.toString() ?? '');
  const [deliveryAddress, setDeliveryAddress] = useState(initialView?.deliveryAddress ?? '');
  const [deliveryRuleId, setDeliveryRuleId] = useState(
    zoneIdForLabel(deliveryZones, initialView?.deliveryDistanceLabel ?? null),
  );
  const cancelledHandledRef = useRef(false);
  const [cancelOpen, setCancelOpen] = useState(false);

  useEffect(() => {
    setView(initialView);
    setSpendLimit(initialView?.spendLimitAmount?.toString() ?? '');
    setDeliveryAddress(initialView?.deliveryAddress ?? '');
    setDeliveryRuleId(zoneIdForLabel(deliveryZones, initialView?.deliveryDistanceLabel ?? null));
  }, [initialView, deliveryZones]);

  useEffect(() => {
    if (view?.status !== 'CANCELLED' || cancelledHandledRef.current) {
      return;
    }
    cancelledHandledRef.current = true;
    if (view.currentParticipantRole !== 'ORGANIZER') {
      window.dispatchEvent(
        new CustomEvent('pideh-group-order-cancelled', { detail: { inviteToken } }),
      );
      return;
    }
    startTransition(async () => {
      await leaveGroupOrderSessionAction();
      router.refresh();
    });
  }, [view?.status, view?.currentParticipantRole, inviteToken, router]);

  useEffect(() => {
    const status = view?.status;
    if (
      status == null ||
      status === 'CANCELLED' ||
      status === 'COMPLETED' ||
      status === 'EXPIRED'
    ) {
      return;
    }

    let cancelled = false;
    const timer = window.setInterval(() => {
      void (async () => {
        const detail = await loadGroupOrderDetailAction(inviteToken, locale, currency);
        if (cancelled || !detail) return;
        setView(detail);
      })();
    }, GROUP_ORDER_POLL_MS);

    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, [view?.status, inviteToken, locale, currency]);

  const inviteUrl = useMemo(() => {
    if (typeof window === 'undefined' || !view) return view?.invitePath ?? '';
    return `${window.location.origin}${view.invitePath}`;
  }, [view]);

  const isOrganizer = view?.currentParticipantRole === 'ORGANIZER';
  const canEdit = view?.status === 'OPEN';
  const currentParticipant = view?.participants.find(
    (participant) => participant.id === view.currentParticipantId,
  );
  const iAmReady = currentParticipant?.itemsReady ?? false;

  if (!view) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16 text-center">
        <p className="text-lg font-extrabold text-pideh-ink">{labels.notFound}</p>
      </div>
    );
  }

  if (view.status === 'CANCELLED') {
    return (
      <div className="mx-auto max-w-lg px-4 py-16 text-center">
        <p className="text-lg font-extrabold text-pideh-ink">{labels.cancelledAlert}</p>
        <AppLink
          href={`/${locale}`}
          prefetchPolicy="intent"
          className="mt-6 inline-flex rounded-full bg-pideh-orange px-5 py-2.5 text-sm font-bold text-white"
        >
          {labels.browseMenu}
        </AppLink>
      </div>
    );
  }

  if (needsJoin && !view.currentParticipantId) {
    return (
      <JoinPanel
        labels={labels}
        view={view}
        joinName={joinName}
        setJoinName={setJoinName}
        pending={pending}
        error={error}
        onJoin={() => {
          setError(null);
          startTransition(async () => {
            const result = await joinGroupOrderAction({
              inviteToken,
              displayName: joinName.trim(),
            });
            if (!result.ok) {
              setError(result.error);
              return;
            }
            router.refresh();
          });
        }}
      />
    );
  }

  function run(action: () => Promise<{ ok: boolean; error?: string }>): void {
    setError(null);
    startTransition(async () => {
      const result = await action();
      if (!result.ok) {
        setError(result.error ?? labels.errorGeneric);
        return;
      }
      router.refresh();
    });
  }

  async function copyLink(): Promise<void> {
    try {
      await navigator.clipboard.writeText(inviteUrl);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setError(labels.errorGeneric);
    }
  }

  async function shareLink(): Promise<void> {
    if (navigator.share) {
      try {
        await navigator.share({
          title: labels.manageTitle,
          url: inviteUrl,
        });
      } catch {
        /* user cancelled */
      }
      return;
    }
    await copyLink();
  }

  function saveDelivery(ruleId: string, address: string): void {
    if (!view || !ruleId) return;
    const trimmed = address.trim();
    const selected = deliveryZones.find((zone) => zone.id === ruleId);
    if (
      selected &&
      selected.label === view.deliveryDistanceLabel &&
      trimmed === (view.deliveryAddress ?? '').trim()
    ) {
      return;
    }
    run(async () =>
      setDeliveryAddressAction({
        inviteToken,
        deliveryAddress: trimmed,
        deliveryRuleId: ruleId,
        locale,
      }),
    );
  }

  function confirmCancel(): void {
    setError(null);
    startTransition(async () => {
      const result = await cancelGroupOrderAction({ inviteToken });
      if (!result.ok) {
        setError(result.error ?? labels.errorGeneric);
        return;
      }
      setCancelOpen(false);
      router.refresh();
    });
  }

  return (
    <div className={`mx-auto max-w-2xl px-4 py-8 md:py-10 ${pending ? 'opacity-70' : ''}`}>
      <GroupOrderConfirmDialog
        open={cancelOpen}
        title={labels.cancelConfirmTitle}
        description={labels.cancelConfirmBody}
        stayLabel={labels.cancelStay}
        confirmLabel={labels.cancelConfirmAction}
        closeLabel={labels.close}
        pending={pending}
        onClose={() => {
          if (!pending) setCancelOpen(false);
        }}
        onConfirm={confirmCancel}
      />
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-[11px] font-bold tracking-[0.22em] text-pideh-orange uppercase">
            {labels.status}
          </p>
          <h1 className="font-display mt-2 text-[clamp(2.25rem,6vw,3.25rem)] leading-[0.9] text-pideh-ink uppercase">
            {labels.manageTitle}
          </h1>
          <span className="mt-3 inline-flex rounded-full bg-pideh-orange/12 px-3 py-1 text-xs font-bold tracking-wide text-pideh-orange uppercase">
            {view.status}
          </span>
        </div>
        <AppLink
          href={`/${locale}/products`}
          prefetchPolicy="intent"
          className="text-sm font-bold text-pideh-orange underline-offset-4 hover:underline"
        >
          {labels.browseMenu}
        </AppLink>
      </div>

      <section className="mb-5 flex flex-wrap items-center justify-between gap-3 rounded-[22px] border-2 border-pideh-ink/10 bg-white px-4 py-3 shadow-[0px_8px_14px_rgba(31,20,8,0.06)]">
        <div className="min-w-0">
          <p className="font-display text-sm leading-none text-pideh-ink uppercase">
            {labels.inviteLink}
          </p>
          <p className="mt-1 truncate text-xs text-pideh-muted">{view.invitePath}</p>
        </div>
        <div className="flex shrink-0 gap-2">
          <GhostPillButton compact onClick={() => void copyLink()}>
            <Copy className="h-3.5 w-3.5" />
            {copied ? labels.copied : labels.copyLink}
          </GhostPillButton>
          <GhostPillButton compact onClick={() => void shareLink()}>
            <Share2 className="h-3.5 w-3.5" />
            {labels.share}
          </GhostPillButton>
        </div>
      </section>

      <section className={`mb-5 space-y-3 ${GROUP_CARD} text-sm`}>
        <div className="flex items-center gap-2 font-semibold text-pideh-ink">
          <Users className="h-4 w-4 text-pideh-orange" />
          {view.paymentMode === 'ORGANIZER_PAYS_ALL'
            ? labels.payingOrganizer.replace('{name}', view.organizerDisplayName)
            : labels.payingSplit}
        </div>
        <p className="text-pideh-muted">
          {view.spendLimitFormatted
            ? labels.limitLabel.replace('{amount}', view.spendLimitFormatted)
            : labels.noLimit}
        </p>
        <p className="text-pideh-muted">
          {view.deliveryAddress
            ? `${labels.deliveryAddressLabel}: ${view.deliveryAddress}`
            : labels.noDeliveryAddress}
        </p>
        <p className="text-pideh-muted">
          {labels.delivery}: {view.deliveryFormatted}
          {view.deliveryDistanceLabel ? ` · ${view.deliveryDistanceLabel}` : ''}
        </p>
        {view.paymentMode === 'SPLIT_PER_PARTICIPANT' &&
        view.currentParticipantId &&
        currentParticipant ? (
          <p className="text-pideh-muted">
            {labels.yourDeliveryShare}: {currentParticipant.deliveryShareFormatted}
          </p>
        ) : null}
        {view.paymentMode === 'SPLIT_PER_PARTICIPANT' &&
        view.currentParticipantId &&
        currentParticipant ? (
          <>
            <p className="pt-1 text-lg font-extrabold text-pideh-ink">
              {labels.yourShare}:{' '}
              <span className="text-pideh-orange">{currentParticipant.finalAmountFormatted}</span>
            </p>
            <p className="text-sm text-pideh-muted">
              {labels.total}: {view.grandTotalFormatted}
            </p>
          </>
        ) : (
          <p className="pt-1 text-lg font-extrabold text-pideh-ink">
            {labels.total}: <span className="text-pideh-orange">{view.grandTotalFormatted}</span>
          </p>
        )}
      </section>

      {isOrganizer && canEdit ? (
        <section className={`mb-5 space-y-5 ${GROUP_CARD}`}>
          <h2 className="text-base font-extrabold text-pideh-ink">{labels.settingsTitle}</h2>

          <div className="space-y-2">
            <label className="block">
              <span className="text-sm font-bold text-pideh-ink">
                {labels.spendLimitFieldLabel}
              </span>
              <span className="mt-0.5 block text-xs leading-relaxed text-pideh-muted">
                {labels.spendLimitFieldHint}
              </span>
            </label>
            <div className="flex flex-wrap gap-2">
              <div className="flex min-w-[8rem] flex-1 items-center gap-2 rounded-full border-2 border-pideh-ink/10 bg-pideh-cream px-4 py-2">
                <span className="text-sm font-bold text-pideh-orange" aria-hidden>
                  ֏
                </span>
                <input
                  value={spendLimit}
                  onChange={(e) => setSpendLimit(e.target.value)}
                  inputMode="numeric"
                  placeholder={labels.spendLimitPlaceholder}
                  aria-label={labels.spendLimitFieldLabel}
                  className="w-full bg-transparent text-sm font-medium text-pideh-ink outline-none"
                />
              </div>
              <GhostPillButton
                onClick={() =>
                  run(async () =>
                    updateSpendLimitAction({
                      inviteToken,
                      spendLimitAmount: spendLimit.trim() ? Number.parseInt(spendLimit, 10) : null,
                    }),
                  )
                }
              >
                {labels.saveLimit}
              </GhostPillButton>
            </div>
          </div>

          <div className="space-y-2 border-t border-pideh-orange/15 pt-4">
            <label className="block">
              <span className="text-sm font-bold text-pideh-ink">{labels.deliveryFieldLabel}</span>
              <span className="mt-0.5 block text-xs leading-relaxed text-pideh-muted">
                {labels.deliveryFieldHint}
              </span>
            </label>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="min-w-0 space-y-1.5">
                <span className="text-sm font-bold text-pideh-ink">{labels.deliveryLocation}</span>
                <SelectDropdown
                  ariaLabel={labels.deliveryLocation}
                  value={deliveryRuleId}
                  allLabel={labels.selectLocation}
                  options={deliveryZones.map((zone) => ({
                    value: zone.id,
                    label: zone.label,
                  }))}
                  onValueChange={(next) => {
                    setDeliveryRuleId(next);
                    if (next) saveDelivery(next, deliveryAddress);
                  }}
                  disabled={pending || deliveryZones.length === 0}
                  tone="brand"
                  className="w-full"
                />
              </div>
              <div
                className="min-w-0 space-y-1.5"
                onBlur={(event) => {
                  if (event.currentTarget.contains(event.relatedTarget as Node | null)) return;
                  saveDelivery(deliveryRuleId, deliveryAddress);
                }}
              >
                <span className="text-sm font-bold text-pideh-ink">{labels.deliveryAddressLabel}</span>
                <AddressAutocomplete
                  value={deliveryAddress}
                  onValueChange={setDeliveryAddress}
                  onPlaceSelected={(address) => {
                    setDeliveryAddress(address);
                    saveDelivery(deliveryRuleId, address);
                  }}
                  placeholder={labels.deliveryAddressPlaceholder}
                  languageCode={locale}
                  className={INPUT_CLASS}
                  disabled={pending}
                />
              </div>
            </div>
            <p className="text-xs leading-relaxed text-pideh-muted">
              {view.paymentMode === 'SPLIT_PER_PARTICIPANT'
                ? labels.deliverySplitHint
                : labels.deliveryOrganizerPaysHint}
            </p>
            {deliveryRuleId && view.deliveryDistanceLabel ? (
              <p className="text-sm font-bold text-pideh-orange">
                {labels.deliveryQuoteReady
                  .replace('{amount}', view.deliveryFormatted)
                  .replace('{distance}', view.deliveryDistanceLabel)}
              </p>
            ) : null}
          </div>

          <div className="space-y-2 border-t border-pideh-orange/15 pt-4">
            <p className="text-xs leading-relaxed text-pideh-muted">{labels.closeJoinsHint}</p>
            <GhostPillButton
              className="w-full sm:w-auto"
              onClick={() =>
                run(async () =>
                  setJoinsClosedAction({
                    inviteToken,
                    joinsClosed: !view.joinsClosed,
                  }),
                )
              }
            >
              {view.joinsClosed ? labels.openJoins : labels.closeJoins}
            </GhostPillButton>
          </div>
        </section>
      ) : null}

      <section className="mb-6">
        <h2 className="mb-3 text-lg font-extrabold text-pideh-ink">{labels.participants}</h2>
        <ul className="space-y-4">
          {view.participants.map((participant) => (
            <li key={participant.id} className={GROUP_CARD}>
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-extrabold text-pideh-ink">
                    {participant.displayName}
                    {participant.role === 'ORGANIZER' ? (
                      <span className="ml-2 text-xs font-bold text-pideh-orange">
                        ({labels.organizer})
                      </span>
                    ) : null}
                  </p>
                  <p className="mt-0.5 text-sm text-pideh-muted">
                    {participant.subtotalFormatted} ·{' '}
                    {paymentLabel(participant.paymentStatus, labels, {
                      paysAtCheckout:
                        view.paymentMode === 'SPLIT_PER_PARTICIPANT' &&
                        participant.role === 'ORGANIZER' &&
                        participant.paymentStatus !== 'PAID' &&
                        participant.paymentStatus !== 'MARKED_RECEIVED' &&
                        (view.status === 'AWAITING_PAYMENTS' || view.status === 'CHECKOUT'),
                    })}
                  </p>
                  {view.paymentMode === 'SPLIT_PER_PARTICIPANT' ? (
                    <p className="mt-0.5 text-xs text-pideh-muted">
                      {labels.deliveryShare}: {participant.deliveryShareFormatted} · {labels.total}:{' '}
                      {participant.finalAmountFormatted}
                    </p>
                  ) : null}
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <p
                    className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-bold ${
                      participant.itemsReady
                        ? 'bg-pideh-orange/12 text-pideh-orange'
                        : 'bg-pideh-yellow/50 text-pideh-ink'
                    }`}
                  >
                    {participant.itemsReady ? labels.ready : labels.notReady}
                  </p>
                {isOrganizer && participant.role !== 'ORGANIZER' && canEdit ? (
                  <button
                    type="button"
                    className="rounded-full p-2 text-pideh-muted transition hover:bg-red-50 hover:text-red-600"
                    aria-label={labels.removeParticipant}
                    onClick={() =>
                      run(async () =>
                        removeParticipantAction({
                          inviteToken,
                          participantId: participant.id,
                        }),
                      )
                    }
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                ) : null}
                </div>
              </div>

              {participant.items.length === 0 ? (
                <p className="mt-3 text-sm text-pideh-muted">{labels.emptyItems}</p>
              ) : (
                <ul
                  className={
                    participant.id === view.currentParticipantId
                      ? 'mt-3 space-y-2'
                      : 'mt-3 grid grid-cols-2 gap-2'
                  }
                >
                  {participant.items.map((item) => (
                    <li
                      key={item.id}
                      className="flex items-center gap-3 rounded-[18px] bg-pideh-cream p-2"
                    >
                      <div className="relative h-12 w-12 overflow-hidden rounded-xl bg-white">
                        {item.imageUrl ? (
                          <Image
                            src={item.imageUrl}
                            alt={item.title}
                            fill
                            className="object-contain p-0.5"
                            sizes="48px"
                          />
                        ) : null}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-bold text-pideh-ink">
                          {item.title} × {item.quantity}
                        </p>
                        <p className="text-xs font-medium text-pideh-muted">
                          {item.lineTotalFormatted}
                        </p>
                      </div>
                      {(isOrganizer || participant.id === view.currentParticipantId) && canEdit ? (
                        <button
                          type="button"
                          className="rounded-full p-1.5 text-pideh-muted transition hover:bg-white hover:text-pideh-ink"
                          aria-label={labels.removeItem}
                          onClick={() =>
                            run(async () =>
                              removeGroupOrderItemAction({
                                inviteToken,
                                itemId: item.id,
                              }),
                            )
                          }
                        >
                          <X className="h-4 w-4" />
                        </button>
                      ) : null}
                    </li>
                  ))}
                </ul>
              )}
            </li>
          ))}
        </ul>
      </section>

      {error ? (
        <p className="mb-4 text-sm font-semibold text-red-600" role="alert">
          {error}
        </p>
      ) : null}

      <div className="group-order-actions sticky bottom-4 space-y-3">
        {canEdit && view.currentParticipantId ? (
          iAmReady ? (
            <div
              className="rounded-[22px] border-2 border-pideh-orange/25 bg-white px-4 py-3 text-center shadow-[0px_8px_16px_rgba(31,20,8,0.08)]"
              role="status"
            >
              <p className="text-sm font-extrabold text-pideh-orange">{labels.itemsReadyDone}</p>
              <p className="mt-1 text-xs leading-relaxed text-pideh-muted">
                {labels.itemsReadyDoneHint}
              </p>
            </div>
          ) : (
            <PidehPillButton
              label={labels.itemsReady}
              disabled={pending}
              className="w-full"
              onClick={() => {
                setError(null);
                startTransition(async () => {
                  const result = await markItemsReadyAction({ inviteToken });
                  if (!result.ok) {
                    setError(result.error ?? labels.errorGeneric);
                    return;
                  }
                  setView((prev) => {
                    if (!prev?.currentParticipantId) return prev;
                    return {
                      ...prev,
                      participants: prev.participants.map((participant) =>
                        participant.id === prev.currentParticipantId
                          ? { ...participant, itemsReady: true }
                          : participant,
                      ),
                    };
                  });
                  router.refresh();
                });
              }}
            />
          )
        ) : null}

        {isOrganizer && canEdit ? (
          <PidehPillButton
            label={labels.lockAndContinue}
            tone="dark"
            disabled={pending}
            className="w-full"
            onClick={() => run(async () => lockGroupOrderAction({ inviteToken }))}
          />
        ) : null}

        {isOrganizer && view.status === 'CHECKOUT' ? (
          <PidehPillButton
            label={labels.goToCheckout}
            disabled={pending}
            className="w-full"
            onClick={() => {
              setError(null);
              startTransition(async () => {
                const result = await prepareGroupOrderCheckoutAction({
                  inviteToken,
                });
                if (!result.ok) {
                  setError(result.error ?? labels.errorGeneric);
                  return;
                }
                router.push(`/${locale}/checkout`);
              });
            }}
          />
        ) : null}

        {visibleCheckoutOnlineProviders().length > 0 &&
        view.paymentMode === 'SPLIT_PER_PARTICIPANT' &&
        view.status === 'AWAITING_PAYMENTS' &&
        !isOrganizer &&
        view.currentParticipantId &&
        currentParticipant &&
        currentParticipant.finalAmount > 0 &&
        currentParticipant.paymentStatus !== 'PAID' &&
        currentParticipant.paymentStatus !== 'MARKED_RECEIVED' ? (
          <PidehPillButton
            label={labels.payWithCard.replace('{amount}', currentParticipant.finalAmountFormatted)}
            disabled={pending}
            className="w-full"
            onClick={() => router.push(`/${locale}/group-orders/${inviteToken}/pay`)}
          />
        ) : null}

        {view.paymentMode === 'SPLIT_PER_PARTICIPANT' &&
        view.status === 'AWAITING_PAYMENTS' &&
        !isOrganizer &&
        view.currentParticipantId &&
        currentParticipant &&
        (currentParticipant.paymentStatus === 'PAID' ||
          currentParticipant.paymentStatus === 'MARKED_RECEIVED') ? (
          <p className="rounded-[22px] border-2 border-pideh-orange/25 bg-white px-4 py-3 text-center text-sm font-semibold text-pideh-ink">
            {labels.payYouPaid}
          </p>
        ) : null}

        {isOrganizer && view.status === 'AWAITING_PAYMENTS' ? (
          <p className="rounded-[22px] border-2 border-pideh-yellow bg-pideh-yellow/40 px-4 py-3 text-center text-sm font-semibold text-pideh-ink">
            {labels.statusAwaitingCardPayments}
          </p>
        ) : null}

        {isOrganizer &&
        view.status !== 'CANCELLED' &&
        view.status !== 'COMPLETED' &&
        view.status !== 'PAID' &&
        view.status !== 'PREPARING' ? (
          <GhostPillButton className="w-full" disabled={pending} onClick={() => setCancelOpen(true)}>
            {labels.cancelOrder}
          </GhostPillButton>
        ) : null}
      </div>
    </div>
  );
}

function JoinPanel({
  labels,
  view,
  joinName,
  setJoinName,
  pending,
  error,
  onJoin,
}: {
  labels: Dictionary['groupOrder'];
  view: GroupOrderDetailView;
  joinName: string;
  setJoinName: (value: string) => void;
  pending: boolean;
  error: string | null;
  onJoin: () => void;
}) {
  return (
    <div className="mx-auto flex min-h-[70vh] max-w-md items-center px-4 py-10">
      <div className="w-full overflow-hidden rounded-[28px] border-2 border-pideh-ink bg-pideh-cream shadow-[8px_8px_0_#1e1e1e]">
        <div className="border-b-2 border-pideh-ink/10 bg-pideh-yellow/35 px-6 py-5">
          <h1 className="text-xl font-extrabold text-pideh-ink">
            {labels.joinTitle.replace('{name}', view.organizerDisplayName)}
          </h1>
          <p className="mt-2 text-sm text-pideh-muted">{labels.joinDescription}</p>
        </div>
        <div className="px-6 py-5">
          <div className="space-y-3 text-sm text-pideh-ink">
            <p className="flex items-center gap-2 font-semibold">
              <Users className="h-4 w-4 text-pideh-orange" />
              {view.paymentMode === 'ORGANIZER_PAYS_ALL'
                ? labels.payingOrganizer.replace('{name}', view.organizerDisplayName)
                : labels.payingSplit}
            </p>
            <p className="text-pideh-muted">
              {view.spendLimitFormatted
                ? labels.limitLabel.replace('{amount}', view.spendLimitFormatted)
                : labels.noLimit}
            </p>
          </div>

          <label className="mt-5 block">
            <span className="mb-1.5 block text-sm font-bold text-pideh-ink">
              {labels.joinNameLabel}
            </span>
            <input
              value={joinName}
              onChange={(e) => setJoinName(e.target.value)}
              placeholder={labels.joinNamePlaceholder}
              className={INPUT_CLASS}
            />
          </label>

          {error ? (
            <p className="mt-3 text-sm font-semibold text-red-600" role="alert">
              {error}
            </p>
          ) : null}

          <PidehPillButton
            label={labels.join}
            disabled={pending || !joinName.trim()}
            className="mt-5 w-full"
            onClick={onJoin}
          />
        </div>
      </div>
    </div>
  );
}
