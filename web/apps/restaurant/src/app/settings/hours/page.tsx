import { Suspense } from 'react';
import { HoursEditor } from '@/components/settings/hours-editor';
import HoursLoading from './loading';

export const metadata = {
  title: 'Giờ hoạt động',
  description: 'Thiết lập giờ mở cửa và lịch nghỉ lễ của nhà hàng',
};

export default function HoursPage() {
  return (
    <Suspense fallback={<HoursLoading />}>
      <HoursEditor />
    </Suspense>
  );
}
