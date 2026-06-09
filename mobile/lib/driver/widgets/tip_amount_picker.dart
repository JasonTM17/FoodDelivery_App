import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../shared/theme/app_colors.dart';
import '../providers/tip_provider.dart';

class TipAmountPicker extends ConsumerWidget {
  const TipAmountPicker({super.key});

  static const _suggestedAmounts = [5000, 10000, 20000, 50000];

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final tipState = ref.watch(tipProvider);

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text(
          'Chọn số tiền tip',
          style: TextStyle(
            fontSize: 15,
            fontWeight: FontWeight.w600,
            color: Colors.white,
          ),
        ),
        const SizedBox(height: 12),
        Wrap(
          spacing: 10,
          runSpacing: 10,
          children: _suggestedAmounts.map((amount) {
            final isSelected = tipState.suggestedAmount == amount;
            return GestureDetector(
              onTap: () => ref.read(tipProvider.notifier).selectAmount(amount),
              child: Container(
                padding:
                    const EdgeInsets.symmetric(horizontal: 20, vertical: 12),
                decoration: BoxDecoration(
                  color: isSelected
                      ? AppColors.primary.withValues(alpha: 0.15)
                      : const Color(0xFF1E1E1E),
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(
                    color: isSelected
                        ? AppColors.primary
                        : const Color(0xFF374151),
                    width: isSelected ? 2 : 1,
                  ),
                ),
                child: Text(
                  '${amount ~/ 1000}Kđ',
                  style: TextStyle(
                    fontSize: 15,
                    fontWeight: FontWeight.w600,
                    color: isSelected ? AppColors.primary : Colors.white,
                  ),
                ),
              ),
            );
          }).toList(),
        ),
        const SizedBox(height: 16),
        const Text(
          'Hoặc nhập số tiền khác',
          style: TextStyle(fontSize: 13, color: Color(0xFF6B7280)),
        ),
        const SizedBox(height: 8),
        TextField(
          keyboardType: TextInputType.number,
          style: const TextStyle(color: Colors.white),
          decoration: const InputDecoration(
            hintText: 'Nhập số tiền (VNĐ)',
            prefixText: 'đ ',
            prefixStyle: TextStyle(color: Color(0xFF6B7280)),
          ),
          onChanged: (value) {
            final amount = int.tryParse(value);
            if (amount != null && amount > 0) {
              ref.read(tipProvider.notifier).setCustomAmount(amount);
            }
          },
        ),
      ],
    );
  }
}
