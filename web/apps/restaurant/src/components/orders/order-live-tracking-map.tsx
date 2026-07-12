'use client';

import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import type { DeliveryRoutePhase, OrderTrackingResponse } from '@foodflow/api-client';
import { AlertTriangle, Clock3, LocateFixed, MapPin, Navigation, RefreshCw, Route, Wifi, WifiOff } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import {
  OrderTrackingMapCanvas,
  type DeliveryLatLng,
} from '@/components/orders/order-tracking-map-canvas';
import { api } from '@/lib/api';
import { resolvePublicMapConfig } from '@/lib/map-config';
import {
  connectToTrackingOrder,
  leaveTrackingOrder,
  type DeliveryEtaUpdatedEvent,
  type DriverLocationChangedEvent,
} from '@/lib/tracking-socket';
import { cn } from '@/lib/utils';
import type { OrderStatus } from '@/lib/types';

const MAP_CONFIG = resolvePublicMapConfig();
const DEFAULT_CENTER = { lat: 14.0583, lng: 108.2772 };
const DEFAULT_ZOOM = 6;
const VIETNAM_BOUNDS = {
  minLat: 8.18,
  maxLat: 23.4,
  minLng: 102.14,
  maxLng: 109.47,
} as const;
const ACTIVE_TRACKING_STATUSES = new Set<OrderStatus>([
  'driver_assigned',
  'driver_arriving_restaurant',
  'picked_up',
  'delivering',
]);

type TrackingConnectionStatus = 'connecting' | 'connected' | 'disconnected';

interface OrderLiveTrackingMapProps {
  orderId: string;
  orderStatus: OrderStatus;
  customerAddress: string;
}

export function shouldShowOrderLiveTracking(status: OrderStatus): boolean {
  return ACTIVE_TRACKING_STATUSES.has(status);
}

