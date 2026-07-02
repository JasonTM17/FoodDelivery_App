import 'package:flutter/material.dart';
import '../../shared/theme/app_colors.dart';

class DateRangeFilter extends StatelessWidget {
  final DateTime? fromDate;
  final DateTime? toDate;
  final ValueChanged<DateTime>? onFromDateChanged;
  final ValueChanged<DateTime>? onToDateChanged;
  final VoidCallback? onClear;

  const DateRangeFilter({
    super.key,
    this.fromDate,
    this.toDate,
    this.onFromDateChanged,
    this.onToDateChanged,
    this.onClear,
  });

  static const _quickOptions = [
    ('Hôm nay', 0),
    ('7 ngày qua', 7),
    ('30 ngày qua', 30),
    ('Tùy chỉnh', -1),
  ];

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        SingleChildScrollView(
          scrollDirection: Axis.horizontal,
          padding: const EdgeInsets.symmetric(horizontal: 16),
          child: Row(
            children: _quickOptions.map((option) {
              final isActive = _isQuickOptionActive(option.$2);
              return Padding(
                padding: const EdgeInsets.only(right: 8),
                child: ChoiceChip(
                  label: Text(option.$1),
                  selected: isActive,
                  onSelected: (_) {
                    if (option.$2 == -1) {
                      // Tuỳ chỉnh — prompt date picker
                      _pickDateRange(context);
                    } else {
                      final now = DateTime.now();
                      final start = DateTime(now.year, now.month, now.day)
                          .subtract(Duration(days: option.$2));
                      onFromDateChanged?.call(start);
                      onToDateChanged?.call(now);
                    }
                  },
                  selectedColor: AppColors.primary.withValues(alpha: 0.15),
                  backgroundColor: const Color(0xFF1E1E1E),
                  labelStyle: TextStyle(
                    fontSize: 13,
                    fontWeight: FontWeight.w500,
                    color: isActive ? AppColors.primary : const Color(0xFF9CA3AF),
                  ),
                  side: BorderSide(
                    color: isActive
                        ? AppColors.primary
                        : const Color(0xFF374151),
                  ),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(10),
                  ),
                ),
              );
            }).toList(),
          ),
        ),
        if (fromDate != null || toDate != null) ...[
          const SizedBox(height: 10),
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16),
            child: Row(
              children: [
                Icon(Icons.date_range, size: 14, color: AppColors.primary),
                const SizedBox(width: 6),
                Text(
                  _formatRange(),
                  style: const TextStyle(
                    fontSize: 13,
                    color: AppColors.primary,
                    fontWeight: FontWeight.w500,
                  ),
                ),
                const Spacer(),
                GestureDetector(
                  onTap: onClear,
                  child: const Text(
                    'Xoá',
                    style: TextStyle(
                      fontSize: 13,
                      color: Color(0xFFEF4444),
                      fontWeight: FontWeight.w500,
                    ),
                  ),
                ),
              ],
            ),
          ),
        ],
      ],
    );
  }

  bool _isQuickOptionActive(int days) {
    if (fromDate == null) return days == 0;
    final now = DateTime.now();
    final today = DateTime(now.year, now.month, now.day);
    if (days == 0) {
      return fromDate!.year == today.year &&
          fromDate!.month == today.month &&
          fromDate!.day == today.day;
    }
    if (days > 0) {
      final expected = today.subtract(Duration(days: days));
      return fromDate!.year == expected.year &&
          fromDate!.month == expected.month &&
          fromDate!.day == expected.day;
    }
    return false;
  }

  String _formatRange() {
    final fmt = (DateTime d) => '${d.day}/${d.month}/${d.year}';
    if (fromDate != null && toDate != null) {
      return '${fmt(fromDate!)} - ${fmt(toDate!)}';
    }
    if (fromDate != null) return 'Từ ${fmt(fromDate!)}';
    return 'Đến ${fmt(toDate!)}';
  }

  Future<void> _pickDateRange(BuildContext context) async {
    final from = await showDatePicker(
      context: context,
      initialDate: fromDate ?? DateTime.now().subtract(const Duration(days: 7)),
      firstDate: DateTime.now().subtract(const Duration(days: 90)),
      lastDate: DateTime.now(),
      builder: (context, child) {
        return Theme(
          data: ThemeData.dark().copyWith(
            colorScheme: const ColorScheme.dark(
              primary: AppColors.primary,
              onPrimary: Colors.white,
              surface: Color(0xFF1E1E1E),
            ),
          ),
          child: child!,
        );
      },
    );
    if (from != null) {
      onFromDateChanged?.call(from);
      final to = await showDatePicker(
        context: context,
        initialDate: toDate ?? DateTime.now(),
        firstDate: from,
        lastDate: DateTime.now(),
        builder: (context, child) {
          return Theme(
            data: ThemeData.dark().copyWith(
              colorScheme: const ColorScheme.dark(
                primary: AppColors.primary,
                onPrimary: Colors.white,
                surface: Color(0xFF1E1E1E),
              ),
            ),
            child: child!,
          );
        },
      );
      if (to != null) onToDateChanged?.call(to);
    }
  }
}
