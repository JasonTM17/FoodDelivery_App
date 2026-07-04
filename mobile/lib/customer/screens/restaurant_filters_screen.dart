import 'package:flutter/material.dart';
import '../../l10n/app_localizations.dart';
import '../../shared/theme/app_colors.dart';
import '../../shared/theme/app_text_styles.dart';

class RestaurantFilters {
  final double? minRating;
  final int? maxDeliveryMinutes;
  final String? priceRange;
  final bool freeDeliveryOnly;
  final bool openNowOnly;

  const RestaurantFilters({
    this.minRating,
    this.maxDeliveryMinutes,
    this.priceRange,
    this.freeDeliveryOnly = false,
    this.openNowOnly = false,
  });

  bool get hasActiveFilters =>
      minRating != null ||
      maxDeliveryMinutes != null ||
      priceRange != null ||
      freeDeliveryOnly ||
      openNowOnly;
}

class RestaurantFiltersScreen extends StatefulWidget {
  final RestaurantFilters initial;
  const RestaurantFiltersScreen({
    super.key,
    this.initial = const RestaurantFilters(),
  });

  @override
  State<RestaurantFiltersScreen> createState() =>
      _RestaurantFiltersScreenState();
}

class _RestaurantFiltersScreenState extends State<RestaurantFiltersScreen> {
  late double? _minRating;
  late int? _maxMinutes;
  late String? _priceRange;
  late bool _freeDelivery;
  late bool _openNow;

  @override
  void initState() {
    super.initState();
    _minRating = widget.initial.minRating;
    _maxMinutes = widget.initial.maxDeliveryMinutes;
    _priceRange = widget.initial.priceRange;
    _freeDelivery = widget.initial.freeDeliveryOnly;
    _openNow = widget.initial.openNowOnly;
  }

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context);
    return Scaffold(
      backgroundColor: AppColors.surface,
      appBar: AppBar(
        title: Text(l10n.filterTitle),
        actions: [
          TextButton(
            onPressed: () => setState(() {
              _minRating = null;
              _maxMinutes = null;
              _priceRange = null;
              _freeDelivery = false;
              _openNow = false;
            }),
            child: Text(
              l10n.filterReset,
              style: const TextStyle(color: AppColors.error),
            ),
          ),
        ],
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            _buildSectionTitle(l10n.filterRating),
            const SizedBox(height: 10),
            _buildChipRow<double>(
              options: const [3.0, 3.5, 4.0, 4.5],
              selected: _minRating,
              labelBuilder: (v) => '${v}+★',
              onSelect: (v) =>
                  setState(() => _minRating = _minRating == v ? null : v),
            ),
            const SizedBox(height: 20),

            _buildSectionTitle(l10n.filterDeliveryTime),
            const SizedBox(height: 10),
            _buildChipRow<int>(
              options: const [15, 30, 45, 60],
              selected: _maxMinutes,
              labelBuilder: (v) => l10n.filterMinutes(v),
              onSelect: (v) =>
                  setState(() => _maxMinutes = _maxMinutes == v ? null : v),
            ),
            const SizedBox(height: 20),

            _buildSectionTitle(l10n.filterPriceRange),
            const SizedBox(height: 10),
            _buildChipRow<String>(
              options: const ['low', 'medium', 'high'],
              selected: _priceRange,
              labelBuilder: (v) => v == 'low'
                  ? '₫'
                  : v == 'medium'
                  ? '₫₫'
                  : '₫₫₫',
              onSelect: (v) =>
                  setState(() => _priceRange = _priceRange == v ? null : v),
            ),
            const SizedBox(height: 20),

            _buildToggleRow(
              l10n.filterFreeDelivery,
              Icons.delivery_dining_outlined,
              _freeDelivery,
              (v) => setState(() => _freeDelivery = v),
            ),
            const Divider(height: 24),
            _buildToggleRow(
              l10n.filterOpenNow,
              Icons.access_time_outlined,
              _openNow,
              (v) => setState(() => _openNow = v),
            ),
            const SizedBox(height: 32),
          ],
        ),
      ),
      bottomNavigationBar: SafeArea(
        child: Padding(
          padding: const EdgeInsets.fromLTRB(16, 8, 16, 8),
          child: ElevatedButton(
            onPressed: () => Navigator.of(context).pop(
              RestaurantFilters(
                minRating: _minRating,
                maxDeliveryMinutes: _maxMinutes,
                priceRange: _priceRange,
                freeDeliveryOnly: _freeDelivery,
                openNowOnly: _openNow,
              ),
            ),
            style: ElevatedButton.styleFrom(
              padding: const EdgeInsets.symmetric(vertical: 14),
            ),
            child: Text(l10n.filterApply, style: AppTextStyles.buttonLarge),
          ),
        ),
      ),
    );
  }

  Widget _buildSectionTitle(String title) =>
      Text(title, style: AppTextStyles.headline4);

  Widget _buildChipRow<T>({
    required List<T> options,
    required T? selected,
    required String Function(T) labelBuilder,
    required void Function(T) onSelect,
  }) {
    return Wrap(
      spacing: 10,
      children: options.map((opt) {
        final isSelected = selected == opt;
        return GestureDetector(
          onTap: () => onSelect(opt),
          child: Container(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
            decoration: BoxDecoration(
              color: isSelected ? AppColors.primary : AppColors.cardBackground,
              borderRadius: BorderRadius.circular(20),
              border: Border.all(
                color: isSelected ? AppColors.primary : AppColors.border,
              ),
            ),
            child: Text(
              labelBuilder(opt),
              style: AppTextStyles.bodyMedium.copyWith(
                color: isSelected ? Colors.white : AppColors.textPrimary,
                fontWeight: isSelected ? FontWeight.w600 : FontWeight.w400,
              ),
            ),
          ),
        );
      }).toList(),
    );
  }

  Widget _buildToggleRow(
    String label,
    IconData icon,
    bool value,
    ValueChanged<bool> onChanged,
  ) {
    return Row(
      children: [
        Icon(icon, color: AppColors.primary, size: 22),
        const SizedBox(width: 12),
        Expanded(child: Text(label, style: AppTextStyles.bodyMedium)),
        Switch(
          value: value,
          onChanged: onChanged,
          activeThumbColor: AppColors.primary,
        ),
      ],
    );
  }
}
