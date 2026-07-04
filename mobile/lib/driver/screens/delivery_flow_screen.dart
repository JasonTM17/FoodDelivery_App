import 'dart:async';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:google_maps_flutter/google_maps_flutter.dart';
import 'package:url_launcher/url_launcher.dart';
import '../../shared/models/order.dart';
import '../../shared/theme/app_colors.dart';
import '../../shared/theme/vietnam_map_constants.dart';
import '../../shared/widgets/vietnam_boundary_overlay.dart';
import '../providers/driver_provider.dart';
import '../widgets/delivery_step_indicator.dart';
import '../../l10n/app_localizations.dart';

class DeliveryFlowScreen extends ConsumerStatefulWidget {
  const DeliveryFlowScreen({super.key});

  @override
  ConsumerState<DeliveryFlowScreen> createState() => _DeliveryFlowScreenState();
}

class _DeliveryFlowScreenState extends ConsumerState<DeliveryFlowScreen> {
  final Completer<GoogleMapController> _mapController = Completer();
  Set<Polygon> _boundaryPolygons = {};

  @override
  void initState() {
    super.initState();
    _loadBoundary();
  }

  Future<void> _loadBoundary() async {
    final polygons = await VietnamBoundaryOverlay.polygons;
    if (mounted) setState(() => _boundaryPolygons = polygons);
  }

  void _fitMapToOrder(OrderModel order) async {
    final controller = await _mapController.future;
    final bounds = LatLngBounds(
      southwest: LatLng(
        (order.restaurantLatitude ?? order.deliveryAddress.latitude) - 0.01,
        (order.restaurantLongitude ?? order.deliveryAddress.longitude) - 0.01,
      ),
      northeast: LatLng(
        order.deliveryAddress.latitude + 0.01,
        order.deliveryAddress.longitude + 0.01,
      ),
    );
    controller.animateCamera(CameraUpdate.newLatLngBounds(bounds, 80));
  }

  @override
  void dispose() {
    super.dispose();
  }

