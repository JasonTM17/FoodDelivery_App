import 'package:go_router/go_router.dart';

import '../screens/splash_screen.dart';
import '../screens/login_screen.dart';
import '../screens/register_screen.dart';
import '../screens/home_screen.dart';
import '../screens/restaurant_detail_screen.dart';
import '../screens/food_detail_screen.dart';
import '../screens/cart_screen.dart';
import '../screens/checkout_screen.dart';
import '../screens/order_tracking_screen.dart';
import '../screens/chat_screen.dart';
import '../screens/order_history_screen.dart';
import '../screens/profile_screen.dart';
import '../screens/address_management_screen.dart';
import '../screens/review_screen.dart';
import '../screens/location_permission_screen.dart';
import '../screens/restaurant_list_screen.dart';
import '../screens/notifications_screen.dart';
import '../screens/onboarding_welcome_screen.dart';
import '../screens/onboarding_location_screen.dart';
import '../screens/onboarding_notification_screen.dart';
import '../screens/loyalty_screen.dart';
import '../screens/wallet_screen.dart';
import '../screens/referral_screen.dart';
import '../screens/help_center_screen.dart';
import '../screens/restaurant_filters_screen.dart';
import '../screens/address_picker_screen.dart';
import '../screens/favorites_screen.dart';
import '../screens/search_results_screen.dart';
import '../screens/vouchers_screen.dart';
import '../screens/cancel_order_screen.dart';
import '../../shared/models/menu_item.dart';
import 'route_guards.dart';
import 'route_names.dart';

/// B-MOB-14: safe cast helpers for GoRouter extras.
String? _extraString(Object? extra) {
  if (extra is String && extra.isNotEmpty) return extra;
  return null;
}

Map<String, dynamic> _extraMap(Object? extra) {
  if (extra is Map<String, dynamic>) return extra;
  if (extra is Map) return Map<String, dynamic>.from(extra);
  return const {};
}

