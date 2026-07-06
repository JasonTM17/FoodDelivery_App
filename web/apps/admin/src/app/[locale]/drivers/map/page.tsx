'use client';

import { useCallback, useMemo, useState } from 'react';
import { APIProvider, Map } from '@vis.gl/react-google-maps';
import { useLocale, useTranslations } from 'next-intl';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import DriverMarkers from '@/components/markers/driver-markers';
import { useRealtimeDriverLocations, type DriverLocation } from '@/hooks/use-realtime-driver-locations';
import { resolveGoogleMapsApiKey } from '@/lib/google-maps-key';
import { Car, MapPin, Navigation, RefreshCw, Star, Wifi, WifiOff } from 'lucide-react';
import DriverListSidebar from './driver-list-sidebar';
import { findSelectedDriver } from './driver-map-selection';

const GOOGLE_MAPS_KEY = resolveGoogleMapsApiKey();
const VIETNAM_BOUNDS = { north: 23.5, south: 3.8, west: 102.0, east: 117.5 };
const VIETNAM_CENTER = { lat: 14.0, lng: 108.0 };
const VIETNAM_DEFAULT_ZOOM = 6;

function DriverInfoWindow({
  driver,
  statusLabels,
  orderLabel,
  lastSeenLabel,
  formatTimestamp,
}: {
  driver: DriverLocation;
  statusLabels: Record<DriverLocation['status'], string>;
  orderLabel: string;
  lastSeenLabel: string;
  formatTimestamp: (value: string) => string;
}) {
  return (
    <div className="min-w-[200px] space-y-2 p-1">
      <div className="flex items-center gap-2">
        <Avatar className="h-8 w-8">
          <AvatarFallback className="bg-primary/10 text-xs">
            {driver.name.charAt(0).toUpperCase()}
          </AvatarFallback>
        </Avatar>
        <div>
          <p className="text-sm font-medium">{driver.name}</p>
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
            {driver.rating.toFixed(1)}
          </div>
        </div>
      </div>
      <div className="flex items-center gap-2 text-xs">
        <Badge
          variant={
            driver.status === 'online' || driver.status === 'free'
              ? 'success'
              : driver.status === 'delivering'
                ? 'warning'
                : driver.status === 'busy'
                  ? 'destructive'
                  : 'secondary'
          }
          className="text-[10px]"
        >
          {statusLabels[driver.status]}
        </Badge>
        {driver.vehicleType ? (
          <span className="flex items-center gap-1 text-muted-foreground">
            <Car className="h-3 w-3" />
            {driver.vehicleType}
          </span>
        ) : null}
      </div>
      {driver.currentOrder ? (
        <p className="text-xs text-muted-foreground">
          <Navigation className="mr-1 inline h-3 w-3" />
          {orderLabel}: {driver.currentOrder}
        </p>
      ) : null}
      <p className="text-xs text-muted-foreground">
        {lastSeenLabel}: {formatTimestamp(driver.lastSeenAt)}
      </p>
    </div>
  );
}

export default function DriverMapPage() {
  const t = useTranslations('driverMap');
  const locale = useLocale();
  const { drivers, isLoading, error, connectionStatus, isFallbackPolling, lastRefreshedAt, refetch } = useRealtimeDriverLocations();
  const [selectedDriverId, setSelectedDriverId] = useState<string | null>(null);
  const selectedDriver = useMemo(
    () => findSelectedDriver(drivers, selectedDriverId),
    [drivers, selectedDriverId],
  );
  const handleSelectDriver = useCallback((driver: DriverLocation) => {
    setSelectedDriverId(driver.id);
  }, []);

  const statusLabels = useMemo<Record<DriverLocation['status'], string>>(() => ({
    online: t('status.online'),
    offline: t('status.offline'),
    free: t('status.free'),
    delivering: t('status.delivering'),
    busy: t('status.busy'),
  }), [t]);

  const markerCopy = useMemo(() => ({
    rating: t('info.rating'),
    status: t('info.status'),
    order: t('order'),
    vehicle: t('info.vehicle'),
    lastSeen: t('info.lastSeen'),
  }), [t]);

  const timeFormatter = useMemo(() => new Intl.DateTimeFormat(locale, {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  }), [locale]);

  const formatTimestamp = (value: string) => timeFormatter.format(new Date(value));

  return (
    <div className="flex h-[calc(100vh-8rem)] flex-col gap-4 lg:flex-row">
      <DriverListSidebar
        drivers={drivers}
        isLoading={isLoading}
        error={error}
        selectedDriverId={selectedDriver?.id}
        statusLabels={statusLabels}
        copy={{
          title: t('sidebarTitle'),
          activeCount: t('activeCount', { count: drivers.length }),
          empty: t('empty'),
          retry: t('retry'),
          lastSeen: t('lastSeen'),
        }}
        formatTimestamp={formatTimestamp}
        onSelect={handleSelectDriver}
        onRetry={() => void refetch()}
      />

      <div
        role="region"
        aria-label={t('mapRegionLabel')}
        className="relative min-h-[480px] flex-1 overflow-hidden rounded-lg border"
      >
        <div className="absolute right-4 top-4 z-10 flex flex-wrap items-center gap-2">
          <Badge variant={connectionStatus === 'connected' ? 'success' : 'secondary'} className="gap-1">
            {connectionStatus === 'connected' ? <Wifi className="h-3 w-3" /> : <WifiOff className="h-3 w-3" />}
            {t(`connection.${connectionStatus}`)}
          </Badge>
          {isFallbackPolling ? (
            <Badge variant="secondary" className="bg-background/90">
              {t('fallbackPolling')}
            </Badge>
          ) : null}
          {lastRefreshedAt ? (
            <Badge variant="outline" className="bg-background/90">
              {t('refreshedAt', { time: formatTimestamp(lastRefreshedAt) })}
            </Badge>
          ) : null}
          <Button variant="secondary" size="sm" onClick={() => void refetch()} disabled={isLoading}>
            <RefreshCw className={`mr-2 h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            {t('refresh')}
          </Button>
        </div>

        {GOOGLE_MAPS_KEY ? (
          <APIProvider apiKey={GOOGLE_MAPS_KEY}>
            <Map
              mapId="foodflow-driver-map"
              defaultZoom={VIETNAM_DEFAULT_ZOOM}
              defaultCenter={VIETNAM_CENTER}
              style={{ width: '100%', height: '100%' }}
              restriction={{ latLngBounds: VIETNAM_BOUNDS, strictBounds: false }}
            >
              <DriverMarkers
                drivers={drivers}
                statusLabels={statusLabels}
                selectedDriverId={selectedDriver?.id}
                copy={markerCopy}
                onSelect={handleSelectDriver}
              />
            </Map>
          </APIProvider>
        ) : (
          <div className="flex h-full items-center justify-center bg-muted/30 p-6">
            <div className="text-center">
              <MapPin className="mx-auto h-12 w-12 text-muted-foreground/50" />
              <p className="mt-2 text-sm text-muted-foreground">{t('missingKeyTitle')}</p>
              <p className="text-xs text-muted-foreground/60">{t('missingKeyDescription')}</p>
            </div>
          </div>
        )}
      </div>

      {selectedDriver ? (
        <Card className="fixed bottom-6 left-6 right-6 z-50 shadow-lg lg:left-96">
          <CardContent className="p-4">
            <DriverInfoWindow
              driver={selectedDriver}
              statusLabels={statusLabels}
              orderLabel={t('order')}
              lastSeenLabel={t('lastSeen')}
              formatTimestamp={formatTimestamp}
            />
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
