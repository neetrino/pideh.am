'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, useTransition, type DragEvent } from 'react';

import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import {
  ADMIN_TABLE,
  ADMIN_TABLE_CARD,
  ADMIN_TABLE_CHECKBOX,
  ADMIN_TABLE_OUTER_SCROLL,
  ADMIN_TABLE_STATE_INSET,
  ADMIN_TABLE_TBODY,
  ADMIN_TABLE_TH,
  ADMIN_TABLE_TH_CENTER,
  ADMIN_TABLE_TH_CHECK,
  ADMIN_TABLE_THEAD,
} from '@/features/admin/ui/admin-table-classes';
import {
  softDeleteProductsAction,
  toggleProductFeaturedAction,
  toggleProductVisibilityAction,
} from '@/features/products/application/admin-product-actions';
import type { AdminProductListItem } from '@/features/products/application/list-admin-products';
import { AdminProductRow } from '@/features/products/ui/AdminProductRow';
import { useAdminProductOrder } from '@/features/products/ui/use-admin-product-order';
import type { Dictionary } from '@/lib/i18n/get-dictionary';

type AdminProductsSortLinks = {
  title: string;
  price: string;
  created: string;
};

type TableCopy = {
  table: Dictionary['admin']['products']['table'];
  common: Dictionary['admin']['common'];
  confirm: Dictionary['admin']['confirm'];
};

type AdminProductsTableProps = {
  locale: string;
  products: AdminProductListItem[];
  sortLinks: AdminProductsSortLinks;
  shopOrderHref: string;
  sortedByShop: boolean;
  canReorder: boolean;
  onEdit: (product: AdminProductListItem) => void;
  copy: TableCopy;
};

