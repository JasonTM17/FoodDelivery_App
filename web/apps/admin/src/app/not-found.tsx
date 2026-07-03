'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { FoodFlowLogo } from '@foodflow/ui/foodflow-logo';
import { ArrowLeft, Home } from 'lucide-react';

const LOCALES = new Set(['vi', 'en', 'ja']);

function getOverviewHref(pathname: string | null) {
  const segment = pathname?.split('/').filter(Boolean)[0];
  return segment && LOCALES.has(segment) ? `/${segment}/overview` : '/overview';
}

export default function NotFound() {
  const pathname = usePathname();
  const router = useRouter();

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-4">
      <FoodFlowLogo showWordmark={false} className="mb-6" markClassName="h-20 w-20" />
      <h1 className="mb-2 text-6xl font-bold text-muted-foreground/30">404</h1>
      <h2 className="mb-2 text-xl font-semibold">Page not found</h2>
      <p className="mb-8 max-w-md text-center text-sm text-muted-foreground">
        The page you requested does not exist or has moved. Check the URL, or return to the
        overview dashboard.
      </p>
      <div className="flex gap-3">
        <Button variant="outline" onClick={() => router.back()}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Go back
        </Button>
        <Button asChild>
          <Link href={getOverviewHref(pathname)}>
            <Home className="mr-2 h-4 w-4" />
            Go to overview
          </Link>
        </Button>
      </div>
    </div>
  );
}
