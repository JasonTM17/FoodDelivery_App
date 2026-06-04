import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:url_launcher/url_launcher.dart';
import '../../shared/models/order.dart';
import '../../shared/theme/app_colors.dart';
import '../providers/driver_provider.dart';
import '../widgets/delivery_step_indicator.dart';

class DeliveryFlowScreen extends ConsumerStatefulWidget {
  const DeliveryFlowScreen({super.key});

  @override
  ConsumerState<DeliveryFlowScreen> createState() => _DeliveryFlowScreenState();
}

class _DeliveryFlowScreenState extends ConsumerState<DeliveryFlowScreen> {
  @override
  void initState() {
    super.initState();
  }

  @override
  void dispose() {
    super.dispose();
  }

  int _statusToStep(String status) {
    switch (status) {
      case 'confirmed':
      case 'pending':
        return 0; // heading_to_restaurant
      case 'preparing':
        return 1; // at_restaurant
      case 'delivering':
        return 2; // heading_to_customer
      case 'delivered':
        return 3; // complete
      default:
        return 0;
    }
  }

  @override
  Widget build(BuildContext context) {
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
          title: const Text(
            'Giao hàng',
            style: TextStyle(color: Colors.white, fontWeight: FontWeight.w700),
          ),
        ),
        body: const Center(
          child: Text(
            'Không có đơn hàng đang thực hiện',
            style: TextStyle(color: Color(0xFF6B7280), fontSize: 15),
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
        title: const Text(
          'Giao hàng',
          style: TextStyle(color: Colors.white, fontWeight: FontWeight.w700),
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

                  // Map area placeholder
                  _buildMapPlaceholder(),

                  const SizedBox(height: 20),

                  // Step-specific content
                  switch (order.status) {
                    'pending' || 'confirmed' => _buildHeadingToRestaurant(order),
                    'preparing' => _buildAtRestaurant(order),
                    'delivering' => _buildHeadingToCustomer(order),
                    'delivered' => _buildComplete(order),
                    _ => _buildHeadingToRestaurant(order),
                  },
                ],
              ),
            ),
    );
  }

  Widget _buildMapPlaceholder() {
    return Container(
      width: double.infinity,
      height: 200,
      decoration: BoxDecoration(
        color: const Color(0xFF1E1E1E),
        borderRadius: BorderRadius.circular(18),
        border: Border.all(color: const Color(0xFF374151)),
      ),
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(
            Icons.map_outlined,
            size: 48,
            color: AppColors.textSecondary.withValues(alpha: 0.5),
          ),
          const SizedBox(height: 8),
          const Text(
            'Bản đồ',
            style: TextStyle(
              fontSize: 14,
              color: Color(0xFF6B7280),
            ),
          ),
          const SizedBox(height: 4),
          const Text(
            'Google Maps sẽ hiển thị ở đây',
            style: TextStyle(
              fontSize: 12,
              color: Color(0xFF4B5563),
            ),
          ),
        ],
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
          subtitle: 'Nhà hàng',
          trailing: order.restaurantLatitude != null
              ? TextButton(
                  onPressed: () => _callRestaurant(order),
                  child: const Text(
                    'Gọi nhà hàng',
                    style: TextStyle(color: AppColors.primary),
                  ),
                )
              : null,
        ),
        const SizedBox(height: 16),
        _buildInfoCard(
          icon: Icons.location_on_outlined,
          title: order.deliveryAddress.address,
          subtitle: 'Địa chỉ giao hàng',
        ),
        const SizedBox(height: 24),
        SizedBox(
          width: double.infinity,
          height: 52,
          child: ElevatedButton.icon(
            onPressed: () {
              ref
                  .read(driverProvider.notifier)
                  .updateOrderStatus(order.id, 'preparing');
            },
            icon: const Icon(Icons.check_circle_outline),
            label: const Text(
              'ĐÃ ĐẾN NHÀ HÀNG',
              style: TextStyle(
                fontSize: 16,
                fontWeight: FontWeight.w700,
              ),
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
          subtitle: 'Đang chuẩn bị món',
        ),
        const SizedBox(height: 16),

        // Order items
        const Text(
          'Món cần lấy',
          style: TextStyle(
            fontSize: 15,
            fontWeight: FontWeight.w600,
            color: Colors.white,
          ),
        ),
        const SizedBox(height: 10),
        ...order.items.map((item) => Container(
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
            )),

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
                const Icon(Icons.note_outlined, size: 16, color: AppColors.warning),
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
            onPressed: () {
              ref
                  .read(driverProvider.notifier)
                  .updateOrderStatus(order.id, 'delivering');
            },
            icon: const Icon(Icons.shopping_bag_outlined),
            label: const Text(
              'XÁC NHẬN LẤY HÀNG',
              style: TextStyle(
                fontSize: 16,
                fontWeight: FontWeight.w700,
              ),
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
    final eta = DateTime.now().add(const Duration(minutes: 12));

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
            border: Border.all(
              color: AppColors.primary.withValues(alpha: 0.2),
            ),
          ),
          child: Row(
            children: [
              const Icon(Icons.access_time, color: AppColors.primary, size: 28),
              const SizedBox(width: 12),
              Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text(
                    'ETA - Thời gian dự kiến',
                    style: TextStyle(
                      fontSize: 12,
                      color: Color(0xFF6B7280),
                    ),
                  ),
                  const SizedBox(height: 2),
                  Text(
                    '${eta.hour.toString().padLeft(2, '0')}:${eta.minute.toString().padLeft(2, '0')}',
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
          subtitle: 'Địa chỉ khách hàng',
          trailing: TextButton.icon(
            onPressed: () => _callCustomer(order),
            icon: const Icon(Icons.phone, size: 18),
            label: const Text('Gọi khách'),
            style: TextButton.styleFrom(
              foregroundColor: AppColors.primary,
            ),
          ),
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
            label: const Text(
              'ĐÃ GIAO HÀNG',
              style: TextStyle(
                fontSize: 16,
                fontWeight: FontWeight.w700,
              ),
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
            border: Border.all(
              color: AppColors.primary.withValues(alpha: 0.3),
            ),
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
              const Text(
                'Giao hàng thành công!',
                style: TextStyle(
                  fontSize: 22,
                  fontWeight: FontWeight.w800,
                  color: Colors.white,
                ),
              ),
              const SizedBox(height: 24),
              // Earnings summary
              _buildEarningRow('Phí giao hàng', order.deliveryFee),
              const SizedBox(height: 8),
              _buildEarningRow('Tổng đơn', order.total),
              const SizedBox(height: 8),
              const Divider(color: Color(0xFF374151)),
              const SizedBox(height: 8),
              _buildEarningRow(
                'Bạn nhận được',
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
            child: const Text(
              'VỀ TRANG CHỦ',
              style: TextStyle(
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

  Widget _buildEarningRow(String label, double amount, {bool isHighlight = false}) {
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
      final uri = Uri.parse('tel:');
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
      final uri = Uri.parse('tel:');
      if (await canLaunchUrl(uri)) {
        await launchUrl(uri);
      } else {
        _showPhoneError();
      }
    } catch (_) {
      _showPhoneError();
    }
  }

  void _showPhoneError() {
    if (mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Không thể mở trình quay số'),
          backgroundColor: Color(0xFF1E1E1E),
        ),
      );
    }
  }
}
