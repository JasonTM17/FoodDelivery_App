import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

import '../../l10n/app_localizations.dart';
import '../../shared/theme/app_colors.dart';
import '../providers/bank_account_provider.dart';

Future<BankAccount?> showBankAccountFormSheet(BuildContext context) {
  return showModalBottomSheet<BankAccount>(
    context: context,
    isScrollControlled: true,
    backgroundColor: const Color(0xFF1E1E1E),
    shape: const RoundedRectangleBorder(
      borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
    ),
    builder: (_) => const BankAccountFormSheet(),
  );
}

class BankAccountFormSheet extends StatefulWidget {
  const BankAccountFormSheet({super.key});

  @override
  State<BankAccountFormSheet> createState() => _BankAccountFormSheetState();
}

class _BankAccountFormSheetState extends State<BankAccountFormSheet> {
  final _accountController = TextEditingController();
  final _holderNameController = TextEditingController();
  final _formKey = GlobalKey<FormState>();
  String? _selectedBankCode;

  @override
  void dispose() {
    _accountController.dispose();
    _holderNameController.dispose();
    super.dispose();
  }

  void _submit() {
    if (!_formKey.currentState!.validate() || _selectedBankCode == null) return;
    final bank = vnBanks.firstWhere((item) => item.code == _selectedBankCode);
    Navigator.of(context).pop(
      BankAccount(
        id: '',
        bankCode: bank.code,
        bankName: bank.name,
        accountNumber: _accountController.text.trim(),
        accountHolderName: _holderNameController.text.trim(),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context);
    return Padding(
      padding: EdgeInsets.fromLTRB(
        20,
        20,
        20,
        MediaQuery.of(context).viewInsets.bottom + 20,
      ),
      child: Form(
        key: _formKey,
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Center(
              child: Container(
                width: 40,
                height: 4,
                decoration: BoxDecoration(
                  color: const Color(0xFF374151),
                  borderRadius: BorderRadius.circular(2),
                ),
              ),
            ),
            const SizedBox(height: 16),
            Text(
              l10n.driver_bank_add_title,
              style: const TextStyle(
                fontSize: 18,
                fontWeight: FontWeight.w700,
                color: Colors.white,
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
              decoration: _fieldDecoration(l10n.driver_bank_name_label),
              items: vnBanks
                  .map(
                    (bank) => DropdownMenuItem(
                      value: bank.code,
                      child: Text(bank.name, style: const TextStyle(fontSize: 14)),
                    ),
                  )
                  .toList(),
              onChanged: (value) => setState(() => _selectedBankCode = value),
              validator: (value) => value == null ? l10n.driver_bank_name_required : null,
            ),
            const SizedBox(height: 16),
            TextFormField(
              controller: _holderNameController,
              style: const TextStyle(color: Colors.white),
              textCapitalization: TextCapitalization.characters,
              decoration: _fieldDecoration(
                l10n.driver_bank_holder_label,
                hintText: l10n.driver_bank_holder_hint,
              ),
              validator: (value) =>
                  (value == null || value.trim().isEmpty) ? l10n.driver_bank_holder_required : null,
            ),
            const SizedBox(height: 16),
            TextFormField(
              controller: _accountController,
              style: const TextStyle(color: Colors.white),
              keyboardType: TextInputType.number,
              inputFormatters: [FilteringTextInputFormatter.digitsOnly],
              decoration: _fieldDecoration(
                l10n.driver_bank_account_label,
                hintText: l10n.driver_bank_account_hint,
              ),
              validator: (value) =>
                  (value == null || value.trim().isEmpty) ? l10n.driver_bank_account_required : null,
            ),
            const SizedBox(height: 24),
            SizedBox(
              width: double.infinity,
              child: ElevatedButton(
                onPressed: _submit,
                child: Text(l10n.driver_bank_save),
              ),
            ),
          ],
        ),
      ),
    );
  }

  InputDecoration _fieldDecoration(String label, {String? hintText}) {
    return InputDecoration(
      labelText: label,
      labelStyle: const TextStyle(color: Color(0xFF6B7280)),
      hintText: hintText,
      hintStyle: const TextStyle(color: Color(0xFF374151)),
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
    );
  }
}
