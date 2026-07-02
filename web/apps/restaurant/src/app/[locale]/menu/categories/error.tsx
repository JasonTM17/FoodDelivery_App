'use client';

import { RouteErrorState, type RouteErrorProps } from '@/components/shared/route-error-state';

export default function CategoriesError(props: RouteErrorProps) {
  return <RouteErrorState {...props} feature="menuCategories" />;
}
