'use client';

import { animate, useInView, useReducedMotion } from 'motion/react';
import { useEffect, useMemo, useRef } from 'react';

import type { DripWaveSpec } from '@/features/home/ui/wave-paths';

type SwimDripWaveProps = {
  spec: DripWaveSpec;
  className?: string;
  /**
   * `slice` keeps the drip shape on wide screens. `none` stretches the path
   * to the box, which flattens the crest on an iMac-width footer.
   */
  preserveAspectRatio?: 'none' | 'xMidYMin slice';
};

const PATH_TOKEN = /[A-Za-z]|-?\d*\.?\d+(?:e[-+]?\d+)?/g;
/** M + 7 crest cubics → 2 + 7×6 numeric tokens. */
const CREST_NUMBER_COUNT = 44;
const SWELL_SPREAD = 0.42;
const ROLL_AMPLITUDE = 14;
/** Cap path rebuilds — full SVG `d` morphs are expensive. */
const MIN_FRAME_MS = 32;

type CrestSlot = {
  tokenIndex: number;
  targetY: number;
  nx: number;
};

type CompiledCrest = {
  tokens: string[];
  slots: CrestSlot[];
};

const compiledCache = new Map<string, CompiledCrest>();

function viewBoxWidth(viewBox: string): number {
  const width = Number(viewBox.split(' ')[2]);
  return Number.isFinite(width) && width > 0 ? width : 1;
}

function clamp01(value: number): number {
  return Math.min(1, Math.max(0, value));
}

function easeOutCubic(value: number): number {
  return 1 - (1 - value) ** 3;
}

function swellY(targetY: number, nx: number, horizon: number, progress: number): number {
  const local = clamp01((progress - SWELL_SPREAD * nx) / (1 - SWELL_SPREAD));
  const swell = easeOutCubic(local);
  const roll =
    Math.sin(nx * Math.PI * 3 + progress * Math.PI) * ROLL_AMPLITUDE * swell * (1 - swell);
  return horizon + (targetY - horizon) * swell + roll;
}

function compileCrestPath(full: string, width: number): CompiledCrest {
  const cacheKey = `${width}|${full}`;
  const cached = compiledCache.get(cacheKey);
  if (cached) {
    return cached;
  }

  const tokens = full.match(PATH_TOKEN) ?? [];
  const slots: CrestSlot[] = [];
  let numbersSeen = 0;
  let pendingX: number | null = null;

  for (let index = 0; index < tokens.length; index += 1) {
    const token = tokens[index] ?? '';
    if (/^[A-Za-z]$/.test(token)) {
      continue;
    }

    const numeric = Number(token);
    const isCrestY = numbersSeen < CREST_NUMBER_COUNT && pendingX !== null;
    const isStartY = numbersSeen === 56;

    if (isCrestY || isStartY) {
      slots.push({
        tokenIndex: index,
        targetY: numeric,
        nx: clamp01((pendingX ?? 0) / width),
      });
      pendingX = null;
    } else {
      pendingX = numeric;
    }
    numbersSeen += 1;
  }

  const compiled = { tokens, slots };
  compiledCache.set(cacheKey, compiled);
  return compiled;
}

function buildCrestPath(compiled: CompiledCrest, horizon: number, progress: number): string {
  if (progress >= 1) {
    // Final frame uses original token strings (already in compiled.tokens).
    const finalTokens = compiled.tokens.slice();
    for (const slot of compiled.slots) {
      finalTokens[slot.tokenIndex] = String(slot.targetY);
    }
    return finalTokens.join(' ');
  }

  const tokens = compiled.tokens.slice();
  for (const slot of compiled.slots) {
    tokens[slot.tokenIndex] = String(swellY(slot.targetY, slot.nx, horizon, progress));
  }
  return tokens.join(' ');
}

/**
 * Straight full-bleed edge until the band scrolls into view, then the swell
 * plays once and stays. Path morphing updates the DOM directly (throttled)
 * so React/Motion does not rebuild SVG props every frame.
 */
export function SwimDripWave({
  spec,
  className = '',
  preserveAspectRatio = 'none',
}: SwimDripWaveProps) {
  const reduceMotion = useReducedMotion();
  const rootRef = useRef<HTMLDivElement>(null);
  const pathRef = useRef<SVGPathElement>(null);
  const inView = useInView(rootRef, {
    once: true,
    amount: 0.15,
    margin: '0px 0px 20% 0px',
  });
  const width = viewBoxWidth(spec.viewBox);
  const compiled = useMemo(() => compileCrestPath(spec.full, width), [spec.full, width]);
  const flatPath = useMemo(
    () => buildCrestPath(compiled, spec.horizon, 0),
    [compiled, spec.horizon],
  );

  useEffect(() => {
    if (reduceMotion || !inView) {
      return;
    }

    const pathEl = pathRef.current;
    if (!pathEl) {
      return;
    }

    let lastPaint = 0;
    const controls = animate(0, 1, {
      duration: 4,
      ease: [0.22, 1, 0.36, 1],
      onUpdate: (progress) => {
        const now = performance.now();
        if (progress < 1 && now - lastPaint < MIN_FRAME_MS) {
          return;
        }
        lastPaint = now;
        pathEl.setAttribute('d', buildCrestPath(compiled, spec.horizon, clamp01(progress)));
      },
      onComplete: () => {
        pathEl.setAttribute('d', spec.full);
      },
    });

    return () => {
      controls.stop();
    };
  }, [compiled, inView, reduceMotion, spec.full, spec.horizon]);

  return (
    <div ref={rootRef} className={`size-full ${className}`}>
      <svg
        aria-hidden="true"
        className="block size-full max-w-none overflow-visible"
        viewBox={spec.viewBox}
        fill="none"
        preserveAspectRatio={preserveAspectRatio}
      >
        <path ref={pathRef} d={reduceMotion ? spec.full : flatPath} fill={spec.fill} />
      </svg>
    </div>
  );
}
