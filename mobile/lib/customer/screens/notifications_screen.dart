import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../shared/theme/app_colors.dart';
import '../../shared/theme/app_text_styles.dart';
import '../../shared/widgets/empty_state.dart';
import '../../shared/widgets/error_state.dart';
import '../../shared/widgets/loading_shimmer.dart';
import '../providers/notification_provider.dart';
import '../widgets/notification_tile.dart';
import '../router/route_names.dart';
import '../../l10n/app_localizations.dart';

class NotificationsScreen extends ConsumerStatefulWidget {
  const NotificationsScreen({super.key});

  @override
  ConsumerState<NotificationsScreen> createState() =>
      _NotificationsScreenState();
}

class _NotificationsScreenState extends ConsumerState<NotificationsScreen>
    with SingleTickerProviderStateMixin {
  late TabController _tabController;

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

  List<NotificationModel> _filtered(List<NotificationModel> all, int tab) {
    if (tab == 0) return all;
    final type = _typeMap[tab];
    return all.where((e) => e.type == type).toList();
  }

  void _handleTap(NotificationModel item) {
    if (!item.isRead) {
      ref.read(notificationProvider.notifier).markRead(item.id);
    }
    // Route to target screen based on notification type + deepLink
    if (item.deepLink != null && item.deepLink!.isNotEmpty) {
      context.push(item.deepLink!);
      return;
    }
    // Fallback routing by type
    switch (item.type) {
      case 'order':
        context.push(Routes.orders);
        break;
      case 'promo':
        context.push(Routes.vouchers);
        break;
      default:
        // System notification — no deep link, just mark as read
        break;
    }
  }

  @override
  Widget build(BuildContext context) {
    final state = ref.watch(notificationProvider);
    final l10n = AppLocalizations.of(context);
    final tabs = [
      l10n.notificationsAll,
      l10n.notificationsOrders,
      l10n.notificationsPromotions,
      l10n.notificationsSystem,
    ];

    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        backgroundColor: AppColors.background,
        elevation: 0,
        leading: const BackButton(color: AppColors.textPrimary),
        title: Text(l10n.notificationsTitle, style: AppTextStyles.headline3),
        centerTitle: true,
        actions: [
          TextButton(
            onPressed: state.unreadCount > 0
                ? () => ref.read(notificationProvider.notifier).markAllRead()
                : null,
            child: Text(
              l10n.notificationsReadAll,
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
          labelStyle: const TextStyle(
            fontSize: 13,
            fontWeight: FontWeight.w600,
          ),
          unselectedLabelStyle: const TextStyle(
            fontSize: 13,
            fontWeight: FontWeight.w400,
          ),
          indicatorColor: AppColors.primary,
          labelColor: AppColors.primary,
          unselectedLabelColor: AppColors.textSecondary,
          isScrollable: true,
          tabs: tabs.map((t) => Tab(text: t)).toList(),
        ),
      ),
      body: _buildBody(state, l10n),
    );
  }

  Widget _buildBody(NotificationState state, AppLocalizations l10n) {
    if (state.isLoading && state.notifications.isEmpty) {
      return const SingleChildScrollView(
        child: LoadingShimmer(type: ShimmerType.order, itemCount: 5),
      );
    }
    if (state.error != null && state.notifications.isEmpty) {
      return ErrorState(
        message: state.error!,
        onRetry: () =>
            ref.read(notificationProvider.notifier).fetchNotifications(),
      );
    }
    return TabBarView(
      controller: _tabController,
      children: List.generate(
        4,
        (i) => _buildTab(state.notifications, i, l10n),
      ),
    );
  }

  Widget _buildTab(
    List<NotificationModel> all,
    int index,
    AppLocalizations l10n,
  ) {
    final items = _filtered(all, index);
    if (items.isEmpty) {
      return EmptyState(
        icon: Icons.notifications_none_outlined,
        title: l10n.notificationsEmptyTitle,
        subtitle: l10n.notificationsEmptySubtitle,
      );
    }
    return RefreshIndicator(
      onRefresh: () =>
          ref.read(notificationProvider.notifier).fetchNotifications(),
      child: ListView.separated(
        padding: const EdgeInsets.symmetric(vertical: 8),
        itemCount: items.length,
        separatorBuilder: (_, __) =>
            const Divider(height: 1, color: AppColors.divider),
        itemBuilder: (_, i) => NotificationTile(
          notification: items[i],
          onTap: () => _handleTap(items[i]),
        ),
      ),
    );
  }
}
