'use client';

import { useEffect, useRef } from 'react';
import type { Map as MapLibreMap, Marker as MapLibreMarker } from 'maplibre-gl';
import { assertProductionPublicUrl } from '@/lib/public-env';
import { decodePolyline, latLngBoundsFrom } from '@/lib/polyline';

interface Props {
  driverLocation?: { lat: number; lng: number } | null;
  restaurantLocation?: { lat: number; lng: number } | null;
  destinationLocation?: { lat: number; lng: number } | null;
  routePolyline?: string | null;
  className?: string;
}

export function TrackingMap({
  driverLocation,
  restaurantLocation,
  destinationLocation,
  routePolyline,
  className,
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MapLibreMap | null>(null);
  const markersRef = useRef<MapLibreMarker[]>([]);
  const fitted = useRef(false);

  const styleUrl = resolveMapStyle();

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;
    let cancelled = false;
    void (async () => {
      const maplibregl = await import('maplibre-gl');
      if (cancelled || !containerRef.current) return;
      const map = new maplibregl.Map({
        container: containerRef.current,
        style: styleUrl,
        center: [105.85, 21.02],
        zoom: 13,
        attributionControl: { compact: true },
      });
      map.addControl(new maplibregl.NavigationControl({ showCompass: false }), 'top-right');
      mapRef.current = map;
    })();
    return () => {
      cancelled = true;
      mapRef.current?.remove();
      mapRef.current = null;
      fitted.current = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    void (async () => {
      const maplibregl = await import('maplibre-gl');
      markersRef.current.forEach((m) => m.remove());
      markersRef.current = [];

      const points: [number, number][] = [];
      const addMarker = (
        loc: { lat: number; lng: number } | null | undefined,
        color: string,
        label: string,
      ) => {
        if (!loc) return;
        const el = document.createElement('div');
        el.style.cssText = `width:14px;height:14px;border-radius:50%;background:${color};border:3px solid #fff;box-shadow:0 1px 4px rgba(0,0,0,.3)`;
        el.setAttribute('aria-label', label);
        markersRef.current.push(
          new maplibregl.Marker({ element: el }).setLngLat([loc.lng, loc.lat]).addTo(map),
        );
        points.push([loc.lng, loc.lat]);
      };

      addMarker(restaurantLocation, '#ea580c', 'Restaurant');
      addMarker(destinationLocation, '#16a34a', 'Delivery address');
      addMarker(driverLocation, '#2563eb', 'Driver');

      const decoded = routePolyline
        ? decodePolyline(routePolyline).map((p): [number, number] => [p.lng, p.lat])
        : [];
      if (decoded.length > 1) {
        const geojson = {
          type: 'Feature' as const,
          properties: {},
          geometry: { type: 'LineString' as const, coordinates: decoded },
        };
        const applyRoute = () => {
          if (map.getSource('route')) {
            (map.getSource('route') as import('maplibre-gl').GeoJSONSource).setData({
              type: 'FeatureCollection',
              features: [geojson],
            });
          } else {
            map.addSource('route', {
              type: 'geojson',
              data: { type: 'FeatureCollection', features: [geojson] },
            });
            map.addLayer({
              id: 'route',
              type: 'line',
              source: 'route',
              paint: { 'line-color': '#2563eb', 'line-width': 4, 'line-opacity': 0.7 },
            });
          }
          decoded.forEach((c) => points.push(c));
        };
        if (map.isStyleLoaded()) applyRoute();
        else map.once('load', applyRoute);
      }

      if (!fitted.current && points.length > 0) {
        const bounds = latLngBoundsFrom(points);
        if (bounds) {
          map.fitBounds(bounds, { padding: 48, maxZoom: 15 });
          fitted.current = true;
        }
      } else if (driverLocation) {
        map.easeTo({ center: [driverLocation.lng, driverLocation.lat], duration: 500 });
      }
    })();
  }, [driverLocation, restaurantLocation, destinationLocation, routePolyline]);

  return (
    <div
      ref={containerRef}
      role="img"
      aria-label="Delivery tracking map"
      className={className ?? 'h-64 w-full rounded-xl border bg-slate-100'}
    />
  );
}

function resolveMapStyle(): string {
  const url = process.env.NEXT_PUBLIC_MAP_TILES_URL?.trim();
  if (url) {
    return assertProductionPublicUrl('NEXT_PUBLIC_MAP_TILES_URL', url, process.env, [
      'https:',
      'http:',
    ]);
  }
  const key = process.env.NEXT_PUBLIC_MAPTILER_KEY?.trim();
  if (key) {
    return `https://api.maptiler.com/maps/streets-v2/style.json?key=${encodeURIComponent(key)}`;
  }
  return 'https://tiles.openfreemap.org/styles/liberty';
}
