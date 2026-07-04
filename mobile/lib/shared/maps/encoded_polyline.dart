class RouteCoordinate {
  final double latitude;
  final double longitude;

  const RouteCoordinate({required this.latitude, required this.longitude});
}

/// Decodes Google/OSRM encoded polyline geometry using 1e-5 precision.
///
/// Throws [FormatException] for malformed input so callers can choose whether
/// to fail loudly or degrade to "no route available" without inventing points.
List<RouteCoordinate> decodeEncodedPolyline(String encoded) {
  final points = <RouteCoordinate>[];
  var index = 0;
  var lat = 0;
  var lng = 0;

  int readDelta() {
    var shift = 0;
    var result = 0;
    int byte;

    do {
      if (index >= encoded.length) {
        throw const FormatException('Truncated encoded polyline');
      }
      byte = encoded.codeUnitAt(index++) - 63;
      if (byte < 0) {
        throw const FormatException('Invalid encoded polyline character');
      }
      result |= (byte & 0x1f) << shift;
      shift += 5;
      if (shift > 30) {
        throw const FormatException('Encoded polyline coordinate overflow');
      }
    } while (byte >= 0x20);

    return (result & 1) != 0 ? ~(result >> 1) : result >> 1;
  }

  while (index < encoded.length) {
    lat += readDelta();
    lng += readDelta();
    final point = RouteCoordinate(latitude: lat / 1e5, longitude: lng / 1e5);
    if (_isValidCoordinate(point)) {
      points.add(point);
    }
  }

  return points;
}

/// Safe route decoder for runtime UI. Invalid or missing backend geometry
/// becomes an empty list; the UI can then show markers only instead of drawing
/// fake straight lines.
List<RouteCoordinate> tryDecodeEncodedPolyline(String? encoded) {
  final value = encoded?.trim();
  if (value == null || value.isEmpty) return const [];
  try {
    return decodeEncodedPolyline(value);
  } on FormatException {
    return const [];
  }
}

bool _isValidCoordinate(RouteCoordinate point) {
  return point.latitude.isFinite &&
      point.longitude.isFinite &&
      point.latitude >= -90 &&
      point.latitude <= 90 &&
      point.longitude >= -180 &&
      point.longitude <= 180;
}
