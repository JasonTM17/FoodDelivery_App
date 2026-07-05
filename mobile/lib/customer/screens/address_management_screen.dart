import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../shared/models/user.dart';
import '../../shared/theme/app_colors.dart';
import '../../shared/theme/app_text_styles.dart';
import '../providers/address_provider.dart';
import '../../l10n/app_localizations.dart';

class AddressManagementScreen extends ConsumerStatefulWidget {
  const AddressManagementScreen({super.key});

  @override
  ConsumerState<AddressManagementScreen> createState() =>
      _AddressManagementScreenState();
}

class _AddressManagementScreenState
    extends ConsumerState<AddressManagementScreen> {
  @override
  void initState() {
    super.initState();
    Future.microtask(() {
      ref.read(addressProvider.notifier).fetchAddresses();
    });
  }

  IconData _iconForLabel(String label, AppLocalizations l10n) {
    switch (label) {
      case var value when value == l10n.addressHomeLabel:
        return Icons.home;
      case var value when value == l10n.addressWorkLabel:
        return Icons.work;
      default:
        return Icons.location_on;
    }
  }

  void _showAddAddressDialog() {
    final l10n = AppLocalizations.of(context);
    showDialog(
      context: context,
      builder: (context) => _AddressFormDialog(
        title: l10n.addressAddDialogTitle,
        onSave: (label, address) async {
          final notifier = ref.read(addressProvider.notifier);
          final success = await notifier.addAddress(
            label: label,
            address: address,
            isDefault: ref.read(addressProvider).addresses.isEmpty,
          );
          if (context.mounted) {
            if (success) {
              ScaffoldMessenger.of(
                context,
              ).showSnackBar(SnackBar(content: Text(l10n.addressAddSuccess)));
            } else {
              final error = ref.read(addressProvider).error;
              ScaffoldMessenger.of(context).showSnackBar(
                SnackBar(
                  content: Text(
                    _addressErrorMessage(error, l10n, l10n.addressAddFailed),
                  ),
                ),
              );
            }
          }
        },
      ),
    );
  }

  void _showEditAddressDialog(AddressModel address) {
    final l10n = AppLocalizations.of(context);
    showDialog(
      context: context,
      builder: (context) => _AddressFormDialog(
        title: l10n.addressEditDialogTitle,
        initialLabel: address.label,
        initialAddress: address.address,
        onSave: (label, newAddress) async {
          final notifier = ref.read(addressProvider.notifier);
          final success = await notifier.updateAddress(
            id: address.id,
            label: label,
            address: newAddress,
          );
          if (context.mounted) {
            if (success) {
              ScaffoldMessenger.of(context).showSnackBar(
                SnackBar(content: Text(l10n.addressUpdateSuccess)),
              );
            } else {
              final error = ref.read(addressProvider).error;
              ScaffoldMessenger.of(context).showSnackBar(
                SnackBar(
                  content: Text(
                    _addressErrorMessage(error, l10n, l10n.addressUpdateFailed),
                  ),
                ),
              );
            }
          }
        },
      ),
    );
  }

  void _showDeleteConfirm(AddressModel address) {
    final l10n = AppLocalizations.of(context);
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: Text(l10n.addressDeleteTitle),
        content: Text(l10n.addressDeleteContent(address.label)),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(context).pop(),
            child: Text(l10n.cancel),
          ),
          TextButton(
            onPressed: () async {
              Navigator.of(context).pop();
              final success = await ref
                  .read(addressProvider.notifier)
                  .deleteAddress(address.id);
              if (context.mounted) {
                if (success) {
                  ScaffoldMessenger.of(context).showSnackBar(
                    SnackBar(content: Text(l10n.addressDeleteSuccess)),
                  );
                } else {
                  final error = ref.read(addressProvider).error;
                  ScaffoldMessenger.of(context).showSnackBar(
                    SnackBar(content: Text(error ?? l10n.addressDeleteFailed)),
                  );
                }
              }
            },
            child: Text(
              l10n.addressDeleteAction,
              style: const TextStyle(color: AppColors.error),
            ),
          ),
        ],
      ),
    );
  }

  Future<void> _setAsDefault(AddressModel address) async {
    await ref
        .read(addressProvider.notifier)
        .updateAddress(id: address.id, isDefault: true);
  }

  String _addressErrorMessage(
    String? error,
    AppLocalizations l10n,
    String fallback,
  ) {
    return switch (error) {
      'ADDRESS_LOCATION_REQUIRED' => l10n.addressLocationRequired,
      'ADDRESS_LOCATION_INVALID' => l10n.addressLocationInvalid,
      null => fallback,
      _ => error,
    };
  }

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context);
    final addressState = ref.watch(addressProvider);

    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(title: Text(l10n.addressManagementTitle)),
      body: _buildBody(addressState, l10n),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: _showAddAddressDialog,
        icon: const Icon(Icons.add),
        label: Text(l10n.addressAdd),
      ),
    );
  }

  Widget _buildBody(AddressState state, AppLocalizations l10n) {
    if (state.isLoading && state.addresses.isEmpty) {
      return Center(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const CircularProgressIndicator(color: AppColors.primary),
            const SizedBox(height: 12),
            Text(l10n.addressLoading, style: AppTextStyles.bodySmall),
          ],
        ),
      );
    }

    if (state.error != null && state.addresses.isEmpty) {
      return Center(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Container(
              width: 80,
              height: 80,
              decoration: BoxDecoration(
                color: AppColors.surface,
                shape: BoxShape.circle,
              ),
              child: const Icon(
                Icons.error_outline,
                size: 40,
                color: AppColors.error,
              ),
            ),
            const SizedBox(height: 16),
            Text(
              state.error!,
              style: AppTextStyles.bodyMedium.copyWith(color: AppColors.error),
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 16),
            ElevatedButton.icon(
              onPressed: () =>
                  ref.read(addressProvider.notifier).fetchAddresses(),
              icon: const Icon(Icons.refresh, size: 18),
              label: Text(l10n.commonRetry),
            ),
          ],
        ),
      );
    }

    if (state.addresses.isEmpty) {
      return Center(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Container(
              width: 80,
              height: 80,
              decoration: BoxDecoration(
                color: AppColors.surface,
                shape: BoxShape.circle,
              ),
              child: const Icon(
                Icons.location_off,
                size: 40,
                color: AppColors.textHint,
              ),
            ),
            const SizedBox(height: 16),
            Text(l10n.addressEmpty, style: AppTextStyles.headline4),
            const SizedBox(height: 8),
            Text(
              l10n.addressEmptySubtitle,
              style: AppTextStyles.bodyMedium.copyWith(
                color: AppColors.textSecondary,
              ),
            ),
          ],
        ),
      );
    }

    return RefreshIndicator(
      onRefresh: () => ref.read(addressProvider.notifier).fetchAddresses(),
      child: ListView.builder(
        padding: const EdgeInsets.all(16),
        itemCount: state.addresses.length,
        itemBuilder: (context, index) =>
            _buildAddressCard(state.addresses[index]),
      ),
    );
  }

  Widget _buildAddressCard(AddressModel address) {
    final l10n = AppLocalizations.of(context);
    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: AppColors.cardBackground,
        borderRadius: BorderRadius.circular(16),
        boxShadow: [
          BoxShadow(
            color: AppColors.shadow,
            blurRadius: 6,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Container(
                width: 40,
                height: 40,
                decoration: BoxDecoration(
                  color: address.isDefault
                      ? AppColors.primary.withValues(alpha: 0.1)
                      : AppColors.surface,
                  borderRadius: BorderRadius.circular(10),
                ),
                child: Icon(
                  _iconForLabel(address.label, l10n),
                  color: address.isDefault
                      ? AppColors.primary
                      : AppColors.textHint,
                  size: 22,
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        Text(
                          address.label,
                          style: AppTextStyles.bodyMedium.copyWith(
                            fontWeight: FontWeight.w600,
                          ),
                        ),
                        if (address.isDefault) ...[
                          const SizedBox(width: 8),
                          Container(
                            padding: const EdgeInsets.symmetric(
                              horizontal: 8,
                              vertical: 2,
                            ),
                            decoration: BoxDecoration(
                              color: AppColors.primaryLight,
                              borderRadius: BorderRadius.circular(6),
                            ),
                            child: Text(
                              AppLocalizations.of(context).addressDefault,
                              style: const TextStyle(
                                fontSize: 10,
                                fontWeight: FontWeight.w600,
                                color: AppColors.primaryDark,
                              ),
                            ),
                          ),
                        ],
                      ],
                    ),
                    const SizedBox(height: 4),
                    Text(
                      address.address,
                      style: AppTextStyles.bodySmall,
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis,
                    ),
                  ],
                ),
              ),
              PopupMenuButton<String>(
                icon: const Icon(
                  Icons.more_vert,
                  color: AppColors.textHint,
                  size: 20,
                ),
                onSelected: (value) {
                  switch (value) {
                    case 'edit':
                      _showEditAddressDialog(address);
                      break;
                    case 'delete':
                      _showDeleteConfirm(address);
                      break;
                  }
                },
                itemBuilder: (context) => [
                  PopupMenuItem(value: 'edit', child: Text(l10n.addressEdit)),
                  PopupMenuItem(
                    value: 'delete',
                    child: Text(l10n.addressDeleteAction),
                  ),
                ],
              ),
            ],
          ),
          const SizedBox(height: 12),
          Row(
            children: [
              if (!address.isDefault)
                TextButton.icon(
                  onPressed: () => _setAsDefault(address),
                  icon: const Icon(Icons.check_circle_outline, size: 16),
                  label: Text(
                    AppLocalizations.of(context).addressSetDefault,
                    style: const TextStyle(fontSize: 12),
                  ),
                ),
              const Spacer(),
              TextButton.icon(
                onPressed: () => _showEditAddressDialog(address),
                icon: const Icon(Icons.edit, size: 16),
                label: Text(
                  AppLocalizations.of(context).addressEdit,
                  style: const TextStyle(fontSize: 12),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}

class _AddressFormDialog extends StatefulWidget {
  final String title;
  final String? initialLabel;
  final String? initialAddress;
  final Function(String label, String address) onSave;

  const _AddressFormDialog({
    required this.title,
    this.initialLabel,
    this.initialAddress,
    required this.onSave,
  });

  @override
  State<_AddressFormDialog> createState() => _AddressFormDialogState();
}

class _AddressFormDialogState extends State<_AddressFormDialog> {
  final _formKey = GlobalKey<FormState>();
  late TextEditingController _labelController;
  late TextEditingController _addressController;
  String? _selectedLabel;

  @override
  void initState() {
    super.initState();
    _labelController = TextEditingController(text: widget.initialLabel);
    _addressController = TextEditingController(text: widget.initialAddress);
    _selectedLabel = widget.initialLabel;
  }

  @override
  void dispose() {
    _labelController.dispose();
    _addressController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context);
    final labelOptions = [
      l10n.addressHomeLabel,
      l10n.addressWorkLabel,
      l10n.addressOtherLabel,
    ];
    final selectedLabel = _selectedLabel ?? labelOptions.first;
    final dropdownOptions = labelOptions.contains(selectedLabel)
        ? labelOptions
        : [selectedLabel, ...labelOptions];

    return AlertDialog(
      title: Text(widget.title),
      content: Form(
        key: _formKey,
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            DropdownButtonFormField<String>(
              initialValue: selectedLabel,
              decoration: InputDecoration(labelText: l10n.addressLabelField),
              items: dropdownOptions.map((label) {
                return DropdownMenuItem(value: label, child: Text(label));
              }).toList(),
              onChanged: (value) {
                if (value != null) {
                  setState(() => _selectedLabel = value);
                  _labelController.text = value;
                }
              },
            ),
            const SizedBox(height: 12),
            TextFormField(
              controller: _addressController,
              decoration: InputDecoration(
                labelText: l10n.addressFieldLabel,
                hintText: l10n.addressFieldHint,
              ),
              maxLines: 3,
              validator: (value) {
                if (value == null || value.trim().isEmpty) {
                  return l10n.addressRequired;
                }
                return null;
              },
            ),
          ],
        ),
      ),
      actions: [
        TextButton(
          onPressed: () => Navigator.of(context).pop(),
          child: Text(l10n.cancel),
        ),
        ElevatedButton(
          onPressed: () {
            if (_formKey.currentState!.validate()) {
              widget.onSave(selectedLabel, _addressController.text.trim());
              Navigator.of(context).pop();
            }
          },
          child: Text(l10n.addressSave),
        ),
      ],
    );
  }
}
