import 'package:flutter/material.dart';
import 'package:flutter_localizations/flutter_localizations.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'l10n/app_localizations.dart';
import 'shared/providers/locale_provider.dart';
import 'customer/screens/splash_screen.dart';
import 'customer/screens/login_screen.dart';
import 'customer/screens/register_screen.dart';
import 'customer/screens/home_screen.dart';
import 'customer/screens/restaurant_detail_screen.dart';
import 'customer/screens/food_detail_screen.dart';
import 'customer/screens/cart_screen.dart';
import 'customer/screens/checkout_screen.dart';
import 'customer/screens/order_tracking_screen.dart';
import 'customer/screens/chat_screen.dart';
import 'customer/screens/order_history_screen.dart';
import 'customer/screens/profile_screen.dart';
import 'customer/screens/address_management_screen.dart';
import 'customer/screens/review_screen.dart';
import 'customer/screens/location_permission_screen.dart';
import 'customer/screens/restaurant_list_screen.dart';
import 'customer/screens/notifications_screen.dart';
import 'customer/screens/onboarding_welcome_screen.dart';
import 'customer/screens/onboarding_location_screen.dart';
import 'customer/screens/onboarding_notification_screen.dart';
import 'customer/screens/loyalty_screen.dart';
import 'customer/screens/wallet_screen.dart';
import 'customer/screens/referral_screen.dart';
import 'customer/screens/help_center_screen.dart';
import 'customer/screens/restaurant_filters_screen.dart';
import 'customer/screens/address_picker_screen.dart';
import 'shared/models/menu_item.dart';
import 'shared/theme/app_theme.dart';

final _router = GoRouter(
  initialLocation: '/splash',
  routes: [
    GoRoute(
      path: '/splash',
      builder: (context, state) => const SplashScreen(),
    ),
    GoRoute(
      path: '/login',
      builder: (context, state) => const LoginScreen(),
    ),
    GoRoute(
      path: '/register',
      builder: (context, state) => const RegisterScreen(),
    ),
    GoRoute(
      path: '/register-driver',
      builder: (context, state) => const RegisterScreen(initialRole: 'driver'),
    ),
    GoRoute(
      path: '/home',
      builder: (context, state) => const HomeScreen(),
    ),
    GoRoute(
      path: '/restaurant-detail',
      builder: (context, state) {
        final restaurantId = state.extra as String;
        return RestaurantDetailScreen(restaurantId: restaurantId);
      },
    ),
    GoRoute(
      path: '/food-detail',
      builder: (context, state) {
        final args = state.extra as Map<String, dynamic>;
        return FoodDetailScreen(
          item: args['item'] as MenuItemModel,
          restaurantName: args['restaurantName'] as String,
        );
      },
    ),
    GoRoute(
      path: '/cart',
      builder: (context, state) => const CartScreen(),
    ),
    GoRoute(
      path: '/checkout',
      builder: (context, state) => const CheckoutScreen(),
    ),
    GoRoute(
      path: '/order-tracking',
      builder: (context, state) {
        final orderId = state.extra as String;
        return OrderTrackingScreen(orderId: orderId);
      },
    ),
    GoRoute(
      path: '/chat',
      builder: (context, state) {
        final orderId = state.extra as String;
        return ChatScreen(orderId: orderId);
      },
    ),
    GoRoute(
      path: '/orders',
      builder: (context, state) => const OrderHistoryScreen(),
    ),
    GoRoute(
      path: '/profile',
      builder: (context, state) => const ProfileScreen(),
    ),
    GoRoute(
      path: '/addresses',
      builder: (context, state) => const AddressManagementScreen(),
    ),
    GoRoute(
      path: '/review',
      builder: (context, state) {
        final orderId = state.extra as String;
        return ReviewScreen(orderId: orderId);
      },
    ),
    GoRoute(
      path: '/location-permission',
      builder: (context, state) => const LocationPermissionScreen(),
    ),
    GoRoute(
      path: '/restaurants',
      builder: (context, state) => const RestaurantListScreen(),
    ),
    GoRoute(
      path: '/notifications',
      builder: (context, state) => const NotificationsScreen(),
    ),
    GoRoute(
      path: '/search',
      builder: (context, state) {
        final _ = state.extra as String? ?? '';
        // Search results screen — for now redirects to home
        return const HomeScreen();
      },
    ),
    GoRoute(
      path: '/onboarding',
      builder: (context, state) => const OnboardingWelcomeScreen(),
    ),
    GoRoute(
      path: '/onboarding-location',
      builder: (context, state) => const OnboardingLocationScreen(),
    ),
    GoRoute(
      path: '/onboarding-notifications',
      builder: (context, state) => const OnboardingNotificationScreen(),
    ),
    GoRoute(
      path: '/loyalty',
      builder: (context, state) => const LoyaltyScreen(),
    ),
    GoRoute(
      path: '/wallet',
      builder: (context, state) => const WalletScreen(),
    ),
    GoRoute(
      path: '/referral',
      builder: (context, state) => const ReferralScreen(),
    ),
    GoRoute(
      path: '/help',
      builder: (context, state) => const HelpCenterScreen(),
    ),
    GoRoute(
      path: '/restaurant-filters',
      builder: (context, state) {
        final initial = state.extra as RestaurantFilters? ?? const RestaurantFilters();
        return RestaurantFiltersScreen(initial: initial);
      },
    ),
    GoRoute(
      path: '/address-picker',
      builder: (context, state) => const AddressPickerScreen(),
    ),
  ],
);

class CustomerApp extends ConsumerWidget {
  const CustomerApp({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final locale = ref.watch(localeProvider);
    return MaterialApp.router(
      title: 'FoodFlow',
      debugShowCheckedModeBanner: false,
      theme: AppTheme.lightTheme,
      routerConfig: _router,
      locale: locale,
      localizationsDelegates: AppLocalizations.localizationsDelegates,
      supportedLocales: AppLocalizations.supportedLocales,
    );
  }
}
