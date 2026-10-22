/**
 * Profile on phones and portrait tablets has its own chrome.
 * Hide the shop chat bubble there; desktop profile keeps it.
 */
export function TidioProfileMobileHide() {
  return (
    <style>
      {`
@media (max-width: 767px), (orientation: portrait) and (max-width: 1199px) {
  #tidio-chat,
  #tidio-chat-iframe {
    display: none !important;
    visibility: hidden !important;
    pointer-events: none !important;
  }
}
`}
    </style>
  );
}
