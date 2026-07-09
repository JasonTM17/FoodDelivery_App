import { act, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  decodeEncodedPolyline,
  OrderLiveTrackingMap,
  shouldShowOrderLiveTracking,
} from '@/components/orders/order-live-tracking-map';

const VIETNAM_ROUTE_POLYLINE = '_k|`A_zfjSf{Cf{Cf{Cf{C';

const mocks = vi.hoisted(() => {
  const socketHandlers = new Map<string, (...args: unknown[]) => void>();
  const socket = {
    connected: true,
    emit: vi.fn(),
    on: vi.fn((event: string, handler: (...args: unknown[]) => void) => {
      socketHandlers.set(event, handler);
      return socket;
    }),
    off: vi.fn((event: string) => {
      socketHandlers.delete(event);
      return socket;
    }),
    io: {
      on: vi.fn(),
      off: vi.fn(),
    },
  };

  return {
    apiGet: vi.fn(),
    connectToTrackingOrder: vi.fn(() => socket),
    leaveTrackingOrder: vi.fn(),
    socket,
    socketHandlers,
    translate: (key: string, values?: { minutes?: number; time?: string }) => {
      const messages: Record<string, string> = {
        title: 'Live delivery tracking',
        description: 'Follow the assigned driver with backend route and telemetry data.',
        mapRegionLabel: 'Live order tracking map',
        refresh: 'Refresh',
        loading: 'Loading live tracking',
        loadError: 'Could not load live tracking',
        missingKeyTitle: 'Configure NEXT_PUBLIC_GOOGLE_MAPS_KEY',
        missingKeyDescription: 'Add the public Google Maps key to the restaurant environment.',
        telemetryUnavailable: 'No real driver GPS or route has been recorded yet.',
        noSnapshotDescription: 'Tracking will appear when telemetry exists.',
        etaLabel: 'ETA',
        etaMinutes: `${values?.minutes ?? 0} min`,
        etaUnavailable: 'Unavailable until routed telemetry exists',
        routePhaseLabel: 'Route phase',
        driverLocationLabel: 'Driver GPS',
        locationAvailable: 'Live location available',
        locationUnavailable: 'Waiting for real driver GPS',
        customerAddressLabel: 'Customer address',
        routeAvailable: 'Route geometry comes from backend.',
        routeUnavailable: 'No routed geometry yet.',
        driverLocationUpdated: `Driver location updated: ${values?.time ?? ''}`,
        unavailable: 'Unavailable',
        'connection.connecting': 'Connecting',
        'connection.connected': 'Live',
        'connection.disconnected': 'Reconnecting',
        'phase.pickup': 'Driver to restaurant',
        'phase.dropoff': 'Driver to customer',
      };
      return messages[key] ?? key;
    },
  };
});

vi.mock('@/lib/api', () => ({
  api: {
    get: mocks.apiGet,
  },
}));

vi.mock('@/lib/tracking-socket', () => ({
  connectToTrackingOrder: mocks.connectToTrackingOrder,
  leaveTrackingOrder: mocks.leaveTrackingOrder,
}));

vi.mock('next-intl', () => ({
  useLocale: () => 'en',
  useTranslations: () => mocks.translate,
}));

