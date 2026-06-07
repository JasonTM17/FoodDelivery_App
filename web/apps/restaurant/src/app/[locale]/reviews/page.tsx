import { Suspense } from 'react';
import { ReviewsDashboard } from '@/components/reviews/reviews-dashboard';
import ReviewsLoading from './loading';

export default function ReviewsPage() {
  return (
    <Suspense fallback={<ReviewsLoading />}>
      <ReviewsDashboard />
    </Suspense>
  );
}
