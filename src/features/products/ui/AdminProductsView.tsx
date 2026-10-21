'use client';

import { useState } from 'react';
import { Plus } from 'lucide-react';

import { ADMIN_PRIMARY_BTN } from '@/features/admin/ui/admin-form-classes';
import { AdminPageHeading } from '@/features/admin/ui/AdminPageHeading';
import type {
  AdminCategoryOption,
  AdminProductListItem,
} from '@/features/products/application/list-admin-products';
import type { ProductModifierOption } from '@/features/products/types/modifiers';
import { AdminProductsFilters } from '@/features/products/ui/AdminProductsFilters';
import { AdminProductsTable } from '@/features/products/ui/AdminProductsTable';
import { ProductDrawer } from '@/features/products/ui/ProductDrawer';
import type { Dictionary } from '@/lib/i18n/get-dictionary';

type AdminProductsSortLinks = {
  title: string;
  price: string;
  created: string;
};

type ViewCopy = {
  products: Dictionary['admin']['products'];
  common: Dictionary['admin']['common'];
  confirm: Dictionary['admin']['confirm'];
};

type AdminProductsViewProps = {
  locale: string;
  products: AdminProductListItem[];
  sortLinks: AdminProductsSortLinks;
  shopOrderHref: string;
  sortedByShop: boolean;
  categories: AdminCategoryOption[];
  modifierLibrary: ProductModifierOption[];
  copy: ViewCopy;
  filters: {
    total: number;
    q?: string;
    categoryId?: string;
    status: 'all' | 'active' | 'inactive' | 'draft' | 'low_remaining';
    sort: string;
    dir: string;
    canReorder: boolean;
  };
};

export function AdminProductsView({
  locale,
  products,
  sortLinks,
  shopOrderHref,
  sortedByShop,
  categories,
  modifierLibrary,
  copy,
  filters,
}: AdminProductsViewProps) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<AdminProductListItem | null>(null);

  function openCreate(): void {
    setEditingProduct(null);
    setDrawerOpen(true);
  }

  function openEdit(product: AdminProductListItem): void {
    setEditingProduct(product);
    setDrawerOpen(true);
  }

  function closeDrawer(): void {
    setDrawerOpen(false);
    setEditingProduct(null);
  }

  return (
    <>
      <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <div className="flex min-w-0 items-center gap-3">
          <AdminPageHeading title={copy.products.title} />
          <span className="inline-flex h-8 min-w-8 shrink-0 items-center justify-center rounded-full bg-[#ff6b00] px-2.5 text-sm font-semibold text-white">
            {filters.total}
          </span>
        </div>
        <button
          type="button"
          onClick={openCreate}
          className={`${ADMIN_PRIMARY_BTN} h-11 shrink-0 px-5 whitespace-nowrap`}
        >
          <Plus className="h-4 w-4 shrink-0" aria-hidden />
          {copy.products.addNewProduct}
        </button>
      </div>

      <AdminProductsFilters
        q={filters.q}
        categoryId={filters.categoryId}
        status={filters.status}
        categories={categories}
        sort={filters.sort}
        dir={filters.dir}
        copy={copy.products.filters}
      />

      <AdminProductsTable
        locale={locale}
        products={products}
        sortLinks={sortLinks}
        shopOrderHref={shopOrderHref}
        sortedByShop={sortedByShop}
        onEdit={openEdit}
        canReorder={filters.canReorder}
        copy={{ table: copy.products.table, common: copy.common, confirm: copy.confirm }}
      />

      <ProductDrawer
        locale={locale}
        open={drawerOpen}
        onClose={closeDrawer}
        product={editingProduct}
        categories={categories}
        modifierLibrary={modifierLibrary}
        copy={{
          drawer: copy.products.drawer,
          categories: copy.products.categories,
          images: copy.products.images,
          discount: copy.products.discount,
          modifiers: copy.products.modifiers,
          common: copy.common,
        }}
      />
    </>
  );
}
