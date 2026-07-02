'use client';

import { RouteErrorState, type RouteErrorProps } from '@/components/shared/route-error-state';

export default function OrderDetailError(props: RouteErrorProps) {
  return <RouteErrorState {...props} feature="orderDetail" />;
}
