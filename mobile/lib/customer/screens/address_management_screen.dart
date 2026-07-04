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

  IconData _iconForLabel(String label) {
    switch (label) {
      case 'Nhà':
        return Icons.home;
      case 'Công ty':
        return Icons.work;
      default:
        return Icons.location_on;
    }
  }

  void _showAddAddressDialog() {
    showDialog(
      context: context,
      builder: (context) => _AddressFormDialog(
        title: 'Thêm địa chỉ mới',
        onSave: (label, address) async {
          final notifier = ref.read(addressProvider.notifier);
          final success = await notifier.addAddress(
            label: label,
            address: address,
            latitude: 0.0,
            longitude: 0.0,
            isDefault: ref.read(addressProvider).addresses.isEmpty,
          );
          if (context.mounted) {
            if (success) {
              ScaffoldMessenger.of(context).showSnackBar(
                const SnackBar(content: Text('Đã thêm địa chỉ mới')),
              );
            } else {
              final error = ref.read(addressProvider).error;
              ScaffoldMessenger.of(context).showSnackBar(
                SnackBar(content: Text(error ?? 'Không thể thêm địa chỉ')),
              );
            }
          }
        },
      ),
    );
  }

  void _showEditAddressDialog(AddressModel address) {
    showDialog(
      context: context,
      builder: (context) => _AddressFormDialog(
        title: 'Sửa địa chỉ',
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
                const SnackBar(content: Text('Đã cập nhật địa chỉ')),
              );
            } else {
              final error = ref.read(addressProvider).error;
              ScaffoldMessenger.of(context).showSnackBar(
                SnackBar(content: Text(error ?? 'Không thể cập nhật địa chỉ')),
              );
            }
          }
        },
      ),
    );
  }

  void _showDeleteConfirm(AddressModel address) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Xóa địa chỉ?'),
        content: Text('Xóa "${address.label}"?'),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(context).pop(),
            child: const Text('Hủy'),
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
                    const SnackBar(content: Text('Đã xóa địa chỉ')),
                  );
                } else {
                  final error = ref.read(addressProvider).error;
                  ScaffoldMessenger.of(context).showSnackBar(
                    SnackBar(content: Text(error ?? 'Không thể xóa địa chỉ')),
                  );
                }
              }
            },
            child: const Text('Xóa', style: TextStyle(color: AppColors.error)),
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
              label: const Text('Thử lại'),
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
                  _iconForLabel(address.label),
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
                  const PopupMenuItem(value: 'edit', child: Text('Sửa')),
                  const PopupMenuItem(value: 'delete', child: Text('Xóa')),
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
  String _selectedLabel = 'Nhà';

  final List<String> _labelOptions = ['Nhà', 'Công ty', 'Khác'];

  @override
  void initState() {
    super.initState();
    _labelController = TextEditingController(text: widget.initialLabel);
    _addressController = TextEditingController(text: widget.initialAddress);
    if (widget.initialLabel != null) {
      _selectedLabel = widget.initialLabel!;
    }
  }

  @override
  void dispose() {
    _labelController.dispose();
    _addressController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return AlertDialog(
      title: Text(widget.title),
      content: Form(
        key: _formKey,
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            DropdownButtonFormField<String>(
              initialValue: _selectedLabel,
              decoration: const InputDecoration(labelText: 'Nhãn'),
              items: _labelOptions.map((label) {
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
              decoration: const InputDecoration(
                labelText: 'Địa chỉ',
                hintText: 'Nhập địa chỉ chi tiết',
              ),
              maxLines: 3,
              validator: (value) {
                if (value == null || value.trim().isEmpty) {
                  return 'Vui lòng nhập địa chỉ';
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
          child: const Text('Hủy'),
        ),
        ElevatedButton(
          onPressed: () {
            if (_formKey.currentState!.validate()) {
              widget.onSave(_selectedLabel, _addressController.text.trim());
              Navigator.of(context).pop();
            }
          },
          child: const Text('Lưu'),
        ),
      ],
    );
  }
}
