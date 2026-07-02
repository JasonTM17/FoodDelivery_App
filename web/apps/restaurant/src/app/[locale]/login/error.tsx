'use client';

import { RouteErrorState, type RouteErrorProps } from '@/components/shared/route-error-state';

export default function LoginError(props: RouteErrorProps) {
  return <RouteErrorState {...props} feature="login" fullScreen />;
}
