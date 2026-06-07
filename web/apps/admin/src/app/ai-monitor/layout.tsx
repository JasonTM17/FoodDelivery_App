import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'AI & N8N Monitor',
  description: 'Giám sát workflow tự động và AI trên nền tảng FoodFlow',
  openGraph: {
    title: 'AI & N8N Monitor | FoodFlow Admin',
    description: 'Giám sát workflow tự động và AI trên nền tảng FoodFlow',
  },
  robots: { index: false, follow: false },
}

export default function AiMonitorLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