export function OrderLiveTrackingMap({ orderId, orderStatus, customerAddress }: OrderLiveTrackingMapProps) {
  const t = useTranslations('orderDetail.tracking');
  const locale = useLocale();
  const [tracking, setTracking] = useState<OrderTrackingResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [connectionStatus, setConnectionStatus] = useState<TrackingConnectionStatus>('connecting');

  const loadTracking = useCallback(async (options: { background?: boolean } = {}) => {
    if (!options.background) setIsLoading(true);
    try {
      const snapshot = await api.get<OrderTrackingResponse>(`/orders/${orderId}/tracking`);
      setTracking(snapshot);
      setError('');
    } catch (err) {
      setError(err instanceof Error ? err.message : t('loadError'));
      if (!options.background) setTracking(null);
    } finally {
      if (!options.background) setIsLoading(false);
    }
  }, [orderId, t]);

  useEffect(() => {
    void loadTracking();
  }, [loadTracking]);

  const applyDriverLocation = useCallback((event: DriverLocationChangedEvent) => {
    if (event.orderId !== orderId || !isValidDeliveryLatLng(event.lat, event.lng)) return;

    setTracking((prev) => {
      if (!prev) {
        void loadTracking({ background: true });
        return prev;
      }
      return {
        ...prev,
        driverLocation: {
          lat: event.lat,
          lng: event.lng,
          lastUpdated: event.timestamp,
        },
      };
    });
  }, [loadTracking, orderId]);

  const applyEtaUpdate = useCallback((event: DeliveryEtaUpdatedEvent) => {
    if (event.orderId !== orderId) return;

    setTracking((prev) => {
      if (!prev) {
        void loadTracking({ background: true });
        return prev;
      }
      return {
        ...prev,
        etaMinutes: event.etaMinutes,
        routePolyline: event.routePolyline,
        routePhase: event.routePhase,
      };
    });
  }, [loadTracking, orderId]);

  useEffect(() => {
    const socket = connectToTrackingOrder(orderId);
    const subscribe = () => {
      setConnectionStatus('connected');
      socket.emit('order:subscribe', { orderId });
    };
    const markDisconnected = () => setConnectionStatus('disconnected');
    const markConnecting = () => setConnectionStatus('connecting');

    setConnectionStatus(socket.connected ? 'connected' : 'connecting');
    socket.on('connect', subscribe);
    socket.on('disconnect', markDisconnected);
    socket.io.on('reconnect_attempt', markConnecting);
    socket.on('driver:location_changed', applyDriverLocation);
    socket.on('delivery:eta_updated', applyEtaUpdate);

    return () => {
      socket.off('connect', subscribe);
      socket.off('disconnect', markDisconnected);
      socket.io.off('reconnect_attempt', markConnecting);
      socket.off('driver:location_changed', applyDriverLocation);
      socket.off('delivery:eta_updated', applyEtaUpdate);
      leaveTrackingOrder(orderId);
    };
  }, [applyDriverLocation, applyEtaUpdate, orderId]);

  const timeFormatter = useMemo(() => new Intl.DateTimeFormat(locale, {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  }), [locale]);

  const formatTimestamp = useCallback((value: string | null | undefined) => {
    if (!value) return t('unavailable');
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return t('unavailable');
    return timeFormatter.format(date);
  }, [t, timeFormatter]);

  const routePoints = useMemo(
    () => decodeEncodedPolyline(tracking?.routePolyline ?? null),
    [tracking?.routePolyline],
  );
  const hasDriverLocation = Boolean(tracking?.driverLocation);
  const hasRoute = routePoints.length > 1;
  const mapCenter = tracking?.driverLocation
    ? { lat: tracking.driverLocation.lat, lng: tracking.driverLocation.lng }
    : routePoints[0] ?? DEFAULT_CENTER;
  const routePhase = tracking?.routePhase ?? phaseFromStatus(orderStatus);

  return (
    <section className="card overflow-hidden" aria-labelledby="order-live-tracking-title" data-testid="order-live-tracking-map">
      <div className="flex flex-col gap-3 border-b border-gray-100 p-5 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-100 text-brand-700">
              <Navigation className="h-4 w-4" aria-hidden="true" />
            </span>
            <div>
              <h2 id="order-live-tracking-title" className="text-base font-semibold text-gray-900">
                {t('title')}
              </h2>
              <p className="text-sm text-gray-500">{t('description')}</p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <span className={cn(
            'inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium',
            connectionStatus === 'connected'
              ? 'bg-green-50 text-green-700'
              : connectionStatus === 'connecting'
                ? 'bg-amber-50 text-amber-700'
                : 'bg-red-50 text-red-700',
          )}>
            {connectionStatus === 'connected' ? <Wifi className="h-3.5 w-3.5" /> : <WifiOff className="h-3.5 w-3.5" />}
            {t(`connection.${connectionStatus}`)}
          </span>
          <button
            type="button"
            onClick={() => void loadTracking()}
            disabled={isLoading}
            className="btn-secondary h-8 px-3 text-xs"
          >
            <RefreshCw className={cn('mr-1.5 h-3.5 w-3.5', isLoading && 'animate-spin')} />
            {t('refresh')}
          </button>
        </div>
      </div>

      <div className="grid gap-0 lg:grid-cols-[minmax(0,1fr)_280px]">
        <div
          role="region"
          aria-label={t('mapRegionLabel')}
          className="relative min-h-[360px] bg-gray-50"
        >
          <OrderTrackingMapCanvas
            driverLocation={tracking?.driverLocation ?? null}
            routePoints={routePoints}
            initialCenter={mapCenter}
            initialZoom={hasDriverLocation || hasRoute ? 13 : DEFAULT_ZOOM}
            styleUrl={MAP_CONFIG.styleUrl}
            loadingLabel={t('mapLoading')}
            errorTitle={t('mapErrorTitle')}
            errorDescription={t('mapErrorDescription')}
            driverMarkerLabel={t('driverMarkerLabel')}
          />

          {!hasDriverLocation && !hasRoute ? (
            <div className="absolute inset-x-4 bottom-4 rounded-xl border border-amber-200 bg-white/95 p-3 text-sm text-amber-800 shadow-sm backdrop-blur">
              <AlertTriangle className="mr-1.5 inline h-4 w-4" aria-hidden="true" />
              {t('telemetryUnavailable')}
            </div>
          ) : null}
        </div>

        <div className="space-y-4 border-t border-gray-100 p-5 lg:border-l lg:border-t-0">
          {isLoading ? (
            <TrackingSkeleton label={t('loading')} />
          ) : error ? (
            <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
              <p className="font-medium">{t('loadError')}</p>
              <p className="mt-1 break-words text-xs">{error}</p>
            </div>
          ) : tracking ? (
            <>
              <MetricRow
                icon={<Clock3 className="h-4 w-4" />}
                label={t('etaLabel')}
                value={tracking.etaMinutes != null ? t('etaMinutes', { minutes: tracking.etaMinutes }) : t('etaUnavailable')}
              />
              <MetricRow
                icon={<Route className="h-4 w-4" />}
                label={t('routePhaseLabel')}
                value={t(`phase.${routePhase}`)}
              />
              <MetricRow
                icon={<LocateFixed className="h-4 w-4" />}
                label={t('driverLocationLabel')}
                value={hasDriverLocation ? t('locationAvailable') : t('locationUnavailable')}
              />
              <MetricRow
                icon={<MapPin className="h-4 w-4" />}
                label={t('customerAddressLabel')}
                value={customerAddress || t('unavailable')}
              />
              <div className="rounded-xl bg-gray-50 p-3 text-xs text-gray-500">
                {hasRoute ? t('routeAvailable') : t('routeUnavailable')}
              </div>
            </>
          ) : (
            <div className="rounded-xl border border-dashed border-gray-200 bg-gray-50 p-4 text-sm text-gray-500">
              {t('noSnapshotDescription')}
            </div>
          )}

          <div className="border-t border-gray-100 pt-4 text-xs text-gray-500">
            {t('driverLocationUpdated', { time: formatTimestamp(tracking?.driverLocation?.lastUpdated) })}
          </div>
        </div>
      </div>
    </section>
  );
}

