import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Hồ sơ nhà hàng',
  description: 'Chỉnh sửa thông tin, ảnh đại diện và tài khoản nhận thanh toán',
};

export default function ProfileLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
