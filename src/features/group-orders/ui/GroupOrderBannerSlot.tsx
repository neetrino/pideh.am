'use client';

import { forwardRef, useEffect, useRef, type CSSProperties } from 'react';

/** Fired after the slot has hydrated, so the banner can portal without a mismatch. */
export const GROUP_ORDER_BANNER_SLOT_READY = 'group-order-banner-slot-ready';

type GroupOrderBannerSlotProps = {
  className?: string;
  style?: CSSProperties;
};

/**
 * Empty placeholder the active group-order banner portals into on mobile home.
 * `data-slot-ready` is set in an effect so it exists only after hydration.
 */
export const GroupOrderBannerSlot = forwardRef<HTMLDivElement, GroupOrderBannerSlotProps>(
  function GroupOrderBannerSlot({ className, style }, forwardedRef) {
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
      const node = ref.current;
      if (!node) return;
      node.dataset.slotReady = 'true';
      window.dispatchEvent(new Event(GROUP_ORDER_BANNER_SLOT_READY));
      return () => {
        delete node.dataset.slotReady;
      };
    }, []);

    return (
      <div
        ref={(node) => {
          ref.current = node;
          if (typeof forwardedRef === 'function') forwardedRef(node);
          else if (forwardedRef) forwardedRef.current = node;
        }}
        data-group-order-banner-slot
        className={className}
        style={style}
      />
    );
  },
);
