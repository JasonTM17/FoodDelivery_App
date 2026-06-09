import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Khuyến mãi',
  description: 'Quản lý chương trình khuyến mãi và ưu đãi của nhà hàng',
};

export default function PromotionsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
