import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'shared/theme/app_theme.dart';
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

class DriverApp extends StatelessWidget {
  const DriverApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp.router(
      title: 'FoodFlow Driver',
      debugShowCheckedModeBanner: false,
      theme: AppTheme.driverTheme,
      routerConfig: _router,
    );
  }
}

final _router = GoRouter(
  initialLocation: '/login',
  routes: [
    GoRoute(path: '/login', builder: (_, __) => const DriverLoginScreen()),
    ShellRoute(
      builder: (_, __, child) => DriverShell(child: child),
      routes: [
        GoRoute(path: '/home', builder: (_, __) => const DriverHomeScreen()),
        GoRoute(path: '/earnings', builder: (_, __) => const DriverEarningsScreen()),
        GoRoute(path: '/profile', builder: (_, __) => const DriverProfileScreen()),
        GoRoute(path: '/history', builder: (_, __) => const DriverDeliveryHistoryScreen()),
      ],
    ),
    GoRoute(
      path: '/delivery-flow',
      builder: (_, state) {
        final extra = state.extra as Map<String, dynamic>;
        return DeliveryFlowScreen(
          orderId: extra['orderId'] as String,
          restaurantName: extra['restaurantName'] as String,
          restaurantAddress: extra['restaurantAddress'] as String,
          restaurantLat: extra['restaurantLat'] as double,
          restaurantLng: extra['restaurantLng'] as double,
          customerName: extra['customerName'] as String,
          customerAddress: extra['customerAddress'] as String,
          customerLat: extra['customerLat'] as double,
          customerLng: extra['customerLng'] as double,
          items: List<Map<String, dynamic>>.from(extra['items'] as List),
        );
      },
    ),
  ],
);

class DriverShell extends StatelessWidget {
  final Widget child;
  const DriverShell({super.key, required this.child});

  @override
  Widget build(BuildContext context) {
    final location = GoRouterState.of(context).uri.toString();
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
        selectedItemColor: AppTheme.driverGreen,
        items: const [
          BottomNavigationBarItem(icon: Icon(Icons.home_rounded), label: 'Trang chủ'),
          BottomNavigationBarItem(icon: Icon(Icons.payments_rounded), label: 'Thu nhập'),
          BottomNavigationBarItem(icon: Icon(Icons.person_rounded), label: 'Hồ sơ'),
        ],
      ),
    );
  }
}
