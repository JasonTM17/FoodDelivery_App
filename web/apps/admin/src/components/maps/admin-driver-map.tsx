'use client';

import { useEffect, useRef, useState } from 'react';
import {
  AttributionControl,
  LngLatBounds,
  Map as MapLibreMap,
  Marker as MapLibreMarker,
  NavigationControl,
  Popup as MapLibrePopup,
} from 'maplibre-gl';
import type { DriverLocation } from '@/hooks/use-realtime-driver-locations';
import {
  buildDriverInfoWindowHtml,
  type DriverMarkerCopy,
} from '@/components/markers/driver-marker-html';

const VIETNAM_MAX_BOUNDS: [[number, number], [number, number]] = [
  [102.0, 3.8],
  [117.5, 23.5],
];
const VIETNAM_CENTER: [number, number] = [108.0, 14.0];
const VIETNAM_DEFAULT_ZOOM = 5.2;
const BOUNDARY_SOURCE_ID = 'foodflow-vietnam-boundary';
const BOUNDARY_FILL_LAYER_ID = 'foodflow-vietnam-boundary-fill';
const BOUNDARY_LINE_LAYER_ID = 'foodflow-vietnam-boundary-line';

const statusColors: Record<DriverLocation['status'], string> = {
  online: '#16a34a',
  offline: '#64748b',
  free: '#16a34a',
  delivering: '#f97316',
  busy: '#dc2626',
};

type MapStatus = 'loading' | 'ready' | 'error';

interface AdminDriverMapProps {
  drivers: DriverLocation[];
  statusLabels: Record<DriverLocation['status'], string>;
  selectedDriverId?: string;
  copy: DriverMarkerCopy;
  styleUrl: string;
  loadingLabel: string;
  errorTitle: string;
  errorDescription: string;
  getMarkerLabel: (driver: DriverLocation) => string;
  onSelect: (driver: DriverLocation) => void;
}

interface MarkerEntry {
  driver: DriverLocation;
  marker: MapLibreMarker;
}

