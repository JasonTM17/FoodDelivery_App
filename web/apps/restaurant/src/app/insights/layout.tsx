import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Phân tích & Gợi ý',
  description: 'Phân tích dữ liệu nhà hàng — món bán chạy, giờ cao điểm, dự báo doanh thu và đề xuất thông minh',
};

export default function InsightsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
