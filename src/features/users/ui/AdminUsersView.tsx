'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';

import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { ADMIN_INPUT } from '@/features/admin/ui/admin-form-classes';
import { AdminPageHeading } from '@/features/admin/ui/AdminPageHeading';
import { ADMIN_BADGE } from '@/features/admin/ui/status-badge';
import {
  ADMIN_TABLE,
  ADMIN_TABLE_CARD,
  ADMIN_TABLE_CHECKBOX,
  ADMIN_TABLE_OUTER_SCROLL,
  ADMIN_TABLE_ROW,
  ADMIN_TABLE_STATE_INSET,
  ADMIN_TABLE_TBODY,
  ADMIN_TABLE_TD,
  ADMIN_TABLE_TD_CENTER,
  ADMIN_TABLE_TD_CHECK,
  ADMIN_TABLE_TH,
  ADMIN_TABLE_TH_CENTER,
  ADMIN_TABLE_TH_CHECK,
  ADMIN_TABLE_THEAD,
} from '@/features/admin/ui/admin-table-classes';
import { getAdminUserDetailAction } from '@/features/users/application/get-admin-user-detail';
import type { AdminUserDrawerDetail } from '@/features/users/application/get-admin-user-detail';
import {
  bulkAnonymizeUsersAction,
  updateUserStatusAction,
} from '@/features/users/application/update-user';
import type { AdminUserListItem } from '@/features/users/application/queries';
import { AdminUserDetailsDrawer } from '@/features/users/ui/AdminUserDetailsDrawer';
import type { Dictionary } from '@/lib/i18n/get-dictionary';

type AdminUsersViewProps = {
  locale: string;
  users: AdminUserListItem[];
  total: number;
  q?: string;
  role?: string;
  copy: Dictionary['admin'];
};

function roleFilterHref(locale: string, role: string | undefined, q?: string): string {
  const params = new URLSearchParams();
  if (q) params.set('q', q);
  if (role) params.set('role', role);
  const query = params.toString();
  return query ? `/${locale}/admin/users?${query}` : `/${locale}/admin/users`;
}

function formatCreated(value: Date | string): string {
  const date = new Date(value);
  return `${date.getMonth() + 1}/${date.getDate()}/${date.getFullYear()}`;
}

function displayName(user: AdminUserListItem): string {
  const name = `${user.firstName} ${user.lastName}`.trim();
  return name || user.email;
}

