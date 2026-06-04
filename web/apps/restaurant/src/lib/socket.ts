'use client';

import { io, Socket } from 'socket.io-client';

const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3001';

let socket: Socket | null = null;

export function getSocket(): Socket {
  if (!socket) {
    socket = io(SOCKET_URL, {
      autoConnect: false,
      transports: ['websocket', 'polling'],
    });
  }
  return socket;
}

export function connectToRestaurant(restaurantId: string): Socket {
  const s = getSocket();

  if (s.connected) {
    s.emit('join:restaurant', restaurantId);
    return s;
  }

  s.connect();

  s.on('connect', () => {
    console.log('Socket connected');
    s.emit('join:restaurant', restaurantId);
  });

  s.on('disconnect', () => {
    console.log('Socket disconnected');
  });

  return s;
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
    console.log('Audio not available');
  }
}

export interface ServerToClientEvents {
  'new-order': (order: import('./types').Order) => void;
  'order-update': (order: import('./types').Order) => void;
}

export interface ClientToServerEvents {
  'join:restaurant': (restaurantId: string) => void;
  'leave:restaurant': (restaurantId: string) => void;
}
