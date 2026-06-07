// ignore: unused_import
import 'package:intl/intl.dart' as intl;
import 'app_localizations.dart';

// ignore_for_file: type=lint

/// The translations for English (`en`).
class AppLocalizationsEn extends AppLocalizations {
  AppLocalizationsEn([String locale = 'en']) : super(locale);

  @override
  String get loginTitle => 'Login';

  @override
  String get loginWelcomeBack => 'Welcome back';

  @override
  String get emailLabel => 'Email';

  @override
  String get emailHint => 'Enter your email';

  @override
  String get emailRequired => 'Please enter your email';

  @override
  String get emailInvalid => 'Invalid email address';

  @override
  String get passwordLabel => 'Password';

  @override
  String get passwordHint => 'Enter your password';

  @override
  String get passwordRequired => 'Please enter your password';

  @override
  String get passwordMinLength => 'Password must be at least 6 characters';

  @override
  String get forgotPassword => 'Forgot password?';

  @override
  String get forgotPasswordTitle => 'Forgot Password';

  @override
  String get forgotPasswordContent =>
      'Please contact support via email to reset your password.';

  @override
  String get close => 'Close';

  @override
  String get loginButton => 'Login';

  @override
  String get noAccount => 'Don\'t have an account?';

  @override
  String get registerLink => 'Register';

  @override
  String get registerAsDriver => 'Register as a driver';

  @override
  String get registerTitle => 'Register';

  @override
  String get registerCreateAccount => 'Create a new account';

  @override
  String get registerSubtitle => 'Fill in the details to start using FoodFlow';

  @override
  String get fullNameLabel => 'Full name';

  @override
  String get fullNameHint => 'Enter your full name';

  @override
  String get fullNameRequired => 'Please enter your full name';

  @override
  String get fullNameMinLength => 'Name must be at least 2 characters';

  @override
  String get phoneLabel => 'Phone number';

  @override
  String get phoneHint => 'Enter your phone number';

  @override
  String get phoneRequired => 'Please enter your phone number';

  @override
  String get phoneInvalid => 'Invalid phone number';

  @override
  String get passwordHintLong => 'Enter password (at least 6 characters)';

  @override
  String get confirmPasswordLabel => 'Confirm password';

  @override
  String get confirmPasswordHint => 'Re-enter your password';

  @override
  String get confirmPasswordRequired => 'Please confirm your password';

  @override
  String get passwordMismatch => 'Passwords do not match';

  @override
  String get registerAs => 'Register as?';

  @override
  String get roleCustomer => 'Customer';

  @override
  String get roleDriver => 'Driver';

  @override
  String get registerButton => 'Register';

  @override
  String get hasAccount => 'Already have an account?';

  @override
  String get greetingAnonymous => 'Hello!';

  @override
  String greetingNamed(String name) {
    return 'Hello, $name!';
  }

  @override
  String get homeQuestion => 'What would you like to eat today?';

  @override
  String get locating => 'Locating...';

  @override
  String get searchHint => 'Search for food, restaurants...';

  @override
  String get nearbyRestaurants => 'Nearby Restaurants';

  @override
  String get viewAll => 'View all';

  @override
  String get loadingRestaurants => 'Finding nearby restaurants...';

  @override
  String get noRestaurantsTitle => 'No restaurants found';

  @override
  String get noRestaurantsSubtitle => 'Try expanding your search area';

  @override
  String get reload => 'Reload';

  @override
  String get navHome => 'Home';

  @override
  String get navSearch => 'Search';

  @override
  String get navCart => 'Cart';

  @override
  String get navOrders => 'Orders';

  @override
  String get navProfile => 'Profile';

  @override
  String get navEarnings => 'Earnings';

  @override
  String get cuisineAll => 'All';

  @override
  String get cuisineFastFood => 'Fast Food';

  @override
  String get cuisineVietnamese => 'Vietnamese';

  @override
  String get cuisineJapanese => 'Japanese';

  @override
  String get cuisineKorean => 'Korean';

  @override
  String get cuisineChinese => 'Chinese';

  @override
  String get cuisineDessert => 'Dessert';

  @override
  String get cuisineDrinks => 'Drinks';

  @override
  String get profileTitle => 'Profile';

  @override
  String get defaultUser => 'User';

  @override
  String get statsOrders => 'Orders';

  @override
  String get statsReviews => 'Reviews';

  @override
  String get statsAddresses => 'Addresses';

  @override
  String get statsPoints => 'Points';

  @override
  String get myAddresses => 'My Addresses';

  @override
  String get myAddressesSubtitle => 'Manage delivery addresses';

  @override
  String get paymentMethods => 'Payment Methods';

  @override
  String get paymentMethodsSubtitle => 'Add or change payment method';

  @override
  String get notificationsTitle => 'Notifications';

  @override
  String get notificationsSubtitle => 'Manage push notifications';

  @override
  String get favorites => 'Favorites';

  @override
  String get favoritesSubtitle => 'Your favorite dishes';

  @override
  String get support => 'Support';

  @override
  String get supportSubtitle => 'Help center';

  @override
  String get aboutApp => 'About FoodFlow';

  @override
  String get aboutSubtitle => 'Version 1.0.0';

  @override
  String get logout => 'Logout';

  @override
  String get logoutConfirm => 'Are you sure you want to logout?';

  @override
  String get cancel => 'Cancel';

  @override
  String get featureInDevelopment => 'Feature coming soon';

  @override
  String get driverProfileTitle => 'Profile';

  @override
  String get defaultDriver => 'Driver';

  @override
  String get vehicleInfo => 'Vehicle Information';

  @override
  String get vehicleType => 'Vehicle Type';

  @override
  String get vehiclePlate => 'Plate Number';

  @override
  String get statistics => 'Statistics';

  @override
  String get totalDeliveries => 'Total Deliveries';

  @override
  String get totalEarnings => 'Total Earnings';

  @override
  String get languageTitle => 'Language';

  @override
  String get languageVi => 'Tiếng Việt';

  @override
  String get languageEn => 'English';

  @override
  String get languageJa => '日本語';

  @override
  String get orderStatusPending => 'Pending';

  @override
  String get orderStatusConfirmed => 'Confirmed';

  @override
  String get orderStatusPreparing => 'Preparing';

  @override
  String get orderStatusPickedUp => 'On the way';

  @override
  String get orderStatusDelivered => 'Delivered';

  @override
  String get orderStatusCancelled => 'Cancelled';
}
