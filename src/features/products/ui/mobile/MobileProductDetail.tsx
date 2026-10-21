'use client';

import Image from 'next/image';
import { useRef, type ReactNode } from 'react';

import { MOBILE_COPYRIGHT_NAV_CLEARANCE_PX } from '@/components/layout/NavEllipse3469';
import {
  MOBILE_STOREFRONT_COLUMN,
  MOBILE_STOREFRONT_SHELL,
} from '@/components/layout/page-container';
import { flyToCart } from '@/features/cart/ui/fly-to-cart';
import { PIDEH_ASSETS } from '@/features/home/ui/brand-assets';
import { MobileCopyright } from '@/features/home/ui/mobile/MobileCopyright';
import type { ProductGalleryImage, ProductModifierChoice } from '@/features/products/types';
import type { ProductInfoCardLabels } from '@/features/products/ui/ProductInfoCard';
import {
  ProductModifierCheckTags,
  toggleModifierId,
} from '@/features/products/ui/ProductModifierCheckTags';
import { ProductPriceFlow } from '@/features/products/ui/ProductPriceFlow';
import { ProductQtyStepper } from '@/features/products/ui/ProductQtyStepper';
import { ProductSectionHeading } from '@/features/products/ui/ProductSectionHeading';
import { ProductSpecialRequestsField } from '@/features/products/ui/ProductSpecialRequestsField';
import { MobileProductHero } from '@/features/products/ui/mobile/MobileProductHero';
import { MobileProductSheet } from '@/features/products/ui/mobile/MobileProductSheet';
import { useProductConfigurator } from '@/features/products/ui/use-product-configurator';
import { WISHLIST_RING_BUTTON_CLASS, WishlistButton } from '@/features/wishlist/ui/WishlistButton';
import type { Locale } from '@/lib/i18n/config';
import type { Currency } from '@/lib/money/currency';

type MobileLabels = ProductInfoCardLabels & {
  additions: string;
  exceptions: string;
  extraPriceHint: string;
};

type MobileProductDetailProps = {
  locale: Locale;
  currency: Currency;
  fxRate: string;
  productId: string;
  title: string;
  description?: string;
  images: ProductGalleryImage[];
  discountPercent: number | null;
  stockOnHand: number;
  basePriceAmount: number;
  compareAtAmount: number | null;
  additions: ProductModifierChoice[];
  exceptions: ProductModifierChoice[];
  inWishlist: boolean;
  isSignedIn: boolean;
  wishlistLabel: string;
  backLabel: string;
  emphasizePhoto?: boolean;
  labels: MobileLabels;
  relatedSlot?: ReactNode;
  copyrightText: string;
};
const MODIFIER_CHIP = 'bg-[rgba(255,107,0,0.09)]';

/**
 * Mobile single-product screen from Figma node 414:598 (440-wide).
 *
 * @see https://www.figma.com/design/zyLVZFDhohLYxwuohIrPDN/Pideh-Dev?node-id=414-598
 */
