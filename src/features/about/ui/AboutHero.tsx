'use client';

import Image from 'next/image';
import { useRef } from 'react';

import { PAGE_CONTAINER } from '@/components/layout/page-container';
import { titleSweep } from '@/components/motion/presets';
import { RevealOnView } from '@/components/motion/RevealOnView';
import { ABOUT_HERO_IMAGE } from '@/features/about/content/team-members';
import { AboutMarquee } from '@/features/about/ui/AboutMarquee';
import { useAboutHeroScroll } from '@/features/about/ui/useAboutHeroScroll';
import type { Dictionary } from '@/lib/i18n/get-dictionary';

type AboutHeroProps = {
  copy: Dictionary['about'];
};

export function AboutHero({ copy }: AboutHeroProps) {
  const sectionRef = useRef<HTMLElement>(null);
  useAboutHeroScroll(sectionRef);
  const titleWords = copy.title.split(' ');

  return (
    <section
      ref={sectionRef}
      className="relative min-h-[100svh] overflow-hidden pt-8 lg:min-h-[863px] lg:pt-[100px]"
    >
      <div data-about-hero-media className="absolute inset-0 origin-center will-change-transform">
        <Image
          src={ABOUT_HERO_IMAGE}
          alt={copy.heroImageAlt}
          fill
          priority
          sizes="100vw"
          className="object-cover object-top lg:object-center"
        />
      </div>
      <div className={`relative z-[1] ${PAGE_CONTAINER}`}>
        <div
          data-about-hero-copy
          className="flex min-h-[calc(100svh-5rem)] max-w-[52rem] flex-col justify-center py-12 pb-24 will-change-transform sm:-translate-y-8 lg:min-h-[763px] lg:-translate-y-40 lg:py-16"
        >
          <RevealOnView className="w-fit">
            <p className="rounded-full bg-pideh-orange px-4 py-2 text-sm font-bold tracking-[0.22em] text-white uppercase">
              {copy.eyebrow}
            </p>
          </RevealOnView>
          <RevealOnView variants={titleSweep} delay={0.06}>
            <h1 className="font-display mt-5 max-w-4xl text-[clamp(2.25rem,8vw,6rem)] leading-[0.92] font-black tracking-tight text-pideh-cream">
              {titleWords.map((word, index) => (
                <span
                  key={`${word}-${index}`}
                  data-about-hero-word
                  className="mr-[0.22em] inline-block will-change-transform"
                >
                  {word}
                </span>
              ))}
            </h1>
          </RevealOnView>
        </div>
      </div>
      <div className="absolute inset-x-0 bottom-0 z-20">
        <AboutMarquee items={copy.marquee} />
      </div>
    </section>
  );
}
