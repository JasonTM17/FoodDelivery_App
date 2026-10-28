'use client';

import { Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Button } from '@foodflow/ui';
import { CheckCircle2 } from 'lucide-react';

function SuccessInner() {
  const params = useSearchParams();
  const orderId = params.get('orderId');
  return (
    <div className="flex flex-col items-center gap-4 py-16 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
        <CheckCircle2 className="h-9 w-9 text-green-600" aria-hidden />
      </div>
      <h1 className="text-xl font-bold text-gray-900">Order placed</h1>
      <p className="max-w-sm text-sm text-muted-foreground">
        Your order was sent to the restaurant.
      </p>
      <div className="flex gap-3">
        {orderId && (
          <Button asChild>
            <Link href={`/orders/${orderId}`}>Track order</Link>
          </Button>
        )}
        <Button asChild variant="outline">
          <Link href="/home">Keep browsing</Link>
        </Button>
      </div>
    </div>
  );
}

export default function CheckoutSuccessPage() {
  return (
    <Suspense>
      <SuccessInner />
    </Suspense>
  );
}
