'use client';

import Image from 'next/image';
import { useReducedMotion } from 'motion/react';
import { useRef, type CSSProperties } from 'react';

import {
  ABOUT_GALLERY,
  ABOUT_GALLERY_SLIDES,
  ABOUT_STORY_UNDER_PHOTO,
} from '@/features/about/content/team-members';
import { useAboutTeamScroll } from '@/features/about/ui/useAboutTeamScroll';
import type { Dictionary } from '@/lib/i18n/get-dictionary';

type AboutGalleryProps = {
  copy: Dictionary['about'];
};

type GallerySlide = (typeof ABOUT_GALLERY)[number];

const CARD_SHAPE = 'relative max-h-full max-w-full overflow-hidden rounded-[28px] sm:rounded-[36px]';
const PAIR_GAP = '1.25rem';

/** Largest frame that matches the photo, so the rounded card stays full and uncropped. */
function galleryCardStyle(
  slide: GallerySlide,
  reduceMotion: boolean | null,
  paired: boolean,
  reserveCaption: boolean,
): CSSProperties {
  const aspectRatio = `${slide.width} / ${slide.height}`;
  if (reduceMotion) {
    return { aspectRatio, width: '100%' };
  }

  if (reserveCaption) {
    return { aspectRatio, width: '100%' };
  }

  const fitted = `calc(100cqh * ${slide.width} / ${slide.height})`;
  const width = paired ? `min(calc((100cqw - ${PAIR_GAP}) / 2), ${fitted})` : `min(100cqw, ${fitted})`;

  return { aspectRatio, width };
}

function captionColumnWidth(slide: GallerySlide, paired: boolean): string {
  const fitted = `calc((100cqh - 15rem) * ${slide.width} / ${slide.height})`;
  return paired ? `min(calc((100cqw - ${PAIR_GAP}) / 2), ${fitted})` : `min(100cqw, ${fitted})`;
}

function storyUnderPhoto(copy: Dictionary['about'], photoId: string) {
  if (photoId !== ABOUT_STORY_UNDER_PHOTO.photoId) {
    return null;
  }
  const index = ABOUT_STORY_UNDER_PHOTO.index;
  const paragraph = copy.paragraphs[index];
  if (!paragraph) {
    return null;
  }

  return {
    step: String(index + 1).padStart(2, '0'),
    title: copy.storyTitles[index] ?? copy.eyebrow,
    paragraph,
  };
}

function GalleryPhoto({
  slide,
  alt,
  priority,
  reduceMotion,
  paired,
  reserveCaption = false,
}: {
  slide: GallerySlide;
  alt: string;
  priority: boolean;
  reduceMotion: boolean | null;
  paired: boolean;
  reserveCaption?: boolean;
}) {
  return (
    <div
      className={`${CARD_SHAPE} ${reduceMotion && paired && !reserveCaption ? 'min-w-0 flex-1' : ''}`}
      style={galleryCardStyle(slide, reduceMotion, paired, reserveCaption)}
    >
      <Image
        src={slide.src}
        alt={alt}
        fill
        sizes={paired ? '(min-width: 768px) 45vw, 50vw' : '(min-width: 768px) 80vw, 100vw'}
        priority={priority}
        className="object-cover object-center"
      />
    </div>
  );
}

function galleryAlt(copy: Dictionary['about'], slide: GallerySlide): string {
  const index = ABOUT_GALLERY.findIndex((item) => item.id === slide.id);
  return copy.gallery[index]?.alt ?? copy.title;
}

function GalleryTrack({
  copy,
  reduceMotion,
}: {
  copy: Dictionary['about'];
  reduceMotion: boolean | null;
}) {
  const slideCount = ABOUT_GALLERY_SLIDES.length;

  return (
    <div
      data-gallery-track
      className={reduceMotion ? 'flex flex-col gap-4' : 'flex h-full'}
      style={reduceMotion ? undefined : { width: `${slideCount * 100}%` }}
    >
      {ABOUT_GALLERY_SLIDES.map((slide, index) => (
        <GalleryFrame
          key={slide.map((photo) => photo.id).join('-')}
          slide={slide}
          copy={copy}
          priority={index === 0}
          reduceMotion={reduceMotion}
          width={reduceMotion ? undefined : `${100 / slideCount}%`}
        />
      ))}
    </div>
  );
}

