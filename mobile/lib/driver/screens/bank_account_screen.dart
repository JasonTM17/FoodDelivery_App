import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../shared/theme/app_colors.dart';
import '../providers/bank_account_provider.dart';
import '../widgets/bank_account_selector.dart';
import '../../l10n/app_localizations.dart';

class BankAccountScreen extends ConsumerStatefulWidget {
  const BankAccountScreen({super.key});

  @override
  ConsumerState<BankAccountScreen> createState() => _BankAccountScreenState();
}

class _BankAccountScreenState extends ConsumerState<BankAccountScreen> {
  final _accountController = TextEditingController();
  final _holderNameController = TextEditingController();
  final _formKey = GlobalKey<FormState>();
  String? _selectedBankCode;
  bool _saving = false;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      ref.read(bankAccountsProvider.notifier).load();
    });
  }

  @override
  void dispose() {
    _accountController.dispose();
    _holderNameController.dispose();
    super.dispose();
  }

  Future<void> _addAccount() async {
    if (!_formKey.currentState!.validate() || _selectedBankCode == null) return;
    setState(() => _saving = true);

    final bank = vnBanks.firstWhere((b) => b.code == _selectedBankCode);
    final newAccount = BankAccount(
      id: 'ba${DateTime.now().millisecondsSinceEpoch}',
      bankCode: bank.code,
      bankName: bank.name,
      accountNumber: _accountController.text.trim(),
      accountHolderName: _holderNameController.text.trim(),
    );
    await ref.read(bankAccountsProvider.notifier).addAccount(newAccount);

    if (mounted) {
      setState(() {
        _saving = false;
        _accountController.clear();
        _holderNameController.clear();
        _selectedBankCode = null;
        _formKey.currentState?.reset();
      });
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(AppLocalizations.of(context).driver_bank_saved)),
      );
    }
  }

  void _showAddSheet() {
    final l10n = AppLocalizations.of(context);
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: const Color(0xFF1E1E1E),
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      builder: (ctx) {
        return Padding(
          padding: EdgeInsets.fromLTRB(
            20, 20, 20, MediaQuery.of(ctx).viewInsets.bottom + 20,
          ),
          child: Form(
            key: _formKey,
            child: Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Center(
                  child: Container(
                    width: 40, height: 4,
                    decoration: BoxDecoration(
                      color: const Color(0xFF374151),
                      borderRadius: BorderRadius.circular(2),
                    ),
                  ),
                ),
                const SizedBox(height: 16),
                const Text(
                  'Thêm tài khoản',
                  style: TextStyle(
                    fontSize: 18, fontWeight: FontWeight.w700, color: Colors.white,
                  ),
                ),
                const SizedBox(height: 20),
                DropdownButtonFormField<String>(
                  initialValue: _selectedBankCode,
                  hint: Text(
                    l10n.driver_bank_name_hint,
                    style: const TextStyle(color: Color(0xFF6B7280)),
                  ),
                  dropdownColor: const Color(0xFF1E1E1E),
                  style: const TextStyle(color: Colors.white),
                  decoration: InputDecoration(
                    labelText: l10n.driver_bank_name_label,
                    labelStyle: const TextStyle(color: Color(0xFF6B7280)),
                    filled: true,
                    fillColor: const Color(0xFF1F2937),
                    border: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(12),
                      borderSide: const BorderSide(color: Color(0xFF374151)),
                    ),
                    enabledBorder: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(12),
                      borderSide: const BorderSide(color: Color(0xFF374151)),
                    ),
                    focusedBorder: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(12),
                      borderSide: const BorderSide(color: AppColors.primary, width: 2),
                    ),
                  ),
                  items: vnBanks.map((b) => DropdownMenuItem(
                    value: b.code,
                    child: Text(b.name, style: const TextStyle(fontSize: 14)),
                  )).toList(),
                  onChanged: (v) => _selectedBankCode = v,
                  validator: (v) => v == null ? l10n.driver_bank_account_required : null,
                ),
                const SizedBox(height: 16),
                TextFormField(
                  controller: _holderNameController,
                  style: const TextStyle(color: Colors.white),
                  decoration: const InputDecoration(
                    labelText: 'Tên chủ tài khoản',
                    labelStyle: TextStyle(color: Color(0xFF6B7280)),
                    hintText: 'NGUYEN VAN A',
                    hintStyle: TextStyle(color: Color(0xFF374151)),
                  ),
                  validator: (v) =>
                      (v == null || v.trim().isEmpty) ? 'Vui lòng nhập tên chủ tài khoản' : null,
                ),
                const SizedBox(height: 16),
                TextFormField(
                  controller: _accountController,
                  style: const TextStyle(color: Colors.white),
                  keyboardType: TextInputType.number,
                  decoration: InputDecoration(
                    labelText: l10n.driver_bank_account_label,
                    labelStyle: const TextStyle(color: Color(0xFF6B7280)),
                    hintText: '001100223344',
                    hintStyle: const TextStyle(color: Color(0xFF374151)),
                  ),
                  validator: (v) =>
                      (v == null || v.trim().isEmpty) ? l10n.driver_bank_account_required : null,
                ),
                const SizedBox(height: 24),
                SizedBox(
                  width: double.infinity,
                  child: ElevatedButton(
                    onPressed: _saving ? null : _addAccount,
                    child: _saving
                        ? const SizedBox(
                            width: 20, height: 20,
                            child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white),
                          )
                        : const Text('Lưu tài khoản'),
                  ),
                ),
              ],
            ),
          ),
        );
      },
    );
  }

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context);
    final state = ref.watch(bankAccountsProvider);

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
      body: state.isLoading
          ? const Center(
              child: CircularProgressIndicator(color: AppColors.primary),
            )
          : SingleChildScrollView(
              padding: const EdgeInsets.all(20),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Container(
                    padding: const EdgeInsets.all(16),
                    decoration: BoxDecoration(
                      color: AppColors.primary.withValues(alpha: 0.1),
                      borderRadius: BorderRadius.circular(12),
                      border: Border.all(
                        color: AppColors.primary.withValues(alpha: 0.3),
                      ),
                    ),
                    child: Row(
                      children: [
                        const Icon(Icons.account_balance_wallet_outlined,
                            color: AppColors.primary),
                        const SizedBox(width: 12),
                        Expanded(
                          child: Text(
                            l10n.driver_bank_subtitle,
                            style: const TextStyle(
                              color: Color(0xFF9CA3AF), fontSize: 13,
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 24),
                  BankAccountSelector(
                    accounts: state.accounts,
                    onAddTap: _showAddSheet,
                    onAccountTap: (account) {
                      if (!account.isDefault) {
                        ref.read(bankAccountsProvider.notifier).setDefault(account.id);
                      }
                    },
                  ),
                ],
              ),
            ),
    );
  }
}
