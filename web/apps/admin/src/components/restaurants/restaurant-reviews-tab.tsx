'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiGet } from '@/lib/api';
import { formatDate } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@foodflow/ui/empty-state';
import { Star, MessageSquare } from 'lucide-react';

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

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          className={`h-3.5 w-3.5 ${i < Math.round(rating) ? 'fill-yellow-400 text-yellow-400' : 'text-muted-foreground/30'}`}
        />
      ))}
    </div>
  );
}

export default function RestaurantReviewsTab({ restaurantId }: { restaurantId: string }) {
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery<ReviewsResponse>({
    queryKey: ['restaurant-reviews', restaurantId, page],
    queryFn: () =>
      apiGet<ReviewsResponse>(`/admin/restaurants/${restaurantId}/reviews`, {
        params: { page, limit: 10 },
      }),
  });

  if (isLoading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-24 animate-pulse rounded-lg bg-muted" />
        ))}
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Tổng quan đánh giá</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-6">
            <div className="text-center">
              <div className="text-4xl font-bold">{data.averageRating.toFixed(1)}</div>
              <div className="mt-1"><StarRating rating={data.averageRating} /></div>
              <div className="mt-1 text-xs text-muted-foreground">{data.totalReviews} đánh giá</div>
            </div>
            <div className="flex-1 space-y-1.5">
              {data.ratingDistribution.map((d) => (
                <div key={d.stars} className="flex items-center gap-2 text-sm">
                  <span className="w-8 text-right">{d.stars}★</span>
                  <div className="flex-1 h-2 overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full rounded-full bg-yellow-400"
                      style={{ width: `${data.totalReviews ? (d.count / data.totalReviews) * 100 : 0}%` }}
                    />
                  </div>
                  <span className="w-8 text-xs text-muted-foreground">{d.count}</span>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-3">
        {data.reviews.length === 0 ? (
          <EmptyState icon={MessageSquare} title="Chưa có đánh giá" description="Nhà hàng chưa nhận được đánh giá nào" />
        ) : (
          data.reviews.map((review) => (
            <Card key={review.id}>
              <CardContent className="pt-6">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">{review.userName}</span>
                      <StarRating rating={review.rating} />
                    </div>
                    <p className="text-sm text-muted-foreground">{review.comment}</p>
                    <p className="text-xs text-muted-foreground">
                      Đơn {review.orderCode} — {formatDate(review.createdAt)}
                    </p>
                    {review.reply && (
                      <div className="mt-2 rounded-md bg-muted/50 p-3">
                        <p className="text-xs font-medium">Phản hồi từ nhà hàng:</p>
                        <p className="text-sm text-muted-foreground">{review.reply}</p>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {data.totalReviews > 10 && (
        <div className="flex items-center justify-center gap-2">
          <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>Trước</Button>
          <span className="text-sm text-muted-foreground">Trang {page}</span>
          <Button variant="outline" size="sm" disabled={page * 10 >= data.totalReviews} onClick={() => setPage((p) => p + 1)}>Sau</Button>
        </div>
      )}
    </div>
  );
}
