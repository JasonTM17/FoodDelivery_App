import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:intl/intl.dart';
import '../../l10n/app_localizations.dart';
import '../../shared/theme/app_colors.dart';
import '../../shared/theme/app_text_styles.dart';
import '../../shared/widgets/error_state.dart';
import '../../shared/widgets/loading_shimmer.dart';
import '../providers/wallet_provider.dart';

class WalletScreen extends ConsumerStatefulWidget {
  const WalletScreen({super.key});

  @override
  ConsumerState<WalletScreen> createState() => _WalletScreenState();
}

class _WalletScreenState extends ConsumerState<WalletScreen> {
  static const List<double> _topUpAmounts = [50000, 100000, 200000, 500000, 1000000];
  final _currencyFmt = NumberFormat.currency(locale: 'vi_VN', symbol: '₫', decimalDigits: 0);

  @override
  void initState() {
    super.initState();
    Future.microtask(() => ref.read(walletProvider.notifier).fetchWallet());
  }

  void _showTopUpSheet(BuildContext context, AppLocalizations l10n) {
    double? selected;
    showModalBottomSheet<void>(
      context: context,
      isScrollControlled: true,
      shape: const RoundedRectangleBorder(borderRadius: BorderRadius.vertical(top: Radius.circular(20))),
      builder: (ctx) => StatefulBuilder(
        builder: (ctx, setSheetState) => Padding(
          padding: const EdgeInsets.all(24),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(l10n.walletTopUpTitle, style: AppTextStyles.headline3),
              const SizedBox(height: 8),
              Text(l10n.walletSelectAmount, style: AppTextStyles.bodySmall),
              const SizedBox(height: 16),
              Wrap(
                spacing: 10,
                runSpacing: 10,
                children: _topUpAmounts.map((amt) {
                  final isSelected = selected == amt;
                  return GestureDetector(
                    onTap: () => setSheetState(() => selected = amt),
                    child: Container(
                      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
                      decoration: BoxDecoration(
                        color: isSelected ? AppColors.primary : AppColors.surface,
                        borderRadius: BorderRadius.circular(10),
                        border: Border.all(color: isSelected ? AppColors.primary : AppColors.border),
                      ),
                      child: Text(
                        _currencyFmt.format(amt),
                        style: AppTextStyles.bodyMedium.copyWith(
                          color: isSelected ? Colors.white : AppColors.textPrimary,
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                    ),
                  );
                }).toList(),
              ),
              const SizedBox(height: 24),
              SizedBox(
                width: double.infinity,
                child: Consumer(
                  builder: (context, ref, _) {
                    final walletState = ref.watch(walletProvider);
                    return ElevatedButton(
                      onPressed: selected == null || walletState.isTopUpLoading
                          ? null
                          : () async {
                              final ok = await ref.read(walletProvider.notifier).topUp(selected!);
                              if (context.mounted) {
                                Navigator.of(ctx).pop();
                                ScaffoldMessenger.of(context).showSnackBar(SnackBar(
                                  content: Text(ok ? '${_currencyFmt.format(selected)} đã được nạp thành công' : (ref.read(walletProvider).error ?? 'Lỗi')),
                                  backgroundColor: ok ? AppColors.success : AppColors.error,
                                ));
                              }
                            },
                      style: ElevatedButton.styleFrom(padding: const EdgeInsets.symmetric(vertical: 14)),
                      child: walletState.isTopUpLoading
                          ? const SizedBox(width: 20, height: 20, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
                          : Text(l10n.walletConfirmTopUp),
                    );
                  },
                ),
              ),
              const SizedBox(height: 8),
            ],
          ),
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context)!;
    final state = ref.watch(walletProvider);

    return Scaffold(
      backgroundColor: AppColors.surface,
      appBar: AppBar(title: Text(l10n.walletTitle)),
      body: state.isLoading
          ? const LoadingShimmer()
          : state.error != null
              ? ErrorState(message: state.error!, onRetry: () => ref.read(walletProvider.notifier).fetchWallet())
              : _buildBody(context, l10n, state),
    );
  }

  Widget _buildBody(BuildContext context, AppLocalizations l10n, WalletState state) {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Balance card
          Container(
            width: double.infinity,
            padding: const EdgeInsets.all(24),
            decoration: BoxDecoration(
              gradient: const LinearGradient(
                colors: [AppColors.primary, AppColors.primaryDark],
                begin: Alignment.topLeft,
                end: Alignment.bottomRight,
              ),
              borderRadius: BorderRadius.circular(20),
              boxShadow: [BoxShadow(color: AppColors.primary.withOpacity(0.3), blurRadius: 12, offset: const Offset(0, 4))],
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(l10n.walletBalance, style: AppTextStyles.bodyMedium.copyWith(color: Colors.white70)),
                const SizedBox(height: 8),
                Text(_currencyFmt.format(state.balance),
                    style: AppTextStyles.headline2.copyWith(color: Colors.white)),
                const SizedBox(height: 20),
                Row(
                  children: [
                    Expanded(
                      child: OutlinedButton.icon(
                        onPressed: () => _showTopUpSheet(context, l10n),
                        icon: const Icon(Icons.add, color: Colors.white, size: 18),
                        label: Text(l10n.walletTopUp, style: const TextStyle(color: Colors.white)),
                        style: OutlinedButton.styleFrom(side: const BorderSide(color: Colors.white54)),
                      ),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: OutlinedButton.icon(
                        onPressed: () => ScaffoldMessenger.of(context).showSnackBar(
                          SnackBar(content: Text(AppLocalizations.of(context)!.featureInDevelopment)),
                        ),
                        icon: const Icon(Icons.arrow_upward, color: Colors.white, size: 18),
                        label: Text(l10n.walletWithdraw, style: const TextStyle(color: Colors.white)),
                        style: OutlinedButton.styleFrom(side: const BorderSide(color: Colors.white54)),
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),
          const SizedBox(height: 24),

          // Transaction history
          Text(l10n.walletTransactionHistory, style: AppTextStyles.headline4),
          const SizedBox(height: 12),
          state.transactions.isEmpty
              ? _buildEmpty(l10n)
              : Column(children: state.transactions.map(_buildTxTile).toList()),
        ],
      ),
    );
  }

  Widget _buildEmpty(AppLocalizations l10n) {
    return Container(
      padding: const EdgeInsets.all(32),
      alignment: Alignment.center,
      child: Column(
        children: [
          const Icon(Icons.account_balance_wallet_outlined, size: 48, color: AppColors.textHint),
          const SizedBox(height: 12),
          Text(l10n.walletTransactionEmpty, style: AppTextStyles.bodyMedium.copyWith(color: AppColors.textSecondary)),
        ],
      ),
    );
  }

  Widget _buildTxTile(WalletTransaction tx) {
    final dateFmt = DateFormat('dd/MM/yyyy HH:mm');
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
              tx.isCredit ? Icons.arrow_downward : Icons.arrow_upward,
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
                Text(dateFmt.format(tx.createdAt.toLocal()), style: AppTextStyles.caption),
              ],
            ),
          ),
          Text(
            '${tx.isCredit ? '+' : '-'}${_currencyFmt.format(tx.amount)}',
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
