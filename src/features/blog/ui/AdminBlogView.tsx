'use client';

import { useMemo, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Plus } from 'lucide-react';

import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { ADMIN_INPUT } from '@/features/admin/ui/admin-form-classes';
import { AdminPageHeading } from '@/features/admin/ui/AdminPageHeading';
import {
  archiveBlogPostAction,
  deleteBlogPostAction,
  publishBlogPostAction,
} from '@/features/blog/application/manage-blog';
import type { AdminBlogListItem } from '@/features/blog/application/queries';
import { AdminBlogPostRow } from '@/features/blog/ui/AdminBlogPostRow';
import { BlogPostDrawer } from '@/features/blog/ui/BlogPostDrawer';
import type { Dictionary } from '@/lib/i18n/get-dictionary';

type AdminBlogViewProps = {
  locale: string;
  posts: AdminBlogListItem[];
  copy: Dictionary['admin'];
};

export function AdminBlogView({ locale, posts, copy }: AdminBlogViewProps) {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editingPost, setEditingPost] = useState<AdminBlogListItem | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [pendingDelete, setPendingDelete] = useState<{
    id: string;
    title: string;
  } | null>(null);

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return posts;
    return posts.filter((post) => {
      const haystack = `${post.title} ${post.slug} ${post.excerpt}`.toLowerCase();
      return haystack.includes(needle);
    });
  }, [posts, query]);

  function openCreate(): void {
    setEditingPost(null);
    setDrawerOpen(true);
  }

  function openEdit(post: AdminBlogListItem): void {
    setEditingPost(post);
    setDrawerOpen(true);
  }

  function closeDrawer(): void {
    setDrawerOpen(false);
    setEditingPost(null);
  }

  function requestDelete(postId: string, postTitle: string): void {
    setPendingDelete({ id: postId, title: postTitle });
  }

  function toggleActive(post: AdminBlogListItem): void {
    startTransition(async () => {
      setError(null);
      const payload = { postId: post.id };
      const result =
        post.status === 'PUBLISHED'
          ? await archiveBlogPostAction(locale, payload)
          : await publishBlogPostAction(locale, payload);
      if (!result.ok) {
        setError(result.error.message);
        return;
      }
      router.refresh();
    });
  }

  function confirmDelete(): void {
    if (!pendingDelete) return;
    const postId = pendingDelete.id;

    startTransition(async () => {
      setError(null);
      const result = await deleteBlogPostAction(locale, { postId });
      if (!result.ok) {
        setError(result.error.message);
        return;
      }
      setPendingDelete(null);
      router.refresh();
    });
  }

  return (
    <section>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <AdminPageHeading title={copy.blog.title} />
        <Button
          type="button"
          size="sm"
          onClick={openCreate}
          className="inline-flex items-center gap-1.5"
        >
          <Plus className="h-4 w-4" aria-hidden />
          {copy.blog.addPost}
        </Button>
      </div>

      <input
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        placeholder={copy.blog.searchPlaceholder}
        className={`${ADMIN_INPUT} mb-4`}
        aria-label={copy.blog.searchAria}
      />

      {error ? <p className="mb-3 text-sm text-red-700">{error}</p> : null}

      <div className="space-y-3">
        {filtered.length === 0 ? (
          <Card className="rounded-xl p-8">
            <p className="text-center text-sm text-gray-600">
              {posts.length === 0 ? copy.blog.empty : copy.blog.noMatch}
            </p>
          </Card>
        ) : (
          filtered.map((post) => (
            <AdminBlogPostRow
              key={post.id}
              post={post}
              disabled={isPending}
              copy={copy.blog}
              onEdit={() => openEdit(post)}
              onDelete={() => requestDelete(post.id, post.title)}
              onToggleActive={() => toggleActive(post)}
            />
          ))
        )}
      </div>

      {drawerOpen ? (
        <BlogPostDrawer
          key={editingPost?.id ?? 'new'}
          locale={locale}
          open
          onClose={closeDrawer}
          post={editingPost}
          copy={copy}
        />
      ) : null}

      <ConfirmDialog
        open={pendingDelete !== null}
        title={copy.confirm.deleteTitle}
        description={
          pendingDelete
            ? copy.confirm.deleteEntity
                .replace('{entity}', copy.confirm.entityLabels.post)
                .replace('{name}', pendingDelete.title)
            : ''
        }
        confirmLabel={copy.confirm.confirmLabel}
        cancelLabel={copy.confirm.cancelLabel}
        isPending={isPending}
        onClose={() => {
          if (!isPending) setPendingDelete(null);
        }}
        onConfirm={confirmDelete}
      />
    </section>
  );
}
