import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../shared/theme/app_colors.dart';
import '../../shared/theme/app_text_styles.dart';
import '../providers/driver_provider.dart';
import '../widgets/active_order_card.dart';
import '../widgets/delivery_order_item.dart';
import '../widgets/driver_stat_card.dart';
import '../widgets/online_toggle.dart';
import '../widgets/dispatch_offer_dialog.dart';

class HomeScreen extends ConsumerStatefulWidget {
  const HomeScreen({super.key});

  @override
  ConsumerState<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends ConsumerState<HomeScreen> {
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      ref.read(driverProvider.notifier).fetchTodayStats();
      ref.read(driverProvider.notifier).fetchPendingOrders();
      ref.read(driverProvider.notifier).fetchActiveOrder();
    });
  }

  @override
  Widget build(BuildContext context) {
    final state = ref.watch(driverProvider);

    // Show the dispatch offer dialog whenever a new offer arrives via WebSocket.
    ref.listen<DispatchOffer?>(
      driverProvider.select((s) => s.pendingOffer),
      (prev, offer) {
        if (offer == null) return;
        showDialog(
          context: context,
          barrierDismissible: false,
          builder: (_) => DispatchOfferDialog(
            offer: offer,
            onAccept: () {
              ref.read(driverProvider.notifier).acceptOrder(offer.orderId);
            },
            onReject: () {
              ref.read(driverProvider.notifier).dismissOffer();
            },
          ),
        );
      },
    );

    return Scaffold(
      backgroundColor: const Color(0xFF121212),
      appBar: AppBar(
        backgroundColor: const Color(0xFF1A1A1A),
        elevation: 0,
        title: const Text(
          'FoodFlow Driver',
          style: TextStyle(color: Colors.white, fontWeight: FontWeight.w700),
        ),
        actions: [
          IconButton(
            icon: const Icon(Icons.notifications_outlined, color: Colors.white),
            onPressed: () {
              ScaffoldMessenger.of(context).showSnackBar(
                const SnackBar(content: Text('Tính năng thông báo đang phát triển')),
              );
            },
          ),
        ],
      ),
      body: RefreshIndicator(
        onRefresh: () async {
          await ref.read(driverProvider.notifier).fetchTodayStats();
          await ref.read(driverProvider.notifier).fetchPendingOrders();
        },
        child: SingleChildScrollView(
          physics: const AlwaysScrollableScrollPhysics(),
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Online toggle card
              const OnlineToggle(),
              const SizedBox(height: 20),

              // Today stats
              Text(
                'Hôm nay',
                style: AppTextStyles.headline4.copyWith(color: Colors.white),
              ),
              const SizedBox(height: 12),
              _buildTodayStats(state),
              const SizedBox(height: 24),

              // Active order
              if (state.activeOrder != null) ...[
                ActiveOrderCard(order: state.activeOrder!),
                const SizedBox(height: 20),
              ],

              // Recent deliveries
              Text(
                'Đơn gần đây',
                style: AppTextStyles.headline4.copyWith(color: Colors.white),
              ),
              const SizedBox(height: 12),
              _buildRecentDeliveries(state),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildTodayStats(DriverState state) {
    final stats = state.todayStats;
    return GridView.count(
      crossAxisCount: 2,
      mainAxisSpacing: 10,
      crossAxisSpacing: 10,
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      childAspectRatio: 1.3,
      children: [
        DriverStatCard(
          icon: Icons.monetization_on_outlined,
          label: 'Thu nhập',
          value: '${stats.earnings.toStringAsFixed(0)}đ',
          color: AppColors.primary,
        ),
        DriverStatCard(
          icon: Icons.receipt_long_outlined,
          label: 'Số đơn',
          value: '${stats.orderCount}',
          color: AppColors.info,
        ),
        DriverStatCard(
          icon: Icons.timer_outlined,
          label: 'Online',
          value: stats.onlineTimeText,
          color: AppColors.accent,
        ),
        DriverStatCard(
          icon: Icons.star_outline,
          label: 'Đánh giá',
          value: stats.rating.toStringAsFixed(1),
          color: AppColors.warning,
        ),
      ],
    );
  }

  Widget _buildRecentDeliveries(DriverState state) {
    if (state.isLoading) {
      return const Center(
        child: Padding(
          padding: EdgeInsets.all(32),
          child: CircularProgressIndicator(color: AppColors.primary),
        ),
      );
    }

    return Column(
      children: [
        if (state.pendingOrders.isNotEmpty) ...[
          ...state.pendingOrders.take(5).map((order) => DeliveryOrderItem(order: order)),
        ] else ...[
          Container(
            width: double.infinity,
            padding: const EdgeInsets.all(32),
            child: Column(
              children: [
                Icon(
                  Icons.inbox_outlined,
                  size: 48,
                  color: AppColors.textSecondary.withValues(alpha: 0.5),
                ),
                const SizedBox(height: 12),
                const Text(
                  'Chưa có đơn hàng nào',
                  style: TextStyle(
                    fontSize: 14,
                    color: Color(0xFF6B7280),
                  ),
                ),
              ],
            ),
          ),
        ],
      ],
    );
  }

}
