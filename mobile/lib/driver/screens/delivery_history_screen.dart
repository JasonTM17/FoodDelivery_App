import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../shared/models/order.dart';
import '../../shared/theme/app_colors.dart';

import '../../shared/widgets/order_status_badge.dart';
import '../providers/driver_provider.dart';
import '../providers/trip_history_filter_provider.dart';
import '../widgets/date_range_filter.dart';
import '../../l10n/app_localizations.dart';

class DeliveryHistoryScreen extends ConsumerStatefulWidget {
  const DeliveryHistoryScreen({super.key});

  @override
  ConsumerState<DeliveryHistoryScreen> createState() =>
      _DeliveryHistoryScreenState();
}

class _DeliveryHistoryScreenState extends ConsumerState<DeliveryHistoryScreen> {
  List<OrderModel> _orders = [];
  bool _isLoading = true;
  String? _error;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) => _loadHistory());
  }

  Future<void> _loadHistory() async {
    setState(() {
      _isLoading = true;
      _error = null;
    });
    try {
      final filter = ref.read(tripHistoryFilterProvider);
      final params = filter.toQueryParams();
      final orders = await ref
          .read(driverProvider.notifier)
          .fetchDeliveryHistory(
            fromDate: params['from'] as String?,
            toDate: params['to'] as String?,
          );
      if (mounted) {
        setState(() {
          _orders = orders;
          _isLoading = false;
        });
      }
    } catch (_) {
      if (mounted) {
        setState(() {
          _error = AppLocalizations.of(context).driverHistoryLoadError;
          _isLoading = false;
        });
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context);
    final filter = ref.watch(tripHistoryFilterProvider);

    return Scaffold(
      backgroundColor: const Color(0xFF121212),
      appBar: AppBar(
        backgroundColor: const Color(0xFF1A1A1A),
        elevation: 0,
        title: Text(
          l10n.driverHistoryTitle,
          style: const TextStyle(
            color: Colors.white,
            fontWeight: FontWeight.w700,
          ),
        ),
      ),
      body: Column(
        children: [
          const SizedBox(height: 8),
          DateRangeFilter(
            fromDate: filter.fromDate,
            toDate: filter.toDate,
            onFromDateChanged: (date) {
              ref
                  .read(tripHistoryFilterProvider.notifier)
                  .setDateRange(date, filter.toDate);
              _loadHistory();
            },
            onToDateChanged: (date) {
              ref
                  .read(tripHistoryFilterProvider.notifier)
                  .setDateRange(filter.fromDate, date);
              _loadHistory();
            },
            onClear: () {
              ref.read(tripHistoryFilterProvider.notifier).clearFilters();
              _loadHistory();
            },
          ),
          const SizedBox(height: 8),
          _buildStatusChips(),
          const SizedBox(height: 8),
          Expanded(
            child: _isLoading
                ? const Center(
                    child: CircularProgressIndicator(color: AppColors.primary),
                  )
                : _error != null
                ? _buildErrorState(_error!)
                : _orders.isEmpty
                ? _buildEmptyState()
                : RefreshIndicator(
                    onRefresh: _loadHistory,
                    child: ListView.builder(
                      padding: const EdgeInsets.fromLTRB(16, 8, 16, 24),
                      itemCount: _orders.length,
                      itemBuilder: (context, index) =>
                          _buildOrderCard(_orders[index]),
                    ),
                  ),
          ),
        ],
      ),
    );
  }

  Widget _buildStatusChips() {
    final filter = ref.watch(tripHistoryFilterProvider);
    final options = [
      (TripStatusFilter.all, 'Tất cả'),
      (TripStatusFilter.completed, 'Hoàn thành'),
      (TripStatusFilter.cancelled, 'Đã huỷ'),
    ];
    return SingleChildScrollView(
      scrollDirection: Axis.horizontal,
      padding: const EdgeInsets.symmetric(horizontal: 16),
      child: Row(
        children: options.map((opt) {
          final isActive = filter.statusFilter == opt.$1;
          return Padding(
            padding: const EdgeInsets.only(right: 8),
            child: ChoiceChip(
              label: Text(opt.$2),
              selected: isActive,
              onSelected: (_) {
                ref
                    .read(tripHistoryFilterProvider.notifier)
                    .setStatusFilter(opt.$1);
                _loadHistory();
              },
              selectedColor: AppColors.primary.withValues(alpha: 0.15),
              backgroundColor: const Color(0xFF1E1E1E),
              labelStyle: TextStyle(
                fontSize: 12,
                fontWeight: FontWeight.w500,
                color: isActive ? AppColors.primary : const Color(0xFF9CA3AF),
              ),
              side: BorderSide(
                color: isActive ? AppColors.primary : const Color(0xFF374151),
              ),
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(10),
              ),
            ),
          );
        }).toList(),
      ),
    );
  }

  Widget _buildOrderCard(OrderModel order) {
    return Container(
      margin: const EdgeInsets.only(bottom: 10),
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: const Color(0xFF1E1E1E),
        borderRadius: BorderRadius.circular(14),
      ),
      child: InkWell(
        onTap: () => _showOrderDetail(order),
        borderRadius: BorderRadius.circular(14),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
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
                        'ĐH: ${order.id.substring(0, 8).toUpperCase()}',
                        style: const TextStyle(
                          fontSize: 12,
                          color: Color(0xFF6B7280),
                        ),
                      ),
                    ],
                  ),
                ),
                OrderStatusBadge(status: order.status),
              ],
            ),
            const SizedBox(height: 10),
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Row(
                  children: [
                    const Icon(
                      Icons.calendar_today,
                      size: 13,
                      color: Color(0xFF6B7280),
                    ),
                    const SizedBox(width: 4),
                    Text(
                      _formatDateTime(order.createdAt),
                      style: const TextStyle(
                        fontSize: 12,
                        color: Color(0xFF6B7280),
                      ),
                    ),
                  ],
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
          ],
        ),
      ),
    );
  }

  Widget _buildErrorState(String message) {
    final l10n = AppLocalizations.of(context);
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(32),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(
              Icons.cloud_off_outlined,
              size: 56,
              color: const Color(0xFF6B7280).withValues(alpha: 0.4),
            ),
            const SizedBox(height: 16),
            Text(
              message,
              textAlign: TextAlign.center,
              style: const TextStyle(fontSize: 15, color: Color(0xFF9CA3AF)),
            ),
            const SizedBox(height: 16),
            OutlinedButton.icon(
              onPressed: _loadHistory,
              icon: const Icon(Icons.refresh),
              label: Text(l10n.driverHistoryRetry),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildEmptyState() {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(32),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(
              Icons.history,
              size: 56,
              color: const Color(0xFF6B7280).withValues(alpha: 0.4),
            ),
            const SizedBox(height: 16),
            Text(
              AppLocalizations.of(context).driverHistoryEmpty,
              style: const TextStyle(fontSize: 15, color: Color(0xFF6B7280)),
            ),
          ],
        ),
      ),
    );
  }

  void _showOrderDetail(OrderModel order) {
    showModalBottomSheet(
      context: context,
      backgroundColor: const Color(0xFF1E1E1E),
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      builder: (ctx) {
        return Padding(
          padding: const EdgeInsets.all(20),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Center(
                child: Container(
                  width: 40,
                  height: 4,
                  decoration: BoxDecoration(
                    color: const Color(0xFF374151),
                    borderRadius: BorderRadius.circular(2),
                  ),
                ),
              ),
              const SizedBox(height: 16),
              Row(
                children: [
                  Expanded(
                    child: Text(
                      order.restaurantName,
                      style: const TextStyle(
                        fontSize: 18,
                        fontWeight: FontWeight.w700,
                        color: Colors.white,
                      ),
                    ),
                  ),
                  OrderStatusBadge(status: order.status),
                ],
              ),
              const SizedBox(height: 4),
              Text(
                'ĐH: ${order.id.substring(0, 8).toUpperCase()}',
                style: const TextStyle(fontSize: 13, color: Color(0xFF6B7280)),
              ),
              const Divider(color: Color(0xFF374151), height: 24),
              Text(
                'Địa chỉ giao: ${order.deliveryAddress.address}',
                style: const TextStyle(fontSize: 14, color: Color(0xFFD1D5DB)),
              ),
              const SizedBox(height: 8),
              if (order.note != null)
                Text(
                  'Ghi chú: ${order.note}',
                  style: const TextStyle(
                    fontSize: 13,
                    color: Color(0xFF6B7280),
                  ),
                ),
              const Divider(color: Color(0xFF374151), height: 24),
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  const Text(
                    'Phí giao hàng',
                    style: TextStyle(fontSize: 14, color: Color(0xFFD1D5DB)),
                  ),
                  Text(
                    '${order.deliveryFee.toStringAsFixed(0)}đ',
                    style: const TextStyle(fontSize: 14, color: Colors.white),
                  ),
                ],
              ),
              const SizedBox(height: 8),
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  const Text(
                    'Tổng',
                    style: TextStyle(
                      fontSize: 16,
                      fontWeight: FontWeight.w700,
                      color: Colors.white,
                    ),
                  ),
                  Text(
                    '${order.total.toStringAsFixed(0)}đ',
                    style: const TextStyle(
                      fontSize: 18,
                      fontWeight: FontWeight.w700,
                      color: AppColors.primary,
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 16),
            ],
          ),
        );
      },
    );
  }

  String _formatDateTime(DateTime dt) {
    final now = DateTime.now();
    final diff = now.difference(dt);
    if (diff.inDays == 0) {
      return 'Hôm nay, ${dt.hour.toString().padLeft(2, '0')}:${dt.minute.toString().padLeft(2, '0')}';
    }
    if (diff.inDays == 1) {
      return 'Hôm qua, ${dt.hour.toString().padLeft(2, '0')}:${dt.minute.toString().padLeft(2, '0')}';
    }
    return '${dt.day}/${dt.month}/${dt.year}';
  }
}
