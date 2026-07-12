import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const socketModule = vi.hoisted(() => {
  const socket = {
    connected: false,
    connect: vi.fn(),
    disconnect: vi.fn(),
    emit: vi.fn(),
    removeAllListeners: vi.fn(),
  };
  return {
    io: vi.fn((..._args: unknown[]) => socket),
    socket,
  };
});

vi.mock('socket.io-client', () => ({ io: socketModule.io }));

describe('restaurant realtime socket', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.unstubAllEnvs();
    socketModule.io.mockClear();
    localStorage.clear();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('uses the canonical NEXT_PUBLIC_WS_URL and appends the events namespace', async () => {
    vi.stubEnv('NEXT_PUBLIC_WS_URL', 'https://restaurant-realtime.foodflow.test');

    const { getSocket, disconnectSocket } = await import('@/lib/socket');
    getSocket();

    expect(socketModule.io).toHaveBeenCalledWith(
      'https://restaurant-realtime.foodflow.test/events',
      expect.objectContaining({ autoConnect: false }),
    );
    disconnectSocket();
  });

  it('does not use the removed NEXT_PUBLIC_SOCKET_URL fallback', async () => {
    vi.stubEnv('NEXT_PUBLIC_SOCKET_URL', 'https://legacy-realtime.foodflow.test/events');

    const { resolveEventsSocketUrl } = await import('@/lib/socket');

    expect(resolveEventsSocketUrl()).toBe('http://localhost:3001/events');
  });

  it('reads the current restaurant access token when the socket connects', async () => {
    vi.stubEnv('NEXT_PUBLIC_WS_URL', 'https://restaurant-realtime.foodflow.test');
    localStorage.setItem('restaurant_token', 'restaurant-access-token');
    const { getSocket, disconnectSocket } = await import('@/lib/socket');

    getSocket();
    const options = socketModule.io.mock.calls[0][1] as unknown as {
      auth: (callback: (auth: { token: string | null }) => void) => void;
    };
    const callback = vi.fn();
    options.auth(callback);

    expect(callback).toHaveBeenCalledWith({ token: 'restaurant-access-token' });
    disconnectSocket();
  });

  it('fails closed in production when the websocket URL is not configured', async () => {
    vi.stubEnv('VERCEL_ENV', 'production');

    const { resolveEventsSocketUrl } = await import('@/lib/socket');

    expect(() => resolveEventsSocketUrl()).toThrow('NEXT_PUBLIC_WS_URL is required');
  });

  it('rejects insecure localhost websocket URLs in production', async () => {
    vi.stubEnv('VERCEL_ENV', 'production');
    vi.stubEnv('NEXT_PUBLIC_WS_URL', 'ws://localhost:3001');

    const { resolveEventsSocketUrl } = await import('@/lib/socket');

    expect(() => resolveEventsSocketUrl()).toThrow('NEXT_PUBLIC_WS_URL must be a secure public URL');
  });
});
