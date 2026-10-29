'use client';

import Link from 'next/link';
import { FoodFlowLogo } from '@foodflow/ui';
import { LanguageSwitcher } from '@/lib/language-context';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-slate-50">
      <header className="flex h-14 items-center justify-between border-b bg-white px-4 sm:px-8">
        <div className="w-24" />
        <Link href="/dashboard" aria-label="FoodFlow Driver home">
          <FoodFlowLogo markClassName="h-8 w-8" descriptor="Driver" />
        </Link>
        <div className="flex w-24 justify-end">
          <LanguageSwitcher />
        </div>
      </header>
      <main className="flex flex-1 items-center justify-center px-4 py-8">{children}</main>
    </div>
  );
}
