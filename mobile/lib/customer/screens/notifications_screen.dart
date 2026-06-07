import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../shared/theme/app_colors.dart';
import '../../shared/theme/app_text_styles.dart';
import '../../shared/widgets/empty_state.dart';

class _NotifItem {
  final String id;
  final String type; // order | promo | system
  final String title;
  final String body;
  final String time;
  final bool isRead;
  final String? deepLink;

  const _NotifItem({
    required this.id,
    required this.type,
    required this.title,
    required this.body,
    required this.time,
    this.isRead = false,
    this.deepLink,
  });

  _NotifItem markRead() => _NotifItem(
        id: id,
        type: type,
        title: title,
        body: body,
        time: time,
        isRead: true,
        deepLink: deepLink,
      );
}

class NotificationsScreen extends ConsumerStatefulWidget {
  const NotificationsScreen({super.key});

  @override
  ConsumerState<NotificationsScreen> createState() =>
      _NotificationsScreenState();
}

class _NotificationsScreenState extends ConsumerState<NotificationsScreen>
    with SingleTickerProviderStateMixin {
  late TabController _tabController;
  List<_NotifItem> _items = const [];
  bool _loading = false;

  static const _tabs = ['Tất cả', 'Đơn hàng', 'Khuyến mãi', 'Hệ thống'];
  static const _typeMap = ['', 'order', 'promo', 'system'];

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 4, vsync: this);
    WidgetsBinding.instance.addPostFrameCallback((_) => _refresh());
  }

  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }

  Future<void> _refresh() async {
    setState(() => _loading = true);
    // Replace with real API call when notification endpoint is available
    await Future.delayed(const Duration(milliseconds: 600));
    if (mounted) setState(() => _loading = false);
  }

  void _markAllRead() {
    setState(() => _items = _items.map((e) => e.markRead()).toList());
  }

  List<_NotifItem> _filtered(int tab) {
    if (tab == 0) return _items;
    final type = _typeMap[tab];
    return _items.where((e) => e.type == type).toList();
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

  @override
  Widget build(BuildContext context) {
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
            onPressed: _markAllRead,
            child: const Text(
              'Đọc tất cả',
              style: TextStyle(
                fontSize: 12,
                color: AppColors.primary,
                fontWeight: FontWeight.w500,
              ),
            ),
          ),
        ],
        bottom: TabBar(
          controller: _tabController,
          labelStyle:
              const TextStyle(fontSize: 13, fontWeight: FontWeight.w600),
          unselectedLabelStyle:
              const TextStyle(fontSize: 13, fontWeight: FontWeight.w400),
          indicatorColor: AppColors.primary,
          labelColor: AppColors.primary,
          unselectedLabelColor: AppColors.textSecondary,
          isScrollable: true,
          tabs: _tabs.map((t) => Tab(text: t)).toList(),
        ),
      ),
      body: TabBarView(
        controller: _tabController,
        children: List.generate(4, _buildTab),
      ),
    );
  }

  Widget _buildTab(int index) {
    if (_loading) {
      return const Center(
          child: CircularProgressIndicator(color: AppColors.primary));
    }
    final items = _filtered(index);
    if (items.isEmpty) {
      return const EmptyState(
        icon: Icons.notifications_none_outlined,
        title: 'Không có thông báo',
        subtitle: 'Bạn chưa có thông báo nào',
      );
    }
    return RefreshIndicator(
      onRefresh: _refresh,
      child: ListView.separated(
        padding: const EdgeInsets.symmetric(vertical: 8),
        itemCount: items.length,
        separatorBuilder: (_, __) =>
            Divider(height: 1, color: AppColors.divider),
        itemBuilder: (_, i) => _buildCard(items[i]),
      ),
    );
  }

  Widget _buildCard(_NotifItem item) {
    return InkWell(
      onTap: () {
        if (!item.isRead) {
          setState(() {
            final idx = _items.indexWhere((e) => e.id == item.id);
            if (idx != -1) {
              _items = List.of(_items)..[idx] = item.markRead();
            }
          });
        }
        if (item.deepLink != null) context.push(item.deepLink!);
      },
      child: Container(
        color:
            item.isRead ? null : AppColors.primary.withValues(alpha: 0.04),
        padding:
            const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
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
              child: Icon(_icon(item.type),
                  size: 20, color: _iconColor(item.type)),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    item.title,
                    style: AppTextStyles.bodyMedium
                        .copyWith(fontWeight: FontWeight.w600),
                  ),
                  const SizedBox(height: 2),
                  Text(item.body,
                      style: AppTextStyles.bodySmall,
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis),
                  const SizedBox(height: 4),
                  Text(item.time, style: AppTextStyles.caption),
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
