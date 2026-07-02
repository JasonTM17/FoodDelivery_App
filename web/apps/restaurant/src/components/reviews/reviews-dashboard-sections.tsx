'use client';

import { Filter, MessageSquare, Send, Star } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { cn } from '@/lib/utils';
import { ReviewStarDisplay } from './review-star-display';
import type { RestaurantReview } from './reviews-dashboard-types';

interface ReviewSummaryCardsProps {
  avgRating: number;
  totalReviews: number;
  fiveStarPct: number;
  responseRate: number;
}

export function ReviewSummaryCards({ avgRating, totalReviews, fiveStarPct, responseRate }: ReviewSummaryCardsProps) {
  const t = useTranslations('reviews.dashboard');

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      <div className="kpi-card">
        <p className="text-xs text-gray-500 mb-1">{t('avgRating')}</p>
        <div className="flex items-end gap-1.5">
          <span className="text-2xl font-bold text-gray-900">{avgRating.toFixed(1)}</span>
          <Star className="h-5 w-5 text-amber-400 fill-amber-400 mb-0.5" />
        </div>
      </div>
      <div className="kpi-card">
        <p className="text-xs text-gray-500 mb-1">{t('totalReviews')}</p>
        <span className="text-2xl font-bold text-gray-900">{totalReviews}</span>
      </div>
      <div className="kpi-card">
        <p className="text-xs text-gray-500 mb-1">{t('fiveStarRate')}</p>
        <span className="text-2xl font-bold text-gray-900">{fiveStarPct}%</span>
      </div>
      <div className="kpi-card">
        <p className="text-xs text-gray-500 mb-1">{t('responseRate')}</p>
        <span className="text-2xl font-bold text-gray-900">{responseRate}%</span>
      </div>
    </div>
  );
}

interface ReviewFilterBarProps {
  ratingFilter: number | null;
  commentOnly: boolean;
  onRatingFilterChange: (rating: number | null) => void;
  onCommentOnlyChange: (enabled: boolean) => void;
}

export function ReviewFilterBar({
  ratingFilter,
  commentOnly,
  onRatingFilterChange,
  onCommentOnlyChange,
}: ReviewFilterBarProps) {
  const t = useTranslations('reviews.dashboard');

  return (
    <div className="card mb-4">
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-1.5">
          <Filter className="h-4 w-4 text-gray-400" />
          <span className="text-sm font-medium text-gray-700">{t('filterLabel')}</span>
        </div>
        <div className="flex gap-1.5">
          <button
            type="button"
            onClick={() => onRatingFilterChange(null)}
            className={cn(
              'px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors',
              ratingFilter === null
                ? 'bg-brand-500 text-white border-brand-500'
                : 'border-gray-300 text-gray-600 hover:bg-gray-50'
            )}
          >
            {t('all')}
          </button>
          {[5, 4, 3, 2, 1].map((star) => (
            <button
              key={star}
              type="button"
              onClick={() => onRatingFilterChange(ratingFilter === star ? null : star)}
              className={cn(
                'flex items-center gap-1 px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors',
                ratingFilter === star
                  ? 'bg-brand-500 text-white border-brand-500'
                  : 'border-gray-300 text-gray-600 hover:bg-gray-50'
              )}
              aria-label={t('starFilterAria', { rating: star })}
            >
              {star}
              <Star className="h-3 w-3 fill-current" />
            </button>
          ))}
        </div>
        <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer ml-auto">
          <input
            type="checkbox"
            checked={commentOnly}
            onChange={(event) => onCommentOnlyChange(event.target.checked)}
            className="rounded border-gray-300"
          />
          {t('commentOnly')}
        </label>
      </div>
    </div>
  );
}

interface ReviewListItemProps {
  review: RestaurantReview;
  locale: string;
  replyText: string;
  replyError?: string;
  isSubmitting: boolean;
  onReplyTextChange: (value: string) => void;
  onReply: () => void;
}

export function ReviewListItem({
  review,
  locale,
  replyText,
  replyError,
  isSubmitting,
  onReplyTextChange,
  onReply,
}: ReviewListItemProps) {
  const t = useTranslations('reviews.dashboard');

  return (
    <div className="card space-y-3">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-full bg-brand-100 flex items-center justify-center text-sm font-semibold text-brand-600 shrink-0">
            {review.customerInitial}
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-900">{review.customerName}</p>
            <div className="flex items-center gap-2 mt-0.5">
              <ReviewStarDisplay rating={review.rating} ariaLabel={t('ratingAria', { rating: review.rating })} />
              <span className="text-xs text-gray-400">{formatReviewDate(review.createdAt, locale)}</span>
            </div>
          </div>
        </div>
        <span className="badge border-gray-200 text-gray-500">{t('orderBadge', { orderId: review.orderId })}</span>
      </div>
      {review.comment && <p className="text-sm text-gray-700">{review.comment}</p>}
      {review.reply ? (
        <div className="rounded-lg bg-brand-50 border border-brand-100 p-3">
          <p className="text-xs font-medium text-brand-600 mb-1">{t('restaurantReply')}</p>
          <p className="text-sm text-gray-700">{review.reply}</p>
        </div>
      ) : (
        <div>
          <div className="flex gap-2">
            <textarea
              rows={2}
              value={replyText}
              onChange={(event) => onReplyTextChange(event.target.value)}
              placeholder={t('replyPlaceholder')}
              className="input-field resize-none flex-1 text-sm"
            />
            <button
              type="button"
              onClick={onReply}
              disabled={!replyText.trim() || isSubmitting}
              className="btn-primary self-end disabled:opacity-50"
              aria-label={t('sendReplyAria')}
            >
              <Send className="h-4 w-4" />
            </button>
          </div>
          {replyError && <p className="mt-2 text-xs font-medium text-red-600">{replyError}</p>}
        </div>
      )}
    </div>
  );
}

export function ReviewsEmptyState() {
  const t = useTranslations('reviews.dashboard');

  return (
    <div className="card text-center py-12">
      <MessageSquare className="h-10 w-10 text-gray-300 mx-auto mb-3" />
      <p className="text-sm text-gray-500">{t('empty')}</p>
    </div>
  );
}

function formatReviewDate(dateString: string, locale: string): string {
  try {
    return new Intl.DateTimeFormat(locale, { dateStyle: 'medium' }).format(new Date(dateString));
  } catch {
    return '';
  }
}
