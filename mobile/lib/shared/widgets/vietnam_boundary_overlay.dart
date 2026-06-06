import 'dart:convert';
import 'dart:ui' show Color;
import 'package:flutter/services.dart' show rootBundle;
import 'package:google_maps_flutter/google_maps_flutter.dart';

/// Overlay hiển thị ranh giới toàn vẹn lãnh thổ Việt Nam bao gồm
/// Hoàng Sa (Paracel) và Trường Sa (Spratly) trên GoogleMap.
///
/// Dùng [VietnamBoundaryOverlay.polygons] như là giá trị của
/// `GoogleMap.polygons` parameter.
class VietnamBoundaryOverlay {
  VietnamBoundaryOverlay._();

  static Set<Polygon>? _cached;

  /// Tải và parse GeoJSON, cache kết quả.
  static Future<Set<Polygon>> get polygons async {
    if (_cached != null) return _cached!;
    const path = 'assets/geo/vietnam-boundary.geojson';
    final raw = await rootBundle.loadString(path);
    final map = json.decode(raw) as Map<String, dynamic>;
    final features = map['features'] as List<dynamic>;
    final result = <Polygon>{};
    for (final f in features) {
      final feature = f as Map<String, dynamic>;
      final id = feature['id'] as String;
      final geom = feature['geometry'] as Map<String, dynamic>;
      final coords = geom['coordinates'] as List<dynamic>;
      // GeoJSON Polygon: coordinates[0] is outer ring array of [lng, lat]
      final ring = coords[0] as List<dynamic>;
      final points = ring.map((c) {
        final pair = c as List<dynamic>;
        return LatLng(pair[1] as double, pair[0] as double);
      }).toList();
      result.add(Polygon(
        polygonId: PolygonId(id),
        points: points,
        strokeColor: _strokeColor,
        strokeWidth: _strokeWidth,
        fillColor: _fillColor,
        geodesic: true,
      ));
    }
    _cached = result;
    return result;
  }

  static const Color _strokeColor = Color(0xFFDC2626);
  static const int _strokeWidth = 2;
  static const Color _fillColor = Color(0x00000000);
}
