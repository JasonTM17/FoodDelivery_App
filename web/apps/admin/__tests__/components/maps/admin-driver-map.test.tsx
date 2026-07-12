import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import AdminDriverMap from '@/components/maps/admin-driver-map';
import type { DriverLocation } from '@/hooks/use-realtime-driver-locations';

const mocks = vi.hoisted(() => {
  const handlers = new globalThis.Map<string, () => void>();
  let autoLoad = true;
  let container: HTMLElement | null = null;
  let canvas: HTMLCanvasElement | null = null;
  const bounds = {
    extend: vi.fn().mockReturnThis(),
  };
  const popup = {
    setLngLat: vi.fn().mockReturnThis(),
    setHTML: vi.fn().mockReturnThis(),
    addTo: vi.fn().mockReturnThis(),
    remove: vi.fn(),
  };
  const map = {
    addControl: vi.fn().mockReturnThis(),
    addLayer: vi.fn().mockReturnThis(),
    addSource: vi.fn().mockReturnThis(),
    easeTo: vi.fn().mockReturnThis(),
    fitBounds: vi.fn().mockReturnThis(),
    getCanvas: vi.fn(() => canvas as HTMLCanvasElement),
    getLayer: vi.fn(),
    getSource: vi.fn(),
    isStyleLoaded: vi.fn(() => true),
    off: vi.fn().mockReturnThis(),
    on: vi.fn((event: string, handler: () => void) => {
      handlers.set(event, handler);
      return map;
    }),
    remove: vi.fn(),
    resize: vi.fn().mockReturnThis(),
    triggerRepaint: vi.fn().mockReturnThis(),
  };
  const markerInstances: Array<{
    element: HTMLElement;
    addTo: ReturnType<typeof vi.fn>;
    remove: ReturnType<typeof vi.fn>;
    setLngLat: ReturnType<typeof vi.fn>;
  }> = [];

  return {
    bounds,
    handlers,
    map,
    markerInstances,
    popup,
    getContainer: () => container,
    getAutoLoad: () => autoLoad,
    setAutoLoad: (value: boolean) => { autoLoad = value; },
    setContainer: (value: HTMLElement) => {
      container = value;
      canvas = document.createElement('canvas');
      value.append(canvas);
    },
  };
});

vi.mock('maplibre-gl', () => ({
  AttributionControl: vi.fn(function AttributionControl() { return {}; }),
  LngLatBounds: vi.fn(function LngLatBounds() { return mocks.bounds; }),
  Map: vi.fn(function Map(options: { container: HTMLElement }) {
    mocks.setContainer(options.container);
    if (mocks.getAutoLoad()) queueMicrotask(() => mocks.handlers.get('load')?.());
    return mocks.map;
  }),
  Marker: vi.fn(function Marker(options: { element: HTMLElement }) {
    const instance = {
      element: options.element,
      addTo: vi.fn(() => {
        mocks.getContainer()?.append(options.element);
        return instance;
      }),
      remove: vi.fn(() => options.element.remove()),
      setLngLat: vi.fn().mockReturnThis(),
    };
    mocks.markerInstances.push(instance);
    return instance;
  }),
  NavigationControl: vi.fn(function NavigationControl() { return {}; }),
  Popup: vi.fn(function Popup() { return mocks.popup; }),
}));

