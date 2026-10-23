'use client';

import Image from 'next/image';
import { annotate } from 'rough-notation';
import { useEffect, useRef } from 'react';
import { useReducedMotion } from 'motion/react';

import { AppLink } from '@/components/ui/AppLink';
import type { HeaderSearchProduct } from '@/features/products/application/search-header-products-action';

type HeaderSearchResultsProps = {
  idleLabel: string;
  emptyLabel: string;
  viewAllLabel: string;
  showIdle: boolean;
  showEmpty: boolean;
  pending: boolean;
  products: HeaderSearchProduct[];
  searchedQuery: string;
  viewAllHref: string;
  onNavigate: () => void;
};

export function HeaderSearchResults({
  idleLabel,
  emptyLabel,
  viewAllLabel,
  showIdle,
  showEmpty,
  pending,
  products,
  searchedQuery,
  viewAllHref,
  onNavigate,
}: HeaderSearchResultsProps) {
  const idleRef = useRef<HTMLParagraphElement>(null);
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    const el = idleRef.current;
    if (!el || !showIdle) return;
    const mark = annotate(el, {
      type: 'underline',
      color: '#ff6b00',
      animate: !reduceMotion,
      animationDuration: 700,
      padding: 3,
      strokeWidth: 2,
    });
    mark.show();
    return () => mark.remove();
  }, [showIdle, reduceMotion, idleLabel]);

  return (
    <>
      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
        {showIdle ? (
          <div className="relative px-5 py-10">
            <p ref={idleRef} className="text-center text-sm font-bold text-[#1e1e1e]">
              {idleLabel}
            </p>
          </div>
        ) : null}

        {pending && products.length === 0 ? (
          <div className="space-y-3 px-4 py-4" aria-hidden="true">
            {Array.from({ length: 4 }).map((_, index) => (
              <div key={index} className="flex animate-pulse items-center gap-3">
                <div className="h-14 w-14 rounded-2xl bg-[#ffd54a]/45" />
                <div className="flex-1 space-y-2">
                  <div className="h-3 w-3/4 rounded-full bg-[#1e1e1e]/10" />
                  <div className="h-3 w-1/3 rounded-full bg-[#ff6b00]/20" />
                </div>
              </div>
            ))}
          </div>
        ) : null}

        {showEmpty ? (
          <p className="px-5 py-10 text-center text-sm font-medium text-[#1e1e1e]/55">
            {emptyLabel}
          </p>
        ) : null}

        {products.length > 0 ? (
          <ul className={`space-y-1 px-2 py-2 ${pending ? 'opacity-70' : ''}`}>
            {products.map((product) => (
              <li key={product.id}>
                <AppLink
                  href={product.href}
                  prefetchPolicy="intent"
                  onClick={onNavigate}
                  className="flex items-center gap-3 rounded-2xl px-2.5 py-2.5 transition-colors hover:bg-[#ffd54a]/40"
                >
                  <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-2xl border border-[#1e1e1e]/10 bg-white">
                    {product.imageUrl ? (
                      <Image
                        src={product.imageUrl}
                        alt=""
                        fill
                        sizes="56px"
                        className="object-cover"
                      />
                    ) : null}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-bold text-[#1e1e1e]">{product.title}</p>
                    <p className="mt-0.5 text-sm font-semibold text-[#ff6b00]">
                      {product.compareAtFormatted ? (
                        <>
                          <span className="mr-2 font-medium text-[#1e1e1e]/35 line-through">
                            {product.compareAtFormatted}
                          </span>
                          <span>{product.priceFormatted}</span>
                        </>
                      ) : (
                        product.priceFormatted
                      )}
                    </p>
                  </div>
                </AppLink>
              </li>
            ))}
          </ul>
        ) : null}
      </div>

      {searchedQuery && products.length > 0 ? (
        <div className="border-t-2 border-[#1e1e1e]/10 px-4 py-3">
          <AppLink
            href={viewAllHref}
            prefetchPolicy="intent"
            onClick={onNavigate}
            className="flex h-11 items-center justify-center rounded-full bg-[#ff6b00] text-sm font-bold text-white transition hover:bg-[#e85f00]"
          >
            {viewAllLabel}
          </AppLink>
        </div>
      ) : null}
    </>
  );
}
