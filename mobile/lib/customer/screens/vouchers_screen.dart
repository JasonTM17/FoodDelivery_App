import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:intl/intl.dart';
import '../../l10n/app_localizations.dart';
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
    final l10n = AppLocalizations.of(context);
    Clipboard.setData(ClipboardData(text: code));
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(l10n.vouchersCodeCopied),
        backgroundColor: AppColors.success,
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context);
    final state = ref.watch(vouchersProvider);

    final tabs = [
      l10n.vouchersTabMine,
      l10n.vouchersTabAvailable,
      l10n.vouchersTabExpired,
    ];

    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        backgroundColor: AppColors.background,
        elevation: 0,
        leading: const BackButton(color: AppColors.textPrimary),
        title: Text(l10n.vouchersTitle, style: AppTextStyles.headline3),
        centerTitle: true,
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
          tabs: tabs.map((t) => Tab(text: t)).toList(),
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
          _buildTab(state.myVouchers),
          _buildTab(state.availableVouchers, showUse: true, isAvailable: true),
          _buildTab(state.expiredVouchers, isExpired: true),
        ],
      ),
    );
  }

  Widget _buildTab(
    List<Voucher> vouchers, {
    bool showUse = false,
    bool isAvailable = false,
    bool isExpired = false,
  }) {
    final l10n = AppLocalizations.of(context);
    if (vouchers.isEmpty) {
      return EmptyState(
        icon: isExpired ? Icons.event_busy : Icons.local_offer_outlined,
        title: isExpired
            ? l10n.vouchersEmptyExpired
            : isAvailable
            ? l10n.vouchersEmptyAvailable
            : l10n.vouchersEmptyMine,
        subtitle: isExpired
            ? l10n.vouchersEmptyExpiredSubtitle
            : l10n.vouchersEmptyAvailableSubtitle,
      );
    }
    return ListView.builder(
      padding: const EdgeInsets.all(16),
      itemCount: vouchers.length,
      itemBuilder: (context, index) {
        final voucher = vouchers[index];
        final l10nCard = AppLocalizations.of(context);
        return VoucherCard(
          voucher: voucher,
          onUse: showUse ? () => _copyCode(voucher.code) : null,
          percentOffLabel: voucher.percentOff != null
              ? l10nCard.vouchersPercentOff(voucher.percentOff!)
              : null,
          minOrderLabel: l10nCard.vouchersMinOrder(
            _formatVnd(voucher.minOrderAmount),
          ),
          expiresAtLabel: l10nCard.vouchersExpiresAt(
            DateFormat('dd/MM/yyyy').format(voucher.expiresAt),
          ),
          useNowLabel: l10nCard.vouchersUseNow,
        );
      },
    );
  }

  String _formatVnd(int vnd) {
    final fmt = NumberFormat.currency(
      locale: 'vi_VN',
      symbol: '₫',
      decimalDigits: 0,
    );
    return fmt.format(vnd);
  }
}
