'use client';

import Image from 'next/image';
import { useState } from 'react';

import type { ProductGalleryImage } from '@/features/products/types';

type ProductGalleryProps = {
  images: ProductGalleryImage[];
  title: string;
  discountPercent?: number | null;
  inStock: boolean;
  outOfStockLabel: string;
  /** Same tilt as the mobile shawarma hero. */
  emphasize?: boolean;
};

export function ProductGallery({
  images,
  title,
  discountPercent = null,
  inStock,
  outOfStockLabel,
  emphasize = false,
}: ProductGalleryProps) {
  const [selectedId, setSelectedId] = useState(images[0]?.id ?? null);
  const selected = images.find((image) => image.id === selectedId) ?? images[0] ?? null;

  return (
    <div className="flex flex-col gap-3">
      <div className="relative flex aspect-[657/575] w-full items-center justify-center overflow-hidden rounded-[24px] bg-[#fff3e0]">
        {selected ? (
          <span className="absolute inset-4">
            <Image
              src={selected.url}
              alt={selected.alt || title}
              fill
              sizes="(max-width: 1024px) 100vw, 657px"
              className={
                emphasize
                  ? 'origin-center scale-[1.35] -rotate-[18deg] object-contain'
                  : 'object-contain'
              }
              priority
            />
          </span>
        ) : (
          <span className="text-sm text-[#6b6b6b]">—</span>
        )}
        {discountPercent != null ? (
          <span className="absolute top-4 left-4 z-10 rounded-[12px] bg-[#ff6b00] px-3 py-1.5 text-sm font-bold text-white">
            −{discountPercent}%
          </span>
        ) : null}
        {!inStock ? (
          <span className="absolute top-4 right-4 z-10 rounded-[12px] bg-[#1e1e1e]/90 px-3 py-1.5 text-sm font-bold text-white">
            {outOfStockLabel}
          </span>
        ) : null}
      </div>

      {images.length > 1 ? (
        <ul className="flex flex-wrap gap-2" role="list">
          {images.map((image) => (
            <GalleryThumb
              key={image.id}
              image={image}
              title={title}
              isActive={image.id === selected?.id}
              onSelect={setSelectedId}
            />
          ))}
        </ul>
      ) : null}
    </div>
  );
}

function GalleryThumb({
  image,
  title,
  isActive,
  onSelect,
}: {
  image: ProductGalleryImage;
  title: string;
  isActive: boolean;
  onSelect: (id: string) => void;
}) {
  return (
    <li>
      <button
        type="button"
        onClick={() => onSelect(image.id)}
        aria-label={image.alt || title}
        aria-pressed={isActive}
        className={`relative h-16 w-16 overflow-hidden rounded-[12px] bg-[#fff3e0] transition ${
          isActive
            ? 'ring-2 ring-white ring-offset-2 ring-offset-[#ff6b00]'
            : 'opacity-80 hover:opacity-100'
        }`}
      >
        <Image src={image.url} alt="" fill sizes="64px" className="object-cover" />
      </button>
    </li>
  );
}