function GalleryCaption({
  note,
}: {
  note: { step: string; title: string; paragraph: string };
}) {
  return (
    <article className="rounded-[2px] bg-white px-5 py-4 shadow-[8px_10px_0_0_var(--pideh-yellow)]">
      <p className="font-display text-3xl leading-none text-pideh-orange">{note.step}</p>
      <h2 className="font-display mt-2 text-[18px] leading-6 text-[#ff6b00] uppercase">{note.title}</h2>
      <p className="font-noto-armenian mt-2 text-sm leading-relaxed text-[#1e1e1e]/80">{note.paragraph}</p>
    </article>
  );
}

function GalleryColumn({
  photo,
  copy,
  priority,
  reduceMotion,
  paired,
}: {
  photo: GallerySlide;
  copy: Dictionary['about'];
  priority: boolean;
  reduceMotion: boolean | null;
  paired: boolean;
}) {
  const note = storyUnderPhoto(copy, photo.id);

  return (
    <div
      className={note ? 'flex max-h-full min-w-0 flex-col justify-center gap-3' : 'contents'}
      style={note && !reduceMotion ? { width: captionColumnWidth(photo, paired) } : undefined}
    >
      <GalleryPhoto
        slide={photo}
        alt={galleryAlt(copy, photo)}
        priority={priority}
        reduceMotion={reduceMotion}
        paired={paired}
        reserveCaption={note !== null}
      />
      {note ? <GalleryCaption note={note} /> : null}
    </div>
  );
}

function GalleryFrame({
  slide,
  copy,
  priority,
  reduceMotion,
  width,
}: {
  slide: (typeof ABOUT_GALLERY_SLIDES)[number];
  copy: Dictionary['about'];
  priority: boolean;
  reduceMotion: boolean | null;
  width: string | undefined;
}) {
  const paired = slide.length > 1;

  return (
    <article
      data-team-card
      className={reduceMotion ? 'relative w-full shrink-0' : 'grid h-full shrink-0 place-items-center'}
      style={width === undefined ? undefined : { width }}
    >
      <div className={`flex w-full items-center justify-center gap-5 ${paired ? '' : 'h-full'}`}>
        {slide.map((photo, photoIndex) => (
          <GalleryColumn
            key={photo.id}
            photo={photo}
            copy={copy}
            priority={priority && photoIndex === 0}
            reduceMotion={reduceMotion}
            paired={paired}
          />
        ))}
      </div>
    </article>
  );
}

export function AboutGallery({ copy }: AboutGalleryProps) {
  const sectionRef = useRef<HTMLElement>(null);
  const reduceMotion = useReducedMotion();
  useAboutTeamScroll(sectionRef);

  return (
    <section
      ref={sectionRef}
      className="relative z-40 w-full bg-pideh-cream p-3 md:h-[100svh] md:overflow-hidden sm:p-5"
    >
      <div className="flex flex-col gap-4 md:hidden">
        {ABOUT_GALLERY.slice(1).map((photo, index) => {
          const note = storyUnderPhoto(copy, photo.id);
          return (
            <div key={photo.id} className="flex flex-col gap-3">
              <GalleryPhoto
                slide={photo}
                alt={galleryAlt(copy, photo)}
                priority={index === 0}
                reduceMotion
                paired={false}
              />
              {note ? <GalleryCaption note={note} /> : null}
            </div>
          );
        })}
      </div>
      <div
        className={
          reduceMotion
            ? 'hidden h-full flex-col gap-4 overflow-y-auto md:flex'
            : 'absolute inset-3 hidden overflow-hidden bg-pideh-cream [container-type:size] sm:inset-5 md:block'
        }
      >
        <GalleryTrack copy={copy} reduceMotion={reduceMotion} />
      </div>
    </section>
  );
}
