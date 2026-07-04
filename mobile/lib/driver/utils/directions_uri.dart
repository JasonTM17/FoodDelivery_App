import '../../shared/maps/lat_lng_validation.dart';

Uri? buildGoogleMapsDirectionsUri({
  required double? destinationLat,
  required double? destinationLng,
  double? originLat,
  double? originLng,
}) {
  if (!isValidDeliveryLatLng(destinationLat, destinationLng)) return null;

  final query = <String, String>{
    'api': '1',
    'destination':
        '${_formatCoordinate(destinationLat!)},${_formatCoordinate(destinationLng!)}',
    'travelmode': 'driving',
    'dir_action': 'navigate',
  };

  if (isValidDeliveryLatLng(originLat, originLng)) {
    query['origin'] =
        '${_formatCoordinate(originLat!)},${_formatCoordinate(originLng!)}';
  }

  return Uri.https('www.google.com', '/maps/dir/', query);
}

String _formatCoordinate(double value) => value.toStringAsFixed(6);
