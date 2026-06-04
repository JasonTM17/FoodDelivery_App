import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:intl/intl.dart';
import '../../shared/providers/order_provider.dart';
import '../../shared/models/order.dart';
import '../../shared/theme/app_colors.dart';
import '../../shared/theme/app_text_styles.dart';
import '../../shared/widgets/order_status_badge.dart';
import '../../shared/widgets/empty_state.dart';
import '../../shared/widgets/loading_shimmer.dart';
import '../../shared/widgets/error_state.dart';

class OrderHistoryScreen extends ConsumerStatefulWidget {
  const OrderHistoryScreen({super.key});

  @override
  ConsumerState<OrderHistoryScreen> createState() => _OrderHistoryScreenState();
}

class _OrderHistoryScreenState extends ConsumerState<OrderHistoryScreen>
    with SingleTickerProviderStateMixin {
  late TabController _tabController;

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 3, vsync: this);
    WidgetsBinding.instance.addPostFrameCallback((_) {
      ref.read(orderProvider.notifier).fetchOrders();
    });
  }

  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final orderState = ref.watch(orderProvider);

    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        title: const Text('Đơn hàng của tôi'),
        bottom: TabBar(
          controller: _tabController,
          labelColor: AppColors.primary,
          unselectedLabelColor: AppColors.textSecondary,
          indicatorColor: AppColors.primary,
          indicatorWeight: 3,
          labelStyle: const TextStyle(fontSize: 14, fontWeight: FontWeight.w600),
          tabs: [
            Tab(text: 'Đang hoạt động (${orderState.activeOrders.length})'),
            Tab(text: 'Hoàn thành (${orderState.completedOrders.length})'),
            Tab(text: 'Đã hủy (${orderState.cancelledOrders.length})'),
          ],
        ),
      ),
      body: orderState.isLoading
          ? const LoadingShimmer(type: ShimmerType.order, itemCount: 4)
          : orderState.error != null
              ? ErrorState(message: orderState.error!, onRetry: () => ref.read(orderProvider.notifier).fetchOrders())
              : TabBarView(
                  controller: _tabController,
                  children: [
                    _buildOrderList(orderState.activeOrders, 'active'),
                    _buildOrderList(orderState.completedOrders, 'completed'),
                    _buildOrderList(orderState.cancelledOrders, 'cancelled'),
                  ],
                ),
    );
  }

  Widget _buildOrderList(List<OrderModel> orders, String type) {
    if (orders.isEmpty) {
      String message;
      IconData icon;
      switch (type) {
        case 'active':
          message = 'Không có đơn hàng đang hoạt động';
          icon = Icons.receipt_long_outlined;
          break;
        case 'completed':
          message = 'Chưa có đơn hàng hoàn thành';
          icon = Icons.check_circle_outline;
          break;
        default:
          message = 'Không có đơn hàng đã hủy';
          icon = Icons.cancel_outlined;
      }
      return EmptyState(
        icon: icon,
        title: message,
        subtitle: 'Các đơn hàng sẽ xuất hiện ở đây',
      );
    }

    return RefreshIndicator(
      onRefresh: () => ref.read(orderProvider.notifier).fetchOrders(),
      child: ListView.builder(
        padding: const EdgeInsets.all(12),
        itemCount: orders.length,
        itemBuilder: (context, index) => _buildOrderCard(orders[index]),
      ),
    );
  }

  Widget _buildOrderCard(OrderModel order) {
    final dateFormat = DateFormat('dd/MM/yyyy HH:mm');

    return GestureDetector(
      onTap: () {
        if (order.isActive) {
          Navigator.of(context).pushNamed('/order-tracking', arguments: order.id);
        }
      },
      child: Container(
        margin: const EdgeInsets.only(bottom: 10),
        padding: const EdgeInsets.all(14),
        decoration: BoxDecoration(
          color: AppColors.cardBackground,
          borderRadius: BorderRadius.circular(14),
          boxShadow: [
            BoxShadow(color: AppColors.shadow, blurRadius: 6, offset: const Offset(0, 2)),
          ],
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Container(
                  width: 44,
                  height: 44,
                  decoration: BoxDecoration(
                    color: AppColors.primaryLight.withValues(alpha: 0.3),
                    borderRadius: BorderRadius.circular(10),
                  ),
                  child: const Icon(Icons.restaurant, color: AppColors.primary, size: 24),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        order.restaurantName,
                        style: AppTextStyles.bodyMedium.copyWith(fontWeight: FontWeight.w600),
                      ),
                      const SizedBox(height: 2),
                      Text(
                        '${order.items.length} món · ${_formatPrice(order.total)}',
                        style: AppTextStyles.bodySmall,
                      ),
                    ],
                  ),
                ),
                OrderStatusBadge(status: order.status),
              ],
            ),
            const SizedBox(height: 10),
            Text(
              order.items.map((item) => '${item.name} (x${item.quantity})').join(', '),
              style: AppTextStyles.bodySmall,
              maxLines: 2,
              overflow: TextOverflow.ellipsis,
            ),
            const SizedBox(height: 8),
            Row(
              children: [
                Icon(Icons.access_time, size: 14, color: AppColors.textHint),
                const SizedBox(width: 4),
                Text(
                  dateFormat.format(order.createdAt),
                  style: AppTextStyles.caption,
                ),
                const Spacer(),
                if (order.isActive)
                  TextButton(
                    onPressed: () => Navigator.of(context).pushNamed(
                      '/order-tracking',
                      arguments: order.id,
                    ),
                    child: const Text('Theo dõi', style: TextStyle(fontSize: 12)),
                  )
                else if (order.status == 'delivered')
                  TextButton(
                    onPressed: () => Navigator.of(context).pushNamed(
                      '/review',
                      arguments: order.id,
                    ),
                    child: const Text('Đánh giá', style: TextStyle(fontSize: 12)),
                  ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  String _formatPrice(double price) {
    return '${price.round().toString().replaceAllMapped(
      RegExp(r'(\d{1,3})(?=(\d{3})+(?!\d))'),
      (match) => '${match[1]}.',
    )}đ';
  }
}
