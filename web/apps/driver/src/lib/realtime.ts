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
        typeof window !== 'undefined' ? localStorage.getItem('driver_token') : null;
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

const DISPATCH_EVENTS = ['driver:new_order', 'driver:order_assigned'] as const;

/**
 * Subscribes to the authenticated driver's dispatch channel.
 * - Socket.IO mode: joins the `/dispatch` namespace; the server authenticates
 *   the JWT, enforces the driver role, and rooms the socket on `driver:{id}`.
 * - Supabase mode: subscribes to `private:driver:{driverId}` with a scoped
 *   token from POST /realtime/token.
 * Accept/reject always goes through the REST respond endpoint — realtime is
 * only the offer delivery channel.
 */
export function subscribeDriverDispatch(
  driverId: string,
  handlers: {
    onEvent: (event: string, payload: Record<string, unknown>) => void;
    onState?: (state: ConnectionState) => void;
  },
): () => void {
  const key = `driver:${driverId}`;
  if (handlers.onState) listeners.set(key, handlers.onState);

  let release = () => {};
  let disposed = false;
  let provider: ReturnType<typeof resolveRealtimeProvider>;
  try {
    provider = resolveRealtimeProvider();
  } catch {
    // Misconfigured realtime — caller still gets offers via REST polling.
    notify(key, 'unavailable');
    return () => listeners.delete(key);
  }

  if (provider === 'supabase') {
    const adapter = createSupabaseSocketAdapter({
      channel: `private:driver:${driverId}`,
      fetchToken: async () => {
        const { api } = await import('@/lib/api');
        return api.post<{
          provider: 'supabase';
          token: string;
          expiresAt: string;
          channels: string[];
        }>('/realtime/token', {});
      },
    });
    wireStateEvents(key, adapter);
    const tracked = DISPATCH_EVENTS.map((event) => {
      const handler = (payload: unknown) =>
        handlers.onEvent(event, (payload ?? {}) as Record<string, unknown>);
      adapter.on(event, handler);
      return { event, handler };
    });
    release = () => tracked.forEach(({ event, handler }) => adapter.off(event, handler));
    sockets.set(key, adapter);
  } else {
    const socket = (sockets.get('/dispatch') as Socket) ?? makeSocket('/dispatch');
    sockets.set('/dispatch', socket);
    wireStateEvents(key, socket);

    const tracked = DISPATCH_EVENTS.map((event) => {
      const handler = (payload: unknown) => {
        if (disposed) return;
        handlers.onEvent(event, (payload ?? {}) as Record<string, unknown>);
      };
      socket.on(event, handler);
      return { event, handler };
    });
    release = () => tracked.forEach(({ event, handler }) => socket.off(event, handler));

    if (!socket.connected) socket.connect();
    notify(key, 'connecting');
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
