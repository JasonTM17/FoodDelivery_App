import { act, renderHook, waitFor } from '@testing-library/react';
import type { AdminDriverLocation } from '@foodflow/api-client';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { apiGet } from '@/lib/api';
import { useRealtimeDriverLocations } from '@/hooks/use-realtime-driver-locations';

type SocketListener = (...args: unknown[]) => void;

const socketMock = vi.hoisted(() => {
  const listeners = new Map<string, Set<SocketListener>>();
  const socket = {
    connected: true,
    emit: vi.fn(),
    on: vi.fn((event: string, listener: SocketListener) => {
      if (!listeners.has(event)) listeners.set(event, new Set());
      listeners.get(event)?.add(listener);
      return socket;
    }),
    off: vi.fn((event: string, listener: SocketListener) => {
      listeners.get(event)?.delete(listener);
      return socket;
    }),
    trigger(event: string, ...args: unknown[]) {
      listeners.get(event)?.forEach((listener) => listener(...args));
    },
    reset() {
      socket.connected = true;
      socket.emit.mockClear();
      socket.on.mockClear();
      socket.off.mockClear();
      listeners.clear();
    },
  };
  return socket;
});

vi.mock('@/lib/socket', () => ({
  getSocket: () => socketMock,
}));

const mockedApiGet = vi.mocked(apiGet);

describe('useRealtimeDriverLocations', () => {
  beforeEach(() => {
    socketMock.reset();
    mockedApiGet.mockReset();
  });

  it('loads real admin driver locations and subscribes to the events namespace', async () => {
    const location = makeLocation();
    mockedApiGet.mockResolvedValueOnce([location]);

    const { result, unmount } = renderHook(() => useRealtimeDriverLocations());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(mockedApiGet).toHaveBeenCalledWith('/admin/online-drivers');
    expect(socketMock.emit).toHaveBeenCalledWith('admin:subscribe_drivers');
    expect(result.current.connectionStatus).toBe('connected');
    expect(result.current.drivers).toEqual([location]);

    unmount();

    expect(socketMock.emit).toHaveBeenCalledWith('admin:unsubscribe_drivers');
  });

  it('applies driver location updates without replacing the database-backed profile fields', async () => {
    mockedApiGet.mockResolvedValueOnce([makeLocation()]);
    const { result } = renderHook(() => useRealtimeDriverLocations());

    await waitFor(() => {
      expect(result.current.drivers).toHaveLength(1);
    });

    act(() => {
      socketMock.trigger('admin:driver_location_changed', {
        driverId: 'driver-1',
        lat: 10.8,
        lng: 106.8,
        orderId: 'ORD-1',
        status: 'delivering',
        timestamp: '2026-07-02T09:00:00.000Z',
      });
    });

    expect(result.current.drivers[0]).toMatchObject({
      id: 'driver-1',
      name: 'Nguyen Minh',
      lat: 10.8,
      lng: 106.8,
      currentOrder: 'ORD-1',
      status: 'delivering',
      lastSeenAt: '2026-07-02T09:00:00.000Z',
    });
  });
});

function makeLocation(overrides: Partial<AdminDriverLocation> = {}): AdminDriverLocation {
  return {
    id: 'driver-1',
    driverId: 'driver-1',
    name: 'Nguyen Minh',
    rating: 4.8,
    status: 'online',
    lat: 10.7769,
    lng: 106.7009,
    vehicleType: 'motorbike',
    vehiclePlate: '59-A1 12345',
    lastSeenAt: '2026-07-02T08:30:00.000Z',
    ...overrides,
  };
}
