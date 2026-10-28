export interface LatLng {
  lat: number;
  lng: number;
}

/**
 * Decodes a Google encoded-polyline string into coordinates. Mirrors the
 * mobile decoder; returns an empty list on malformed input instead of
 * fabricating points.
 */
export function decodePolyline(encoded: string): LatLng[] {
  if (!encoded || typeof encoded !== 'string') return [];
  const points: LatLng[] = [];
  let index = 0;
  let lat = 0;
  let lng = 0;

  try {
    while (index < encoded.length) {
      const latResult = readSignedDelta(encoded, index);
      if (!latResult) return [];
      index = latResult.next;
      lat += latResult.delta;

      const lngResult = readSignedDelta(encoded, index);
      if (!lngResult) return [];
      index = lngResult.next;
      lng += lngResult.delta;

      points.push({ lat: lat / 1e5, lng: lng / 1e5 });
    }
  } catch {
    return [];
  }

  return points;
}

function readSignedDelta(
  encoded: string,
  startIndex: number,
): { delta: number; next: number } | null {
  let result = 0;
  let shift = 0;
  let index = startIndex;

  while (index < encoded.length) {
    const byte = encoded.charCodeAt(index) - 63;
    index += 1;
    if (byte < 0 || byte > 127) return null;
    result |= (byte & 0x1f) << shift;
    shift += 5;
    if (byte < 0x20) {
      const delta = result & 1 ? ~(result >> 1) : result >> 1;
      return { delta, next: index };
    }
    if (shift > 30) return null;
  }

  return null;
}

/** Bounds for [[lng,lat], ...] coordinate arrays (GeoJSON order). */
export function latLngBoundsFrom(
  coordinates: [number, number][],
): [[number, number], [number, number]] | null {
  if (coordinates.length === 0) return null;
  let minLng = Infinity;
  let minLat = Infinity;
  let maxLng = -Infinity;
  let maxLat = -Infinity;
  for (const [lng, lat] of coordinates) {
    if (!Number.isFinite(lng) || !Number.isFinite(lat)) continue;
    if (lng < minLng) minLng = lng;
    if (lng > maxLng) maxLng = lng;
    if (lat < minLat) minLat = lat;
    if (lat > maxLat) maxLat = lat;
  }
  if (!Number.isFinite(minLng)) return null;
  return [
    [minLng, minLat],
    [maxLng, maxLat],
  ];
}
