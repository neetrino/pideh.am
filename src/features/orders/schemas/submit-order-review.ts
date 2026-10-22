import { z } from 'zod';

import {
  REVIEW_COMMENT_MAX_LENGTH,
  REVIEW_RATING_MAX,
  REVIEW_RATING_MIN,
} from '@/features/reviews/domain/review-rules';

export const submitOrderReviewSchema = z.object({
  orderNumber: z.string().trim().min(1).max(64),
  rating: z.number().int().min(REVIEW_RATING_MIN).max(REVIEW_RATING_MAX),
  comment: z.string().trim().max(REVIEW_COMMENT_MAX_LENGTH).optional(),
});

export type SubmitOrderReviewInput = z.infer<typeof submitOrderReviewSchema>;
