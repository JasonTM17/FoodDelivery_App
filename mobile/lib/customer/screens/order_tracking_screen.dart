import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:google_maps_flutter/google_maps_flutter.dart';
import '../../shared/providers/order_provider.dart';
import '../../shared/providers/tracking_provider.dart';
import '../../shared/models/order.dart';
import '../../shared/maps/encoded_polyline.dart';
import '../../shared/maps/lat_lng_validation.dart';
import '../../shared/theme/app_colors.dart';
import '../../shared/theme/app_text_styles.dart';
import '../../shared/theme/vietnam_map_constants.dart';
import '../../shared/utils/order_status_groups.dart';
import '../../shared/widgets/vietnam_boundary_overlay.dart';
import '../../shared/widgets/order_status_badge.dart';
import '../../l10n/app_localizations.dart';
import '../router/route_names.dart';

class OrderTrackingScreen extends ConsumerStatefulWidget {
  final String orderId;

  const OrderTrackingScreen({super.key, required this.orderId});

  @override
  ConsumerState<OrderTrackingScreen> createState() =>
      _OrderTrackingScreenState();
}

@visibleForTesting
List<LatLng> orderTrackingCameraPoints(
  OrderModel? order,
  TrackingState tracking,
) {
  final points = <LatLng>[
    ...orderTrackingRoutePoints(order, tracking),
    if (isValidDeliveryLatLng(
      order?.restaurantLatitude,
      order?.restaurantLongitude,
    ))
      LatLng(order!.restaurantLatitude!, order.restaurantLongitude!),
    if (order != null &&
        isValidDeliveryLatLng(
          order.deliveryAddress.latitude,
          order.deliveryAddress.longitude,
        ))
      LatLng(order.deliveryAddress.latitude, order.deliveryAddress.longitude),
  ];

  final driverLat = tracking.driverLatitude ?? order?.driverLatitude;
  final driverLng = tracking.driverLongitude ?? order?.driverLongitude;
  if (isValidDeliveryLatLng(driverLat, driverLng)) {
    points.add(LatLng(driverLat!, driverLng!));
  }

  return points;
}

@visibleForTesting
LatLng? orderTrackingInitialCameraTarget(
  OrderModel? order,
  TrackingState tracking,
) {
  final points = orderTrackingCameraPoints(order, tracking);
  return points.isEmpty ? null : points.first;
}

@visibleForTesting
List<LatLng> orderTrackingRoutePoints(
  OrderModel? order,
  TrackingState tracking,
) {
  final encoded = resolveTrackingRoutePolyline(tracking, order?.routePolyline);
  return tryDecodeEncodedPolyline(encoded)
      .map((point) => LatLng(point.latitude, point.longitude))
      .where((point) => isValidDeliveryLatLng(point.latitude, point.longitude))
      .toList(growable: false);
}

class _OrderTrackingScreenState extends ConsumerState<OrderTrackingScreen> {
  GoogleMapController? _mapController;
  bool _showBottomSheet = true;
  Set<Polygon> _boundaryPolygons = {};
  String _lastCameraSignature = '';

