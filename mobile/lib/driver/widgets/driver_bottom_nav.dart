import 'package:flutter/material.dart';
import '../../l10n/app_localizations.dart';
import '../../shared/theme/app_colors.dart';

class DriverBottomNav extends StatelessWidget {
  final int currentIndex;
  final ValueChanged<int> onTap;

  const DriverBottomNav({
    super.key,
    required this.currentIndex,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context);
    return BottomNavigationBar(
      currentIndex: currentIndex,
      onTap: onTap,
      backgroundColor: const Color(0xFF1F2937),
      selectedItemColor: AppColors.primary,
      unselectedItemColor: const Color(0xFF6B7280),
      type: BottomNavigationBarType.fixed,
      elevation: 8,
      items: [
        BottomNavigationBarItem(
          icon: const Icon(Icons.home_outlined),
          activeIcon: const Icon(Icons.home),
          label: l10n.navHome,
        ),
        BottomNavigationBarItem(
          icon: const Icon(Icons.monetization_on_outlined),
          activeIcon: const Icon(Icons.monetization_on),
          label: l10n.navEarnings,
        ),
        BottomNavigationBarItem(
          icon: const Icon(Icons.history_outlined),
          activeIcon: const Icon(Icons.history),
          label: l10n.driverHistoryTitle,
        ),
        BottomNavigationBarItem(
          icon: const Icon(Icons.person_outline),
          activeIcon: const Icon(Icons.person),
          label: l10n.driverProfileTitle,
        ),
      ],
    );
  }
}
