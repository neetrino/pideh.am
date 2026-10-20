import {
  MobileProductGrid,
  type MobileGridProduct,
} from '@/features/home/ui/mobile/MobileProductGrid';
import type { Locale } from '@/lib/i18n/config';

type MobileHomeFeaturedProps = {
  locale: Locale;
  emptyLabel: string;
  wishlistLabel: string;
  addLabel: string;
  isSignedIn: boolean;
  products: readonly MobileGridProduct[];
};

/** Figma product grid (260:547 + 260:959) in the mobile 440 design space. */
export function MobileHomeFeatured({
  locale,
  emptyLabel,
  wishlistLabel,
  addLabel,
  isSignedIn,
  products,
}: MobileHomeFeaturedProps) {
  if (products.length === 0) {
    return (
      <section className="relative z-20 px-4 pb-8">
        <p className="text-white/90">{emptyLabel}</p>
      </section>
    );
  }

  return (
    <section className="relative z-20 pb-2">
      <MobileProductGrid
        locale={locale}
        products={products.slice(0, 4)}
        isSignedIn={isSignedIn}
        wishlistLabel={wishlistLabel}
        addLabel={addLabel}
        priorityCount={0}
      />
    </section>
  );
}
