/// Vietnam map constants including Hoàng Sa (Paracel) and Trường Sa (Spratly) archipelagos.
///
/// MUST show full Vietnamese sovereignty including these island groups.
/// Default camera should center on mainland Vietnam with all territory visible.

import 'package:google_maps_flutter/google_maps_flutter.dart';

/// Vietnam bounds encompassing all territory including islands.
/// North: 23.5°N (Lào Cai border)
/// South: 3.8°N (Trường Sa southern reach)
/// West: 102.0°E (Điện Biên border)
/// East: 117.5°E (Trường Sa eastern reach)
class VietnamMapConstants {
  VietnamMapConstants._();

  /// Camera position showing full Vietnam territory
  static const CameraPosition defaultCamera = CameraPosition(
    target: LatLng(14.0, 108.0), // Center of Vietnam
    zoom: 6,
  );

  /// LatLngBounds covering all of Vietnam including Hoàng Sa & Trường Sa
  static final LatLngBounds vietnamBounds = LatLngBounds(
    southwest: const LatLng(3.8, 102.0),
    northeast: const LatLng(23.5, 117.5),
  );

  /// Hoàng Sa (Paracel Islands) approximate bounds
  static final LatLngBounds hoangSaBounds = LatLngBounds(
    southwest: const LatLng(15.6, 111.0),
    northeast: const LatLng(17.0, 113.0),
  );

  /// Trường Sa (Spratly Islands) approximate bounds
  static final LatLngBounds truongSaBounds = LatLngBounds(
    southwest: const LatLng(4.0, 111.5),
    northeast: const LatLng(12.0, 117.5),
  );

  /// Key landmarks for map labels
  static const LatLng hoangSaCenter = LatLng(16.5, 112.0);
  static const LatLng truongSaCenter = LatLng(8.5, 114.0);

  /// Min zoom level to always show full territory
  static const double minZoom = 5;

  /// Max zoom level for detail views
  static const double maxZoom = 19;
}