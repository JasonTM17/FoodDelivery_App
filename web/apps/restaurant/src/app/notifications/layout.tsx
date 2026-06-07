import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Thông báo',
  description: 'Xem thông báo đơn hàng mới, tin nhắn khách hàng và cảnh báo hệ thống',
};

export default function NotificationsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
