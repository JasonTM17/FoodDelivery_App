import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:intl/intl.dart';
import '../../l10n/app_localizations.dart';
import '../../shared/theme/app_colors.dart';
import '../../shared/theme/app_text_styles.dart';
import '../../shared/widgets/error_state.dart';
import '../../shared/widgets/loading_shimmer.dart';
import '../providers/loyalty_provider.dart';

class LoyaltyScreen extends ConsumerStatefulWidget {
  const LoyaltyScreen({super.key});

  @override
  ConsumerState<LoyaltyScreen> createState() => _LoyaltyScreenState();
}

class _LoyaltyScreenState extends ConsumerState<LoyaltyScreen> {
  @override
  void initState() {
    super.initState();
    Future.microtask(() => ref.read(loyaltyProvider.notifier).fetchLoyalty());
  }

  Color _tierColor(String tier) {
    switch (tier) {
      case 'silver': return const Color(0xFF9E9E9E);
      case 'gold': return const Color(0xFFFFC107);
      case 'platinum': return const Color(0xFF90CAF9);
      default: return const Color(0xFFCD7F32);
    }
  }

  String _tierLabel(AppLocalizations l10n, String tier) {
    switch (tier) {
      case 'silver': return l10n.loyaltyTierSilver;
      case 'gold': return l10n.loyaltyTierGold;
      case 'platinum': return l10n.loyaltyTierPlatinum;
      default: return l10n.loyaltyTierBronze;
    }
  }

  double _tierProgress(String tier, int points) {
    switch (tier) {
      case 'bronze': return (points / 500).clamp(0.0, 1.0);
      case 'silver': return (points / 2000).clamp(0.0, 1.0);
      case 'gold': return (points / 5000).clamp(0.0, 1.0);
      default: return 1.0;
    }
  }

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context)!;
    final state = ref.watch(loyaltyProvider);

    return Scaffold(
      backgroundColor: AppColors.surface,
      appBar: AppBar(title: Text(l10n.loyaltyTitle)),
      body: state.isLoading
          ? const LoadingShimmer()
          : state.error != null
              ? ErrorState(
                  message: state.error!,
                  onRetry: () => ref.read(loyaltyProvider.notifier).fetchLoyalty(),
                )
              : _buildBody(context, l10n, state),
    );
  }

  Widget _buildBody(BuildContext context, AppLocalizations l10n, LoyaltyState state) {
    final tierColor = _tierColor(state.tier);
    final progress = _tierProgress(state.tier, state.totalPoints);

    return SingleChildScrollView(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Points card
          Container(
            width: double.infinity,
            padding: const EdgeInsets.all(24),
            decoration: BoxDecoration(
              gradient: LinearGradient(
                colors: [tierColor.withOpacity(0.8), tierColor],
                begin: Alignment.topLeft,
                end: Alignment.bottomRight,
              ),
              borderRadius: BorderRadius.circular(20),
              boxShadow: [BoxShadow(color: tierColor.withOpacity(0.3), blurRadius: 12, offset: const Offset(0, 4))],
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text(l10n.loyaltyPointsBalance, style: AppTextStyles.bodyMedium.copyWith(color: Colors.white70)),
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
                      decoration: BoxDecoration(color: Colors.white24, borderRadius: BorderRadius.circular(20)),
                      child: Text(_tierLabel(l10n, state.tier), style: AppTextStyles.caption.copyWith(color: Colors.white, fontWeight: FontWeight.w700)),
                    ),
                  ],
                ),
                const SizedBox(height: 8),
                Text(l10n.loyaltyPoints(state.totalPoints),
                    style: AppTextStyles.headline1.copyWith(color: Colors.white, fontSize: 36)),
                const SizedBox(height: 16),
                ClipRRect(
                  borderRadius: BorderRadius.circular(4),
                  child: LinearProgressIndicator(
                    value: progress,
                    backgroundColor: Colors.white30,
                    valueColor: const AlwaysStoppedAnimation<Color>(Colors.white),
                    minHeight: 6,
                  ),
                ),
                const SizedBox(height: 8),
                if (state.tier != 'platinum')
                  Text(l10n.loyaltyPointsToNextTier(state.pointsToNextTier),
                      style: AppTextStyles.caption.copyWith(color: Colors.white70)),
              ],
            ),
          ),
          const SizedBox(height: 20),

          // Earn points section
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: AppColors.cardBackground,
              borderRadius: BorderRadius.circular(16),
              boxShadow: [BoxShadow(color: AppColors.shadow, blurRadius: 6, offset: const Offset(0, 2))],
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(l10n.loyaltyEarnPoints, style: AppTextStyles.headline4),
                const SizedBox(height: 12),
                _buildEarnRow(Icons.receipt_long_outlined, l10n.loyaltyEarnOrderDesc),
                const SizedBox(height: 8),
                _buildEarnRow(Icons.people_outline, l10n.loyaltyEarnReferralDesc),
              ],
            ),
          ),
          const SizedBox(height: 20),

          // Transaction history
          Text(l10n.loyaltyHistory, style: AppTextStyles.headline4),
          const SizedBox(height: 12),
          state.transactions.isEmpty
              ? _buildEmptyHistory(l10n)
              : Column(
                  children: state.transactions
                      .map((tx) => _buildTransactionTile(tx))
                      .toList(),
                ),
        ],
      ),
    );
  }

  Widget _buildEarnRow(IconData icon, String text) {
    return Row(
      children: [
        Icon(icon, color: AppColors.primary, size: 20),
        const SizedBox(width: 12),
        Expanded(child: Text(text, style: AppTextStyles.bodyMedium)),
      ],
    );
  }

  Widget _buildEmptyHistory(AppLocalizations l10n) {
    return Container(
      padding: const EdgeInsets.all(32),
      alignment: Alignment.center,
      child: Column(
        children: [
          const Icon(Icons.stars_outlined, size: 48, color: AppColors.textHint),
          const SizedBox(height: 12),
          Text(l10n.loyaltyHistoryEmpty, style: AppTextStyles.bodyMedium.copyWith(color: AppColors.textSecondary)),
        ],
      ),
    );
  }

  Widget _buildTransactionTile(LoyaltyTransaction tx) {
    final fmt = DateFormat('dd/MM/yyyy HH:mm');
    return Container(
      margin: const EdgeInsets.only(bottom: 8),
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: AppColors.cardBackground,
        borderRadius: BorderRadius.circular(12),
        boxShadow: [BoxShadow(color: AppColors.shadow, blurRadius: 4, offset: const Offset(0, 1))],
      ),
      child: Row(
        children: [
          Container(
            width: 40,
            height: 40,
            decoration: BoxDecoration(
              color: tx.isCredit ? AppColors.success.withOpacity(0.1) : AppColors.error.withOpacity(0.1),
              shape: BoxShape.circle,
            ),
            child: Icon(
              tx.isCredit ? Icons.add_circle_outline : Icons.remove_circle_outline,
              color: tx.isCredit ? AppColors.success : AppColors.error,
              size: 20,
            ),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(tx.description, style: AppTextStyles.bodyMedium.copyWith(fontWeight: FontWeight.w500)),
                Text(fmt.format(tx.createdAt.toLocal()), style: AppTextStyles.caption),
              ],
            ),
          ),
          Text(
            '${tx.isCredit ? '+' : '-'}${tx.points}pt',
            style: AppTextStyles.bodyMedium.copyWith(
              color: tx.isCredit ? AppColors.success : AppColors.error,
              fontWeight: FontWeight.w700,
            ),
          ),
        ],
      ),
    );
  }
}