  int _statusToStep(String status) {
    switch (status) {
      case 'driver_assigned':
        return 0; // heading_to_restaurant
      case 'driver_arriving_restaurant':
        return 1; // at_restaurant
      case 'picked_up':
      case 'delivering':
        return 2; // heading_to_customer
      case 'delivered':
      case 'completed':
        return 3; // complete
      default:
        return 0;
    }
  }

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context);
    final state = ref.watch(driverProvider);
    final order = state.activeOrder;

    if (order == null) {
      return Scaffold(
        backgroundColor: const Color(0xFF121212),
        appBar: AppBar(
          backgroundColor: const Color(0xFF1A1A1A),
          elevation: 0,
          leading: IconButton(
            icon: const Icon(Icons.arrow_back, color: Colors.white),
            onPressed: () => Navigator.pop(context),
          ),
          title: Text(
            l10n.driverNavTitle,
            style: const TextStyle(
              color: Colors.white,
              fontWeight: FontWeight.w700,
            ),
          ),
        ),
        body: Center(
          child: Text(
            l10n.driverNavNoOrder,
            style: const TextStyle(color: Color(0xFF6B7280), fontSize: 15),
          ),
        ),
      );
    }

    final currentStep = _statusToStep(order.status);

    return Scaffold(
      backgroundColor: const Color(0xFF121212),
      appBar: AppBar(
        backgroundColor: const Color(0xFF1A1A1A),
        elevation: 0,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back, color: Colors.white),
          onPressed: () => Navigator.pop(context),
        ),
        title: Text(
          l10n.driverNavTitle,
          style: const TextStyle(
            color: Colors.white,
            fontWeight: FontWeight.w700,
          ),
        ),
      ),
      body: state.isLoading
          ? const Center(
              child: CircularProgressIndicator(color: AppColors.primary),
            )
          : SingleChildScrollView(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Step indicator
                  DeliveryStepIndicator(currentStep: currentStep),
                  const SizedBox(height: 20),

                  // Map area
                  _buildTripMap(order),

                  const SizedBox(height: 20),

                  // Step-specific content
                  switch (order.status) {
                    'driver_assigned' => _buildHeadingToRestaurant(order),
                    'driver_arriving_restaurant' => _buildAtRestaurant(order),
                    'picked_up' ||
                    'delivering' => _buildHeadingToCustomer(order),
                    'delivered' || 'completed' => _buildComplete(order),
                    _ => _buildHeadingToRestaurant(order),
                  },
                ],
              ),
            ),
    );
  }

  Widget _buildTripMap(OrderModel order) {
    return SizedBox(
      width: double.infinity,
      height: 200,
      child: ClipRRect(
        borderRadius: BorderRadius.circular(18),
        child: GoogleMap(
          mapType: MapType.normal,
          initialCameraPosition: VietnamMapConstants.defaultCamera,
          onMapCreated: (controller) {
            _mapController.complete(controller);
            _fitMapToOrder(order);
          },
          polygons: _boundaryPolygons,
          minMaxZoomPreference: const MinMaxZoomPreference(
            VietnamMapConstants.minZoom,
            VietnamMapConstants.maxZoom,
          ),
          zoomControlsEnabled: false,
          myLocationEnabled: true,
          myLocationButtonEnabled: false,
        ),
      ),
    );
  }

  // ---- Step 0: Heading to restaurant ----

  Widget _buildHeadingToRestaurant(OrderModel order) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        _buildInfoCard(
          icon: Icons.restaurant,
          title: order.restaurantName,
          subtitle: AppLocalizations.of(context).driverNavRestaurant,
          trailing: order.restaurantPhone != null
              ? TextButton(
                  onPressed: () => _callRestaurant(order),
                  child: Text(
                    AppLocalizations.of(context).driverNavCallRestaurant,
                    style: const TextStyle(color: AppColors.primary),
                  ),
                )
              : null,
        ),
        const SizedBox(height: 16),
        _buildInfoCard(
          icon: Icons.location_on_outlined,
          title: order.deliveryAddress.address,
          subtitle: AppLocalizations.of(context).driverNavDeliveryAddress,
        ),
        const SizedBox(height: 24),
        SizedBox(
          width: double.infinity,
          height: 52,
          child: ElevatedButton.icon(
            onPressed: () {
              ref
                  .read(driverProvider.notifier)
                  .updateOrderStatus(order.id, 'driver_arriving_restaurant');
            },
            icon: const Icon(Icons.check_circle_outline),
            label: Text(
              AppLocalizations.of(context).driverNavArrivedAtRestaurant,
              style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w700),
            ),
            style: ElevatedButton.styleFrom(
              backgroundColor: AppColors.primary,
              foregroundColor: Colors.white,
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(14),
              ),
            ),
          ),
        ),
      ],
    );
  }

  // ---- Step 1: At restaurant ----

  Widget _buildAtRestaurant(OrderModel order) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        _buildInfoCard(
          icon: Icons.restaurant,
          title: order.restaurantName,
          subtitle: AppLocalizations.of(context).driverNavPreparingFood,
        ),
        const SizedBox(height: 16),

        // Order items
        Text(
          AppLocalizations.of(context).driverNavItemsToPickup,
          style: TextStyle(
            fontSize: 15,
            fontWeight: FontWeight.w600,
            color: Colors.white,
          ),
        ),
        const SizedBox(height: 10),
        ...order.items.map(
          (item) => Container(
            margin: const EdgeInsets.only(bottom: 6),
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: const Color(0xFF1E1E1E),
              borderRadius: BorderRadius.circular(12),
            ),
            child: Row(
              children: [
                Container(
                  width: 28,
                  height: 28,
                  decoration: BoxDecoration(
                    color: const Color(0xFF374151),
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: Center(
                    child: Text(
                      '${item.quantity}',
                      style: const TextStyle(
                        fontSize: 14,
                        fontWeight: FontWeight.w700,
                        color: Colors.white,
                      ),
                    ),
                  ),
                ),
                const SizedBox(width: 10),
                Expanded(
                  child: Text(
                    item.name,
                    style: const TextStyle(
                      fontSize: 14,
                      color: Color(0xFFD1D5DB),
                    ),
                  ),
                ),
              ],
            ),
          ),
        ),

        if (order.note != null && order.note!.isNotEmpty) ...[
          const SizedBox(height: 12),
          Container(
            width: double.infinity,
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: AppColors.warning.withValues(alpha: 0.1),
              borderRadius: BorderRadius.circular(12),
              border: Border.all(
                color: AppColors.warning.withValues(alpha: 0.2),
              ),
            ),
            child: Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Icon(
                  Icons.note_outlined,
                  size: 16,
                  color: AppColors.warning,
                ),
                const SizedBox(width: 8),
                Expanded(
                  child: Text(
                    order.note!,
                    style: const TextStyle(
                      fontSize: 13,
                      color: AppColors.warning,
                    ),
                  ),
                ),
              ],
            ),
          ),
        ],

        const SizedBox(height: 24),
        SizedBox(
          width: double.infinity,
          height: 52,
          child: ElevatedButton.icon(
            onPressed: () => _confirmPickup(order),
            icon: const Icon(Icons.shopping_bag_outlined),
            label: Text(
              AppLocalizations.of(context).driverNavConfirmPickup,
              style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w700),
            ),
            style: ElevatedButton.styleFrom(
              backgroundColor: AppColors.primary,
              foregroundColor: Colors.white,
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(14),
              ),
            ),
          ),
        ),
      ],
    );
  }

  // ---- Step 2: Heading to customer ----

  Widget _buildHeadingToCustomer(OrderModel order) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        // ETA card
        Container(
          width: double.infinity,
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            gradient: LinearGradient(
              colors: [
                AppColors.primary.withValues(alpha: 0.15),
                const Color(0xFF1E1E1E),
              ],
              begin: Alignment.topLeft,
              end: Alignment.bottomRight,
            ),
            borderRadius: BorderRadius.circular(16),
            border: Border.all(color: AppColors.primary.withValues(alpha: 0.2)),
          ),
          child: Row(
            children: [
              const Icon(Icons.access_time, color: AppColors.primary, size: 28),
              const SizedBox(width: 12),
              Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    AppLocalizations.of(context).driverNavEta,
                    style: const TextStyle(
                      fontSize: 12,
                      color: Color(0xFF6B7280),
                    ),
                  ),
                  const SizedBox(height: 2),
                  Text(
                    order.estimatedDeliveryTimeMinutes != null
                        ? AppLocalizations.of(context).driverNavEtaMinutes(
                            order.estimatedDeliveryTimeMinutes!,
                          )
                        : AppLocalizations.of(context).driverNavEtaUnavailable,
                    style: const TextStyle(
                      fontSize: 22,
                      fontWeight: FontWeight.w800,
                      color: Colors.white,
                    ),
                  ),
                ],
              ),
            ],
          ),
        ),
        const SizedBox(height: 16),

        // Customer address
        _buildInfoCard(
          icon: Icons.location_on,
          title: order.deliveryAddress.address,
          subtitle: AppLocalizations.of(context).driverNavCustomerAddress,
          trailing: order.customerPhone != null
              ? TextButton.icon(
                  onPressed: () => _callCustomer(order),
                  icon: const Icon(Icons.phone, size: 18),
                  label: Text(
                    AppLocalizations.of(context).driverNavCallCustomer,
                  ),
                  style: TextButton.styleFrom(
                    foregroundColor: AppColors.primary,
                  ),
                )
              : null,
        ),

        const SizedBox(height: 24),
        SizedBox(
          width: double.infinity,
          height: 52,
          child: ElevatedButton.icon(
            onPressed: () {
              ref
                  .read(driverProvider.notifier)
                  .updateOrderStatus(order.id, 'delivered');
            },
            icon: const Icon(Icons.check_circle),
            label: Text(
              AppLocalizations.of(context).driverNavConfirmDelivery,
              style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w700),
            ),
            style: ElevatedButton.styleFrom(
              backgroundColor: AppColors.primary,
              foregroundColor: Colors.white,
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(14),
              ),
            ),
          ),
        ),
      ],
    );
  }

  // ---- Step 3: Complete ----

  Widget _buildComplete(OrderModel order) {
    return Column(
      children: [
        Container(
          width: double.infinity,
          padding: const EdgeInsets.all(24),
          decoration: BoxDecoration(
            gradient: LinearGradient(
              colors: [
                AppColors.primary.withValues(alpha: 0.2),
                const Color(0xFF1E1E1E),
              ],
              begin: Alignment.topCenter,
              end: Alignment.bottomCenter,
            ),
            borderRadius: BorderRadius.circular(20),
            border: Border.all(color: AppColors.primary.withValues(alpha: 0.3)),
          ),
          child: Column(
            children: [
              Container(
                width: 64,
                height: 64,
                decoration: BoxDecoration(
                  color: AppColors.primary.withValues(alpha: 0.2),
                  shape: BoxShape.circle,
                ),
                child: const Icon(
                  Icons.check_circle,
                  color: AppColors.primary,
                  size: 36,
                ),
              ),
              const SizedBox(height: 16),
              Text(
                AppLocalizations.of(context).driverNavDeliverySuccess,
                style: const TextStyle(
                  fontSize: 22,
                  fontWeight: FontWeight.w800,
                  color: Colors.white,
                ),
              ),
              const SizedBox(height: 24),
              _buildEarningRow(
                AppLocalizations.of(context).driverHistoryDeliveryFee,
                order.deliveryFee,
              ),
              const SizedBox(height: 8),
              _buildEarningRow(
                AppLocalizations.of(context).driverNavOrderTotal,
                order.total,
              ),
              const SizedBox(height: 8),
              const Divider(color: Color(0xFF374151)),
              const SizedBox(height: 8),
              _buildEarningRow(
                AppLocalizations.of(context).driverNavYouEarned,
                order.deliveryFee,
                isHighlight: true,
              ),
            ],
          ),
        ),
        const SizedBox(height: 24),
        SizedBox(
          width: double.infinity,
          height: 52,
          child: ElevatedButton(
            onPressed: () {
              context.go('/home');
            },
            style: ElevatedButton.styleFrom(
              backgroundColor: AppColors.primary,
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(14),
              ),
            ),
            child: Text(
              AppLocalizations.of(context).driverNavGoHome,
              style: const TextStyle(
                fontSize: 16,
                fontWeight: FontWeight.w700,
                color: Colors.white,
              ),
            ),
          ),
        ),
      ],
    );
  }

  // ---- Shared helpers ----

  Widget _buildInfoCard({
    required IconData icon,
    required String title,
    required String subtitle,
    Widget? trailing,
  }) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: const Color(0xFF1E1E1E),
        borderRadius: BorderRadius.circular(14),
      ),
      child: Row(
        children: [
          Container(
            width: 44,
            height: 44,
            decoration: BoxDecoration(
              color: AppColors.primary.withValues(alpha: 0.1),
              borderRadius: BorderRadius.circular(12),
            ),
            child: Icon(icon, color: AppColors.primary, size: 22),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  subtitle,
                  style: const TextStyle(
                    fontSize: 12,
                    color: Color(0xFF6B7280),
                  ),
                ),
                const SizedBox(height: 2),
                Text(
                  title,
                  style: const TextStyle(
                    fontSize: 14,
                    fontWeight: FontWeight.w600,
                    color: Colors.white,
                  ),
                ),
              ],
            ),
          ),
          if (trailing != null) trailing,
        ],
      ),
    );
  }

  Widget _buildEarningRow(
    String label,
    double amount, {
    bool isHighlight = false,
  }) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Text(
          label,
          style: TextStyle(
            fontSize: isHighlight ? 16 : 14,
            fontWeight: isHighlight ? FontWeight.w700 : FontWeight.w400,
            color: isHighlight ? Colors.white : const Color(0xFFD1D5DB),
          ),
        ),
        Text(
          '${amount.toStringAsFixed(0)}đ',
          style: TextStyle(
            fontSize: isHighlight ? 20 : 15,
            fontWeight: FontWeight.w700,
            color: isHighlight ? AppColors.primary : Colors.white,
          ),
        ),
      ],
    );
  }

  Future<void> _callCustomer(OrderModel order) async {
    try {
      final phone = order.customerPhone;
      if (phone == null) {
        _showPhoneError();
        return;
      }
      final uri = Uri(scheme: 'tel', path: phone);
      if (await canLaunchUrl(uri)) {
        await launchUrl(uri);
      } else {
        _showPhoneError();
      }
    } catch (_) {
      _showPhoneError();
    }
  }

  Future<void> _callRestaurant(OrderModel order) async {
    try {
      final phone = order.restaurantPhone;
      if (phone == null) {
        _showPhoneError();
        return;
      }
      final uri = Uri(scheme: 'tel', path: phone);
      if (await canLaunchUrl(uri)) {
        await launchUrl(uri);
      } else {
        _showPhoneError();
      }
    } catch (_) {
      _showPhoneError();
    }
  }

  Future<void> _confirmPickup(OrderModel order) async {
    final notifier = ref.read(driverProvider.notifier);
    await notifier.updateOrderStatus(order.id, 'picked_up');
    if (!mounted || ref.read(driverProvider).error != null) return;
    await notifier.updateOrderStatus(order.id, 'delivering');
  }

  void _showPhoneError() {
    if (mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(AppLocalizations.of(context).driverNavPhoneError),
          backgroundColor: const Color(0xFF1E1E1E),
        ),
      );
    }
  }
}
