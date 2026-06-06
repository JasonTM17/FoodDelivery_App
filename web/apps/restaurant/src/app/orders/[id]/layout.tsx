import type { Metadata } from 'next'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>
}): Promise<Metadata> {
  const { id } = await params
  return {
    title: `Đơn hàng #${id}`,
    description: `Chi tiết đơn hàng #${id} trên FoodFlow Nhà hàng`,
  }
}

export default function OrderDetailLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
