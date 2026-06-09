import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Tạo khuyến mãi',
  description: 'Tạo chương trình khuyến mãi mới cho nhà hàng',
};

export default function PromotionNewLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
