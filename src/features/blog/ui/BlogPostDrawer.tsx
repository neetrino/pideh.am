'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState, useTransition } from 'react';
import { Button } from '@/components/ui/Button';
import { DateField } from '@/components/ui/DateField';
import { SelectDropdown } from '@/components/ui/SelectDropdown';
import { SideSheet } from '@/components/ui/SideSheet';
import { AdminLocaleTabs } from '@/features/admin/ui/AdminLocaleTabs';
import { ADMIN_INPUT, ADMIN_LABEL, ADMIN_TEXTAREA } from '@/features/admin/ui/admin-form-classes';
import {
  createBlogPostAction,
  updateBlogPostAction,
} from '@/features/blog/application/manage-blog';
import type { AdminBlogListItem } from '@/features/blog/application/queries';
import {
  normalizeBlogSlug,
  type BlogPostStatus,
  type BlogTranslations,
} from '@/features/blog/domain/blog-rules';
import { locales, type Locale } from '@/lib/i18n/config';
import { getDictionary, type Dictionary } from '@/lib/i18n/get-dictionary';

type LocaleDraft = {
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  slugTouched: boolean;
};

type BlogPostDrawerProps = {
  locale: string;
  open: boolean;
  onClose: () => void;
  post?: AdminBlogListItem | null;
  copy: Dictionary['admin'];
};

function emptyDraft(): LocaleDraft {
  return {
    title: '',
    slug: '',
    excerpt: '',
    content: '',
    slugTouched: false,
  };
}

function draftsFromTranslations(
  translations: BlogTranslations | undefined,
): Record<Locale, LocaleDraft> {
  const next = {
    hy: emptyDraft(),
    en: emptyDraft(),
    ru: emptyDraft(),
  } satisfies Record<Locale, LocaleDraft>;

  for (const loc of locales) {
    const copy = translations?.[loc];
    if (!copy) continue;
    next[loc] = {
      title: copy.title,
      slug: copy.slug,
      excerpt: copy.excerpt ?? '',
      content: copy.content,
      slugTouched: true,
    };
  }

  return next;
}

function sharedBlogSlug(drafts: Record<Locale, LocaleDraft>): string {
  return (
    normalizeBlogSlug(drafts.en.slug) ||
    normalizeBlogSlug(drafts.en.title) ||
    `post-${Date.now().toString(36)}`
  );
}

function readyBlogLocales(
  drafts: Record<Locale, LocaleDraft>,
):
  | { ok: true; items: Array<{ locale: Locale; draft: LocaleDraft; slug: string }> }
  | { ok: false; locale: Locale } {
  const items: Array<{ locale: Locale; draft: LocaleDraft; slug: string }> = [];
  const slug = sharedBlogSlug(drafts);
  for (const loc of locales) {
    const draft = drafts[loc];
    const title = draft.title.trim();
    const content = draft.content.trim();
    if (!title && !content && !draft.excerpt.trim()) continue;
    if (!title || !content) return { ok: false, locale: loc };
    items.push({ locale: loc, draft, slug });
  }
  const first = items[0];
  if (!first) return { ok: false, locale: 'hy' };
  return { ok: true, items };
}

