'use client';

import { io, type Socket } from 'socket.io-client';
import type { RestaurantOrderChatMessage } from '@foodflow/api-client';
import { assertProductionPublicUrl, isProductionDeployment } from './public-env';
import { createSupabaseSocketAdapter, resolveRealtimeProvider, type SupabaseSocketAdapter } from './supabase-realtime';
import type { Order, OrderStatus } from './types';

let socket: Socket<ServerToClientEvents, ClientToServerEvents> | SupabaseSocketAdapter | null = null;
const supabaseSockets = new Map<string, SupabaseSocketAdapter>();

export function resolveEventsSocketUrl(): string {
  const configured = process.env.NEXT_PUBLIC_WS_URL?.trim();

  if (!configured) {
    if (isProductionDeployment(process.env)) {
      throw new Error('NEXT_PUBLIC_WS_URL is required for the restaurant realtime socket');
    }
    return 'http://localhost:3001/events';
  }

  const normalized = assertProductionPublicUrl(
    'NEXT_PUBLIC_WS_URL',
    configured,
    process.env,
    ['https:', 'wss:'],
  ).replace(/\/+$/, '');
  return normalized.endsWith('/events') ? normalized : `${normalized}/events`;
}

export function getSocket(): Socket<ServerToClientEvents, ClientToServerEvents> {
  if (!socket) {
    if (resolveRealtimeProvider() === 'supabase') {
      throw new Error('Use connectToRestaurant or connectToOrder for Supabase realtime scopes');
    }
    socket = io(resolveEventsSocketUrl(), {
      autoConnect: false,
      transports: ['websocket', 'polling'],
      auth: callback => {
        const token = typeof window !== 'undefined'
          ? localStorage.getItem('restaurant_token')
          : null;
        callback({ token });
      },
    }) as Socket<ServerToClientEvents, ClientToServerEvents>;
  }
  return socket as Socket<ServerToClientEvents, ClientToServerEvents>;
}

export function connectToRestaurant(restaurantId: string): Socket<ServerToClientEvents, ClientToServerEvents> {
  if (resolveRealtimeProvider() === 'supabase') {
    const channel = `private:restaurant:${restaurantId}`;
    const adapter = supabaseSockets.get(channel) ?? createSupabaseSocketAdapter({
      channel,
      scope: { restaurantId },
    });
    supabaseSockets.set(channel, adapter);
    return adapter as unknown as Socket<ServerToClientEvents, ClientToServerEvents>;
  }
  const s = getSocket();
  if (!s.connected) s.connect();
  s.emit('restaurant:subscribe', { restaurantId });
  return s;
}

export function leaveRestaurant(restaurantId: string): void {
  if (resolveRealtimeProvider() === 'supabase') {
    const channel = `private:restaurant:${restaurantId}`;
    supabaseSockets.get(channel)?.disconnect();
    supabaseSockets.delete(channel);
    return;
  }
  socket?.emit('restaurant:unsubscribe', { restaurantId });
}

export function connectToOrder(orderId: string): Socket<ServerToClientEvents, ClientToServerEvents> {
  if (resolveRealtimeProvider() === 'supabase') {
    const channel = `private:order:${orderId}:restaurant-driver`;
    const adapter = supabaseSockets.get(channel) ?? createSupabaseSocketAdapter({
      channel,
      scope: { orderId },
    });
    supabaseSockets.set(channel, adapter);
    return adapter as unknown as Socket<ServerToClientEvents, ClientToServerEvents>;
  }
  const s = getSocket();
  if (!s.connected) s.connect();
  s.emit('order:subscribe', { orderId });
  return s;
}

export function leaveOrder(orderId: string): void {
  if (resolveRealtimeProvider() === 'supabase') {
    const channel = `private:order:${orderId}:restaurant-driver`;
    supabaseSockets.get(channel)?.disconnect();
    supabaseSockets.delete(channel);
    return;
  }
  socket?.emit('order:unsubscribe', { orderId });
}

export function disconnectSocket(): void {
  supabaseSockets.forEach(adapter => adapter.disconnect());
  supabaseSockets.clear();
  if (socket) {
    socket.removeAllListeners();
    socket.disconnect();
    socket = null;
  }
}

export function playNewOrderSound(): void {
  try {
    const audioCtx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
    const oscillator = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioCtx.destination);

    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(880, audioCtx.currentTime);
    oscillator.frequency.setValueAtTime(1100, audioCtx.currentTime + 0.1);
    oscillator.frequency.setValueAtTime(1320, audioCtx.currentTime + 0.2);

    gainNode.gain.setValueAtTime(0.3, audioCtx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.5);

    oscillator.start(audioCtx.currentTime);
    oscillator.stop(audioCtx.currentTime + 0.5);
  } catch {
    // Audio playback can be unavailable until the user interacts with the page.
  }
}

export type OrderChatMessageEvent = RestaurantOrderChatMessage & { orderId: string };

export interface ServerToClientEvents {
  'restaurant:new_order': (order: Partial<Order> & { orderId?: string }) => void;
  'order:status:changed': (event: { orderId: string; status: OrderStatus; timestamp: string }) => void;
  'order:message_created': (message: OrderChatMessageEvent) => void;
}

export interface ClientToServerEvents {
  'restaurant:subscribe': (payload: { restaurantId: string }) => void;
  'restaurant:unsubscribe': (payload: { restaurantId: string }) => void;
  'order:subscribe': (payload: { orderId: string }) => void;
  'order:unsubscribe': (payload: { orderId: string }) => void;
}
