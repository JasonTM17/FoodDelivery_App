import 'package:flutter/material.dart';
import '../../shared/theme/app_colors.dart';
import '../../shared/theme/app_text_styles.dart';
import '../providers/search_provider.dart';

class SearchFilterChips extends StatelessWidget {
  final SearchSort selectedSort;
  final Function(SearchSort) onChanged;

  const SearchFilterChips({
    super.key,
    required this.selectedSort,
    required this.onChanged,
  });

  @override
  Widget build(BuildContext context) {
    return SingleChildScrollView(
      scrollDirection: Axis.horizontal,
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
      child: Row(
        children: SearchSort.values
            .map((sort) => Padding(
                  padding: const EdgeInsets.only(right: 8),
                  child: _buildChip(context, sort),
                ))
            .toList(),
      ),
    );
  }

  Widget _buildChip(BuildContext context, SearchSort sort) {
    final isSelected = selectedSort == sort;
    return GestureDetector(
      onTap: () => onChanged(sort),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
        decoration: BoxDecoration(
          color: isSelected ? AppColors.primary : AppColors.cardBackground,
          borderRadius: BorderRadius.circular(20),
          border: Border.all(
            color: isSelected ? AppColors.primary : AppColors.border,
          ),
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(
              _iconForSort(sort),
              size: 14,
              color: isSelected ? Colors.white : AppColors.textSecondary,
            ),
            const SizedBox(width: 6),
            Text(
              sort.labelVi(),
              style: AppTextStyles.bodySmall.copyWith(
                color: isSelected ? Colors.white : AppColors.textSecondary,
                fontWeight: isSelected ? FontWeight.w600 : FontWeight.w400,
              ),
            ),
          ],
        ),
      ),
    );
  }

  IconData _iconForSort(SearchSort sort) {
    switch (sort) {
      case SearchSort.nearest:
        return Icons.location_on_outlined;
      case SearchSort.topRated:
        return Icons.star_outline;
      case SearchSort.priceLowHigh:
        return Icons.arrow_upward;
      case SearchSort.openNow:
        return Icons.access_time;
    }
  }
}
