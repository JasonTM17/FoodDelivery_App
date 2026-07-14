import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../l10n/app_localizations.dart';
import '../../shared/theme/app_colors.dart';
import '../../shared/utils/notification_category.dart';
import '../providers/driver_notifications_provider.dart';
import '../widgets/driver_notification_state_widgets.dart';
import '../widgets/driver_notification_widgets.dart';

class NotificationsScreen extends ConsumerStatefulWidget {
  const NotificationsScreen({super.key});

  @override
  ConsumerState<NotificationsScreen> createState() =>
      _NotificationsScreenState();
}

class _NotificationsScreenState extends ConsumerState<NotificationsScreen>
    with SingleTickerProviderStateMixin {
  late TabController _tabController;

  static const _categoryMap = [
    NotificationCategory.other,
    NotificationCategory.order,
    NotificationCategory.promotion,
    NotificationCategory.system,
  ];

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 4, vsync: this);
    WidgetsBinding.instance.addPostFrameCallback((_) {
      ref.read(driverNotificationsProvider.notifier).fetchNotifications();
    });
  }

  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }

  List<DriverNotification> _filtered(
    List<DriverNotification> all,
    int tabIndex,
  ) {
    if (tabIndex == 0) return all;
    final category = _categoryMap[tabIndex];
    return all
        .where(
          (notification) =>
              notificationCategoryOf(notification.type) == category,
        )
        .toList();
  }

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context);
    final state = ref.watch(driverNotificationsProvider);

    return Scaffold(
      backgroundColor: const Color(0xFF121212),
      appBar: AppBar(
        backgroundColor: const Color(0xFF1A1A1A),
        elevation: 0,
        titleSpacing: 16,
        title: DriverNotificationsTitle(
          title: l10n.notificationsTitle,
          unread: state.unreadCount,
        ),
        centerTitle: false,
        actions: [
          TextButton(
            onPressed: state.unreadCount > 0
                ? () => ref
                      .read(driverNotificationsProvider.notifier)
                      .markAllRead()
                : null,
            child: Text(
              l10n.driver_notifications_read_all,
              style: TextStyle(
                color: state.unreadCount > 0
                    ? AppColors.primary
                    : const Color(0xFF6B7280),
                fontSize: 13,
              ),
            ),
          ),
        ],
        bottom: TabBar(
          controller: _tabController,
          labelColor: AppColors.primary,
          unselectedLabelColor: const Color(0xFF6B7280),
          indicatorColor: AppColors.primary,
          indicatorSize: TabBarIndicatorSize.label,
          labelStyle: const TextStyle(
            fontSize: 13,
            fontWeight: FontWeight.w600,
          ),
          tabs: [
            Tab(text: l10n.driver_notifications_all),
            Tab(text: l10n.driver_notifications_orders),
            Tab(text: l10n.driver_notifications_rewards),
            Tab(text: l10n.driver_notifications_system),
          ],
        ),
      ),
      body: _buildBody(state, l10n),
    );
  }

  Widget _buildBody(DriverNotificationsState state, AppLocalizations l10n) {
    if (state.isLoading && state.notifications.isEmpty) {
      return const Center(
        child: CircularProgressIndicator(color: AppColors.primary),
      );
    }
    if (state.error != null && state.notifications.isEmpty) {
      return DriverNotificationError(
        message: l10n.driver_notifications_load_failed,
        detail: state.error!,
        retryLabel: l10n.driver_bank_retry,
        onRetry: () =>
            ref.read(driverNotificationsProvider.notifier).fetchNotifications(),
      );
    }
    return TabBarView(
      controller: _tabController,
      children: List.generate(4, (index) {
        final items = _filtered(state.notifications, index);
        return RefreshIndicator(
          onRefresh: () => ref
              .read(driverNotificationsProvider.notifier)
              .fetchNotifications(),
          color: AppColors.primary,
          backgroundColor: const Color(0xFF1E1E1E),
          child: items.isEmpty
              ? DriverNotificationEmpty(
                  title: l10n.driver_notifications_empty_title,
                  subtitle: l10n.driver_notifications_empty_subtitle,
                )
              : ListView.builder(
                  padding: const EdgeInsets.symmetric(vertical: 8),
                  itemCount: items.length,
                  itemBuilder: (_, itemIndex) => DriverNotificationCard(
                    notification: items[itemIndex],
                    l10n: l10n,
                    onTap: () => ref
                        .read(driverNotificationsProvider.notifier)
                        .markRead(items[itemIndex].id),
                  ),
                ),
        );
      }),
    );
  }
}
