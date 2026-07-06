'use client';

import { io, type Socket } from 'socket.io-client';
import type { DeliveryRoutePhase } from '@foodflow/api-client';
import { assertProductionPublicUrl, isProductionDeployment } from './public-env';

let trackingSocket: Socket<TrackingServerToClientEvents, TrackingClientToServerEvents> | null = null;

export function resolveTrackingSocketUrl(): string {
  const configured =
    process.env.NEXT_PUBLIC_WS_URL?.trim() ||
    process.env.NEXT_PUBLIC_SOCKET_URL?.trim();

  if (!configured) {
    if (isProductionDeployment(process.env)) {
      throw new Error('NEXT_PUBLIC_WS_URL is required for the restaurant tracking socket');
    }
    return 'http://localhost:3001/tracking';
  }

  const normalized = assertProductionPublicUrl(
    'NEXT_PUBLIC_WS_URL',
    configured,
    process.env,
    ['https:', 'wss:'],
  ).replace(/\/+$/, '');
  const base = normalized.endsWith('/events')
    ? normalized.slice(0, -'/events'.length)
    : normalized;
  return base.endsWith('/tracking') ? base : `${base}/tracking`;
}

export function getTrackingSocket(): Socket<TrackingServerToClientEvents, TrackingClientToServerEvents> {
  if (!trackingSocket) {
    trackingSocket = io(resolveTrackingSocketUrl(), {
      autoConnect: false,
      transports: ['websocket', 'polling'],
      auth: callback => {
        const token = typeof window !== 'undefined'
          ? localStorage.getItem('restaurant_token')
          : null;
        callback({ token });
      },
    }) as Socket<TrackingServerToClientEvents, TrackingClientToServerEvents>;
  }
  return trackingSocket;
}

export function connectToTrackingOrder(orderId: string): Socket<TrackingServerToClientEvents, TrackingClientToServerEvents> {
  const socket = getTrackingSocket();
  if (!socket.connected) socket.connect();
  socket.emit('order:subscribe', { orderId });
  return socket;
}

export function leaveTrackingOrder(orderId: string): void {
  trackingSocket?.emit('order:unsubscribe', { orderId });
}

export function disconnectTrackingSocket(): void {
  if (trackingSocket) {
    trackingSocket.removeAllListeners();
    trackingSocket.disconnect();
    trackingSocket = null;
  }
}

export interface DriverLocationChangedEvent {
  orderId: string;
  driverId: string;
  lat: number;
  lng: number;
  bearing: number | null;
  timestamp: string;
}

export interface DeliveryEtaUpdatedEvent {
  orderId: string;
  etaMinutes: number | null;
  source: string;
  degraded: boolean;
  routePolyline: string | null;
  routePhase: DeliveryRoutePhase;
}

export interface TrackingServerToClientEvents {
  'driver:location_changed': (event: DriverLocationChangedEvent) => void;
  'delivery:eta_updated': (event: DeliveryEtaUpdatedEvent) => void;
}

export interface TrackingClientToServerEvents {
  'order:subscribe': (payload: { orderId: string }) => void;
  'order:unsubscribe': (payload: { orderId: string }) => void;
}
