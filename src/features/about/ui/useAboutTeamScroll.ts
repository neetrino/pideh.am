'use client';

import { useGSAP } from '@gsap/react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useReducedMotion } from 'motion/react';
import type { RefObject } from 'react';

gsap.registerPlugin(useGSAP, ScrollTrigger);

/** Vertical scroll, in viewports, needed to move one gallery frame. */
const GALLERY_SCROLL_VIEWPORTS = 2.4;
const GALLERY_SCROLL_SCRUB = 1.8;

function animateGalleryTrack(section: HTMLElement, track: HTMLElement, count: number): void {
  if (count < 2) {
    return;
  }

  gsap.to(track, {
    xPercent: -((count - 1) / count) * 100,
    ease: 'none',
    scrollTrigger: {
      trigger: section,
      start: 'top top',
      end: () => `+=${(count - 1) * window.innerHeight * GALLERY_SCROLL_VIEWPORTS}`,
      pin: true,
      scrub: GALLERY_SCROLL_SCRUB,
      invalidateOnRefresh: true,
    },
  });
}

export function useAboutTeamScroll(sectionRef: RefObject<HTMLElement | null>): void {
  const reduceMotion = useReducedMotion();

  useGSAP(
    () => {
      const section = sectionRef.current;
      const desktop = window.matchMedia('(min-width: 768px)').matches;
      if (reduceMotion || !section || !desktop) {
        return;
      }
      const track = section.querySelector<HTMLElement>('[data-gallery-track]');
      const count = track?.querySelectorAll('[data-team-card]').length ?? 0;
      if (!track || count === 0) {
        return;
      }
      animateGalleryTrack(section, track, count);
    },
    { scope: sectionRef, dependencies: [reduceMotion] },
  );
}
