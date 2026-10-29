'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Button, Card, Input } from '@foodflow/ui';
import { Minus, Plus, ShoppingCart, Trash2 } from 'lucide-react';
import { useAuth } from '@/lib/auth-provider';
import { useCart } from '@/lib/cart-store';
import { formatVnd } from '@/lib/format';
import { EmptyBlock } from '@/components/feedback';

export default function CartPage() {
  const { isAuthenticated } = useAuth();
  const {
    cart,
    itemCount,
    subtotal,
    isSyncing,
    notice,
    error,
    dismissMessages,
    setQuantity,
    removeLine,
    clearCart,
    applyPromo,
    removePromo,
  } = useCart();
  const [promoInput, setPromoInput] = useState('');
  const [promoBusy, setPromoBusy] = useState(false);

  if (cart.items.length === 0) {
    return (
      <div className="pt-8">
        <EmptyBlock icon={ShoppingCart} title="Your cart is empty">
          <Button asChild variant="outline">
            <Link href="/home">Browse restaurants</Link>
          </Button>
        </EmptyBlock>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-900">Cart</h1>
        <button
          type="button"
          onClick={clearCart}
          className="text-sm font-medium text-red-600 hover:underline"
        >
          Clear
        </button>
      </div>
      {cart.restaurantName && (
        <p className="text-sm text-muted-foreground">From {cart.restaurantName}</p>
      )}

      {notice && (
        <p role="status" className="rounded-lg bg-blue-50 px-3 py-2 text-sm text-blue-800">
          {notice}
        </p>
      )}
      {error && (
        <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}{' '}
          <button type="button" className="font-medium underline" onClick={dismissMessages}>
            Dismiss
          </button>
        </p>
      )}
      {isSyncing && <p className="text-xs text-muted-foreground">Syncing cart…</p>}

      <ul className="space-y-3">
        {cart.items.map((line) => (
          <li key={line.key}>
            <Card className="flex gap-3 p-3">
              <div className="h-16 w-16 shrink-0 overflow-hidden rounded-lg bg-orange-50">
                {line.imageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={line.imageUrl} alt="" className="h-full w-full object-cover" />
                ) : null}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-2">
                  <h2 className="font-medium text-gray-900">{line.name}</h2>
                  <button
                    type="button"
                    aria-label={`Remove ${line.name}`}
                    onClick={() => removeLine(line.key)}
                    className="p-1 text-gray-400 hover:text-red-600"
                  >
                    <Trash2 className="h-4 w-4" aria-hidden />
                  </button>
                </div>
                {line.selectedOptions.length > 0 && (
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {line.selectedOptions.map((o) => o.valueName).join(', ')}
                  </p>
                )}
                {line.notes && (
                  <p className="mt-0.5 text-xs italic text-muted-foreground">“{line.notes}”</p>
                )}
                <div className="mt-2 flex items-center justify-between">
                  <div className="flex items-center rounded-lg border">
                    <button
                      type="button"
                      aria-label={`Decrease ${line.name} quantity`}
                      className="p-2 text-gray-600 disabled:opacity-40"
                      disabled={line.quantity <= 1}
                      onClick={() => setQuantity(line.key, line.quantity - 1)}
                    >
                      <Minus className="h-3.5 w-3.5" aria-hidden />
                    </button>
                    <span className="min-w-7 text-center text-sm font-semibold">
                      {line.quantity}
                    </span>
                    <button
                      type="button"
                      aria-label={`Increase ${line.name} quantity`}
                      className="p-2 text-gray-600"
                      onClick={() => setQuantity(line.key, line.quantity + 1)}
                    >
                      <Plus className="h-3.5 w-3.5" aria-hidden />
                    </button>
                  </div>
                  <span className="text-sm font-semibold text-gray-900">
                    {formatVnd(line.unitPrice * line.quantity)}
                  </span>
                </div>
              </div>
            </Card>
          </li>
        ))}
      </ul>

      <Card className="space-y-3 p-4">
        {isAuthenticated ? (
          cart.promoCode ? (
            <div className="flex items-center justify-between text-sm">
              <span>
                Code <strong>{cart.promoCode}</strong>
              </span>
              <button
                type="button"
                onClick={removePromo}
                className="text-sm font-medium text-red-600 hover:underline"
              >
                Remove
              </button>
            </div>
          ) : (
            <form
              className="flex gap-2"
              onSubmit={async (e) => {
                e.preventDefault();
                setPromoBusy(true);
                try {
                  await applyPromo(promoInput);
                  setPromoInput('');
                } catch {
                  // error surfaced via store
                } finally {
                  setPromoBusy(false);
                }
              }}
            >
              <Input
                value={promoInput}
                onChange={(e) => setPromoInput(e.target.value)}
                placeholder="Promotion code"
                aria-label="Promotion code"
                className="flex-1"
              />
              <Button type="submit" variant="outline" disabled={promoBusy || !promoInput.trim()}>
                Apply
              </Button>
            </form>
          )
        ) : (
          <p className="text-sm text-muted-foreground">
            <Link href="/login?next=/cart" className="font-medium text-primary hover:underline">
              Sign in
            </Link>{' '}
            to use a promotion code.
          </p>
        )}

        <dl className="space-y-1.5 border-t pt-3 text-sm">
          <div className="flex justify-between">
            <dt className="text-muted-foreground">Subtotal</dt>
            <dd className="font-medium">{formatVnd(subtotal)}</dd>
          </div>
          {cart.discount > 0 && (
            <div className="flex justify-between text-green-700">
              <dt>Discount</dt>
              <dd>−{formatVnd(cart.discount)}</dd>
            </div>
          )}
          <p className="pt-1 text-xs text-muted-foreground">
            Delivery fee and final total are confirmed at checkout.
          </p>
        </dl>

        <Button asChild className="w-full" size="lg" disabled={itemCount === 0}>
          <Link href={isAuthenticated ? '/checkout' : '/login?next=/checkout'}>
            {isAuthenticated ? 'Checkout' : 'Sign in to checkout'}
          </Link>
        </Button>
      </Card>
    </div>
  );
}
