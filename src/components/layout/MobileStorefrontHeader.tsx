import { MobileBrandBar } from '@/components/layout/MobileBrandBar';
import { MobileHeaderScrollShell } from '@/components/layout/MobileHeaderScrollShell';
import { MobileHeaderSearch } from '@/components/layout/MobileHeaderSearch';
import {
  MOBILE_STOREFRONT_COLUMN,
  MOBILE_STOREFRONT_SHELL,
} from '@/components/layout/page-container';
import { getCurrentUser } from '@/lib/auth/session';
import { toTelHref } from '@/lib/contact/tel-href';
import type { Locale } from '@/lib/i18n/config';
import type { Dictionary } from '@/lib/i18n/get-dictionary';
import type { Currency } from '@/lib/money/currency';

type MobileStorefrontHeaderProps = {
  locale: Locale;
  currency: Currency;
  dictionary: Dictionary;
};

/**
 * Shared mobile chrome for every storefront page (Figma 366:464 header band):
 * brand row plus search. Hidden on landscape tablets and
 * desktop, where {@link import("./SiteHeader").SiteHeader} takes over.
 */
export async function MobileStorefrontHeader({
  locale,
  currency,
  dictionary,
}: MobileStorefrontHeaderProps) {
  const contact = dictionary.contact;
  const user = await getCurrentUser();

  return (
    <>
      <MobileHeaderScrollShell>
        <div className={`${MOBILE_STOREFRONT_COLUMN} px-6 pt-6 pb-2`}>
          <MobileBrandBar
            locale={locale}
            dictionary={dictionary}
            currency={currency}
            isSignedIn={Boolean(user)}
            phoneHref={toTelHref(contact.storePhone)}
            phoneLabel={contact.callTitle}
            className="flex items-center justify-between gap-4"
          />
        </div>
      </MobileHeaderScrollShell>
      <div className={`${MOBILE_STOREFRONT_SHELL} storefront-mobile-tree mobile-header-search px-6 pt-4 pb-2`}>
        <MobileHeaderSearch
          locale={locale}
          backLabel={dictionary.catalog.back}
          searchLabel={dictionary.catalog.searchLabel}
          searchPlaceholder={dictionary.home.searchPlaceholder}
        />
      </div>
    </>
  );
}
