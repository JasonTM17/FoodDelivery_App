'use client'

import AdminSidebar from './admin-sidebar'
import AdminTopbar from './admin-topbar'

export function AdminLayoutClient({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background">
      <AdminSidebar />
      <div className="ml-64 flex min-h-screen flex-col">
        <AdminTopbar />
        <main className="flex-1 p-6">{children}</main>
      </div>
    </div>
  )
}
