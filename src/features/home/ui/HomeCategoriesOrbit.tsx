'use client';

import type { CSSProperties } from 'react';
import { useMemo } from 'react';
import { useReducedMotion } from 'motion/react';

import { HomeCategoryArc } from '@/features/home/ui/HomeCategoryArc';
import { OrbitPide } from '@/features/home/ui/OrbitPide';
import { ORBIT_SLOT_POSES } from '@/features/home/ui/category-orbit-slots';
import { assignOrbitRiders } from '@/features/home/ui/orbit-conveyor';
import { ORBIT_MOVE_MS } from '@/features/home/ui/orbit-motion';

type OrbitItem = {
  id: string;
  imageUrl: string;
  title: string;
  href?: string;
};

type OrbitRiderView = {
  key: string;
  src: string;
  title: string;
  href?: string;
  pose: (typeof ORBIT_SLOT_POSES)[number];
  poseIndex: number;
};

type HomeCategoriesOrbitProps = {
  items: readonly OrbitItem[];
  /** Discrete orbit steps from arrow clicks (grows forever). */
  spin: number;
  arcStyle: CSSProperties;
};

export { ORBIT_MOVE_MS };

/**
 * Mounted riders ease from slot to slot along the white ring.
 * Crossing the right-side gap keeps the rider moving and morphs its photo.
 */
export function HomeCategoriesOrbit({ items, spin, arcStyle }: HomeCategoriesOrbitProps) {
  const reduceMotion = useReducedMotion();

  const riders = useMemo(() => {
    return assignOrbitRiders(spin, items.length)
      .map((seat) => {
        const item = items[seat.poolIndex];
        const pose = ORBIT_SLOT_POSES[seat.poseIndex];
        if (!item || !pose) {
          return null;
        }

        return {
          key: `orbit-rider-${seat.riderId}`,
          src: item.imageUrl,
          title: item.title,
          href: item.href,
          pose,
          poseIndex: seat.poseIndex,
        };
      })
      .filter((rider): rider is OrbitRiderView => rider != null);
  }, [items, spin]);

  return (
    <div
      className="pideh-categories-orbit pointer-events-none absolute inset-0 z-10 isolate overflow-visible select-none"
      onDragStart={(event) => event.preventDefault()}
      onContextMenu={(event) => event.preventDefault()}
    >
      <div className="absolute z-0" style={arcStyle}>
        <HomeCategoryArc />
      </div>

      {riders.map((rider) => (
        <OrbitPide
          key={rider.key}
          src={rider.src}
          title={rider.title}
          href={rider.href}
          pose={rider.pose}
          poseIndex={rider.poseIndex}
          reduceMotion={reduceMotion}
        />
      ))}
    </div>
  );
}
