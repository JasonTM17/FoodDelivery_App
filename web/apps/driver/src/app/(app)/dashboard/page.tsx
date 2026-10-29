'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Badge, Button, Card, cn } from '@foodflow/ui';
import {
  Bike,
  Loader2,
  MapPin,
  Navigation,
  Phone,
  Power,
  Store,
  Wifi,
  WifiOff,
} from 'lucide-react';
import { api, ApiClientError } from '@/lib/api';
import { useAuth } from '@/lib/auth-provider';
import {
  buildGoOnlineBody,
  buildOfferResponseBody,
  offerResponsePath,
  parseDispatchOffer,
  type NormalizedOffer,
} from '@/lib/dispatch';
import { driverStatusLabel, isActiveDriverStatus, nextDriverActionLabel, nextDriverStatus } from '@/lib/driver-status';
import { formatVnd } from '@/lib/format';
import { useLanguage } from '@/lib/language-context';
import { getCurrentLocation, type LocationState } from '@/lib/location';
import { subscribeDriverDispatch, type ConnectionState } from '@/lib/realtime';
import { useLocationTracker } from '@/lib/use-location-tracker';
import type { DriverOrder } from '@/lib/types';
import { ErrorBlock, LoadingBlock } from '@/components/feedback';
import { OfferCard } from '@/components/offer-card';
import { TrackingMap } from '@/components/tracking-map';

const POLL_MS = 20_000;

