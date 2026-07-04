import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../providers/locale_provider.dart';
import '../theme/app_colors.dart';

/// Renders three toggle buttons (VI / EN / JA) that update [localeProvider].
/// Drop this widget anywhere in the settings/profile section of customer or
/// driver app.
class LocaleSwitcher extends ConsumerWidget {
  const LocaleSwitcher({super.key});

  static const _locales = [
    (code: 'vi', label: 'VI'),
    (code: 'en', label: 'EN'),
    (code: 'ja', label: 'JA'),
  ];

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final current = ref.watch(localeProvider);

    return Row(
      mainAxisSize: MainAxisSize.min,
      children: _locales.map((entry) {
        final isSelected = current.languageCode == entry.code;
        return Padding(
          padding: const EdgeInsets.only(right: 6),
          child: _LocaleButton(
            label: entry.label,
            isSelected: isSelected,
            onTap: () =>
                ref.read(localeProvider.notifier).setLocale(Locale(entry.code)),
          ),
        );
      }).toList(),
    );
  }
}

class _LocaleButton extends StatelessWidget {
  final String label;
  final bool isSelected;
  final VoidCallback onTap;

  const _LocaleButton({
    required this.label,
    required this.isSelected,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 180),
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
        decoration: BoxDecoration(
          color: isSelected ? AppColors.primary : AppColors.surface,
          borderRadius: BorderRadius.circular(20),
          border: Border.all(
            color: isSelected ? AppColors.primary : AppColors.border,
            width: 1.5,
          ),
        ),
        child: Text(
          label,
          style: TextStyle(
            fontSize: 13,
            fontWeight: FontWeight.w600,
            color: isSelected ? Colors.white : AppColors.textSecondary,
          ),
        ),
      ),
    );
  }
}
