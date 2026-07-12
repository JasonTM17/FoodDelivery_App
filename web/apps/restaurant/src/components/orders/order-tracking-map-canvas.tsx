'use client';

import { useEffect, useRef, useState } from 'react';
import type { OrderTrackingResponse } from '@foodflow/api-client';
import {
  AttributionControl,
  type GeoJSONSource,
  LngLatBounds,
  Map as MapLibreMap,
  Marker as MapLibreMarker,
  NavigationControl,
} from 'maplibre-gl';

const ROUTE_SOURCE_ID = 'foodflow-order-route';
const ROUTE_LAYER_ID = 'foodflow-order-route-line';
const VIETNAM_MAX_BOUNDS: [[number, number], [number, number]] = [
  [102.14, 8.18],
  [109.47, 23.4],
];

export interface DeliveryLatLng {
  lat: number;
  lng: number;
}

interface OrderTrackingMapCanvasProps {
  driverLocation: OrderTrackingResponse['driverLocation'];
  routePoints: DeliveryLatLng[];
  initialCenter: DeliveryLatLng;
  initialZoom: number;
  styleUrl: string;
  loadingLabel: string;
  errorTitle: string;
  errorDescription: string;
  driverMarkerLabel: string;
}

type MapStatus = 'loading' | 'ready' | 'error';

export function OrderTrackingMapCanvas({
  driverLocation,
  routePoints,
  initialCenter,
  initialZoom,
  styleUrl,
  loadingLabel,
  errorTitle,
  errorDescription,
  driverMarkerLabel,
}: OrderTrackingMapCanvasProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<MapLibreMap | null>(null);
  const driverMarkerRef = useRef<MapLibreMarker | null>(null);
  const initialViewRef = useRef({ center: initialCenter, zoom: initialZoom });
  const [mapStatus, setMapStatus] = useState<MapStatus>('loading');

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return undefined;

    let disposed = false;
    setMapStatus('loading');

    let map: MapLibreMap;
    try {
      const initialView = initialViewRef.current;
      map = new MapLibreMap({
        container,
        style: styleUrl,
        center: [initialView.center.lng, initialView.center.lat],
        zoom: initialView.zoom,
        minZoom: 4,
        maxZoom: 18,
        maxBounds: VIETNAM_MAX_BOUNDS,
        attributionControl: false,
      });
    } catch {
      setMapStatus('error');
      return undefined;
    }

    mapRef.current = map;
    const canvas = map.getCanvas();
    map.addControl(new NavigationControl({ showCompass: false }), 'top-left');
    map.addControl(new AttributionControl({ compact: true }), 'bottom-right');

    const loadTimeout = window.setTimeout(() => {
      if (!disposed) setMapStatus((current) => (current === 'loading' ? 'error' : current));
    }, 20_000);

    const handleLoad = () => {
      if (!disposed) {
        window.clearTimeout(loadTimeout);
        setMapStatus('ready');
      }
    };
    const handleError = () => {
      if (disposed) return;
      setMapStatus((current) => (current === 'loading' ? 'error' : current));
    };
    const handleContextLost = (event: Event) => {
      event.preventDefault();
      if (!disposed) setMapStatus('error');
    };
    const handleContextRestored = () => {
      if (disposed) return;
      map.resize();
      map.triggerRepaint();
      setMapStatus(map.isStyleLoaded() ? 'ready' : 'loading');
    };

    map.on('load', handleLoad);
    map.on('error', handleError);
    canvas.addEventListener('webglcontextlost', handleContextLost);
    canvas.addEventListener('webglcontextrestored', handleContextRestored);

    return () => {
      disposed = true;
      window.clearTimeout(loadTimeout);
      map.off('load', handleLoad);
      map.off('error', handleError);
      canvas.removeEventListener('webglcontextlost', handleContextLost);
      canvas.removeEventListener('webglcontextrestored', handleContextRestored);
      driverMarkerRef.current?.remove();
      driverMarkerRef.current = null;
      map.remove();
      mapRef.current = null;
    };
  }, [styleUrl]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || mapStatus !== 'ready') return;

    const routeData = buildRouteFeatureCollection(routePoints);
    const routeSource = map.getSource(ROUTE_SOURCE_ID) as GeoJSONSource | undefined;
    if (routeSource) {
      routeSource.setData(routeData);
    } else {
      map.addSource(ROUTE_SOURCE_ID, { type: 'geojson', data: routeData });
      map.addLayer({
        id: ROUTE_LAYER_ID,
        type: 'line',
        source: ROUTE_SOURCE_ID,
        layout: {
          'line-cap': 'round',
          'line-join': 'round',
        },
        paint: {
          'line-color': '#16a34a',
          'line-opacity': 0.9,
          'line-width': 5,
        },
      });
    }

    driverMarkerRef.current?.remove();
    driverMarkerRef.current = null;
    if (driverLocation) {
      const markerElement = document.createElement('span');
      markerElement.className = 'foodflow-tracking-driver-marker';
      markerElement.title = driverMarkerLabel;
      markerElement.setAttribute('role', 'img');
      markerElement.setAttribute('aria-label', driverMarkerLabel);
      driverMarkerRef.current = new MapLibreMarker({
        element: markerElement,
        anchor: 'center',
      })
        .setLngLat([driverLocation.lng, driverLocation.lat])
        .addTo(map);
    }

    fitMapToTracking(map, routePoints, driverLocation);
  }, [driverLocation, driverMarkerLabel, mapStatus, routePoints]);

  return (
    <div className="relative h-full min-h-[360px] w-full">
      <div
        ref={containerRef}
        className="h-full min-h-[360px] w-full"
        data-testid="restaurant-order-tracking-map-canvas"
      />
      {mapStatus === 'loading' ? (
        <div
          role="status"
          className="pointer-events-none absolute inset-0 flex items-center justify-center bg-white/75 text-sm text-gray-600 backdrop-blur-sm"
        >
          {loadingLabel}
        </div>
      ) : null}
      {mapStatus === 'error' ? (
        <div
          role="alert"
          className="absolute inset-0 flex items-center justify-center bg-white/95 p-6 text-center"
        >
          <div>
            <p className="text-sm font-medium text-gray-800">{errorTitle}</p>
            <p className="mt-1 max-w-sm text-xs text-gray-600">{errorDescription}</p>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function buildRouteFeatureCollection(routePoints: DeliveryLatLng[]) {
  const coordinates = routePoints.map(({ lat, lng }): [number, number] => [lng, lat]);
  return {
    type: 'FeatureCollection' as const,
    features: coordinates.length > 1
      ? [{
          type: 'Feature' as const,
          properties: {},
          geometry: {
            type: 'LineString' as const,
            coordinates,
          },
        }]
      : [],
  };
}

function fitMapToTracking(
  map: MapLibreMap,
  routePoints: DeliveryLatLng[],
  driverLocation: OrderTrackingResponse['driverLocation'],
): void {
  const points = routePoints.map(({ lat, lng }): [number, number] => [lng, lat]);
  if (driverLocation) points.push([driverLocation.lng, driverLocation.lat]);
  if (points.length === 0) return;
  if (points.length === 1) {
    map.easeTo({ center: points[0], zoom: 15, duration: 350 });
    return;
  }

  const bounds = new LngLatBounds();
  points.forEach((point) => bounds.extend(point));
  map.fitBounds(bounds, { padding: 64, maxZoom: 15, duration: 450 });
}
