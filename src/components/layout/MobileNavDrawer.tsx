'use client';

import {
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { createPortal } from 'react-dom';
import { usePathname } from 'next/navigation';
import { Menu, Phone, Users, X } from 'lucide-react';

import { STOREFRONT_DESKTOP_MEDIA } from '@/components/layout/page-container';
import { LocaleCurrencySwitcher } from '@/components/layout/LocaleCurrencySwitcher';
import { AppLink } from '@/components/ui/AppLink';
import type { Dictionary } from '@/lib/i18n/get-dictionary';
import type { Locale } from '@/lib/i18n/config';
import type { Currency } from '@/lib/money/currency';

const BURGER_BAR =
  'absolute inset-x-0 h-[2.5px] rounded-full bg-[#FF6900] motion-safe:transition-transform motion-safe:duration-300 motion-safe:ease-[cubic-bezier(0.32,0.72,0,1)]';

/** Three bars that rotate into a cross. `open` is the cross. */
export function BurgerToCross({ open }: { open: boolean }) {
  return (
    <span className="relative block h-4 w-[22px]" aria-hidden="true">
      <span
        className={`${BURGER_BAR} top-0 origin-center`}
        style={{ transform: open ? 'translateY(6.75px) rotate(45deg)' : 'none' }}
      />
      <span
        className="absolute inset-x-0 top-1/2 h-[2.5px] -translate-y-1/2 rounded-full bg-[#FF6900] motion-safe:transition-opacity motion-safe:duration-200"
        style={{ opacity: open ? 0 : 1 }}
      />
      <span
        className={`${BURGER_BAR} bottom-0 origin-center`}
        style={{ transform: open ? 'translateY(-6.75px) rotate(-45deg)' : 'none' }}
      />
    </span>
  );
}

const MENU_EXIT_MS = 260;
const MENU_GAP_PX = 8;
const MENU_INSET_PX = 12;

type NavItem = {
  href: string;
  label: string;
};

type MobileNavDrawerProps = {
  locale: Locale;
  dictionary: Dictionary;
  navItems: readonly NavItem[];
  /** When set, the panel also offers the language/currency switcher. */
  currency?: Currency;
  isSignedIn: boolean;
  phoneHref: string;
  phoneNumber: string;
  phoneLabel: string;
  onOpenGroupOrder: () => void;
  /** Optional classes for the open/close trigger button. */
  triggerClassName?: string;
  /** When set, replaces the default Menu/X glyphs inside the trigger. */
  triggerContent?: ReactNode | ((open: boolean) => ReactNode);
  /** True while the menu is on screen, including the close animation. */
  onPresenceChange?: (present: boolean) => void;
};

function isNavItemActive(pathname: string, href: string, locale: Locale): boolean {
  if (href === `/${locale}` || href === `/${locale}/`) {
    return pathname === `/${locale}` || pathname === `/${locale}/`;
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}

/**
 * Pideh mobile nav: floating white panel under the header/trigger
 * (not a side sheet), with warm scrim + scale/fade motion.
 */
export function MobileNavDrawer({
  locale,
  dictionary,
  navItems,
  currency,
  isSignedIn,
  phoneHref,
  phoneNumber,
  phoneLabel,
  onOpenGroupOrder,
  triggerClassName,
  triggerContent,
  onPresenceChange,
}: MobileNavDrawerProps) {
  const menuId = useId();
  const pathname = usePathname() ?? '';
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const exitTimerRef = useRef<number | null>(null);
  const renderedRef = useRef(false);

  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [rendered, setRendered] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [panelTopPx, setPanelTopPx] = useState(72);
  const [pillBox, setPillBox] = useState<{
    top: number;
    right: number;
    bottom: number;
    left: number;
    width: number;
    height: number;
  } | null>(null);

  const clearExitTimer = useCallback(() => {
    if (exitTimerRef.current !== null) {
      window.clearTimeout(exitTimerRef.current);
      exitTimerRef.current = null;
    }
  }, []);

  const measureHeader = useCallback(() => {
    const trigger = triggerRef.current;
    // Prefer the header this trigger actually lives in — the storefront
    // renders both the desktop and the mobile chrome.
    const header =
      trigger?.closest<HTMLElement>('[data-site-header]') ??
      document.querySelector<HTMLElement>('[data-site-header]');
    const pill = trigger?.closest<HTMLElement>('[data-mobile-menu-pill]');
    if (pill) {
      const box = pill.getBoundingClientRect();
      setPillBox({
        top: box.top,
        right: box.right,
        bottom: box.bottom,
        left: box.left,
        width: box.width,
        height: box.height,
      });
    }

    if (header) {
      setPanelTopPx(header.getBoundingClientRect().bottom);
      return;
    }
    if (trigger) {
      setPanelTopPx(trigger.getBoundingClientRect().bottom);
    }
  }, []);

  const openMenu = useCallback(() => {
    clearExitTimer();
    measureHeader();
    renderedRef.current = true;
    setRendered(true);
    setExpanded(false);
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        setExpanded(true);
      });
    });
  }, [clearExitTimer, measureHeader]);

  const closeMenu = useCallback(() => {
    clearExitTimer();
    setExpanded(false);
    exitTimerRef.current = window.setTimeout(() => {
      renderedRef.current = false;
      setRendered(false);
      exitTimerRef.current = null;
    }, MENU_EXIT_MS);
  }, [clearExitTimer]);

  const toggleMenu = useCallback(() => {
    setOpen((current) => !current);
  }, []);

  useEffect(() => {
    setMounted(true);
    return () => clearExitTimer();
  }, [clearExitTimer]);

  useEffect(() => {
    if (open) {
      openMenu();
      return;
    }
    if (!renderedRef.current) return;
    closeMenu();
  }, [open, openMenu, closeMenu]);

  useEffect(() => {
    const media = window.matchMedia(STOREFRONT_DESKTOP_MEDIA);
    function closeOnDesktop(): void {
      if (media.matches) setOpen(false);
    }
    closeOnDesktop();
    media.addEventListener('change', closeOnDesktop);
    return () => media.removeEventListener('change', closeOnDesktop);
  }, []);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    onPresenceChange?.(rendered);
  }, [rendered, onPresenceChange]);

  useLayoutEffect(() => {
    if (!rendered) return;
    measureHeader();
    window.addEventListener('resize', measureHeader);
    return () => window.removeEventListener('resize', measureHeader);
  }, [rendered, measureHeader]);

  useEffect(() => {
    if (!rendered) return;

    function handleKeyDown(event: KeyboardEvent): void {
      if (event.key === 'Escape') setOpen(false);
    }

    function handleTouchMove(event: TouchEvent): void {
      const target = event.target;
      if (!(target instanceof Node)) return;
      if (panelRef.current?.contains(target)) return;
      const header = triggerRef.current?.closest('[data-site-header]');
      if (header?.contains(target)) return;
      event.preventDefault();
    }

    measureHeader();
    document.addEventListener('touchmove', handleTouchMove, { passive: false });
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('scroll', measureHeader, { passive: true });
    return () => {
      document.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('scroll', measureHeader);
    };
  }, [rendered, measureHeader]);

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        onClick={toggleMenu}
        className={
          triggerClassName ??
          'relative flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full bg-pideh-ink text-white transition-opacity hover:opacity-80 touch-manipulation sm:h-10 sm:w-10'
        }
        aria-label={open ? dictionary.nav.closeMenu : dictionary.nav.openMenu}
        aria-expanded={open}
        aria-controls={menuId}
      >
        {(typeof triggerContent === 'function' ? triggerContent(open) : triggerContent) ?? (
          <>
            <Menu
              className="pointer-events-none absolute h-4 w-4 transition-[opacity,transform] duration-[280ms] ease-out sm:h-5 sm:w-5"
              aria-hidden="true"
              style={{
                opacity: open ? 0 : 1,
                transform: open ? 'rotate(-90deg) scale(0.82)' : 'rotate(0deg) scale(1)',
              }}
            />
            <X
              className="pointer-events-none absolute h-4 w-4 transition-[opacity,transform] duration-[280ms] ease-out sm:h-5 sm:w-5"
              aria-hidden="true"
              style={{
                opacity: open ? 1 : 0,
                transform: open ? 'rotate(0deg) scale(1)' : 'rotate(90deg) scale(0.82)',
              }}
            />
          </>
        )}
      </button>

      {mounted && rendered
        ? createPortal(
            <div>
              {pillBox ? (
                <div
                  aria-hidden="true"
                  className={`pointer-events-none fixed z-[60] rounded-full transition-opacity duration-[260ms] ${
                    expanded ? 'opacity-100' : 'opacity-0'
                  }`}
                  style={{
                    top: pillBox.top,
                    left: pillBox.left,
                    width: pillBox.width,
                    height: pillBox.height,
                    boxShadow: '0 0 0 100vmax rgba(30, 30, 30, 0.35)',
                  }}
                />
              ) : null}
              <button
                type="button"
                aria-label={dictionary.nav.closeMenu}
                className={`fixed inset-0 z-[60] cursor-pointer border-0 bg-transparent transition-[opacity,visibility] duration-[260ms] ease-[cubic-bezier(0.32,0.72,0,1)] ${
                  expanded
                    ? 'pointer-events-auto visible opacity-100'
                    : 'pointer-events-none invisible opacity-0'
                }`}
                style={
                  pillBox
                    ? {
                        clipPath: `polygon(evenodd, 0 0, 100% 0, 100% 100%, 0 100%, 0 0, ${pillBox.left}px ${pillBox.top}px, ${pillBox.right}px ${pillBox.top}px, ${pillBox.right}px ${pillBox.bottom}px, ${pillBox.left}px ${pillBox.bottom}px)`,
                      }
                    : undefined
                }
                onClick={() => setOpen(false)}
              />
              <div
                ref={panelRef}
                id={menuId}
                role="dialog"
                aria-modal="true"
                aria-label={dictionary.nav.navigation}
                className={`fixed z-[75] overflow-hidden rounded-[28px] bg-white px-6 shadow-[0_16px_40px_rgba(30,30,30,0.14)] transition-opacity duration-[260ms] ease-[cubic-bezier(0.32,0.72,0,1)] ${
                  expanded ? 'opacity-100' : 'opacity-0'
                }`}
                style={{
                  top: pillBox ? pillBox.bottom + MENU_GAP_PX : panelTopPx + MENU_GAP_PX,
                  right: MENU_INSET_PX,
                  left: MENU_INSET_PX,
                  width: 'auto',
                  maxHeight: `calc(100dvh - ${(pillBox ? pillBox.bottom + MENU_GAP_PX : panelTopPx + MENU_GAP_PX) + MENU_INSET_PX}px)`,
                }}
              >
                <nav
                  aria-label={dictionary.nav.navigation}
                  className="flex max-h-inherit flex-col overflow-y-auto pb-[max(0.75rem,env(safe-area-inset-bottom))]"
                >
                  <div className="flex flex-col py-4">
                    <a
                      href={phoneHref}
                      aria-label={phoneLabel}
                      className="font-montserrat-arm flex items-center gap-2.5 rounded-xl px-1 py-3 text-[16px] leading-none font-black tracking-tight text-pideh-ink"
                    >
                      <Phone className="size-5 shrink-0 text-[#ff6b00]" aria-hidden="true" />
                      {phoneNumber}
                    </a>
                    {navItems.map((item) => {
                      const active = isNavItemActive(pathname, item.href, locale);
                      return (
                        <AppLink
                          key={item.href}
                          href={item.href}
                          prefetchPolicy="intent"
                          aria-current={active ? 'page' : undefined}
                          className={`font-montserrat-arm rounded-xl px-1 py-3 text-[16px] leading-none font-black tracking-tight transition-colors ${
                            active
                              ? 'text-pideh-orange'
                              : 'text-pideh-ink hover:bg-pideh-cream hover:text-pideh-orange'
                          }`}
                          onClick={() => setOpen(false)}
                        >
                          {item.label}
                        </AppLink>
                      );
                    })}
                  </div>

                  {currency ? (
                    <div className="border-t border-pideh-ink/10 px-1 py-4">
                      <LocaleCurrencySwitcher
                        locale={locale}
                        currency={currency}
                        currencyLabel={dictionary.header.currency}
                        languageLabel={dictionary.header.language}
                        embedded
                      />
                    </div>
                  ) : null}

                  <div className="border-t border-pideh-ink/10 py-5">
                    <button
                      type="button"
                      className="mb-3 flex h-12 w-full items-center justify-center gap-2 rounded-full bg-[#ff6b00] px-6 text-sm font-bold text-white"
                      onClick={() => {
                        setOpen(false);
                        onOpenGroupOrder();
                      }}
                    >
                      <Users className="size-4" aria-hidden="true" />
                      {dictionary.groupOrder.createButton}
                    </button>
                    {isSignedIn ? null : (
                      <AppLink
                        href={`/${locale}/login`}
                        prefetchPolicy="intent"
                        className="font-montserrat-arm flex w-full items-center justify-center rounded-full bg-pideh-ink px-6 py-3.5 text-base font-bold text-white transition-colors hover:bg-pideh-orange"
                        onClick={() => setOpen(false)}
                      >
                        {dictionary.header.login}
                      </AppLink>
                    )}
                  </div>
                </nav>
              </div>
            </div>,
            document.body,
          )
        : null}
    </>
  );
}
