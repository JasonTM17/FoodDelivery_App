'use client';

import type { Review } from '@/lib/types';
import { MessageSquareReply } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { formatTimeAgo } from '@/lib/utils';
import { ReviewStarDisplay } from './review-star-display';

interface ReviewCardProps {
  review: Review;
  onReply?: () => void;
}

export function ReviewCard({ review, onReply }: ReviewCardProps) {
  const locale = useLocale();
  const t = useTranslations('reviews.card');

  return (
    <div className="card" data-testid="review-card">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-100 text-sm font-semibold text-brand-700 shrink-0">
            {review.customerName.charAt(0).toUpperCase()}
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-900">{review.customerName}</p>
            <ReviewStarDisplay
              rating={review.rating}
              ariaLabel={t('ratingAria', { rating: review.rating })}
              className="mt-0.5"
            />
          </div>
        </div>
        <span className="text-xs text-gray-400">
          {formatTimeAgo(review.createdAt, locale, t('unknownTime'))}
        </span>
      </div>

      <p className="text-sm text-gray-700 mt-3">{review.comment}</p>

      <p className="text-xs text-gray-400 mt-1">{t('dishLabel', { dishName: review.dishName })}</p>

      {review.photos.length > 0 && (
        <div className="flex gap-2 mt-3">
          {review.photos.map((photo, i) => (
            <div
              key={photo}
              role="img"
              aria-label={t('photoAria', { index: i + 1 })}
              className="h-16 w-16 rounded-lg bg-gray-100 bg-cover bg-center"
              style={{ backgroundImage: `url(${JSON.stringify(photo)})` }}
            />
          ))}
        </div>
      )}

      {review.reply ? (
        <div className="mt-3 p-3 rounded-lg bg-gray-50 border border-gray-100">
          <div className="flex items-center gap-2 mb-1">
            <MessageSquareReply className="h-3.5 w-3.5 text-brand-600" />
            <span className="text-xs font-medium text-brand-600">{t('restaurantReply')}</span>
          </div>
          <p className="text-sm text-gray-700">{review.reply}</p>
        </div>
      ) : onReply ? (
        <button
          type="button"
          onClick={onReply}
          className="mt-3 btn-ghost text-xs text-brand-600"
        >
          <MessageSquareReply className="h-3.5 w-3.5 mr-1" />
          {t('reply')}
        </button>
      ) : null}
    </div>
  );
}
