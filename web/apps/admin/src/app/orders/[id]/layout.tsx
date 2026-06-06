import type { Metadata } from 'next'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>
}): Promise<Metadata> {
  const { id } = await params
  return {
    title: `Đơn hàng #${id}`,
    description: `Chi tiết đơn hàng #${id} trên hệ thống quản trị FoodFlow`,
    openGraph: {
      title: `Đơn hàng #${id} | FoodFlow Admin`,
      description: `Chi tiết đơn hàng #${id} trên hệ thống quản trị FoodFlow`,
    },
    robots: { index: false, follow: false },
  }
}

export default function OrderDetailLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
