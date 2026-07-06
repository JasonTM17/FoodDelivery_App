import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../l10n/app_localizations.dart';
import '../../shared/theme/app_colors.dart';
import '../../shared/theme/app_text_styles.dart';
import '../../shared/widgets/error_state.dart';
import '../../shared/widgets/loading_shimmer.dart';
import '../providers/loyalty_provider.dart';
import '../widgets/loyalty_points_ledger.dart';

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
      case 'silver':
        return const Color(0xFF9E9E9E);
      case 'gold':
        return const Color(0xFFFFC107);
      case 'platinum':
        return const Color(0xFF90CAF9);
      default:
        return const Color(0xFFCD7F32);
    }
  }

  String _tierLabel(AppLocalizations l10n, String tier) {
    switch (tier) {
      case 'silver':
        return l10n.loyaltyTierSilver;
      case 'gold':
        return l10n.loyaltyTierGold;
      case 'platinum':
        return l10n.loyaltyTierPlatinum;
      default:
        return l10n.loyaltyTierBronze;
    }
  }

  double _tierProgress(String tier, int points) {
    switch (tier) {
      case 'bronze':
        return (points / 500).clamp(0.0, 1.0);
      case 'silver':
        return (points / 2000).clamp(0.0, 1.0);
      case 'gold':
        return (points / 5000).clamp(0.0, 1.0);
      default:
        return 1.0;
    }
  }

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context);
    final state = ref.watch(loyaltyProvider);

    return Scaffold(
      backgroundColor: AppColors.surface,
      appBar: AppBar(title: Text(l10n.loyaltyTitle)),
      body: state.isLoading
          ? const SingleChildScrollView(child: LoadingShimmer())
          : state.error != null
          ? ErrorState(
              message: state.error!,
              onRetry: () => ref.read(loyaltyProvider.notifier).fetchLoyalty(),
            )
          : _buildBody(context, l10n, state),
    );
  }

  Widget _buildBody(
    BuildContext context,
    AppLocalizations l10n,
    LoyaltyState state,
  ) {
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
                colors: [tierColor.withValues(alpha: 0.8), tierColor],
                begin: Alignment.topLeft,
                end: Alignment.bottomRight,
              ),
              borderRadius: BorderRadius.circular(20),
              boxShadow: [
                BoxShadow(
                  color: tierColor.withValues(alpha: 0.3),
                  blurRadius: 12,
                  offset: const Offset(0, 4),
                ),
              ],
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text(
                      l10n.loyaltyPointsBalance,
                      style: AppTextStyles.bodyMedium.copyWith(
                        color: Colors.white70,
                      ),
                    ),
                    Container(
                      padding: const EdgeInsets.symmetric(
                        horizontal: 12,
                        vertical: 4,
                      ),
                      decoration: BoxDecoration(
                        color: Colors.white24,
                        borderRadius: BorderRadius.circular(20),
                      ),
                      child: Text(
                        _tierLabel(l10n, state.tier),
                        style: AppTextStyles.caption.copyWith(
                          color: Colors.white,
                          fontWeight: FontWeight.w700,
                        ),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 8),
                Text(
                  l10n.loyaltyPoints(state.totalPoints),
                  style: AppTextStyles.headline1.copyWith(
                    color: Colors.white,
                    fontSize: 36,
                  ),
                ),
                const SizedBox(height: 16),
                ClipRRect(
                  borderRadius: BorderRadius.circular(4),
                  child: LinearProgressIndicator(
                    value: progress,
                    backgroundColor: Colors.white30,
                    valueColor: const AlwaysStoppedAnimation<Color>(
                      Colors.white,
                    ),
                    minHeight: 6,
                  ),
                ),
                const SizedBox(height: 8),
                if (state.tier != 'platinum')
                  Text(
                    l10n.loyaltyPointsToNextTier(state.pointsToNextTier),
                    style: AppTextStyles.caption.copyWith(
                      color: Colors.white70,
                    ),
                  ),
              ],
            ),
          ),
          const SizedBox(height: 20),

          // Transaction history
          Text(l10n.loyaltyHistory, style: AppTextStyles.headline4),
          const SizedBox(height: 12),
          LoyaltyPointsLedger(transactions: state.transactions),
        ],
      ),
    );
  }
}
