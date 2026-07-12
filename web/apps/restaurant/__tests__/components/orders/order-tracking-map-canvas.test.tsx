import { render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { OrderTrackingMapCanvas } from '@/components/orders/order-tracking-map-canvas';

const mocks = vi.hoisted(() => {
  const handlers = new globalThis.Map<string, () => void>();
  let container: HTMLElement | null = null;
  let canvas: HTMLCanvasElement | null = null;
  let routeSource: { setData: ReturnType<typeof vi.fn> } | undefined;
  const bounds = { extend: vi.fn().mockReturnThis() };
  const map = {
    addControl: vi.fn().mockReturnThis(),
    addLayer: vi.fn().mockReturnThis(),
    addSource: vi.fn((id: string, _source: unknown) => {
      if (id === 'foodflow-order-route') routeSource = { setData: vi.fn() };
      return map;
    }),
    easeTo: vi.fn().mockReturnThis(),
    fitBounds: vi.fn().mockReturnThis(),
    getCanvas: vi.fn(() => canvas as HTMLCanvasElement),
    getSource: vi.fn(() => routeSource),
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
    addTo: ReturnType<typeof vi.fn>;
    remove: ReturnType<typeof vi.fn>;
    setLngLat: ReturnType<typeof vi.fn>;
  }> = [];

  return {
    bounds,
    handlers,
    map,
    markerInstances,
    getContainer: () => container,
    getRouteSource: () => routeSource,
    resetRouteSource: () => { routeSource = undefined; },
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
    queueMicrotask(() => mocks.handlers.get('load')?.());
    return mocks.map;
  }),
  Marker: vi.fn(function Marker(options: { element: HTMLElement }) {
    const instance = {
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
}));

describe('OrderTrackingMapCanvas', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.handlers.clear();
    mocks.markerInstances.length = 0;
    mocks.resetRouteSource();
  });

  it('draws backend route geometry and the real driver GPS in longitude-latitude order', async () => {
    render(
      <OrderTrackingMapCanvas
        driverLocation={{
          lat: 10.8,
          lng: 106.7,
          lastUpdated: '2026-07-12T01:00:00.000Z',
        }}
        routePoints={[
          { lat: 10.8, lng: 106.7 },
          { lat: 10.775, lng: 106.675 },
        ]}
        initialCenter={{ lat: 14.0583, lng: 108.2772 }}
        initialZoom={6}
        styleUrl="https://tiles.openfreemap.org/styles/liberty"
        loadingLabel="Loading the delivery map"
        errorTitle="Map unavailable"
        errorDescription="Retry later"
        driverMarkerLabel="Current driver GPS position"
      />,
    );

    await screen.findByRole('img', { name: 'Current driver GPS position' });
    expect(mocks.map.addSource).toHaveBeenCalledWith('foodflow-order-route', {
      type: 'geojson',
      data: expect.objectContaining({
        features: [expect.objectContaining({
          geometry: {
            type: 'LineString',
            coordinates: [
              [106.7, 10.8],
              [106.675, 10.775],
            ],
          },
        })],
      }),
    });
    expect(mocks.markerInstances[0].setLngLat).toHaveBeenCalledWith([106.7, 10.8]);
    expect(mocks.map.fitBounds).toHaveBeenCalledWith(
      mocks.bounds,
      expect.objectContaining({ maxZoom: 15 }),
    );
  });

  it('publishes an empty route source instead of fabricating geometry', async () => {
    render(
      <OrderTrackingMapCanvas
        driverLocation={null}
        routePoints={[]}
        initialCenter={{ lat: 14.0583, lng: 108.2772 }}
        initialZoom={6}
        styleUrl="https://tiles.openfreemap.org/styles/liberty"
        loadingLabel="Loading the delivery map"
        errorTitle="Map unavailable"
        errorDescription="Retry later"
        driverMarkerLabel="Current driver GPS position"
      />,
    );

    await waitFor(() => expect(mocks.map.addSource).toHaveBeenCalled());
    const routeCall = mocks.map.addSource.mock.calls.find(([id]) => id === 'foodflow-order-route');
    expect(routeCall?.[1]).toEqual({
      type: 'geojson',
      data: { type: 'FeatureCollection', features: [] },
    });
    expect(mocks.map.fitBounds).not.toHaveBeenCalled();
    expect(mocks.map.easeTo).not.toHaveBeenCalled();
  });
});