export default function AdminDriverMap({
  drivers,
  statusLabels,
  selectedDriverId,
  copy,
  styleUrl,
  loadingLabel,
  errorTitle,
  errorDescription,
  getMarkerLabel,
  onSelect,
}: AdminDriverMapProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<MapLibreMap | null>(null);
  const markersRef = useRef<MarkerEntry[]>([]);
  const popupRef = useRef<MapLibrePopup | null>(null);
  const selectedDriverIdRef = useRef(selectedDriverId);
  const [mapStatus, setMapStatus] = useState<MapStatus>('loading');

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return undefined;

    let disposed = false;
    setMapStatus('loading');

    let map: MapLibreMap;
    try {
      map = new MapLibreMap({
        container,
        style: styleUrl,
        center: VIETNAM_CENTER,
        zoom: VIETNAM_DEFAULT_ZOOM,
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
    popupRef.current = new MapLibrePopup({
      closeButton: true,
      closeOnClick: true,
      focusAfterOpen: false,
      offset: 18,
    });
    map.addControl(new NavigationControl({ showCompass: false }), 'top-left');
    map.addControl(new AttributionControl({ compact: true }), 'bottom-right');

    const loadTimeout = window.setTimeout(() => {
      if (!disposed) setMapStatus((current) => (current === 'loading' ? 'error' : current));
    }, 20_000);

    const handleLoad = () => {
      if (disposed) return;
      window.clearTimeout(loadTimeout);
      addVietnamBoundary(map);
      setMapStatus('ready');
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
      markersRef.current.forEach(({ marker }) => marker.remove());
      markersRef.current = [];
      popupRef.current?.remove();
      popupRef.current = null;
      map.remove();
      mapRef.current = null;
    };
  }, [styleUrl]);

  useEffect(() => {
    selectedDriverIdRef.current = selectedDriverId;
    const map = mapRef.current;
    if (!map || mapStatus !== 'ready') return;

    const selectedEntry = findSelectedEntry(markersRef.current, selectedDriverId);
    if (selectedEntry) {
      openDriverPopup(map, popupRef.current, selectedEntry, statusLabels, copy);
    } else {
      popupRef.current?.remove();
    }
  }, [copy, mapStatus, selectedDriverId, statusLabels]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || mapStatus !== 'ready') return undefined;

    markersRef.current.forEach(({ marker }) => marker.remove());
    const entries = drivers.map((driver) => {
      const markerLabel = getMarkerLabel(driver);
      const markerElement = createDriverMarkerElement(driver, markerLabel);
      const marker = new MapLibreMarker({
        element: markerElement,
        anchor: 'center',
      })
        .setLngLat([driver.lng, driver.lat])
        .addTo(map);

      const entry = { driver, marker };
      markerElement.addEventListener('click', () => {
        onSelect(driver);
        openDriverPopup(map, popupRef.current, entry, statusLabels, copy);
      });
      return entry;
    });

    markersRef.current = entries;
    fitMapToDrivers(map, drivers);

    const selectedEntry = findSelectedEntry(entries, selectedDriverIdRef.current);
    if (selectedEntry) {
      openDriverPopup(map, popupRef.current, selectedEntry, statusLabels, copy);
    }

    return () => {
      entries.forEach(({ marker }) => marker.remove());
      if (markersRef.current === entries) markersRef.current = [];
    };
  }, [copy, drivers, getMarkerLabel, mapStatus, onSelect, statusLabels]);

  return (
    <div className="relative h-full w-full bg-muted/20">
      <div
        ref={containerRef}
        className="h-full min-h-[480px] w-full"
        data-testid="admin-driver-map-canvas"
      />
      {mapStatus === 'loading' ? (
        <div
          role="status"
          className="pointer-events-none absolute inset-0 flex items-center justify-center bg-background/75 text-sm text-muted-foreground backdrop-blur-sm"
        >
          {loadingLabel}
        </div>
      ) : null}
      {mapStatus === 'error' ? (
        <div
          role="alert"
          className="absolute inset-0 flex items-center justify-center bg-background/95 p-6 text-center"
        >
          <div>
            <p className="text-sm font-medium text-foreground">{errorTitle}</p>
            <p className="mt-1 max-w-sm text-xs text-muted-foreground">{errorDescription}</p>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function addVietnamBoundary(map: MapLibreMap): void {
  if (!map.getSource(BOUNDARY_SOURCE_ID)) {
    map.addSource(BOUNDARY_SOURCE_ID, {
      type: 'geojson',
      data: '/data/vietnam-boundary.geojson',
    });
  }
  if (!map.getLayer(BOUNDARY_FILL_LAYER_ID)) {
    map.addLayer({
      id: BOUNDARY_FILL_LAYER_ID,
      type: 'fill',
      source: BOUNDARY_SOURCE_ID,
      paint: {
        'fill-color': '#16a34a',
        'fill-opacity': 0.06,
      },
    });
  }
  if (!map.getLayer(BOUNDARY_LINE_LAYER_ID)) {
    map.addLayer({
      id: BOUNDARY_LINE_LAYER_ID,
      type: 'line',
      source: BOUNDARY_SOURCE_ID,
      paint: {
        'line-color': '#16a34a',
        'line-opacity': 0.6,
        'line-width': 2,
      },
    });
  }
}

function createDriverMarkerElement(driver: DriverLocation, label: string): HTMLButtonElement {
  const element = document.createElement('button');
  const isStale = driver.isStale === true;
  element.type = 'button';
  element.className = 'foodflow-driver-marker';
  element.title = label;
  element.setAttribute('aria-label', label);
  element.style.backgroundColor = statusColors[driver.status];
  element.style.opacity = isStale ? '0.55' : '1';
  element.style.borderColor = isStale ? '#facc15' : '#ffffff';
  element.style.borderWidth = isStale ? '3px' : '2px';
  return element;
}

function findSelectedEntry(entries: MarkerEntry[], selectedDriverId?: string): MarkerEntry | undefined {
  if (!selectedDriverId) return undefined;
  return entries.find(
    ({ driver }) => driver.id === selectedDriverId || driver.driverId === selectedDriverId,
  );
}

function openDriverPopup(
  map: MapLibreMap,
  popup: MapLibrePopup | null,
  entry: MarkerEntry,
  statusLabels: Record<DriverLocation['status'], string>,
  copy: DriverMarkerCopy,
): void {
  if (!popup) return;
  const { driver } = entry;
  popup
    .setLngLat([driver.lng, driver.lat])
    .setHTML(buildDriverInfoWindowHtml(driver, statusLabels[driver.status], copy))
    .addTo(map);
  map.easeTo({ center: [driver.lng, driver.lat], duration: 350 });
}

function fitMapToDrivers(map: MapLibreMap, drivers: DriverLocation[]): void {
  if (drivers.length === 0) return;
  if (drivers.length === 1) {
    map.easeTo({ center: [drivers[0].lng, drivers[0].lat], zoom: 13, duration: 0 });
    return;
  }

  const bounds = new LngLatBounds();
  drivers.forEach((driver) => bounds.extend([driver.lng, driver.lat]));
  map.fitBounds(bounds, { padding: 80, maxZoom: 14, duration: 0 });
}
