'use client';

import { use, useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button, Card, cn } from '@foodflow/ui';
import { ChevronLeft, Star } from 'lucide-react';
import { api, ApiClientError } from '@/lib/api';
import { useAuth } from '@/lib/auth-provider';
import { formatVnd, formatDateTime } from '@/lib/format';
import { useLanguage } from '@/lib/language-context';
import {
  CUSTOMER_CANCELLABLE_STATUSES,
  isActiveOrder,
  isTrackingRelevant,
  orderProgressStep,
  orderStatusMeta,
  PROGRESS_STEPS,
  REVIEWABLE_STATUSES,
} from '@/lib/order-status';
import { subscribeOrderChannel, type ConnectionState } from '@/lib/realtime';
import type { Order, OrderTracking } from '@/lib/types';
import { ErrorBlock, LoadingBlock } from '@/components/feedback';
import { OrderStatusBadge } from '@/components/order-status-badge';
import { TrackingMap } from '@/components/tracking-map';

const POLL_MS = 15_000;

function toNumberOrNull(value: unknown): number | null {
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

export default function OrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { isAuthenticated, isAuthChecked } = useAuth();
  const { t, locale } = useLanguage();

  const [order, setOrder] = useState<Order | null>(null);
  const [tracking, setTracking] = useState<OrderTracking | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [liveState, setLiveState] = useState<ConnectionState>('connecting');
  const [cancelBusy, setCancelBusy] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [rating, setRating] = useState(0);
  const [reviewComment, setReviewComment] = useState('');
  const [reviewBusy, setReviewBusy] = useState(false);
  const [reviewDone, setReviewDone] = useState(false);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const load = useCallback(async (silent = false) => {
    if (!silent) {
      setLoading(true);
      setError(null);
    }
    try {
      const orderResult = await api.get<Order>(`/orders/${id}`);
      setOrder(orderResult);
      if (isTrackingRelevant(orderResult.status)) {
        try {
          const trackingResult = await api.get<OrderTracking>(`/orders/${id}/tracking`);
          setTracking(trackingResult);
        } catch {
          setTracking(null);
        }
      }
    } catch (err) {
      if (!silent) {
        const e = err as ApiClientError;
        setError(e?.status === 404 ? 'Order not found.' : 'Could not load this order.');
      }
    } finally {
      if (!silent) setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    if (!isAuthChecked) return;
    if (!isAuthenticated) {
      router.replace(`/login?next=/orders/${id}`);
      return;
    }
    void load();
  }, [isAuthChecked, isAuthenticated, load, router]);

  // Realtime subscription; fall back to polling while the order is active.
  useEffect(() => {
    if (!order || !isActiveOrder(order.status)) return;
    const unsubscribe = subscribeOrderChannel(id, {
      onEvent: () => void load(true),
      onState: setLiveState,
    });
    pollRef.current = setInterval(() => void load(true), POLL_MS);
    return () => {
      unsubscribe();
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [id, order?.status, load]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!isAuthChecked || loading) return <LoadingBlock label="Loading order" />;
  if (error || !order) return <ErrorBlock message={error ?? 'Order not found.'} onRetry={load} />;

  const meta = orderStatusMeta(order.status);
  const step = orderProgressStep(order.status);
  const cancellable = CUSTOMER_CANCELLABLE_STATUSES.has(order.status);
  const reviewable = REVIEWABLE_STATUSES.has(order.status) && !reviewDone;

  const cancel = async () => {
    setCancelBusy(true);
    setActionError(null);
    try {
      await api.post(`/orders/${id}/cancel`, {});
      await load(true);
    } catch (err) {
      const e = err as ApiClientError;
      setActionError(e?.detail || 'Could not cancel this order.');
    } finally {
      setCancelBusy(false);
    }
  };

  const submitReview = async () => {
    if (rating === 0) return;
    setReviewBusy(true);
    setActionError(null);
    try {
      await api.post(`/orders/${id}/review`, {
        rating,
        comment: reviewComment.trim() || undefined,
      });
      setReviewDone(true);
    } catch (err) {
      const e = err as ApiClientError;
      setActionError(e?.detail || 'Could not submit the review.');
    } finally {
      setReviewBusy(false);
    }
  };

  const driverLoc = tracking?.driverLocation
    ? { lat: tracking.driverLocation.lat, lng: tracking.driverLocation.lng }
    : null;
  const destAddress = order.deliveryAddress as Record<string, unknown> | null | undefined;
  const destLat = toNumberOrNull(destAddress?.latitude);
  const destLng = toNumberOrNull(destAddress?.longitude);
  const destLoc = destLat != null && destLng != null ? { lat: destLat, lng: destLng } : null;

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <Link
        href="/orders"
        className="inline-flex items-center gap-1 text-sm font-medium text-muted-foreground hover:text-gray-900"
      >
        <ChevronLeft className="h-4 w-4" aria-hidden />
        Orders
      </Link>

      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h1 className="text-xl font-bold text-gray-900">
            {order.restaurant?.name ?? order.restaurantName ?? 'Order'}
          </h1>
          <p className="text-xs text-muted-foreground">{formatDateTime(order.createdAt)}</p>
        </div>
        <OrderStatusBadge status={order.status} />
      </div>

      {isActiveOrder(order.status) && (
        <Card className="p-4">
          <ol className="flex items-center" aria-label="Order progress">
            {PROGRESS_STEPS.map((label, index) => {
              const viLabels = ['Đã đặt', 'Đã nhận', 'Chuẩn bị', 'Đang giao', 'Đã giao'];
              const displayLabel = locale === 'vi' ? viLabels[index] : label;
              return (
                <li key={label} className="flex flex-1 flex-col items-center gap-1.5">
                  <span
                    className={cn(
                      'h-2.5 w-2.5 rounded-full',
                      index <= step ? 'bg-primary' : 'bg-gray-200',
                    )}
                    aria-hidden
                  />
                  <span
                    className={cn(
                      'text-center text-[10px] font-medium leading-tight sm:text-xs',
                      index <= step ? 'text-gray-900' : 'text-gray-400',
                    )}
                  >
                    {displayLabel}
                  </span>
                </li>
              );
            })}
          </ol>
          <p className="mt-3 text-center text-sm text-muted-foreground" aria-live="polite">
            {meta.label}
            {tracking?.etaMinutes != null && ` · about ${tracking.etaMinutes} min`}
            {liveState !== 'live' && ' · live updates reconnecting'}
          </p>
        </Card>
      )}

      {(driverLoc || destLoc || tracking?.routePolyline) && (
        <TrackingMap
          driverLocation={driverLoc}
          destinationLocation={destLoc}
          routePolyline={tracking?.routePolyline ?? order.routePolyline ?? null}
          className="h-64 w-full rounded-xl border bg-slate-100 sm:h-80"
        />
      )}

      {order.driver && (
        <Card className="flex items-center gap-3 p-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 text-sm font-bold text-blue-700">
            {order.driver.fullName?.slice(0, 1) ?? 'D'}
          </div>
          <div>
            <p className="text-sm font-medium text-gray-900">{order.driver.fullName}</p>
            <p className="text-xs text-muted-foreground">{locale === "vi" ? "Tài xế giao hàng" : "Your driver"}</p>
          </div>
        </Card>
      )}

      <Card className="p-4">
        <h2 className="mb-2 font-semibold text-gray-900">{locale === "vi" ? "Danh sách món ăn" : "Items"}</h2>
        <ul className="space-y-2 text-sm">
          {(order.items ?? []).map((item, index) => (
            <li key={item.id ?? index} className="flex justify-between gap-3">
              <span className="min-w-0">
                {item.quantity}× {item.name}
                {item.options && item.options.length > 0 && (
                  <span className="block text-xs text-muted-foreground">
                    {item.options.join(', ')}
                  </span>
                )}
              </span>
              <span className="shrink-0 font-medium">
                {formatVnd(item.lineTotal ?? item.unitPrice * item.quantity)}
              </span>
            </li>
          ))}
        </ul>
        <dl className="mt-3 space-y-1.5 border-t pt-3 text-sm">
          <div className="flex justify-between">
            <dt className="text-muted-foreground">{t("cart.subtotal")}</dt>
            <dd>{formatVnd(order.subtotal)}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-muted-foreground">{t("cart.deliveryFee")}</dt>
            <dd>{formatVnd(order.deliveryFee)}</dd>
          </div>
          {order.discount > 0 && (
            <div className="flex justify-between text-green-700">
              <dt>{t("cart.discount")}</dt>
              <dd>−{formatVnd(order.discount)}</dd>
            </div>
          )}
          <div className="flex justify-between border-t pt-2 font-bold text-gray-900">
            <dt>Total</dt>
            <dd>{formatVnd(order.total)}</dd>
          </div>
          <p className="text-xs capitalize text-muted-foreground">
            Paid by {order.paymentMethod}
            {order.promotionCode && ` · code ${order.promotionCode}`}
          </p>
        </dl>
      </Card>

      {destAddress && (
        <Card className="p-4 text-sm">
          <h2 className="mb-1 font-semibold text-gray-900">Deliver to</h2>
          <p className="text-muted-foreground">
            {typeof destAddress.label === 'string' && destAddress.label
              ? `${destAddress.label} · `
              : ''}
            {String(destAddress.addressLine ?? '')}
          </p>
        </Card>
      )}

      {order.statusHistory && order.statusHistory.length > 0 && (
        <Card className="p-4">
          <h2 className="mb-3 font-semibold text-gray-900">Timeline</h2>
          <ol className="relative space-y-3 border-l border-gray-200 pl-4">
            {order.statusHistory.map((entry, index) => (
              <li key={index} className="relative text-sm">
                <span
                  className="absolute -left-[21px] top-1 h-2.5 w-2.5 rounded-full bg-primary"
                  aria-hidden
                />
                <p className="font-medium text-gray-900">
                  {orderStatusMeta(entry.status).label}
                </p>
                <p className="text-xs text-muted-foreground">
                  {formatDateTime(entry.timestamp)}
                  {entry.note ? ` · ${entry.note}` : ''}
                </p>
              </li>
            ))}
          </ol>
        </Card>
      )}

      {actionError && (
        <p role="alert" className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
          {actionError}
        </p>
      )}

      {cancellable && (
        <Button variant="outline" className="w-full text-red-600" onClick={cancel} disabled={cancelBusy}>
          {cancelBusy ? t('orderDetail.cancelling') : t('orderDetail.cancelBtn')}
        </Button>
      )}

      {reviewable && (
        <Card className="space-y-3 p-4">
          <h2 className="font-semibold text-gray-900">Rate this order</h2>
          <div className="flex gap-1" role="radiogroup" aria-label="Rating">
            {[1, 2, 3, 4, 5].map((value) => (
              <button
                key={value}
                type="button"
                role="radio"
                aria-checked={rating === value}
                aria-label={`${value} star${value === 1 ? '' : 's'}`}
                onClick={() => setRating(value)}
                className="p-1"
              >
                <Star
                  className={cn(
                    'h-7 w-7',
                    value <= rating ? 'fill-amber-400 text-amber-400' : 'text-gray-300',
                  )}
                  aria-hidden
                />
              </button>
            ))}
          </div>
          <textarea
            value={reviewComment}
            onChange={(e) => setReviewComment(e.target.value)}
            rows={2}
            maxLength={500}
            className="input-field resize-none"
            placeholder="Tell us how it went (optional)"
            aria-label="Review comment"
          />
          <Button onClick={submitReview} disabled={rating === 0 || reviewBusy}>
            {reviewBusy ? 'Sending…' : 'Submit review'}
          </Button>
        </Card>
      )}
    </div>
  );
}