  @override
  void initState() {
    super.initState();
    _loadBoundary();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      ref.read(orderProvider.notifier).fetchOrderDetail(widget.orderId);
      ref.read(trackingProvider.notifier).startTracking(widget.orderId);
    });
  }

  Future<void> _loadBoundary() async {
    final polygons = await VietnamBoundaryOverlay.polygons;
    if (mounted) setState(() => _boundaryPolygons = polygons);
  }

  @override
  void dispose() {
    ref.read(trackingProvider.notifier).stopTracking();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final orderState = ref.watch(orderProvider);
    final trackingState = ref.watch(trackingProvider);
    final order = orderState.currentTrackingOrder;
    final l10n = AppLocalizations.of(context);
    final initialCameraTarget = orderTrackingInitialCameraTarget(
      order,
      trackingState,
    );

    ref.listen<OrderModel?>(
      orderProvider.select((s) => s.currentTrackingOrder),
      (_, next) {
        _updateMapPins(next, ref.read(trackingProvider));
      },
    );
    ref.listen<TrackingState>(trackingProvider, (_, next) {
      _updateMapPins(ref.read(orderProvider).currentTrackingOrder, next);
    });

    return Scaffold(
      body: Stack(
        children: [
          // Map
          if (initialCameraTarget == null)
            _TrackingMapUnavailable(
              message: l10n.driverNavDirectionsUnavailable,
            )
          else
            GoogleMap(
              mapType: MapType.normal,
              initialCameraPosition: CameraPosition(
                target: initialCameraTarget,
                zoom: 14,
              ),
              onMapCreated: (controller) {
                _mapController = controller;
                _updateMapPins(order, trackingState);
              },
              markers: _buildMarkers(order, trackingState, l10n),
              polylines: _buildPolylines(order, trackingState),
              polygons: _boundaryPolygons,
              minMaxZoomPreference: const MinMaxZoomPreference(
                VietnamMapConstants.minZoom,
                VietnamMapConstants.maxZoom,
              ),
              myLocationEnabled: true,
              myLocationButtonEnabled: true,
              zoomControlsEnabled: false,
              padding: EdgeInsets.only(bottom: _showBottomSheet ? 300 : 80),
            ),

          // Back button
          Positioned(
            top: MediaQuery.of(context).padding.top + 8,
            left: 16,
            child: Container(
              decoration: BoxDecoration(
                color: Colors.white,
                shape: BoxShape.circle,
                boxShadow: [
                  BoxShadow(
                    color: Colors.black.withValues(alpha: 0.15),
                    blurRadius: 8,
                  ),
                ],
              ),
              child: IconButton(
                icon: const Icon(Icons.arrow_back),
                onPressed: () => Navigator.of(context).pop(),
              ),
            ),
          ),

          // Tracking info header; only show ETA after backend sends a real update.
          if (trackingState.etaMinutes != null)
            Positioned(
              top: MediaQuery.of(context).padding.top + 8,
              right: 16,
              child: Container(
                padding: const EdgeInsets.symmetric(
                  horizontal: 12,
                  vertical: 6,
                ),
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(20),
                  boxShadow: [
                    BoxShadow(
                      color: Colors.black.withValues(alpha: 0.15),
                      blurRadius: 8,
                    ),
                  ],
                ),
                child: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    const Icon(
                      Icons.access_time,
                      size: 16,
                      color: AppColors.accent,
                    ),
                    const SizedBox(width: 4),
                    Text(
                      '${trackingState.etaDegraded ? '~' : ''}${AppLocalizations.of(context).driverTripSummaryMinutes(trackingState.etaMinutes!)}',
                      style: const TextStyle(
                        fontSize: 13,
                        fontWeight: FontWeight.w600,
                        color: AppColors.textPrimary,
                      ),
                    ),
                  ],
                ),
              ),
            ),

          // Bottom sheet
          if (order != null)
            GestureDetector(
              onTap: () => setState(() => _showBottomSheet = !_showBottomSheet),
              child: AnimatedPositioned(
                duration: const Duration(milliseconds: 300),
                curve: Curves.easeInOut,
                bottom: 0,
                left: 0,
                right: 0,
                height: _showBottomSheet ? 300 : 80,
                child: Container(
                  decoration: const BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.vertical(
                      top: Radius.circular(24),
                    ),
                    boxShadow: [
                      BoxShadow(
                        color: AppColors.shadowMedium,
                        blurRadius: 16,
                        offset: Offset(0, -4),
                      ),
                    ],
                  ),
                  child: Column(
                    children: [
                      // Drag handle
                      Container(
                        margin: const EdgeInsets.symmetric(vertical: 8),
                        width: 40,
                        height: 4,
                        decoration: BoxDecoration(
                          color: AppColors.border,
                          borderRadius: BorderRadius.circular(2),
                        ),
                      ),
                      if (_showBottomSheet) ...[
                        Expanded(
                          child: SingleChildScrollView(
                            padding: const EdgeInsets.fromLTRB(16, 0, 16, 16),
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                // Status timeline
                                _buildStatusTimeline(order),
                                const SizedBox(height: 16),

                                // Driver info
                                if (order.driverName != null) ...[
                                  Container(
                                    padding: const EdgeInsets.all(12),
                                    decoration: BoxDecoration(
                                      color: AppColors.surface,
                                      borderRadius: BorderRadius.circular(12),
                                    ),
                                    child: Row(
                                      children: [
                                        CircleAvatar(
                                          radius: 24,
                                          backgroundColor:
                                              AppColors.primaryLight,
                                          backgroundImage:
                                              order.driverAvatarUrl != null
                                              ? NetworkImage(
                                                      order.driverAvatarUrl!,
                                                    )
                                                    as ImageProvider
                                              : null,
                                          child: order.driverAvatarUrl == null
                                              ? const Icon(
                                                  Icons.person,
                                                  color: AppColors.primary,
                                                )
                                              : null,
                                        ),
                                        const SizedBox(width: 12),
                                        Expanded(
                                          child: Column(
                                            crossAxisAlignment:
                                                CrossAxisAlignment.start,
                                            children: [
                                              Text(
                                                order.driverName!,
                                                style: const TextStyle(
                                                  fontWeight: FontWeight.w600,
                                                  fontSize: 15,
                                                ),
                                              ),
                                              if (order.driverRating != null)
                                                Row(
                                                  children: [
                                                    const Icon(
                                                      Icons.star,
                                                      size: 14,
                                                      color: AppColors.accent,
                                                    ),
                                                    const SizedBox(width: 2),
                                                    Text(
                                                      order.driverRating!
                                                          .toStringAsFixed(1),
                                                      style: AppTextStyles
                                                          .bodySmall,
                                                    ),
                                                  ],
                                                ),
                                            ],
                                          ),
                                        ),
                                        Row(
                                          children: [
                                            _buildActionButton(
                                              Icons.phone,
                                              AppLocalizations.of(
                                                context,
                                              ).trackingCallDriver,
                                              AppColors.primary,
                                              () {
                                                if (order.driverPhone != null) {
                                                  // launch phone
                                                }
                                              },
                                            ),
                                            const SizedBox(width: 8),
                                            _buildActionButton(
                                              Icons.chat_outlined,
                                              AppLocalizations.of(
                                                context,
                                              ).helpChatSupport,
                                              AppColors.accent,
                                              () => context.push(
                                                Routes.chat,
                                                extra: widget.orderId,
                                              ),
                                            ),
                                          ],
                                        ),
                                      ],
                                    ),
                                  ),
                                ],
                              ],
                            ),
                          ),
                        ),
                      ] else ...[
                        Padding(
                          padding: const EdgeInsets.symmetric(horizontal: 16),
                          child: Row(
                            children: [
                              OrderStatusBadge(status: order.status),
                              const SizedBox(width: 12),
                              Text(
                                AppLocalizations.of(
                                  context,
                                ).trackingOrderInProgress,
                                style: AppTextStyles.bodyMedium.copyWith(
                                  fontWeight: FontWeight.w600,
                                ),
                              ),
                              const Spacer(),
                              const Icon(Icons.keyboard_arrow_up),
                            ],
                          ),
                        ),
                      ],
                    ],
                  ),
                ),
              ),
            ),
        ],
      ),
    );
  }

  Widget _buildStatusTimeline(OrderModel order) {
    final l10n = AppLocalizations.of(context);
    final steps = [
      {
        'label': l10n.trackingStepPending,
        'status': 'pending',
        'icon': Icons.receipt,
      },
      {
        'label': l10n.trackingStepPreparing,
        'status': 'preparing',
        'icon': Icons.restaurant,
      },
      {
        'label': l10n.trackingStepDelivering,
        'status': 'delivering',
        'icon': Icons.delivery_dining,
      },
      {
        'label': l10n.trackingStepDelivered,
        'status': 'delivered',
        'icon': Icons.check_circle,
      },
    ];

    final currentPhaseIndex = orderTrackingPhaseIndex(order.status);

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          children: [
            Text(l10n.trackingOrderStatus, style: AppTextStyles.headline4),
            const Spacer(),
            OrderStatusBadge(status: order.status),
          ],
        ),
        const SizedBox(height: 16),
        ...steps.asMap().entries.map((entry) {
          final index = entry.key;
          final step = entry.value;
          final isCompleted =
              currentPhaseIndex != null && currentPhaseIndex >= index;
          final isCurrent = currentPhaseIndex == index;

          return Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Column(
                children: [
                  Container(
                    width: 28,
                    height: 28,
                    decoration: BoxDecoration(
                      color: isCompleted
                          ? AppColors.primary
                          : AppColors.surface,
                      shape: BoxShape.circle,
                      border: isCurrent && !isCompleted
                          ? Border.all(color: AppColors.primary, width: 3)
                          : null,
                    ),
                    child: Icon(
                      step['icon'] as IconData,
                      size: 14,
                      color: isCompleted ? Colors.white : AppColors.textHint,
                    ),
                  ),
                  if (index < steps.length - 1)
                    Container(
                      width: 2,
                      height: 24,
                      color: isCompleted ? AppColors.primary : AppColors.border,
                    ),
                ],
              ),
              const SizedBox(width: 12),
              Padding(
                padding: const EdgeInsets.only(bottom: 20),
                child: Text(
                  step['label'] as String,
                  style: TextStyle(
                    fontSize: 14,
                    fontWeight: isCurrent ? FontWeight.w600 : FontWeight.w400,
                    color: isCompleted
                        ? AppColors.textPrimary
                        : AppColors.textHint,
                  ),
                ),
              ),
            ],
          );
        }),
      ],
    );
  }

  Widget _buildActionButton(
    IconData icon,
    String label,
    Color color,
    VoidCallback onTap,
  ) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
        decoration: BoxDecoration(
          color: color.withValues(alpha: 0.1),
          borderRadius: BorderRadius.circular(10),
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(icon, size: 16, color: color),
            const SizedBox(width: 4),
            Text(
              label,
              style: TextStyle(
                fontSize: 12,
                fontWeight: FontWeight.w600,
                color: color,
              ),
            ),
          ],
        ),
      ),
    );
  }

  Set<Marker> _buildMarkers(
    OrderModel? order,
    TrackingState tracking,
    AppLocalizations l10n,
  ) {
    final markers = <Marker>{};

    // Restaurant
    if (isValidDeliveryLatLng(
      order?.restaurantLatitude,
      order?.restaurantLongitude,
    )) {
      markers.add(
        Marker(
          markerId: const MarkerId('restaurant'),
          position: LatLng(
            order!.restaurantLatitude!,
            order.restaurantLongitude!,
          ),
          icon: BitmapDescriptor.defaultMarkerWithHue(
            BitmapDescriptor.hueGreen,
          ),
          infoWindow: InfoWindow(title: l10n.trackingMarkerRestaurant),
        ),
      );
    }

    // Driver
    final driverLat = tracking.driverLatitude ?? order?.driverLatitude;
    final driverLng = tracking.driverLongitude ?? order?.driverLongitude;
    if (isValidDeliveryLatLng(driverLat, driverLng)) {
      final markerLat = driverLat!;
      final markerLng = driverLng!;
      markers.add(
        Marker(
          markerId: const MarkerId('driver'),
          position: LatLng(markerLat, markerLng),
          icon: BitmapDescriptor.defaultMarkerWithHue(
            BitmapDescriptor.hueOrange,
          ),
          infoWindow: InfoWindow(
            title: order?.driverName ?? l10n.trackingMarkerDriver,
          ),
        ),
      );
    }

    // Customer
    if (order != null &&
        isValidDeliveryLatLng(
          order.deliveryAddress.latitude,
          order.deliveryAddress.longitude,
        )) {
      markers.add(
        Marker(
          markerId: const MarkerId('customer'),
          position: LatLng(
            order.deliveryAddress.latitude,
            order.deliveryAddress.longitude,
          ),
          icon: BitmapDescriptor.defaultMarkerWithHue(BitmapDescriptor.hueBlue),
          infoWindow: InfoWindow(title: l10n.trackingMarkerDestination),
        ),
      );
    }

    return markers;
  }

  Set<Polyline> _buildPolylines(OrderModel? order, TrackingState tracking) {
    final polylines = <Polyline>{};
    final plannedRoute = orderTrackingRoutePoints(order, tracking);
    if (plannedRoute.length >= 2) {
      polylines.add(
        Polyline(
          polylineId: const PolylineId('planned-route'),
          points: plannedRoute,
          color: AppColors.info,
          width: 5,
        ),
      );
    }

    final points = tracking.driverLocations
        .map((point) {
          final lat = (point['lat'] as num?)?.toDouble();
          final lng = (point['lng'] as num?)?.toDouble();
          return lat != null && lng != null ? LatLng(lat, lng) : null;
        })
        .whereType<LatLng>()
        .where(
          (point) => isValidDeliveryLatLng(point.latitude, point.longitude),
        )
        .toList();
    if (points.length >= 2) {
      polylines.add(
        Polyline(
          polylineId: const PolylineId('driver-telemetry'),
          points: points,
          color: AppColors.primary,
          width: 3,
        ),
      );
    }
    return polylines;
  }

  Future<void> _updateMapPins(OrderModel? order, TrackingState tracking) async {
    final signature = _cameraSignature(order, tracking);
    if (signature == _lastCameraSignature) return;
    _lastCameraSignature = signature;

    final points = orderTrackingCameraPoints(order, tracking);
    if (points.isEmpty) return;

    final controller = _mapController;
    if (controller == null || !mounted) return;

    if (points.length >= 2) {
      await controller.animateCamera(
        CameraUpdate.newLatLngBounds(_boundsFor(points), 80),
      );
    } else if (points.length == 1) {
      await controller.animateCamera(
        CameraUpdate.newLatLngZoom(points.single, 15),
      );
    }
  }

  String _cameraSignature(OrderModel? order, TrackingState tracking) {
    final driverLat = tracking.driverLatitude ?? order?.driverLatitude;
    final driverLng = tracking.driverLongitude ?? order?.driverLongitude;
    final routePolyline = resolveTrackingRoutePolyline(
      tracking,
      order?.routePolyline,
    );
    return [
      order?.id ?? '',
      routePolyline ?? '',
      driverLat?.toStringAsFixed(4) ?? '',
      driverLng?.toStringAsFixed(4) ?? '',
      order?.restaurantLatitude?.toStringAsFixed(4) ?? '',
      order?.restaurantLongitude?.toStringAsFixed(4) ?? '',
      order?.deliveryAddress.latitude.toStringAsFixed(4) ?? '',
      order?.deliveryAddress.longitude.toStringAsFixed(4) ?? '',
    ].join('|');
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

class _TrackingMapUnavailable extends StatelessWidget {
  final String message;

  const _TrackingMapUnavailable({required this.message});

  @override
  Widget build(BuildContext context) {
    return ColoredBox(
      color: const Color(0xFFF3F4F6),
      child: Center(
        child: Container(
          margin: const EdgeInsets.symmetric(horizontal: 24),
          padding: const EdgeInsets.all(20),
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(18),
            boxShadow: [
              BoxShadow(
                color: Colors.black.withValues(alpha: 0.08),
                blurRadius: 18,
                offset: const Offset(0, 8),
              ),
            ],
          ),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Container(
                width: 48,
                height: 48,
                decoration: BoxDecoration(
                  color: AppColors.primary.withValues(alpha: 0.1),
                  shape: BoxShape.circle,
                ),
                child: const Icon(
                  Icons.location_off_outlined,
                  color: AppColors.primary,
                ),
              ),
              const SizedBox(height: 12),
              Text(
                message,
                textAlign: TextAlign.center,
                style: const TextStyle(
                  color: AppColors.textPrimary,
                  fontSize: 14,
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
