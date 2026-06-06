'use client';

import { useEffect, useState, useRef, useMemo } from 'react';
import { APIProvider, Map, useMap } from '@vis.gl/react-google-maps';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { getSocket } from '@/lib/socket';
import { Star, Car, MapPin, Navigation } from 'lucide-react';

const GOOGLE_MAPS_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY || '';

/** Vietnam bounds including Hoàng Sa & Trường Sa archipelagos */
const VIETNAM_BOUNDS = {
  north: 23.5,
  south: 3.8,
  west: 102.0,
  east: 117.5,
};

const VIETNAM_CENTER = { lat: 14.0, lng: 108.0 };
const VIETNAM_DEFAULT_ZOOM = 6;

interface DriverLocation {
  id: string;
  name: string;
  rating: number;
  status: 'online' | 'free' | 'delivering' | 'busy';
  lat: number;
  lng: number;
  currentOrder?: string;
  vehicleType?: string;
}

const statusColors: Record<string, string> = {
  online: 'bg-green-500',
  free: 'bg-green-500',
  delivering: 'bg-orange-500',
  busy: 'bg-red-500',
};

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
            <Car className="h-3 w-3" />
            {driver.vehicleType}
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

function DriverMarkers({ drivers }: { drivers: DriverLocation[] }) {
  const map = useMap();
  const markersRef = useRef<google.maps.Marker[]>([]);
  const infoWindowRef = useRef<google.maps.InfoWindow | null>(null);
  const boundaryRef = useRef<google.maps.Data | null>(null);

  // Load Vietnam boundary GeoJSON with Hoàng Sa & Trường Sa
  useEffect(() => {
    if (!map) return;

    const dataLayer = new google.maps.Data();
    dataLayer.loadGeoJson('/data/vietnam-boundary.geojson');
    dataLayer.setStyle({
      fillColor: '#2ECC71',
      fillOpacity: 0.06,
      strokeColor: '#2ECC71',
      strokeWeight: 2,
      strokeOpacity: 0.5,
    });
    dataLayer.setMap(map);
    boundaryRef.current = dataLayer;

    return () => {
      dataLayer.setMap(null);
    };
  }, [map]);

  useEffect(() => {
    if (!map) return;
    infoWindowRef.current = new google.maps.InfoWindow();
    return () => {
      markersRef.current.forEach((m) => m.setMap(null));
      markersRef.current = [];
    };
  }, [map]);

  useEffect(() => {
    if (!map || !infoWindowRef.current) return;

    markersRef.current.forEach((m) => m.setMap(null));

    const newMarkers = drivers.map((driver) => {
      const color = statusColors[driver.status] || '#22c55e';

      const marker = new google.maps.Marker({
        map,
        position: { lat: driver.lat, lng: driver.lng },
        title: driver.name,
        icon: {
          path: google.maps.SymbolPath.CIRCLE,
          scale: 10,
          fillColor: color,
          fillOpacity: 1,
          strokeColor: '#ffffff',
          strokeWeight: 2,
        },
      });

      marker.addListener('click', () => {
        if (infoWindowRef.current) {
          infoWindowRef.current.setContent(
            `<div class="min-w-[180px] p-2 text-sm"><strong>${driver.name}</strong><br/>Rating: ${driver.rating.toFixed(1)}<br/>Status: ${statusLabels[driver.status] || driver.status}${driver.currentOrder ? `<br/>Order: ${driver.currentOrder}` : ''}</div>`
          );
          infoWindowRef.current.open(map, marker);
        }
      });

      return marker;
    });

    markersRef.current = newMarkers;

    return () => {
      newMarkers.forEach((m) => m.setMap(null));
    };
  }, [map, drivers]);

  return null;
}

export default function DriverMapPage() {
  const [drivers, setDrivers] = useState<DriverLocation[]>([]);
  const [selectedDriver, setSelectedDriver] = useState<DriverLocation | null>(null);

  useEffect(() => {
    const socket = getSocket();

    socket.emit('subscribe:drivers:all');

    socket.on('drivers:locations', (locations: DriverLocation[]) => {
      setDrivers(locations);
    });

    socket.on('driver:location:update', (update: DriverLocation) => {
      setDrivers((prev) => {
        const existing = prev.findIndex((d) => d.id === update.id);
        if (existing >= 0) {
          const next = [...prev];
          next[existing] = update;
          return next;
        }
        return [...prev, update];
      });
    });

    socket.on('driver:offline', (driverId: string) => {
      setDrivers((prev) => prev.filter((d) => d.id !== driverId));
    });

    return () => {
      socket.emit('unsubscribe:drivers:all');
      socket.off('drivers:locations');
      socket.off('driver:location:update');
      socket.off('driver:offline');
    };
  }, []);

  return (
    <div className="flex h-[calc(100vh-8rem)] gap-4">
      <Card className="w-80 flex-shrink-0">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <MapPin className="h-4 w-4 text-primary" />
            Tài xế trực tuyến
          </CardTitle>
          <p className="text-xs text-muted-foreground">
            {drivers.length} tài xế đang hoạt động
          </p>
        </CardHeader>
        <CardContent className="p-0">
          <ScrollArea className="h-[calc(100vh-16rem)]">
            <div className="divide-y px-3">
              {drivers.length === 0 ? (
                <p className="py-8 text-center text-sm text-muted-foreground">
                  Không có tài xế nào trực tuyến
                </p>
              ) : (
                drivers.map((driver) => (
                  <button
                    key={driver.id}
                    className={`flex w-full items-center gap-3 py-3 text-left transition-colors hover:bg-muted/50 ${
                      selectedDriver?.id === driver.id ? 'bg-muted' : ''
                    }`}
                    onClick={() => setSelectedDriver(driver)}
                  >
                    <div className="relative">
                      <Avatar className="h-10 w-10">
                        <AvatarFallback className="bg-primary/10 text-xs">
                          {driver.name.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <span
                        className={`absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-white ${
                          statusColors[driver.status] || 'bg-gray-400'
                        }`}
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{driver.name}</p>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span className="flex items-center gap-0.5">
                          <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                          {driver.rating.toFixed(1)}
                        </span>
                        <span>{statusLabels[driver.status] || driver.status}</span>
                      </div>
                    </div>
                  </button>
                ))
              )}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>

      <div className="flex-1 overflow-hidden rounded-lg border">
        {GOOGLE_MAPS_KEY ? (
          <APIProvider apiKey={GOOGLE_MAPS_KEY}>
            <Map
              mapId="foodflow-driver-map"
              defaultZoom={VIETNAM_DEFAULT_ZOOM}
              defaultCenter={VIETNAM_CENTER}
              style={{ width: '100%', height: '100%' }}
              restriction={{
                latLngBounds: VIETNAM_BOUNDS,
                strictBounds: false,
              }}
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
