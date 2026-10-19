import Image from 'next/image';
import { Clock3, Mail, MapPin, Phone } from 'lucide-react';

import { PAGE_CONTAINER } from '@/components/layout/page-container';
import { AppLink } from '@/components/ui/AppLink';
import { RevealOnView } from '@/components/motion/RevealOnView';
import { StaggerGroup, StaggerItem } from '@/components/motion/StaggerGroup';
import { footerColumn } from '@/components/motion/presets';
import { PIDEH_ASSETS } from '@/features/home/ui/brand-assets';
import { toMapsHref } from '@/lib/contact/maps-href';
import { toTelHref } from '@/lib/contact/tel-href';
import { SwimDripWave } from '@/features/home/ui/SwimDripWave';
import { FOOTER_DRIP } from '@/features/home/ui/wave-paths';
import type { Dictionary } from '@/lib/i18n/get-dictionary';
import type { Locale } from '@/lib/i18n/config';

type SiteFooterProps = {
  dictionary: Dictionary;
  locale: Locale;
};

/**
 * Card schemes accepted through the ArCa gateway, shown as trust badges.
 * Artwork lives in `public/assets/payments/` — swap the files, not this list.
 */
const PAYMENT_BADGES: readonly { label: string; src: string }[] = [
  { label: 'Mastercard', src: '/assets/payments/mastercard.png' },
  { label: 'ArCa', src: '/assets/payments/arca.png' },
  { label: 'Visa', src: '/assets/payments/visa.png' },
];

