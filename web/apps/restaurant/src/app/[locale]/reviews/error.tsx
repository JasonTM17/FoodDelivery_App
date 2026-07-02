'use client';

import { RouteErrorState, type RouteErrorProps } from '@/components/shared/route-error-state';

export default function ReviewsError(props: RouteErrorProps) {
  return <RouteErrorState {...props} feature="reviews" />;
}
