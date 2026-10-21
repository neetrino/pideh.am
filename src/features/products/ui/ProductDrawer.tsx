'use client';

import { useEffect, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { SideSheet } from '@/components/ui/SideSheet';
import { ADMIN_INPUT, ADMIN_LABEL } from '@/features/admin/ui/admin-form-classes';
import type {
  AdminCategoryOption,
  AdminProductListItem,
} from '@/features/products/application/list-admin-products';
import type { ProductModifierOption } from '@/features/products/types/modifiers';
import type { ProductDiscountDraft } from '@/features/products/types/product-discount';
import {
  createProductFromDrawerAction,
  updateProductFromDrawerAction,
} from '@/features/products/application/upsert-product';
import { DEFAULT_PRODUCT_STOCK_ON_HAND } from '@/features/products/domain/stock-levels';
import { ProductDrawerCategories } from '@/features/products/ui/ProductDrawerCategories';
import { ProductDrawerDiscount } from '@/features/products/ui/ProductDrawerDiscount';
import {
  ProductDrawerImages,
  type ProductDraftImage,
} from '@/features/products/ui/ProductDrawerImages';
import { ProductDrawerModifiers } from '@/features/products/ui/ProductDrawerModifiers';
import {
  ProductDrawerLocaleFields,
  collectProductTranslations,
  emptyProductDrafts,
  productDraftsFrom,
  type ProductLocaleDraft,
} from '@/features/products/ui/ProductDrawerLocaleFields';
import { firstLatinSlug, resolveSharedSlug } from '@/features/categories/domain/slugify';
import { isLocale, type Locale } from '@/lib/i18n/config';
import { getDictionary, type Dictionary } from '@/lib/i18n/get-dictionary';

type ProductDrawerProduct = Pick<
  AdminProductListItem,
  | 'id'
  | 'sku'
  | 'title'
  | 'slug'
  | 'description'
  | 'translations'
  | 'priceAmount'
  | 'stockOnHand'
  | 'status'
  | 'categoryIds'
  | 'modifierIds'
  | 'discount'
  | 'images'
>;

type DrawerCopy = {
  drawer: Dictionary['admin']['products']['drawer'];
  categories: Dictionary['admin']['products']['categories'];
  images: Dictionary['admin']['products']['images'];
  discount: Dictionary['admin']['products']['discount'];
  modifiers: Dictionary['admin']['products']['modifiers'];
  common: Dictionary['admin']['common'];
};

type ProductDrawerProps = {
  locale: string;
  open: boolean;
  onClose: () => void;
  product?: ProductDrawerProduct | null;
  categories: AdminCategoryOption[];
  modifierLibrary: ProductModifierOption[];
  copy: DrawerCopy;
};

function imagesFromProduct(product: ProductDrawerProduct | null): ProductDraftImage[] {
  if (!product) return [];
  return product.images.map((image) => ({
    key: image.id,
    previewUrl: image.url,
    isPrimary: image.isPrimary,
    existingId: image.id,
  }));
}

export function ProductDrawer({
  locale,
  open,
  onClose,
  product = null,
  categories: initialCategories,
  modifierLibrary: initialModifierLibrary,
  copy,
}: ProductDrawerProps) {
  const router = useRouter();
  const isEdit = product != null;
  const [activeLocale, setActiveLocale] = useState<Locale>(isLocale(locale) ? locale : 'hy');
  const [drafts, setDrafts] = useState(emptyProductDrafts);
  const [slug, setSlug] = useState('');
  const [slugTouched, setSlugTouched] = useState(false);
  const [images, setImages] = useState<ProductDraftImage[]>([]);
  const [removedImageIds, setRemovedImageIds] = useState<string[]>([]);
  const [categories, setCategories] = useState<AdminCategoryOption[]>(initialCategories);
  const [categoryIds, setCategoryIds] = useState<string[]>([]);
  const [modifierLibrary, setModifierLibrary] =
    useState<ProductModifierOption[]>(initialModifierLibrary);
  const [modifierIds, setModifierIds] = useState<string[]>([]);
  const [discount, setDiscount] = useState<ProductDiscountDraft | null>(null);
  const [priceAmount, setPriceAmount] = useState('');
  const [sku, setSku] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    if (!open) return;

    setCategories(initialCategories);
    setModifierLibrary(initialModifierLibrary);
    if (product) {
      setActiveLocale(isLocale(locale) ? locale : 'hy');
      setDrafts(productDraftsFrom(product.translations));
      const existingSlug = firstLatinSlug([
        product.translations.en?.slug,
        product.translations.hy?.slug,
        product.translations.ru?.slug,
      ]);
      setSlug(existingSlug);
      setSlugTouched(existingSlug.length > 0);
      setImages(imagesFromProduct(product));
      setRemovedImageIds([]);
      setCategoryIds(product.categoryIds);
      setModifierIds(product.modifierIds);
      setDiscount(
        product.discount
          ? {
              type: product.discount.type,
              value: product.discount.value,
              startsAt: product.discount.startsAt
                ? new Date(product.discount.startsAt).toISOString()
                : null,
              endsAt: product.discount.endsAt
                ? new Date(product.discount.endsAt).toISOString()
                : null,
            }
          : null,
      );
      setPriceAmount(String(product.priceAmount));
      setSku(product.sku);
      setError(null);
    } else {
      setActiveLocale(isLocale(locale) ? locale : 'hy');
      setDrafts(emptyProductDrafts());
      setSlug('');
      setSlugTouched(false);
      setImages([]);
      setRemovedImageIds([]);
      setCategoryIds([]);
      setModifierIds([]);
      setDiscount(null);
      setPriceAmount('');
      setSku('');
      setError(null);
    }
  }, [open, product, locale, initialCategories, initialModifierLibrary]);

  function handleImagesChange(next: ProductDraftImage[]): void {
    const nextKeys = new Set(next.map((image) => image.key));
    const removedExisting = images
      .filter(
        (image) =>
          image.existingId &&
          !nextKeys.has(image.key) &&
          !removedImageIds.includes(image.existingId),
      )
      .map((image) => image.existingId as string);
    if (removedExisting.length > 0) {
      setRemovedImageIds((prev) => [...prev, ...removedExisting]);
    }
    setImages(next);
  }

  function updateDraft(loc: Locale, patch: Partial<ProductLocaleDraft>): void {
    setDrafts((current) => ({ ...current, [loc]: { ...current[loc], ...patch } }));
  }

  const formCopy = getDictionary(activeLocale).admin;

  return (
    <SideSheet
      open={open}
      onClose={onClose}
      ariaLabel={isEdit ? copy.drawer.editAria : copy.drawer.addAria}
      variant="admin"
    >
      <div className="shrink-0 border-b-2 border-[#1e1e1e]/10 px-5 py-4 sm:px-6">
        <h2 className="font-display text-2xl leading-[0.95] text-[#1e1e1e] uppercase sm:text-3xl">
          {isEdit ? copy.drawer.editTitle : copy.drawer.addTitle}
        </h2>
      </div>

      <form
        className="flex min-h-0 flex-1 flex-col"
        onSubmit={(event) => {
          event.preventDefault();
          const newImages = images.filter((image) => image.file);
          const primaryImage = images.find((image) => image.isPrimary);
          const primaryNewIndex = primaryImage?.file
            ? newImages.findIndex((image) => image.key === primaryImage.key)
            : null;

          const sharedSlug = resolveSharedSlug(drafts.en.title, slug, slugTouched);
          const translations = collectProductTranslations(drafts, sharedSlug);
          if (!translations) {
            const hasTitle = Object.values(drafts).some((item) => item.title.trim());
            setError(
              hasTitle
                ? formCopy.common.englishSlugRequired
                : formCopy.common.atLeastOneLanguage,
            );
            return;
          }

          const payload = {
            sku: sku.trim(),
            translations,
            priceAmount: Number(priceAmount),
            stockOnHand: product
              ? product.stockOnHand
              : DEFAULT_PRODUCT_STOCK_ON_HAND,
            categoryIds,
            modifierIds,
            discount,
            status: (product?.status === 'ACTIVE' || product?.status === 'ARCHIVED'
              ? product.status
              : 'DRAFT') as 'DRAFT' | 'ACTIVE' | 'ARCHIVED',
            primaryExistingId: primaryImage?.existingId ?? null,
            primaryNewIndex:
              primaryNewIndex != null && primaryNewIndex >= 0 ? primaryNewIndex : null,
            removeImageIds: removedImageIds,
          };

          const formData = new FormData();
          formData.set('data', JSON.stringify(payload));
          for (const image of newImages) {
            if (image.file) formData.append('images', image.file);
          }

          startTransition(async () => {
            setError(null);
            try {
              const result =
                isEdit && product
                  ? await updateProductFromDrawerAction(locale, product.id, formData)
                  : await createProductFromDrawerAction(locale, formData);

              if (!result.ok) {
                setError(result.error.message);
                return;
              }

              onClose();
              router.refresh();
            } catch (caught) {
              const message = caught instanceof Error ? caught.message : formCopy.common.saveFailed;
              if (/body exceeded|413|too large/i.test(message)) {
                setError(formCopy.products.drawer.imagesTooLarge);
                return;
              }
              setError(message);
            }
          });
        }}
      >
        <div className="flex-1 space-y-4 overflow-y-auto px-5 py-5">
          <ProductDrawerLocaleFields
            active={activeLocale}
            drafts={drafts}
            disabled={isPending}
            onActiveChange={setActiveLocale}
            onDraftChange={updateDraft}
          />

          <label className="block">
            <span className={ADMIN_LABEL}>
              {formCopy.products.drawer.slug}{' '}
              <span className="text-red-600">{formCopy.common.requiredMark}</span>
            </span>
            <input
              value={resolveSharedSlug(drafts.en.title, slug, slugTouched)}
              onChange={(event) => {
                setSlugTouched(true);
                setSlug(event.target.value);
              }}
              placeholder={formCopy.products.drawer.slugPlaceholder}
              className={ADMIN_INPUT}
              disabled={isPending}
            />
            <span className="mt-1 block text-xs text-gray-500">
              {formCopy.products.drawer.slugHint}
            </span>
          </label>

          <ProductDrawerImages
            images={images}
            disabled={isPending}
            onChange={handleImagesChange}
            copy={formCopy.products.images}
          />

          <ProductDrawerCategories
            locale={locale}
            activeLocale={activeLocale}
            categories={categories}
            selectedIds={categoryIds}
            disabled={isPending}
            onCategoriesChange={setCategories}
            onSelectedChange={setCategoryIds}
            copy={formCopy.products.categories}
          />

          <ProductDrawerModifiers
            locale={locale}
            library={modifierLibrary}
            selectedIds={modifierIds}
            disabled={isPending}
            onLibraryChange={setModifierLibrary}
            onSelectedChange={setModifierIds}
            copy={formCopy.products.modifiers}
          />

          <div className="grid gap-4 sm:grid-cols-2">
            <label>
              <span className={ADMIN_LABEL}>
                {formCopy.products.drawer.price}{' '}
                <span className="text-red-600">{formCopy.common.requiredMark}</span>
              </span>
              <input
                required
                min={0}
                type="number"
                value={priceAmount}
                onChange={(event) => setPriceAmount(event.target.value)}
                placeholder={formCopy.products.drawer.pricePlaceholder}
                className={ADMIN_INPUT}
                disabled={isPending}
              />
            </label>
            <ProductDrawerDiscount
              locale={locale}
              value={discount}
              disabled={isPending}
              onChange={setDiscount}
              copy={formCopy.products.discount}
            />
          </div>

          <label>
            <span className={ADMIN_LABEL}>
              {formCopy.products.drawer.sku}{' '}
              <span className="text-red-600">{formCopy.common.requiredMark}</span>
            </span>
            <input
              required
              value={sku}
              onChange={(event) => setSku(event.target.value)}
              placeholder={formCopy.products.drawer.skuPlaceholder}
              className={ADMIN_INPUT}
              disabled={isPending}
            />
          </label>

          {error ? <p className="text-sm text-red-700">{error}</p> : null}
        </div>

        <div className="sticky bottom-0 flex items-center gap-4 border-t border-gray-200 bg-white px-5 py-4">
          <Button type="submit" disabled={isPending}>
            {isPending
              ? isEdit
                ? formCopy.common.saving
                : formCopy.common.creating
              : isEdit
                ? formCopy.common.save
                : formCopy.common.create}
          </Button>
          <button
            type="button"
            onClick={onClose}
            className="text-sm font-medium text-gray-600 hover:text-gray-900"
          >
            {formCopy.common.cancel}
          </button>
        </div>
      </form>
    </SideSheet>
  );
}
