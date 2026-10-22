import 'server-only';

import webPush, { WebPushError } from 'web-push';

import { getEnv } from '@/config/env';

/** Push endpoint + keys as produced by `PushSubscription.toJSON()` in the browser. */
export type WebPushTarget = {
  endpoint: string;
  keys: { p256dh: string; auth: string };
};

/** `expired` means the browser revoked the subscription and it should be deleted. */
export type WebPushSendOutcome = 'sent' | 'expired';

/** Push services drop undelivered messages after this many seconds. */
const PUSH_TTL_SECONDS = 60 * 60;
const EXPIRED_STATUS_CODES = new Set([404, 410]);

let configured = false;

/** Push services accept only `mailto:` or `https:` VAPID subjects. */
function resolveVapidSubject(): string | null {
  const { VAPID_SUBJECT, NEXT_PUBLIC_APP_URL } = getEnv();
  if (VAPID_SUBJECT) return VAPID_SUBJECT;
  const appUrl = new URL(NEXT_PUBLIC_APP_URL);
  return appUrl.protocol === 'https:' ? appUrl.origin : null;
}

/** VAPID public key for browser subscription, or null when Web Push is not configured. */
export function getWebPushPublicKey(): string | null {
  const { VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY } = getEnv();
  return VAPID_PUBLIC_KEY && VAPID_PRIVATE_KEY && resolveVapidSubject() ? VAPID_PUBLIC_KEY : null;
}

function ensureConfigured(): boolean {
  if (configured) return true;

  const { VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY } = getEnv();
  const subject = resolveVapidSubject();
  if (!VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY || !subject) return false;

  webPush.setVapidDetails(subject, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);
  configured = true;
  return true;
}

/** Sends one encrypted push message; throws on non-expiry delivery errors. */
export async function sendWebPush(
  target: WebPushTarget,
  payload: string,
): Promise<WebPushSendOutcome> {
  if (!ensureConfigured()) {
    throw new Error('Web Push is not configured (VAPID keys or subject missing).');
  }

  try {
    await webPush.sendNotification(target, payload, { TTL: PUSH_TTL_SECONDS, urgency: 'high' });
    return 'sent';
  } catch (error) {
    if (error instanceof WebPushError && EXPIRED_STATUS_CODES.has(error.statusCode)) {
      return 'expired';
    }
    throw error;
  }
}
