'use client';

import Link from 'next/link';
import { FoodFlowLogo } from '@foodflow/ui';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-b from-orange-50 to-white">
      <header className="flex h-14 items-center justify-center border-b bg-white/80">
        <Link href="/home" aria-label="FoodFlow home">
          <FoodFlowLogo markClassName="h-8 w-8" />
        </Link>
      </header>
      <main className="flex flex-1 items-center justify-center px-4 py-8">{children}</main>
    </div>
  );
}
