import { Suspense } from 'react';
import { NotificationsList } from '@/components/notifications/notifications-list';
import NotificationsLoading from './loading';

export const metadata = {
  title: 'Thông báo',
  description: 'Xem thông báo đơn hàng mới, tin nhắn khách hàng và cảnh báo hệ thống',
};

export default function NotificationsPage() {
  return (
    <Suspense fallback={<NotificationsLoading />}>
      <NotificationsList />
    </Suspense>
  );
}
