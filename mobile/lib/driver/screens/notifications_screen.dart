import 'package:flutter/material.dart';
import '../../shared/theme/app_colors.dart';

class _Notif {
  final String title;
  final String body;
  final IconData icon;
  final Color color;
  final String time;
  bool read;

  _Notif({
    required this.title,
    required this.body,
    required this.icon,
    required this.color,
    required this.time,
    this.read = false,
  });
}

class NotificationsScreen extends StatefulWidget {
  const NotificationsScreen({super.key});

  @override
  State<NotificationsScreen> createState() => _NotificationsScreenState();
}

class _NotificationsScreenState extends State<NotificationsScreen>
    with SingleTickerProviderStateMixin {
  late TabController _tabCtrl;

  final _all = <_Notif>[
    _Notif(
      title: 'Đơn hàng mới',
      body: 'Bạn có đơn hàng mới cách 1.2km',
      icon: Icons.shopping_bag_outlined,
      color: AppColors.primary,
      time: '5 phút trước',
    ),
    _Notif(
      title: 'Thưởng peak hour',
      body: '+15.000đ thưởng giờ cao điểm',
      icon: Icons.star_outline,
      color: AppColors.warning,
      time: '30 phút trước',
    ),
    _Notif(
      title: 'Hệ thống',
      body: 'Cập nhật ứng dụng phiên bản 2.1.0',
      icon: Icons.info_outline,
      color: AppColors.info,
      time: '2 giờ trước',
      read: true,
    ),
    _Notif(
      title: 'Đánh giá mới',
      body: 'Khách hàng đánh giá 5 sao cho bạn',
      icon: Icons.star,
      color: AppColors.warning,
      time: '3 giờ trước',
      read: true,
    ),
    _Notif(
      title: 'Thưởng hoàn thành',
      body: 'Hoàn thành 10 đơn, +50.000đ tiền thưởng!',
      icon: Icons.emoji_events_outlined,
      color: AppColors.primary,
      time: 'Hôm qua',
      read: true,
    ),
  ];

  @override
  void initState() {
    super.initState();
    _tabCtrl = TabController(length: 4, vsync: this);
  }

  @override
  void dispose() {
    _tabCtrl.dispose();
    super.dispose();
  }

  List<_Notif> _filtered(int tabIndex) {
    switch (tabIndex) {
      case 1:
        return _all.where((n) => n.icon == Icons.shopping_bag_outlined).toList();
      case 2:
        return _all.where((n) => n.color == AppColors.warning).toList();
      case 3:
        return _all.where((n) => n.color == AppColors.info).toList();
      default:
        return _all;
    }
  }

  Future<void> _refresh() async {
    await Future.delayed(const Duration(seconds: 1));
  }

  void _markAllRead() => setState(() {
        for (final n in _all) {
          n.read = true;
        }
      });

  @override
  Widget build(BuildContext context) {
    final unread = _all.where((n) => !n.read).length;

    return Scaffold(
      backgroundColor: const Color(0xFF121212),
      appBar: AppBar(
        backgroundColor: const Color(0xFF1A1A1A),
        elevation: 0,
        titleSpacing: 16,
        title: Row(
          children: [
            const Text(
              'Thông báo',
              style: TextStyle(
                  color: Colors.white,
                  fontWeight: FontWeight.w700,
                  fontSize: 18),
            ),
            if (unread > 0) ...[
              const SizedBox(width: 8),
              Container(
                padding:
                    const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                decoration: BoxDecoration(
                    color: AppColors.error,
                    borderRadius: BorderRadius.circular(12)),
                child: Text(
                  '$unread',
                  style: const TextStyle(
                      color: Colors.white,
                      fontSize: 12,
                      fontWeight: FontWeight.w700),
                ),
              ),
            ],
          ],
        ),
        centerTitle: false,
        actions: [
          TextButton(
            onPressed: _markAllRead,
            child: const Text(
              'Đọc tất cả',
              style: TextStyle(color: AppColors.primary, fontSize: 13),
            ),
          ),
        ],
        bottom: TabBar(
          controller: _tabCtrl,
          labelColor: AppColors.primary,
          unselectedLabelColor: const Color(0xFF6B7280),
          indicatorColor: AppColors.primary,
          indicatorSize: TabBarIndicatorSize.label,
          labelStyle: const TextStyle(
              fontSize: 13, fontWeight: FontWeight.w600),
          tabs: const [
            Tab(text: 'Tất cả'),
            Tab(text: 'Đơn hàng'),
            Tab(text: 'Thưởng'),
            Tab(text: 'Hệ thống'),
          ],
        ),
      ),
      body: TabBarView(
        controller: _tabCtrl,
        children: List.generate(4, (tabIndex) {
          final items = _filtered(tabIndex);
          return RefreshIndicator(
            onRefresh: _refresh,
            color: AppColors.primary,
            backgroundColor: const Color(0xFF1E1E1E),
            child: items.isEmpty
                ? const Center(
                    child: Text(
                      'Không có thông báo',
                      style: TextStyle(color: Color(0xFF6B7280)),
                    ),
                  )
                : ListView.builder(
                    padding: const EdgeInsets.symmetric(vertical: 8),
                    itemCount: items.length,
                    itemBuilder: (_, i) => _notifCard(items[i]),
                  ),
          );
        }),
      ),
    );
  }

  Widget _notifCard(_Notif n) {
    return GestureDetector(
      onTap: () => setState(() => n.read = true),
      child: Container(
        margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 5),
        padding: const EdgeInsets.all(14),
        decoration: BoxDecoration(
          color: const Color(0xFF1E1E1E),
          borderRadius: BorderRadius.circular(14),
          border: Border.all(
            color:
                n.read ? Colors.transparent : n.color.withValues(alpha: 0.3),
          ),
        ),
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Container(
              width: 44,
              height: 44,
              decoration: BoxDecoration(
                color: n.color.withValues(alpha: 0.12),
                borderRadius: BorderRadius.circular(12),
              ),
              child: Icon(n.icon, color: n.color, size: 22),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Expanded(
                        child: Text(
                          n.title,
                          style: const TextStyle(
                              fontSize: 14,
                              fontWeight: FontWeight.w700,
                              color: Colors.white),
                        ),
                      ),
                      if (!n.read)
                        Container(
                          width: 8,
                          height: 8,
                          decoration: const BoxDecoration(
                            shape: BoxShape.circle,
                            color: AppColors.primary,
                          ),
                        ),
                    ],
                  ),
                  const SizedBox(height: 3),
                  Text(
                    n.body,
                    style: const TextStyle(
                        fontSize: 13, color: Color(0xFFD1D5DB)),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    n.time,
                    style: const TextStyle(
                        fontSize: 12, color: Color(0xFF6B7280)),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}
