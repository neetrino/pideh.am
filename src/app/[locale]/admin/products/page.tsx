import Link from 'next/link';
import { notFound } from 'next/navigation';

import {
  listAdminCategoryOptions,
  listAdminProducts,
} from '@/features/products/application/list-admin-products';
import { listModifiersForProductAdmin } from '@/features/products/application/product-modifiers';
import { adminProductsFilterSchema } from '@/features/products/schemas/admin-list';
import { AdminProductsView } from '@/features/products/ui/AdminProductsView';
import { isLocale } from '@/lib/i18n/config';
import { getDictionary } from '@/lib/i18n/get-dictionary';

type AdminProductsPageProps = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function firstParam(value: string | string[] | undefined): string | undefined {
  if (Array.isArray(value)) {
    return value[0];
  }
  return value;
}

function buildQuery(
  filters: {
    q?: string;
    sku?: string;
    categoryId?: string;
    stock: string;
    status: string;
    sort: string;
    dir: string;
    page: number;
  },
  overrides: Partial<typeof filters> = {},
): string {
  const merged = { ...filters, ...overrides };
  const params = new URLSearchParams();
  if (merged.q) params.set('q', merged.q);
  if (merged.sku) params.set('sku', merged.sku);
  if (merged.categoryId) params.set('categoryId', merged.categoryId);
  if (merged.stock !== 'all') params.set('stock', merged.stock);
  if (merged.status !== 'all') params.set('status', merged.status);
  if (merged.sort !== 'shop') params.set('sort', merged.sort);
  if (merged.dir !== 'desc') params.set('dir', merged.dir);
  if (merged.page > 1) params.set('page', String(merged.page));
  return params.toString();
}

export default async function AdminProductsPage({ params, searchParams }: AdminProductsPageProps) {
  const { locale } = await params;
  if (!isLocale(locale)) {
    notFound();
  }

  const dict = getDictionary(locale);
  const adminCopy = dict.admin;

  const raw = await searchParams;
  const parsed = adminProductsFilterSchema.safeParse({
    q: firstParam(raw.q) || undefined,
    sku: firstParam(raw.sku) || undefined,
    categoryId: firstParam(raw.categoryId) || undefined,
    stock: firstParam(raw.stock) ?? 'all',
    status: firstParam(raw.status) ?? 'all',
    sort: firstParam(raw.sort) ?? 'shop',
    dir: firstParam(raw.dir) ?? 'desc',
    page: firstParam(raw.page) ?? '1',
  });

  const filters = parsed.success
    ? parsed.data
    : {
        page: 1 as const,
        stock: 'all' as const,
        status: 'all' as const,
        sort: 'shop' as const,
        dir: 'desc' as const,
        q: undefined,
        sku: undefined,
        categoryId: undefined,
      };

  const [{ rows, total, pageSize }, categories, modifierLibrary] = await Promise.all([
    listAdminProducts(locale, filters),
    listAdminCategoryOptions(locale),
    listModifiersForProductAdmin(null),
  ]);
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  function sortHref(sort: 'title' | 'price' | 'created'): string {
    const nextDir = filters.sort === sort && filters.dir === 'asc' ? 'desc' : 'asc';
    const query = buildQuery(filters, {
      sort,
      dir: filters.sort === sort ? nextDir : 'asc',
      page: 1,
    });
    return query ? `/${locale}/admin/products?${query}` : `/${locale}/admin/products`;
  }

  const sortLinks = {
    title: sortHref('title'),
    price: sortHref('price'),
    created: sortHref('created'),
  };
  const shopOrderQuery = buildQuery(filters, { sort: 'shop', dir: 'desc', page: 1 });
  const shopOrderHref = shopOrderQuery
    ? `/${locale}/admin/products?${shopOrderQuery}`
    : `/${locale}/admin/products`;

  return (
    <section>
      <AdminProductsView
        locale={locale}
        products={rows}
        sortLinks={sortLinks}
        shopOrderHref={shopOrderHref}
        sortedByShop={filters.sort === 'shop'}
        categories={categories}
        modifierLibrary={modifierLibrary}
        filters={{
          total,
          q: filters.q,
          categoryId: filters.categoryId,
          status: filters.status,
          sort: filters.sort,
          canReorder: true,
          dir: filters.dir,
        }}
        copy={{
          products: adminCopy.products,
          common: adminCopy.common,
          confirm: adminCopy.confirm,
        }}
      />

      {totalPages > 1 ? (
        <nav className="mt-4 flex items-center gap-3 text-sm text-gray-700">
          {filters.page > 1 ? (
            <Link
              href={`/${locale}/admin/products?${buildQuery(filters, { page: filters.page - 1 })}`}
              className="font-medium hover:underline"
            >
              {adminCopy.common.previous}
            </Link>
          ) : null}
          <span>
            {adminCopy.common.pageOf
              .replace('{page}', String(filters.page))
              .replace('{totalPages}', String(totalPages))}
          </span>
          {filters.page < totalPages ? (
            <Link
              href={`/${locale}/admin/products?${buildQuery(filters, { page: filters.page + 1 })}`}
              className="font-medium hover:underline"
            >
              {adminCopy.common.next}
            </Link>
          ) : null}
        </nav>
      ) : null}
    </section>
  );
}
