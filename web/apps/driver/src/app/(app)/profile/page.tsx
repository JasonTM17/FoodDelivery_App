'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button, Card } from '@foodflow/ui';
import { LogOut, Star } from 'lucide-react';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth-provider';
import { formatDateTime } from '@/lib/format';
import { useLanguage } from '@/lib/language-context';
import type { DriverRatings } from '@/lib/types';
import { LoadingBlock } from '@/components/feedback';

export default function ProfilePage() {
  const router = useRouter();
  const { user, isAuthenticated, isAuthChecked, logout } = useAuth();
  const { locale } = useLanguage();
  const [ratings, setRatings] = useState<DriverRatings | null>(null);
  const [ratingsUnavailable, setRatingsUnavailable] = useState(false);

  useEffect(() => {
    if (!isAuthChecked) return;
    if (!isAuthenticated) {
      router.replace('/login?next=/profile');
      return;
    }
    api
      .get<DriverRatings>('/driver/ratings')
      .then(setRatings)
      .catch(() => setRatingsUnavailable(true));
  }, [isAuthChecked, isAuthenticated, router]);

  if (!isAuthChecked) return <LoadingBlock label="Loading profile" />;
  if (!isAuthenticated) return null;

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold text-gray-900">{locale === "vi" ? "Tài khoản tài xế" : "Account"}</h1>

      <Card className="p-4">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-200 text-lg font-bold text-slate-700">
            {user?.fullName?.slice(0, 1) ?? 'D'}
          </div>
          <div className="min-w-0">
            <p className="truncate font-semibold text-gray-900">{user?.fullName}</p>
            <p className="truncate text-sm text-muted-foreground">{user?.email}</p>
            {user?.phone && (
              <p className="truncate text-sm text-muted-foreground">{user.phone}</p>
            )}
          </div>
        </div>
      </Card>

      <Card className="p-4">
        <h2 className="mb-2 font-semibold text-gray-900">{locale === "vi" ? "Đánh giá chất lượng" : "Ratings"}</h2>
        {ratingsUnavailable ? (
          <p className="text-sm text-muted-foreground">Ratings are not available yet.</p>
        ) : ratings ? (
          <>
            <div className="flex items-center gap-2">
              <Star className="h-5 w-5 fill-amber-400 text-amber-400" aria-hidden />
              <span className="text-2xl font-bold text-gray-900">
                {Number(ratings.stats?.average ?? 0).toFixed(1)}
              </span>
              <span className="text-sm text-muted-foreground">
                ({ratings.stats?.totalReviews ?? 0} reviews)
              </span>
            </div>
            {(ratings.reviews ?? []).length > 0 && (
              <ul className="mt-3 space-y-2 border-t pt-3">
                {(ratings.reviews ?? []).slice(0, 5).map((review) => (
                  <li key={review.id} className="text-sm">
                    <div className="flex items-center gap-2">
                      <span className="flex items-center gap-1 font-medium">
                        <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" aria-hidden />
                        {review.rating}
                      </span>
                      <span className="truncate text-xs text-muted-foreground">
                        {review.customerName} · {formatDateTime(review.date)}
                      </span>
                    </div>
                    {review.comment && (
                      <p className="mt-0.5 text-muted-foreground">{review.comment}</p>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </>
        ) : (
          <LoadingBlock label="Loading ratings" />
        )}
      </Card>

      <Button
        variant="outline"
        className="w-full gap-2 text-red-600"
        onClick={() => {
          logout();
        }}
      >
        <LogOut className="h-4 w-4" aria-hidden />
        Sign out
      </Button>
    </div>
  );
}
