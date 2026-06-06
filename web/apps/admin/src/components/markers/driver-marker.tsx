'use client';

import { useEffect, useRef } from 'react';

type DriverStatus = 'online' | 'free' | 'delivering' | 'busy';

interface DriverMarkerProps {
  map: google.maps.Map | null;
  position: { lat: number; lng: number };
  status: DriverStatus;
  title: string;
  onClick?: () => void;
}

const markerColors: Record<DriverStatus, string> = {
  online: '#22c55e',
  free: '#22c55e',
  delivering: '#f97316',
  busy: '#ef4444',
};

export default function DriverMarker({ map, position, status, title, onClick }: DriverMarkerProps) {
  const markerRef = useRef<google.maps.Marker | null>(null);

  useEffect(() => {
    if (!map || !google?.maps) return;
    const color = markerColors[status] || '#22c55e';
    const svgIcon = {
      path: google.maps.SymbolPath.CIRCLE,
      scale: 10,
      fillColor: color,
      fillOpacity: 1,
      strokeColor: '#ffffff',
      strokeWeight: 2,
    };
    const marker = new google.maps.Marker({
      map,
      position,
      title,
      icon: svgIcon,
      animation: google.maps.Animation.DROP,
    });
    if (onClick) marker.addListener('click', onClick);
    markerRef.current = marker;
    return () => {
      marker.setMap(null);
      markerRef.current = null;
    };
  }, [map, position.lat, position.lng]);

  useEffect(() => {
    if (markerRef.current) {
      const color = markerColors[status] || '#22c55e';
      markerRef.current.setIcon({
        path: google.maps.SymbolPath.CIRCLE,
        scale: 10,
        fillColor: color,
        fillOpacity: 1,
        strokeColor: '#ffffff',
        strokeWeight: 2,
      });
    }
  }, [status]);

  return null;
}
