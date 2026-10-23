'use client';

import { useEffect, useId, useRef, useState, useTransition, type AnimationEvent } from 'react';
import { createPortal } from 'react-dom';
import { Search, X } from 'lucide-react';

import { catalogHref } from '@/features/products/application/catalog-search-params';
import { DEFAULT_CATALOG_PAGE_SIZE, DEFAULT_CATALOG_SORT } from '@/features/products/schemas/catalog-list';
import {
  searchHeaderProductsAction,
  type HeaderSearchProduct,
} from '@/features/products/application/search-header-products-action';
import { HeaderSearchResults } from '@/features/products/ui/HeaderSearchResults';
import type { Locale } from '@/lib/i18n/config';
import type { Currency } from '@/lib/money/currency';

const SEARCH_EXIT_MS = 320;
const SEARCH_DEBOUNCE_MS = 300;
const MIN_QUERY_LENGTH = 1;

type HeaderSearchLabels = {
  open: string;
  close: string;
  placeholder: string;
  idle: string;
  empty: string;
  viewAll: string;
};

type HeaderSearchProps = {
  locale: Locale;
  currency: Currency;
  labels: HeaderSearchLabels;
};

/**
 * Header search icon + centered popup with live product name results.
 */
export function HeaderSearch({ locale, currency, labels }: HeaderSearchProps) {
  const titleId = useId();
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const requestIdRef = useRef(0);

  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [rendered, setRendered] = useState(false);
  const [exiting, setExiting] = useState(false);
  const [query, setQuery] = useState('');
  const [products, setProducts] = useState<HeaderSearchProduct[]>([]);
  const [searchedQuery, setSearchedQuery] = useState('');
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (open) {
      setExiting(false);
      setRendered(true);
      return;
    }

    if (!rendered) return;

    setExiting(true);
    const timer = window.setTimeout(() => {
      finishExit();
    }, SEARCH_EXIT_MS);

    return () => window.clearTimeout(timer);
  }, [open, rendered]);

  useEffect(() => {
    if (!rendered || exiting) return;

    const focusTimer = window.setTimeout(() => {
      inputRef.current?.focus();
    }, 40);

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    function handleKeyDown(event: KeyboardEvent): void {
      if (event.key === 'Escape') {
        setOpen(false);
      }
    }

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      window.clearTimeout(focusTimer);
      document.body.style.overflow = previousOverflow;
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [rendered, exiting]);

  useEffect(() => {
    if (!open) return;

    const trimmed = query.trim();
    if (trimmed.length < MIN_QUERY_LENGTH) {
      requestIdRef.current += 1;
      setProducts([]);
      setSearchedQuery('');
      return;
    }

    const requestId = ++requestIdRef.current;
    const timer = window.setTimeout(() => {
      startTransition(async () => {
        const result = await searchHeaderProductsAction(locale, currency, trimmed);
        if (requestId !== requestIdRef.current) return;
        setProducts(result.products);
        setSearchedQuery(result.query);
      });
    }, SEARCH_DEBOUNCE_MS);

    return () => window.clearTimeout(timer);
  }, [open, query, locale, currency]);

  function closePopup(): void {
    setOpen(false);
  }

  function finishExit(): void {
    setRendered(false);
    setExiting(false);
    setQuery('');
    setProducts([]);
    setSearchedQuery('');
  }

  function handlePanelAnimationEnd(event: AnimationEvent<HTMLDivElement>): void {
    if (event.target !== event.currentTarget) return;
    if (!event.animationName.includes('confirm-dialog-panel-out')) return;
    finishExit();
  }

  const backdropClass = exiting
    ? 'animate-confirm-dialog-backdrop-out'
    : 'animate-confirm-dialog-backdrop-in';
  const panelClass = exiting
    ? 'animate-confirm-dialog-panel-out'
    : 'animate-confirm-dialog-panel-in';

  const showIdle = searchedQuery.length === 0 && !pending;
  const showEmpty = searchedQuery.length > 0 && products.length === 0 && !pending;
  const viewAllHref = catalogHref(locale, {
    q: searchedQuery || query.trim(),
    sort: DEFAULT_CATALOG_SORT,
    page: 1,
    pageSize: DEFAULT_CATALOG_PAGE_SIZE,
  });

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label={labels.open}
        className="relative inline-flex h-11 w-11 items-center justify-center rounded-full text-[#1e1e1e] transition-colors duration-150 hover:bg-[#ffd54a] hover:text-[#1e1e1e]"
      >
        <Search className="h-5 w-5" strokeWidth={2.25} aria-hidden="true" />
      </button>

      {mounted && rendered
        ? createPortal(
            <div
              className="fixed inset-0 z-[300] flex items-start justify-center p-4 pt-[12vh] sm:pt-[15vh]"
              role="dialog"
              aria-modal="true"
              aria-labelledby={titleId}
            >
              <button
                type="button"
                className={`absolute inset-0 cursor-pointer bg-[#1e1e1e]/45 ${backdropClass}`}
                aria-label={labels.close}
                onClick={closePopup}
              />
              <div
                className={`relative z-[1] flex max-h-[min(70vh,560px)] w-full max-w-lg flex-col overflow-hidden rounded-[28px] border-2 border-[#1e1e1e] bg-[#fff8e7] shadow-[8px_8px_0_#1e1e1e] ${panelClass}`}
                onAnimationEnd={handlePanelAnimationEnd}
              >
                <div className="flex items-center gap-2 border-b-2 border-[#1e1e1e]/10 px-4 py-3">
                  <Search
                    className="h-5 w-5 shrink-0 text-[#ff6b00]"
                    strokeWidth={2.25}
                    aria-hidden="true"
                  />
                  <label htmlFor={inputId} className="sr-only" id={titleId}>
                    {labels.open}
                  </label>
                  <input
                    ref={inputRef}
                    id={inputId}
                    type="text"
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                    placeholder={labels.placeholder}
                    autoComplete="off"
                    className="min-w-0 flex-1 bg-transparent text-base font-semibold text-[#1e1e1e] outline-none placeholder:font-medium placeholder:text-[#1e1e1e]/35"
                  />
                  <button
                    type="button"
                    onClick={closePopup}
                    aria-label={labels.close}
                    className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#ff6b00] text-white transition hover:bg-[#e85f00]"
                  >
                    <X className="h-4 w-4" strokeWidth={2.5} aria-hidden="true" />
                  </button>
                </div>

                <HeaderSearchResults
                  idleLabel={labels.idle}
                  emptyLabel={labels.empty}
                  viewAllLabel={labels.viewAll}
                  showIdle={showIdle}
                  showEmpty={showEmpty}
                  pending={pending}
                  products={products}
                  searchedQuery={searchedQuery}
                  viewAllHref={viewAllHref}
                  onNavigate={closePopup}
                />
              </div>
            </div>,
            document.body,
          )
        : null}
    </>
  );
}
