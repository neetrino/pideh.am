import Image from 'next/image';
import type { RefObject } from 'react';

/**
 * Product photo inside the orange PDP band.
 * Fits the hero so the whole product stays visible above the white sheet.
 *
 * @see https://www.figma.com/design/zyLVZFDhohLYxwuohIrPDN/Pideh-Dev?node-id=268-594
 */
type MobileProductImageProps = {
  src: string;
  alt: string;
  imageRef: RefObject<HTMLDivElement | null>;
  /** Shawarma shots are smaller and upright; pide already fills the hero on a tilt. */
  emphasize?: boolean;
};

export function MobileProductImage({ src, alt, imageRef, emphasize = false }: MobileProductImageProps) {
  return (
    <div
      ref={imageRef}
      data-node-id="268:594"
      className={
        emphasize
          ? 'pointer-events-none absolute inset-x-0 top-14 bottom-0 z-0'
          : 'pointer-events-none absolute inset-x-1 top-16 bottom-1 z-0'
      }
    >
      <Image
        src={src}
        alt={alt}
        fill
        sizes="100vw"
        priority
        className={
          emphasize
            ? 'origin-center scale-[1.55] -rotate-[18deg] object-contain object-center'
            : 'origin-center scale-110 object-contain object-center'
        }
      />
    </div>
  );
}
