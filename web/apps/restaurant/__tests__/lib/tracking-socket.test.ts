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

describe('restaurant tracking socket', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.unstubAllEnvs();
    socketModule.io.mockClear();
    socketModule.socket.connect.mockClear();
    socketModule.socket.emit.mockClear();
    localStorage.clear();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('uses the canonical NEXT_PUBLIC_WS_URL and appends the tracking namespace', async () => {
    vi.stubEnv('NEXT_PUBLIC_WS_URL', 'https://restaurant-realtime.foodflow.test');

    const { getTrackingSocket, disconnectTrackingSocket } = await import('@/lib/tracking-socket');
    getTrackingSocket();

    expect(socketModule.io).toHaveBeenCalledWith(
      'https://restaurant-realtime.foodflow.test/tracking',
      expect.objectContaining({ autoConnect: false }),
    );
    disconnectTrackingSocket();
  });

  it('normalizes a legacy events namespace URL to tracking', async () => {
    vi.stubEnv('NEXT_PUBLIC_SOCKET_URL', 'https://legacy-realtime.foodflow.test/events');

    const { resolveTrackingSocketUrl } = await import('@/lib/tracking-socket');

    expect(resolveTrackingSocketUrl()).toBe('https://legacy-realtime.foodflow.test/tracking');
  });

  it('subscribes to an order room and reads the current restaurant access token', async () => {
    vi.stubEnv('NEXT_PUBLIC_WS_URL', 'https://restaurant-realtime.foodflow.test');
    localStorage.setItem('restaurant_token', 'restaurant-access-token');
    const { connectToTrackingOrder, disconnectTrackingSocket } = await import('@/lib/tracking-socket');

    connectToTrackingOrder('order-1');
    const options = socketModule.io.mock.calls[0][1] as unknown as {
      auth: (callback: (auth: { token: string | null }) => void) => void;
    };
    const callback = vi.fn();
    options.auth(callback);

    expect(socketModule.socket.connect).toHaveBeenCalled();
    expect(socketModule.socket.emit).toHaveBeenCalledWith('order:subscribe', { orderId: 'order-1' });
    expect(callback).toHaveBeenCalledWith({ token: 'restaurant-access-token' });
    disconnectTrackingSocket();
  });

  it('fails closed in production when the websocket URL is not configured', async () => {
    vi.stubEnv('VERCEL_ENV', 'production');

    const { resolveTrackingSocketUrl } = await import('@/lib/tracking-socket');

    expect(() => resolveTrackingSocketUrl()).toThrow('NEXT_PUBLIC_WS_URL is required');
  });
});
