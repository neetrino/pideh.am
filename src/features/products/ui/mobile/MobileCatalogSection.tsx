import {
  MobileProductGrid,
  type MobileGridProduct,
} from '@/features/home/ui/mobile/MobileProductGrid';
import type { Locale } from '@/lib/i18n/config';

type MobileCatalogSectionProps = {
  locale: Locale;
  products: readonly MobileGridProduct[];
  isSignedIn: boolean;
  wishlistLabel: string;
  addLabel: string;
  priorityCount?: number;
};

/** Category product grid on the mobile menu. Category titles stay off this screen. */
export function MobileCatalogSection({
  locale,
  products,
  isSignedIn,
  wishlistLabel,
  addLabel,
  priorityCount = 0,
}: MobileCatalogSectionProps) {
  return (
    <section className="pt-6">
      <div>
        <MobileProductGrid
          locale={locale}
          products={products}
          isSignedIn={isSignedIn}
          wishlistLabel={wishlistLabel}
          addLabel={addLabel}
          priorityCount={priorityCount}
        />
      </div>
    </section>
  );
}
