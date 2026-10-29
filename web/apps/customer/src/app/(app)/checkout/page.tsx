'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button, Card, cn } from '@foodflow/ui';
import { MapPin, Plus } from 'lucide-react';
import { api, ApiClientError } from '@/lib/api';
import { useAuth } from '@/lib/auth-provider';
import { useCart } from '@/lib/cart-store';
import {
  buildPlaceOrderRequest,
  describeOrderError,
  newIdempotencyKey,
  type PaymentMethod,
} from '@/lib/checkout';
import { formatVnd } from '@/lib/format';
import type { Address, CreateOrderResponse, DeliveryPricing } from '@/lib/types';
import { ErrorBlock, LoadingBlock } from '@/components/feedback';

const PAYMENT_METHODS: { id: PaymentMethod; label: string }[] = [
  { id: 'cash', label: 'Cash on delivery' },
  { id: 'wallet', label: 'FoodFlow wallet' },
  { id: 'sepay', label: 'Bank transfer (SePay)' },
];

export default function CheckoutPage() {
  const router = useRouter();
  const { isAuthenticated, isAuthChecked } = useAuth();
  const { cart, subtotal, markOrderPlaced } = useCart();

  const [addresses, setAddresses] = useState<Address[] | null>(null);
  const [addressId, setAddressId] = useState<string>('');
  const [payment, setPayment] = useState<PaymentMethod>('cash');
  const [notes, setNotes] = useState('');
  const [deliveryFee, setDeliveryFee] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [idemKey, setIdemKey] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const list = await api.get<Address[]>('/users/addresses');
      const items = Array.isArray(list) ? list : [];
      setAddresses(items);
      const def = items.find((a) => a.isDefault) ?? items[0];
      setAddressId((current) => current || def?.id || '');
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : 'Could not load your addresses.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!isAuthChecked) return;
    if (!isAuthenticated) {
      router.replace('/login?next=/checkout');
      return;
    }
    void load();
  }, [isAuthChecked, isAuthenticated, load, router]);

  useEffect(() => {
    let cancelled = false;
    api
      .get<DeliveryPricing>('/orders/delivery-pricing')
      .then((r) => {
        if (!cancelled) setDeliveryFee(Number(r.baseDeliveryFeeVnd) || 0);
      })
      .catch(() => {
        if (!cancelled) setDeliveryFee(null);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const estimatedTotal = useMemo(
    () => Math.max(0, subtotal - cart.discount) + (deliveryFee ?? 0),
    [subtotal, cart.discount, deliveryFee],
  );

  const placeOrder = async () => {
    setSubmitError(null);
    setSubmitting(true);
    try {
      const key = idemKey ?? newIdempotencyKey();
      setIdemKey(key);
      const request = buildPlaceOrderRequest(
        {
          addressId,
          paymentMethod: payment,
          promotionCode: cart.promoCode,
          notes: notes.trim() || undefined,
        },
        key,
      );
      const order = await api.post<CreateOrderResponse>(request.path, request.body, {
        headers: request.headers,
      });
      markOrderPlaced();
      router.replace(`/checkout/success?orderId=${encodeURIComponent(order.id)}`);
    } catch (err) {
      const apiError = err as ApiClientError;
      if (apiError?.status === 409 || apiError?.code === 'ORDER_PRICE_MISMATCH') {
        setSubmitError(
          apiError.detail ||
            'Prices changed since you added these items. Review your cart and try again.',
        );
      } else {
        setSubmitError(describeOrderError(err));
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (!isAuthChecked || loading) return <LoadingBlock label="Loading checkout" />;
  if (loadError) return <ErrorBlock message={loadError} onRetry={load} />;

  if (cart.items.length === 0) {
    return (
      <ErrorBlock
        title="Your cart is empty"
        message="Add items before checking out."
        onRetry={() => router.push('/home')}
      />
    );
  }

  const hasAddress = (addresses ?? []).length > 0;

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <h1 className="text-xl font-bold text-gray-900">Checkout</h1>
      {cart.restaurantName && (
        <p className="text-sm text-muted-foreground">From {cart.restaurantName}</p>
      )}

      <section aria-labelledby="address-heading" className="space-y-2">
        <h2 id="address-heading" className="font-semibold text-gray-900">
          Delivery address
        </h2>
        {!hasAddress ? (
          <Card className="p-4">
            <p className="text-sm text-muted-foreground">You need a delivery address.</p>
            <Button asChild variant="outline" size="sm" className="mt-3 gap-1.5">
              <Link href="/addresses?new=1&next=/checkout">
                <Plus className="h-4 w-4" aria-hidden />
                Add address
              </Link>
            </Button>
          </Card>
        ) : (
          <ul className="space-y-2" role="radiogroup" aria-label="Delivery address">
            {(addresses ?? []).map((address) => (
              <li key={address.id}>
                <label
                  className={cn(
                    'flex cursor-pointer items-start gap-3 rounded-xl border bg-white p-3 transition-colors',
                    addressId === address.id
                      ? 'border-primary bg-orange-50'
                      : 'hover:border-primary/50',
                  )}
                >
                  <input
                    type="radio"
                    name="address"
                    value={address.id}
                    checked={addressId === address.id}
                    onChange={() => setAddressId(address.id)}
                    className="mt-1 h-4 w-4 accent-primary"
                  />
                  <span>
                    <span className="flex items-center gap-1.5 text-sm font-medium text-gray-900">
                      <MapPin className="h-3.5 w-3.5 text-primary" aria-hidden />
                      {address.label}
                      {address.isDefault && (
                        <span className="text-xs font-normal text-muted-foreground">(default)</span>
                      )}
                    </span>
                    <span className="mt-0.5 block text-sm text-muted-foreground">
                      {address.addressLine}
                    </span>
                  </span>
                </label>
              </li>
            ))}
          </ul>
        )}
        {hasAddress && (
          <Link href="/addresses?next=/checkout" className="text-sm font-medium text-primary hover:underline">
            Manage addresses
          </Link>
        )}
      </section>

      <section aria-labelledby="payment-heading" className="space-y-2">
        <h2 id="payment-heading" className="font-semibold text-gray-900">
          Payment
        </h2>
        <div className="grid gap-2 sm:grid-cols-3" role="radiogroup" aria-label="Payment method">
          {PAYMENT_METHODS.map((method) => (
            <label
              key={method.id}
              className={cn(
                'flex cursor-pointer items-center gap-2 rounded-xl border bg-white px-3 py-3 text-sm transition-colors',
                payment === method.id
                  ? 'border-primary bg-orange-50 font-medium'
                  : 'hover:border-primary/50',
              )}
            >
              <input
                type="radio"
                name="payment"
                value={method.id}
                checked={payment === method.id}
                onChange={() => setPayment(method.id)}
                className="h-4 w-4 accent-primary"
              />
              {method.label}
            </label>
          ))}
        </div>
      </section>

      <label className="block">
        <span className="label">Delivery notes</span>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={2}
          maxLength={300}
          className="input-field resize-none"
          placeholder="Optional"
        />
      </label>

      <Card className="space-y-2 p-4">
        <dl className="space-y-1.5 text-sm">
          <div className="flex justify-between">
            <dt className="text-muted-foreground">Subtotal ({cart.items.length} items)</dt>
            <dd className="font-medium">{formatVnd(subtotal)}</dd>
          </div>
          {cart.discount > 0 && (
            <div className="flex justify-between text-green-700">
              <dt>Discount</dt>
              <dd>−{formatVnd(cart.discount)}</dd>
            </div>
          )}
          <div className="flex justify-between">
            <dt className="text-muted-foreground">Delivery fee</dt>
            <dd className="font-medium">
              {deliveryFee != null ? formatVnd(deliveryFee) : 'Calculated at order'}
            </dd>
          </div>
          <div className="flex justify-between border-t pt-2 text-base font-bold text-gray-900">
            <dt>Estimated total</dt>
            <dd>{formatVnd(estimatedTotal)}</dd>
          </div>
        </dl>
        <p className="text-xs text-muted-foreground">
          Final prices are confirmed by the server when the order is placed.
        </p>
      </Card>

      {submitError && (
        <p role="alert" className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
          {submitError}
        </p>
      )}

      <div className="safe-bottom sticky bottom-16 bg-orange-50/0 pb-2 sm:bottom-4">
        <Button
          size="lg"
          className="w-full shadow-lg"
          disabled={!hasAddress || !addressId || submitting}
          onClick={placeOrder}
        >
          {submitting ? 'Placing order…' : 'Place order'}
        </Button>
      </div>
    </div>
  );
}
