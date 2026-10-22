'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { createPortal } from 'react-dom';
import { useRouter } from 'next/navigation';

import { pollAdminUnseenOrdersAction } from '@/features/orders/application/admin-order-alerts';
import type { AdminUnseenOrderAlert } from '@/features/orders/application/queries';
import {
  showNewOrderSystemNotification,
  useUnseenOrdersTitleBadge,
} from '@/features/orders/ui/admin-order-browser-alerts';
import { NewOrderAlertPopup } from '@/features/orders/ui/NewOrderAlertPopup';
import type { Dictionary } from '@/lib/i18n/get-dictionary';

const POLL_INTERVAL_MS = 5_000;

type AdminOrderAlertsContextValue = {
  unseenCount: number;
  refreshUnseen: () => void;
  notifyOrderOpened: (orderNumber: string) => void;
};

const AdminOrderAlertsContext = createContext<AdminOrderAlertsContextValue | null>(null);

export function useAdminOrderAlerts(): AdminOrderAlertsContextValue {
  const ctx = useContext(AdminOrderAlertsContext);
  if (!ctx) {
    throw new Error('useAdminOrderAlerts must be used within AdminOrderAlertsProvider');
  }
  return ctx;
}

/** Optional hook when the provider may be absent (e.g. tests). */
export function useAdminOrderAlertsOptional(): AdminOrderAlertsContextValue | null {
  return useContext(AdminOrderAlertsContext);
}

type AdminOrderAlertsProviderProps = {
  locale: string;
  copy: Dictionary['admin']['orders']['newOrderAlert'];
  children: ReactNode;
};

type AlertAudioController = {
  start: () => void;
  stop: () => void;
  unlock: () => void;
};

function createAlertAudioController(): AlertAudioController {
  let context: AudioContext | null = null;
  let intervalId: number | null = null;

  function ensureContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    if (!context) {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return null;
      context = new AudioCtx();
    }
    return context;
  }

  function playBeep(): void {
    const ctx = ensureContext();
    if (!ctx) return;

    void ctx.resume().catch(() => undefined);

    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'square';
    osc.frequency.setValueAtTime(880, now);
    osc.frequency.setValueAtTime(660, now + 0.18);
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(0.12, now + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.35);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.38);
  }

  return {
    unlock() {
      const ctx = ensureContext();
      if (!ctx) return;
      void ctx.resume().catch(() => undefined);
    },
    start() {
      if (intervalId !== null) return;
      playBeep();
      intervalId = window.setInterval(playBeep, 1_200);
    },
    stop() {
      if (intervalId !== null) {
        window.clearInterval(intervalId);
        intervalId = null;
      }
    },
  };
}

/**
 * Polls for unseen admin orders, drives the sidebar badge, and shows a looping
 * sound alert until the admin presses "Heard".
 */
export function AdminOrderAlertsProvider({
  locale,
  copy,
  children,
}: AdminOrderAlertsProviderProps) {
  const router = useRouter();
  const [unseenCount, setUnseenCount] = useState(0);
  const [unseenIds, setUnseenIds] = useState<string[]>([]);
  const [alertOrders, setAlertOrders] = useState<AdminUnseenOrderAlert[]>([]);
  const [popupOpen, setPopupOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const heardIdsRef = useRef<Set<string>>(new Set());
  const notifiedIdsRef = useRef<Set<string>>(new Set());
  const audioRef = useRef<AlertAudioController | null>(null);
  const pollInFlightRef = useRef(false);

  useEffect(() => {
    setMounted(true);
    audioRef.current = createAlertAudioController();

    function unlock(): void {
      audioRef.current?.unlock();
    }

    document.addEventListener('pointerdown', unlock, { once: true });
    document.addEventListener('keydown', unlock, { once: true });

    return () => {
      document.removeEventListener('pointerdown', unlock);
      document.removeEventListener('keydown', unlock);
      audioRef.current?.stop();
    };
  }, []);

  const applySnapshot = useCallback(
    (count: number, ids: string[], latest: AdminUnseenOrderAlert[]) => {
      setUnseenCount(count);
      setUnseenIds(ids);

      const pending = latest.filter((order) => !heardIdsRef.current.has(order.id));
      if (pending.length === 0) {
        setAlertOrders([]);
        setPopupOpen(false);
        audioRef.current?.stop();
        return;
      }

      const fresh = pending.filter((order) => !notifiedIdsRef.current.has(order.id));
      for (const order of fresh) {
        notifiedIdsRef.current.add(order.id);
      }
      if (fresh[0]) {
        showNewOrderSystemNotification(fresh[0], copy, locale, count);
      }

      setAlertOrders(pending);
      setPopupOpen(true);
      audioRef.current?.start();
    },
    [copy, locale],
  );

  const refreshUnseen = useCallback(() => {
    if (pollInFlightRef.current) return;
    pollInFlightRef.current = true;

    void pollAdminUnseenOrdersAction(locale)
      .then((result) => {
        if (!result.ok) return;
        applySnapshot(
          result.value.count,
          result.value.unseenIds,
          result.value.latest.map((row) => ({
            ...row,
            placedAt: new Date(row.placedAt),
          })),
        );
      })
      .finally(() => {
        pollInFlightRef.current = false;
      });
  }, [applySnapshot, locale]);

  useEffect(() => {
    refreshUnseen();
    const timer = window.setInterval(refreshUnseen, POLL_INTERVAL_MS);

    function handleVisibilityChange(): void {
      if (document.visibilityState === 'visible') refreshUnseen();
    }

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      window.clearInterval(timer);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [refreshUnseen]);

  useUnseenOrdersTitleBadge(unseenCount);

  const notifyOrderOpened = useCallback(
    (orderNumber: string) => {
      setAlertOrders((prev) => {
        const next = prev.filter((order) => order.orderNumber !== orderNumber);
        if (next.length === 0) {
          setPopupOpen(false);
          audioRef.current?.stop();
        }
        return next;
      });
      setUnseenCount((prev) => Math.max(0, prev - 1));
      router.refresh();
      window.setTimeout(refreshUnseen, 400);
    },
    [refreshUnseen, router],
  );

  function handleHeard(): void {
    for (const id of unseenIds) {
      heardIdsRef.current.add(id);
    }
    for (const order of alertOrders) {
      heardIdsRef.current.add(order.id);
    }
    setPopupOpen(false);
    setAlertOrders([]);
    audioRef.current?.stop();
  }

  const value = useMemo(
    () => ({
      unseenCount,
      refreshUnseen,
      notifyOrderOpened,
    }),
    [unseenCount, refreshUnseen, notifyOrderOpened],
  );

  const primary = alertOrders[0] ?? null;

  return (
    <AdminOrderAlertsContext.Provider value={value}>
      {children}
      {mounted && popupOpen && primary
        ? createPortal(
            <NewOrderAlertPopup
              locale={locale}
              copy={copy}
              order={primary}
              waitingCount={unseenCount}
              onHeard={handleHeard}
            />,
            document.body,
          )
        : null}
    </AdminOrderAlertsContext.Provider>
  );
}
