import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:share_plus/share_plus.dart';
import '../../l10n/app_localizations.dart';
import '../../shared/theme/app_colors.dart';
import '../../shared/theme/app_text_styles.dart';
import '../../shared/widgets/error_state.dart';
import '../../shared/widgets/loading_shimmer.dart';
import '../providers/referral_provider.dart';

class ReferralScreen extends ConsumerStatefulWidget {
  const ReferralScreen({super.key});

  @override
  ConsumerState<ReferralScreen> createState() => _ReferralScreenState();
}

class _ReferralScreenState extends ConsumerState<ReferralScreen> {
  @override
  void initState() {
    super.initState();
    Future.microtask(() => ref.read(referralProvider.notifier).fetchReferral());
  }

  void _copyCode(BuildContext context, AppLocalizations l10n, String code) {
    Clipboard.setData(ClipboardData(text: code));
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(content: Text(l10n.referralCodeCopied), backgroundColor: AppColors.success),
    );
  }

  void _shareCode(String code) {
    Share.share('Dùng mã $code để nhận ưu đãi khi đặt đơn đầu tiên trên FoodFlow!');
  }

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context)!;
    final state = ref.watch(referralProvider);

    return Scaffold(
      backgroundColor: AppColors.surface,
      appBar: AppBar(title: Text(l10n.referralTitle)),
      body: state.isLoading
          ? const LoadingShimmer()
          : state.error != null
              ? ErrorState(message: state.error!, onRetry: () => ref.read(referralProvider.notifier).fetchReferral())
              : _buildBody(context, l10n, state),
    );
  }

  Widget _buildBody(BuildContext context, AppLocalizations l10n, ReferralState state) {
    final code = state.referralCode ?? '---';
    return SingleChildScrollView(
      padding: const EdgeInsets.all(16),
      child: Column(
        children: [
          // Hero banner
          Container(
            width: double.infinity,
            padding: const EdgeInsets.all(24),
            decoration: BoxDecoration(
              gradient: const LinearGradient(
                colors: [Color(0xFF6C63FF), Color(0xFF3B3ACF)],
                begin: Alignment.topLeft,
                end: Alignment.bottomRight,
              ),
              borderRadius: BorderRadius.circular(20),
            ),
            child: Column(
              children: [
                const Icon(Icons.card_giftcard, size: 48, color: Colors.white),
                const SizedBox(height: 12),
                Text(l10n.referralTitle, style: AppTextStyles.headline3.copyWith(color: Colors.white)),
                const SizedBox(height: 4),
                Text(l10n.referralSubtitle, style: AppTextStyles.bodySmall.copyWith(color: Colors.white70), textAlign: TextAlign.center),
              ],
            ),
          ),
          const SizedBox(height: 20),

          // Referral code card
          Container(
            padding: const EdgeInsets.all(20),
            decoration: BoxDecoration(
              color: AppColors.cardBackground,
              borderRadius: BorderRadius.circular(16),
              boxShadow: [BoxShadow(color: AppColors.shadow, blurRadius: 6, offset: const Offset(0, 2))],
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(l10n.referralCode, style: AppTextStyles.bodySmall),
                const SizedBox(height: 10),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 14),
                  decoration: BoxDecoration(
                    color: AppColors.surface,
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(color: AppColors.primary.withOpacity(0.3), width: 1.5),
                  ),
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Text(code,
                          style: AppTextStyles.headline3.copyWith(
                              color: AppColors.primary, letterSpacing: 4, fontWeight: FontWeight.w800)),
                    ],
                  ),
                ),
                const SizedBox(height: 16),
                Row(
                  children: [
                    Expanded(
                      child: OutlinedButton.icon(
                        onPressed: () => _copyCode(context, l10n, code),
                        icon: const Icon(Icons.copy, size: 18),
                        label: Text(l10n.referralCopyCode),
                      ),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: ElevatedButton.icon(
                        onPressed: () => _shareCode(code),
                        icon: const Icon(Icons.share, size: 18),
                        label: Text(l10n.referralShareCode),
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),
          const SizedBox(height: 16),

          // Stats row
          Row(
            children: [
              Expanded(child: _buildStatCard(
                '${state.inviteCount}',
                l10n.referralInviteCount(state.inviteCount),
                Icons.people_outline,
              )),
              const SizedBox(width: 12),
              Expanded(child: _buildStatCard(
                '${state.bonusPoints}pt',
                l10n.referralBonusEarned,
                Icons.stars_outlined,
              )),
            ],
          ),
          const SizedBox(height: 20),

          // How it works
          Container(
            padding: const EdgeInsets.all(20),
            decoration: BoxDecoration(
              color: AppColors.cardBackground,
              borderRadius: BorderRadius.circular(16),
              boxShadow: [BoxShadow(color: AppColors.shadow, blurRadius: 6, offset: const Offset(0, 2))],
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(l10n.referralHowItWorks, style: AppTextStyles.headline4),
                const SizedBox(height: 16),
                _buildStep('1', l10n.referralStep1),
                _buildStep('2', l10n.referralStep2),
                _buildStep('3', l10n.referralStep3),
              ],
            ),
          ),
          const SizedBox(height: 24),
        ],
      ),
    );
  }

  Widget _buildStatCard(String value, String label, IconData icon) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: AppColors.cardBackground,
        borderRadius: BorderRadius.circular(14),
        boxShadow: [BoxShadow(color: AppColors.shadow, blurRadius: 4, offset: const Offset(0, 1))],
      ),
      child: Column(
        children: [
          Icon(icon, color: AppColors.primary, size: 28),
          const SizedBox(height: 8),
          Text(value, style: AppTextStyles.headline3.copyWith(color: AppColors.primary)),
          const SizedBox(height: 4),
          Text(label, style: AppTextStyles.caption, textAlign: TextAlign.center),
        ],
      ),
    );
  }

  Widget _buildStep(String num, String text) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            width: 28,
            height: 28,
            decoration: const BoxDecoration(color: AppColors.primary, shape: BoxShape.circle),
            alignment: Alignment.center,
            child: Text(num, style: AppTextStyles.caption.copyWith(color: Colors.white, fontWeight: FontWeight.w700)),
          ),
          const SizedBox(width: 12),
          Expanded(child: Padding(
            padding: const EdgeInsets.only(top: 4),
            child: Text(text, style: AppTextStyles.bodyMedium),
          )),
        ],
      ),
    );
  }
}
