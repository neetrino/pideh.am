'use client';

import { useRef } from 'react';

import { flyToCart } from '@/features/cart/ui/fly-to-cart';
import { PIDEH_ASSETS } from '@/features/home/ui/brand-assets';
import type { ProductGalleryImage, ProductModifierChoice } from '@/features/products/types';
import { ProductGallery } from '@/features/products/ui/ProductGallery';
import {
  ProductInfoCard,
  type ProductInfoCardLabels,
} from '@/features/products/ui/ProductInfoCard';
import {
  ProductModifierCheckTags,
  toggleModifierId,
} from '@/features/products/ui/ProductModifierCheckTags';
import { ProductSectionHeading } from '@/features/products/ui/ProductSectionHeading';
import { useProductConfigurator } from '@/features/products/ui/use-product-configurator';
import type { Locale } from '@/lib/i18n/config';
import type { Currency } from '@/lib/money/currency';

type ConfiguratorLabels = ProductInfoCardLabels & {
  additions: string;
  exceptions: string;
  extraPriceHint: string;
};

type ProductDetailConfiguratorProps = {
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
  labels: ConfiguratorLabels;
  emphasizePhoto?: boolean;
};

export function ProductDetailConfigurator(props: ProductDetailConfiguratorProps) {
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
    labels,
    emphasizePhoto = false,
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
  const extraHint =
    state.extraHintPrice == null
      ? null
      : labels.extraPriceHint.replace('{price}', state.formatAmount(state.extraHintPrice));

  return (
    <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-2 lg:items-start lg:gap-8">
      <div className="flex flex-col gap-8">
        <div ref={galleryRef}>
          <ProductGallery
            images={images}
            title={title}
            discountPercent={discountPercent}
            inStock={!state.disabled}
            outOfStockLabel={labels.outOfStock}
            emphasize={emphasizePhoto}
          />
        </div>
        <ModifierBlocks
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
      </div>
      <ProductInfoCard
        locale={locale}
        productId={productId}
        title={title}
        description={description}
        inWishlist={inWishlist}
        isSignedIn={isSignedIn}
        wishlistLabel={wishlistLabel}
        labels={labels}
        state={state}
      />
    </div>
  );
}

function ModifierBlocks({
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
  labels: Pick<ConfiguratorLabels, 'additions' | 'exceptions'>;
  onToggleAddition: (id: string) => void;
  onToggleException: (id: string) => void;
}) {
  return (
    <>
      {additions.length > 0 ? (
        <div className="flex flex-col gap-3">
          <ProductSectionHeading
            iconSrc={PIDEH_ASSETS.pdpPlus}
            iconWidth={21}
            iconHeight={21}
            title={labels.additions}
            hint={extraHint}
            tone="onOrange"
          />
          <ProductModifierCheckTags
            options={additions}
            selectedIds={additionIds}
            disabled={disabled}
            groupLabel={labels.additions}
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
            tone="onOrange"
          />
          <ProductModifierCheckTags
            options={exceptions}
            selectedIds={exceptionIds}
            disabled={disabled}
            groupLabel={labels.exceptions}
            onToggle={onToggleException}
          />
        </div>
      ) : null}
    </>
  );
}
