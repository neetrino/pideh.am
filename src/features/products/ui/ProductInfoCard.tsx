'use client';

import { PIDEH_ASSETS } from '@/features/home/ui/brand-assets';
import { ProductPriceFlow } from '@/features/products/ui/ProductPriceFlow';
import { ProductPurchaseControls } from '@/features/products/ui/ProductPurchaseControls';
import { ProductSectionHeading } from '@/features/products/ui/ProductSectionHeading';
import { ProductSpecialRequestsField } from '@/features/products/ui/ProductSpecialRequestsField';
import type { useProductConfigurator } from '@/features/products/ui/use-product-configurator';
import { WISHLIST_RING_BUTTON_CLASS, WishlistButton } from '@/features/wishlist/ui/WishlistButton';
import type { Locale } from '@/lib/i18n/config';

export type ProductInfoCardLabels = {
  ingredients: string;
  specialRequests: string;
  specialRequestsPlaceholder: string;
  quantity: string;
  decreaseQuantity: string;
  increaseQuantity: string;
  addToCart: string;
  outOfStock: string;
  error: string;
  resetSelection: string;
};

type ProductInfoCardProps = {
  locale: Locale;
  productId: string;
  title: string;
  description?: string;
  inWishlist: boolean;
  isSignedIn: boolean;
  wishlistLabel: string;
  labels: ProductInfoCardLabels;
  state: ReturnType<typeof useProductConfigurator>;
};

export function ProductInfoCard({
  locale,
  productId,
  title,
  description,
  inWishlist,
  isSignedIn,
  wishlistLabel,
  labels,
  state,
}: ProductInfoCardProps) {
  function handleReset(): void {
    state.resetSelection();
  }

  return (
    <div className="flex w-full flex-col gap-2.5 rounded-[30px] bg-[#fff8f0] pt-6 pr-6 pb-6 pl-[30px]">
      <div className="flex items-start justify-between gap-4">
        <h1 className="font-display text-[clamp(2.25rem,5vw,3.125rem)] leading-[1.25] text-[#1e1e1e]">
          {title}
        </h1>
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
      </div>

      {description ? (
        <div className="flex flex-col py-4 pr-4">
          <ProductSectionHeading
            iconSrc={PIDEH_ASSETS.pdpList}
            iconWidth={14}
            iconHeight={14}
            title={labels.ingredients}
            tone="onCream"
            titleSize="sm"
          />
          <p className="font-noto-armenian mt-2 text-sm leading-[22.75px] text-[#555]">
            {description}
          </p>
        </div>
      ) : null}

      <div className="flex flex-wrap items-baseline gap-3">
        <ProductPriceFlow
          amount={state.totalAmount}
          formatted={state.totalFormatted}
          className="text-[36px] leading-9 font-extrabold text-[#ff6900]"
        />
        {state.compareAtTotalFormatted ? (
          <span className="font-noto-armenian text-base leading-6 text-[#99a1af] line-through">
            {state.compareAtTotalFormatted}
          </span>
        ) : null}
      </div>

      <ProductPurchaseControls
        quantity={state.quantity}
        maxQty={state.maxQty}
        disabled={state.disabled}
        onQuantityChange={state.changeQuantity}
        onReset={handleReset}
        onAdd={state.handleAdd}
        labels={labels}
        error={state.error}
      />

      <div className="mt-4">
        <ProductSpecialRequestsField
          label={labels.specialRequests}
          placeholder={labels.specialRequestsPlaceholder}
          value={state.customerNote}
          disabled={state.disabled}
          onChange={state.setCustomerNote}
        />
      </div>
    </div>
  );
}
