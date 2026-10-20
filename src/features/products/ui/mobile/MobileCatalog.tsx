import { NAV_DOCK_HEIGHT_PX } from '@/components/layout/NavEllipse3469';
import {
  MOBILE_STOREFRONT_COLUMN,
  MOBILE_STOREFRONT_SHELL,
} from '@/components/layout/page-container';
import { MobileCopyright } from '@/features/home/ui/mobile/MobileCopyright';
import type { MobileGridProduct } from '@/features/home/ui/mobile/MobileProductGrid';
import type { CatalogFilters } from '@/features/products/schemas/catalog-list';
import { ShopCategoryChips } from '@/features/products/ui/ShopCategoryChips';
import { MobileCatalogSection } from '@/features/products/ui/mobile/MobileCatalogSection';
import type { Locale } from '@/lib/i18n/config';
import type { Dictionary } from '@/lib/i18n/get-dictionary';

/** Gap under the copyright so the raised home button and dock stay fully visible. */
const COPYRIGHT_NAV_CLEARANCE_PX = NAV_DOCK_HEIGHT_PX - 24;

export type MobileCatalogSectionData = {
  key: string;
  title: string;
  seeAllHref: string | null;
  seeAllLabel: string;
  products: MobileGridProduct[];
};

type MobileCatalogCategory = {
  slug: string;
  title: string;
};

type MobileCatalogProps = {
  locale: Locale;
  dictionary: Dictionary;
  filters: CatalogFilters;
  categories: readonly MobileCatalogCategory[];
  sections: readonly MobileCatalogSectionData[];
  isSignedIn: boolean;
};

/**
 * Mobile menu screen from Figma node 366:464 (440-wide design space).
 *
 * @see https://www.figma.com/design/zyLVZFDhohLYxwuohIrPDN/Pideh-Dev?node-id=366-464
 */
export function MobileCatalog({
  locale,
  dictionary,
  filters,
  categories,
  sections,
  isSignedIn,
}: MobileCatalogProps) {
  const catalog = dictionary.catalog;
  const year = new Date().getFullYear();

  return (
    <div
      className={`${MOBILE_STOREFRONT_SHELL} pideh-shop-mobile overflow-x-clip bg-[#ff6b00]`}
      style={{ paddingBottom: COPYRIGHT_NAV_CLEARANCE_PX }}
    >
      <div className={MOBILE_STOREFRONT_COLUMN}>
      <ShopCategoryChips
        locale={locale}
        filters={filters}
        categories={categories}
        allLabel={catalog.allChip}
        tone="onOrange"
        className="shop-chips-scroll px-6 pt-6 pb-1"
      />

      {sections.length === 0 ? (
        <div className="mx-6 mt-10 rounded-[26px] bg-white px-6 py-16 text-center shadow-[0px_12px_14px_rgba(31,20,8,0.11)]">
          <h2 className="text-lg font-semibold text-[#1e1e1e]">{catalog.emptyTitle}</h2>
          <p className="font-noto-armenian mt-2 text-sm text-[#6b6b6b]">
            {catalog.emptyDescription}
          </p>
        </div>
      ) : (
        sections.map((section, index) => (
          <MobileCatalogSection
            key={section.key}
            locale={locale}
            products={section.products}
            isSignedIn={isSignedIn}
            wishlistLabel={dictionary.nav.wishlist}
            addLabel={dictionary.home.orderCta}
            priorityCount={index === 0 ? 2 : 0}
          />
        ))
      )}

      <div className="pt-12">
        <MobileCopyright text={dictionary.footer.copyrightMobile.replace('{year}', String(year))} />
      </div>
      </div>
    </div>
  );
}
