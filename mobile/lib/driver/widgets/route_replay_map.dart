import 'dart:async';

import 'package:flutter/material.dart';
import 'package:google_maps_flutter/google_maps_flutter.dart';

import '../../l10n/app_localizations.dart';
import '../../shared/maps/lat_lng_validation.dart';
import '../../shared/theme/app_colors.dart';
import '../../shared/theme/vietnam_map_constants.dart';

class RouteReplayMap extends StatefulWidget {
  final List<RoutePointData> points;
  final double fromLat;
  final double fromLng;
  final double toLat;
  final double toLng;
  final double width;
  final double height;
  final bool isEstimated;

  const RouteReplayMap({
    super.key,
    required this.points,
    required this.fromLat,
    required this.fromLng,
    required this.toLat,
    required this.toLng,
    this.width = double.infinity,
    this.height = 280,
    this.isEstimated = false,
  });

  @override
  State<RouteReplayMap> createState() => _RouteReplayMapState();
}

class RoutePointData {
  final double lat;
  final double lng;

  const RoutePointData({required this.lat, required this.lng});
}

@visibleForTesting
List<LatLng> routeReplayValidRoutePoints(List<RoutePointData> points) {
  return points
      .where((point) => isValidDeliveryLatLng(point.lat, point.lng))
      .map((point) => LatLng(point.lat, point.lng))
      .toList(growable: false);
}

@visibleForTesting
LatLng? routeReplayInitialCameraTarget({
  required List<RoutePointData> points,
  required double fromLat,
  required double fromLng,
  required double toLat,
  required double toLng,
}) {
  final routePoints = routeReplayValidRoutePoints(points);
  if (routePoints.isNotEmpty) return routePoints.first;
  if (isValidDeliveryLatLng(fromLat, fromLng)) {
    return LatLng(fromLat, fromLng);
  }
  if (isValidDeliveryLatLng(toLat, toLng)) {
    return LatLng(toLat, toLng);
  }
  return null;
}

