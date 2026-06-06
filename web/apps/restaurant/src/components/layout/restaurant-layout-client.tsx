'use client';

import { usePathname } from 'next/navigation';
import { AuthProvider } from '@/lib/auth-provider';
import { RestaurantSidebar } from './restaurant-sidebar';

export function RestaurantLayoutClient({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isLoginPage = pathname === '/login';

  if (isLoginPage) {
    return <AuthProvider>{children}</AuthProvider>;
  }

  return (
    <AuthProvider>
      <div className="flex min-h-screen">
        <RestaurantSidebar />
        <main className="flex-1 ml-[260px] transition-all duration-300">
          <div className="p-6 max-w-7xl mx-auto">{children}</div>
        </main>
      </div>
    </AuthProvider>
  );
}
