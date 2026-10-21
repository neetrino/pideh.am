'use client';

import { useLayoutEffect, useRef, useState, type ReactNode } from 'react';

type MobileFrame440Props = {
  /** Design-space height in Figma Mobile px (440-wide frame). */
  height: number;
  children: ReactNode;
  className?: string;
};

const FIGMA_MOBILE_WIDTH = 440;

/**
 * Locks children to the Figma Mobile 440px coordinate system and scales
 * them to the parent width.
 *
 * The scaled layer is out of flow. Its scale is the parent's real width
 * (`clientWidth`), which matches the phone. `100vw` is only the first paint.
 * `zoom` and container-query scale leave a 440px box on iOS and shift the page.
 */
export function MobileFrame440({ height, children, className = '' }: MobileFrame440Props) {
  const ref = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState<number | null>(null);

  useLayoutEffect(() => {
    const element = ref.current;
    if (!element) return;

    function update(): void {
      const width = element?.clientWidth ?? 0;
      if (width > 0) {
        setScale(width / FIGMA_MOBILE_WIDTH);
      }
    }

    update();

    const observer = new ResizeObserver(() => {
      update();
    });
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  const scaleCss =
    scale === null ? `calc(100vw / ${FIGMA_MOBILE_WIDTH}px)` : String(scale);
  const heightCss =
    scale === null ? `calc(${height} * 100vw / ${FIGMA_MOBILE_WIDTH})` : height * scale;

  return (
    <div ref={ref} data-mobile-frame className={`relative w-full max-w-full ${className}`}>
      <div data-mobile-frame-spacer data-frame-height={height} className="relative w-full" style={{ height: heightCss }}>
        <div
          className="absolute top-0 left-0 origin-top-left"
          style={{
            width: FIGMA_MOBILE_WIDTH,
            height,
            transform: `scale(${scaleCss})`,
          }}
        >
          {children}
        </div>
      </div>
    </div>
  );
}
