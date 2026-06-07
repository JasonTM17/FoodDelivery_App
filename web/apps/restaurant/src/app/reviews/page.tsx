import { Suspense } from 'react';
import { ReviewsDashboard } from '@/components/reviews/reviews-dashboard';
import ReviewsLoading from './loading';

export const metadata = {
  title: 'Đánh giá khách hàng',
  description: 'Xem và phản hồi đánh giá từ khách hàng của nhà hàng',
};

export default function ReviewsPage() {
  return (
    <Suspense fallback={<ReviewsLoading />}>
      <ReviewsDashboard />
    </Suspense>
  );
}