export function SiteFooter({ dictionary, locale }: SiteFooterProps) {
  const year = new Date().getFullYear();
  const footer = dictionary.footer;

  return (
    <div className="storefront-desktop-tree mt-auto hidden md:block">
      <footer className="storefront-footer relative z-20 -mt-10 bg-[#ffcf48]">
        <div className="relative w-full">
          <div aria-hidden="true" className="pointer-events-none absolute -top-16 right-0 bottom-0 left-0 overflow-hidden">
            <div className="absolute top-16 right-0 bottom-0 left-1/2 w-[104.72%] max-w-none -translate-x-1/2 [filter:drop-shadow(0_-8px_22px_rgba(199,89,15,0.28))]">
              <SwimDripWave spec={FOOTER_DRIP} preserveAspectRatio="xMidYMin slice" />
            </div>
          </div>

          <div className={`relative z-[2] flex flex-col pb-10 pt-48 ${PAGE_CONTAINER}`}>
            <StaggerGroup
              className="grid min-w-0 grid-cols-1 items-start gap-x-8 gap-y-8 md:grid-cols-2 xl:grid-cols-4"
              stagger={0.12}
            >
              <StaggerItem variants={footerColumn}>
                <Image
                  src="/brand/pideh/footer-wordmark.png"
                  alt={dictionary.brand}
                  width={253}
                  height={215}
                  quality={100}
                  sizes="280px"
                  className="mt-[21px] h-[180px] w-auto max-w-full object-contain"
                />
              </StaggerItem>

              <StaggerItem className="lg:pl-16 xl:pl-28" variants={footerColumn}>
                <h4 className="font-display mb-5 text-[18px] leading-5 text-[#ff6b00] uppercase">
                  {footer.navigation}
                </h4>
                <ul className="space-y-4 text-base leading-[17px] text-[#1e1e1e]">
                  <li>
                    <AppLink
                      href={`/${locale}/products`}
                      prefetchPolicy="intent"
                      className="transition hover:text-[#ff6b00]"
                    >
                      {dictionary.nav.menu}
                    </AppLink>
                  </li>
                  <li>
                    <AppLink
                      href={`/${locale}/about`}
                      prefetchPolicy="intent"
                      className="transition hover:text-[#ff6b00]"
                    >
                      {dictionary.nav.about}
                    </AppLink>
                  </li>
                  <li>
                    <AppLink
                      href={`/${locale}/contact`}
                      prefetchPolicy="intent"
                      className="transition hover:text-[#ff6b00]"
                    >
                      {dictionary.nav.contact}
                    </AppLink>
                  </li>
                </ul>
                <a
                  href={dictionary.contact.social.instagram}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-5 inline-flex size-10 transition hover:brightness-105"
                  aria-label="Instagram"
                >
                  <Image
                    src={PIDEH_ASSETS.socialInstagram}
                    alt=""
                    width={40}
                    height={40}
                    className="size-10"
                  />
                </a>
              </StaggerItem>

              <StaggerItem className="lg:pl-10" variants={footerColumn}>
                <h4 className="font-display mb-5 text-[18px] leading-5 text-[#ff6b00] uppercase">
                  {footer.contactInfo}
                </h4>
                <ul className="space-y-3 text-base leading-[17px] text-[#1e1e1e]">
                  <li className="flex items-center gap-2">
                    <Phone className="h-[21px] w-[21px] shrink-0 text-[#ff6b00]" />
                    <a
                      href={toTelHref(dictionary.contact.storePhone)}
                      className="transition hover:text-[#ff6b00]"
                    >
                      {dictionary.contact.storePhone}
                    </a>
                  </li>
                  <li className="flex items-center gap-2">
                    <Mail className="h-[21px] w-[21px] shrink-0 text-[#ff6b00]" />
                    <a
                      href={`mailto:${dictionary.contact.storeEmail}`}
                      className="transition hover:text-[#ff6b00]"
                    >
                      {dictionary.contact.storeEmail}
                    </a>
                  </li>
                  <li className="flex items-center gap-2">
                    <MapPin className="h-[21px] w-[21px] shrink-0 text-[#ff6b00]" />
                    <a
                      href={toMapsHref(dictionary.contact.storeAddress)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="transition hover:text-[#ff6b00]"
                    >
                      {dictionary.contact.storeAddress}
                    </a>
                  </li>
                  {dictionary.contact.storeAddressSecondary ? (
                    <li className="flex items-center gap-2">
                      <MapPin className="h-[21px] w-[21px] shrink-0 text-[#ff6b00]" />
                      <a
                        href={toMapsHref(dictionary.contact.storeAddressSecondary)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="transition hover:text-[#ff6b00]"
                      >
                        {dictionary.contact.storeAddressSecondary}
                      </a>
                    </li>
                  ) : null}
                  <li className="flex items-start gap-2">
                    <Clock3 className="mt-0.5 h-[21px] w-[21px] shrink-0 text-[#ff6b00]" />
                    <div>
                      <p className="text-base leading-[17px] text-[#1e1e1e]">
                        {dictionary.contact.hoursWeekdays}
                      </p>
                      <p className="mt-0.5 text-[13px] leading-[15px] text-[#1e1e1e]/75">
                        {dictionary.contact.hoursPickup}
                      </p>
                    </div>
                  </li>
                </ul>
              </StaggerItem>

              <StaggerItem className="lg:pl-10" variants={footerColumn}>
                <h4 className="font-display mb-6 text-[18px] leading-5 text-[#ff6b00] uppercase">
                  {footer.support}
                </h4>
                <ul className="space-y-4 text-sm leading-5 text-[#1e1e1e]">
                  <li>
                    <AppLink
                      href={`/${locale}/legal/delivery`}
                      prefetchPolicy="intent"
                      className="transition hover:text-[#ff6b00]"
                    >
                      {footer.deliveryReturns}
                    </AppLink>
                  </li>
                  <li>
                    <AppLink
                      href={`/${locale}/legal/terms`}
                      prefetchPolicy="intent"
                      className="transition hover:text-[#ff6b00]"
                    >
                      {footer.terms}
                    </AppLink>
                  </li>
                  <li>
                    <AppLink
                      href={`/${locale}/legal/privacy`}
                      prefetchPolicy="intent"
                      className="transition hover:text-[#ff6b00]"
                    >
                      {footer.privacyPolicy}
                    </AppLink>
                  </li>
                </ul>
              </StaggerItem>
            </StaggerGroup>

            <RevealOnView className="relative mt-10 lg:mt-12" variants={footerColumn} delay={0.2}>
              <div className="flex flex-col items-start gap-4 xl:flex-row xl:items-center xl:justify-between">
                <p className="text-left text-sm leading-4 tracking-[0.35px] text-[#1e1e1e]">
                  {footer.copyright
                    .replace('{year}', String(year))
                    .split('Neetrino')
                    .map((part, index, parts) =>
                      index < parts.length - 1 ? (
                        <span key={`copy-${index}`}>
                          {part}
                          <a
                            href="https://www.neetrino.com/"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[#ff6900] underline-offset-2 hover:underline"
                          >
                            Neetrino
                          </a>
                        </span>
                      ) : (
                        <span key={`copy-end-${index}`}>{part}</span>
                      ),
                    )}
                </p>
                <div className="flex flex-wrap items-center gap-3">
                  {PAYMENT_BADGES.map((badge) => (
                    <span
                      key={badge.label}
                      className="flex h-9 w-[104px] items-center justify-center rounded-full bg-white px-4"
                    >
                      <Image
                        src={badge.src}
                        alt={badge.label}
                        width={256}
                        height={65}
                        className="h-[17px] w-auto object-contain"
                      />
                    </span>
                  ))}
                </div>
              </div>
            </RevealOnView>
          </div>
        </div>
      </footer>
    </div>
  );
}