describe('OrderLiveTrackingMap', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.socketHandlers.clear();
    mocks.socket.connected = true;
  });

  it('hydrates the real tracking snapshot and subscribes to the tracking order room', async () => {
    mocks.apiGet.mockResolvedValue({
      orderId: 'order-1',
      status: 'delivering',
      driverLocation: {
        lat: 10.8,
        lng: 106.7,
        lastUpdated: '2026-07-06T03:00:00.000Z',
      },
      etaMinutes: 9,
      routePolyline: '_p~iF~ps|U_ulLnnqC_mqNvxq`@',
      routePhase: 'dropoff',
    });

    render(
      <OrderLiveTrackingMap
        orderId="order-1"
        orderStatus="delivering"
        customerAddress="12 Nguyen Trai"
      />,
    );

    expect(await screen.findByText('9 min')).toBeInTheDocument();
    expect(screen.getByText('Live location available')).toBeInTheDocument();
    expect(screen.getByText('Driver to customer')).toBeInTheDocument();
    expect(screen.getByText('12 Nguyen Trai')).toBeInTheDocument();
    expect(screen.getByText('Configure NEXT_PUBLIC_GOOGLE_MAPS_KEY')).toBeInTheDocument();
    expect(mocks.apiGet).toHaveBeenCalledWith('/orders/order-1/tracking');
    expect(mocks.connectToTrackingOrder).toHaveBeenCalledWith('order-1');
    expect(mocks.socket.on).toHaveBeenCalledWith('driver:location_changed', expect.any(Function));
    expect(mocks.socket.on).toHaveBeenCalledWith('delivery:eta_updated', expect.any(Function));
  });

  it('applies realtime ETA updates without fabricating missing route geometry', async () => {
    mocks.apiGet.mockResolvedValue({
      orderId: 'order-1',
      status: 'driver_assigned',
      driverLocation: null,
      etaMinutes: null,
      routePolyline: null,
      routePhase: 'pickup',
    });

    render(
      <OrderLiveTrackingMap
        orderId="order-1"
        orderStatus="driver_assigned"
        customerAddress="12 Nguyen Trai"
      />,
    );

    expect(await screen.findByText('Unavailable until routed telemetry exists')).toBeInTheDocument();
    const onEta = mocks.socketHandlers.get('delivery:eta_updated');
    act(() => {
      onEta?.({
        orderId: 'order-1',
        etaMinutes: 4,
        source: 'google',
        degraded: false,
        routePolyline: null,
        routePhase: 'pickup',
      });
    });

    await waitFor(() => expect(screen.getByText('4 min')).toBeInTheDocument());
    expect(screen.getByText('No routed geometry yet.')).toBeInTheDocument();
    expect(screen.getByText('Driver to restaurant')).toBeInTheDocument();
    expect(screen.getByText('Driver location updated: Unavailable')).toBeInTheDocument();
  });

  it('shows a valid zero-minute ETA from backend telemetry', async () => {
    mocks.apiGet.mockResolvedValue({
      orderId: 'order-1',
      status: 'delivering',
      driverLocation: {
        lat: 10.75,
        lng: 106.65,
        lastUpdated: '2026-07-06T03:00:00.000Z',
      },
      etaMinutes: 0,
      routePolyline: VIETNAM_ROUTE_POLYLINE,
      routePhase: 'dropoff',
    });

    render(
      <OrderLiveTrackingMap
        orderId="order-1"
        orderStatus="delivering"
        customerAddress="12 Nguyen Trai"
      />,
    );

    expect(await screen.findByText('0 min')).toBeInTheDocument();
  });

  it('ignores driver location events for other orders', async () => {
    mocks.apiGet.mockResolvedValue({
      orderId: 'order-1',
      status: 'driver_assigned',
      driverLocation: null,
      etaMinutes: null,
      routePolyline: null,
      routePhase: 'pickup',
    });

    render(
      <OrderLiveTrackingMap
        orderId="order-1"
        orderStatus="driver_assigned"
        customerAddress="12 Nguyen Trai"
      />,
    );

    await screen.findByText('Waiting for real driver GPS');
    const onLocation = mocks.socketHandlers.get('driver:location_changed');
    act(() => {
      onLocation?.({
        orderId: 'other-order',
        driverId: 'driver-1',
        lat: 10.8,
        lng: 106.7,
        bearing: null,
        timestamp: '2026-07-06T03:01:00.000Z',
      });
    });

    expect(screen.getByText('Waiting for real driver GPS')).toBeInTheDocument();
  });

  it('decodes Vietnam delivery route polylines for the map overlay', () => {
    expect(decodeEncodedPolyline(VIETNAM_ROUTE_POLYLINE)).toEqual([
      { lat: 10.8, lng: 106.7 },
      { lat: 10.775, lng: 106.675 },
      { lat: 10.75, lng: 106.65 },
    ]);
  });

  it('fails closed for out-of-region route polylines instead of drawing stale geometry', () => {
    expect(decodeEncodedPolyline('_p~iF~ps|U_ulLnnqC_mqNvxq`@')).toEqual([]);
  });

  it('only shows live tracking during active driver statuses', () => {
    expect(shouldShowOrderLiveTracking('driver_assigned')).toBe(true);
    expect(shouldShowOrderLiveTracking('driver_arriving_restaurant')).toBe(true);
    expect(shouldShowOrderLiveTracking('picked_up')).toBe(true);
    expect(shouldShowOrderLiveTracking('delivering')).toBe(true);
    expect(shouldShowOrderLiveTracking('preparing')).toBe(false);
    expect(shouldShowOrderLiveTracking('delivered')).toBe(false);
  });
});
