'use client';

import { useState, useEffect } from 'react';
import { Star, MessageSquare } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { api } from '@/lib/api';
import {
  ReviewFilterBar,
  ReviewListItem,
  ReviewSummaryCards,
  ReviewsEmptyState,
} from './reviews-dashboard-sections';
import {
  parseRestaurantReviewsResponse,
  type RestaurantReview,
} from './reviews-dashboard-types';

export function ReviewsDashboard() {
  const t = useTranslations('reviews');
  const tDashboard = useTranslations('reviews.dashboard');
  const loadErrorMessage = tDashboard('loadError');
  const locale = useLocale();
  const [reviews, setReviews] = useState<RestaurantReview[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [fetchError, setFetchError] = useState('');
  const [replyTexts, setReplyTexts] = useState<Record<string, string>>({});
  const [replyErrors, setReplyErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState<string | null>(null);
  const [ratingFilter, setRatingFilter] = useState<number | null>(null);
  const [commentOnly, setCommentOnly] = useState(false);

  useEffect(() => {
    api.get<{ reviews: RestaurantReview[] }>('/restaurant/reviews')
      .then((data) => setReviews(parseRestaurantReviewsResponse(data)))
      .catch(() => setFetchError(loadErrorMessage))
      .finally(() => setIsLoading(false));
  }, [loadErrorMessage]);

  const totalReviews = reviews.length;
  const avgRating = totalReviews > 0 ? reviews.reduce((sum, review) => sum + review.rating, 0) / totalReviews : 0;
  const fiveStarPct = totalReviews > 0
    ? Math.round((reviews.filter((review) => review.rating === 5).length / totalReviews) * 100)
    : 0;
  const responseRate = totalReviews > 0
    ? Math.round((reviews.filter((review) => review.reply).length / totalReviews) * 100)
    : 0;

  const filtered = reviews.filter((r) => {
    if (ratingFilter !== null && r.rating !== ratingFilter) return false;
    if (commentOnly && !r.comment) return false;
    return true;
  });

  const handleReply = async (reviewId: string) => {
    const text = replyTexts[reviewId];
    const trimmedReply = text?.trim();
    if (!trimmedReply) return;
    setSubmitting(reviewId);
    setReplyErrors((prev) => {
      const next = { ...prev };
      delete next[reviewId];
      return next;
    });
    try {
      await api.post(`/restaurant/reviews/${reviewId}/reply`, { reply: trimmedReply });
      setReviews((prev) => prev.map((r) => (r.id === reviewId ? { ...r, reply: trimmedReply } : r)));
      setReplyTexts((prev) => { const n = { ...prev }; delete n[reviewId]; return n; });
    } catch (err: unknown) {
      const e = err as { message?: string };
      setReplyErrors((prev) => ({ ...prev, [reviewId]: e.message || tDashboard('submitError') }));
    } finally {
      setSubmitting(null);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="h-10 w-48 animate-pulse rounded-lg bg-gray-100" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="kpi-card h-20 animate-pulse bg-gray-100" />
          ))}
        </div>
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="card h-28 animate-pulse bg-gray-50" />
        ))}
      </div>
    );
  }

  if (fetchError) {
    return (
      <div className="card flex flex-col items-center py-12 text-center" role="alert">
        <MessageSquare className="h-10 w-10 text-red-300 mx-auto mb-3" />
        <h1 className="text-base font-semibold text-red-800">{fetchError}</h1>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-100">
          <Star className="h-5 w-5 text-amber-600" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-gray-900">{t('title')}</h1>
          <p className="text-sm text-gray-500">{t('description')}</p>
        </div>
      </div>

      <ReviewSummaryCards
        avgRating={avgRating}
        totalReviews={totalReviews}
        fiveStarPct={fiveStarPct}
        responseRate={responseRate}
      />

      <ReviewFilterBar
        ratingFilter={ratingFilter}
        commentOnly={commentOnly}
        onRatingFilterChange={setRatingFilter}
        onCommentOnlyChange={setCommentOnly}
      />

      <div className="space-y-4">
        {filtered.length === 0 && <ReviewsEmptyState />}
        {filtered.map((review) => (
          <ReviewListItem
            key={review.id}
            review={review}
            locale={locale}
            replyText={replyTexts[review.id] || ''}
            replyError={replyErrors[review.id]}
            isSubmitting={submitting === review.id}
            onReplyTextChange={(value) => setReplyTexts((prev) => ({ ...prev, [review.id]: value }))}
            onReply={() => handleReply(review.id)}
          />
        ))}
      </div>
    </div>
  );
}