export default function DashboardPage() {
  const router = useRouter();
  const { user, isAuthenticated, isAuthChecked } = useAuth();
  const { t, locale } = useLanguage();

  const [online, setOnline] = useState(false);
  const [onlineBusy, setOnlineBusy] = useState(false);
  const [activeOrder, setActiveOrder] = useState<DriverOrder | null>(null);
  const [offer, setOffer] = useState<NormalizedOffer | null>(null);
  const [offerBusy, setOfferBusy] = useState(false);
  const [liveState, setLiveState] = useState<ConnectionState>('connecting');
  const [locationState, setLocationState] = useState<LocationState>({ status: 'idle' });
  const [loadError, setLoadError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [transitionBusy, setTransitionBusy] = useState(false);
  const hasOrder = activeOrder != null && isActiveDriverStatus(activeOrder.status);

  const tracker = useLocationTracker(online);

  const loadActive = useCallback(async (silent = false) => {
    if (!silent) {
      setLoading(true);
      setLoadError(null);
    }
    try {
      const order = await api.get<DriverOrder | null>('/driver/orders/active');
      setActiveOrder(order);
    } catch (err) {
      if (!silent) {
        const e = err as ApiClientError;
        if (e?.status === 403) {
          setLoadError(locale === 'vi' ? 'Tài khoản này không có quyền truy cập tài xế.' : 'This account does not have driver access.');
        } else {
          setLoadError(locale === 'vi' ? 'Không thể tải đơn hàng hiện tại.' : 'Could not load your active delivery.');
        }
      }
    } finally {
      if (!silent) setLoading(false);
    }
  }, [locale]);

  useEffect(() => {
    if (!isAuthChecked) return;
    if (!isAuthenticated) {
      router.replace('/login?next=/dashboard');
      return;
    }
    void loadActive();
  }, [isAuthChecked, isAuthenticated, loadActive, router]);

  // Dispatch offers via the configured realtime provider; REST responds.
  useEffect(() => {
    if (!isAuthenticated || !user?.id) return;
    const unsubscribe = subscribeDriverDispatch(user.id, {
      onEvent: (event, payload) => {
        if (event === 'driver:new_order') {
          const parsed = parseDispatchOffer(payload);
          if (parsed) setOffer(parsed);
        }
        if (event === 'driver:order_assigned') {
          setOffer(null);
          void loadActive(true);
        }
      },
      onState: setLiveState,
    });
    return unsubscribe;
  }, [isAuthenticated, user?.id, loadActive]);

  // Poll active order while online or delivering, in case realtime is down.
  useEffect(() => {
    if (!isAuthenticated) return;
    const timer = setInterval(() => void loadActive(true), POLL_MS);
    return () => clearInterval(timer);
  }, [isAuthenticated, loadActive]);

  const goOnline = async () => {
    setOnlineBusy(true);
    setActionError(null);
    setLocationState({ status: 'requesting' });
    try {
      const position = await getCurrentLocation();
      setLocationState({
        status: 'granted',
        lat: position.lat,
        lng: position.lng,
        accuracy: position.accuracy,
      });
      await api.post('/driver/online', buildGoOnlineBody(position));
      setOnline(true);
    } catch (err) {
      const apiError = err as ApiClientError;
      if (apiError?.code === 'DRIVER_NOT_VERIFIED') {
        setActionError(locale === 'vi' ? 'Tài khoản tài xế chưa được kích hoạt.' : 'Your driver account is not verified yet.');
      } else if (apiError?.code === 'LOCATION_OUT_OF_DELIVERY_AREA') {
        setActionError(locale === 'vi' ? 'Bạn đang ở ngoài khu vực giao hàng.' : 'You are outside the delivery area.');
      } else if ((err as LocationState)?.status) {
        setLocationState(err as LocationState);
        setActionError(null);
      } else {
        setActionError(apiError?.detail || (locale === 'vi' ? 'Không thể bật trực tuyến.' : 'Could not go online.'));
      }
    } finally {
      setOnlineBusy(false);
    }
  };

  const goOffline = async () => {
    setOnlineBusy(true);
    setActionError(null);
    try {
      await api.post('/driver/offline', {});
      setOnline(false);
      setOffer(null);
    } catch (err) {
      const apiError = err as ApiClientError;
      setActionError(apiError?.detail || (locale === 'vi' ? 'Không thể tắt trực tuyến.' : 'Could not go offline.'));
    } finally {
      setOnlineBusy(false);
    }
  };

  const respond = async (target: NormalizedOffer, decision: 'accept' | 'reject') => {
    setOfferBusy(true);
    setActionError(null);
    try {
      await api.post(
        offerResponsePath(target.orderId),
        buildOfferResponseBody(target.offerToken, decision),
      );
      setOffer(null);
      if (decision === 'accept') await loadActive(true);
    } catch (err) {
      const apiError = err as ApiClientError;
      if (apiError?.status === 409) {
        setOffer(null);
        setActionError(locale === 'vi' ? 'Đơn hàng này đã hết hạn hoặc được nhận bởi tài xế khác.' : 'That offer expired or was already taken.');
      } else {
        setActionError(apiError?.detail || (locale === 'vi' ? 'Không thể phản hồi đơn hàng.' : `Could not ${decision} the offer.`));
      }
    } finally {
      setOfferBusy(false);
    }
  };

  const advance = async () => {
    if (!activeOrder) return;
    const next = nextDriverStatus(activeOrder.status);
    if (!next) return;
    setTransitionBusy(true);
    setActionError(null);
    try {
      await api.patch(`/driver/orders/${activeOrder.id}/status`, { status: next });
      await loadActive(true);
    } catch (err) {
      const apiError = err as ApiClientError;
      setActionError(apiError?.detail || (locale === 'vi' ? 'Không thể cập nhật trạng thái đơn hàng.' : 'Could not update the delivery status.'));
    } finally {
      setTransitionBusy(false);
    }
  };

  if (!isAuthChecked || loading) return <LoadingBlock label={t('common.loading')} />;
  if (loadError) return <ErrorBlock message={loadError} onRetry={loadActive} />;

  const actionLabel = activeOrder ? nextDriverActionLabel(activeOrder.status, locale) : null;

  return (
    <div className="space-y-4">
      <Card className={cn('p-4', online ? 'border-green-300 bg-green-50' : 'bg-white')}>
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div
              className={cn(
                'flex h-11 w-11 items-center justify-center rounded-full',
                online ? 'bg-green-600 text-white' : 'bg-slate-200 text-slate-500',
              )}
            >
              <Power className="h-5 w-5" aria-hidden />
            </div>
            <div>
              <p className="font-semibold text-gray-900">{online ? t('dash.online') : t('dash.offline')}</p>
              <p className="text-xs text-muted-foreground">
                {online
                  ? liveState === 'live'
                    ? (locale === 'vi' ? 'Đang sẵn sàng nhận đơn' : 'Receiving offers')
                    : (locale === 'vi' ? 'Đang kết nối lại kênh đơn...' : 'Reconnecting to offers…')
                  : (locale === 'vi' ? 'Bật trực tuyến để nhận đơn hàng' : 'Go online to receive offers')}
              </p>
            </div>
          </div>
          <Button
            variant={online ? 'outline' : 'default'}
            onClick={online ? goOffline : goOnline}
            disabled={onlineBusy}
            aria-pressed={online}
          >
            {onlineBusy ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : online ? t('dash.goOffline') : t('dash.goOnline')}
          </Button>
        </div>

        {online && (
          <div className="mt-3 flex items-center gap-2 border-t border-green-200 pt-3 text-xs text-muted-foreground">
            {liveState === 'live' ? (
              <Wifi className="h-3.5 w-3.5 text-green-600" aria-hidden />
            ) : (
              <WifiOff className="h-3.5 w-3.5 text-amber-600" aria-hidden />
            )}
            <span>
              {liveState === 'live'
                ? (locale === 'vi' ? 'Đã kết nối kênh đơn hàng thời gian thực' : 'Live offer channel connected')
                : (locale === 'vi' ? 'Kênh trực tiếp ngắt — đang tự động tải' : 'Offer channel offline — polling')}
            </span>
            {tracker.state.status === 'granted' && tracker.lastSentAt && (
              <span className="ml-auto">
                GPS ON · {new Date(tracker.lastSentAt).toLocaleTimeString()}
              </span>
            )}
          </div>
        )}
      </Card>

      {(locationState.status === 'denied' || tracker.state.status === 'denied') && (
        <p role="alert" className="rounded-lg bg-amber-50 px-4 py-3 text-sm text-amber-800">
          {locale === 'vi' ? 'Quyền vị trí bị từ chối — vui lòng bật định vị để nhận đơn.' : 'Location permission was denied — enable it in your browser to go online and share GPS.'}
        </p>
      )}
      {actionError && (
        <p role="alert" className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
          {actionError}
        </p>
      )}

      {offer && <OfferCard offer={offer} busy={offerBusy} onAccept={(o) => respond(o, 'accept')} onReject={(o) => respond(o, 'reject')} />}

      {hasOrder && activeOrder && (
        <Card className="space-y-4 p-4">
          <div className="flex items-center justify-between gap-2">
            <h2 className="font-semibold text-gray-900">{t('dash.activeTrip')}</h2>
            <Badge variant="info">{driverStatusLabel(activeOrder.status, locale)}</Badge>
          </div>

          <TrackingMap
            driverLocation={
              tracker.state.status === 'granted'
                ? { lat: tracker.state.lat, lng: tracker.state.lng }
                : null
            }
            restaurantLocation={
              activeOrder.status === 'driver_assigned' ||
              activeOrder.status === 'driver_arriving_restaurant'
                ? { lat: activeOrder.restaurantLatitude, lng: activeOrder.restaurantLongitude }
                : null
            }
            destinationLocation={{
              lat: activeOrder.deliveryAddress.latitude,
              lng: activeOrder.deliveryAddress.longitude,
            }}
            routePolyline={activeOrder.routePolyline}
            className="h-56 w-full rounded-xl border bg-slate-100 sm:h-72"
          />

          <div className="space-y-2 text-sm">
            <p className="flex items-start gap-2">
              <Store className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden />
              <span>
                <span className="font-medium">{activeOrder.restaurantName}</span>
                {activeOrder.restaurantPhone && (
                  <a
                    href={`tel:${activeOrder.restaurantPhone}`}
                    className="ml-2 inline-flex items-center gap-1 text-xs text-primary"
                  >
                    <Phone className="h-3 w-3" aria-hidden />
                    {locale === 'vi' ? 'Gọi quán' : 'Call'}
                  </a>
                )}
              </span>
            </p>
            <p className="flex items-start gap-2">
              <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-green-600" aria-hidden />
              <span>
                {activeOrder.deliveryAddress.address}
                {activeOrder.customerPhone && (
                  <a
                    href={`tel:${activeOrder.customerPhone}`}
                    className="ml-2 inline-flex items-center gap-1 text-xs text-primary"
                  >
                    <Phone className="h-3 w-3" aria-hidden />
                    {activeOrder.customerName}
                  </a>
                )}
              </span>
            </p>
            {activeOrder.note && (
              <p className="rounded-lg bg-slate-100 px-3 py-2 text-xs text-slate-700">
                {activeOrder.note}
              </p>
            )}
            <ul className="space-y-1 border-t pt-2">
              {activeOrder.items.map((item, index) => (
                <li key={`${item.menuItemId}-${index}`} className="flex justify-between">
                  <span>
                    {item.quantity}× {item.name}
                  </span>
                  <span className="text-muted-foreground">{formatVnd(item.totalPrice)}</span>
                </li>
              ))}
            </ul>
            <div className="flex justify-between border-t pt-2 text-sm">
              <span className="text-muted-foreground">
                {locale === 'vi' ? 'Thu hộ tiền mặt' : 'Collect on delivery'} ({activeOrder.paymentMethod})
              </span>
              <span className="font-semibold">{formatVnd(activeOrder.total)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">{locale === 'vi' ? 'Cước tài xế nhận' : 'Your fee'}</span>
              <span className="font-semibold text-green-700">{formatVnd(activeOrder.deliveryFee)}</span>
            </div>
          </div>

          {actionLabel && (
            <Button size="lg" className="w-full gap-2" onClick={advance} disabled={transitionBusy}>
              {transitionBusy ? (
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
              ) : (
                <Navigation className="h-4 w-4" aria-hidden />
              )}
              {actionLabel}
            </Button>
          )}
        </Card>
      )}

      {!hasOrder && !offer && online && (
        <Card className="flex flex-col items-center gap-2 p-8 text-center">
          <Bike className="h-8 w-8 text-slate-300" aria-hidden />
          <p className="text-sm text-muted-foreground">{t('dash.waiting')}</p>
        </Card>
      )}

      {!online && !hasOrder && (
        <Card className="flex flex-col items-center gap-2 p-8 text-center">
          <Power className="h-8 w-8 text-slate-300" aria-hidden />
          <p className="text-sm text-muted-foreground">{locale === 'vi' ? 'Bạn đang ngoại tuyến.' : 'You are offline.'}</p>
        </Card>
      )}
    </div>
  );
}
