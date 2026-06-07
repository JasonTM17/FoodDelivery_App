import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:intl/intl.dart';
import '../../shared/theme/app_colors.dart';
import '../../shared/theme/app_text_styles.dart';
import '../../shared/widgets/empty_state.dart';
import '../../shared/widgets/error_state.dart';
import '../../shared/widgets/loading_shimmer.dart';
import '../providers/notification_provider.dart';

class NotificationsScreen extends ConsumerStatefulWidget {
  const NotificationsScreen({super.key});

  @override
  ConsumerState<NotificationsScreen> createState() => _NotificationsScreenState();
}

class _NotificationsScreenState extends ConsumerState<NotificationsScreen>
    with SingleTickerProviderStateMixin {
  late TabController _tabController;

  static const _tabs = ['Tất cả', 'Đơn hàng', 'Khuyến mãi', 'Hệ thống'];
  static const _typeMap = ['', 'order', 'promo', 'system'];

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 4, vsync: this);
    WidgetsBinding.instance.addPostFrameCallback((_) {
      ref.read(notificationProvider.notifier).fetchNotifications();
    });
  }

  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }

  List<NotificationModel> _filtered(
      List<NotificationModel> all, int tab) {
    if (tab == 0) return all;
    final type = _typeMap[tab];
    return all.where((e) => e.type == type).toList();
  }

  IconData _icon(String type) {
    switch (type) {
      case 'order':
        return Icons.receipt_long_outlined;
      case 'promo':
        return Icons.local_offer_outlined;
      default:
        return Icons.notifications_none_outlined;
    }
  }

  Color _iconColor(String type) {
    switch (type) {
      case 'order':
        return AppColors.info;
      case 'promo':
        return AppColors.accent;
      default:
        return AppColors.textSecondary;
    }
  }

  String _formatTime(DateTime dt) {
    final now = DateTime.now();
    final diff = now.difference(dt);
    if (diff.inMinutes < 1) return 'Vừa xong';
    if (diff.inMinutes < 60) return '${diff.inMinutes} phút trước';
    if (diff.inHours < 24) return '${diff.inHours} giờ trước';
    if (diff.inDays < 7) return '${diff.inDays} ngày trước';
    return DateFormat('dd/MM/yyyy').format(dt);
  }

  @override
  Widget build(BuildContext context) {
    final state = ref.watch(notificationProvider);

    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        backgroundColor: AppColors.background,
        elevation: 0,
        leading: BackButton(color: AppColors.textPrimary),
        title: const Text('Thông báo', style: AppTextStyles.headline3),
        centerTitle: true,
        actions: [
          TextButton(
            onPressed: state.unreadCount > 0
                ? () => ref.read(notificationProvider.notifier).markAllRead()
                : null,
            child: Text(
              'Đọc tất cả',
              style: TextStyle(
                fontSize: 12,
                color: state.unreadCount > 0
                    ? AppColors.primary
                    : AppColors.textHint,
                fontWeight: FontWeight.w500,
              ),
            ),
          ),
        ],
        bottom: TabBar(
          controller: _tabController,
          labelStyle: const TextStyle(fontSize: 13, fontWeight: FontWeight.w600),
          unselectedLabelStyle:
              const TextStyle(fontSize: 13, fontWeight: FontWeight.w400),
          indicatorColor: AppColors.primary,
          labelColor: AppColors.primary,
          unselectedLabelColor: AppColors.textSecondary,
          isScrollable: true,
          tabs: _tabs.map((t) => Tab(text: t)).toList(),
        ),
      ),
      body: _buildBody(state),
    );
  }

  Widget _buildBody(NotificationState state) {
    if (state.isLoading && state.notifications.isEmpty) {
      return const LoadingShimmer(type: ShimmerType.order, itemCount: 5);
    }
    if (state.error != null && state.notifications.isEmpty) {
      return ErrorState(
        message: state.error!,
        onRetry: () => ref.read(notificationProvider.notifier).fetchNotifications(),
      );
    }
    return TabBarView(
      controller: _tabController,
      children: List.generate(4, (i) => _buildTab(state.notifications, i)),
    );
  }

  Widget _buildTab(List<NotificationModel> all, int index) {
    final items = _filtered(all, index);
    if (items.isEmpty) {
      return const EmptyState(
        icon: Icons.notifications_none_outlined,
        title: 'Không có thông báo',
        subtitle: 'Bạn chưa có thông báo nào',
      );
    }
    return RefreshIndicator(
      onRefresh: () => ref.read(notificationProvider.notifier).fetchNotifications(),
      child: ListView.separated(
        padding: const EdgeInsets.symmetric(vertical: 8),
        itemCount: items.length,
        separatorBuilder: (_, __) => Divider(height: 1, color: AppColors.divider),
        itemBuilder: (_, i) => _buildCard(items[i]),
      ),
    );
  }

  Widget _buildCard(NotificationModel item) {
    return InkWell(
      onTap: () {
        if (!item.isRead) {
          ref.read(notificationProvider.notifier).markRead(item.id);
        }
        if (item.deepLink != null) context.push(item.deepLink!);
      },
      child: Container(
        color: item.isRead ? null : AppColors.primary.withValues(alpha: 0.04),
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Container(
              width: 40,
              height: 40,
              decoration: BoxDecoration(
                color: _iconColor(item.type).withValues(alpha: 0.12),
                shape: BoxShape.circle,
              ),
              child: Icon(_icon(item.type), size: 20, color: _iconColor(item.type)),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    item.title,
                    style: AppTextStyles.bodyMedium.copyWith(fontWeight: FontWeight.w600),
                  ),
                  const SizedBox(height: 2),
                  Text(
                    item.body,
                    style: AppTextStyles.bodySmall,
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
                  ),
                  const SizedBox(height: 4),
                  Text(_formatTime(item.createdAt), style: AppTextStyles.caption),
                ],
              ),
            ),
            if (!item.isRead)
              Container(
                width: 8,
                height: 8,
                margin: const EdgeInsets.only(top: 4, left: 8),
                decoration: const BoxDecoration(
                  color: AppColors.primary,
                  shape: BoxShape.circle,
                ),
              ),
          ],
        ),
      ),
    );
  }
}
