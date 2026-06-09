import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Danh mục món',
  description: 'Quản lý danh mục món ăn trong thực đơn nhà hàng',
};

export default function CategoriesLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