class _RouteReplayMapState extends State<RouteReplayMap>
    with SingleTickerProviderStateMixin {
  late final AnimationController _controller;
  late final Animation<double> _animation;
  final Completer<GoogleMapController> _mapController = Completer();
  String _lastBoundsSignature = '';

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(
      duration: const Duration(seconds: 8),
      vsync: this,
    );
    _animation = CurvedAnimation(parent: _controller, curve: Curves.easeInOut);
    _controller.addStatusListener((_) {
      if (mounted) setState(() {});
    });
  }

  @override
  void didUpdateWidget(covariant RouteReplayMap oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (oldWidget.points != widget.points ||
        oldWidget.fromLat != widget.fromLat ||
        oldWidget.fromLng != widget.fromLng ||
        oldWidget.toLat != widget.toLat ||
        oldWidget.toLng != widget.toLng) {
      _lastBoundsSignature = '';
      WidgetsBinding.instance.addPostFrameCallback((_) {
        if (mounted) {
          _fitRouteToMap();
        }
      });
    }
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  void _toggleReplay() {
    if (_controller.isAnimating) {
      _controller.stop();
      setState(() {});
      return;
    }
    if (_controller.isCompleted) {
      _controller.reset();
    }
    _controller.forward();
    setState(() {});
  }

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context);
    final routePoints = _validRoutePoints();
    final initialCameraTarget = routeReplayInitialCameraTarget(
      points: widget.points,
      fromLat: widget.fromLat,
      fromLng: widget.fromLng,
      toLat: widget.toLat,
      toLng: widget.toLng,
    );
    final hasReplayableRoute = routePoints.length >= 2;

    return Column(
      children: [
        Container(
          width: widget.width,
          height: widget.height,
          decoration: BoxDecoration(
            color: const Color(0xFF1E1E1E),
            borderRadius: BorderRadius.circular(16),
            border: Border.all(color: const Color(0xFF374151)),
          ),
          child: ClipRRect(
            borderRadius: BorderRadius.circular(16),
            child: initialCameraTarget == null
                ? _RouteReplayUnavailable(
                    message: l10n.driverNavDirectionsUnavailable,
                  )
                : AnimatedBuilder(
                    animation: _animation,
                    builder: (context, _) {
                      final currentPoint = _currentReplayPoint(routePoints);
                      return GoogleMap(
                        mapType: MapType.normal,
                        initialCameraPosition: CameraPosition(
                          target: initialCameraTarget,
                          zoom: hasReplayableRoute ? 13 : 15,
                        ),
                        onMapCreated: (controller) {
                          if (!_mapController.isCompleted) {
                            _mapController.complete(controller);
                          }
                          _fitRouteToMap();
                        },
                        markers: _buildMarkers(routePoints, currentPoint),
                        polylines: _buildPolylines(routePoints, currentPoint),
                        minMaxZoomPreference: const MinMaxZoomPreference(
                          VietnamMapConstants.minZoom,
                          VietnamMapConstants.maxZoom,
                        ),
                        myLocationButtonEnabled: false,
                        myLocationEnabled: false,
                        zoomControlsEnabled: false,
                        compassEnabled: true,
                      );
                    },
                  ),
          ),
        ),
        const SizedBox(height: 10),
        Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Container(
              decoration: BoxDecoration(
                color: AppColors.primary.withValues(alpha: 0.1),
                borderRadius: BorderRadius.circular(20),
              ),
              child: IconButton(
                icon: Icon(
                  _controller.isAnimating
                      ? Icons.pause
                      : _controller.isCompleted
                      ? Icons.replay
                      : Icons.play_arrow,
                  color: AppColors.primary,
                ),
                onPressed: !widget.isEstimated && hasReplayableRoute
                    ? _toggleReplay
                    : null,
                tooltip: widget.isEstimated
                    ? l10n.driverRouteReplayEstimatedTooltip
                    : hasReplayableRoute
                    ? l10n.driverRouteReplayTooltip
                    : l10n.driverNavDirectionsUnavailable,
              ),
            ),
            const SizedBox(width: 12),
            Text(
              _replayStatus(l10n, hasReplayableRoute: hasReplayableRoute),
              style: const TextStyle(fontSize: 13, color: Color(0xFF9CA3AF)),
            ),
          ],
        ),
      ],
    );
  }

  String _replayStatus(
    AppLocalizations l10n, {
    required bool hasReplayableRoute,
  }) {
    if (!hasReplayableRoute) return l10n.driverNavDirectionsUnavailable;
    if (widget.isEstimated) return l10n.driverRouteReplayEstimated;
    if (_controller.isAnimating) return l10n.driverRouteReplayPlaying;
    if (_controller.isCompleted) return l10n.driverRouteReplayCompleted;
    return l10n.driverRouteReplayReady;
  }

  List<LatLng> _validRoutePoints() {
    return routeReplayValidRoutePoints(widget.points);
  }

  LatLng? _currentReplayPoint(List<LatLng> routePoints) {
    if (routePoints.isEmpty) return null;
    if (routePoints.length == 1) return routePoints.first;

    final scaledIndex = _animation.value * (routePoints.length - 1);
    final startIndex = scaledIndex.floor().clamp(0, routePoints.length - 2);
    final endIndex = startIndex + 1;
    final segmentProgress = scaledIndex - startIndex;
    final start = routePoints[startIndex];
    final end = routePoints[endIndex];

    return LatLng(
      start.latitude + (end.latitude - start.latitude) * segmentProgress,
      start.longitude + (end.longitude - start.longitude) * segmentProgress,
    );
  }

  Set<Marker> _buildMarkers(List<LatLng> routePoints, LatLng? currentPoint) {
    final markers = <Marker>{};
    if (routePoints.isEmpty) return markers;

    markers.add(
      Marker(
        markerId: const MarkerId('pickup'),
        position: routePoints.first,
        icon: BitmapDescriptor.defaultMarkerWithHue(BitmapDescriptor.hueGreen),
      ),
    );

    if (routePoints.length > 1) {
      markers.add(
        Marker(
          markerId: const MarkerId('dropoff'),
          position: routePoints.last,
          icon: BitmapDescriptor.defaultMarkerWithHue(
            BitmapDescriptor.hueOrange,
          ),
        ),
      );
    }

    if (!widget.isEstimated && currentPoint != null && routePoints.length > 1) {
      markers.add(
        Marker(
          markerId: const MarkerId('replay-current'),
          position: currentPoint,
          icon: BitmapDescriptor.defaultMarkerWithHue(
            BitmapDescriptor.hueAzure,
          ),
          zIndexInt: 10,
        ),
      );
    }

    return markers;
  }

  Set<Polyline> _buildPolylines(
    List<LatLng> routePoints,
    LatLng? currentPoint,
  ) {
    final polylines = <Polyline>{};
    if (routePoints.length < 2) return polylines;

    polylines.add(
      Polyline(
        polylineId: PolylineId(
          widget.isEstimated ? 'planned-route' : 'actual-route',
        ),
        points: routePoints,
        color: widget.isEstimated
            ? const Color(0xFFF59E0B)
            : const Color(0xFF64748B),
        width: widget.isEstimated ? 5 : 4,
      ),
    );

    if (widget.isEstimated) return polylines;

    final replayPoints = _replayedPoints(routePoints, currentPoint);
    if (replayPoints.length >= 2) {
      polylines.add(
        Polyline(
          polylineId: const PolylineId('replayed-route'),
          points: replayPoints,
          color: AppColors.primary,
          width: 6,
        ),
      );
    }

    return polylines;
  }

  List<LatLng> _replayedPoints(List<LatLng> routePoints, LatLng? currentPoint) {
    if (routePoints.length < 2 || currentPoint == null) return const [];
    final scaledIndex = _animation.value * (routePoints.length - 1);
    final endIndex = scaledIndex.floor().clamp(0, routePoints.length - 2);
    return [...routePoints.take(endIndex + 1), currentPoint];
  }

  Future<void> _fitRouteToMap() async {
    if (!_mapController.isCompleted) return;
    final routePoints = _validRoutePoints();
    if (routePoints.isEmpty) return;

    final signature = routePoints
        .map(
          (point) =>
              '${point.latitude.toStringAsFixed(5)},${point.longitude.toStringAsFixed(5)}',
        )
        .join('|');
    if (signature == _lastBoundsSignature) return;
    _lastBoundsSignature = signature;

    final controller = await _mapController.future;
    if (!mounted) return;

    if (routePoints.length == 1) {
      await controller.animateCamera(
        CameraUpdate.newLatLngZoom(routePoints.first, 15),
      );
      return;
    }

    await controller.animateCamera(
      CameraUpdate.newLatLngBounds(_boundsFor(routePoints), 48),
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

class _RouteReplayUnavailable extends StatelessWidget {
  final String message;

  const _RouteReplayUnavailable({required this.message});

  @override
  Widget build(BuildContext context) {
    return ColoredBox(
      color: const Color(0xFF111827),
      child: Center(
        child: Padding(
          padding: const EdgeInsets.all(24),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Icon(
                Icons.route_outlined,
                size: 44,
                color: Colors.white.withValues(alpha: 0.48),
              ),
              const SizedBox(height: 12),
              Text(
                message,
                textAlign: TextAlign.center,
                style: const TextStyle(
                  color: Color(0xFFD1D5DB),
                  fontSize: 13,
                  fontWeight: FontWeight.w600,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
