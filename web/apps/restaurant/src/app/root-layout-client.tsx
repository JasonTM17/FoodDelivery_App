'use client'

import { usePathname } from 'next/navigation'
import { AuthProvider } from '@/lib/auth-provider'
import { RestaurantLayoutClient } from '@/components/layout/restaurant-layout-client'

export function RootLayoutClient({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const isLoginPage =
    pathname === '/login' ||
    ['vi', 'en', 'ja'].some((locale) => pathname === `/${locale}/login`)

  if (isLoginPage) {
    return <AuthProvider>{children}</AuthProvider>
  }

  return (
    <AuthProvider>
      <RestaurantLayoutClient>{children}</RestaurantLayoutClient>
    </AuthProvider>
  )
}