export function BlogPostDrawer({ locale, open, onClose, post = null, copy }: BlogPostDrawerProps) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const isEdit = post != null;
  const [activeLocale, setActiveLocale] = useState<Locale>(() => {
    if (!post) return 'en';
    return (locales.find((loc) => post.translations[loc]?.title) as Locale | undefined) ?? 'en';
  });
  const [drafts, setDrafts] = useState<Record<Locale, LocaleDraft>>(() =>
    draftsFromTranslations(post?.translations),
  );
  const [status, setStatus] = useState<BlogPostStatus>(() => post?.status ?? 'DRAFT');
  const [publishedAt, setPublishedAt] = useState(() => post?.publishedAt ?? '');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(() => post?.coverUrl ?? null);
  const [removeExistingImage, setRemoveExistingImage] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    if (!open) return;

    if (post) {
      setActiveLocale(
        (locales.find((loc) => post.translations[loc]?.title) as Locale | undefined) ?? 'en',
      );
      setDrafts(draftsFromTranslations(post.translations));
      setStatus(post.status);
      setPublishedAt(post.publishedAt ?? '');
      setImageFile(null);
      setImagePreview(post.coverUrl ?? null);
      setRemoveExistingImage(false);
      setError(null);
    } else {
      setActiveLocale('en');
      setDrafts({
        hy: emptyDraft(),
        en: emptyDraft(),
        ru: emptyDraft(),
      });
      setStatus('DRAFT');
      setPublishedAt('');
      setImageFile(null);
      setImagePreview(null);
      setRemoveExistingImage(false);
      setError(null);
    }
  }, [open, post]);

  const draft = drafts[activeLocale];
  const tabCopy = getDictionary(activeLocale).admin;

  function updateDraft(patch: Partial<LocaleDraft>): void {
    setDrafts((current) => ({
      ...current,
      [activeLocale]: { ...current[activeLocale], ...patch },
    }));
  }

  return (
    <SideSheet
      open={open}
      onClose={onClose}
      ariaLabel={isEdit ? copy.blog.drawer.editAria : copy.blog.drawer.addAria}
      variant="admin"
    >
      <div className="shrink-0 border-b-2 border-[#1e1e1e]/10 px-5 py-4 sm:px-6">
        <h2 className="font-display text-2xl leading-[0.95] text-[#1e1e1e] uppercase sm:text-3xl">
          {isEdit ? copy.blog.drawer.editTitle : copy.blog.drawer.addTitle}
        </h2>
      </div>

      <form
        className="flex min-h-0 flex-1 flex-col"
        onSubmit={(event) => {
          event.preventDefault();
          const ready = readyBlogLocales(drafts);
          if (!ready.ok) {
            setActiveLocale(ready.locale);
            setError(copy.blog.drawer.titleAndFullTextRequired);
            return;
          }
          const [primary, ...rest] = ready.items;
          if (!primary) return;

          startTransition(async () => {
            setError(null);
            const payload = {
              editingLocale: primary.locale,
              title: primary.draft.title,
              slug: primary.slug,
              excerpt: primary.draft.excerpt || undefined,
              content: primary.draft.content,
              status,
              publishedAt: publishedAt || null,
              tags: post?.tags.join(', ') ?? '',
              copies: rest.map((item) => ({
                locale: item.locale,
                title: item.draft.title,
                slug: item.slug,
                excerpt: item.draft.excerpt || undefined,
                content: item.draft.content,
              })),
              syncLocales: true,
            };
            const mediaForm = new FormData();
            if (imageFile) {
              mediaForm.set('image', imageFile);
            }
            if (removeExistingImage) {
              mediaForm.set('removeImage', '1');
            }

            const result =
              isEdit && post
                ? await updateBlogPostAction(locale, post.id, payload, mediaForm)
                : await createBlogPostAction(locale, payload, mediaForm);

            if (!result.ok) {
              setError(result.error.message);
              return;
            }

            onClose();
            router.refresh();
          });
        }}
      >
        <div className="flex-1 space-y-6 overflow-y-auto px-5 py-5">
          <AdminLocaleTabs
            label={tabCopy.blog.drawer.translations}
            active={activeLocale}
            onChange={setActiveLocale}
          />

          <label className="block">
            <span className={ADMIN_LABEL}>
              {tabCopy.blog.drawer.title}{' '}
              <span className="text-red-600">{tabCopy.common.requiredMark}</span>
            </span>
            <input
              required
              value={draft.title}
              onChange={(event) => updateDraft({ title: event.target.value })}
              className={ADMIN_INPUT}
              disabled={isPending}
            />
          </label>

          <label className="block">
            <span className={ADMIN_LABEL}>{tabCopy.blog.drawer.shortExcerpt}</span>
            <input
              value={draft.excerpt}
              onChange={(event) => updateDraft({ excerpt: event.target.value })}
              className={ADMIN_INPUT}
              disabled={isPending}
            />
          </label>

          <label className="block">
            <span className={ADMIN_LABEL}>
              {tabCopy.blog.drawer.fullText}{' '}
              <span className="text-red-600">{tabCopy.common.requiredMark}</span>
            </span>
            <textarea
              required
              rows={8}
              value={draft.content}
              onChange={(event) => updateDraft({ content: event.target.value })}
              className={ADMIN_TEXTAREA}
              disabled={isPending}
            />
            <span className="mt-1 block text-xs text-gray-500">
              {tabCopy.blog.drawer.fullTextHint}
            </span>
          </label>

          <div>
            <p className="mb-2 text-xs font-semibold tracking-wide text-gray-500 uppercase">
              {copy.blog.drawer.common}
            </p>
            <div className="space-y-4">
              <label className="block">
                <span className={ADMIN_LABEL}>{copy.blog.drawer.publicationDate}</span>
                <DateField
                  locale={locale}
                  value={publishedAt}
                  onChange={setPublishedAt}
                  placeholder={copy.blog.drawer.publicationDate}
                  disabled={isPending}
                />
                <span className="mt-1 block text-xs text-gray-500">
                  {copy.blog.drawer.publicationDateHint}
                </span>
              </label>
              <div>
                <span className={ADMIN_LABEL}>{copy.blog.drawer.status}</span>
                <SelectDropdown
                  ariaLabel={copy.blog.drawer.statusAria}
                  value={status}
                  options={[
                    { label: copy.blog.drawer.draft, value: 'DRAFT' },
                    { label: copy.blog.drawer.published, value: 'PUBLISHED' },
                    { label: copy.blog.drawer.archived, value: 'ARCHIVED' },
                  ]}
                  disabled={isPending}
                  deferChange={false}
                  className="mt-1"
                  onValueChange={(next) => setStatus(next as BlogPostStatus)}
                />
              </div>
            </div>
          </div>

          <div>
            <span className={ADMIN_LABEL}>{copy.blog.drawer.coverImage}</span>
            <div className="mt-1 flex flex-wrap items-center gap-3">
              <button
                type="button"
                disabled={isPending}
                onClick={() => fileInputRef.current?.click()}
                className="inline-flex items-center rounded-xl border border-dashed border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:border-gray-400 hover:bg-gray-50 disabled:opacity-50"
              >
                {imagePreview ? copy.blog.drawer.changeImage : copy.blog.drawer.uploadImage}
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                className="hidden"
                disabled={isPending}
                onChange={(event) => {
                  const file = event.target.files?.[0] ?? null;
                  event.target.value = '';
                  setImagePreview((current) => {
                    if (current?.startsWith('blob:')) {
                      URL.revokeObjectURL(current);
                    }
                    return file ? URL.createObjectURL(file) : null;
                  });
                  setImageFile(file);
                  setRemoveExistingImage(false);
                }}
              />
              {imagePreview ? (
                <button
                  type="button"
                  disabled={isPending}
                  onClick={() => {
                    setImageFile(null);
                    setImagePreview((current) => {
                      if (current?.startsWith('blob:')) {
                        URL.revokeObjectURL(current);
                      }
                      return null;
                    });
                    if (isEdit && post?.coverUrl) {
                      setRemoveExistingImage(true);
                    }
                  }}
                  className="text-sm font-medium text-gray-600 hover:text-red-600"
                >
                  {copy.blog.drawer.remove}
                </button>
              ) : null}
            </div>
            {imagePreview ? (
              // eslint-disable-next-line @next/next/no-img-element -- local blob/admin preview
              <img
                src={imagePreview}
                alt=""
                className="mt-3 h-28 w-28 rounded-xl border border-gray-200 object-cover"
              />
            ) : null}
            <p className="mt-1 text-xs text-gray-500">{copy.blog.drawer.coverHint}</p>
          </div>

          {error ? <p className="text-sm text-red-700">{error}</p> : null}
        </div>

        <div className="border-t border-gray-200 px-5 py-4">
          <Button type="submit" className="w-full" disabled={isPending}>
            {isPending ? copy.common.saving : copy.common.save}
          </Button>
        </div>
      </form>
    </SideSheet>
  );
}
