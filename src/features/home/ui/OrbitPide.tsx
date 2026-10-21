'use client';

import Image from 'next/image';

import { AppLink } from '@/components/ui/AppLink';
import { motion, useMotionValue, useTransform } from 'motion/react';
import { useEffect, useRef } from 'react';

import {
  CATEGORY_FRAME,
  ORBIT_SLOT_POSES,
  orbitProductVisual,
  orbitSlotSpan,
  type OrbitSlotPose,
} from '@/features/home/ui/category-orbit-slots';
import {
  orbitFrameXPct,
  orbitFrameYPct,
  playOrbitPideTransition,
  snapOrbitPideValues,
} from '@/features/home/ui/orbit-pide-transition';

type OrbitPideProps = {
  src: string;
  title: string;
  href?: string;
  pose: OrbitSlotPose;
  poseIndex: number;
  reduceMotion: boolean | null;
};

function asNumber(value: unknown): number {
  return typeof value === 'number' ? value : Number(value ?? 0);
}

function OrbitPideImage({ src }: { src: string }) {
  return (
    <Image
      src={src}
      alt=""
      width={800}
      height={800}
      sizes="(max-width: 1024px) 70vw, 760px"
      draggable={false}
      onDragStart={(event) => event.preventDefault()}
      onContextMenu={(event) => event.preventDefault()}
      className="pointer-events-none h-auto w-full object-contain select-none"
    />
  );
}

export function OrbitPide({ src, title, href, pose, poseIndex, reduceMotion }: OrbitPideProps) {
  const span = orbitSlotSpan(pose);
  const restVisual = orbitProductVisual(poseIndex);
  const settledPoseIndexRef = useRef(poseIndex);
  const angle = useMotionValue(pose.angleDeg);
  const radius = useMotionValue(pose.radius);
  const boxW = useMotionValue(span);
  const boxH = useMotionValue(span);
  const scale = useMotionValue(1);
  const zIndex = useMotionValue(pose.zIndex);
  const visualRotate = useMotionValue(restVisual.rotateDeg);
  const offsetX = useMotionValue(restVisual.offsetXPct);
  const offsetY = useMotionValue(restVisual.offsetYPct);
  const visualScale = useMotionValue(restVisual.scale);

  useEffect(() => {
    const values = {
      angle,
      radius,
      boxW,
      boxH,
      scale,
      zIndex,
      visualRotate,
      offsetX,
      offsetY,
      visualScale,
    };

    const snap = () => {
      settledPoseIndexRef.current = poseIndex;
      snapOrbitPideValues(values, pose, poseIndex);
    };

    if (reduceMotion || settledPoseIndexRef.current === poseIndex) {
      snap();
      return;
    }

    const fromPoseIndex = settledPoseIndexRef.current;
    const fromPose = ORBIT_SLOT_POSES[fromPoseIndex];
    if (!fromPose) {
      snap();
      return;
    }

    const controls = playOrbitPideTransition(
      values,
      fromPose,
      fromPoseIndex,
      pose,
      poseIndex,
      () => {
        settledPoseIndexRef.current = poseIndex;
      },
    );

    return () => {
      for (const control of controls) {
        control.stop();
      }
      // A new step can start before this one finishes. Land on the target
      // slot so the next tween continues from there instead of restarting.
      snapOrbitPideValues(values, pose, poseIndex);
      settledPoseIndexRef.current = poseIndex;
    };
  }, [
    angle,
    boxH,
    boxW,
    offsetX,
    offsetY,
    pose,
    poseIndex,
    radius,
    reduceMotion,
    scale,
    visualRotate,
    visualScale,
    zIndex,
  ]);

  const x = useTransform([angle, radius, boxW], (input) => {
    return `${orbitFrameXPct(asNumber(input[0]), asNumber(input[1]), asNumber(input[2]))}%`;
  });
  const y = useTransform([angle, radius, boxH], (input) => {
    return `${orbitFrameYPct(asNumber(input[0]), asNumber(input[1]), asNumber(input[2]))}%`;
  });
  const innerX = useTransform(offsetX, (value) => `calc(-50% + ${value}%)`);
  const innerY = useTransform(offsetY, (value) => `calc(-50% + ${value}%)`);

  return (
    <motion.div className="absolute inset-0" style={{ zIndex }}>
      <motion.div className="absolute inset-0" style={{ x, y }}>
        <motion.div
          className="pointer-events-none absolute top-0 left-0 overflow-visible"
          style={{
            width: `${(span / CATEGORY_FRAME.w) * 100}%`,
            height: `${(span / CATEGORY_FRAME.h) * 100}%`,
            scale,
            transformOrigin: 'center center',
          }}
        >
          <motion.div
            className="absolute top-1/2 left-1/2 overflow-visible"
            style={{
              width: '100%',
              x: innerX,
              y: innerY,
              scale: visualScale,
              rotate: visualRotate,
            }}
          >
            {href ? (
              <AppLink
                href={href}
                prefetchPolicy="intent"
                aria-label={title}
                className="pointer-events-auto relative block"
              >
                <OrbitPideImage key={src} src={src} />
              </AppLink>
            ) : (
              <OrbitPideImage key={src} src={src} />
            )}
          </motion.div>
        </motion.div>
      </motion.div>
    </motion.div>
  );
}
