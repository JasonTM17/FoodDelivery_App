import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Giờ hoạt động',
  description: 'Thiết lập giờ mở cửa và lịch nghỉ lễ của nhà hàng',
};

export default function HoursLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
