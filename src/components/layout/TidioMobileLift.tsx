'use client';

import { useEffect } from 'react';

const MOBILE_QUERY = '(max-width: 767px), (orientation: portrait) and (max-width: 1199px)';
/** Dock is 176px in the 440px frame, then scaled to the viewport, plus a gap. */
const LIFT = 'calc(176px * 100vw / 440 + env(safe-area-inset-bottom, 0px) + 5rem)';

const OVERLAY_QUERY =
  '[role="dialog"][aria-modal="true"], [role="alertdialog"][aria-modal="true"]';
/** Side sheets and modals start at z-50. */
const BELOW_OVERLAY_Z = '30';

function liftBubble(iframe: HTMLElement): void {
  const wanted = LIFT.replaceAll(/\s/g, '');
  const current = iframe.style.getPropertyValue('bottom').replaceAll(/\s/g, '');
  if (current === wanted && iframe.style.getPropertyPriority('bottom') === 'important') {
    return;
  }
  iframe.style.setProperty('bottom', LIFT, 'important');
  iframe.style.setProperty('top', 'auto', 'important');
}

function stackUnderOverlay(node: HTMLElement, covered: boolean): void {
  const zIndex = node.style.getPropertyValue('z-index');
  const priority = node.style.getPropertyPriority('z-index');
  const sunk = zIndex === BELOW_OVERLAY_Z && priority === 'important';
  if (covered) {
    if (sunk) return;
    node.style.setProperty('z-index', BELOW_OVERLAY_Z, 'important');
    return;
  }
  if (sunk) node.style.removeProperty('z-index');
}

/** Keeps the chat above the mobile dock, and behind open modals and side sheets. */
export function TidioMobileLift() {
  useEffect(() => {
    const media = window.matchMedia(MOBILE_QUERY);
    let styleObserver: MutationObserver | undefined;

    const apply = () => {
      const covered = document.querySelector(OVERLAY_QUERY) != null;
      const iframe = document.getElementById('tidio-chat-iframe');
      const host = document.getElementById('tidio-chat');
      if (host instanceof HTMLElement) stackUnderOverlay(host, covered);
      if (!(iframe instanceof HTMLElement)) return;
      stackUnderOverlay(iframe, covered);
      if (media.matches) liftBubble(iframe);
      if (styleObserver) return;
      styleObserver = new MutationObserver(apply);
      styleObserver.observe(iframe, { attributes: true, attributeFilter: ['style'] });
      if (host instanceof HTMLElement && host !== iframe) {
        styleObserver.observe(host, { attributes: true, attributeFilter: ['style'] });
      }
    };

    const mountObserver = new MutationObserver(apply);
    mountObserver.observe(document.body, { childList: true, subtree: true });
    apply();
    document.addEventListener('tidioChat-ready', apply);
    media.addEventListener('change', apply);

    return () => {
      document.removeEventListener('tidioChat-ready', apply);
      media.removeEventListener('change', apply);
      mountObserver.disconnect();
      styleObserver?.disconnect();
    };
  }, []);

  return null;
}
