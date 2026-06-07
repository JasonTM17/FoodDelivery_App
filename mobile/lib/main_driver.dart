import 'package:flutter/material.dart';
import 'package:flutter_localizations/flutter_localizations.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'l10n/app_localizations.dart';
import 'shared/providers/locale_provider.dart';
import 'shared/theme/app_theme.dart';
import 'shared/theme/app_colors.dart';
import 'driver/screens/home_screen.dart';
import 'driver/screens/login_screen.dart';
import 'driver/screens/earnings_screen.dart';
import 'driver/screens/profile_screen.dart';
import 'driver/screens/delivery_history_screen.dart';
import 'driver/screens/delivery_flow_screen.dart';

void main() {
  WidgetsFlutterBinding.ensureInitialized();
  runApp(const ProviderScope(child: DriverApp()));
}

class DriverApp extends ConsumerWidget {
  const DriverApp({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final locale = ref.watch(localeProvider);
    return MaterialApp.router(
      title: 'FoodFlow Driver',
      debugShowCheckedModeBanner: false,
      theme: AppTheme.driverTheme,
      routerConfig: _router,
      locale: locale,
      localizationsDelegates: AppLocalizations.localizationsDelegates,
      supportedLocales: AppLocalizations.supportedLocales,
    );
  }
}

final _router = GoRouter(
  initialLocation: '/login',
  routes: [
    GoRoute(path: '/login', builder: (_, __) => const LoginScreen()),
    ShellRoute(
      builder: (_, __, child) => DriverShell(child: child),
      routes: [
        GoRoute(path: '/home', builder: (_, __) => const HomeScreen()),
        GoRoute(path: '/earnings', builder: (_, __) => const EarningsScreen()),
        GoRoute(path: '/profile', builder: (_, __) => const ProfileScreen()),
        GoRoute(path: '/history', builder: (_, __) => const DeliveryHistoryScreen()),
      ],
    ),
    GoRoute(
      path: '/delivery-flow',
      builder: (_, __) => const DeliveryFlowScreen(),
    ),
  ],
);

class DriverShell extends StatelessWidget {
  final Widget child;
  const DriverShell({super.key, required this.child});

  @override
  Widget build(BuildContext context) {
    final location = GoRouterState.of(context).uri.toString();
    final l10n = AppLocalizations.of(context)!;
    return Scaffold(
      body: child,
      bottomNavigationBar: BottomNavigationBar(
        currentIndex: location.contains('/earnings') ? 1 : location.contains('/profile') ? 2 : 0,
        onTap: (index) {
          switch (index) {
            case 0: context.go('/home');
            case 1: context.go('/earnings');
            case 2: context.go('/profile');
          }
        },
        selectedItemColor: AppColors.primary,
        items: [
          BottomNavigationBarItem(icon: const Icon(Icons.home_rounded), label: l10n.navHome),
          BottomNavigationBarItem(icon: const Icon(Icons.payments_rounded), label: l10n.navEarnings),
          BottomNavigationBarItem(icon: const Icon(Icons.person_rounded), label: l10n.driverProfileTitle),
        ],
      ),
    );
  }
}
