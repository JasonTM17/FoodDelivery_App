import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../shared/models/order.dart';
import '../../shared/theme/app_colors.dart';
import '../../shared/theme/app_text_styles.dart';
import '../providers/driver_provider.dart';
import '../widgets/driver_stat_card.dart';

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
            onPressed: () {},
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
              _buildOnlineToggle(state),
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
                _buildActiveOrderCard(state.activeOrder!),
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

  Widget _buildOnlineToggle(DriverState state) {
    return Container(
      padding: const EdgeInsets.all(18),
      decoration: BoxDecoration(
        color: const Color(0xFF1E1E1E),
        borderRadius: BorderRadius.circular(18),
        border: Border.all(
          color: state.isOnline
              ? AppColors.primary.withValues(alpha: 0.3)
              : const Color(0xFF374151),
        ),
      ),
      child: Row(
        children: [
          Container(
            width: 12,
            height: 12,
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              color: state.isOnline ? AppColors.primary : AppColors.textHint,
              boxShadow: state.isOnline
                  ? [
                      BoxShadow(
                        color: AppColors.primary.withValues(alpha: 0.5),
                        blurRadius: 8,
                      ),
                    ]
                  : [],
            ),
          ),
          const SizedBox(width: 12),
          Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                state.isOnline ? 'Đang trực tuyến' : 'Đang ngoại tuyến',
                style: TextStyle(
                  fontSize: 16,
                  fontWeight: FontWeight.w700,
                  color: state.isOnline ? AppColors.primary : AppColors.textSecondary,
                ),
              ),
              Text(
                state.isOnline ? 'Sẵn sàng nhận đơn' : 'Bật để nhận đơn hàng',
                style: const TextStyle(
                  fontSize: 12,
                  color: Color(0xFF6B7280),
                ),
              ),
            ],
          ),
          const Spacer(),
          SizedBox(
            height: 36,
            child: Switch(
              value: state.isOnline,
              onChanged: (value) {
                if (value) {
                  ref.read(driverProvider.notifier).goOnline(10.762622, 106.660172);
                } else {
                  ref.read(driverProvider.notifier).goOffline();
                }
              },
              activeColor: AppColors.primary,
              inactiveThumbColor: AppColors.textHint,
              inactiveTrackColor: const Color(0xFF374151),
            ),
          ),
        ],
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

  Widget _buildActiveOrderCard(OrderModel order) {
    return InkWell(
      onTap: () {
        context.push('/delivery-flow');
      },
      borderRadius: BorderRadius.circular(18),
      child: Container(
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
          borderRadius: BorderRadius.circular(18),
          border: Border.all(
            color: AppColors.primary.withValues(alpha: 0.2),
          ),
        ),
        child: Row(
          children: [
            Container(
              width: 48,
              height: 48,
              decoration: BoxDecoration(
                color: AppColors.primary.withValues(alpha: 0.2),
                borderRadius: BorderRadius.circular(14),
              ),
              child: const Icon(
                Icons.delivery_dining,
                color: AppColors.primary,
                size: 26,
              ),
            ),
            const SizedBox(width: 14),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text(
                    'Đơn đang thực hiện',
                    style: TextStyle(
                      fontSize: 12,
                      color: Color(0xFF6B7280),
                    ),
                  ),
                  const SizedBox(height: 2),
                  Text(
                    order.restaurantName,
                    style: const TextStyle(
                      fontSize: 15,
                      fontWeight: FontWeight.w700,
                      color: Colors.white,
                    ),
                  ),
                  Text(
                    order.statusText,
                    style: const TextStyle(
                      fontSize: 12,
                      color: AppColors.primary,
                    ),
                  ),
                ],
              ),
            ),
            const Icon(
              Icons.chevron_right,
              color: Color(0xFF6B7280),
            ),
          ],
        ),
      ),
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
          ...state.pendingOrders.take(5).map((order) => _buildDeliveryItem(order)),
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

  Widget _buildDeliveryItem(OrderModel order) {
    return Container(
      margin: const EdgeInsets.only(bottom: 10),
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
            child: const Icon(
              Icons.restaurant_outlined,
              color: AppColors.primary,
              size: 22,
            ),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  order.restaurantName,
                  style: const TextStyle(
                    fontSize: 14,
                    fontWeight: FontWeight.w600,
                    color: Colors.white,
                  ),
                ),
                const SizedBox(height: 2),
                Text(
                  'Mã: ${order.id.substring(0, 8).toUpperCase()}',
                  style: const TextStyle(
                    fontSize: 12,
                    color: Color(0xFF6B7280),
                  ),
                ),
              ],
            ),
          ),
          Text(
            '${order.total.toStringAsFixed(0)}đ',
            style: const TextStyle(
              fontSize: 15,
              fontWeight: FontWeight.w700,
              color: Colors.white,
            ),
          ),
        ],
      ),
    );
  }
}
