'use client';

import { useState } from 'react';
import { APIProvider, Map } from '@vis.gl/react-google-maps';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useRealtimeDriverLocations, type DriverLocation } from '@/hooks/use-realtime-driver-locations';
import DriverMarkers from '@/components/markers/driver-markers';
import DriverListSidebar from './driver-list-sidebar';
import { Star, Car, MapPin, Navigation } from 'lucide-react';

const GOOGLE_MAPS_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY || '';
const VIETNAM_BOUNDS = { north: 23.5, south: 3.8, west: 102.0, east: 117.5 };
const VIETNAM_CENTER = { lat: 14.0, lng: 108.0 };
const VIETNAM_DEFAULT_ZOOM = 6;

const statusLabels: Record<string, string> = {
  online: 'Rảnh',
  free: 'Rảnh',
  delivering: 'Đang giao',
  busy: 'Bận',
};

function DriverInfoWindow({ driver }: { driver: DriverLocation }) {
  return (
    <div className="min-w-[200px] space-y-2 p-1">
      <div className="flex items-center gap-2">
        <Avatar className="h-8 w-8">
          <AvatarFallback className="bg-primary/10 text-xs">
            {driver.name.charAt(0).toUpperCase()}
          </AvatarFallback>
        </Avatar>
        <div>
          <p className="font-medium text-sm">{driver.name}</p>
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
              : 'destructive'
          }
          className="text-[10px]"
        >
          {statusLabels[driver.status] || driver.status}
        </Badge>
        {driver.vehicleType && (
          <span className="text-muted-foreground flex items-center gap-1">
            <Car className="h-3 w-3" />{driver.vehicleType}
          </span>
        )}
      </div>
      {driver.currentOrder && (
        <p className="text-xs text-muted-foreground">
          <Navigation className="mr-1 inline h-3 w-3" />
          Đơn: {driver.currentOrder}
        </p>
      )}
    </div>
  );
}

export default function DriverMapPage() {
  const drivers = useRealtimeDriverLocations();
  const [selectedDriver, setSelectedDriver] = useState<DriverLocation | null>(null);

  return (
    <div className="flex h-[calc(100vh-8rem)] gap-4">
      <DriverListSidebar
        drivers={drivers}
        selectedDriverId={selectedDriver?.id}
        onSelect={setSelectedDriver}
      />

      <div className="flex-1 overflow-hidden rounded-lg border">
        {GOOGLE_MAPS_KEY ? (
          <APIProvider apiKey={GOOGLE_MAPS_KEY}>
            <Map
              mapId="foodflow-driver-map"
              defaultZoom={VIETNAM_DEFAULT_ZOOM}
              defaultCenter={VIETNAM_CENTER}
              style={{ width: '100%', height: '100%' }}
              restriction={{ latLngBounds: VIETNAM_BOUNDS, strictBounds: false }}
            >
              <DriverMarkers drivers={drivers} />
            </Map>
          </APIProvider>
        ) : (
          <div className="flex h-full items-center justify-center bg-muted/30">
            <div className="text-center">
              <MapPin className="mx-auto h-12 w-12 text-muted-foreground/50" />
              <p className="mt-2 text-sm text-muted-foreground">
                Cần cấu hình NEXT_PUBLIC_GOOGLE_MAPS_KEY
              </p>
              <p className="text-xs text-muted-foreground/60">
                Thêm vào .env.local để hiển thị bản đồ
              </p>
            </div>
          </div>
        )}
      </div>

      {selectedDriver && (
        <Card className="absolute bottom-6 left-96 right-6 z-50 shadow-lg">
          <CardContent className="p-4">
            <DriverInfoWindow driver={selectedDriver} />
          </CardContent>
        </Card>
      )}
    </div>
  );
}
