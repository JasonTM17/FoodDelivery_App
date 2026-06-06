import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Thêm món',
  description: 'Thêm món ăn mới vào thực đơn nhà hàng trên FoodFlow',
}

export default function NewMenuItemLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
