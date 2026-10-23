'use client';

import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import Picker from 'react-mobile-picker';

export type DeliverySlotWheelColumnModel = {
  name: string;
  options: readonly { value: string; label: string }[];
};

type DeliverySlotWheelsProps = {
  value: Record<string, string>;
  columns: readonly DeliverySlotWheelColumnModel[];
  onChange: (value: Record<string, string>, key: string) => void;
};

const WHEEL_ITEM_HEIGHT_PX = 36;
const IOS_WHEEL_FADE =
  'linear-gradient(to bottom, transparent 0%, rgba(0,0,0,0.18) 16%, rgba(0,0,0,0.55) 32%, #000 44%, #000 56%, rgba(0,0,0,0.55) 68%, rgba(0,0,0,0.18) 84%, transparent 100%)';

/** iOS-style drum: gray capsule and a fade away from the selected row. */
export function DeliverySlotWheels({ value, columns, onChange }: DeliverySlotWheelsProps) {
  return (
    <div className="relative" onPointerDown={(event) => event.stopPropagation()}>
      <div
        className="pointer-events-none absolute inset-x-0 top-1/2 z-[1] -translate-y-1/2 rounded-[10px] bg-[#ececf1]"
        style={{ height: WHEEL_ITEM_HEIGHT_PX }}
        aria-hidden
      />
      <div className="relative z-[2]">
        <Picker
          className="[&>div:last-child]:hidden"
          value={value}
          onChange={onChange}
          height={WHEEL_ITEM_HEIGHT_PX * 7}
          itemHeight={WHEEL_ITEM_HEIGHT_PX}
          wheelMode="natural"
          style={{
            maskImage: IOS_WHEEL_FADE,
            WebkitMaskImage: IOS_WHEEL_FADE,
          }}
        >
          {columns.map((column) => (
            <Picker.Column key={column.name} name={column.name}>
              {column.options.map((option) => (
                <Picker.Item key={option.value} value={option.value}>
                  {({ selected }) => (
                    <span
                      className={`text-[22px] tracking-tight text-black ${
                        selected ? 'font-semibold' : 'font-normal'
                      }`}
                    >
                      {option.label}
                    </span>
                  )}
                </Picker.Item>
              ))}
            </Picker.Column>
          ))}
        </Picker>
      </div>
    </div>
  );
}

type DeliverySlotWheelSheetProps = {
  open: boolean;
  title: string;
  applyLabel: string;
  closeLabel: string;
  onClose: () => void;
  onApply: () => void;
  children: ReactNode;
};

const DISMISS_THRESHOLD_PX = 120;

