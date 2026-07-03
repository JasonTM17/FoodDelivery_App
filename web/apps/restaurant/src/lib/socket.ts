'use client';

import { io, type Socket } from 'socket.io-client';
import type { RestaurantOrderChatMessage } from '@foodflow/api-client';
import type { Order, OrderStatus } from './types';

const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3001';
const EVENTS_SOCKET_URL = SOCKET_URL.endsWith('/events') ? SOCKET_URL : `${SOCKET_URL}/events`;

let socket: Socket<ServerToClientEvents, ClientToServerEvents> | null = null;

export function getSocket(): Socket<ServerToClientEvents, ClientToServerEvents> {
  if (!socket) {
    socket = io(EVENTS_SOCKET_URL, {
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
  return socket;
}

export function connectToRestaurant(restaurantId: string): Socket<ServerToClientEvents, ClientToServerEvents> {
  const s = getSocket();
  if (!s.connected) s.connect();
  s.emit('restaurant:subscribe', { restaurantId });
  return s;
}

export function leaveRestaurant(restaurantId: string): void {
  socket?.emit('restaurant:unsubscribe', { restaurantId });
}

export function connectToOrder(orderId: string): Socket<ServerToClientEvents, ClientToServerEvents> {
  const s = getSocket();
  if (!s.connected) s.connect();
  s.emit('order:subscribe', { orderId });
  return s;
}

export function leaveOrder(orderId: string): void {
  socket?.emit('order:unsubscribe', { orderId });
}

export function disconnectSocket(): void {
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

export type OrderChatMessageEvent = RestaurantOrderChatMessage;

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
