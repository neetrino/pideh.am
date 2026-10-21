'use client';

import Image from 'next/image';
import { motion, useReducedMotion } from 'motion/react';

import { PidehPillButton } from '@/components/brand/PidehPillButton';
import { VIEWPORT_ONCE, specklePop } from '@/components/motion/presets';
import { PIDEH_ASSETS } from '@/features/home/ui/brand-assets';

type HomeCtaCardProps = {
  titleLine1: string;
  titleLine2: string;
  description: string;
  ctaLabel: string;
  ctaHref: string;
};

/** Figma CTA card (1:186) — 1240 × 453. Independent of the orange page band. */
const FRAME = { w: 1240, h: 453 } as const;

const PIDE_CROP = {
  height: '116.23%',
  width: '196.94%',
  left: '-46.39%',
  top: '-5.81%',
} as const;

function figmaBox(x: number, y: number, width: number, height: number) {
  return {
    left: `${(x / FRAME.w) * 100}%`,
    top: `${(y / FRAME.h) * 100}%`,
    width: `${(width / FRAME.w) * 100}%`,
    height: `${(height / FRAME.h) * 100}%`,
  };
}

type CtaDot = {
  src: string;
  left: number;
  top: number;
  width: number;
  height: number;
  rotate?: string;
};

const CTA_DOTS: readonly CtaDot[] = [
  { src: PIDEH_ASSETS.ctaDotA, left: 60, top: 45, width: 14, height: 10 },
  { src: PIDEH_ASSETS.ctaDotB, left: 199, top: 128, width: 22, height: 18 },
  { src: PIDEH_ASSETS.ctaDotC, left: 338, top: 211, width: 30, height: 10 },
  { src: PIDEH_ASSETS.ctaDotD, left: 477, top: 294, width: 14, height: 18 },
  {
    src: PIDEH_ASSETS.ctaDotE,
    left: 701,
    top: 373,
    width: 24.114,
    height: 19.212,
    rotate: '-28.21deg',
  },
  { src: PIDEH_ASSETS.ctaDotF, left: 755, top: 70, width: 30, height: 18 },
  { src: PIDEH_ASSETS.ctaDotA, left: 894, top: 153, width: 14, height: 10 },
  { src: PIDEH_ASSETS.ctaDotB, left: 1033, top: 236, width: 22, height: 18 },
  { src: PIDEH_ASSETS.ctaDotC, left: 1172, top: 319, width: 30, height: 10 },
];

function CtaPide({
  left,
  top,
  width,
  height,
  innerWidthPct,
  innerHeightPct,
  rotate,
  delay,
}: {
  left: number;
  top: number;
  width: number;
  height: number;
  innerWidthPct: string;
  innerHeightPct: string;
  rotate: string;
  delay: number;
}) {
  const reduceMotion = useReducedMotion();

  return (
    <motion.div
      aria-hidden="true"
      className="pointer-events-none absolute flex items-center justify-center"
      style={figmaBox(left, top, width, height)}
      initial={reduceMotion ? false : { opacity: 0, scale: 0.86, rotate: -8 }}
      whileInView={reduceMotion ? undefined : { opacity: 1, scale: 1, rotate: 0 }}
      viewport={VIEWPORT_ONCE}
      transition={{ duration: 1.1, delay, ease: [0.16, 1, 0.3, 1] }}
    >
      <div
        className="-scale-y-100 relative flex-none overflow-hidden"
        style={{ rotate, width: innerWidthPct, height: innerHeightPct }}
      >
        <Image
          src={PIDEH_ASSETS.ctaPide}
          alt=""
          width={800}
          height={800}
          className="absolute max-w-none"
          style={PIDE_CROP}
        />
      </div>
    </motion.div>
  );
}

/**
 * Rounded CTA box only — Figma node 1:186. Does not paint the page orange band.
 */
export function HomeCtaCard({
  titleLine1,
  titleLine2,
  description,
  ctaLabel,
  ctaHref,
}: HomeCtaCardProps) {
  return (
    <>
      <div
        className="relative mx-auto w-full max-w-[1240px] overflow-hidden rounded-[32px] bg-gradient-to-b from-[#ff6b00] to-[#ffd54a]"
        style={{
          aspectRatio: `${FRAME.w} / ${FRAME.h}`,
          containerType: 'inline-size',
        }}
      >
        <CtaPide
          left={-351}
          top={146}
          width={758.084}
          height={591.776}
          innerWidthPct="42.59%"
          innerHeightPct="115.92%"
          rotate="63.89deg"
          delay={0.08}
        />
        <CtaPide
          left={915}
          top={-201}
          width={514.71}
          height={751.437}
          innerWidthPct="62.72%"
          innerHeightPct="91.29%"
          rotate="162.45deg"
          delay={0.2}
        />

        <div
          className="absolute flex flex-col items-center gap-5 overflow-hidden"
          style={figmaBox(230, 95, 780, 330)}
        >
          <h2
            className="font-display shrink-0 text-center text-white"
            style={{
              fontSize: 'clamp(2.25rem, 6.45cqw, 80px)',
              lineHeight: 0.85,
            }}
          >
            <span className="block">{titleLine1}</span>
            <span className="block">{titleLine2}</span>
          </h2>
          <p className="w-[83.33%] shrink-0 text-center text-[clamp(0.95rem,1.45cqw,18px)] leading-[1.25] text-white">
            {description}
          </p>
          <PidehPillButton
            href={ctaHref}
            label={ctaLabel}
            tone="orange"
            className="w-[38.46%] max-w-[300px] shrink-0"
          />
        </div>

        {CTA_DOTS.map((dot, index) => (
          <motion.div
            key={`${dot.src}-${index}`}
            aria-hidden="true"
            className="pointer-events-none absolute"
            style={{
              ...figmaBox(dot.left, dot.top, dot.width, dot.height),
              rotate: dot.rotate,
            }}
            initial="hidden"
            whileInView="show"
            viewport={VIEWPORT_ONCE}
            variants={specklePop}
            transition={{ delay: 0.18 + index * 0.05 }}
          >
            {/* Decorative SVG — next/image not used for this asset */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={dot.src}
              alt=""
              loading="lazy"
              decoding="async"
              className="block size-full max-w-none"
            />
          </motion.div>
        ))}
      </div>
    </>
  );
}
