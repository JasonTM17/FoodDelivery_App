'use client'

import { usePathname } from 'next/navigation'
import { AuthProvider } from '@/lib/auth-provider'
import { RestaurantSidebar } from '@/components/layout/restaurant-sidebar'

export function RootLayoutClient({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  // Handle both /login and locale-prefixed /vi/login, /en/login, /ja/login
  const isLoginPage =
    pathname === '/login' ||
    ['vi', 'en', 'ja'].some((l) => pathname === `/${l}/login`)

  if (isLoginPage) {
    return (
      <AuthProvider>
        {children}
      </AuthProvider>
    )
  }

  return (
    <AuthProvider>
      <div className="flex min-h-screen">
        <RestaurantSidebar />
        <main className="flex-1 ml-[260px] transition-all duration-300">
          <div className="p-6 max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </AuthProvider>
  )
}
