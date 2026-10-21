'use client';

import { useEffect } from 'react';

const LIFT_STYLE_ID = 'pideh-tidio-lift';
/**
 * Tidio renders inside an open shadow root on #tidio-chat, so page CSS cannot reach it.
 * 440px frame: the closed bubble and its label sit above the mobile dock icons.
 */
const LIFT_CSS = `
@media (max-width: 767px), (orientation: portrait) and (max-width: 1199px) {
  #button.chat-closed,
  .widgetLabel {
    translate: 0 calc(-1 * (100vw * 168 / 440 + env(safe-area-inset-bottom, 0px))) !important;
  }
}`;

const OVERLAY_QUERY =
  '[role="dialog"][aria-modal="true"], [role="alertdialog"][aria-modal="true"]';
/** Side sheets and modals start at z-50. */
const BELOW_OVERLAY_Z = '30';

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

function ensureLiftStyle(root: ShadowRoot): void {
  if (root.getElementById(LIFT_STYLE_ID)) return;
  const style = document.createElement('style');
  style.id = LIFT_STYLE_ID;
  style.textContent = LIFT_CSS;
  root.appendChild(style);
}

/** Keeps the chat above the mobile dock, and behind open modals and side sheets. */
export function TidioMobileLift() {
  useEffect(() => {
    let shadowObserver: MutationObserver | undefined;

    const apply = () => {
      const host = document.getElementById('tidio-chat');
      if (!(host instanceof HTMLElement)) return;
      stackUnderOverlay(host, document.querySelector(OVERLAY_QUERY) != null);
      const root = host.shadowRoot;
      if (!root) return;
      ensureLiftStyle(root);
      if (shadowObserver) return;
      shadowObserver = new MutationObserver(() => ensureLiftStyle(root));
      shadowObserver.observe(root, { childList: true });
    };

    const mountObserver = new MutationObserver(apply);
    mountObserver.observe(document.body, { childList: true, subtree: true });
    apply();
    document.addEventListener('tidioChat-ready', apply);

    return () => {
      document.removeEventListener('tidioChat-ready', apply);
      mountObserver.disconnect();
      shadowObserver?.disconnect();
    };
  }, []);

  return null;
}
