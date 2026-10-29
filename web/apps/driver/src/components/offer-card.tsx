'use client';

import { useEffect, useState } from 'react';
import { Button, Card } from '@foodflow/ui';
import { MapPin, Store, Timer } from 'lucide-react';
import { isOfferExpired, offerSecondsRemaining, type NormalizedOffer } from '@/lib/dispatch';
import { formatVnd } from '@/lib/format';
import { useLanguage } from '@/lib/language-context';

export function OfferCard({
  offer,
  busy,
  onAccept,
  onReject,
}: {
  offer: NormalizedOffer;
  busy: boolean;
  onAccept: (offer: NormalizedOffer) => void;
  onReject: (offer: NormalizedOffer) => void;
}) {
  const [now, setNow] = useState(() => Date.now());
  const { locale } = useLanguage();

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  const expired = isOfferExpired(offer, now);
  const seconds = offerSecondsRemaining(offer, now);

  return (
    <Card
      role="alert"
      aria-live="assertive"
      className="border-primary/40 bg-orange-50 p-4 shadow-lg"
    >
      <div className="flex items-center justify-between gap-2">
        <h2 className="font-semibold text-gray-900">
          {locale === 'vi' ? 'Đơn hàng mới' : 'New delivery offer'}
        </h2>
        <span
          className={`flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-bold ${
            expired ? 'bg-gray-200 text-gray-600' : 'bg-primary text-primary-foreground'
          }`}
        >
          <Timer className="h-3.5 w-3.5" aria-hidden />
          {expired ? (locale === 'vi' ? 'Hết hạn' : 'Expired') : `${seconds}s`}
        </span>
      </div>

      <dl className="mt-3 space-y-2 text-sm">
        <div className="flex items-start gap-2">
          <Store className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden />
          <div className="min-w-0">
            <dt className="sr-only">Pickup</dt>
            <dd className="font-medium text-gray-900">{offer.restaurantName ?? (locale === 'vi' ? 'Nhà hàng' : 'Restaurant')}</dd>
            {offer.restaurantAddress && (
              <dd className="text-xs text-muted-foreground">{offer.restaurantAddress}</dd>
            )}
          </div>
        </div>
        <div className="flex items-start gap-2">
          <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-green-600" aria-hidden />
          <div className="min-w-0">
            <dt className="sr-only">Drop-off</dt>
            <dd className="text-sm text-gray-900">{offer.deliveryAddress ?? (locale === 'vi' ? 'Địa chỉ khách hàng' : 'Customer address')}</dd>
          </div>
        </div>
        <div className="flex flex-wrap gap-x-4 gap-y-1 pt-1 text-xs text-muted-foreground">
          {offer.deliveryFee != null && (
            <span>
              {locale === 'vi' ? 'Cước nhận' : 'Earns'}{' '}
              <strong className="text-gray-900">{formatVnd(offer.deliveryFee)}</strong>
            </span>
          )}
          {offer.distanceKm != null && (
            <span>{offer.distanceKm.toFixed(1)} {locale === 'vi' ? 'km đến quán' : 'km to pickup'}</span>
          )}
          {offer.surgeMultiplier != null && offer.surgeMultiplier > 1 && (
            <span className="font-medium text-amber-700">Surge ×{offer.surgeMultiplier}</span>
          )}
        </div>
      </dl>

      {expired ? (
        <p className="mt-3 text-sm text-muted-foreground">
          {locale === 'vi' ? 'Đơn này đã hết hạn — đang chờ đơn tiếp theo.' : 'This offer expired — waiting for the next one.'}
        </p>
      ) : (
        <div className="mt-4 grid grid-cols-2 gap-2">
          <Button variant="outline" onClick={() => onReject(offer)} disabled={busy}>
            {locale === 'vi' ? 'Từ chối' : 'Reject'}
          </Button>
          <Button onClick={() => onAccept(offer)} disabled={busy}>
            {busy ? (locale === 'vi' ? 'Đang gửi…' : 'Sending…') : (locale === 'vi' ? 'Nhận đơn' : 'Accept')}
          </Button>
        </div>
      )}
    </Card>
  );
}
