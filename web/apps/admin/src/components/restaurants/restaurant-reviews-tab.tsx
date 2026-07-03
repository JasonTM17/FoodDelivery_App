'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { useQuery } from '@tanstack/react-query';
import { AlertCircle, MessageSquare, Star } from 'lucide-react';
import { EmptyState } from '@foodflow/ui/empty-state';
import { apiGet } from '@/lib/api';
import { formatDate } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface Review {
  id: string;
  rating: number;
  comment: string;
  userName: string;
  orderCode: string;
  createdAt: string;
  reply?: string;
}

interface ReviewsResponse {
  reviews: Review[];
  averageRating: number;
  totalReviews: number;
  ratingDistribution: { stars: number; count: number }[];
}

const pageSize = 10;

function StarRating({ rating, label }: { rating: number; label: string }) {
  return (
    <div className="flex items-center gap-0.5" role="img" aria-label={label}>
      {Array.from({ length: 5 }).map((_, index) => (
        <Star
          key={index}
          aria-hidden="true"
          className={`h-3.5 w-3.5 ${index < Math.round(rating) ? 'fill-yellow-400 text-yellow-400' : 'text-muted-foreground/30'}`}
        />
      ))}
    </div>
  );
}

export default function RestaurantReviewsTab({ restaurantId }: { restaurantId: string }) {
  const t = useTranslations('restaurantReviewsTab');
  const [page, setPage] = useState(1);
  const query = useQuery<ReviewsResponse>({
    queryKey: ['restaurant-reviews', restaurantId, page],
    queryFn: () =>
      apiGet<ReviewsResponse>(`/admin/restaurants/${restaurantId}/reviews`, {
        params: { page, limit: pageSize },
      }),
  });

  if (query.isLoading) {
    return (
      <div role="status" aria-live="polite" aria-label={t('loading')} className="space-y-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="h-24 animate-pulse rounded-lg bg-muted" />
        ))}
      </div>
    );
  }

  if (query.isError) {
    return (
      <div role="alert">
        <EmptyState
          icon={AlertCircle}
          title={t('loadErrorTitle')}
          description={t('loadErrorDescription')}
          actionLabel={t('retry')}
          onAction={() => void query.refetch()}
        />
      </div>
    );
  }

  if (!query.data) {
    return <EmptyState icon={MessageSquare} title={t('emptyTitle')} description={t('emptyDescription')} />;
  }

  const data = query.data;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t('overviewTitle')}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-6">
            <div className="text-center">
              <div className="text-4xl font-bold">{data.averageRating.toFixed(1)}</div>
              <div className="mt-1 flex justify-center">
                <StarRating
                  rating={data.averageRating}
                  label={t('ratingLabel', { rating: data.averageRating.toFixed(1) })}
                />
              </div>
              <div className="mt-1 text-xs text-muted-foreground">
                {t('totalReviews', { count: data.totalReviews })}
              </div>
            </div>
            <div className="flex-1 space-y-1.5">
              {data.ratingDistribution.map((distribution) => {
                const percentage = data.totalReviews
                  ? Math.min(100, Math.max(0, (distribution.count / data.totalReviews) * 100))
                  : 0;

                return (
                  <div
                    key={distribution.stars}
                    className="flex items-center gap-2 text-sm"
                    aria-label={t('distributionLabel', {
                      stars: distribution.stars,
                      count: distribution.count,
                    })}
                  >
                    <span className="w-8 text-right">{distribution.stars}★</span>
                    <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted" aria-hidden="true">
                      <div className="h-full rounded-full bg-yellow-400" style={{ width: `${percentage}%` }} />
                    </div>
                    <span className="w-8 text-xs text-muted-foreground">{distribution.count}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-3">
        {data.reviews.length === 0 ? (
          <EmptyState icon={MessageSquare} title={t('emptyTitle')} description={t('emptyDescription')} />
        ) : (
          data.reviews.map((review) => (
            <Card key={review.id}>
              <CardContent className="pt-6">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">{review.userName}</span>
                    <StarRating rating={review.rating} label={t('ratingLabel', { rating: review.rating })} />
                  </div>
                  <p className="text-sm text-muted-foreground">{review.comment}</p>
                  <p className="text-xs text-muted-foreground">
                    {t('orderMeta', { orderCode: review.orderCode, date: formatDate(review.createdAt) })}
                  </p>
                  {review.reply && (
                    <div className="mt-2 rounded-md bg-muted/50 p-3">
                      <p className="text-xs font-medium">{t('merchantReply')}</p>
                      <p className="text-sm text-muted-foreground">{review.reply}</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {data.totalReviews > pageSize && (
        <div className="flex items-center justify-center gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={page <= 1}
            onClick={() => setPage((currentPage) => currentPage - 1)}
          >
            {t('previousPage')}
          </Button>
          <span className="text-sm text-muted-foreground">{t('page', { page })}</span>
          <Button
            variant="outline"
            size="sm"
            disabled={page * pageSize >= data.totalReviews}
            onClick={() => setPage((currentPage) => currentPage + 1)}
          >
            {t('nextPage')}
          </Button>
        </div>
      )}
    </div>
  );
}
