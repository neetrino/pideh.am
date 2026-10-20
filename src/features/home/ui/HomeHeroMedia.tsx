'use client';

import Image from 'next/image';
import { useEffect, useRef, useState } from 'react';

import { sampleVideoTopBackdrop } from '@/features/home/ui/hero-video-backdrop';
import {
  HERO_DESKTOP_MEDIA,
  HERO_VIDEO_HEIGHT,
  HERO_VIDEO_WIDTH,
} from '@/features/home/ui/hero-video';

type HomeHeroMediaProps = {
  imageSrc: string;
  /** Desktop hero loop at public/brand/pideh/hero-food.mp4 */
  videoSrc?: string | null;
  posterSrc?: string | null;
  onBackdropColor?: (color: string) => void;
};

function useIsDesktopMd(): boolean {
  const [isDesktop, setIsDesktop] = useState(false);

  useEffect(() => {
    const media = window.matchMedia(HERO_DESKTOP_MEDIA);
    const sync = () => setIsDesktop(media.matches);
    sync();
    media.addEventListener('change', sync);
    return () => media.removeEventListener('change', sync);
  }, []);

  return isDesktop;
}

/**
 * Full-bleed hero video (Figma 436:582). Width-driven `h-auto` is in-flow so
 * the section height follows the frame — no contain letterbox, no cover crop.
 */
export function HomeHeroMedia({
  imageSrc,
  videoSrc = null,
  posterSrc = null,
  onBackdropColor,
}: HomeHeroMediaProps) {
  const [videoFailed, setVideoFailed] = useState(false);
  const isDesktop = useIsDesktopMd();
  const didSampleRef = useRef(false);
  const stillSrc = posterSrc ?? imageSrc;
  const showVideo = Boolean(videoSrc) && !videoFailed && isDesktop;

  const reportBackdrop = (video: HTMLVideoElement) => {
    if (didSampleRef.current || !onBackdropColor) {
      return;
    }
    const color = sampleVideoTopBackdrop(video);
    if (!color) {
      return;
    }
    didSampleRef.current = true;
    onBackdropColor(color);
  };

  return (
    <div className="pointer-events-none relative z-0" data-home-hero-media-root>
      <div className="relative w-full" data-home-hero-media>
        {isDesktop ? (
          showVideo ? (
            <video
              className="pideh-hero-video-fade pideh-hero-video-frame block h-auto max-w-none bg-transparent"
              autoPlay
              muted
              loop
              playsInline
              preload="metadata"
              poster={stillSrc}
              src={videoSrc ?? undefined}
              width={HERO_VIDEO_WIDTH}
              height={HERO_VIDEO_HEIGHT}
              aria-hidden="true"
              onLoadedData={(event) => reportBackdrop(event.currentTarget)}
              onPlaying={(event) => reportBackdrop(event.currentTarget)}
              onError={() => setVideoFailed(true)}
            />
          ) : (
            <Image
              src={stillSrc}
              alt=""
              width={HERO_VIDEO_WIDTH}
              height={HERO_VIDEO_HEIGHT}
              priority
              sizes="100vw"
              className="pideh-hero-video-fade pideh-hero-video-frame block h-auto max-w-none"
            />
          )
        ) : (
          <div
            className="pideh-hero-video-frame"
            style={{ aspectRatio: `${HERO_VIDEO_WIDTH} / ${HERO_VIDEO_HEIGHT}` }}
          />
        )}
      </div>
      <div
        className="pideh-hero-video-seam absolute inset-x-0 z-[1] h-12 md:h-14"
        aria-hidden
      />
    </div>
  );
}
