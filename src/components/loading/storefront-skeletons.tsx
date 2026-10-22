/** Shared pulse skeletons for storefront route `loading.tsx` boundaries. */
import { PAGE_CONTAINER } from '@/components/layout/page-container';

const pulse = 'animate-pulse';

type SkeletonProps = {
  className?: string;
};

function Block({ className = '' }: SkeletonProps) {
  return <div className={`rounded-md bg-gray-200 ${className}`} />;
}

export function CatalogGridSkeleton() {
  return (
    <div className={`${pulse} space-y-6`} aria-busy="true" aria-live="polite">
      <Block className="h-9 w-48" />
      <div className="grid grid-cols-2 gap-6 lg:grid-cols-3 xl:grid-cols-4">
        <Block className="aspect-[4/3] rounded-lg" />
        <Block className="aspect-[4/3] rounded-lg" />
        <Block className="aspect-[4/3] rounded-lg" />
        <Block className="aspect-[4/3] rounded-lg" />
      </div>
    </div>
  );
}

export function ShopCatalogSkeleton() {
  return (
    <div className={pulse} aria-busy="true" aria-live="polite">
      {/* Mobile menu (Figma 366:464): chips, display heading, 2-column grid. */}
      <div className="storefront-mobile-tree space-y-6 px-6 pt-6 pb-24 md:hidden">
        <div className="flex gap-2.5 overflow-hidden">
          <Block className="h-14 w-40 shrink-0 rounded-[40px] bg-white/70" />
          <Block className="h-14 w-44 shrink-0 rounded-[40px] bg-white/70" />
          <Block className="h-14 w-40 shrink-0 rounded-[40px] bg-white/70" />
        </div>
        <div className="flex items-end justify-between gap-4">
          <Block className="h-10 w-44 rounded-lg bg-white/50" />
          <Block className="h-[52px] w-[68px] shrink-0 rounded-[42px] bg-[#ffd54a]" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Block className="h-[340px] rounded-[26px] bg-white/70" />
          <Block className="h-[340px] rounded-[26px] bg-white/70" />
          <Block className="h-[340px] rounded-[26px] bg-white/70" />
          <Block className="h-[340px] rounded-[26px] bg-white/70" />
        </div>
      </div>

      <div className={`storefront-desktop-tree hidden space-y-8 px-4 pt-8 pb-24 md:block ${PAGE_CONTAINER}`}>
        <Block className="h-4 w-28 rounded-full bg-white/70" />
        <Block className="h-16 w-48 rounded-lg bg-white/70" />
        <div className="flex gap-2.5 overflow-hidden">
          <Block className="h-14 w-36 shrink-0 rounded-[40px] bg-white/70" />
          <Block className="h-14 w-44 shrink-0 rounded-[40px] bg-white/70" />
          <Block className="h-14 w-40 shrink-0 rounded-[40px] bg-white/70" />
          <Block className="h-14 w-44 shrink-0 rounded-[40px] bg-white/70" />
        </div>
        <div className="flex flex-wrap gap-[13px]">
          <Block className="h-[420px] w-full max-w-[325px] rounded-[26px] bg-white/70" />
          <Block className="h-[420px] w-full max-w-[325px] rounded-[26px] bg-white/70" />
          <Block className="h-[420px] w-full max-w-[325px] rounded-[26px] bg-white/70" />
          <Block className="h-[420px] w-full max-w-[325px] rounded-[26px] bg-white/70" />
        </div>
      </div>
    </div>
  );
}

