import 'package:flutter/material.dart';
import '../../shared/theme/app_colors.dart';
import '../../shared/theme/app_text_styles.dart';

class AddressManagementScreen extends StatefulWidget {
  const AddressManagementScreen({super.key});

  @override
  State<AddressManagementScreen> createState() => _AddressManagementScreenState();
}

class _AddressManagementScreenState extends State<AddressManagementScreen> {
  List<_AddressItem> _addresses = [
    _AddressItem(
      id: '1',
      label: 'Nhà',
      address: '123 Nguyễn Huệ, Phường Bến Nghé, Quận 1, TP. HCM',
      isDefault: true,
      icon: Icons.home,
    ),
    _AddressItem(
      id: '2',
      label: 'Công ty',
      address: '456 Lê Lợi, Phường Bến Thành, Quận 1, TP. HCM',
      isDefault: false,
      icon: Icons.work,
    ),
  ];

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        title: const Text('Địa chỉ của tôi'),
      ),
      body: _addresses.isEmpty
          ? Center(
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
                    child: const Icon(Icons.location_off, size: 40, color: AppColors.textHint),
                  ),
                  const SizedBox(height: 16),
                  const Text(
                    'Chưa có địa chỉ nào',
                    style: AppTextStyles.headline4,
                  ),
                  const SizedBox(height: 8),
                  Text(
                    'Thêm địa chỉ để bắt đầu đặt hàng',
                    style: AppTextStyles.bodyMedium.copyWith(color: AppColors.textSecondary),
                  ),
                ],
              ),
            )
          : ListView.builder(
              padding: const EdgeInsets.all(16),
              itemCount: _addresses.length,
              itemBuilder: (context, index) => _buildAddressCard(index),
            ),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: _showAddAddressDialog,
        icon: const Icon(Icons.add),
        label: const Text('Thêm địa chỉ'),
      ),
    );
  }

  Widget _buildAddressCard(int index) {
    final address = _addresses[index];
    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: AppColors.cardBackground,
        borderRadius: BorderRadius.circular(16),
        boxShadow: [
          BoxShadow(color: AppColors.shadow, blurRadius: 6, offset: const Offset(0, 2)),
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
                  address.icon,
                  color: address.isDefault ? AppColors.primary : AppColors.textHint,
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
                          style: AppTextStyles.bodyMedium.copyWith(fontWeight: FontWeight.w600),
                        ),
                        if (address.isDefault) ...[
                          const SizedBox(width: 8),
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                            decoration: BoxDecoration(
                              color: AppColors.primaryLight,
                              borderRadius: BorderRadius.circular(6),
                            ),
                            child: const Text(
                              'Mặc định',
                              style: TextStyle(fontSize: 10, fontWeight: FontWeight.w600, color: AppColors.primaryDark),
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
                icon: const Icon(Icons.more_vert, color: AppColors.textHint, size: 20),
                onSelected: (value) {
                  switch (value) {
                    case 'edit':
                      _showEditAddressDialog(index);
                      break;
                    case 'delete':
                      _showDeleteConfirm(index);
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
                  onPressed: () {
                    setState(() {
                      for (final a in _addresses) {
                        a.isDefault = a.id == address.id;
                      }
                    });
                  },
                  icon: const Icon(Icons.check_circle_outline, size: 16),
                  label: const Text('Đặt làm mặc định', style: TextStyle(fontSize: 12)),
                ),
              const Spacer(),
              TextButton.icon(
                onPressed: () => _showEditAddressDialog(index),
                icon: const Icon(Icons.edit, size: 16),
                label: const Text('Sửa', style: TextStyle(fontSize: 12)),
              ),
            ],
          ),
        ],
      ),
    );
  }

  void _showAddAddressDialog() {
    showDialog(
      context: context,
      builder: (context) => _AddressFormDialog(
        title: 'Thêm địa chỉ mới',
        onSave: (label, address) {
          setState(() {
            _addresses.add(_AddressItem(
              id: DateTime.now().millisecondsSinceEpoch.toString(),
              label: label,
              address: address,
              isDefault: _addresses.isEmpty,
              icon: label == 'Nhà' ? Icons.home : Icons.work,
            ));
          });
        },
      ),
    );
  }

  void _showEditAddressDialog(int index) {
    final address = _addresses[index];
    showDialog(
      context: context,
      builder: (context) => _AddressFormDialog(
        title: 'Sửa địa chỉ',
        initialLabel: address.label,
        initialAddress: address.address,
        onSave: (label, newAddress) {
          setState(() {
            _addresses[index].label = label;
            _addresses[index].address = newAddress;
            _addresses[index].icon = label == 'Nhà' ? Icons.home : Icons.work;
          });
        },
      ),
    );
  }

  void _showDeleteConfirm(int index) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Xóa địa chỉ?'),
        content: Text('Xóa "${_addresses[index].label}"?'),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(context).pop(),
            child: const Text('Hủy'),
          ),
          TextButton(
            onPressed: () {
              setState(() => _addresses.removeAt(index));
              Navigator.of(context).pop();
            },
            child: const Text('Xóa', style: TextStyle(color: AppColors.error)),
          ),
        ],
      ),
    );
  }
}

class _AddressItem {
  final String id;
  String label;
  String address;
  bool isDefault;
  IconData icon;

  _AddressItem({
    required this.id,
    required this.label,
    required this.address,
    required this.isDefault,
    required this.icon,
  });
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