export function MobileProductDetail(props: MobileProductDetailProps) {
  const {
    locale,
    currency,
    fxRate,
    productId,
    title,
    description,
    images,
    discountPercent,
    stockOnHand,
    basePriceAmount,
    compareAtAmount,
    additions,
    exceptions,
    inWishlist,
    isSignedIn,
    wishlistLabel,
    backLabel,
    emphasizePhoto = false,
    labels,
    relatedSlot,
    copyrightText,
  } = props;
  const galleryRef = useRef<HTMLDivElement>(null);
  const state = useProductConfigurator({
    locale,
    currency,
    fxRate,
    productId,
    stockOnHand,
    basePriceAmount,
    compareAtAmount,
    additions,
    errorLabel: labels.error,
    onAdded: () => flyToCart(galleryRef.current),
  });

  function handleReset(): void {
    state.resetSelection();
  }

  const extraHint =
    state.extraHintPrice == null
      ? null
      : labels.extraPriceHint.replace('{price}', state.formatAmount(state.extraHintPrice));
  const addLabel = state.disabled ? labels.outOfStock : labels.addToCart;
  const heroImage = images[0] ?? null;

  return (
    <div
      className={`${MOBILE_STOREFRONT_SHELL} pideh-pdp-mobile overflow-x-clip bg-[#ff6b00]`}
      style={{ paddingBottom: MOBILE_COPYRIGHT_NAV_CLEARANCE_PX }}
    >
      <div className={MOBILE_STOREFRONT_COLUMN}>
      <MobileProductHero
        title={title}
        image={heroImage}
        galleryRef={galleryRef}
        discountPercent={discountPercent}
        inStock={!state.disabled}
        outOfStockLabel={labels.outOfStock}
        backLabel={backLabel}
        emphasizePhoto={emphasizePhoto}
      />

      <MobileProductSheet
        title={title}
        paddingBottomPx={28}
        wishlist={
          <WishlistButton
            locale={locale}
            productId={productId}
            initialInWishlist={inWishlist}
            isSignedIn={isSignedIn}
            label={wishlistLabel}
            emptyIconSrc={PIDEH_ASSETS.pdpHeart}
            emptyIconWidth={22}
            emptyIconHeight={22}
            className={WISHLIST_RING_BUTTON_CLASS}
          />
        }
        priceRow={
          <>
            <div className="flex min-w-0 flex-wrap items-baseline gap-2">
              <ProductPriceFlow
                amount={state.totalAmount}
                formatted={state.totalFormatted}
                className="font-montserrat-arm text-[34px] leading-[36px] font-extrabold text-[#ff6900]"
              />
              {state.compareAtTotalFormatted ? (
                <span className="font-noto-armenian text-sm leading-6 text-[#99a1af] line-through">
                  {state.compareAtTotalFormatted}
                </span>
              ) : null}
            </div>
            <div className="shrink-0">
              <ProductQtyStepper
                quantity={state.quantity}
                maxQty={state.maxQty}
                disabled={state.disabled}
                labels={labels}
                onQuantityChange={state.changeQuantity}
                onReset={handleReset}
              />
            </div>
          </>
        }
        footer={
          <>
            <div className="mt-10">
              <ProductSpecialRequestsField
                label={labels.specialRequests}
                placeholder={labels.specialRequestsPlaceholder}
                value={state.customerNote}
                disabled={state.disabled}
                minHeightClassName="min-h-[155px]"
                onChange={state.setCustomerNote}
              />
            </div>
            <button
              type="button"
              disabled={state.disabled}
              onClick={state.handleAdd}
              className="mt-4 mb-2 inline-flex h-14 w-full items-center justify-center gap-3 rounded-[66px] bg-[#ff6900] pr-2 pl-[18px] text-white transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Image
                src={PIDEH_ASSETS.pdpCart}
                alt=""
                width={26}
                height={26}
                className="size-[26px] shrink-0"
              />
              <span className="text-sm leading-5 font-semibold">{addLabel}</span>
            </button>
            {state.error ? (
              <p className="pb-3 text-sm text-red-700" role="alert">
                {state.error}
              </p>
            ) : null}
          </>
        }
      >
        {description ? (
          <div className="flex flex-col py-2.5 pr-4">
            <ProductSectionHeading
              iconSrc={PIDEH_ASSETS.pdpList}
              iconWidth={14}
              iconHeight={14}
              title={labels.ingredients}
              tone="onCream"
              titleSize="sm"
            />
            <p className="font-noto-armenian mt-0.5 text-sm leading-5 text-[#555]">
              {description}
            </p>
          </div>
        ) : null}

        <MobileModifiers
          additions={additions}
          exceptions={exceptions}
          additionIds={state.additionIds}
          exceptionIds={state.exceptionIds}
          extraHint={extraHint}
          disabled={state.disabled}
          labels={labels}
          onToggleAddition={(id) => state.setAdditionIds((cur) => toggleModifierId(cur, id))}
          onToggleException={(id) => state.setExceptionIds((cur) => toggleModifierId(cur, id))}
        />
      </MobileProductSheet>
      {relatedSlot ? <div className="px-4 pb-6">{relatedSlot}</div> : null}
      <MobileCopyright className="mt-10" text={copyrightText} />
      </div>
    </div>
  );
}

function MobileModifiers({
  additions,
  exceptions,
  additionIds,
  exceptionIds,
  extraHint,
  disabled,
  labels,
  onToggleAddition,
  onToggleException,
}: {
  additions: ProductModifierChoice[];
  exceptions: ProductModifierChoice[];
  additionIds: string[];
  exceptionIds: string[];
  extraHint: string | null;
  disabled: boolean;
  labels: Pick<MobileLabels, 'additions' | 'exceptions'>;
  onToggleAddition: (id: string) => void;
  onToggleException: (id: string) => void;
}) {
  if (additions.length === 0 && exceptions.length === 0) {
    return null;
  }

  return (
    <div className="flex flex-col gap-4 pb-2">
      {additions.length > 0 ? (
        <div className="flex flex-col gap-3">
          <ProductSectionHeading
            iconSrc={PIDEH_ASSETS.pdpPlus}
            iconWidth={21}
            iconHeight={21}
            title={labels.additions}
            hint={extraHint}
            tone="onCream"
          />
          <ProductModifierCheckTags
            options={additions}
            selectedIds={additionIds}
            disabled={disabled}
            groupLabel={labels.additions}
            chipClassName={MODIFIER_CHIP}
            onToggle={onToggleAddition}
          />
        </div>
      ) : null}
      {exceptions.length > 0 ? (
        <div className="flex flex-col gap-3">
          <ProductSectionHeading
            iconSrc={PIDEH_ASSETS.pdpRemove}
            iconWidth={27}
            iconHeight={27}
            title={labels.exceptions}
            tone="onCream"
          />
          <ProductModifierCheckTags
            options={exceptions}
            selectedIds={exceptionIds}
            disabled={disabled}
            groupLabel={labels.exceptions}
            chipClassName={MODIFIER_CHIP}
            onToggle={onToggleException}
          />
        </div>
      ) : null}
    </div>
  );
}
