import { Suspense } from 'react';
import { RevenueDashboard } from '@/components/revenue/revenue-dashboard';
import RevenueLoading from './loading';

export default function RevenuePage() {
  return (
    <Suspense fallback={<RevenueLoading />}>
      <RevenueDashboard />
    </Suspense>
  );
}