describe('AdminDriverMap', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.handlers.clear();
    mocks.markerInstances.length = 0;
    mocks.setAutoLoad(true);
  });

  it('renders real driver coordinates on the no-key map with an accessible marker', async () => {
    const onSelect = vi.fn();
    const driver = makeDriver();

    render(
      <AdminDriverMap
        drivers={[driver]}
        statusLabels={{
          online: 'Available',
          offline: 'Offline',
          free: 'Available',
          delivering: 'Delivering',
          busy: 'Busy',
        }}
        copy={{
          rating: 'Rating',
          status: 'Status',
          order: 'Order',
          vehicle: 'Vehicle',
          lastSeen: 'Last seen',
          stale: 'stale',
        }}
        styleUrl="https://tiles.openfreemap.org/styles/liberty"
        loadingLabel="Loading the live map"
        errorTitle="Map unavailable"
        errorDescription="Retry later"
        getMarkerLabel={(item) => `${item.name}, Available`}
        onSelect={onSelect}
      />,
    );

    const markerButton = await screen.findByRole('button', { name: 'Nguyen Minh, Available' });
    expect(mocks.markerInstances[0].setLngLat).toHaveBeenCalledWith([106.7009, 10.7769]);
    expect(mocks.map.addSource).toHaveBeenCalledWith(
      'foodflow-vietnam-boundary',
      expect.objectContaining({ data: '/data/vietnam-boundary.geojson' }),
    );
    expect(mocks.map.easeTo).toHaveBeenCalledWith(expect.objectContaining({
      center: [106.7009, 10.7769],
      zoom: 13,
    }));

    fireEvent.click(markerButton);
    expect(onSelect).toHaveBeenCalledWith(driver);
    expect(mocks.popup.setHTML).toHaveBeenCalledWith(expect.stringContaining('Nguyen Minh'));
  });

  it('shows an accessible failure state if the map style cannot load', async () => {
    mocks.setAutoLoad(false);
    render(
      <AdminDriverMap
        drivers={[]}
        statusLabels={{
          online: 'Available',
          offline: 'Offline',
          free: 'Available',
          delivering: 'Delivering',
          busy: 'Busy',
        }}
        copy={{
          rating: 'Rating',
          status: 'Status',
          order: 'Order',
          vehicle: 'Vehicle',
          lastSeen: 'Last seen',
          stale: 'stale',
        }}
        styleUrl="https://tiles.openfreemap.org/styles/liberty"
        loadingLabel="Loading the live map"
        errorTitle="Map unavailable"
        errorDescription="Retry later"
        getMarkerLabel={(driver) => driver.name}
        onSelect={vi.fn()}
      />,
    );

    act(() => mocks.handlers.get('error')?.());
    await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent('Map unavailable'));
  });

  it('fails closed on WebGL context loss and repaints after restoration', async () => {
    render(
      <AdminDriverMap
        drivers={[]}
        statusLabels={{
          online: 'Available',
          offline: 'Offline',
          free: 'Available',
          delivering: 'Delivering',
          busy: 'Busy',
        }}
        copy={{
          rating: 'Rating',
          status: 'Status',
          order: 'Order',
          vehicle: 'Vehicle',
          lastSeen: 'Last seen',
          stale: 'stale',
        }}
        styleUrl="https://tiles.openfreemap.org/styles/liberty"
        loadingLabel="Loading the live map"
        errorTitle="Map unavailable"
        errorDescription="Retry later"
        getMarkerLabel={(driver) => driver.name}
        onSelect={vi.fn()}
      />,
    );

    await waitFor(() => expect(screen.queryByRole('status')).not.toBeInTheDocument());
    const canvas = mocks.map.getCanvas();
    const contextLost = new Event('webglcontextlost', { cancelable: true });
    act(() => canvas.dispatchEvent(contextLost));
    expect(contextLost.defaultPrevented).toBe(true);
    expect(screen.getByRole('alert')).toHaveTextContent('Map unavailable');

    act(() => canvas.dispatchEvent(new Event('webglcontextrestored')));
    expect(mocks.map.resize).toHaveBeenCalled();
    expect(mocks.map.triggerRepaint).toHaveBeenCalled();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });
});

function makeDriver(overrides: Partial<DriverLocation> = {}): DriverLocation {
  return {
    id: 'driver-1',
    driverId: 'user-driver-1',
    name: 'Nguyen Minh',
    rating: 4.8,
    status: 'online',
    lat: 10.7769,
    lng: 106.7009,
    vehicleType: 'motorbike',
    vehiclePlate: '59-A1 12345',
    currentOrder: 'FF-1',
    lastSeenAt: '2026-07-12T01:00:00.000Z',
    ...overrides,
  };
}
