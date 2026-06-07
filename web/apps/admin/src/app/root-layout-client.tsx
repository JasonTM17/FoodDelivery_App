'use client'

import { usePathname } from 'next/navigation'
import { useRef } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { AuthProvider } from '@/lib/auth-provider'
import { AdminLayoutClient } from '@/components/layout/admin-layout-client'

const publicPaths = ['/login']

export function RootLayoutClient({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const queryClientRef = useRef<QueryClient>()

  if (!queryClientRef.current) {
    queryClientRef.current = new QueryClient({
      defaultOptions: { queries: { retry: 1, refetchOnWindowFocus: false, staleTime: 30000 } },
    })
  }

  // Handle both bare paths (/login) and locale-prefixed paths (/vi/login, /en/login)
  const isPublic = publicPaths.some(
    (p) => pathname === p || ['vi', 'en', 'ja'].some((l) => pathname === `/${l}${p}`)
  )

  return (
    <AuthProvider>
      <QueryClientProvider client={queryClientRef.current!}>
        {isPublic ? (
          <div className="min-h-screen bg-background">{children}</div>
        ) : (
          <AdminLayoutClient>{children}</AdminLayoutClient>
        )}
      </QueryClientProvider>
    </AuthProvider>
  )
}
