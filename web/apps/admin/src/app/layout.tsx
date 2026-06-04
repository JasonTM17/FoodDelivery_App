'use client'

import './globals.css'
import { Inter } from 'next/font/google'
import { usePathname, useRouter } from 'next/navigation'
import { useEffect, useState, useRef } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { AdminLayoutClient } from '@/components/admin-layout-client'

const inter = Inter({ subsets: ['latin', 'vietnamese'] })

const publicPaths = ['/login']

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const [isAuthChecked, setIsAuthChecked] = useState(false)
  const queryClientRef = useRef<QueryClient>()

  if (!queryClientRef.current) {
    queryClientRef.current = new QueryClient({
      defaultOptions: { queries: { retry: 1, refetchOnWindowFocus: false, staleTime: 30000 } },
    })
  }

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token && !publicPaths.includes(pathname)) {
      router.replace('/login')
    } else {
      setIsAuthChecked(true)
    }
  }, [pathname, router])

  const isPublic = publicPaths.includes(pathname)

  if (!isAuthChecked && !isPublic) {
    return (
      <html lang="vi">
        <head><title>FoodFlow Admin</title><meta name="description" content="Hệ thống quản trị nền tảng giao đồ ăn FoodFlow" /></head>
        <body className={inter.className}>
          <div className="flex h-screen items-center justify-center bg-background">
            <div className="flex flex-col items-center gap-2">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
              <p className="text-sm text-muted-foreground">Đang tải...</p>
            </div>
          </div>
        </body>
      </html>
    )
  }

  return (
    <html lang="vi">
      <head><title>FoodFlow Admin</title><meta name="description" content="Hệ thống quản trị nền tảng giao đồ ăn FoodFlow" /></head>
      <body className={inter.className}>
        <QueryClientProvider client={queryClientRef.current!}>
          {isPublic ? (
            <div className="min-h-screen bg-background">{children}</div>
          ) : (
            <AdminLayoutClient>{children}</AdminLayoutClient>
          )}
        </QueryClientProvider>
      </body>
    </html>
  )
}
