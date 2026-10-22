import Image from 'next/image';

import { AppLink } from '@/components/ui/AppLink';
import type { StorefrontBlogPostListItem } from '@/features/blog/application/queries';
import { PIDEH_ASSETS } from '@/features/home/ui/brand-assets';
import type { Locale } from '@/lib/i18n/config';

type BlogPostCardProps = {
  locale: Locale;
  post: StorefrontBlogPostListItem;
};

function formatPublishedAt(locale: Locale, iso: string | null): string | null {
  if (!iso) return null;
  return new Intl.DateTimeFormat(locale, { dateStyle: 'medium' }).format(new Date(iso));
}

/** Storefront blog list card: cover image + title, whole card links to the post. */
export function BlogPostCard({ locale, post }: BlogPostCardProps) {
  const publishedLabel = formatPublishedAt(locale, post.publishedAt);

  return (
    <article className="group min-w-0">
      <AppLink
        href={`/${locale}/blog/${post.copy.slug}`}
        prefetchPolicy="auto"
        className="flex h-full flex-col overflow-hidden rounded-[24px] border border-[#1e1e1e]/10 bg-white transition-shadow duration-300 hover:shadow-[0_8px_30px_rgba(0,0,0,0.08)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#ff6b00]"
      >
        <div className="relative aspect-[4/3] w-full overflow-hidden bg-[#fff8e7]">
          {post.coverUrl ? (
            <Image
              src={post.coverUrl}
              alt=""
              fill
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
              className="object-cover transition-transform duration-500 group-hover:scale-105 motion-reduce:transition-none"
            />
          ) : (
            <Image
              src={PIDEH_ASSETS.wordmark}
              alt=""
              fill
              sizes="160px"
              unoptimized
              className="object-contain p-12 opacity-60"
            />
          )}
        </div>
        <div className="flex flex-1 flex-col gap-2 p-5">
          {publishedLabel ? (
            <time dateTime={post.publishedAt ?? undefined} className="text-sm text-[var(--muted)]">
              {publishedLabel}
            </time>
          ) : null}
          <h2 className="line-clamp-2 text-xl font-bold text-[#101828] transition-colors group-hover:text-[#ff6b00]">
            {post.copy.title}
          </h2>
          {post.copy.excerpt ? (
            <p className="line-clamp-3 text-[var(--muted)]">{post.copy.excerpt}</p>
          ) : null}
        </div>
      </AppLink>
    </article>
  );
}
