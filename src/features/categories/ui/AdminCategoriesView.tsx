'use client';

import { useEffect, useMemo, useRef, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronRight, GripVertical, Pencil, Plus, Trash2 } from 'lucide-react';

import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { ADMIN_INPUT } from '@/features/admin/ui/admin-form-classes';
import { AdminPageHeading } from '@/features/admin/ui/AdminPageHeading';
import {
  ADMIN_TABLE,
  ADMIN_TABLE_CARD,
  ADMIN_TABLE_OUTER_SCROLL,
  ADMIN_TABLE_ROW,
  ADMIN_TABLE_STATE_INSET,
  ADMIN_TABLE_TBODY,
  ADMIN_TABLE_TD,
  ADMIN_TABLE_TD_CENTER,
  ADMIN_TABLE_TH,
  ADMIN_TABLE_TH_CENTER,
  ADMIN_TABLE_THEAD,
} from '@/features/admin/ui/admin-table-classes';
import { deleteCategoryAction, reorderCategoriesAction } from '@/features/categories/actions';
import type { AdminCategoryListItem } from '@/features/categories/application/list-admin-categories';
import { AddCategoryDrawer } from '@/features/categories/ui/AddCategoryDrawer';
import type { Dictionary } from '@/lib/i18n/get-dictionary';

type CategoriesViewCopy = {
  categories: Dictionary['admin']['categories'];
  common: Dictionary['admin']['common'];
  confirm: Dictionary['admin']['confirm'];
};

type AdminCategoriesViewProps = {
  locale: string;
  categories: AdminCategoryListItem[];
  copy: CategoriesViewCopy;
};

function moveItem<T>(list: T[], fromIndex: number, toIndex: number): T[] {
  if (
    fromIndex === toIndex ||
    fromIndex < 0 ||
    toIndex < 0 ||
    fromIndex >= list.length ||
    toIndex >= list.length
  ) {
    return list;
  }
  const next = [...list];
  const [item] = next.splice(fromIndex, 1);
  if (!item) return list;
  next.splice(toIndex, 0, item);
  return next;
}

function sameOrder(left: AdminCategoryListItem[], right: AdminCategoryListItem[]): boolean {
  if (left.length !== right.length) return false;
  return left.every((item, index) => item.id === right[index]?.id);
}

