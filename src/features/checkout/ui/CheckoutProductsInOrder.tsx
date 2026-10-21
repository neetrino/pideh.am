'use client';

import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useRef, useState, useTransition } from 'react';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';

import type { CheckoutOrderProduct } from '@/features/checkout/ui/checkout-order-product';
import { removeItem } from '@/features/cart/cart';

type CheckoutProductsInOrderProps = {
  products: CheckoutOrderProduct[];
  title: string;
  itemsOneLabel: string;
  itemsManyLabel: string;
  removeItemLabel: string;
  previousItemsLabel: string;
  nextItemsLabel: string;
  onCartChanged?: () => void;
};

function formatItemCount(count: number, itemsOneLabel: string, itemsManyLabel: string): string {
  if (count === 1) {
    return itemsOneLabel;
  }
  return itemsManyLabel.replace('{count}', String(count));
}

function readScrollStep(scroller: HTMLElement): number {
  const first = scroller.children.item(0);
  const second = scroller.children.item(1);
  if (first instanceof HTMLElement && second instanceof HTMLElement) {
    return second.offsetLeft - first.offsetLeft;
  }
  if (first instanceof HTMLElement) {
    return first.offsetWidth;
  }
  return Math.round(scroller.clientWidth * 0.75);
}

const SCROLL_BUTTON =
  'hidden size-8 items-center justify-center rounded-full border border-[#1e1e1e]/10 bg-[#fff8e7] text-[#1e1e1e]/70 transition-colors hover:border-[#ff6b00] hover:text-[#ff6b00] disabled:pointer-events-none disabled:opacity-40 sm:inline-flex';

export function CheckoutProductsInOrder({
  products: initialProducts,
  title,
  itemsOneLabel,
  itemsManyLabel,
  removeItemLabel,
  previousItemsLabel,
  nextItemsLabel,
  onCartChanged,
}: CheckoutProductsInOrderProps) {
  const router = useRouter();
  const scrollerRef = useRef<HTMLUListElement>(null);
  const [products, setProducts] = useState(initialProducts);
  const [pending, startTransition] = useTransition();
  const [canPrev, setCanPrev] = useState(false);
  const [canNext, setCanNext] = useState(false);

  const updateEdges = useCallback((): void => {
    const scroller = scrollerRef.current;
    if (!scroller) {
      return;
    }
    const maxScroll = scroller.scrollWidth - scroller.clientWidth;
    setCanPrev(scroller.scrollLeft > 1);
    setCanNext(scroller.scrollLeft < maxScroll - 1);
  }, []);

  useEffect(() => {
    setProducts(initialProducts);
  }, [initialProducts]);

  useEffect(() => {
    const scroller = scrollerRef.current;
    if (!scroller) {
      return;
    }
    updateEdges();
    scroller.addEventListener('scroll', updateEdges, { passive: true });
    const observer = new ResizeObserver(updateEdges);
    observer.observe(scroller);
    return () => {
      scroller.removeEventListener('scroll', updateEdges);
      observer.disconnect();
    };
  }, [products.length, updateEdges]);

  function scrollByDirection(direction: -1 | 1): void {
    const scroller = scrollerRef.current;
    if (!scroller) {
      return;
    }
    scroller.scrollBy({
      left: direction * readScrollStep(scroller),
      behavior: 'smooth',
    });
  }

  const itemCount = products.reduce((sum, product) => sum + product.quantity, 0);

  if (products.length === 0) {
    return null;
  }

  function onRemove(itemId: string): void {
    setProducts((current) => current.filter((product) => product.id !== itemId));
    onCartChanged?.();

    startTransition(async () => {
      await removeItem(itemId);
      router.refresh();
    });
  }

  return (
    <section
      className="mb-8 rounded-[26px] border-t-[3px] border-t-[#ff6b00] bg-white px-5 py-5 sm:px-6"
      aria-label={title}
    >
      <div className="mb-4 flex items-center justify-between gap-4">
        <h2 className="font-display text-2xl leading-none text-[#1e1e1e] uppercase">{title}</h2>
        <div className="flex shrink-0 items-center gap-2">
          <p className="text-sm font-bold text-[#1e1e1e]/70">
            {formatItemCount(itemCount, itemsOneLabel, itemsManyLabel)}
          </p>
          <button
            type="button"
            onClick={() => scrollByDirection(-1)}
            disabled={!canPrev}
            aria-label={previousItemsLabel}
            className={SCROLL_BUTTON}
          >
            <ChevronLeft className="size-4" aria-hidden />
          </button>
          <button
            type="button"
            onClick={() => scrollByDirection(1)}
            disabled={!canNext}
            aria-label={nextItemsLabel}
            className={SCROLL_BUTTON}
          >
            <ChevronRight className="size-4" aria-hidden />
          </button>
        </div>
      </div>

      <ul
        ref={scrollerRef}
        className="flex gap-3 overflow-x-auto overscroll-x-contain [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {products.map((product) => (
          <li
            key={product.id}
            className="relative w-[min(100%,18rem)] shrink-0 rounded-[20px] border border-[#ff6b00]/15 bg-[#fff8e7]/40 p-3"
          >
            <button
              type="button"
              onClick={() => onRemove(product.id)}
              disabled={pending}
              className="absolute top-2 right-2 flex size-7 items-center justify-center rounded-full text-[#1e1e1e]/40 transition hover:bg-white hover:text-[#ff6b00] disabled:opacity-60"
              aria-label={removeItemLabel}
            >
              <X className="size-4" aria-hidden />
            </button>
            <div className="flex items-center gap-3 pr-6">
              <div className="relative size-16 shrink-0 overflow-hidden rounded-2xl bg-[#fff8e7] sm:size-[4.5rem]">
                {product.imageUrl ? (
                  <Image
                    src={product.imageUrl}
                    alt={product.title}
                    fill
                    sizes="72px"
                    className="object-contain p-1"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-xs text-[#1e1e1e]/35">
                    —
                  </div>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="line-clamp-2 text-sm font-bold text-[#1e1e1e]" title={product.title}>
                  {product.title}
                </p>
                {product.modifierSummary ? (
                  <p
                    className="mt-0.5 line-clamp-1 text-xs text-[#1e1e1e]/55"
                    title={product.modifierSummary}
                  >
                    {product.modifierSummary}
                  </p>
                ) : null}
                <div className="mt-1 flex items-center justify-between gap-2">
                  <p className="truncate text-sm font-semibold text-[#ff6b00]">
                    {product.lineTotalFormatted}
                  </p>
                  <span className="inline-flex h-6 min-w-6 shrink-0 items-center justify-center rounded-full border border-[#ff6b00]/20 bg-white px-2 text-[11px] font-semibold text-[#1e1e1e]">
                    ×{product.quantity}
                  </span>
                </div>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
