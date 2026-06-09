import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:intl/intl.dart';
import '../../shared/theme/app_colors.dart';
import '../../shared/theme/app_text_styles.dart';
import '../../shared/widgets/empty_state.dart';
import '../../shared/widgets/error_state.dart';
import '../../shared/widgets/loading_shimmer.dart';
import '../providers/membership_provider.dart';
import '../widgets/membership_tier_card.dart';

class FoodflowProScreen extends ConsumerStatefulWidget {
  const FoodflowProScreen({super.key});

  @override
  ConsumerState<FoodflowProScreen> createState() => _FoodflowProScreenState();
}

class _FoodflowProScreenState extends ConsumerState<FoodflowProScreen> {
  bool _isUpgrading = false;

  @override
  void initState() {
    super.initState();
    Future.microtask(() => ref.read(membershipProvider.notifier).fetchMembership());
  }

  Future<void> _handleUpgrade(MembershipTier tier) async {
    setState(() => _isUpgrading = true);
    final ok = await ref.read(membershipProvider.notifier).upgrade(tier);
    if (!mounted) return;
    setState(() => _isUpgrading = false);
    if (ok) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('Đã nâng cấp lên ${tier.labelVi()}!'),
          backgroundColor: AppColors.success,
        ),
      );
    } else {
      final error = ref.read(membershipProvider).error ?? 'Không thể nâng cấp';
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(error), backgroundColor: AppColors.error),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    final state = ref.watch(membershipProvider);

    return Scaffold(
      backgroundColor: AppColors.surface,
      appBar: AppBar(
        backgroundColor: AppColors.background,
        elevation: 0,
        leading: const BackButton(color: AppColors.textPrimary),
        title: const Text('FoodFlow Pro', style: AppTextStyles.headline3),
        centerTitle: true,
      ),
      body: _buildBody(state),
    );
  }

  Widget _buildBody(MembershipState state) {
    if (state.isLoading && state.currentTier == MembershipTier.free && !_isUpgrading) {
      return const LoadingShimmer(type: ShimmerType.foodItem, itemCount: 3);
    }
    if (state.error != null && state.currentTier == MembershipTier.free) {
      return ErrorState(
        message: state.error!,
        onRetry: () => ref.read(membershipProvider.notifier).fetchMembership(),
      );
    }

    return RefreshIndicator(
      onRefresh: () => ref.read(membershipProvider.notifier).fetchMembership(),
      child: SingleChildScrollView(
        physics: const AlwaysScrollableScrollPhysics(),
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Current membership status
            if (state.hasActiveSubscription) ...[
              Container(
                width: double.infinity,
                padding: const EdgeInsets.all(20),
                decoration: BoxDecoration(
                  gradient: const LinearGradient(
                    colors: [AppColors.primary, AppColors.primaryDark],
                    begin: Alignment.topLeft,
                    end: Alignment.bottomRight,
                  ),
                  borderRadius: BorderRadius.circular(16),
                ),
                child: Column(
                  children: [
                    const Icon(Icons.workspace_premium, color: Colors.white, size: 48),
                    const SizedBox(height: 12),
                    Text(
                      state.currentTier.labelVi(),
                      style: AppTextStyles.headline2.copyWith(color: Colors.white),
                    ),
                    const SizedBox(height: 4),
                    if (state.expiryDate != null)
                      Text(
                        'Có hiệu lực đến ${DateFormat('dd/MM/yyyy').format(state.expiryDate!)}',
                        style: AppTextStyles.bodySmall.copyWith(color: Colors.white70),
                      ),
                  ],
                ),
              ),
              const SizedBox(height: 24),
            ],
            Text(
              'Chọn gói phù hợp với bạn',
              style: AppTextStyles.headline4,
            ),
            const SizedBox(height: 4),
            Text(
              'Nâng cấp để nhận thêm đặc quyền',
              style: AppTextStyles.bodySmall,
            ),
            const SizedBox(height: 16),
            // Tier cards
            MembershipTierCard(
              tier: MembershipTier.pro,
              isCurrentTier: state.currentTier == MembershipTier.pro,
              onUpgrade: state.currentTier == MembershipTier.pro
                  ? null
                  : () => _handleUpgrade(MembershipTier.pro),
            ),
            const SizedBox(height: 12),
            MembershipTierCard(
              tier: MembershipTier.proPlus,
              isCurrentTier: state.currentTier == MembershipTier.proPlus,
              onUpgrade: state.currentTier == MembershipTier.proPlus
                  ? null
                  : () => _handleUpgrade(MembershipTier.proPlus),
            ),
            const SizedBox(height: 12),
            MembershipTierCard(
              tier: MembershipTier.free,
              isCurrentTier: state.currentTier == MembershipTier.free && !state.hasActiveSubscription,
              onUpgrade: null,
            ),
            if (_isUpgrading) ...[
              const SizedBox(height: 16),
              const Center(child: CircularProgressIndicator()),
            ],
            const SizedBox(height: 32),
          ],
        ),
      ),
    );
  }
}
