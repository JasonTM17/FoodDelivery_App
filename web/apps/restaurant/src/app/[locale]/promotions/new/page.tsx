import { Suspense } from 'react';
import { PromotionWizard } from '@/components/restaurant/promotions/promotion-wizard';
import PromotionNewLoading from './loading';

export default function PromotionNewPage() {
  return (
    <Suspense fallback={<PromotionNewLoading />}>
      <PromotionWizard />
    </Suspense>
  );
}
