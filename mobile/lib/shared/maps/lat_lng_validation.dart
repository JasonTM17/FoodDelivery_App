/// Shared coordinate guards for FoodFlow's Vietnam delivery map.
///
/// Backend tracking rejects driver telemetry outside the Vietnam operating
/// bounds, and the mobile apps should apply the same defensive rule before
/// drawing markers, telemetry trails, or opening navigation URLs.
const double vietnamDeliverySouth = 3.8;
const double vietnamDeliveryNorth = 23.5;
const double vietnamDeliveryWest = 102.0;
const double vietnamDeliveryEast = 117.5;

bool isValidWorldLatLng(double? lat, double? lng) {
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

bool isValidDeliveryLatLng(double? lat, double? lng) {
  return isValidWorldLatLng(lat, lng) &&
      lat! >= vietnamDeliverySouth &&
      lat <= vietnamDeliveryNorth &&
      lng! >= vietnamDeliveryWest &&
      lng <= vietnamDeliveryEast;
}
