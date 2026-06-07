import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Đánh giá khách hàng',
  description: 'Quản lý đánh giá và phản hồi khách hàng trên FoodFlow',
};

export default function ReviewsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
