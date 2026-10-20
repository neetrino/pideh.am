import { PIDEH_ASSETS } from '@/features/home/ui/brand-assets';
import { HERO_DESKTOP_MEDIA } from '@/features/home/ui/hero-video';

/**
 * Preloads only the desktop hero still. The mp4 starts after the poster
 * paints so it does not compete with the first screen.
 */
export function HeroVideoPreload() {
  return (
    <link
      rel="preload"
      as="image"
      href={PIDEH_ASSETS.heroVideoPoster}
      type="image/jpeg"
      media={HERO_DESKTOP_MEDIA}
      fetchPriority="high"
    />
  );
}
