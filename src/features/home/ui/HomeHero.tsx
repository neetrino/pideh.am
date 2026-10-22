'use client';

import { motion, useReducedMotion } from 'motion/react';
import { useEffect, useState } from 'react';

import { PidehPillButton } from '@/components/brand/PidehPillButton';
import { PAGE_CONTAINER } from '@/components/layout/page-container';
import { springSoft } from '@/components/motion/presets';
import { PIDEH_ASSETS } from '@/features/home/ui/brand-assets';
import {
  HERO_VIDEO_BG,
  HERO_VIDEO_BG_VAR,
} from '@/features/home/ui/hero-video-backdrop';
import { HomeHeroMedia } from '@/features/home/ui/HomeHeroMedia';
import { HomeHeroTitle } from '@/features/home/ui/HomeHeroTitle';
import type { StorefrontHeroSlide } from '@/features/hero/application/queries';

type HomeHeroProps = {
  slides: StorefrontHeroSlide[];
  fallbackTitleAccent: string;
  fallbackCtaLabel: string;
  fallbackCtaHref: string;
};

const HERO_ROTATE_MS = 5000;

/**
 * Figma hero (Pideh desktop 436:583): full-bleed pide video (436:582),
 * title and CTA Button 7 overlaid.
 */
export function HomeHero({
  slides,
  fallbackTitleAccent,
  fallbackCtaLabel,
  fallbackCtaHref,
}: HomeHeroProps) {
  const [index, setIndex] = useState(0);
  const [backdrop, setBackdrop] = useState(HERO_VIDEO_BG);
  const reduceMotion = useReducedMotion();
  const hasSlides = slides.length > 0;
  const active = hasSlides ? slides[index] : null;

  useEffect(() => {
    document.documentElement.style.setProperty(HERO_VIDEO_BG_VAR, backdrop);
    return () => {
      document.documentElement.style.removeProperty(HERO_VIDEO_BG_VAR);
    };
  }, [backdrop]);

  useEffect(() => {
    if (slides.length <= 1 || reduceMotion) {
      return;
    }

    const timer = window.setInterval(() => {
      setIndex((current) => (current + 1) % slides.length);
    }, HERO_ROTATE_MS);

    return () => window.clearInterval(timer);
  }, [slides.length, reduceMotion]);

  const ctaLabel = fallbackCtaLabel;
  const ctaHref = active?.copy.buttonUrl ?? fallbackCtaHref;

  return (
    <section
      data-home-hero
      className="relative z-0 overflow-x-clip overflow-y-visible"
      style={{ backgroundColor: backdrop }}
    >
      <HomeHeroMedia
        imageSrc={PIDEH_ASSETS.heroPide}
        posterSrc={PIDEH_ASSETS.heroVideoPoster}
        videoSrc={reduceMotion ? null : PIDEH_ASSETS.heroVideoMp4}
        onBackdropColor={setBackdrop}
      />

      <div
        data-home-hero-copy
        className={`absolute inset-0 z-10 flex flex-col items-center text-center ${PAGE_CONTAINER} pt-[100px] pb-36 md:pb-44`}
      >
        <HomeHeroTitle line2={fallbackTitleAccent} />

        <motion.div
          className="pideh-hero-cta relative z-30 mt-auto"
          initial={reduceMotion ? false : { opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...springSoft, delay: 0.45 }}
        >
          <PidehPillButton href={ctaHref} label={ctaLabel} tone="dark" />
        </motion.div>

        {slides.length > 1 ? (
          <div className="relative z-30 mt-6 flex gap-2">
            {slides.map((slide, slideIndex) => (
              <button
                key={slide.id}
                type="button"
                aria-label={`Go to slide ${slideIndex + 1}`}
                aria-current={slideIndex === index}
                className={
                  slideIndex === index
                    ? 'h-2.5 w-8 rounded-full bg-white'
                    : 'h-2.5 w-2.5 rounded-full bg-white/50'
                }
                onClick={() => setIndex(slideIndex)}
              />
            ))}
          </div>
        ) : null}
      </div>
    </section>
  );
}
