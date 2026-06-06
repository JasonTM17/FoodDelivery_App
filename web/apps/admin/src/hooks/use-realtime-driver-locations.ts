'use client';

import { useState, useEffect } from 'react';
import { getSocket } from '@/lib/socket';

export interface DriverLocation {
  id: string;
  name: string;
  rating: number;
  status: 'online' | 'free' | 'delivering' | 'busy';
  lat: number;
  lng: number;
  currentOrder?: string;
  vehicleType?: string;
}

export function useRealtimeDriverLocations(): DriverLocation[] {
  const [drivers, setDrivers] = useState<DriverLocation[]>([]);

  useEffect(() => {
    const socket = getSocket();
    socket.emit('subscribe:drivers:all');

    socket.on('drivers:locations', (locations: DriverLocation[]) => {
      setDrivers(locations);
    });

    socket.on('driver:location:update', (update: DriverLocation) => {
      setDrivers((prev) => {
        const idx = prev.findIndex((d) => d.id === update.id);
        if (idx >= 0) {
          const next = [...prev];
          next[idx] = update;
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

  return drivers;
}
