Uri? buildGoogleMapsDirectionsUri({
  required double? destinationLat,
  required double? destinationLng,
  double? originLat,
  double? originLng,
}) {
  if (!_isValidLatLng(destinationLat, destinationLng)) return null;

  final query = <String, String>{
    'api': '1',
    'destination':
        '${_formatCoordinate(destinationLat!)},${_formatCoordinate(destinationLng!)}',
    'travelmode': 'driving',
    'dir_action': 'navigate',
  };

  if (_isValidLatLng(originLat, originLng)) {
    query['origin'] =
        '${_formatCoordinate(originLat!)},${_formatCoordinate(originLng!)}';
  }

  return Uri.https('www.google.com', '/maps/dir/', query);
}

bool _isValidLatLng(double? lat, double? lng) {
  return lat != null &&
      lng != null &&
      lat.isFinite &&
      lng.isFinite &&
      lat >= -90 &&
      lat <= 90 &&
      lng >= -180 &&
      lng <= 180 &&
      !(lat == 0 && lng == 0);
}

String _formatCoordinate(double value) => value.toStringAsFixed(6);
