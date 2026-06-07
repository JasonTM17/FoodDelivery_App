import { Suspense } from 'react';
import { AnalyticsDashboard } from '@/components/restaurant/analytics/analytics-dashboard';
import AnalyticsLoading from './loading';

export default function AnalyticsPage() {
  return (
    <Suspense fallback={<AnalyticsLoading />}>
      <AnalyticsDashboard />
    </Suspense>
  );
}
