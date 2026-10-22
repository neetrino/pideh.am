'use client';

import { Pencil, Trash2 } from 'lucide-react';

import { Card } from '@/components/ui/Card';
import { ADMIN_BADGE } from '@/features/admin/ui/status-badge';
import type { AdminBlogListItem } from '@/features/blog/application/queries';
import type { BlogPostStatus } from '@/features/blog/domain/blog-rules';
import type { Dictionary } from '@/lib/i18n/get-dictionary';

type AdminBlogPostRowProps = {
  post: AdminBlogListItem;
  disabled: boolean;
  copy: Dictionary['admin']['blog'];
  onEdit: () => void;
  onDelete: () => void;
  onToggleActive: () => void;
};

const STATUS_BADGE_CLASS: Record<BlogPostStatus, string> = {
  PUBLISHED: 'bg-green-100 text-green-800',
  DRAFT: 'bg-yellow-100 text-yellow-800',
  ARCHIVED: 'bg-gray-100 text-gray-800',
};

function statusLabel(status: BlogPostStatus, copy: Dictionary['admin']['blog']): string {
  if (status === 'PUBLISHED') return copy.statusPublished;
  if (status === 'DRAFT') return copy.statusDraft;
  return copy.statusArchived;
}

/** One admin blog list card with edit, delete and publish/archive switch. */
export function AdminBlogPostRow({
  post,
  disabled,
  copy,
  onEdit,
  onDelete,
  onToggleActive,
}: AdminBlogPostRowProps) {
  const isActive = post.status === 'PUBLISHED';

  return (
    <Card className="rounded-xl border border-gray-200 p-4 shadow-sm">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 items-start gap-3">
          <div className="h-16 w-16 shrink-0 overflow-hidden rounded-lg bg-gray-100">
            {post.coverUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={post.coverUrl} alt="" className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-slate-700 to-slate-900 text-xs font-medium text-white/70">
                {copy.coverFallback}
              </div>
            )}
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-gray-900">{post.title}</p>
            {post.excerpt ? (
              <p className="mt-0.5 line-clamp-1 text-sm text-gray-600">{post.excerpt}</p>
            ) : null}
            <p className="mt-1 text-xs text-gray-500">
              {post.path}
              {post.publishedAt ? ` · ${post.publishedAt}` : ''}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-1 sm:justify-end">
          <span className={`${ADMIN_BADGE} ${STATUS_BADGE_CLASS[post.status]}`}>
            {statusLabel(post.status, copy)}
          </span>
          <button
            type="button"
            disabled={disabled}
            onClick={onEdit}
            className="rounded p-1.5 text-gray-500 hover:bg-gray-100 hover:text-gray-900 disabled:opacity-50"
            aria-label={copy.editAria.replace('{title}', post.title)}
          >
            <Pencil className="h-4 w-4" />
          </button>
          <button
            type="button"
            disabled={disabled}
            onClick={onDelete}
            className="rounded p-1.5 text-red-600 hover:bg-red-50 disabled:opacity-50"
            aria-label={copy.deleteAria.replace('{title}', post.title)}
          >
            <Trash2 className="h-4 w-4" />
          </button>
          <button
            type="button"
            role="switch"
            aria-checked={isActive}
            disabled={disabled}
            onClick={onToggleActive}
            className={`relative ml-1 h-5 w-9 rounded-full transition-colors disabled:opacity-50 ${
              isActive ? 'bg-green-500' : 'bg-gray-300'
            }`}
            aria-label={(isActive ? copy.deactivateAria : copy.activateAria).replace(
              '{title}',
              post.title,
            )}
          >
            <span
              className={`absolute top-0.5 left-0.5 h-4 w-4 rounded-full bg-white transition-transform ${
                isActive ? 'translate-x-4' : 'translate-x-0'
              }`}
            />
          </button>
        </div>
      </div>
    </Card>
  );
}
