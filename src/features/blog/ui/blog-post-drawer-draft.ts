import type { AdminBlogListItem } from '@/features/blog/application/queries';
import { blogHtmlToPlainText } from '@/features/blog/domain/blog-content';
import { normalizeBlogSlug, type BlogTranslations } from '@/features/blog/domain/blog-rules';
import type { UpsertBlogPostFormInput } from '@/features/blog/schemas/blog';
import { locales, type Locale } from '@/lib/i18n/config';

export type LocaleDraft = {
  title: string;
  excerpt: string;
  content: string;
};

export type LocaleDrafts = Record<Locale, LocaleDraft>;

type ReadyLocale = { locale: Locale; draft: LocaleDraft };

export function draftsFromTranslations(translations: BlogTranslations | undefined): LocaleDrafts {
  const empty = (): LocaleDraft => ({ title: '', excerpt: '', content: '' });
  const next: LocaleDrafts = { hy: empty(), en: empty(), ru: empty() };
  for (const loc of locales) {
    const copy = translations?.[loc];
    if (!copy) continue;
    next[loc] = {
      title: copy.title,
      excerpt: copy.excerpt ?? '',
      content: blogHtmlToPlainText(copy.content),
    };
  }
  return next;
}

export function storedSlug(translations: BlogTranslations | undefined): string {
  return locales.map((loc) => translations?.[loc]?.slug).find(Boolean) ?? '';
}

/** Latin titles only produce a slug; prefer English, then any locale. */
export function slugFromTitles(drafts: LocaleDrafts): string {
  const titles = [drafts.en.title, ...locales.map((loc) => drafts[loc].title)];
  return titles.map(normalizeBlogSlug).find(Boolean) ?? '';
}

export function initialLocale(post: AdminBlogListItem | null): Locale {
  if (!post) return 'hy';
  return locales.find((loc) => post.translations[loc]?.title) ?? 'hy';
}

/** Locales with any filled field must have both title and text. */
export function readyBlogLocales(
  drafts: LocaleDrafts,
): { ok: true; items: ReadyLocale[] } | { ok: false; locale: Locale } {
  const items: ReadyLocale[] = [];
  for (const loc of locales) {
    const draft = drafts[loc];
    const title = draft.title.trim();
    const content = draft.content.trim();
    if (!title && !content && !draft.excerpt.trim()) continue;
    if (!title || !content) return { ok: false, locale: loc };
    items.push({ locale: loc, draft });
  }
  return items.length > 0 ? { ok: true, items } : { ok: false, locale: 'hy' };
}

/** New posts start published; edits keep status and publication date. */
export function buildBlogPayload(
  items: ReadyLocale[],
  slug: string,
  post: AdminBlogListItem | null,
): UpsertBlogPostFormInput | null {
  const [primary, ...rest] = items;
  if (!primary) return null;
  const finalSlug = slug || `post-${Date.now().toString(36)}`;
  const toCopy = ({ draft }: ReadyLocale) => ({
    title: draft.title,
    slug: finalSlug,
    excerpt: draft.excerpt || undefined,
    content: draft.content,
  });
  return {
    editingLocale: primary.locale,
    ...toCopy(primary),
    status: post?.status ?? 'PUBLISHED',
    publishedAt: post?.publishedAt ?? null,
    tags: post?.tags.join(', ') ?? '',
    copies: rest.map((item) => ({ locale: item.locale, ...toCopy(item) })),
    syncLocales: true,
  };
}
