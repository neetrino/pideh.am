'use client';

import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { PidehPillButton } from '@/components/brand/PidehPillButton';
import { PAGE_CONTAINER, pageColumnRow } from '@/components/layout/page-container';
import { RevealOnView } from '@/components/motion/RevealOnView';
import { pillPop, titleSweep } from '@/components/motion/presets';
import { PIDEH_ASSETS } from '@/features/home/ui/brand-assets';
import { HomeCategoriesOrbit, ORBIT_MOVE_MS } from '@/features/home/ui/HomeCategoriesOrbit';
import { HomeYellowWave } from '@/features/home/ui/HomeYellowWave';
import { OrbitNavButton } from '@/features/home/ui/OrbitNavButton';
import { CATEGORY_FRAME, categoryFigmaBox } from '@/features/home/ui/category-orbit-slots';
import { featuredOrbitPoolIndex } from '@/features/home/ui/orbit-conveyor';
import { ORBIT_MOVE_EASE } from '@/features/home/ui/orbit-motion';
import { uniqueOrbitItems, type OrbitPhotoItem } from '@/features/home/ui/unique-orbit-photos';

type HomeCategoriesProps = {
  title: string;
  viewAllLabel: string;
  viewAllHref: string;
  demoProductTitle: string;
  /** Distinct pide cutouts for the ring, with catalog names. */
  orbitPhotos?: readonly OrbitPhotoItem[];
};

export function HomeCategories({
  title,
  viewAllLabel,
  viewAllHref,
  demoProductTitle,
  orbitPhotos = [],
}: HomeCategoriesProps) {
  const [spin, setSpin] = useState(0);
  const [orbitBusy, setOrbitBusy] = useState(false);
  const orbitUnlockTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const orbitBusyRef = useRef(false);
  const reduceMotion = useReducedMotion();
  orbitBusyRef.current = orbitBusy;

  const orbitItems = useMemo(() => {
    const photos = uniqueOrbitItems(orbitPhotos);
    if (photos.length > 0) {
      return photos.map((photo, index) => ({
        id: `orbit-photo-${index}`,
        imageUrl: photo.imageUrl,
        title: photo.title,
      }));
    }

    return [
      {
        id: 'demo-orbit-1',
        imageUrl: PIDEH_ASSETS.foodPide,
        title: demoProductTitle,
      },
    ];
  }, [demoProductTitle, orbitPhotos]);

  const activeIndex = featuredOrbitPoolIndex(spin, orbitItems.length);
  const active = orbitItems[activeIndex] ?? orbitItems[0] ?? null;

  useEffect(() => {
    return () => {
      if (orbitUnlockTimerRef.current) {
        clearTimeout(orbitUnlockTimerRef.current);
      }
    };
  }, []);

  const go = useCallback(
    (delta: number) => {
      if (orbitBusyRef.current) {
        return;
      }
      orbitBusyRef.current = true;
      setOrbitBusy(true);
      setSpin((current) => current + delta);
      if (orbitUnlockTimerRef.current) {
        clearTimeout(orbitUnlockTimerRef.current);
      }
      orbitUnlockTimerRef.current = setTimeout(
        () => {
          orbitBusyRef.current = false;
          setOrbitBusy(false);
          orbitUnlockTimerRef.current = null;
        },
        reduceMotion ? 0 : ORBIT_MOVE_MS,
      );
    },
    [reduceMotion],
  );

  return (
    <section
      data-home-categories
      className="relative z-[5] overflow-x-clip overflow-y-hidden bg-transparent pb-8 lg:pb-16"
    >
      {/* Wave sits over the hero video; drip valleys show the video underneath. */}
      <div className="absolute inset-x-0 top-0 z-[1] w-full">
        <HomeYellowWave />
      </div>
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-[18%] bottom-0 z-0 bg-[#ffcf48]"
      />

      <div
        className="relative z-10 mx-auto w-full max-w-[1448px]"
        style={{ aspectRatio: '1448 / 850' }}
      >
        <div className="absolute inset-x-0 z-10" style={pageColumnRow(92, 218, CATEGORY_FRAME.h)}>
          <div className={PAGE_CONTAINER}>
            <RevealOnView
              className="font-display max-w-[708px] text-[#ff6b00]"
              style={{
                fontSize: 'clamp(2.75rem, 9.67vw, 8.75rem)',
                lineHeight: 0.78,
                letterSpacing: 0,
              }}
              variants={titleSweep}
            >
              <h2>{title}</h2>
            </RevealOnView>
          </div>
        </div>

        <div
          className="absolute inset-x-0 z-20"
          style={{ top: `${(452 / CATEGORY_FRAME.h) * 100}%` }}
        >
          <div className={PAGE_CONTAINER}>
            <div className="flex items-start gap-[clamp(1rem,2.2vw,2rem)]">
              <RevealOnView className="h-14 w-full max-w-[213px] min-w-0 shrink" variants={pillPop} delay={0.12}>
                <PidehPillButton
                  href={viewAllHref}
                  label={viewAllLabel}
                  tone="orange"
                  className="h-full w-full px-6 py-4"
                />
              </RevealOnView>
              {active ? (
                <div className="relative min-h-14 min-w-0 max-w-[26rem] flex-1">
                  <AnimatePresence mode="wait" initial={false}>
                    <motion.p
                      key={active.id}
                      className="font-display flex min-h-14 items-center text-balance break-words text-[#1e1e1e]"
                      style={{
                        fontSize: 'clamp(1.75rem, 3.73vw, 3.375rem)',
                        lineHeight: 1,
                      }}
                      initial={reduceMotion ? false : { opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={reduceMotion ? undefined : { opacity: 0 }}
                      transition={{
                        duration: reduceMotion ? 0.15 : 0.4,
                        ease: ORBIT_MOVE_EASE,
                      }}
                    >
                      {active.title}
                    </motion.p>
                  </AnimatePresence>
                </div>
              ) : null}
            </div>
          </div>
        </div>

        <HomeCategoriesOrbit
          items={orbitItems}
          spin={spin}
          arcStyle={categoryFigmaBox(978.27, 108.24, 691.104, 691.104)}
        />

        {/* Figma Arrows (1:383 / 1:385) — always visible inside the ring. */}
        <div
          className="absolute z-40 flex items-center gap-[6px]"
          style={categoryFigmaBox(1296.57, 440, 108, 51)}
        >
          <OrbitNavButton
            disabled={orbitBusy}
            reduceMotion={reduceMotion}
            src={PIDEH_ASSETS.arrowLeft}
            label="Previous product"
            onClick={() => go(1)}
          />
          <OrbitNavButton
            disabled={orbitBusy}
            reduceMotion={reduceMotion}
            src={PIDEH_ASSETS.arrowRight}
            label="Next product"
            onClick={() => go(-1)}
          />
        </div>
      </div>
    </section>
  );
}
