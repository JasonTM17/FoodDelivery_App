'use client';

import { io, type Socket } from 'socket.io-client';
import { assertProductionPublicUrl, isProductionDeployment } from './public-env';
import {
  createSupabaseSocketAdapter,
  resolveRealtimeProvider,
  type SupabaseSocketAdapter,
} from './supabase-realtime';

export type ConnectionState = 'connecting' | 'live' | 'offline' | 'unavailable';

type AnySocket = Socket | SupabaseSocketAdapter;

const sockets = new Map<string, AnySocket>();
const listeners = new Map<string, (state: ConnectionState) => void>();

export function realtimeConfigured(): boolean {
  try {
    resolveRealtimeProvider();
    return true;
  } catch {
    return false;
  }
}

export function resolveEventsSocketBaseUrl(): string {
  const configured = process.env.NEXT_PUBLIC_WS_URL?.trim();

  if (!configured) {
    if (isProductionDeployment(process.env)) {
      throw new Error('NEXT_PUBLIC_WS_URL is required for realtime updates');
    }
    return 'ws://localhost:3001';
  }

  return assertProductionPublicUrl('NEXT_PUBLIC_WS_URL', configured, process.env, [
    'https:',
    'wss:',
    'ws:',
    'http:',
  ]).replace(/\/+$/, '');
}

function makeSocket(namespace: string): Socket {
  const base = resolveEventsSocketBaseUrl();
  return io(`${base}${namespace}`, {
    autoConnect: false,
    transports: ['websocket', 'polling'],
    auth: (callback) => {
      const token =
        typeof window !== 'undefined' ? localStorage.getItem('customer_token') : null;
      callback({ token });
    },
  });
}

function notify(key: string, state: ConnectionState): void {
  listeners.get(key)?.(state);
}

function wireStateEvents(key: string, socket: AnySocket): void {
  socket.on('connect', () => notify(key, 'live'));
  socket.on('disconnect', () => notify(key, 'offline'));
  socket.on('connect_error', () => notify(key, 'offline'));
}

/**
 * Subscribes to the authenticated order channel. Supabase mode issues a scoped
 * realtime token through POST /realtime/token; local Socket.IO mode joins the
 * `order:{id}` room after server authentication (`auth:ready`).
 */
export function subscribeOrderChannel(
  orderId: string,
  handlers: {
    onEvent: (event: string, payload: Record<string, unknown>) => void;
    onState?: (state: ConnectionState) => void;
  },
): () => void {
  const key = `order:${orderId}`;
  if (handlers.onState) listeners.set(key, handlers.onState);

  let release = () => {};
  let disposed = false;
  let provider: ReturnType<typeof resolveRealtimeProvider>;
  try {
    provider = resolveRealtimeProvider();
  } catch {
    // Misconfigured realtime — caller can fall back to polling.
    notify(key, 'unavailable');
    return () => listeners.delete(key);
  }

  if (provider === 'supabase') {
    const adapter = createSupabaseSocketAdapter({
      channel: `private:order:${orderId}`,
      scope: { orderId },
      fetchToken: async (scope) => {
        const { api } = await import('@/lib/api');
        return api.post<{ provider: 'supabase'; token: string; expiresAt: string; channels: string[] }>(
          '/realtime/token',
          scope,
        );
      },
    });
    wireStateEvents(key, adapter);
    const tracked = [
      'order:status:changed',
      'driver:location_changed',
      'delivery:eta_updated',
      'driver:assigned',
    ];
    const trackedHandlers = tracked.map((event) => {
      const handler = (payload: unknown) =>
        handlers.onEvent(event, (payload ?? {}) as Record<string, unknown>);
      adapter.on(event, handler);
      return { event, handler };
    });
    release = () => trackedHandlers.forEach(({ event, handler }) => adapter.off(event, handler));
    sockets.set(key, adapter);
  } else {
    const eventsSocket = (sockets.get('/events') as Socket) ?? makeSocket('/events');
    const trackingSocket = (sockets.get('/tracking') as Socket) ?? makeSocket('/tracking');
    sockets.set('/events', eventsSocket);
    sockets.set('/tracking', trackingSocket);

    wireStateEvents(key, eventsSocket);

    const subscribed = { events: false, tracking: false };
    const subscribe = () => {
      if (disposed) return;
      if (!subscribed.events && eventsSocket.connected) {
        eventsSocket.emit('order:subscribe', { orderId });
        subscribed.events = true;
      }
      if (!subscribed.tracking && trackingSocket.connected) {
        trackingSocket.emit('order:subscribe', { orderId });
        subscribed.tracking = true;
      }
    };

    const onEventsReady = () => subscribe();
    const onTrackingReady = () => subscribe();
    eventsSocket.on('auth:ready', onEventsReady);
    trackingSocket.on('auth:ready', onTrackingReady);
    eventsSocket.on('connect', onEventsReady);
    trackingSocket.on('connect', onTrackingReady);

    const forward =
      (target: string) =>
      (payload: unknown) =>
        handlers.onEvent(target, (payload ?? {}) as Record<string, unknown>);

    const eventsHandlers = {
      'order:status:changed': forward('order:status:changed'),
      'driver:assigned': forward('driver:assigned'),
    };
    const trackingHandlers = {
      'driver:location_changed': forward('driver:location_changed'),
      'delivery:eta_updated': forward('delivery:eta_updated'),
    };
    Object.entries(eventsHandlers).forEach(([event, fn]) => eventsSocket.on(event, fn));
    Object.entries(trackingHandlers).forEach(([event, fn]) => trackingSocket.on(event, fn));

    if (!eventsSocket.connected) eventsSocket.connect();
    if (!trackingSocket.connected) trackingSocket.connect();
    subscribe();

    release = () => {
      eventsSocket.off('auth:ready', onEventsReady);
      trackingSocket.off('auth:ready', onTrackingReady);
      eventsSocket.off('connect', onEventsReady);
      trackingSocket.off('connect', onTrackingReady);
      Object.entries(eventsHandlers).forEach(([event, fn]) => eventsSocket.off(event, fn));
      Object.entries(trackingHandlers).forEach(([event, fn]) => trackingSocket.off(event, fn));
      eventsSocket.emit('order:unsubscribe', { orderId });
      trackingSocket.emit('order:unsubscribe', { orderId });
    };
  }

  return () => {
    disposed = true;
    listeners.delete(key);
    release();
    if (provider === 'supabase') {
      (sockets.get(key) as SupabaseSocketAdapter | undefined)?.disconnect();
      sockets.delete(key);
    }
  };
}

export function disconnectRealtime(): void {
  sockets.forEach((socket) => {
    if ('removeAllListeners' in socket && typeof socket.removeAllListeners === 'function') {
      socket.removeAllListeners();
    }
    socket.disconnect();
  });
  sockets.clear();
  listeners.clear();
}
