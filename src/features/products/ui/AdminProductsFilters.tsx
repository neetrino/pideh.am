'use client';

import { useRef, useState } from 'react';
import { flushSync } from 'react-dom';
import { Search } from 'lucide-react';

import { SelectDropdown } from '@/components/ui/SelectDropdown';
import { ADMIN_LABEL } from '@/features/admin/ui/admin-form-classes';
import type { AdminCategoryOption } from '@/features/products/application/list-admin-products';
import type { Dictionary } from '@/lib/i18n/get-dictionary';

const FILTER_INPUT =
  'h-11 w-full rounded-2xl border border-gray-200 bg-white px-4 text-sm text-gray-900 shadow-sm outline-none transition-colors placeholder:text-gray-400 hover:border-gray-300 focus:border-gray-300';

type AdminProductsFiltersProps = {
  q?: string;
  categoryId?: string;
  status: 'all' | 'active' | 'inactive' | 'draft' | 'low_remaining';
  categories: AdminCategoryOption[];
  sort: string;
  dir: string;
  copy: Dictionary['admin']['products']['filters'];
};

export function AdminProductsFilters({
  q,
  categoryId,
  status,
  categories,
  sort,
  dir,
  copy,
}: AdminProductsFiltersProps) {
  const formRef = useRef<HTMLFormElement>(null);
  const [categoryValue, setCategoryValue] = useState(categoryId ?? '');
  const [stopList, setStopList] = useState(status === 'draft');

  const categoryOptions = categories.map((category) => ({
    label: category.title,
    value: category.id,
  }));

  function applyCategory(next: string): void {
    flushSync(() => setCategoryValue(next));
    formRef.current?.requestSubmit();
  }

  function toggleStopList(): void {
    flushSync(() => setStopList((current) => !current));
    formRef.current?.requestSubmit();
  }

  return (
    <div className="mb-4">
      <form
        ref={formRef}
        method="get"
        className="flex flex-col gap-4 xl:flex-row xl:items-end"
      >
        <input type="hidden" name="sort" value={sort} />
        <input type="hidden" name="dir" value={dir} />
        <input type="hidden" name="status" value={stopList ? 'draft' : 'all'} />
        <label className="min-w-0 xl:min-w-[220px] xl:flex-1">
          <span className={ADMIN_LABEL}>{copy.searchByTitleOrSlug}</span>
          <span className="relative mt-1 block">
            <Search
              className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-[#1e1e1e]/40"
              aria-hidden
            />
            <input
              name="q"
              defaultValue={q ?? ''}
              placeholder={copy.searchByTitleOrSlugPlaceholder}
              className={`${FILTER_INPUT} pl-9`}
              aria-label={copy.searchByTitleOrSlugAria}
            />
          </span>
        </label>
        <div className="min-w-0 xl:min-w-[200px] xl:flex-1">
          <span className={ADMIN_LABEL}>{copy.filterByCategory}</span>
          <SelectDropdown
            name="categoryId"
            ariaLabel={copy.filterByCategoryAria}
            value={categoryValue}
            allLabel={copy.allCategories}
            options={categoryOptions}
            className="mt-1"
            onValueChange={applyCategory}
          />
        </div>
        <div className="min-w-max xl:w-[360px] xl:shrink-0">
          <span className={ADMIN_LABEL}>{copy.filterByStock}</span>
          <div
            role="group"
            aria-label={copy.filterByStockAria}
            className="relative mt-1 flex h-11 rounded-2xl border border-[#1e1e1e]/10 bg-white p-1"
          >
            <span
              aria-hidden
              className={`pointer-events-none absolute top-1 bottom-1 left-1 w-[calc(50%-4px)] rounded-xl bg-[#ff6b00] transition-transform duration-300 ease-out motion-reduce:transition-none ${
                stopList ? 'translate-x-full' : 'translate-x-0'
              }`}
            />
            <button
              type="button"
              aria-pressed={!stopList}
              onClick={() => {
                if (stopList) toggleStopList();
              }}
              className={`relative z-[1] min-w-0 flex-1 rounded-xl px-3 text-sm font-medium whitespace-nowrap transition-colors duration-300 ${
                stopList ? 'text-[#1e1e1e]/60 hover:text-[#ff6b00]' : 'text-white'
              }`}
            >
              {copy.allProducts}
            </button>
            <button
              type="button"
              aria-pressed={stopList}
              onClick={() => {
                if (!stopList) toggleStopList();
              }}
              className={`relative z-[1] min-w-0 flex-1 rounded-xl px-3 text-sm font-medium whitespace-nowrap transition-colors duration-300 ${
                stopList ? 'text-white' : 'text-[#1e1e1e]/60 hover:text-[#ff6b00]'
              }`}
            >
              {copy.statusDraft}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
