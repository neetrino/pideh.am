'use client';

import { useEffect, useRef, useState, type AnimationEvent, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';

import {
  isTopOpenSideSheet,
  registerOpenSideSheet,
  unregisterOpenSideSheet,
} from '@/components/ui/side-sheet-stack';

/** Must match `.animate-side-sheet-panel-*` duration in globals.css. */
export const SIDE_SHEET_ANIMATION_MS = 300;

type SideSheetProps = {
  open: boolean;
  onClose: () => void;
  ariaLabel: string;
  children: ReactNode;
  /**
   * `admin` — half-page width, cream surface, orange close (Pideh admin).
   * `default` — compact storefront sheet.
   */
  variant?: 'default' | 'admin';
  /** Width classes applied to the docked panel. */
  panelClassName?: string;
  side?: 'left' | 'right';
  zIndexClassName?: string;
  /** External circle (default) or MaMarie-style edge tab. */
  closeVariant?: 'circle' | 'edge-tab';
  /** Soften backdrop (cart-style). */
  backdropBlur?: boolean;
  /** Inner panel surface (default: white + side radius). */
  panelInnerClassName?: string;
  /** Extra classes for the circle close control. */
  closeClassName?: string;
  /** Size the panel to its content instead of the full viewport height. */
  compact?: boolean;
};

/**
 * Full-viewport-height side sheet docked to the left/right edge.
 * Open/close use the same 300ms keyframe motion (mirrored slide).
 */
export function SideSheet({
  open,
  onClose,
  ariaLabel,
  children,
  variant = 'default',
  panelClassName,
  side = 'right',
  zIndexClassName = 'z-50',
  closeVariant = 'circle',
  backdropBlur,
  panelInnerClassName,
  closeClassName,
  compact = false,
}: SideSheetProps) {
  const [mounted, setMounted] = useState(false);
  const [rendered, setRendered] = useState(false);
  const [exiting, setExiting] = useState(false);
  const exitDoneRef = useRef(false);
  const snapshotChildrenRef = useRef(children);
  const snapshotAriaLabelRef = useRef(ariaLabel);

  // Keep the last open content for the close animation. Updating it in an
  // effect would paint stale field values first and jump the text caret to the end.
  if (open) {
    snapshotChildrenRef.current = children;
    snapshotAriaLabelRef.current = ariaLabel;
  }

  const isAdmin = variant === 'admin';
  const resolvedPanelClassName =
    panelClassName ??
    (isAdmin
      ? 'w-[min(100%,calc(100%-2.75rem))] sm:w-1/2'
      : 'w-[min(100%,28rem)] max-w-[calc(100%-2.75rem)]');
  const resolvedBackdropBlur = backdropBlur ?? isAdmin;
  const resolvedCloseClassName =
    closeClassName ?? (isAdmin ? 'bg-[#ff6b00] hover:bg-[#e85f00]' : 'bg-gray-900 hover:bg-black');

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (open) {
      exitDoneRef.current = false;
      setExiting(false);
      setRendered(true);
      return;
    }

    if (!rendered) return;

    setExiting(true);
    const timer = window.setTimeout(() => {
      finishExit();
    }, SIDE_SHEET_ANIMATION_MS);

    return () => window.clearTimeout(timer);
  }, [open, rendered]);

  useEffect(() => {
    if (!rendered) return;

    const sheetId = registerOpenSideSheet();
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    function handleKeyDown(event: KeyboardEvent): void {
      if (event.key !== 'Escape') return;
      if (!isTopOpenSideSheet(sheetId)) return;
      onClose();
    }

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      unregisterOpenSideSheet(sheetId);
      document.body.style.overflow = previousOverflow;
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [rendered, onClose]);

  function finishExit(): void {
    if (exitDoneRef.current) return;
    exitDoneRef.current = true;
    setRendered(false);
    setExiting(false);
  }

  function handlePanelAnimationEnd(event: AnimationEvent<HTMLDivElement>): void {
    if (event.target !== event.currentTarget) return;
    if (!event.animationName.includes('side-sheet-panel-out')) return;
    finishExit();
  }

  if (!mounted || !rendered) return null;

  const isRight = side === 'right';
  const edgeClass = isRight ? 'right-0' : 'left-0';
  const panelRadius = isRight ? 'rounded-l-[28px]' : 'rounded-r-[28px]';
  const panelEdgeBorder = isAdmin
    ? isRight
      ? 'border-l-2 border-[#1e1e1e]'
      : 'border-r-2 border-[#1e1e1e]'
    : '';
  const closePosition = isRight ? 'right-full' : 'left-full';
  const CloseChevron = isRight ? ChevronLeft : ChevronRight;

  const resolvedPanelInnerClassName =
    panelInnerClassName ??
    (isAdmin
      ? `bg-[#fff8e7] shadow-[8px_0_24px_rgba(30,30,30,0.12)] ${panelRadius} ${panelEdgeBorder}`
      : `bg-white ${isRight ? 'rounded-l-[var(--radius)]' : 'rounded-r-[var(--radius)]'}`);

  const backdropClass = exiting ? 'animate-sheet-backdrop-out' : 'animate-sheet-backdrop-in';
  const panelMotionClass = exiting
    ? isRight
      ? 'animate-side-sheet-panel-out-right'
      : 'animate-side-sheet-panel-out-left'
    : isRight
      ? 'animate-side-sheet-panel-in-right'
      : 'animate-side-sheet-panel-in-left';

  return createPortal(
    <div
      className={`fixed inset-0 ${zIndexClassName}`}
      role="dialog"
      aria-modal="true"
      aria-label={open ? ariaLabel : snapshotAriaLabelRef.current}
    >
      <button
        type="button"
        className={`absolute inset-0 bg-black/40 ${
          resolvedBackdropBlur ? 'backdrop-blur-sm' : ''
        } ${backdropClass}`}
        aria-label="Close"
        onClick={onClose}
      />
      <div
        className={`fixed ${edgeClass} z-[1] flex ${
          compact
            ? 'top-6 h-auto max-h-[calc(100dvh-3rem)]'
            : 'inset-y-0 h-dvh max-h-dvh'
        } ${panelMotionClass} ${resolvedPanelClassName}`}
        onAnimationEnd={handlePanelAnimationEnd}
      >
        {closeVariant === 'edge-tab' ? (
          <button
            type="button"
            onClick={onClose}
            className={`absolute top-1/2 ${closePosition} z-10 flex h-[38px] w-10 -translate-y-1/2 items-center justify-center bg-[#ff6b00] text-white transition-transform hover:scale-105 ${
              isRight ? 'rounded-l-full rounded-r-none' : 'rounded-r-full rounded-l-none'
            }`}
            aria-label="Close"
          >
            <CloseChevron className="h-4 w-4" strokeWidth={2.5} />
          </button>
        ) : (
          <button
            type="button"
            onClick={onClose}
            className={`absolute top-5 ${closePosition} z-10 flex h-10 w-10 shrink-0 items-center justify-center text-white transition-colors ${
              isRight ? 'rounded-l-full rounded-r-none' : 'rounded-r-full rounded-l-none'
            } ${resolvedCloseClassName}`}
            aria-label="Close"
          >
            <X className="h-4 w-4" strokeWidth={2.5} />
          </button>
        )}
        <div
          className={`flex min-h-0 w-full flex-col overflow-hidden shadow-2xl ${
            compact ? 'h-auto' : 'h-full'
          } ${resolvedPanelInnerClassName}`}
          onClick={(event) => event.stopPropagation()}
        >
          {open ? children : snapshotChildrenRef.current}
        </div>
      </div>
    </div>,
    document.body,
  );
}
