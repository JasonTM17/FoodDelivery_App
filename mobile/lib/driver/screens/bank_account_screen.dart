import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../l10n/app_localizations.dart';
import '../../shared/theme/app_colors.dart';
import '../providers/bank_account_provider.dart';
import '../widgets/bank_account_form_sheet.dart';
import '../widgets/bank_account_selector.dart';
import '../widgets/bank_account_status_widgets.dart';

class BankAccountScreen extends ConsumerStatefulWidget {
  const BankAccountScreen({super.key});

  @override
  ConsumerState<BankAccountScreen> createState() => _BankAccountScreenState();
}

class _BankAccountScreenState extends ConsumerState<BankAccountScreen> {
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      ref.read(bankAccountsProvider.notifier).load();
    });
  }

  Future<void> _showAddSheet() async {
    final account = await showBankAccountFormSheet(context);
    if (account == null || !mounted) return;

    try {
      await ref.read(bankAccountsProvider.notifier).addAccount(account);
      if (!mounted) return;
      _showSnack(AppLocalizations.of(context).driver_bank_saved);
    } catch (_) {
      if (!mounted) return;
      _showSnack(AppLocalizations.of(context).driver_bank_save_failed);
    }
  }

  Future<void> _setDefault(BankAccount account) async {
    if (account.isDefault) return;
    try {
      await ref.read(bankAccountsProvider.notifier).setDefault(account.id);
    } catch (_) {
      if (!mounted) return;
      _showSnack(AppLocalizations.of(context).driver_bank_save_failed);
    }
  }

  Future<void> _confirmDelete(BankAccount account) async {
    final l10n = AppLocalizations.of(context);
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (dialogContext) => AlertDialog(
        backgroundColor: const Color(0xFF1E1E1E),
        title: Text(l10n.driver_bank_delete_title, style: const TextStyle(color: Colors.white)),
        content: Text(
          l10n.driver_bank_delete_message,
          style: const TextStyle(color: Color(0xFF9CA3AF)),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(dialogContext).pop(false),
            child: Text(l10n.driver_bank_cancel),
          ),
          FilledButton.tonal(
            onPressed: () => Navigator.of(dialogContext).pop(true),
            child: Text(l10n.driver_bank_delete_confirm),
          ),
        ],
      ),
    );
    if (confirmed != true) return;

    try {
      await ref.read(bankAccountsProvider.notifier).deleteAccount(account.id);
    } catch (_) {
      if (!mounted) return;
      _showSnack(l10n.driver_bank_save_failed);
    }
  }

  void _showSnack(String message) {
    ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(message)));
  }

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context);
    final state = ref.watch(bankAccountsProvider);
    final isInitialLoading = state.isLoading && state.accounts.isEmpty;

    return Scaffold(
      backgroundColor: const Color(0xFF121212),
      appBar: AppBar(
        backgroundColor: const Color(0xFF1A1A1A),
        elevation: 0,
        title: Text(
          l10n.driver_bank_title,
          style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w700),
        ),
      ),
      body: isInitialLoading
          ? const Center(child: CircularProgressIndicator(color: AppColors.primary))
          : RefreshIndicator(
              onRefresh: () => ref.read(bankAccountsProvider.notifier).load(),
              child: SingleChildScrollView(
                physics: const AlwaysScrollableScrollPhysics(),
                padding: const EdgeInsets.all(20),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    BankAccountInfoCard(subtitle: l10n.driver_bank_subtitle),
                    if (state.error != null) ...[
                      const SizedBox(height: 16),
                      RetryableBankError(
                        message: state.error!,
                        retryLabel: l10n.driver_bank_retry,
                        onRetry: () => ref.read(bankAccountsProvider.notifier).load(),
                      ),
                    ],
                    const SizedBox(height: 24),
                    BankAccountSelector(
                      accounts: state.accounts,
                      onAddTap: _showAddSheet,
                      onAccountTap: _setDefault,
                      onDeleteTap: _confirmDelete,
                    ),
                    if (state.isLoading && state.accounts.isNotEmpty) ...[
                      const SizedBox(height: 16),
                      const LinearProgressIndicator(color: AppColors.primary),
                    ],
                  ],
                ),
              ),
            ),
    );
  }
}