export function AdminProductsTable({
  locale,
  products,
  sortLinks,
  shopOrderHref,
  sortedByShop,
  canReorder,
  onEdit,
  copy,
}: AdminProductsTableProps) {
  const router = useRouter();
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const { ordered, draggingId, reorderToward, beginDrag, endDrag } =
    useAdminProductOrder({
      locale,
      products,
      canReorder,
      startTransition,
      onError: setError,
      onSaved: () => {
        if (sortedByShop) {
          router.refresh();
          return;
        }
        router.replace(shopOrderHref);
      },
    });
  const [pendingDelete, setPendingDelete] = useState<{
    kind: 'single' | 'bulk';
    productIds: string[];
    label: string;
  } | null>(null);

  const allIds = ordered.map((product) => product.id);
  const allSelected = allIds.length > 0 && allIds.every((id) => selected.has(id));

  function toggleOne(id: string): void {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleAll(): void {
    setSelected(allSelected ? new Set() : new Set(allIds));
  }

  function runAction(action: () => Promise<void>): void {
    startTransition(async () => {
      setError(null);
      try {
        await action();
        router.refresh();
      } catch (caught) {
        setError(caught instanceof Error ? caught.message : copy.common.actionFailed);
      }
    });
  }

  function deleteSelected(): void {
    if (selected.size === 0) return;
    const count = selected.size;
    const label =
      count === 1
        ? copy.confirm.selectedProduct
        : copy.confirm.selectedProducts.replace('{count}', String(count));
    setPendingDelete({
      kind: 'bulk',
      productIds: [...selected],
      label,
    });
  }

  function confirmDelete(): void {
    if (!pendingDelete) return;
    const productIds = pendingDelete.productIds;
    startTransition(async () => {
      setError(null);
      try {
        const result = await softDeleteProductsAction(locale, { productIds });
        if (!result.ok) throw new Error(result.error.message);

        setSelected((prev) => {
          const next = new Set(prev);
          for (const id of productIds) next.delete(id);
          return next;
        });
        setPendingDelete(null);
        router.refresh();
      } catch (caught) {
        setError(caught instanceof Error ? caught.message : copy.common.actionFailed);
      }
    });
  }

  const selectedLabel = copy.common.selectedCount
    .replace('{count}', String(selected.size))
    .replace(
      '{entity}',
      selected.size === 1
        ? copy.common.entitySingular.product
        : copy.common.entitySingular.products,
    );

  return (
    <div className="flex flex-col gap-4">
      {selected.size > 0 ? (
        <Card className="flex flex-wrap items-center justify-between gap-3 p-4">
          <p className="text-sm text-gray-700">{selectedLabel}</p>
          <Button
            type="button"
            size="sm"
            variant="danger"
            disabled={isPending}
            onClick={deleteSelected}
          >
            {copy.table.deleteSelected}
          </Button>
        </Card>
      ) : null}

      {error ? <p className="text-sm text-red-700">{error}</p> : null}

      <Card className={ADMIN_TABLE_CARD}>
        {ordered.length === 0 ? (
          <p className={`${ADMIN_TABLE_STATE_INSET} text-sm text-gray-600`}>{copy.table.empty}</p>
        ) : (
          <div className={ADMIN_TABLE_OUTER_SCROLL}>
            <table className={ADMIN_TABLE}>
              <thead className={ADMIN_TABLE_THEAD}>
                <tr>
                  <th className={`${ADMIN_TABLE_TH} w-8`} aria-label={copy.table.reorderAria} />
                  <th className={ADMIN_TABLE_TH_CHECK}>
                    <input
                      type="checkbox"
                      className={ADMIN_TABLE_CHECKBOX}
                      checked={allSelected}
                      onChange={toggleAll}
                      disabled={isPending}
                      aria-label={copy.table.selectAllAria}
                    />
                  </th>
                  <th className={ADMIN_TABLE_TH}>
                    <Link href={sortLinks.title} className="hover:text-gray-900">
                      {copy.table.product}
                    </Link>
                  </th>
                  <th className={ADMIN_TABLE_TH_CENTER}>
                    <Link href={sortLinks.price} className="hover:text-gray-900">
                      {copy.table.price}
                    </Link>
                  </th>
                  <th className={ADMIN_TABLE_TH_CENTER}>{copy.table.category}</th>
                  <th className={ADMIN_TABLE_TH_CENTER}>{copy.table.featured}</th>
                  <th className={ADMIN_TABLE_TH_CENTER}>{copy.table.actions}</th>
                  <th className={ADMIN_TABLE_TH_CENTER}>
                    <Link href={sortLinks.created} className="hover:text-gray-900">
                      {copy.table.created}
                    </Link>
                  </th>
                </tr>
              </thead>
              <tbody className={ADMIN_TABLE_TBODY}>
                {ordered.map((product) => (
                  <AdminProductRow
                    key={product.id}
                    locale={locale}
                    product={product}
                    selected={selected.has(product.id)}
                    disabled={isPending}
                    isDragging={draggingId === product.id}
                    reorderLabel={copy.table.reorderItemAria.replace('{title}', product.title)}
                    onRowDragOver={(event: DragEvent<HTMLTableRowElement>) => {
                      if (isPending || !draggingId) return;
                      event.preventDefault();
                      event.dataTransfer.dropEffect = 'move';
                      reorderToward(product.id);
                    }}
                    onRowDrop={(event: DragEvent<HTMLTableRowElement>) => {
                      event.preventDefault();
                      endDrag();
                    }}
                    onGripDragStart={(event: DragEvent<HTMLButtonElement>) => {
                      if (isPending) {
                        event.preventDefault();
                        return;
                      }
                      event.dataTransfer.effectAllowed = 'move';
                      event.dataTransfer.setData('text/plain', product.id);
                      beginDrag(product.id);
                    }}
                    onGripDragEnd={endDrag}
                    copy={{ table: copy.table, common: copy.common }}
                    onToggle={() => toggleOne(product.id)}
                    onEdit={() => onEdit(product)}
                    onFeatured={() =>
                      runAction(async () => {
                        const result = await toggleProductFeaturedAction(locale, product.id);
                        if (!result.ok) throw new Error(result.error.message);
                      })
                    }
                    onDelete={() =>
                      setPendingDelete({
                        kind: 'single',
                        productIds: [product.id],
                        label: product.title,
                      })
                    }
                    onVisibility={() =>
                      runAction(async () => {
                        const result = await toggleProductVisibilityAction(locale, product.id);
                        if (!result.ok) throw new Error(result.error.message);
                      })
                    }
                  />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <ConfirmDialog
        open={pendingDelete !== null}
        title={copy.confirm.deleteTitle}
        confirmLabel={copy.confirm.confirmLabel}
        cancelLabel={copy.confirm.cancelLabel}
        description={
          pendingDelete?.kind === 'bulk'
            ? copy.confirm.deleteSelectedProducts.replace('{label}', pendingDelete.label)
            : pendingDelete
              ? copy.confirm.deleteEntity
                  .replace('{entity}', copy.confirm.entityLabels.product)
                  .replace('{name}', pendingDelete.label)
              : ''
        }
        isPending={isPending}
        onClose={() => {
          if (!isPending) setPendingDelete(null);
        }}
        onConfirm={confirmDelete}
      />
    </div>
  );
}
