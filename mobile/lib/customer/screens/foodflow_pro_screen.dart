import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:intl/intl.dart';
import '../../l10n/app_localizations.dart';
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
    final l10n = AppLocalizations.of(context)!;
    setState(() => _isUpgrading = true);
    final ok = await ref.read(membershipProvider.notifier).upgrade(tier);
    if (!mounted) return;
    setState(() => _isUpgrading = false);
    if (ok) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(l10n.membershipUpgradedMessage(tier.labelVi())),
          backgroundColor: AppColors.success,
        ),
      );
    } else {
      final error = ref.read(membershipProvider).error ?? l10n.membershipUpgradeFailed;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(error), backgroundColor: AppColors.error),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context)!;
    final state = ref.watch(membershipProvider);

    return Scaffold(
      backgroundColor: AppColors.surface,
      appBar: AppBar(
        backgroundColor: AppColors.background,
        elevation: 0,
        leading: const BackButton(color: AppColors.textPrimary),
        title: Text(l10n.membershipTitle, style: AppTextStyles.headline3),
        centerTitle: true,
      ),
      body: _buildBody(state),
    );
  }

  Widget _buildBody(MembershipState state) {
    final l10n = AppLocalizations.of(context)!;
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
                        l10n.membershipValidUntil(DateFormat('dd/MM/yyyy').format(state.expiryDate!)),
                        style: AppTextStyles.bodySmall.copyWith(color: Colors.white70),
                      ),
                  ],
                ),
              ),
              const SizedBox(height: 24),
            ],
            Text(l10n.membershipChoosePlan, style: AppTextStyles.headline4),
            const SizedBox(height: 4),
            Text(l10n.membershipUpgradeBenefit, style: AppTextStyles.bodySmall),
            const SizedBox(height: 16),
            // Tier cards
            _buildTierCard(MembershipTier.pro, state),
            const SizedBox(height: 12),
            _buildTierCard(MembershipTier.proPlus, state),
            const SizedBox(height: 12),
            _buildTierCard(MembershipTier.free, state),
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

  Widget _buildTierCard(MembershipTier tier, MembershipState state) {
    final l10n = AppLocalizations.of(context)!;
    final isCurrent = tier == MembershipTier.free
        ? state.currentTier == MembershipTier.free && !state.hasActiveSubscription
        : state.currentTier == tier;
    return MembershipTierCard(
      tier: tier,
      isCurrentTier: isCurrent,
      onUpgrade: isCurrent ? null : () => _handleUpgrade(tier),
      tierLabel: tier.labelVi(),
      currentBadgeLabel: l10n.membershipCurrentBadge,
      freeLabel: l10n.membershipFreeLabel,
      pricePerMonthSuffix: l10n.membershipPerMonth,
      upgradeCtaLabel: l10n.membershipUpgradeCta,
      benefits: _benefitLabels(tier, l10n),
    );
  }

  List<String> _benefitLabels(MembershipTier tier, AppLocalizations l10n) {
    switch (tier) {
      case MembershipTier.free:
        return [l10n.membershipBenefitBasicDelivery, l10n.membershipBenefitBasicPoints];
      case MembershipTier.pro:
        return [
          l10n.membershipBenefitFreeDelivery,
          l10n.membershipBenefitPriorityDriver,
          l10n.membershipBenefitBonusPoints3,
          l10n.membershipBenefitVoucher100k,
        ];
      case MembershipTier.proPlus:
        return [
          l10n.membershipBenefitFreeDelivery,
          l10n.membershipBenefitVipDriver,
          l10n.membershipBenefitBonusPoints5,
          l10n.membershipBenefitVoucher200k,
          l10n.membershipBenefitVipSupport,
        ];
    }
  }
}
