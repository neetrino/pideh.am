'use client';

import { useEffect } from 'react';

type TidioChatApi = {
  display: (visible: boolean) => void;
};

function tidioApi(): TidioChatApi | undefined {
  return (window as Window & { tidioChatApi?: TidioChatApi }).tidioChatApi;
}

function hideTidio(): void {
  tidioApi()?.display(false);
  const iframe = document.getElementById('tidio-chat-iframe');
  if (!(iframe instanceof HTMLElement)) return;
  iframe.style.setProperty('display', 'none', 'important');
  iframe.style.setProperty('visibility', 'hidden', 'important');
  iframe.style.setProperty('pointer-events', 'none', 'important');
}

/** The shop widget stays in the document after opening admin. Keep it hidden there. */
export function TidioAdminSuppress() {
  useEffect(() => {
    hideTidio();
    document.addEventListener('tidioChat-ready', hideTidio);
    const observer = new MutationObserver(hideTidio);
    observer.observe(document.body, { childList: true });

    return () => {
      document.removeEventListener('tidioChat-ready', hideTidio);
      observer.disconnect();
      tidioApi()?.display(true);
      const iframe = document.getElementById('tidio-chat-iframe');
      if (!(iframe instanceof HTMLElement)) return;
      iframe.style.removeProperty('display');
      iframe.style.removeProperty('visibility');
      iframe.style.removeProperty('pointer-events');
    };
  }, []);

  return (
    <style>
      {
        '#tidio-chat,#tidio-chat-iframe{display:none !important;visibility:hidden !important;pointer-events:none !important}'
      }
    </style>
  );
}
