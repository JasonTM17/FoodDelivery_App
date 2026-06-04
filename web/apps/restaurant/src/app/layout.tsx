'use client';

import { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Inter } from 'next/font/google';
import Sidebar from '@/components/Sidebar';
import { isAuthenticated } from '@/lib/api';
import './globals.css';

const inter = Inter({ subsets: ['latin', 'vietnamese'] });

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const isLoginPage = pathname === '/login';

  useEffect(() => {
    if (!isLoginPage && !isAuthenticated()) {
      router.push('/login');
    }
  }, [isLoginPage, router]);

  if (isLoginPage) {
    return (
      <html lang="vi">
        <body className={inter.className}>
          {children}
        </body>
      </html>
    );
  }

  return (
    <html lang="vi">
      <body className={inter.className}>
        <div className="flex min-h-screen">
          <Sidebar />
          <main className="flex-1 ml-[260px] transition-all duration-300">
            <div className="p-6 max-w-7xl mx-auto">
              {children}
            </div>
          </main>
        </div>
      </body>
    </html>
  );
}