export function AdminUsersView({ locale, users, total, q, role, copy }: AdminUsersViewProps) {
  const router = useRouter();
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerDetail, setDrawerDetail] = useState<AdminUserDrawerDetail | null>(null);
  const [drawerError, setDrawerError] = useState<string | null>(null);
  const [drawerPending, startDrawerTransition] = useTransition();

  const allIds = users.map((user) => user.id);
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

  function openUser(userId: string): void {
    setDrawerOpen(true);
    setDrawerDetail(null);
    setDrawerError(null);

    startDrawerTransition(async () => {
      const result = await getAdminUserDetailAction(locale, userId);
      if (!result.ok) {
        setDrawerError(result.error.message);
        setDrawerDetail(null);
        return;
      }
      setDrawerDetail(result.value);
    });
  }

  function closeDrawer(): void {
    setDrawerOpen(false);
    setDrawerDetail(null);
    setDrawerError(null);
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

  function confirmDeleteSelected(): void {
    const userIds = [...selected];
    startTransition(async () => {
      setError(null);
      try {
        const result = await bulkAnonymizeUsersAction(locale, { userIds });
        if (!result.ok) throw new Error(result.error.message);
        setSelected(new Set());
        setConfirmOpen(false);
        router.refresh();
      } catch (caught) {
        setError(caught instanceof Error ? caught.message : copy.common.actionFailed);
      }
    });
  }

  const rolePills = [
    { label: copy.users.roleAll, value: undefined },
    { label: copy.users.roleAdmins, value: 'ADMIN' },
    { label: copy.users.roleCustomers, value: 'CUSTOMER' },
  ] as const;

  return (
    <section>
      <AdminPageHeading className="mb-4" title={copy.users.breadcrumb} />
      <form method="get" className="mb-4 flex flex-wrap gap-3">
        <input
          name="q"
          defaultValue={q ?? ''}
          placeholder={copy.users.searchPlaceholder}
          className={`${ADMIN_INPUT} min-w-0 w-full flex-1`}
          aria-label={copy.users.searchAria}
        />
        {role ? <input type="hidden" name="role" value={role} /> : null}
        <Button type="submit" size="sm">
          {copy.users.search}
        </Button>
      </form>

      <div className="mb-4">
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">
          {copy.users.roleFilterLabel}
        </p>
        <div className="flex flex-wrap gap-2">
          {rolePills.map((pill) => {
            const active = (role ?? undefined) === pill.value;
            return (
              <Link
                key={pill.label}
                href={roleFilterHref(locale, pill.value, q)}
                className={`rounded-full px-3 py-1.5 text-sm font-medium transition-colors ${
                  active
                    ? 'bg-gray-200 text-gray-900'
                    : 'bg-white text-gray-600 ring-1 ring-gray-300 hover:bg-gray-50'
                }`}
              >
                {pill.label}
              </Link>
            );
          })}
        </div>
      </div>

      <p className="mb-3 text-sm text-gray-600">
        {copy.users.totalUsers.replace('{total}', String(total))}
      </p>

      {error ? <p className="mb-3 text-sm text-red-700">{error}</p> : null}

      {selected.size > 0 ? (
        <Card className="mb-4 flex flex-wrap items-center justify-between gap-3 p-4">
          <p className="text-sm text-gray-700">
            {copy.common.selectedCount
              .replace('{count}', String(selected.size))
              .replace(
                '{entity}',
                selected.size === 1
                  ? copy.common.entitySingular.user
                  : copy.common.entitySingular.users,
              )}
          </p>
          <Button
            type="button"
            size="sm"
            variant="danger"
            disabled={isPending}
            onClick={() => setConfirmOpen(true)}
          >
            {copy.users.deleteSelected}
          </Button>
        </Card>
      ) : null}

      <Card className={ADMIN_TABLE_CARD}>
        {users.length === 0 ? (
          <p className={`${ADMIN_TABLE_STATE_INSET} text-sm text-gray-600`}>{copy.users.empty}</p>
        ) : (
          <div className={ADMIN_TABLE_OUTER_SCROLL}>
            <table className={ADMIN_TABLE}>
              <thead className={ADMIN_TABLE_THEAD}>
                <tr>
                  <th className={ADMIN_TABLE_TH_CHECK}>
                    <input
                      type="checkbox"
                      className={ADMIN_TABLE_CHECKBOX}
                      checked={allSelected}
                      onChange={toggleAll}
                      disabled={isPending || users.length === 0}
                      aria-label={copy.users.selectAllAria}
                    />
                  </th>
                  <th className={ADMIN_TABLE_TH}>{copy.users.table.user}</th>
                  <th className={ADMIN_TABLE_TH}>{copy.users.table.contact}</th>
                  <th className={ADMIN_TABLE_TH_CENTER}>{copy.users.table.orders}</th>
                  <th className={ADMIN_TABLE_TH_CENTER}>{copy.users.table.roles}</th>
                  <th className={ADMIN_TABLE_TH_CENTER}>{copy.users.table.status}</th>
                  <th className={ADMIN_TABLE_TH_CENTER}>{copy.users.table.created}</th>
                </tr>
              </thead>
              <tbody className={ADMIN_TABLE_TBODY}>
                {users.map((user) => {
                  const isActive = user.status === 'ACTIVE';
                  const canToggle = user.status === 'ACTIVE' || user.status === 'SUSPENDED';
                  const name = displayName(user);

                  return (
                    <tr
                      key={user.id}
                      className={`${ADMIN_TABLE_ROW} cursor-pointer`}
                      onClick={() => openUser(user.id)}
                      onKeyDown={(event) => {
                        if (event.key === 'Enter' || event.key === ' ') {
                          event.preventDefault();
                          openUser(user.id);
                        }
                      }}
                      tabIndex={0}
                      role="link"
                      aria-label={name}
                    >
                      <td
                        className={ADMIN_TABLE_TD_CHECK}
                        onClick={(event) => event.stopPropagation()}
                      >
                        <input
                          type="checkbox"
                          className={ADMIN_TABLE_CHECKBOX}
                          checked={selected.has(user.id)}
                          onChange={() => toggleOne(user.id)}
                          disabled={isPending || user.status === 'ANONYMIZED'}
                          aria-label={copy.users.selectOneAria.replace('{name}', name)}
                        />
                      </td>
                      <td className={ADMIN_TABLE_TD}>
                        <p className="font-medium text-gray-900">{name}</p>
                        <p className="truncate text-xs text-gray-400">{user.id}</p>
                      </td>
                      <td className={ADMIN_TABLE_TD}>
                        <p className="text-sm text-gray-600">{user.email}</p>
                        <p className="text-sm text-gray-500">{user.phone ?? copy.common.none}</p>
                      </td>
                      <td className={ADMIN_TABLE_TD_CENTER}>
                        <span className="font-medium text-gray-900">{user.orderCount}</span>
                      </td>
                      <td className={ADMIN_TABLE_TD_CENTER}>
                        <span
                          className={`${ADMIN_BADGE} ${
                            user.role === 'ADMIN'
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-sky-100 text-sky-800'
                          }`}
                        >
                          {user.role.toLowerCase()}
                        </span>
                      </td>
                      <td
                        className={ADMIN_TABLE_TD_CENTER}
                        onClick={(event) => event.stopPropagation()}
                      >
                        <button
                          type="button"
                          role="switch"
                          aria-checked={isActive}
                          disabled={isPending || !canToggle}
                          onClick={() =>
                            runAction(async () => {
                              const result = await updateUserStatusAction(locale, {
                                userId: user.id,
                                status: isActive ? 'SUSPENDED' : 'ACTIVE',
                              });
                              if (!result.ok) {
                                throw new Error(result.error.message);
                              }
                            })
                          }
                          className={`relative mx-auto block h-5 w-9 rounded-full transition-colors disabled:opacity-40 ${
                            isActive ? 'bg-green-500' : 'bg-gray-300'
                          }`}
                          aria-label={
                            isActive
                              ? copy.users.suspendAria.replace('{name}', name)
                              : copy.users.activateAria.replace('{name}', name)
                          }
                        >
                          <span
                            className={`absolute top-0.5 left-0.5 h-4 w-4 rounded-full bg-white transition-transform ${
                              isActive ? 'translate-x-4' : 'translate-x-0'
                            }`}
                          />
                        </button>
                      </td>
                      <td className={ADMIN_TABLE_TD_CENTER}>
                        <span className="text-sm text-gray-600">
                          {formatCreated(user.createdAt)}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <ConfirmDialog
        open={confirmOpen}
        title={copy.confirm.deleteTitle}
        description={copy.confirm.deleteSelectedUsers
          .replace('{count}', String(selected.size))
          .replace('{plural}', selected.size === 1 ? '' : 's')}
        confirmLabel={copy.confirm.confirmLabel}
        cancelLabel={copy.confirm.cancelLabel}
        isPending={isPending}
        onClose={() => {
          if (!isPending) setConfirmOpen(false);
        }}
        onConfirm={confirmDeleteSelected}
      />

      <AdminUserDetailsDrawer
        open={drawerOpen}
        onClose={closeDrawer}
        locale={locale}
        detail={drawerDetail}
        error={drawerError}
        isLoading={drawerPending}
        copy={copy}
      />
    </section>
  );
}
