'use client';

import { RouteErrorState, type RouteErrorProps } from '@/components/shared/route-error-state';

export default function PromotionNewError(props: RouteErrorProps) {
  return <RouteErrorState {...props} feature="promotionNew" />;
}
