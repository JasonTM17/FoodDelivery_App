'use client';

import { useEffect, useRef } from 'react';
import { useMap } from '@vis.gl/react-google-maps';
import type { DriverLocation } from '@/hooks/use-realtime-driver-locations';

const statusColors: Record<string, string> = {
  online: '#22c55e',
  free: '#22c55e',
  delivering: '#f97316',
  busy: '#ef4444',
};

interface DriverMarkersProps {
  drivers: DriverLocation[];
  statusLabels: Record<DriverLocation['status'], string>;
}

export default function DriverMarkers({ drivers, statusLabels }: DriverMarkersProps) {
  const map = useMap();
  const markersRef = useRef<google.maps.Marker[]>([]);
  const infoWindowRef = useRef<google.maps.InfoWindow | null>(null);
  const boundaryRef = useRef<google.maps.Data | null>(null);

  useEffect(() => {
    if (!map) return undefined;
    const dataLayer = new google.maps.Data();
    dataLayer.loadGeoJson('/data/vietnam-boundary.geojson');
    dataLayer.setStyle({
      fillColor: '#2ECC71',
      fillOpacity: 0.06,
      strokeColor: '#2ECC71',
      strokeWeight: 2,
      strokeOpacity: 0.5,
    });
    dataLayer.setMap(map);
    boundaryRef.current = dataLayer;
    return () => { dataLayer.setMap(null); };
  }, [map]);

  useEffect(() => {
    if (!map) return undefined;
    infoWindowRef.current = new google.maps.InfoWindow();
    return () => {
      markersRef.current.forEach((marker) => marker.setMap(null));
      markersRef.current = [];
    };
  }, [map]);

  useEffect(() => {
    if (!map || !infoWindowRef.current) return undefined;
    markersRef.current.forEach((marker) => marker.setMap(null));

    const newMarkers = drivers.map((driver) => {
      const color = statusColors[driver.status] || '#22c55e';
      const marker = new google.maps.Marker({
        map,
        position: { lat: driver.lat, lng: driver.lng },
        title: driver.name,
        icon: {
          path: google.maps.SymbolPath.CIRCLE,
          scale: 10,
          fillColor: color,
          fillOpacity: 1,
          strokeColor: '#ffffff',
          strokeWeight: 2,
        },
      });

      marker.addListener('click', () => {
        infoWindowRef.current?.setContent(
          `<div style="min-width:180px;padding:8px;font-size:13px"><strong>${escapeHtml(driver.name)}</strong><br/>Rating: ${driver.rating.toFixed(1)}<br/>Status: ${escapeHtml(statusLabels[driver.status])}${driver.currentOrder ? `<br/>Order: ${escapeHtml(driver.currentOrder)}` : ''}</div>`,
        );
        infoWindowRef.current?.open(map, marker);
      });

      return marker;
    });

    markersRef.current = newMarkers;
    return () => { newMarkers.forEach((marker) => marker.setMap(null)); };
  }, [map, drivers, statusLabels]);

  return null;
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
