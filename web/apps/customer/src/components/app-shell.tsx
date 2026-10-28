'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { FoodFlowLogo, Button, cn } from '@foodflow/ui';
import { Home, ReceiptText, ShoppingCart, UserRound } from 'lucide-react';
import { useAuth } from '@/lib/auth-provider';
import { useCart } from '@/lib/cart-store';
import type { ReactNode } from 'react';

const NAV_ITEMS = [
  { href: '/home', label: 'Home', icon: Home },
  { href: '/orders', label: 'Orders', icon: ReceiptText },
  { href: '/cart', label: 'Cart', icon: ShoppingCart },
  { href: '/profile', label: 'Account', icon: UserRound },
];

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const { isAuthenticated, user } = useAuth();
  const { itemCount } = useCart();

  return (
    <div className="flex min-h-screen flex-col bg-orange-50/40">
      <header className="sticky top-0 z-40 border-b bg-white/90 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-5xl items-center gap-3 px-4">
          <Link href="/home" aria-label="FoodFlow home" className="shrink-0">
            <FoodFlowLogo markClassName="h-8 w-8" />
          </Link>
          <nav aria-label="Primary" className="hidden items-center gap-1 sm:flex">
            <Link
              href="/home"
              className={cn(
                'rounded-lg px-3 py-2 text-sm font-medium text-gray-600 hover:bg-orange-50 hover:text-gray-900',
                pathname.startsWith('/home') && 'bg-orange-100 text-gray-900',
              )}
            >
              Discover
            </Link>
            <Link
              href="/orders"
              className={cn(
                'rounded-lg px-3 py-2 text-sm font-medium text-gray-600 hover:bg-orange-50 hover:text-gray-900',
                pathname.startsWith('/orders') && 'bg-orange-100 text-gray-900',
              )}
            >
              Orders
            </Link>
          </nav>
          <div className="ml-auto flex items-center gap-2">
            <Link
              href="/cart"
              aria-label={`Cart, ${itemCount} items`}
              className="relative rounded-full p-2.5 text-gray-700 hover:bg-orange-50"
            >
              <ShoppingCart className="h-5 w-5" aria-hidden />
              {itemCount > 0 && (
                <span className="absolute -right-0.5 -top-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1 text-[11px] font-bold text-primary-foreground">
                  {itemCount}
                </span>
              )}
            </Link>
            {isAuthenticated ? (
              <Button asChild variant="ghost" size="sm" className="gap-2">
                <Link href="/profile">
                  <UserRound className="h-4 w-4" aria-hidden />
                  <span className="max-w-28 truncate">{user?.fullName?.split(' ')[0]}</span>
                </Link>
              </Button>
            ) : (
              <Button asChild size="sm">
                <Link href={`/login?next=${encodeURIComponent(pathname)}`}>Sign in</Link>
              </Button>
            )}
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-5xl flex-1 px-4 pb-24 pt-4 sm:pb-10">{children}</main>

      <nav
        aria-label="Mobile"
        className="safe-bottom fixed inset-x-0 bottom-0 z-40 border-t bg-white sm:hidden"
      >
        <div className="grid grid-cols-4">
          {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
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
                <span className="relative">
                  <Icon className="h-5 w-5" aria-hidden />
                  {href === '/cart' && itemCount > 0 && (
                    <span className="absolute -right-2 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold text-primary-foreground">
                      {itemCount}
                    </span>
                  )}
                </span>
                {label}
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
