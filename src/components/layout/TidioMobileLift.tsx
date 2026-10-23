'use client';

import { useEffect } from 'react';

const LIFT_STYLE_ID = 'pideh-tidio-lift';
/**
 * Tidio renders inside an open shadow root on #tidio-chat, so page CSS cannot reach it.
 * 440px frame: the closed bubble and its label sit just above the mobile dock icons.
 */
const LIFT_CSS = `
@media (max-width: 767px), (orientation: portrait) and (max-width: 1199px) {
  #button.chat-closed,
  .widgetLabel {
    translate: 0 calc(-1 * (100vw * 132 / 440 + env(safe-area-inset-bottom, 0px))) !important;
  }
}`;

const OVERLAY_QUERY = '[data-side-sheet]';
/** Above the header (80), bottom nav (50), and sticky summary cards. */
const ABOVE_PAGE_Z = '90';
/** Side sheets start at z-50. The bubble stays behind an open sheet. */
const BELOW_OVERLAY_Z = '30';

function stackChat(node: HTMLElement, covered: boolean): void {
  node.style.setProperty('z-index', covered ? BELOW_OVERLAY_Z : ABOVE_PAGE_Z, 'important');
}

function ensureLiftStyle(root: ShadowRoot): void {
  if (root.getElementById(LIFT_STYLE_ID)) return;
  const style = document.createElement('style');
  style.id = LIFT_STYLE_ID;
  style.textContent = LIFT_CSS;
  root.appendChild(style);
}

/** Keeps the chat above the page, and behind an open side sheet. */
export function TidioMobileLift() {
  useEffect(() => {
    let shadowObserver: MutationObserver | undefined;

    const apply = () => {
      const covered = document.querySelector(OVERLAY_QUERY) != null;
      for (const id of ['tidio-chat', 'tidio-chat-iframe']) {
        const node = document.getElementById(id);
        if (node instanceof HTMLElement) stackChat(node, covered);
      }
      const host = document.getElementById('tidio-chat');
      if (!(host instanceof HTMLElement)) return;
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
