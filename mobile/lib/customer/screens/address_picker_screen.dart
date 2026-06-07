import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../l10n/app_localizations.dart';
import '../../shared/models/user.dart';
import '../../shared/providers/auth_provider.dart';
import '../../shared/theme/app_colors.dart';
import '../../shared/theme/app_text_styles.dart';
import '../../shared/widgets/loading_shimmer.dart';
import '../providers/address_provider.dart';

class AddressPickerScreen extends ConsumerStatefulWidget {
  const AddressPickerScreen({super.key});

  @override
  ConsumerState<AddressPickerScreen> createState() => _AddressPickerScreenState();
}

class _AddressPickerScreenState extends ConsumerState<AddressPickerScreen> {
  final _searchCtrl = TextEditingController();
  String _query = '';
  AddressModel? _selected;

  @override
  void initState() {
    super.initState();
    Future.microtask(() => ref.read(addressProvider.notifier).fetchAddresses());
  }

  @override
  void dispose() {
    _searchCtrl.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context)!;
    final addrState = ref.watch(addressProvider);
    final authState = ref.watch(authProvider);

    final filtered = addrState.addresses.where((a) =>
      _query.isEmpty ||
      a.address.toLowerCase().contains(_query.toLowerCase()) ||
      (a.label?.toLowerCase().contains(_query.toLowerCase()) ?? false)
    ).toList();

    return Scaffold(
      backgroundColor: AppColors.surface,
      appBar: AppBar(title: Text(l10n.addressPickerTitle)),
      body: Column(
        children: [
          // Search bar
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 12, 16, 8),
            child: TextField(
              controller: _searchCtrl,
              onChanged: (v) => setState(() => _query = v),
              decoration: InputDecoration(
                hintText: l10n.addressPickerSearchHint,
                prefixIcon: const Icon(Icons.search, size: 20),
                suffixIcon: _query.isNotEmpty
                    ? IconButton(
                        icon: const Icon(Icons.clear, size: 18),
                        onPressed: () { _searchCtrl.clear(); setState(() => _query = ''); },
                      )
                    : null,
                filled: true,
                fillColor: AppColors.cardBackground,
                border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(12),
                  borderSide: BorderSide.none,
                ),
                contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
              ),
            ),
          ),

          // Use current location
          if (authState.user != null)
            _buildOptionTile(
              icon: Icons.my_location,
              iconColor: AppColors.info,
              title: l10n.addressPickerUseCurrentLocation,
              subtitle: null,
              isSelected: false,
              onTap: () => Navigator.of(context).pop('current_location'),
            ),

          const Divider(height: 1, indent: 16, endIndent: 16),

          Padding(
            padding: const EdgeInsets.fromLTRB(16, 12, 16, 6),
            child: Align(
              alignment: Alignment.centerLeft,
              child: Text(l10n.addressPickerSaved, style: AppTextStyles.bodySmall),
            ),
          ),

          Expanded(
            child: addrState.isLoading
                ? const LoadingShimmer()
                : filtered.isEmpty
                    ? Center(
                        child: Text(
                          l10n.addressPickerNoSaved,
                          style: AppTextStyles.bodyMedium.copyWith(color: AppColors.textSecondary),
                        ),
                      )
                    : ListView.separated(
                        itemCount: filtered.length,
                        separatorBuilder: (_, __) => const Divider(height: 1, indent: 56),
                        itemBuilder: (ctx, i) {
                          final addr = filtered[i];
                          final isSelected = _selected?.id == addr.id;
                          return _buildOptionTile(
                            icon: addr.isDefault ? Icons.home : Icons.location_on_outlined,
                            iconColor: addr.isDefault ? AppColors.primary : AppColors.textSecondary,
                            title: addr.label ?? addr.address,
                            subtitle: addr.label != null ? addr.address : null,
                            isSelected: isSelected,
                            onTap: () => setState(() => _selected = addr),
                          );
                        },
                      ),
          ),

          // Confirm button
          if (_selected != null)
            SafeArea(
              child: Padding(
                padding: const EdgeInsets.fromLTRB(16, 8, 16, 12),
                child: SizedBox(
                  width: double.infinity,
                  child: ElevatedButton(
                    onPressed: () => Navigator.of(context).pop(_selected),
                    style: ElevatedButton.styleFrom(padding: const EdgeInsets.symmetric(vertical: 14)),
                    child: Text(l10n.addressPickerConfirm, style: AppTextStyles.buttonLarge),
                  ),
                ),
              ),
            ),
        ],
      ),
    );
  }

  Widget _buildOptionTile({
    required IconData icon,
    required Color iconColor,
    required String title,
    required String? subtitle,
    required bool isSelected,
    required VoidCallback onTap,
  }) {
    return ListTile(
      leading: Container(
        width: 40,
        height: 40,
        decoration: BoxDecoration(
          color: iconColor.withOpacity(0.1),
          shape: BoxShape.circle,
        ),
        child: Icon(icon, color: iconColor, size: 20),
      ),
      title: Text(title,
          style: AppTextStyles.bodyMedium.copyWith(
            fontWeight: isSelected ? FontWeight.w700 : FontWeight.w500,
            color: isSelected ? AppColors.primary : AppColors.textPrimary,
          )),
      subtitle: subtitle != null
          ? Text(subtitle, style: AppTextStyles.bodySmall, maxLines: 1, overflow: TextOverflow.ellipsis)
          : null,
      trailing: isSelected
          ? const Icon(Icons.check_circle, color: AppColors.primary, size: 22)
          : null,
      onTap: onTap,
    );
  }
}
