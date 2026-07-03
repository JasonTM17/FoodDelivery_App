import { beforeEach, describe, expect, it, vi } from 'vitest';

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
    socketModule.io.mockClear();
    localStorage.clear();
  });

  it('reads the current restaurant access token when the socket connects', async () => {
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
});
