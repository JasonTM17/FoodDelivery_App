'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import type { AdminDriverLocation } from '@foodflow/api-client';
import { apiGet } from '@/lib/api';
import { getSocket } from '@/lib/socket';

export type DriverMapConnectionStatus = 'connecting' | 'connected' | 'disconnected';
export type DriverLocation = AdminDriverLocation;

interface DriverLocationChangedEvent {
  driverId: string;
  lat: number;
  lng: number;
  orderId?: string | null;
  status?: DriverLocation['status'];
  timestamp?: string;
}

export interface DriverLocationsState {
  drivers: DriverLocation[];
  isLoading: boolean;
  error: string | null;
  connectionStatus: DriverMapConnectionStatus;
  isFallbackPolling: boolean;
  lastUpdatedAt: string | null;
  refetch: () => Promise<void>;
}

const fallbackPollingIntervalMs = 15_000;

export function useRealtimeDriverLocations(): DriverLocationsState {
  const [drivers, setDrivers] = useState<DriverLocation[]>([]);
  const driversRef = useRef<DriverLocation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<DriverMapConnectionStatus>('connecting');
  const [lastUpdatedAt, setLastUpdatedAt] = useState<string | null>(null);

  const loadDrivers = useCallback(async (options: { background?: boolean } = {}) => {
    setError(null);
    if (!options.background) setIsLoading(true);
    try {
      const locations = await apiGet<DriverLocation[]>('/admin/online-drivers');
      setDrivers(locations);
      setLastUpdatedAt(new Date().toISOString());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'DRIVER_MAP_LOAD_FAILED');
    } finally {
      if (!options.background) setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    driversRef.current = drivers;
  }, [drivers]);

  const applyLocationUpdate = useCallback((update: DriverLocationChangedEvent) => {
    const existingDriver = driversRef.current.find(
      (driver) => driver.id === update.driverId || driver.driverId === update.driverId,
    );
    if (!existingDriver) {
      void loadDrivers({ background: true });
      return;
    }

    setDrivers((prev) => {
      const index = prev.findIndex(
        (driver) => driver.id === update.driverId || driver.driverId === update.driverId,
      );
      if (index < 0) return prev;

      const next = [...prev];
      next[index] = {
        ...next[index],
        lat: update.lat,
        lng: update.lng,
        currentOrder: update.orderId ?? next[index].currentOrder,
        status: update.status ?? next[index].status,
        lastSeenAt: update.timestamp ?? new Date().toISOString(),
      };
      return next;
    });
    setLastUpdatedAt(update.timestamp ?? new Date().toISOString());
  }, [loadDrivers]);

  useEffect(() => {
    void loadDrivers();
  }, [loadDrivers]);

  useEffect(() => {
    const socket = getSocket();
    const subscribe = () => {
      setConnectionStatus('connected');
      socket.emit('admin:subscribe_drivers');
    };
    const disconnect = () => setConnectionStatus('disconnected');
    const reconnecting = () => setConnectionStatus('connecting');

    if (socket.connected) subscribe();
    else setConnectionStatus('connecting');

    socket.on('connect', subscribe);
    socket.on('disconnect', disconnect);
    socket.io.on('reconnect_attempt', reconnecting);
    socket.on('admin:driver_location_changed', applyLocationUpdate);

    return () => {
      socket.emit('admin:unsubscribe_drivers');
      socket.off('connect', subscribe);
      socket.off('disconnect', disconnect);
      socket.io.off('reconnect_attempt', reconnecting);
      socket.off('admin:driver_location_changed', applyLocationUpdate);
    };
  }, [applyLocationUpdate]);

  useEffect(() => {
    if (connectionStatus === 'connected') return undefined;
    const interval = window.setInterval(() => {
      void loadDrivers({ background: true });
    }, fallbackPollingIntervalMs);
    return () => window.clearInterval(interval);
  }, [connectionStatus, loadDrivers]);

  return {
    drivers,
    isLoading,
    error,
    connectionStatus,
    isFallbackPolling: connectionStatus !== 'connected',
    lastUpdatedAt,
    refetch: () => loadDrivers(),
  };
}
