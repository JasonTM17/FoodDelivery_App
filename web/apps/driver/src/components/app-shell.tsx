'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { FoodFlowLogo, cn } from '@foodflow/ui';
import { Banknote, History, LayoutDashboard, UserRound } from 'lucide-react';
import { useLanguage, LanguageSwitcher } from '@/lib/language-context';
import type { ReactNode } from 'react';

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const { t } = useLanguage();

  const navItems = [
    { href: '/dashboard', label: t('nav.drive'), icon: LayoutDashboard },
    { href: '/history', label: t('nav.history'), icon: History },
    { href: '/earnings', label: t('nav.earnings'), icon: Banknote },
    { href: '/profile', label: t('nav.profile'), icon: UserRound },
  ];

  return (
    <div className="flex min-h-screen flex-col bg-slate-50">
      <header className="sticky top-0 z-40 border-b bg-white/90 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-3xl items-center justify-between gap-3 px-4">
          <Link href="/dashboard" aria-label="FoodFlow Driver home" className="shrink-0">
            <FoodFlowLogo markClassName="h-8 w-8" descriptor="Driver" />
          </Link>
          <div className="flex items-center gap-2">
            <nav aria-label="Primary" className="hidden items-center gap-1 sm:flex">
              {navItems.map(({ href, label }) => (
                <Link
                  key={href}
                  href={href}
                  className={cn(
                    'rounded-lg px-3 py-2 text-sm font-medium text-gray-600 hover:bg-slate-100 hover:text-gray-900',
                    pathname.startsWith(href) && 'bg-slate-200 text-gray-900',
                  )}
                >
                  {label}
                </Link>
              ))}
            </nav>
            <LanguageSwitcher />
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-3xl flex-1 px-4 pb-24 pt-4 sm:pb-10">{children}</main>

      <nav
        aria-label="Mobile"
        className="safe-bottom fixed inset-x-0 bottom-0 z-40 border-t bg-white sm:hidden"
      >
        <div className="grid grid-cols-4">
          {navItems.map(({ href, label, icon: Icon }) => {
            const active = pathname === href || pathname.startsWith(`${href}/`);
            return (
              <Link
                key={href}
                href={href}
                aria-current={active ? 'page' : undefined}
                className={cn(
                  'flex min-h-14 flex-col items-center justify-center gap-0.5 py-2 text-[11px] font-medium',
                  active ? 'text-primary' : 'text-gray-500',
                )}
              >
                <Icon className="h-5 w-5" aria-hidden />
                {label}
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
