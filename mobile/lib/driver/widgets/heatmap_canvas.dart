import 'dart:async';

import 'package:flutter/material.dart';
import 'package:google_maps_flutter/google_maps_flutter.dart';

import '../../shared/maps/lat_lng_validation.dart';
import '../../shared/theme/vietnam_map_constants.dart';
import '../providers/heatmap_provider.dart';

class HeatmapCanvas extends StatefulWidget {
  final List<HeatmapPoint> points;
  final double centerLat;
  final double centerLng;
  final ValueChanged<HeatmapPoint>? onPointTap;

  const HeatmapCanvas({
    super.key,
    required this.points,
    required this.centerLat,
    required this.centerLng,
    this.onPointTap,
  });

  @override
  State<HeatmapCanvas> createState() => _HeatmapCanvasState();
}

class _HeatmapCanvasState extends State<HeatmapCanvas> {
  final Completer<GoogleMapController> _mapController = Completer();
  String _lastBoundsSignature = '';

  static const _lowColor = Color(0xFF3B82F6);
  static const _medColor = Color(0xFFF97316);
  static const _highColor = Color(0xFFEF4444);

  @override
  void didUpdateWidget(covariant HeatmapCanvas oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (oldWidget.points != widget.points ||
        oldWidget.centerLat != widget.centerLat ||
        oldWidget.centerLng != widget.centerLng) {
      _lastBoundsSignature = '';
      WidgetsBinding.instance.addPostFrameCallback((_) {
        if (mounted) {
          _fitDemandAreaToMap();
        }
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    final center = _center();
    final points = _validPoints();
    return GoogleMap(
      mapType: MapType.normal,
      initialCameraPosition: CameraPosition(target: center, zoom: 13),
      onMapCreated: (controller) {
        if (!_mapController.isCompleted) {
          _mapController.complete(controller);
        }
        _fitDemandAreaToMap();
      },
      markers: _buildMarkers(center),
      circles: _buildDemandCircles(points),
      minMaxZoomPreference: const MinMaxZoomPreference(
        VietnamMapConstants.minZoom,
        VietnamMapConstants.maxZoom,
      ),
      myLocationButtonEnabled: false,
      myLocationEnabled: false,
      zoomControlsEnabled: false,
      compassEnabled: true,
    );
  }

  LatLng _center() {
    if (isValidDeliveryLatLng(widget.centerLat, widget.centerLng)) {
      return LatLng(widget.centerLat, widget.centerLng);
    }
    return const LatLng(10.7769, 106.7009);
  }

  List<HeatmapPoint> _validPoints() {
    return widget.points
        .where((point) => isValidDeliveryLatLng(point.lat, point.lng))
        .toList(growable: false);
  }

  Set<Marker> _buildMarkers(LatLng center) {
    return {
      Marker(
        markerId: const MarkerId('driver-location'),
        position: center,
        icon: BitmapDescriptor.defaultMarkerWithHue(BitmapDescriptor.hueAzure),
      ),
    };
  }

  Set<Circle> _buildDemandCircles(List<HeatmapPoint> points) {
    return points.asMap().entries.map((entry) {
      final point = entry.value;
      final color = _demandColor(point.demandLevel);
      return Circle(
        circleId: CircleId('demand-${entry.key}-${point.lat}-${point.lng}'),
        center: LatLng(point.lat, point.lng),
        radius: _demandRadiusMeters(point),
        fillColor: color.withValues(alpha: 0.28),
        strokeColor: color.withValues(alpha: 0.85),
        strokeWidth: 2,
        consumeTapEvents: widget.onPointTap != null,
        onTap: widget.onPointTap == null
            ? null
            : () => widget.onPointTap!(point),
      );
    }).toSet();
  }

  Color _demandColor(int level) => switch (level) {
    2 => _highColor,
    1 => _medColor,
    _ => _lowColor,
  };

  double _demandRadiusMeters(HeatmapPoint point) {
    final demandBoost = point.demandLevel * 120;
    final volumeBoost = point.orderCount.clamp(0, 20) * 12;
    return 220 + demandBoost + volumeBoost.toDouble();
  }

  Future<void> _fitDemandAreaToMap() async {
    if (!_mapController.isCompleted) return;
    final center = _center();
    final points = [
      center,
      ..._validPoints().map((point) => LatLng(point.lat, point.lng)),
    ];
    if (points.isEmpty) return;

    final signature = points
        .map(
          (point) =>
              '${point.latitude.toStringAsFixed(5)},${point.longitude.toStringAsFixed(5)}',
        )
        .join('|');
    if (signature == _lastBoundsSignature) return;
    _lastBoundsSignature = signature;

    final controller = await _mapController.future;
    if (!mounted) return;

    if (points.length == 1) {
      await controller.animateCamera(CameraUpdate.newLatLngZoom(center, 13));
      return;
    }

    await controller.animateCamera(
      CameraUpdate.newLatLngBounds(_boundsFor(points), 56),
    );
  }

  LatLngBounds _boundsFor(List<LatLng> points) {
    var minLat = points.first.latitude;
    var maxLat = points.first.latitude;
    var minLng = points.first.longitude;
    var maxLng = points.first.longitude;

    for (final point in points.skip(1)) {
      if (point.latitude < minLat) minLat = point.latitude;
      if (point.latitude > maxLat) maxLat = point.latitude;
      if (point.longitude < minLng) minLng = point.longitude;
      if (point.longitude > maxLng) maxLng = point.longitude;
    }

    if ((maxLat - minLat).abs() < 0.001) {
      minLat -= 0.005;
      maxLat += 0.005;
    }
    if ((maxLng - minLng).abs() < 0.001) {
      minLng -= 0.005;
      maxLng += 0.005;
    }

    return LatLngBounds(
      southwest: LatLng(minLat, minLng),
      northeast: LatLng(maxLat, maxLng),
    );
  }
}