export function AdminCategoriesView({ locale, categories, copy }: AdminCategoriesViewProps) {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<AdminCategoryListItem | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [pendingDelete, setPendingDelete] = useState<{
    id: string;
    title: string;
  } | null>(null);
  const [ordered, setOrdered] = useState(categories);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const orderedRef = useRef(ordered);
  const dragOriginRef = useRef<AdminCategoryListItem[] | null>(null);
  const persistedRef = useRef(false);

  useEffect(() => {
    setOrdered(categories);
    orderedRef.current = categories;
  }, [categories]);

  useEffect(() => {
    orderedRef.current = ordered;
  }, [ordered]);

  const needle = query.trim().toLowerCase();
  const isFiltering = needle.length > 0;

  const visible = useMemo(() => {
    if (!isFiltering) return ordered;
    return ordered.filter((category) => category.title.toLowerCase().includes(needle));
  }, [ordered, isFiltering, needle]);

  function requestDelete(categoryId: string, categoryTitle: string): void {
    setPendingDelete({ id: categoryId, title: categoryTitle });
  }

  function confirmDelete(): void {
    if (!pendingDelete) return;
    const categoryId = pendingDelete.id;

    startTransition(async () => {
      setError(null);
      const result = await deleteCategoryAction(locale, categoryId);
      if (!result.ok) {
        setError(result.error.message);
        return;
      }
      setPendingDelete(null);
      router.refresh();
    });
  }

  function persistCurrentOrder(): void {
    if (persistedRef.current) return;
    const next = orderedRef.current;
    const previous = dragOriginRef.current;
    dragOriginRef.current = null;
    if (!previous || sameOrder(previous, next)) return;

    persistedRef.current = true;
    startTransition(async () => {
      setError(null);
      const result = await reorderCategoriesAction(locale, {
        orderedIds: next.map((category) => category.id),
      });
      if (!result.ok) {
        setOrdered(previous);
        orderedRef.current = previous;
        setError(result.error.message);
        return;
      }
      router.refresh();
    });
  }

  function reorderToward(targetId: string): void {
    if (!draggingId || isFiltering || draggingId === targetId) return;
    setOrdered((current) => {
      const fromIndex = current.findIndex((category) => category.id === draggingId);
      const toIndex = current.findIndex((category) => category.id === targetId);
      if (fromIndex < 0 || toIndex < 0 || fromIndex === toIndex) return current;
      const next = moveItem(current, fromIndex, toIndex);
      orderedRef.current = next;
      return next;
    });
  }

  return (
    <section>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <AdminPageHeading title={copy.categories.title} />
        <Button
          type="button"
          size="sm"
          onClick={() => {
            setEditingCategory(null);
            setDrawerOpen(true);
          }}
          className="inline-flex items-center gap-1.5"
        >
          <Plus className="h-4 w-4" aria-hidden />
          {copy.categories.addCategory}
        </Button>
      </div>

      <input
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        placeholder={copy.categories.searchPlaceholder}
        className={`${ADMIN_INPUT} mb-4`}
        aria-label={copy.categories.searchAria}
      />

      {isFiltering ? (
        <p className="mb-3 text-xs text-gray-500">{copy.categories.clearSearchToReorder}</p>
      ) : null}

      {error ? <p className="mb-3 text-sm text-red-700">{error}</p> : null}

      <Card className={ADMIN_TABLE_CARD}>
        {visible.length === 0 ? (
          <p className={`${ADMIN_TABLE_STATE_INSET} text-sm text-gray-600`}>
            {categories.length === 0 ? copy.categories.empty : copy.categories.noMatch}
          </p>
        ) : (
          <div className={ADMIN_TABLE_OUTER_SCROLL}>
            <table className={ADMIN_TABLE}>
              <thead className={ADMIN_TABLE_THEAD}>
                <tr>
                  <th
                    className={`${ADMIN_TABLE_TH} w-8`}
                    aria-label={copy.categories.reorderAria}
                  />
                  <th className={ADMIN_TABLE_TH}>{copy.categories.image}</th>
                  <th className={ADMIN_TABLE_TH_CENTER}>{copy.categories.categoryTitle}</th>
                  <th className={ADMIN_TABLE_TH}>{copy.categories.category}</th>
                  <th className={ADMIN_TABLE_TH_CENTER}>{copy.common.actions}</th>
                </tr>
              </thead>
              <tbody className={ADMIN_TABLE_TBODY}>
                {visible.map((category) => {
                  const isDragging = draggingId === category.id;

                  return (
                    <tr
                      key={category.id}
                      className={`${ADMIN_TABLE_ROW} ${
                        isDragging ? 'bg-gray-50 opacity-50 shadow-sm' : ''
                      }`}
                      onDragOver={(event) => {
                        if (isFiltering || !draggingId) return;
                        event.preventDefault();
                        event.dataTransfer.dropEffect = 'move';
                        reorderToward(category.id);
                      }}
                      onDrop={(event) => {
                        event.preventDefault();
                        persistCurrentOrder();
                        setDraggingId(null);
                      }}
                    >
                      <td className={ADMIN_TABLE_TD}>
                        <button
                          type="button"
                          draggable={!isPending}
                          onDragStart={(event) => {
                            if (isFiltering) {
                              event.preventDefault();
                              return;
                            }
                            event.dataTransfer.effectAllowed = 'move';
                            event.dataTransfer.setData('text/plain', category.id);
                            dragOriginRef.current = orderedRef.current;
                            persistedRef.current = false;
                            setDraggingId(category.id);
                          }}
                          onDragEnd={() => {
                            persistCurrentOrder();
                            setDraggingId(null);
                          }}
                          className="inline-flex cursor-grab touch-none text-gray-400 active:cursor-grabbing"
                          aria-label={copy.categories.reorderItemAria.replace(
                            '{title}',
                            category.title,
                          )}
                        >
                          <GripVertical className="h-4 w-4" />
                        </button>
                      </td>
                      <td className={ADMIN_TABLE_TD}>
                        <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded border border-dashed border-gray-300 bg-gray-50">
                          {category.imageUrl ? (
                            // eslint-disable-next-line @next/next/no-img-element -- admin thumb
                            <img
                              src={category.imageUrl}
                              alt=""
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <span className="text-gray-400">—</span>
                          )}
                        </div>
                      </td>
                      <td className={ADMIN_TABLE_TD_CENTER}>
                        <p className="font-medium text-gray-900">{category.title}</p>
                      </td>
                      <td className={ADMIN_TABLE_TD}>
                        <span className="text-sm text-gray-500">
                          {category.parentTitle ?? copy.categories.noneRootCategory}
                        </span>
                      </td>
                      <td className={ADMIN_TABLE_TD_CENTER}>
                        <div className="inline-flex items-center justify-center gap-1">
                          <button
                            type="button"
                            className="rounded p-1.5 text-gray-500 hover:bg-gray-100 hover:text-gray-900"
                            aria-label={copy.categories.editAria.replace('{title}', category.title)}
                            onClick={() => {
                              setEditingCategory(category);
                              setDrawerOpen(true);
                            }}
                          >
                            <Pencil className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            disabled={isPending}
                            onClick={() => requestDelete(category.id, category.title)}
                            className="rounded p-1.5 text-red-600 hover:bg-red-50"
                            aria-label={copy.categories.deleteAria.replace(
                              '{title}',
                              category.title,
                            )}
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                          {category.childCount > 0 ? (
                            <span
                              className="ml-1 text-gray-400"
                              aria-label={copy.categories.subcategoriesAria.replace(
                                '{count}',
                                String(category.childCount),
                              )}
                            >
                              <ChevronRight className="h-4 w-4" />
                            </span>
                          ) : null}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <AddCategoryDrawer
        locale={locale}
        open={drawerOpen}
        onClose={() => {
          setDrawerOpen(false);
          setEditingCategory(null);
        }}
        categories={categories}
        category={editingCategory}
        copy={{ drawer: copy.categories.drawer, common: copy.common }}
      />

      <ConfirmDialog
        open={pendingDelete !== null}
        title={copy.confirm.deleteTitle}
        confirmLabel={copy.confirm.confirmLabel}
        cancelLabel={copy.confirm.cancelLabel}
        description={
          pendingDelete
            ? copy.confirm.deleteEntity
                .replace('{entity}', copy.confirm.entityLabels.category)
                .replace('{name}', pendingDelete.title)
            : ''
        }
        isPending={isPending}
        onClose={() => {
          if (!isPending) setPendingDelete(null);
        }}
        onConfirm={confirmDelete}
      />
    </section>
  );
}
