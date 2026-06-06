import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Bản đồ tài xế',
  description: 'Bản đồ trực tuyến theo dõi vị trí tài xế FoodFlow đang hoạt động',
  openGraph: {
    title: 'Bản đồ tài xế | FoodFlow Admin',
    description: 'Bản đồ trực tuyến theo dõi vị trí tài xế FoodFlow đang hoạt động',
  },
  robots: { index: false, follow: false },
}

export default function DriverMapLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
