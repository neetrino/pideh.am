import { MOBILE_COPYRIGHT_NAV_CLEARANCE_PX } from '@/components/layout/NavEllipse3469';
import { MobileCopyright } from '@/features/home/ui/mobile/MobileCopyright';
import type { Dictionary } from '@/lib/i18n/get-dictionary';

type MobileStorefrontCopyrightProps = {
  dictionary: Dictionary;
};

/**
 * Mobile copyright above the dock for pages that do not paint their own
 * (home, shop, and product already include the line on the orange canvas).
 */
export function MobileStorefrontCopyright({ dictionary }: MobileStorefrontCopyrightProps) {
  const text = dictionary.footer.copyrightMobile.replace('{year}', String(new Date().getFullYear()));

  return (
    <div
      className="mobile-page-copyright md:hidden"
      style={{ paddingBottom: MOBILE_COPYRIGHT_NAV_CLEARANCE_PX }}
    >
      <MobileCopyright text={text} tone="onCream" className="mt-8" />
    </div>
  );
}
