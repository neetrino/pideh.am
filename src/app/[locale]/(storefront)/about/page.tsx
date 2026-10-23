import Image from 'next/image';
import { notFound } from 'next/navigation';

import { ABOUT_GALLERY } from '@/features/about/content/team-members';
import { AboutHero } from '@/features/about/ui/AboutHero';
import { AboutStory } from '@/features/about/ui/AboutStory';
import { AboutGallery } from '@/features/about/ui/AboutGallery';
import { isLocale } from '@/lib/i18n/config';
import { getDictionary } from '@/lib/i18n/get-dictionary';

type AboutPageProps = {
  params: Promise<{ locale: string }>;
};

export default async function AboutPage({ params }: AboutPageProps) {
  const { locale: rawLocale } = await params;

  if (!isLocale(rawLocale)) {
    notFound();
  }

  const dictionary = getDictionary(rawLocale);

  return (
    <div className="pideh-about">
      <AboutHero copy={dictionary.about} />
      <div className="px-3 pt-6 md:hidden">
        <div
          className="relative overflow-hidden rounded-[28px]"
          style={{ aspectRatio: `${ABOUT_GALLERY[0].width} / ${ABOUT_GALLERY[0].height}` }}
        >
          <Image
            src={ABOUT_GALLERY[0].src}
            alt={dictionary.about.gallery[0]?.alt ?? dictionary.about.title}
            fill
            priority
            sizes="100vw"
            className="object-cover object-center"
          />
        </div>
      </div>
      <AboutStory copy={dictionary.about} />
      <AboutGallery copy={dictionary.about} />
    </div>
  );
}
