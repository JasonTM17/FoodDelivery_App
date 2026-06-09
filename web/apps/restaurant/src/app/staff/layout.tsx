import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Nhân viên',
  description: 'Quản lý nhân viên nhà hàng — mời, phân quyền, lên lịch làm việc',
};

export default function StaffLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
