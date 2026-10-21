'use client';

import { GripVertical, Pencil, Star, Trash2 } from 'lucide-react';
import type { DragEvent } from 'react';

import {
  ADMIN_TABLE_ROW,
  ADMIN_TABLE_TD,
  ADMIN_TABLE_TD_CENTER,
  ADMIN_TABLE_TD_CHECK,
  ADMIN_TABLE_CHECKBOX,
} from '@/features/admin/ui/admin-table-classes';
import type { AdminProductListItem } from '@/features/products/application/list-admin-products';
import { formatMoneyAmount } from '@/lib/money/format';
import type { Dictionary } from '@/lib/i18n/get-dictionary';

type RowCopy = {
  table: Dictionary['admin']['products']['table'];
  common: Pick<Dictionary['admin']['common'], 'na' | 'none'>;
};

type AdminProductRowProps = {
  locale: string;
  product: AdminProductListItem;
  selected: boolean;
  disabled: boolean;
  onToggle: () => void;
  onEdit: () => void;
  onFeatured: () => void;
  onDelete: () => void;
  onVisibility: () => void;
  isDragging: boolean;
  reorderLabel: string;
  onRowDragOver: (event: DragEvent<HTMLTableRowElement>) => void;
  onRowDrop: (event: DragEvent<HTMLTableRowElement>) => void;
  onGripDragStart: (event: DragEvent<HTMLButtonElement>) => void;
  onGripDragEnd: () => void;
  copy: RowCopy;
};

export function AdminProductRow({
  locale,
  product,
  selected,
  disabled,
  onToggle,
  onEdit,
  onFeatured,
  onDelete,
  onVisibility,
  isDragging,
  reorderLabel,
  onRowDragOver,
  onRowDrop,
  onGripDragStart,
  onGripDragEnd,
  copy,
}: AdminProductRowProps) {
  const isActive = product.status === 'ACTIVE';
  const created = new Date(product.createdAt);
  const createdLabel = `${created.getDate()}/${created.getMonth() + 1}/${created.getFullYear()}`;

  return (
    <tr
      className={`${ADMIN_TABLE_ROW} ${isDragging ? 'bg-gray-50 opacity-50' : ''}`}
      onDragOver={onRowDragOver}
      onDrop={onRowDrop}
    >
      <td className={ADMIN_TABLE_TD}>
        <button
          type="button"
          draggable={!disabled}
          onDragStart={onGripDragStart}
          onDragEnd={onGripDragEnd}
          className="inline-flex cursor-grab touch-none text-gray-400 active:cursor-grabbing"
          aria-label={reorderLabel}
        >
          <GripVertical className="h-4 w-4" />
        </button>
      </td>
      <td className={ADMIN_TABLE_TD_CHECK}>
        <input
          type="checkbox"
          className={ADMIN_TABLE_CHECKBOX}
          checked={selected}
          onChange={onToggle}
          disabled={disabled}
          aria-label={copy.table.selectOneAria.replace('{title}', product.title)}
        />
      </td>
      <td className={ADMIN_TABLE_TD}>
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded bg-gray-100">
            {product.imageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element -- admin thumb
              <img src={product.imageUrl} alt="" className="h-full w-full object-cover" />
            ) : (
              <span className="text-[10px] text-gray-400">{copy.common.na}</span>
            )}
          </div>
          <div className="min-w-0">
            <p className="truncate font-medium text-gray-900">{product.title}</p>
            <p className="truncate text-xs text-gray-500">{product.slug}</p>
          </div>
        </div>
      </td>
      <td className={`${ADMIN_TABLE_TD_CENTER}`}>
        <div className="flex flex-col items-center">
          <span className="font-medium text-gray-900">
            {formatMoneyAmount(product.priceAmount, 'AMD', locale)}
          </span>
          {product.compareAtAmount != null && product.compareAtAmount > product.priceAmount ? (
            <span className="text-xs text-gray-400 line-through">
              {formatMoneyAmount(product.compareAtAmount, 'AMD', locale)}
            </span>
          ) : null}
        </div>
      </td>
      <td className={`${ADMIN_TABLE_TD_CENTER}`}>
        <span className="mx-auto line-clamp-2 block max-w-[160px] text-gray-700">
          {product.categoryLabels.length > 0 ? product.categoryLabels.join(', ') : copy.common.none}
        </span>
      </td>
      <td className={`${ADMIN_TABLE_TD_CENTER}`}>
        <button
          type="button"
          disabled={disabled}
          onClick={onFeatured}
          className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-amber-500"
          aria-label={product.isFeatured ? copy.table.unfeatureAria : copy.table.featureAria}
        >
          <Star
            className={`h-4 w-4 ${product.isFeatured ? 'fill-amber-400 text-amber-400' : ''}`}
          />
        </button>
      </td>
      <td className={`${ADMIN_TABLE_TD_CENTER}`}>
        <div className="flex items-center justify-center gap-1">
          <button
            type="button"
            onClick={onEdit}
            className="rounded p-1.5 text-gray-500 hover:bg-gray-100 hover:text-gray-900"
            aria-label={copy.table.editAria.replace('{title}', product.title)}
          >
            <Pencil className="h-4 w-4" />
          </button>
          <button
            type="button"
            disabled={disabled}
            onClick={onDelete}
            className="rounded p-1.5 text-red-600 hover:bg-red-50"
            aria-label={copy.table.deleteAria.replace('{title}', product.title)}
          >
            <Trash2 className="h-4 w-4" />
          </button>
          <button
            type="button"
            role="switch"
            aria-checked={isActive}
            disabled={disabled}
            onClick={onVisibility}
            className={`relative ml-1 h-5 w-9 rounded-full transition-colors ${
              isActive ? 'bg-green-500' : 'bg-gray-300'
            }`}
            aria-label={isActive ? copy.table.deactivateAria : copy.table.activateAria}
          >
            <span
              className={`absolute top-0.5 left-0.5 h-4 w-4 rounded-full bg-white transition-transform ${
                isActive ? 'translate-x-4' : 'translate-x-0'
              }`}
            />
          </button>
        </div>
      </td>
      <td className={`${ADMIN_TABLE_TD_CENTER}`}>
        <span className="text-xs text-gray-500">{createdLabel}</span>
      </td>
    </tr>
  );
}
