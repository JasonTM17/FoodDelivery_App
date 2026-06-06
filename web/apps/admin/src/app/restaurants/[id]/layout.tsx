import type { Metadata } from 'next'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>
}): Promise<Metadata> {
  const { id } = await params
  return {
    title: 'Chi tiết nhà hàng',
    description: `Chi tiết nhà hàng #${id} trên hệ thống quản trị FoodFlow`,
    openGraph: {
      title: `Chi tiết nhà hàng #${id} | FoodFlow Admin`,
      description: `Chi tiết nhà hàng #${id} trên hệ thống quản trị FoodFlow`,
    },
    robots: { index: false, follow: false },
  }
}

export default function RestaurantDetailLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
