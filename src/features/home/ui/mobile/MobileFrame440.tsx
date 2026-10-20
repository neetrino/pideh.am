'use client';

import { useEffect, useRef, useState, type ReactNode } from 'react';

type MobileFrame440Props = {
  /** Design-space height in Figma Mobile px (440-wide frame). */
  height: number;
  children: ReactNode;
  className?: string;
};

const FIGMA_MOBILE_WIDTH = 440;

/**
 * Locks children to the Figma Mobile 440px coordinate system and scales
 * them to the parent width (ResizeObserver — reliable unitless scale).
 */
export function MobileFrame440({ height, children, className = '' }: MobileFrame440Props) {
  const ref = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    function updateScale(width: number): void {
      if (width <= 0) return;
      setScale(width / FIGMA_MOBILE_WIDTH);
    }

    updateScale(element.getBoundingClientRect().width);

    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (!entry) return;
      updateScale(entry.contentRect.width);
    });

    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={ref} data-mobile-frame className={`relative w-full ${className}`}>
      <div
        data-mobile-frame-spacer
        data-frame-height={height}
        className="relative w-full"
        style={{ height: height * scale }}
      >
        <div
          className="absolute top-0 left-0 origin-top-left"
          style={{
            width: FIGMA_MOBILE_WIDTH,
            height,
            transform: `scale(${scale})`,
          }}
        >
          {children}
        </div>
      </div>
    </div>
  );
}