/** Compact bottom sheet: slides up, drag the handle down to close, page behind stays still. */
export function DeliverySlotWheelSheet({
  open,
  title,
  applyLabel,
  closeLabel,
  onClose,
  onApply,
  children,
}: DeliverySlotWheelSheetProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const dragStartY = useRef<number | null>(null);
  const [rendered, setRendered] = useState(open);
  const [phase, setPhase] = useState<'enter' | 'idle' | 'exit'>(open ? 'enter' : 'exit');

  useEffect(() => {
    if (open) {
      setRendered(true);
      setPhase('enter');
      const panel = panelRef.current;
      if (panel) {
        panel.style.transition = '';
        panel.style.transform = '';
      }
      return;
    }
    setPhase('exit');
    const timer = window.setTimeout(() => setRendered(false), 300);
    return () => window.clearTimeout(timer);
  }, [open]);

  useEffect(() => {
    if (!rendered) {
      return;
    }
    const html = document.documentElement;
    const body = document.body;
    const previousHtmlOverflow = html.style.overflow;
    const previousBodyOverflow = body.style.overflow;
    const previousHtmlOverscroll = html.style.overscrollBehavior;
    const previousBodyOverscroll = body.style.overscrollBehavior;
    html.style.overflow = 'hidden';
    body.style.overflow = 'hidden';
    html.style.overscrollBehavior = 'none';
    body.style.overscrollBehavior = 'none';

    function allowMove(target: EventTarget | null): boolean {
      return target instanceof Element && target.closest('[data-body-scroll-lock-allow]') !== null;
    }
    function blockMove(event: TouchEvent): void {
      if (allowMove(event.target)) {
        return;
      }
      event.preventDefault();
    }
    function blockWheel(event: WheelEvent): void {
      if (allowMove(event.target)) {
        return;
      }
      event.preventDefault();
    }
    function onKey(event: KeyboardEvent): void {
      if (event.key === 'Escape') {
        onClose();
      }
    }

    document.addEventListener('touchmove', blockMove, { passive: false });
    document.addEventListener('wheel', blockWheel, { passive: false, capture: true });
    document.addEventListener('keydown', onKey);
    return () => {
      html.style.overflow = previousHtmlOverflow;
      body.style.overflow = previousBodyOverflow;
      html.style.overscrollBehavior = previousHtmlOverscroll;
      body.style.overscrollBehavior = previousBodyOverscroll;
      document.removeEventListener('touchmove', blockMove);
      document.removeEventListener('wheel', blockWheel, true);
      document.removeEventListener('keydown', onKey);
    };
  }, [rendered, onClose]);

  function onHandlePointerDown(event: ReactPointerEvent<HTMLDivElement>): void {
    if (event.target instanceof Element && event.target.closest('button')) {
      return;
    }
    dragStartY.current = event.clientY;
    panelRef.current?.setPointerCapture(event.pointerId);
    if (panelRef.current) {
      panelRef.current.style.transition = 'none';
    }
  }

  function onHandlePointerMove(event: ReactPointerEvent<HTMLDivElement>): void {
    if (dragStartY.current === null || !panelRef.current) {
      return;
    }
    const offset = Math.max(0, event.clientY - dragStartY.current);
    panelRef.current.style.transform = offset > 0 ? `translateY(${offset}px)` : '';
  }

  function onHandlePointerUp(event: ReactPointerEvent<HTMLDivElement>): void {
    if (dragStartY.current === null || !panelRef.current) {
      return;
    }
    const offset = Math.max(0, event.clientY - dragStartY.current);
    dragStartY.current = null;
    if (panelRef.current.hasPointerCapture(event.pointerId)) {
      panelRef.current.releasePointerCapture(event.pointerId);
    }
    if (offset >= DISMISS_THRESHOLD_PX) {
      panelRef.current.style.transition = 'transform 0.3s cubic-bezier(0.32, 0.72, 0, 1)';
      panelRef.current.style.transform = 'translateY(100%)';
      window.setTimeout(onClose, 280);
      return;
    }
    panelRef.current.style.transition = 'transform 0.3s cubic-bezier(0.32, 0.72, 0, 1)';
    panelRef.current.style.transform = 'translateY(0)';
  }

  if (!rendered || typeof document === 'undefined') {
    return null;
  }

  return createPortal(
    <div className="fixed inset-0 z-[230] flex items-end overscroll-none" role="dialog" aria-modal="true" aria-label={title}>
      <button
        type="button"
        aria-label={closeLabel}
        className={`absolute inset-0 bg-black/40 backdrop-blur-sm ${
          phase === 'enter' ? 'animate-bottom-sheet-backdrop-in' : phase === 'exit' ? 'animate-bottom-sheet-backdrop-out' : ''
        }`}
        onClick={onClose}
      />
      <div
        ref={panelRef}
        className={`relative z-[1] w-full overflow-hidden rounded-t-[28px] bg-white text-[#1e1e1e] shadow-[0_-12px_40px_rgba(0,0,0,0.18)] ${
          phase === 'enter' ? 'animate-bottom-sheet-panel-in' : phase === 'exit' ? 'animate-bottom-sheet-panel-out' : ''
        }`}
        onAnimationEnd={(event) => {
          if (event.target !== event.currentTarget) {
            return;
          }
          if (phase === 'enter') {
            setPhase('idle');
          }
        }}
        onPointerMove={onHandlePointerMove}
        onPointerUp={onHandlePointerUp}
        onPointerCancel={onHandlePointerUp}
      >
        <div
          className="flex h-11 cursor-grab touch-none items-center justify-center active:cursor-grabbing"
          onPointerDown={onHandlePointerDown}
          onTouchStart={(event) => {
            const touch = event.touches[0];
            if (!touch || !panelRef.current) {
              return;
            }
            dragStartY.current = touch.clientY;
            panelRef.current.style.transition = 'none';
          }}
          onTouchMove={(event) => {
            const touch = event.touches[0];
            if (dragStartY.current === null || !touch || !panelRef.current) {
              return;
            }
            const offset = Math.max(0, touch.clientY - dragStartY.current);
            panelRef.current.style.transform = offset > 0 ? `translateY(${offset}px)` : '';
            event.preventDefault();
          }}
          onTouchEnd={(event) => {
            const touch = event.changedTouches[0];
            if (dragStartY.current === null || !touch || !panelRef.current) {
              return;
            }
            const offset = Math.max(0, touch.clientY - dragStartY.current);
            dragStartY.current = null;
            if (offset >= DISMISS_THRESHOLD_PX) {
              panelRef.current.style.transition = 'transform 0.3s cubic-bezier(0.32, 0.72, 0, 1)';
              panelRef.current.style.transform = 'translateY(100%)';
              window.setTimeout(onClose, 280);
              return;
            }
            panelRef.current.style.transition = 'transform 0.3s cubic-bezier(0.32, 0.72, 0, 1)';
            panelRef.current.style.transform = 'translateY(0)';
          }}
        >
          <div className="h-1.5 w-16 rounded-full bg-[#d1d5db]" aria-hidden />
          <span className="sr-only">{closeLabel}</span>
        </div>
        <div
          className="px-5 pb-[max(1.5rem,env(safe-area-inset-bottom))]"
          data-body-scroll-lock-allow=""
          onPointerDown={onHandlePointerDown}
        >
          <h2 className="mb-2 text-lg font-bold">{title}</h2>
          {children}
          <button
            type="button"
            onClick={onApply}
            onPointerDown={(event) => event.stopPropagation()}
            className="font-noto-armenian relative z-10 mt-6 flex h-12 w-full items-center justify-center rounded-full bg-[#ff6b00] text-base font-bold"
            style={{ color: '#ffffff' }}
          >
            <span className="font-noto-armenian text-base font-bold" style={{ color: '#ffffff' }}>
              {applyLabel}
            </span>
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
