/// Typed route name constants for go_router navigation.
///
/// Usage: `context.go(Routes.home)` or `context.push(Routes.favorites)`
class Routes {
  Routes._();

  // Auth
  static const splash = '/splash';
  static const login = '/login';
  static const register = '/register';
  static const registerDriver = '/register-driver';

  // Main
  static const home = '/home';
  static const search = '/search';
  static const favorites = '/favorites';
  static const vouchers = '/vouchers';
  static const foodflowPro = '/foodflow-pro';

  // Restaurants
  static const restaurants = '/restaurants';
  static const restaurantDetail = '/restaurant-detail';
  static const foodDetail = '/food-detail';
  static const restaurantFilters = '/restaurant-filters';

  // Orders
  static const cart = '/cart';
  static const checkout = '/checkout';
  static const orders = '/orders';
  static const orderTracking = '/order-tracking';
  static const cancelOrder = '/cancel-order';
  static const review = '/review';

  // Profile
  static const profile = '/profile';
  static const addresses = '/addresses';
  static const addressPicker = '/address-picker';
  static const wallet = '/wallet';
  static const loyalty = '/loyalty';
  static const referral = '/referral';
  static const help = '/help';
  static const notifications = '/notifications';

  // Onboarding
  static const onboarding = '/onboarding';
  static const onboardingLocation = '/onboarding-location';
  static const onboardingNotification = '/onboarding-notifications';

  // Support
  static const chat = '/chat';
  static const locationPermission = '/location-permission';
}

/// URI schemes for deep linking.
class DeepLinkScheme {
  DeepLinkScheme._();

  static const foodflow = 'foodflow';
  static const https = 'https';
}

/// Deep link path patterns.
class DeepLinkPaths {
  DeepLinkPaths._();

  static const orderDetail = '/order';
  static const restaurant = '/restaurant';
  static const promo = '/promo';
}
