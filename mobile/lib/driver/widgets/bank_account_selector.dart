import 'package:flutter/material.dart';

import '../../l10n/app_localizations.dart';
import '../../shared/theme/app_colors.dart';
import '../../shared/theme/app_text_styles.dart';
import '../providers/bank_account_provider.dart';

class BankAccountSelector extends StatelessWidget {
  final List<BankAccount> accounts;
  final VnBank? selectedBank;
  final ValueChanged<BankAccount>? onAccountTap;
  final ValueChanged<BankAccount>? onDeleteTap;
  final VoidCallback? onAddTap;

  const BankAccountSelector({
    super.key,
    required this.accounts,
    this.selectedBank,
    this.onAccountTap,
    this.onDeleteTap,
    this.onAddTap,
  });

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context);
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        if (accounts.isNotEmpty) ...[
          Text(
            l10n.driver_bank_linked_title,
            style: const TextStyle(
              fontSize: 14,
              fontWeight: FontWeight.w600,
              color: Colors.white,
            ),
          ),
          const SizedBox(height: 10),
          ...accounts.map(
            (account) => _buildAccountCard(context, account, l10n),
          ),
          const SizedBox(height: 16),
        ],
        _buildAddButton(context, l10n),
      ],
    );
  }

  Widget _buildAccountCard(
    BuildContext context,
    BankAccount account,
    AppLocalizations l10n,
  ) {
    final bank = vnBanks.firstWhere(
      (b) => b.code == account.bankCode,
      orElse: () => vnBanks.first,
    );
    return InkWell(
      onTap: onAccountTap == null ? null : () => onAccountTap!(account),
      borderRadius: BorderRadius.circular(14),
      child: Container(
        margin: const EdgeInsets.only(bottom: 8),
        padding: const EdgeInsets.all(14),
        decoration: BoxDecoration(
          color: const Color(0xFF1E1E1E),
          borderRadius: BorderRadius.circular(14),
          border: Border.all(
            color: account.isDefault
                ? AppColors.primary.withValues(alpha: 0.3)
                : const Color(0xFF374151),
          ),
        ),
        child: Row(
          children: [
            Container(
              width: 44,
              height: 44,
              decoration: BoxDecoration(
                color: AppColors.primary.withValues(alpha: 0.1),
                borderRadius: BorderRadius.circular(12),
              ),
              child: Center(
                child: Text(
                  bank.shortName.substring(0, 3).toUpperCase(),
                  style: const TextStyle(
                    fontSize: 12,
                    fontWeight: FontWeight.w700,
                    color: AppColors.primary,
                  ),
                ),
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    bank.name,
                    style: const TextStyle(
                      fontSize: 14,
                      fontWeight: FontWeight.w600,
                      color: Colors.white,
                    ),
                  ),
                  const SizedBox(height: 2),
                  Text(
                    account.accountNumber,
                    style: const TextStyle(
                      fontSize: 13,
                      color: Color(0xFF6B7280),
                    ),
                  ),
                ],
              ),
            ),
            if (account.isDefault)
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                decoration: BoxDecoration(
                  color: AppColors.primary.withValues(alpha: 0.1),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Text(
                  l10n.driver_bank_default_badge,
                  style: const TextStyle(
                    fontSize: 11,
                    color: AppColors.primary,
                    fontWeight: FontWeight.w600,
                  ),
                ),
              ),
            const SizedBox(width: 8),
            IconButton(
              icon: const Icon(Icons.delete_outline, size: 20),
              color: const Color(0xFF6B7280),
              tooltip: l10n.driver_bank_delete_tooltip,
              onPressed: onDeleteTap == null
                  ? null
                  : () => onDeleteTap!(account),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildAddButton(BuildContext context, AppLocalizations l10n) {
    return InkWell(
      onTap: onAddTap,
      borderRadius: BorderRadius.circular(14),
      child: Container(
        width: double.infinity,
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          border: Border.all(
            color: AppColors.primary.withValues(alpha: 0.3),
            style: BorderStyle.solid,
          ),
          borderRadius: BorderRadius.circular(14),
        ),
        child: Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const Icon(
              Icons.add_circle_outline,
              color: AppColors.primary,
              size: 20,
            ),
            const SizedBox(width: 8),
            Text(
              l10n.driver_bank_add_button,
              style: AppTextStyles.buttonMedium.copyWith(
                color: AppColors.primary,
              ),
            ),
          ],
        ),
      ),
    );
  }
}
