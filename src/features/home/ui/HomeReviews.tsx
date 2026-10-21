import { PAGE_CONTAINER } from '@/components/layout/page-container';
import { RevealOnView } from '@/components/motion/RevealOnView';
import { titleSweep } from '@/components/motion/presets';
import { HomeReviewsCarousel, type HomeReviewItem } from '@/features/home/ui/HomeReviewsCarousel';
import { HomeYellowWave } from '@/features/home/ui/HomeYellowWave';

type HomeReviewsProps = {
  title: string;
  reviews: readonly HomeReviewItem[];
};

/** How far the yellow drip hangs into the orange section above. */
const WAVE_OVERHANG_PX = 81;
/**
 * Deepest crest in the 1507.5×1225 yellow wave. Safari treats
 * `overflow-x: clip` as clipping the top too, so the title must clear this
 * in normal flow instead of relying on a negative clip-path.
 */
const WAVE_CREST_RATIO = 168.425 / 1507.5;

/**
 * Figma Reviews (1:431) on Rectangle 5 yellow drip. Copy stays i18n.
 */
export function HomeReviews({ title, reviews }: HomeReviewsProps) {
  return (
    <section
      className="relative z-[15] bg-[#ff6b00] pb-32 lg:pb-44"
      style={{ clipPath: `inset(-${WAVE_OVERHANG_PX}px 0 0 0)` }}
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 z-0 w-full"
        style={{ top: -WAVE_OVERHANG_PX }}
      >
        <HomeYellowWave />
      </div>
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-[22%] bottom-0 z-0 bg-[#ffcf48]"
      />

      <div
        className={`relative z-10 ${PAGE_CONTAINER}`}
        style={{
          paddingTop: `calc(100vw * ${WAVE_CREST_RATIO} - ${WAVE_OVERHANG_PX}px + 1.25rem)`,
        }}
      >
        <RevealOnView className="mb-8 lg:mb-10" variants={titleSweep}>
          <h2
            className="font-display text-[#ff6b00]"
            style={{
              fontSize: 'clamp(2.5rem, 9vw, 140px)',
              lineHeight: 0.78,
            }}
          >
            {title}
          </h2>
        </RevealOnView>
      </div>

      <div className="relative z-10 w-full pb-8">
        <HomeReviewsCarousel reviews={reviews} />
      </div>
    </section>
  );
}
