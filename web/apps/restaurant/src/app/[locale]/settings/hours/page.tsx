import { Suspense } from 'react';
import { HoursEditor } from '@/components/settings/hours-editor';
import HoursLoading from './loading';

export default function HoursPage() {
  return (
    <Suspense fallback={<HoursLoading />}>
      <HoursEditor />
    </Suspense>
  );
}
