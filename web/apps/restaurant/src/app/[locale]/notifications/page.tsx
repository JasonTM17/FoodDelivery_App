import { Suspense } from 'react';
import { NotificationsList } from '@/components/notifications/notifications-list';
import NotificationsLoading from './loading';

export default function NotificationsPage() {
  return (
    <Suspense fallback={<NotificationsLoading />}>
      <NotificationsList />
    </Suspense>
  );
}
