import type { ReactNode } from 'react';
import { act, renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { apiGet } from '@/lib/api';
import type { LiveOrder } from '@/hooks/use-realtime-orders';
import { useRealtimeOrders } from '@/hooks/use-realtime-orders';

type SocketListener = (...args: unknown[]) => void;

const socketMock = vi.hoisted(() => {
  const listeners = new Map<string, Set<SocketListener>>();
  const managerListeners = new Map<string, Set<SocketListener>>();
  const addListener = (store: Map<string, Set<SocketListener>>, event: string, listener: SocketListener) => {
    if (!store.has(event)) store.set(event, new Set());
    store.get(event)?.add(listener);
  };
  const removeListener = (store: Map<string, Set<SocketListener>>, event: string, listener: SocketListener) => {
    store.get(event)?.delete(listener);
  };
  const trigger = (store: Map<string, Set<SocketListener>>, event: string, ...args: unknown[]) => {
    store.get(event)?.forEach((listener) => listener(...args));
  };
  const socket = {
    connected: true,
    emit: vi.fn(),
    on: vi.fn((event: string, listener: SocketListener) => {
      addListener(listeners, event, listener);
      return socket;
    }),
    off: vi.fn((event: string, listener: SocketListener) => {
      removeListener(listeners, event, listener);
      return socket;
    }),
    io: {
      on: vi.fn((event: string, listener: SocketListener) => {
        addListener(managerListeners, event, listener);
        return socket.io;
      }),
      off: vi.fn((event: string, listener: SocketListener) => {
        removeListener(managerListeners, event, listener);
        return socket.io;
      }),
    },
    trigger(event: string, ...args: unknown[]) {
      trigger(listeners, event, ...args);
    },
    triggerManager(event: string, ...args: unknown[]) {
      trigger(managerListeners, event, ...args);
    },
    reset() {
      socket.connected = true;
      socket.emit.mockClear();
      socket.on.mockClear();
      socket.off.mockClear();
      socket.io.on.mockClear();
      socket.io.off.mockClear();
      listeners.clear();
      managerListeners.clear();
    },
  };
  return socket;
});

vi.mock('@/lib/socket', () => ({
  getSocket: () => socketMock,
}));

const mockedApiGet = vi.mocked(apiGet);

function wrapper({ children }: { children: ReactNode }) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });
  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}

describe('useRealtimeOrders', () => {
  beforeEach(() => {
    socketMock.reset();
    mockedApiGet.mockReset();
  });

  it('loads recent orders and subscribes to the admin orders room over /events', async () => {
    mockedApiGet.mockResolvedValueOnce({ orders: [makeOrder()] });

    const { result, unmount } = renderHook(() => useRealtimeOrders(), { wrapper });

    await waitFor(() => expect(result.current.orders).toHaveLength(1));

    expect(mockedApiGet).toHaveBeenCalledWith('/admin/orders/recent', { params: { limit: 20 } });
    expect(socketMock.emit).toHaveBeenCalledWith('admin:subscribe_orders');
    expect(result.current.status).toBe('connected');
    expect(result.current.isFallbackPolling).toBe(false);

    unmount();

    expect(socketMock.emit).toHaveBeenCalledWith('admin:unsubscribe_orders');
  });

  it('updates visible order status from websocket events without waiting for polling', async () => {
    mockedApiGet.mockResolvedValueOnce({ orders: [makeOrder({ status: 'pending' })] });
    const { result } = renderHook(() => useRealtimeOrders(), { wrapper });

    await waitFor(() => expect(result.current.orders[0].status).toBe('pending'));

    act(() => {
      socketMock.trigger('admin:order_status_changed', {
        orderId: 'order-1',
        status: 'delivering',
      });
    });

    expect(result.current.orders[0].status).toBe('delivering');
  });

  it('refetches the real recent order list when a new order event arrives', async () => {
    mockedApiGet
      .mockResolvedValueOnce({ orders: [makeOrder()] })
      .mockResolvedValueOnce({ orders: [makeOrder(), makeOrder({ id: 'order-2', orderCode: 'FF-2' })] });
    const { result } = renderHook(() => useRealtimeOrders(), { wrapper });

    await waitFor(() => expect(result.current.orders).toHaveLength(1));

    act(() => {
      socketMock.trigger('admin:new_order', { orderId: 'order-2' });
    });

    await waitFor(() => expect(result.current.orders).toHaveLength(2));
  });

  it('reports fallback polling when the websocket disconnects', async () => {
    mockedApiGet.mockResolvedValueOnce({ orders: [makeOrder()] });
    const { result } = renderHook(() => useRealtimeOrders(), { wrapper });

    await waitFor(() => expect(result.current.status).toBe('connected'));

    act(() => {
      socketMock.trigger('disconnect');
    });

    expect(result.current.status).toBe('disconnected');
    expect(result.current.isFallbackPolling).toBe(true);
  });
});

function makeOrder(overrides: Partial<LiveOrder> = {}): LiveOrder {
  return {
    id: 'order-1',
    orderCode: 'FF-1',
    customer: { name: 'Lan' },
    restaurant: { name: 'Lotus' },
    driver: null,
    status: 'pending',
    total: 120000,
    placedAt: '2026-07-03T01:00:00.000Z',
    ...overrides,
  };
}
