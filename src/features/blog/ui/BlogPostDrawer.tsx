'use client';

import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';

import { SideSheet } from '@/components/ui/SideSheet';
import { AdminLocaleTabs } from '@/features/admin/ui/AdminLocaleTabs';
import {
  ADMIN_INPUT,
  ADMIN_LABEL,
  ADMIN_PRIMARY_BTN,
  ADMIN_SHEET_BODY,
  ADMIN_SHEET_FOOTER,
  ADMIN_SHEET_HEADER,
  ADMIN_SHEET_TITLE,
  ADMIN_TEXTAREA,
} from '@/features/admin/ui/admin-form-classes';
import {
  createBlogPostAction,
  updateBlogPostAction,
} from '@/features/blog/application/manage-blog';
import type { AdminBlogListItem } from '@/features/blog/application/queries';
import { normalizeBlogSlug } from '@/features/blog/domain/blog-rules';
import {
  buildBlogPayload,
  draftsFromTranslations,
  initialLocale,
  readyBlogLocales,
  slugFromTitles,
  storedSlug,
  type LocaleDraft,
  type LocaleDrafts,
} from '@/features/blog/ui/blog-post-drawer-draft';
import { BlogCoverField } from '@/features/blog/ui/BlogCoverField';
import type { Locale } from '@/lib/i18n/config';
import { getDictionary, type Dictionary } from '@/lib/i18n/get-dictionary';

type BlogPostDrawerProps = {
  locale: string;
  open: boolean;
  onClose: () => void;
  post?: AdminBlogListItem | null;
  copy: Dictionary['admin'];
};

/** Admin side sheet for creating and editing a blog post. */
export function BlogPostDrawer({ locale, open, onClose, post = null, copy }: BlogPostDrawerProps) {
  const router = useRouter();
  const isEdit = post != null;
  const [activeLocale, setActiveLocale] = useState<Locale>(() => initialLocale(post));
  const [drafts, setDrafts] = useState<LocaleDrafts>(() =>
    draftsFromTranslations(post?.translations),
  );
  const [slugInput, setSlugInput] = useState(() => storedSlug(post?.translations));
  const [slugTouched, setSlugTouched] = useState(isEdit);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(() => post?.coverUrl ?? null);
  const [removeExistingImage, setRemoveExistingImage] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const draft = drafts[activeLocale];
  const tabCopy = getDictionary(activeLocale).admin.blog.drawer;
  const slugValue = slugTouched ? slugInput : slugFromTitles(drafts);
  const slug = normalizeBlogSlug(slugValue);

  function updateDraft(patch: Partial<LocaleDraft>): void {
    setDrafts((current) => ({
      ...current,
      [activeLocale]: { ...current[activeLocale], ...patch },
    }));
  }

  function replacePreview(next: string | null): void {
    setImagePreview((current) => {
      if (current?.startsWith('blob:')) URL.revokeObjectURL(current);
      return next;
    });
  }

  function submit(): void {
    const ready = readyBlogLocales(drafts);
    if (!ready.ok) {
      setActiveLocale(ready.locale);
      setError(copy.blog.drawer.titleAndFullTextRequired);
      return;
    }
    const payload = buildBlogPayload(ready.items, slug, post);
    if (!payload) return;

    const mediaForm = new FormData();
    if (imageFile) mediaForm.set('image', imageFile);
    if (removeExistingImage) mediaForm.set('removeImage', '1');

    startTransition(async () => {
      setError(null);
      const result = post
        ? await updateBlogPostAction(locale, post.id, payload, mediaForm)
        : await createBlogPostAction(locale, payload, mediaForm);
      if (!result.ok) {
        setError(result.error.message);
        return;
      }
      onClose();
      router.refresh();
    });
  }

  const submitLabel = isPending
    ? isEdit
      ? copy.common.saving
      : copy.common.creating
    : isEdit
      ? copy.common.save
      : copy.common.create;

  return (
    <SideSheet
      open={open}
      onClose={onClose}
      ariaLabel={isEdit ? copy.blog.drawer.editAria : copy.blog.drawer.addAria}
      variant="admin"
    >
      <div className={ADMIN_SHEET_HEADER}>
        <h2 className={ADMIN_SHEET_TITLE}>
          {isEdit ? copy.blog.drawer.editTitle : copy.blog.drawer.addTitle}
        </h2>
      </div>

      <form
        className="flex min-h-0 flex-1 flex-col"
        onSubmit={(event) => {
          event.preventDefault();
          submit();
        }}
      >
        <div className={ADMIN_SHEET_BODY}>
          <AdminLocaleTabs
            label={tabCopy.translations}
            hideLabel
            active={activeLocale}
            onChange={setActiveLocale}
          />

          <label className="block">
            <span className={ADMIN_LABEL}>
              {tabCopy.title} <span className="text-red-600">*</span>
            </span>
            <input
              value={draft.title}
              onChange={(event) => updateDraft({ title: event.target.value })}
              className={ADMIN_INPUT}
              disabled={isPending}
            />
          </label>

          <label className="block">
            <span className={ADMIN_LABEL}>{tabCopy.shortExcerpt}</span>
            <textarea
              rows={3}
              value={draft.excerpt}
              onChange={(event) => updateDraft({ excerpt: event.target.value })}
              className={ADMIN_TEXTAREA}
              disabled={isPending}
            />
          </label>

          <label className="block">
            <span className={ADMIN_LABEL}>
              {tabCopy.fullText} <span className="text-red-600">*</span>
            </span>
            <textarea
              rows={4}
              value={draft.content}
              onChange={(event) => updateDraft({ content: event.target.value })}
              className={ADMIN_TEXTAREA}
              disabled={isPending}
            />
          </label>

          <label className="block">
            <span className={ADMIN_LABEL}>{tabCopy.slug}</span>
            <input
              value={slugValue}
              onChange={(event) => {
                setSlugTouched(true);
                setSlugInput(event.target.value);
              }}
              className={ADMIN_INPUT}
              disabled={isPending}
            />
            <span className="mt-1 block text-xs text-[#1e1e1e]/55">
              {tabCopy.slugHint.replace('{slug}', slug || '…')}
            </span>
          </label>

          <BlogCoverField
            preview={imagePreview}
            disabled={isPending}
            copy={tabCopy}
            onPick={(file) => {
              replacePreview(URL.createObjectURL(file));
              setImageFile(file);
              setRemoveExistingImage(false);
            }}
            onRemove={() => {
              replacePreview(null);
              setImageFile(null);
              if (post?.coverUrl) setRemoveExistingImage(true);
            }}
          />

          {error ? <p className="text-sm text-red-700">{error}</p> : null}
        </div>

        <div className={`${ADMIN_SHEET_FOOTER} flex items-center gap-4`}>
          <button
            type="submit"
            disabled={isPending}
            className={`${ADMIN_PRIMARY_BTN} disabled:opacity-50`}
          >
            {submitLabel}
          </button>
          <button
            type="button"
            onClick={onClose}
            disabled={isPending}
            className="text-sm font-bold text-[#1e1e1e]/60 transition hover:text-[#1e1e1e]"
          >
            {copy.common.cancel}
          </button>
        </div>
      </form>
    </SideSheet>
  );
}