function MetricRow({
  icon,
  label,
  value,
}: {
  icon: ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex gap-3">
      <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-700">
        {icon}
      </span>
      <div>
        <p className="text-xs uppercase tracking-wide text-gray-400">{label}</p>
        <p className="mt-0.5 text-sm font-medium text-gray-900">{value}</p>
      </div>
    </div>
  );
}

function TrackingSkeleton({ label }: { label: string }) {
  return (
    <div role="status" aria-label={label} className="space-y-3">
      <div className="h-10 rounded-xl skeleton" />
      <div className="h-10 rounded-xl skeleton" />
      <div className="h-20 rounded-xl skeleton" />
    </div>
  );
}

function phaseFromStatus(status: OrderStatus): DeliveryRoutePhase {
  return status === 'driver_assigned' || status === 'driver_arriving_restaurant'
    ? 'pickup'
    : 'dropoff';
}

function isValidDeliveryLatLng(lat: number, lng: number): boolean {
  return Number.isFinite(lat) &&
    Number.isFinite(lng) &&
    lat >= VIETNAM_BOUNDS.minLat &&
    lat <= VIETNAM_BOUNDS.maxLat &&
    lng >= VIETNAM_BOUNDS.minLng &&
    lng <= VIETNAM_BOUNDS.maxLng &&
    !(lat === 0 && lng === 0);
}

export function decodeEncodedPolyline(encoded: string | null): DeliveryLatLng[] {
  if (!encoded) return [];
  const points: DeliveryLatLng[] = [];
  let index = 0;
  let lat = 0;
  let lng = 0;

  while (index < encoded.length) {
    const latResult = decodePolylineCoordinate(encoded, index);
    if (!latResult) return [];
    index = latResult.nextIndex;
    lat += latResult.delta;

    const lngResult = decodePolylineCoordinate(encoded, index);
    if (!lngResult) return [];
    index = lngResult.nextIndex;
    lng += lngResult.delta;

    const point = { lat: lat / 1e5, lng: lng / 1e5 };
    if (isValidDeliveryLatLng(point.lat, point.lng)) points.push(point);
  }

  return points;
}

function decodePolylineCoordinate(
  encoded: string,
  startIndex: number,
): { delta: number; nextIndex: number } | null {
  let result = 0;
  let shift = 0;
  let index = startIndex;
  let byte: number;

  do {
    if (index >= encoded.length) return null;
    byte = encoded.charCodeAt(index++) - 63;
    if (byte < 0) return null;
    result |= (byte & 0x1f) << shift;
    shift += 5;
  } while (byte >= 0x20);

  return {
    delta: (result & 1) ? ~(result >> 1) : (result >> 1),
    nextIndex: index,
  };
}
