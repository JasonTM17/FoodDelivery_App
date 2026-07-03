import 'dart:async';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:google_maps_flutter/google_maps_flutter.dart';
import '../../shared/providers/order_provider.dart';
import '../../shared/providers/tracking_provider.dart';
import '../../shared/models/order.dart';
import '../../shared/theme/app_colors.dart';
import '../../shared/theme/app_text_styles.dart';
import '../../shared/theme/vietnam_map_constants.dart';
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

class _OrderTrackingScreenState extends ConsumerState<OrderTrackingScreen> {
  final Completer<GoogleMapController> _mapController = Completer();
  bool _showBottomSheet = true;
  Set<Polygon> _boundaryPolygons = {};

  static const CameraPosition _defaultCamera = CameraPosition(
    target: LatLng(10.7769, 106.7009),
    zoom: 14,
  );

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

    return Scaffold(
      body: Stack(
        children: [
          // Map
          GoogleMap(
            mapType: MapType.normal,
            initialCameraPosition: _defaultCamera,
            onMapCreated: (controller) {
              _mapController.complete(controller);
              _updateMapPins(order);
            },
            markers: _buildMarkers(order, trackingState),
            polylines: _buildPolylines(trackingState),
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

    final statusOrder = [
      'pending',
      'confirmed',
      'preparing',
      'delivering',
      'delivered',
    ];
    final currentIndex = statusOrder.indexOf(order.status);

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
              currentIndex >= statusOrder.indexOf(step['status'] as String);
          final isCurrent = order.status == step['status'];

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

  Set<Marker> _buildMarkers(OrderModel? order, TrackingState tracking) {
    final markers = <Marker>{};

    // Restaurant
    if (order?.restaurantLatitude != null &&
        order?.restaurantLongitude != null) {
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
          infoWindow: const InfoWindow(title: 'Nhà hàng'),
        ),
      );
    }

    // Driver
    final driverLat = tracking.driverLatitude ?? order?.driverLatitude;
    final driverLng = tracking.driverLongitude ?? order?.driverLongitude;
    if (driverLat != null && driverLng != null) {
      markers.add(
        Marker(
          markerId: const MarkerId('driver'),
          position: LatLng(driverLat, driverLng),
          icon: BitmapDescriptor.defaultMarkerWithHue(
            BitmapDescriptor.hueOrange,
          ),
          infoWindow: InfoWindow(title: order?.driverName ?? 'Tài xế'),
        ),
      );
    }

    // Customer
    if (order != null) {
      markers.add(
        Marker(
          markerId: const MarkerId('customer'),
          position: LatLng(
            order.deliveryAddress.latitude,
            order.deliveryAddress.longitude,
          ),
          icon: BitmapDescriptor.defaultMarkerWithHue(BitmapDescriptor.hueBlue),
          infoWindow: const InfoWindow(title: 'Điểm đến'),
        ),
      );
    }

    return markers;
  }

  Set<Polyline> _buildPolylines(TrackingState tracking) {
    if (tracking.driverLocations.length < 2) return {};
    final points = tracking.driverLocations
        .map((point) {
          final lat = (point['lat'] as num?)?.toDouble();
          final lng = (point['lng'] as num?)?.toDouble();
          return lat != null && lng != null ? LatLng(lat, lng) : null;
        })
        .whereType<LatLng>()
        .toList();
    if (points.length < 2) return {};
    return {
      Polyline(
        polylineId: const PolylineId('driver-telemetry'),
        points: points,
        color: AppColors.primary,
        width: 3,
      ),
    };
  }

  Future<void> _updateMapPins(OrderModel? order) async {
    if (order == null) return;
    final controller = await _mapController.future;
    if (order.deliveryAddress.latitude != 0 &&
        order.deliveryAddress.longitude != 0) {
      controller.animateCamera(
        CameraUpdate.newLatLngBounds(
          LatLngBounds(
            southwest: LatLng(
              (order.restaurantLatitude ?? order.deliveryAddress.latitude) -
                  0.01,
              (order.restaurantLongitude ?? order.deliveryAddress.longitude) -
                  0.01,
            ),
            northeast: LatLng(
              order.deliveryAddress.latitude + 0.01,
              order.deliveryAddress.longitude + 0.01,
            ),
          ),
          80,
        ),
      );
    }
  }
}
