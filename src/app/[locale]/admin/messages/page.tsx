import Link from 'next/link';
import { notFound } from 'next/navigation';

import { Button } from '@/components/ui/Button';
import { FormSelect } from '@/components/ui/FormSelect';
import { Card } from '@/components/ui/Card';
import { ADMIN_INPUT, ADMIN_LABEL } from '@/features/admin/ui/admin-form-classes';
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
import { ADMIN_BADGE } from '@/features/admin/ui/status-badge';
import { listAdminContactMessages } from '@/features/contact/application/queries';
import { CONTACT_STATUSES } from '@/features/contact/domain/contact-rules';
import { adminContactFilterSchema } from '@/features/contact/schemas/contact';
import { isLocale } from '@/lib/i18n/config';
import { getDictionary } from '@/lib/i18n/get-dictionary';

type AdminMessagesPageProps = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function firstParam(value: string | string[] | undefined): string | undefined {
  if (Array.isArray(value)) {
    return value[0];
  }
  return value;
}

function contactStatusBadgeClass(status: string): string {
  const normalized = status.toUpperCase();
  if (normalized === 'UNREAD') return 'bg-blue-100 text-blue-800';
  if (normalized === 'READ') return 'bg-yellow-100 text-yellow-800';
  if (normalized === 'REPLIED') return 'bg-green-100 text-green-800';
  if (normalized === 'ARCHIVED') return 'bg-gray-100 text-gray-800';
  return 'bg-gray-100 text-gray-800';
}

export default async function AdminMessagesPage({ params, searchParams }: AdminMessagesPageProps) {
  const { locale } = await params;
  if (!isLocale(locale)) {
    notFound();
  }

  const dictionary = getDictionary(locale);
  const t = dictionary.admin.messages;

  const raw = await searchParams;
  const parsed = adminContactFilterSchema.safeParse({
    status: firstParam(raw.status) || undefined,
    q: firstParam(raw.q) || undefined,
    page: firstParam(raw.page) ?? '1',
  });

  const filters = parsed.success
    ? parsed.data
    : { page: 1 as const, status: undefined, q: undefined };

  const { rows, total, pageSize } = await listAdminContactMessages(filters);
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  const countLabel = filters.status
    ? t.countWithStatus
        .replace('{total}', String(total))
        .replace('{plural}', total === 1 ? '' : 's')
        .replace('{status}', filters.status)
    : total === 1
      ? t.count.replace('{total}', String(total))
      : t.countPlural.replace('{total}', String(total));

  return (
    <section>
      <AdminPageHeading className="mb-6" title={t.title} description={countLabel} />

      <Card className="mb-6 p-4">
        <form method="get" className="flex flex-wrap items-end gap-3">
          <label className="min-w-0 w-full flex-1 sm:min-w-[180px]">
            <span className={ADMIN_LABEL}>{t.search}</span>
            <input
              name="q"
              defaultValue={filters.q ?? ''}
              placeholder={t.searchPlaceholder}
              className={ADMIN_INPUT}
            />
          </label>
          <label className="min-w-0 w-full sm:w-auto sm:min-w-[140px]">
            <span className={ADMIN_LABEL}>{t.status}</span>
            <FormSelect
              name="status"
              ariaLabel={t.status}
              allLabel={t.all}
              defaultValue={filters.status ?? ''}
              options={CONTACT_STATUSES.map((status) => ({ value: status, label: status }))}
            />
          </label>
          <Button type="submit" className="h-11 shrink-0 rounded-2xl px-5 text-sm">
            {t.filter}
          </Button>
        </form>
      </Card>

      <Card className={ADMIN_TABLE_CARD}>
        {rows.length === 0 ? (
          <p className={`${ADMIN_TABLE_STATE_INSET} text-sm text-gray-600`}>{t.empty}</p>
        ) : (
          <div className={ADMIN_TABLE_OUTER_SCROLL}>
            <table className={ADMIN_TABLE}>
              <thead className={ADMIN_TABLE_THEAD}>
                <tr>
                  <th className={ADMIN_TABLE_TH}>{t.table.subject}</th>
                  <th className={ADMIN_TABLE_TH}>{t.table.from}</th>
                  <th className={ADMIN_TABLE_TH_CENTER}>{t.table.status}</th>
                  <th className={ADMIN_TABLE_TH}>{t.table.received}</th>
                </tr>
              </thead>
              <tbody className={ADMIN_TABLE_TBODY}>
                {rows.map((message) => (
                  <tr key={message.id} className={ADMIN_TABLE_ROW}>
                    <td className={ADMIN_TABLE_TD}>
                      <Link
                        href={`/${locale}/admin/messages/${message.id}`}
                        className="font-medium text-gray-900 hover:underline"
                      >
                        {message.subject}
                      </Link>
                    </td>
                    <td className={ADMIN_TABLE_TD}>
                      <p className="text-sm text-gray-900">{message.name}</p>
                      <p className="text-xs text-gray-500">{message.email}</p>
                    </td>
                    <td className={ADMIN_TABLE_TD_CENTER}>
                      <span className={`${ADMIN_BADGE} ${contactStatusBadgeClass(message.status)}`}>
                        {message.status}
                      </span>
                      {message.spamScore !== null ? (
                        <p className="mt-1 text-xs text-gray-500">
                          {t.table.spamScore.replace('{score}', String(message.spamScore))}
                        </p>
                      ) : null}
                    </td>
                    <td className={ADMIN_TABLE_TD}>
                      <span className="text-xs text-gray-500">
                        {message.createdAt.toISOString().slice(0, 16).replace('T', ' ')}{' '}
                        {dictionary.admin.common.utc}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {totalPages > 1 ? (
        <nav className="mt-4 flex items-center gap-3 text-sm text-gray-700">
          <span>
            {dictionary.admin.common.pageOf
              .replace('{page}', String(filters.page))
              .replace('{totalPages}', String(totalPages))}
          </span>
        </nav>
      ) : null}
    </section>
  );
}
