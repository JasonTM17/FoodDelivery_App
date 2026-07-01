'use client';

import type { Review, RatingDistribution } from '@/lib/types';
import { formatDistanceToNow } from 'date-fns';
import { vi } from 'date-fns/locale';
import { Star, MessageSquareReply } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ReviewCardProps {
  review: Review;
  onReply?: () => void;
}

export function ReviewCard({ review, onReply }: ReviewCardProps) {
  return (
    <div className="card" data-testid="review-card">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-100 text-sm font-semibold text-brand-700 shrink-0">
            {review.customerName.charAt(0).toUpperCase()}
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-900">{review.customerName}</p>
            <div className="flex items-center gap-1 mt-0.5">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star
                  key={star}
                  className={cn(
                    'h-3.5 w-3.5',
                    star <= review.rating ? 'fill-amber-400 text-amber-400' : 'text-gray-300'
                  )}
                />
              ))}
            </div>
          </div>
        </div>
        <span className="text-xs text-gray-400">
          {formatRelativeTime(review.createdAt)}
        </span>
      </div>

      <p className="text-sm text-gray-700 mt-3">{review.comment}</p>

      <p className="text-xs text-gray-400 mt-1">Món: {review.dishName}</p>

      {review.photos.length > 0 && (
        <div className="flex gap-2 mt-3">
          {review.photos.map((photo, i) => (
            <div
              key={photo}
              role="img"
              aria-label={`Ảnh ${i + 1}`}
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
            <span className="text-xs font-medium text-brand-600">Phản hồi từ nhà hàng</span>
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
          Phản hồi
        </button>
      ) : null}
    </div>
  );
}

function formatRelativeTime(dateStr: string): string {
  try {
    return formatDistanceToNow(new Date(dateStr), { addSuffix: true, locale: vi });
  } catch {
    return '';
  }
}
