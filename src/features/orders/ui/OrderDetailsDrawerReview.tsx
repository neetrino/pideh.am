'use client';

import { useState, useTransition } from 'react';

import type { AdminOrderDetailView } from '@/features/orders/application/order-detail-view';
import { submitOrderReviewAction } from '@/features/orders/application/submit-order-review';
import { RatingStars } from '@/features/products/ui/ProductReviewRating';
import { StarRatingInput } from '@/features/reviews/ui/StarRatingInput';
import type { Locale } from '@/lib/i18n/config';
import type { Dictionary } from '@/lib/i18n/get-dictionary';

type OrderDetailsDrawerReviewProps = {
  detail: AdminOrderDetailView;
  copy: Dictionary['admin']['orders']['drawer'];
  /** Required to submit a new review from the customer drawer. */
  locale?: Locale;
  onReviewSubmitted?: (detail: AdminOrderDetailView) => void;
};

export function OrderDetailsDrawerReview({
  detail,
  copy,
  locale,
  onReviewSubmitted,
}: OrderDetailsDrawerReviewProps) {
  const existing = detail.customerReview;
  const [rating, setRating] = useState(0);
  const [commentDraft, setCommentDraft] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  if (existing) {
    return (
      <section className="rounded-[22px] border border-[#1e1e1e]/10 bg-white px-4 py-4">
        <RatingStars average={existing.rating} />
        <p className="mt-3 text-sm leading-snug text-[#6b7280]">{copy.reviewThanks}</p>
      </section>
    );
  }

  if (!detail.canSubmitReview || !locale) {
    return null;
  }

  const ready = rating >= 1;

  return (
    <section className="rounded-[22px] border border-[#1e1e1e]/10 px-4 py-4">
      <h3 className="font-display mb-3 text-lg !leading-none text-[#1e1e1e] uppercase">
        {copy.reviewTitle}
      </h3>
      <form
        className="flex flex-col gap-3"
        onSubmit={(event) => {
          event.preventDefault();
          if (!ready) {
            return;
          }
          setError(null);
          startTransition(async () => {
            const result = await submitOrderReviewAction(locale, {
              orderNumber: detail.orderNumber,
              rating,
              comment: commentDraft.trim() || undefined,
            });
            if (!result.ok) {
              setError(result.error.message);
              return;
            }
            onReviewSubmitted?.({
              ...detail,
              canSubmitReview: false,
              customerReview: {
                rating,
                comment: commentDraft.trim() || null,
                reviewedAt: new Date().toISOString(),
              },
            });
          });
        }}
      >
        <StarRatingInput
          value={rating}
          onChange={setRating}
          label={copy.reviewRating}
          hideLabel
          disabled={pending}
        />
        <label className="sr-only" htmlFor="order-review-comment">
          {copy.reviewComment}
        </label>
        <textarea
          id="order-review-comment"
          rows={4}
          maxLength={2000}
          disabled={pending}
          value={commentDraft}
          onChange={(event) => setCommentDraft(event.target.value)}
          placeholder={copy.reviewPlaceholder}
          className="min-h-[5.5rem] w-full resize-y rounded-[22px] border border-[#1e1e1e]/15 bg-white px-4 py-3 text-sm text-[#1e1e1e] outline-none placeholder:text-[#1e1e1e]/35 focus:border-[#ff6b00]/40 disabled:opacity-60"
        />
        {error ? <p className="text-sm text-red-700">{error}</p> : null}
        <button
          type="submit"
          disabled={pending || !ready}
          className="flex h-12 w-full items-center justify-center rounded-[42px] bg-[#ff6b00] px-6 text-white transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <span className="font-display text-xl !leading-none uppercase">
            {pending ? copy.reviewSubmitting : copy.reviewSubmit}
          </span>
        </button>
      </form>
    </section>
  );
}