/// Central GoRouter configuration for customer-facing flows.
///
/// Uses [authGuard] redirect for route protection. Path constants come from
/// [Routes] to prevent string drift. New routes should be added here, not
/// in main_customer.dart.
final appRouter = GoRouter(
  initialLocation: Routes.splash,
  redirect: (context, state) => authGuard(context, state),
  routes: [
    GoRoute(
      path: '/splash',
      name: 'splash',
      builder: (context, state) => const SplashScreen(),
    ),
    GoRoute(
      path: '/login',
      name: 'login',
      builder: (context, state) => const LoginScreen(),
    ),
    GoRoute(
      path: '/register',
      name: 'register',
      builder: (context, state) => const RegisterScreen(),
    ),
    GoRoute(
      path: '/home',
      name: 'home',
      builder: (context, state) => const HomeScreen(),
    ),
    GoRoute(
      path: '/restaurant-detail',
      name: 'restaurant-detail',
      builder: (context, state) {
        final restaurantId = _extraString(state.extra) ?? '';
        return RestaurantDetailScreen(restaurantId: restaurantId);
      },
    ),
    GoRoute(
      path: '/food-detail',
      name: 'food-detail',
      builder: (context, state) {
        final args = _extraMap(state.extra);
        final item = args['item'];
        return FoodDetailScreen(
          item: item is MenuItemModel
              ? item
              : MenuItemModel(
                  id: '',
                  restaurantId: '',
                  name: '',
                  price: 0,
                  category: '',
                ),
          restaurantName: args['restaurantName'] as String? ?? '',
        );
      },
    ),
    GoRoute(
      path: '/cart',
      name: 'cart',
      builder: (context, state) => const CartScreen(),
    ),
    GoRoute(
      path: '/checkout',
      name: 'checkout',
      builder: (context, state) => const CheckoutScreen(),
    ),
    GoRoute(
      path: '/order-tracking',
      name: 'order-tracking',
      builder: (context, state) {
        final orderId = _extraString(state.extra) ?? '';
        return OrderTrackingScreen(orderId: orderId);
      },
    ),
    // B-MOB-09: path-style deep link /orders/:id → tracking with extra.
    GoRoute(
      path: '/orders/:orderId',
      name: 'order-detail-deep-link',
      builder: (context, state) {
        final orderId = state.pathParameters['orderId'] ?? '';
        return OrderTrackingScreen(orderId: orderId);
      },
    ),
    GoRoute(
      path: '/chat',
      name: 'chat',
      builder: (context, state) {
        final orderId = _extraString(state.extra) ?? '';
        return ChatScreen(orderId: orderId);
      },
    ),
    GoRoute(
      path: '/orders',
      name: 'orders',
      builder: (context, state) => const OrderHistoryScreen(),
    ),
    GoRoute(
      path: '/profile',
      name: 'profile',
      builder: (context, state) => const ProfileScreen(),
    ),
    GoRoute(
      path: '/addresses',
      name: 'addresses',
      builder: (context, state) => const AddressManagementScreen(),
    ),
    GoRoute(
      path: '/review',
      name: 'review',
      builder: (context, state) {
        final orderId = _extraString(state.extra) ?? '';
        return ReviewScreen(orderId: orderId);
      },
    ),
    GoRoute(
      path: '/location-permission',
      name: 'location-permission',
      builder: (context, state) => const LocationPermissionScreen(),
    ),
    GoRoute(
      path: '/restaurants',
      name: 'restaurants',
      builder: (context, state) => const RestaurantListScreen(),
    ),
    GoRoute(
      path: '/notifications',
      name: 'notifications',
      builder: (context, state) => const NotificationsScreen(),
    ),
    GoRoute(
      path: '/search',
      name: 'search',
      builder: (context, state) {
        final query = _extraString(state.extra) ?? '';
        return SearchResultsScreen(initialQuery: query);
      },
    ),
    GoRoute(
      path: '/favorites',
      name: 'favorites',
      builder: (context, state) => const FavoritesScreen(),
    ),
    GoRoute(
      path: '/vouchers',
      name: 'vouchers',
      builder: (context, state) => const VouchersScreen(),
    ),
    GoRoute(
      path: '/cancel-order',
      name: 'cancel-order',
      builder: (context, state) {
        final args = _extraMap(state.extra);
        return CancelOrderScreen(
          orderId: args['orderId'] as String? ?? '',
          restaurantName: args['restaurantName'] as String?,
          orderSummary: args['orderSummary'] as String?,
          totalAmount: (args['totalAmount'] as num?)?.toInt(),
        );
      },
    ),
    GoRoute(
      path: '/onboarding',
      name: 'onboarding',
      builder: (context, state) => const OnboardingWelcomeScreen(),
    ),
    GoRoute(
      path: '/onboarding-location',
      name: 'onboarding-location',
      builder: (context, state) => const OnboardingLocationScreen(),
    ),
    GoRoute(
      path: '/onboarding-notifications',
      name: 'onboarding-notifications',
      builder: (context, state) => const OnboardingNotificationScreen(),
    ),
    GoRoute(
      path: '/loyalty',
      name: 'loyalty',
      builder: (context, state) => const LoyaltyScreen(),
    ),
    GoRoute(
      path: '/wallet',
      name: 'wallet',
      builder: (context, state) => const WalletScreen(),
    ),
    GoRoute(
      path: '/referral',
      name: 'referral',
      builder: (context, state) => const ReferralScreen(),
    ),
    GoRoute(
      path: '/help',
      name: 'help',
      builder: (context, state) => const HelpCenterScreen(),
    ),
    GoRoute(
      path: '/restaurant-filters',
      name: 'restaurant-filters',
      builder: (context, state) {
        final initial = state.extra is RestaurantFilters
            ? state.extra as RestaurantFilters
            : null;
        return RestaurantFiltersScreen(
          initial: initial ?? const RestaurantFilters(),
        );
      },
    ),
    GoRoute(
      path: '/address-picker',
      name: 'address-picker',
      builder: (context, state) => const AddressPickerScreen(),
    ),
  ],
);
