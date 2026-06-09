import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Chỉnh sửa món',
  description: 'Chỉnh sửa thông tin món ăn trong thực đơn nhà hàng',
};

export default function EditMenuItemLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
