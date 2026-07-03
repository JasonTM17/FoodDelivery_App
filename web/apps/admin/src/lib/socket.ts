'use client';

import { io, Socket } from 'socket.io-client';
import { assertProductionPublicUrl, isProductionDeployment } from './public-env';

let socket: Socket | null = null;

export function resolveEventsSocketUrl(): string {
  const configured =
    process.env.NEXT_PUBLIC_WS_URL?.trim() ||
    process.env.NEXT_PUBLIC_SOCKET_URL?.trim();

  if (!configured) {
    if (isProductionDeployment(process.env)) {
      throw new Error('NEXT_PUBLIC_WS_URL is required for the admin realtime socket');
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

export function getSocket(): Socket {
  if (!socket) {
    socket = io(resolveEventsSocketUrl(), {
      transports: ['websocket', 'polling'],
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      auth: (cb) => {
        const token =
          typeof window !== 'undefined' ? localStorage.getItem('admin_token') : null;
        cb({ token });
      },
    });

  }

  return socket;
}

export function disconnectSocket(): void {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}
