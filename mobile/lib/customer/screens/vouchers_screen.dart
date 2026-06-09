import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../shared/theme/app_colors.dart';
import '../../shared/theme/app_text_styles.dart';
import '../../shared/widgets/empty_state.dart';
import '../../shared/widgets/error_state.dart';
import '../../shared/widgets/loading_shimmer.dart';
import '../providers/vouchers_provider.dart';
import '../widgets/voucher_card.dart';

class VouchersScreen extends ConsumerStatefulWidget {
  const VouchersScreen({super.key});

  @override
  ConsumerState<VouchersScreen> createState() => _VouchersScreenState();
}

class _VouchersScreenState extends ConsumerState<VouchersScreen>
    with SingleTickerProviderStateMixin {
  late TabController _tabController;

  static const _tabs = ['Của tôi', 'Khả dụng', 'Hết hạn'];

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 3, vsync: this);
    Future.microtask(() => ref.read(vouchersProvider.notifier).fetchVouchers());
  }

  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }

  void _copyCode(String code) {
    Clipboard.setData(ClipboardData(text: code));
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(
        content: Text('Đã sao chép mã'),
        backgroundColor: AppColors.success,
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final state = ref.watch(vouchersProvider);

    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        backgroundColor: AppColors.background,
        elevation: 0,
        leading: const BackButton(color: AppColors.textPrimary),
        title: const Text('Ưu đãi & Voucher', style: AppTextStyles.headline3),
        centerTitle: true,
        bottom: TabBar(
          controller: _tabController,
          labelStyle: const TextStyle(fontSize: 13, fontWeight: FontWeight.w600),
          unselectedLabelStyle: const TextStyle(fontSize: 13, fontWeight: FontWeight.w400),
          indicatorColor: AppColors.primary,
          labelColor: AppColors.primary,
          unselectedLabelColor: AppColors.textSecondary,
          tabs: _tabs.map((t) => Tab(text: t)).toList(),
        ),
      ),
      body: _buildBody(state),
    );
  }

  Widget _buildBody(VouchersState state) {
    if (state.isLoading && state.myVouchers.isEmpty) {
      return const LoadingShimmer(type: ShimmerType.foodItem, itemCount: 4);
    }
    if (state.error != null && state.myVouchers.isEmpty) {
      return ErrorState(
        message: state.error!,
        onRetry: () => ref.read(vouchersProvider.notifier).fetchVouchers(),
      );
    }
    return RefreshIndicator(
      onRefresh: () => ref.read(vouchersProvider.notifier).fetchVouchers(),
      child: TabBarView(
        controller: _tabController,
        children: [
          _buildTab(state.myVouchers, showCopy: true, showUse: true),
          _buildTab(state.availableVouchers, showUse: false),
          _buildTab(state.expiredVouchers, isExpired: true),
        ],
      ),
    );
  }

  Widget _buildTab(List<Voucher> vouchers, {bool showCopy = false, bool showUse = false, bool isExpired = false}) {
    if (vouchers.isEmpty) {
      return EmptyState(
        icon: isExpired ? Icons.event_busy : Icons.local_offer_outlined,
        title: isExpired ? 'Không có voucher hết hạn' : 'Chưa có voucher',
        subtitle: isExpired
            ? 'Voucher hết hạn sẽ xuất hiện ở đây'
            : 'Khám phá các voucher đang có sẵn',
      );
    }
    return ListView.builder(
      padding: const EdgeInsets.all(16),
      itemCount: vouchers.length,
      itemBuilder: (context, index) {
        final voucher = vouchers[index];
        return VoucherCard(
          voucher: voucher,
          onUse: showUse
              ? () => _copyCode(voucher.code)
              : showCopy
                  ? () => _copyCode(voucher.code)
                  : null,
        );
      },
    );
  }
}
