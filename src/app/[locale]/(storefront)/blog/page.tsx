import { notFound } from 'next/navigation';

import { listPublishedBlogPosts } from '@/features/blog/application/queries';
import { BlogPostCard } from '@/features/blog/ui/BlogPostCard';
import { isLocale } from '@/lib/i18n/config';
import { getDictionary } from '@/lib/i18n/get-dictionary';

type BlogPageProps = {
  params: Promise<{ locale: string }>;
};

export default async function BlogPage({ params }: BlogPageProps) {
  const { locale: rawLocale } = await params;

  if (!isLocale(rawLocale)) {
    notFound();
  }

  const dictionary = getDictionary(rawLocale);
  const posts = await listPublishedBlogPosts(rawLocale);

  return (
    <section className="flex min-w-0 flex-col gap-6">
      <h1 className="font-display text-[clamp(2rem,6vw,3rem)] leading-[1.05] font-semibold tracking-tight text-[#ff6b00]">
        {dictionary.nav.blog}
      </h1>

      {posts.length === 0 ? (
        <p className="text-[var(--muted)]">{dictionary.blog.empty}</p>
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {posts.map((post) => (
            <BlogPostCard key={post.id} locale={rawLocale} post={post} />
          ))}
        </div>
      )}
    </section>
  );
}