export function ProductDetailSkeleton() {
  return (
    <div className={`${pulse}`} aria-busy="true" aria-live="polite">
      <div className="storefront-mobile-tree relative w-full overflow-hidden md:hidden">
        <Block className="h-[576px] w-full rounded-none bg-white/15" />
        <div className="relative -mt-8 space-y-4 rounded-t-[30px] bg-white px-[22px] pt-7 pb-24">
          <div className="flex items-start justify-between gap-4">
            <Block className="h-12 w-2/3 bg-[#ffd9b3]" />
            <Block className="size-11 shrink-0 rounded-full bg-[#ffd9b3]" />
          </div>
          <Block className="h-20 w-full bg-[#ffd9b3]" />
          <Block className="h-[155px] w-full rounded-[16px] bg-[#ffd9b3]" />
          <div className="flex items-center justify-between gap-3">
            <Block className="h-9 w-28 bg-[#ffd9b3]" />
            <Block className="h-12 w-44 rounded-full bg-[#ffd9b3]" />
          </div>
          <Block className="h-14 w-full rounded-[66px] bg-[#ff6900]/40" />
        </div>
      </div>

      <div className={`storefront-desktop-tree hidden gap-8 pt-6 md:grid md:grid-cols-2 ${PAGE_CONTAINER}`}>
        <Block className="min-h-[280px] w-full rounded-[24px] bg-[#fff3e0] sm:min-h-[380px] lg:min-h-[500px]" />
        <div className="space-y-4 rounded-[30px] bg-[#fff8f0] p-6">
          <Block className="h-12 w-3/4 bg-[#ffd9b3]" />
          <Block className="h-5 w-1/3 bg-[#ffd9b3]" />
          <Block className="h-24 w-full bg-[#ffd9b3]" />
          <Block className="h-12 w-full rounded-full bg-[#ffd9b3]" />
        </div>
      </div>
    </div>
  );
}

export function BlogListSkeleton() {
  return (
    <div className={`${pulse} space-y-6`} aria-busy="true" aria-live="polite">
      <Block className="h-9 w-40" />
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        <Block className="aspect-[4/3] w-full rounded-[24px]" />
        <Block className="aspect-[4/3] w-full rounded-[24px]" />
        <Block className="aspect-[4/3] w-full rounded-[24px]" />
      </div>
    </div>
  );
}

export function BlogPostSkeleton() {
  return (
    <div className={`${pulse} space-y-6`} aria-busy="true" aria-live="polite">
      <Block className="h-4 w-32" />
      <Block className="h-10 w-3/4" />
      <Block className="aspect-[21/9] w-full rounded-lg" />
      <div className="space-y-3">
        <Block className="h-4 w-full" />
        <Block className="h-4 w-full" />
        <Block className="h-4 w-5/6" />
      </div>
    </div>
  );
}

export function CartCheckoutSkeleton() {
  return (
    <div className={`${pulse} flex max-w-2xl flex-col gap-4`} aria-busy="true" aria-live="polite">
      <Block className="h-9 w-40" />
      <Block className="h-20 w-full rounded-lg" />
      <Block className="h-20 w-full rounded-lg" />
      <Block className="h-20 w-full rounded-lg" />
      <Block className="h-12 w-48 rounded-full" />
    </div>
  );
}

export function ProfileContentSkeleton() {
  return (
    <div className={`${pulse} space-y-8`} aria-busy="true" aria-live="polite">
      <div className="space-y-2">
        <Block className="h-8 w-56" />
        <Block className="h-4 w-40" />
      </div>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Block className="h-24 rounded-2xl" />
        <Block className="h-24 rounded-2xl" />
        <Block className="h-24 rounded-2xl" />
        <Block className="h-24 rounded-2xl" />
      </div>
      <Block className="h-64 w-full rounded-2xl" />
    </div>
  );
}

export function GenericPageSkeleton() {
  return (
    <div className={`${pulse} space-y-6`} aria-busy="true" aria-live="polite">
      <Block className="h-9 w-48" />
      <Block className="h-4 w-2/3" />
      <Block className="h-48 w-full rounded-lg" />
    </div>
  );
}

export function AdminPageSkeleton() {
  return (
    <div className={`${pulse} space-y-6`} aria-busy="true" aria-live="polite">
      <div className="flex items-center justify-between gap-4">
        <Block className="h-8 w-48 rounded-full bg-[#ffd54a]/50" />
        <Block className="h-10 w-32 rounded-full bg-[#ff6b00]/40" />
      </div>
      <Block className="h-12 w-full rounded-2xl bg-[#1e1e1e]/10" />
      <Block className="h-72 w-full rounded-[22px] bg-[#1e1e1e]/10" />
    </div>
  );
}
