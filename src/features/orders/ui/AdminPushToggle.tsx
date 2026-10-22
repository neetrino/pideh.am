'use client';

import { Bell, BellOff } from 'lucide-react';
import { useEffect, useState } from 'react';

import {
  removeAdminPushSubscriptionAction,
  saveAdminPushSubscriptionAction,
} from '@/features/orders/application/admin-push-actions';
import {
  getExistingPushSubscription,
  isWebPushSupported,
  subscribeToWebPush,
} from '@/features/orders/ui/admin-push-client';
import type { Dictionary } from '@/lib/i18n/get-dictionary';

type PushState = 'loading' | 'off' | 'on' | 'blocked' | 'error';

type AdminPushToggleProps = {
  locale: string;
  publicKey: string | null;
  labels: Dictionary['admin']['orders']['pushToggle'];
};

async function enablePush(locale: string, publicKey: string): Promise<PushState> {
  const payload = await subscribeToWebPush(publicKey);
  if (!payload) return Notification.permission === 'denied' ? 'blocked' : 'off';
  const result = await saveAdminPushSubscriptionAction(locale, payload);
  return result.ok ? 'on' : 'error';
}

async function disablePush(locale: string): Promise<PushState> {
  const subscription = await getExistingPushSubscription();
  if (subscription) {
    await removeAdminPushSubscriptionAction(locale, subscription.endpoint);
    await subscription.unsubscribe();
  }
  return 'off';
}

/** Lets an admin opt this browser into new-order push notifications (works with the tab closed). */
export function AdminPushToggle({ locale, publicKey, labels }: AdminPushToggleProps) {
  const [state, setState] = useState<PushState>('loading');
  const supported = Boolean(publicKey) && isWebPushSupported();

  useEffect(() => {
    if (!supported) return;
    if (Notification.permission === 'denied') {
      setState('blocked');
      return;
    }
    void getExistingPushSubscription()
      .then((subscription) => setState(subscription ? 'on' : 'off'))
      .catch(() => setState('off'));
  }, [supported]);

  if (!supported || !publicKey) return null;

  async function handleClick(): Promise<void> {
    if (!publicKey) return;
    const wasOn = state === 'on';
    setState('loading');
    try {
      setState(wasOn ? await disablePush(locale) : await enablePush(locale, publicKey));
    } catch {
      setState('error');
    }
  }

  const on = state === 'on';
  const label: Record<PushState, string> = {
    loading: labels.enable,
    off: labels.enable,
    on: labels.enabled,
    blocked: labels.blocked,
    error: labels.error,
  };
  const Icon = on ? Bell : BellOff;

  return (
    <button
      type="button"
      onClick={() => void handleClick()}
      disabled={state === 'loading' || state === 'blocked'}
      aria-pressed={on}
      title={state === 'blocked' ? labels.blockedHint : undefined}
      className={`inline-flex cursor-pointer items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition disabled:cursor-default disabled:opacity-70 ${
        on
          ? 'bg-[#1a5c3a] text-white shadow-[0_1px_3px_rgba(16,24,40,0.12)]'
          : 'bg-[#e8edf2] text-[#5b6570] hover:text-[#1a5c3a]'
      }`}
    >
      <Icon className="h-4 w-4" aria-hidden />
      <span>{label[state]}</span>
    </button>
  );
}
