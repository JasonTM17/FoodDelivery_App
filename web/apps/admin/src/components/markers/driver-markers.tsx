'use client';

import { useEffect, useRef } from 'react';
import { useMap } from '@vis.gl/react-google-maps';
import type { DriverLocation } from '@/hooks/use-realtime-driver-locations';
import { buildDriverInfoWindowHtml, type DriverMarkerCopy } from './driver-marker-html';

const statusColors: Record<string, string> = {
  online: '#22c55e',
  offline: '#64748b',
  free: '#22c55e',
  delivering: '#f97316',
  busy: '#ef4444',
};

interface DriverMarkersProps {
  drivers: DriverLocation[];
  statusLabels: Record<DriverLocation['status'], string>;
  selectedDriverId?: string;
  copy: DriverMarkerCopy;
  onSelect: (driver: DriverLocation) => void;
}

interface MarkerEntry {
  driver: DriverLocation;
  marker: google.maps.Marker;
}

export default function DriverMarkers({
  drivers,
  statusLabels,
  selectedDriverId,
  copy,
  onSelect,
}: DriverMarkersProps) {
  const map = useMap();
  const markersRef = useRef<google.maps.Marker[]>([]);
  const markerEntriesRef = useRef<MarkerEntry[]>([]);
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
      markerEntriesRef.current = [];
    };
  }, [map]);

  useEffect(() => {
    if (!map || !infoWindowRef.current) return undefined;
    markersRef.current.forEach((marker) => marker.setMap(null));

    const newEntries = drivers.map((driver) => {
      const color = statusColors[driver.status] || '#22c55e';
      const isStale = driver.isStale === true;
      const marker = new google.maps.Marker({
        map,
        position: { lat: driver.lat, lng: driver.lng },
        title: isStale ? `${driver.name} (${copy.stale})` : driver.name,
        icon: {
          path: google.maps.SymbolPath.CIRCLE,
          scale: 10,
          fillColor: color,
          fillOpacity: isStale ? 0.45 : 1,
          strokeColor: isStale ? '#facc15' : '#ffffff',
          strokeWeight: isStale ? 3 : 2,
        },
      });

      marker.addListener('click', () => {
        onSelect(driver);
        openDriverInfoWindow(map, infoWindowRef.current, marker, driver, statusLabels, copy);
      });

      return { driver, marker };
    });

    markerEntriesRef.current = newEntries;
    markersRef.current = newEntries.map((entry) => entry.marker);
    fitMapToDrivers(map, drivers);

    const selectedEntry = findSelectedEntry(newEntries, selectedDriverId);
    if (selectedEntry) {
      openDriverInfoWindow(map, infoWindowRef.current, selectedEntry.marker, selectedEntry.driver, statusLabels, copy);
    }

    return () => { newEntries.forEach((entry) => entry.marker.setMap(null)); };
  }, [map, drivers, selectedDriverId, statusLabels, copy, onSelect]);

  useEffect(() => {
    if (!map || !infoWindowRef.current) return;

    const selectedEntry = findSelectedEntry(markerEntriesRef.current, selectedDriverId);
    if (!selectedEntry) return;

    openDriverInfoWindow(map, infoWindowRef.current, selectedEntry.marker, selectedEntry.driver, statusLabels, copy);
  }, [map, selectedDriverId, statusLabels, copy]);

  return null;
}

function findSelectedEntry(entries: MarkerEntry[], selectedDriverId?: string): MarkerEntry | undefined {
  if (!selectedDriverId) return undefined;
  return entries.find((entry) => entry.driver.id === selectedDriverId || entry.driver.driverId === selectedDriverId);
}

function openDriverInfoWindow(
  map: google.maps.Map,
  infoWindow: google.maps.InfoWindow | null,
  marker: google.maps.Marker,
  driver: DriverLocation,
  statusLabels: Record<DriverLocation['status'], string>,
  copy: DriverMarkerCopy,
): void {
  infoWindow?.setContent(buildDriverInfoWindowHtml(driver, statusLabels[driver.status], copy));
  infoWindow?.open(map, marker);
  map.panTo({ lat: driver.lat, lng: driver.lng });
}

function fitMapToDrivers(map: google.maps.Map, drivers: DriverLocation[]): void {
  if (drivers.length === 0) return;
  if (drivers.length === 1) {
    map.setCenter({ lat: drivers[0].lat, lng: drivers[0].lng });
    map.setZoom(13);
    return;
  }

  const bounds = new google.maps.LatLngBounds();
  drivers.forEach((driver) => bounds.extend({ lat: driver.lat, lng: driver.lng }));
  map.fitBounds(bounds, 80);
}
