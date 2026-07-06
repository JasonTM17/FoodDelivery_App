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
  String get profileLoyalty => 'Loyalty Rewards';

  @override
  String get profileLoyaltySubtitle => 'View points and redeem';

  @override
  String get profileWallet => 'My Wallet';

  @override
  String get profileWalletSubtitle => 'Balance and transactions';

  @override
  String get profileReferral => 'Invite Friends';

  @override
  String get profileReferralSubtitle => 'Earn rewards by referring';

  @override
  String get profileHelp => 'Help & FAQ';

  @override
  String get profileHelpSubtitle => 'Common questions + contact';

  @override
  String get paymentMethods => 'Payment Methods';

  @override
  String get paymentMethodsSubtitle => 'Add or change payment method';

  @override
  String get notificationsTitle => 'Notifications';

  @override
  String get notificationsSubtitle => 'Manage push notifications';

  @override
  String get notificationsReadAll => 'Read all';

  @override
  String get notificationsAll => 'All';

  @override
  String get notificationsOrders => 'Orders';

  @override
  String get notificationsPromotions => 'Promotions';

  @override
  String get notificationsSystem => 'System';

  @override
  String get notificationsEmptyTitle => 'No notifications';

  @override
  String get notificationsEmptySubtitle =>
      'You do not have any notifications yet.';

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
  String get commonRetry => 'Retry';

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

  @override
  String get cartTitle => 'Cart';

  @override
  String get cartEmpty => 'Your cart is empty';

  @override
  String get cartEmptySubtitle => 'Add some food to get started';

  @override
  String get cartClearTitle => 'Clear cart?';

  @override
  String get cartClearContent =>
      'Are you sure you want to remove all items from your cart?';

  @override
  String get cartKeep => 'Keep';

  @override
  String get cartClearAll => 'Clear all';

  @override
  String get cartPromoCode => 'Promo code';

  @override
  String get cartPromoHint => 'Enter discount code';

  @override
  String get cartPromoRemove => 'Remove';

  @override
  String get cartPromoApply => 'Apply';

  @override
  String cartPromoApplied(String code) {
    return 'Applied code $code';
  }

  @override
  String get cartSubtotal => 'Subtotal';

  @override
  String get cartDeliveryFee => 'Delivery fee';

  @override
  String get cartDeliveryFeeLoading => 'Loading from server…';

  @override
  String get cartDeliveryFeeUnavailable => 'Unavailable';

  @override
  String get cartFreeDelivery => 'Free';

  @override
  String get cartDiscountLabel => 'Discount';

  @override
  String get cartGrandTotal => 'Total';

  @override
  String get cartViewCart => 'View cart';

  @override
  String get cartDelete => 'Delete';

  @override
  String get checkoutTitle => 'Checkout';

  @override
  String get checkoutDeliveryAddress => 'Delivery address';

  @override
  String get checkoutNoAddress => 'No addresses saved';

  @override
  String get checkoutNoAddressSubtitle => 'Add an address to continue ordering';

  @override
  String get checkoutAddAddress => 'Add new address';

  @override
  String get checkoutPaymentMethod => 'Payment method';

  @override
  String get checkoutPaymentCash => 'Cash';

  @override
  String get checkoutPaymentCashSubtitle => 'Pay on delivery';

  @override
  String get checkoutPaymentWallet => 'E-wallet';

  @override
  String get checkoutNoteForDriver => 'Note for driver';

  @override
  String get checkoutNoteHint => 'Add a note...';

  @override
  String get checkoutOrderSummary => 'Order summary';

  @override
  String get checkoutSelectAddress => 'Please select a delivery address';

  @override
  String get checkoutOrderFailed => 'Order failed';

  @override
  String get addressDefault => 'Default';

  @override
  String get restaurantListTitle => 'Nearby';

  @override
  String get restaurantViewList => 'List';

  @override
  String get restaurantViewMap => 'Map';

  @override
  String get restaurantNoResults => 'No restaurants found';

  @override
  String get restaurantNoResultsSubtitle => 'Try a different filter';

  @override
  String get restaurantMenuTab => 'Menu';

  @override
  String get restaurantReviewsTab => 'Reviews';

  @override
  String get restaurantInfoTab => 'Info';

  @override
  String get restaurantMenuEmpty => 'Menu updating';

  @override
  String get restaurantMenuEmptySubtitle => 'No items in this menu yet';

  @override
  String get restaurantNoReviews => 'No reviews yet';

  @override
  String get restaurantInfoTitle => 'Restaurant info';

  @override
  String get restaurantReviewFood => 'Food';

  @override
  String get restaurantReviewDelivery => 'Delivery';

  @override
  String get restaurantReviewCountLabel => 'Reviews';

  @override
  String get foodPopular => 'Popular';

  @override
  String get foodSpecialNote => 'Special instructions';

  @override
  String get foodNoteHint => 'e.g. No onion, less spicy...';

  @override
  String get foodRequired => '(Required)';

  @override
  String get foodAddToCart => 'Add to cart';

  @override
  String get trackingOrderStatus => 'Order status';

  @override
  String get trackingStepPending => 'Waiting confirmation';

  @override
  String get trackingStepPreparing => 'Preparing';

  @override
  String get trackingStepDelivering => 'On the way';

  @override
  String get trackingStepDelivered => 'Delivered';

  @override
  String get trackingOrderInProgress => 'Your order is on the way';

  @override
  String get trackingCallDriver => 'Call';

  @override
  String get trackingMessageDriver => 'Message';

  @override
  String get trackingMarkerRestaurant => 'Restaurant';

  @override
  String get trackingMarkerDriver => 'Driver';

  @override
  String get trackingMarkerDestination => 'Destination';

  @override
  String get orderHistoryTitle => 'My Orders';

  @override
  String orderHistoryTabActive(int count) {
    return 'Active ($count)';
  }

  @override
  String orderHistoryTabCompleted(int count) {
    return 'Completed ($count)';
  }

  @override
  String orderHistoryTabCancelled(int count) {
    return 'Cancelled ($count)';
  }

  @override
  String get orderHistoryNoActive => 'No active orders';

  @override
  String get orderHistoryNoCompleted => 'No completed orders yet';

  @override
  String get orderHistoryNoCancelled => 'No cancelled orders';

  @override
  String get orderHistoryEmptySubtitle => 'Orders will appear here';

  @override
  String get orderHistoryTrack => 'Track';

  @override
  String get addressManagementTitle => 'My Addresses';

  @override
  String get addressAdd => 'Add address';

  @override
  String get addressLoading => 'Loading addresses...';

  @override
  String get addressEmpty => 'No addresses saved';

  @override
  String get addressEmptySubtitle => 'Add an address to start ordering';

  @override
  String get addressSetDefault => 'Set as default';

  @override
  String get addressEdit => 'Edit';

  @override
  String get addressDeleteTitle => 'Delete address?';

  @override
  String addressDeleteContent(String label) {
    return 'Delete \"$label\"?';
  }

  @override
  String get addressAddSuccess => 'Address added';

  @override
  String get addressUpdateSuccess => 'Address updated';

  @override
  String get addressDeleteSuccess => 'Address deleted';

  @override
  String get addressSave => 'Save';

  @override
  String get addressLabelField => 'Label';

  @override
  String get addressFieldLabel => 'Address';

  @override
  String get addressFieldHint => 'Enter detailed address';

  @override
  String get addressRequired => 'Please enter an address';

  @override
  String get addressAddDialogTitle => 'Add new address';

  @override
  String get addressEditDialogTitle => 'Edit address';

  @override
  String get addressAddFailed => 'Unable to add address';

  @override
  String get addressLocationRequired =>
      'Please choose a valid location on the map.';

  @override
  String get addressLocationInvalid =>
      'The address location is invalid. Please choose it again on the map.';

  @override
  String get addressUpdateFailed => 'Unable to update address';

  @override
  String get addressDeleteFailed => 'Unable to delete address';

  @override
  String get addressDeleteAction => 'Delete';

  @override
  String get addressHomeLabel => 'Home';

  @override
  String get addressWorkLabel => 'Work';

  @override
  String get addressOtherLabel => 'Other';

  @override
  String get supportConnecting => 'Connecting...';

  @override
  String get supportDriverOnline => 'Online';

  @override
  String get supportAiHeader =>
      'AI-powered support — quick answers to common questions';

  @override
  String get supportNoMessages => 'No messages yet';

  @override
  String get supportNoMessagesSubtitle =>
      'Send your first message to start chatting';

  @override
  String get supportMessageHint => 'Type a message...';

  @override
  String get reviewTitle => 'Rate your order';

  @override
  String get reviewFoodQuality => 'Food quality';

  @override
  String get reviewDeliveryQuality => 'Delivery quality';

  @override
  String get reviewComment => 'Your comments';

  @override
  String get reviewCommentHint =>
      'Share your experience with the food and delivery service...';

  @override
  String get reviewSubmit => 'Submit review';

  @override
  String get reviewSuccess => 'Review submitted!';

  @override
  String get reviewError => 'Something went wrong. Please try again.';

  @override
  String get reviewRatingExcellent => 'Excellent!';

  @override
  String get reviewRatingGood => 'Good';

  @override
  String get reviewRatingAverage => 'Average';

  @override
  String get reviewRatingPoor => 'Poor';

  @override
  String get reviewRatingBad => 'Very bad';

  @override
  String get driverDashboardToday => 'Today';

  @override
  String get driverDashboardOrders => 'Recent orders';

  @override
  String get driverDashboardNoOrders => 'No orders yet';

  @override
  String get driverStatEarnings => 'Earnings';

  @override
  String get driverStatOnline => 'Online';

  @override
  String get driverStatusTitle => 'Availability status';

  @override
  String get driverStatusPauseTitle => 'Pause order intake';

  @override
  String get driverStatusPauseSubtitle =>
      'Pause for a set time, then automatically return online.';

  @override
  String driverStatusPauseMinutes(int minutes) {
    return '$minutes min';
  }

  @override
  String driverStatusPauseHours(int hours) {
    return '$hours hr';
  }

  @override
  String get driverStatusResumeNow => 'Resume taking orders now';

  @override
  String get driverStatusToday => 'Today';

  @override
  String get driverStatusOnlineTime => 'Online time';

  @override
  String driverStatusDurationMinutes(int minutes) {
    return '${minutes}m';
  }

  @override
  String driverStatusDurationHoursMinutes(int hours, int minutes) {
    return '${hours}h ${minutes}m';
  }

  @override
  String get driverStatusInfoText =>
      'When online, you will receive new order alerts in your active area.';

  @override
  String get driverEarningsTitle => 'Earnings';

  @override
  String get driverEarningsPeriodToday => 'Today';

  @override
  String get driverEarningsPeriodWeek => 'This week';

  @override
  String get driverEarningsPeriodMonth => 'This month';

  @override
  String get driverEarningsTotal => 'Total earnings';

  @override
  String get driverEarningsAverage => 'Avg per order';

  @override
  String get driverEarningsHistory => 'Delivery history';

  @override
  String get driverEarningsEmpty => 'No earnings data yet';

  @override
  String get driverEarningsChartError => 'Unable to load earnings chart';

  @override
  String get driverEarningsChartRetry => 'Retry';

  @override
  String get driverRatingsTitle => 'Rating history';

  @override
  String get driverRatingsAll => 'All';

  @override
  String driverRatingsStars(int count) {
    return '$count stars';
  }

  @override
  String get driverRatingsEmpty => 'No ratings yet';

  @override
  String get driverRatingsError => 'Unable to load ratings right now.';

  @override
  String get driverRatingsRetry => 'Retry';

  @override
  String driverRatingsOrder(String code) {
    return 'Order: $code';
  }

  @override
  String get driverRatingsToday => 'Today';

  @override
  String get driverRatingsYesterday => 'Yesterday';

  @override
  String get driverTripDetailTitle => 'Trip details';

  @override
  String get driverTripDetailSegments => 'Route steps';

  @override
  String get driverTripDetailRetry => 'Retry';

  @override
  String get driverTripDetailNoRoute => 'No route data for this trip yet';

  @override
  String get driverTripDetailLoadError => 'Unable to load trip route';

  @override
  String driverTripDetailOrder(String code) {
    return 'Order: $code';
  }

  @override
  String get driverTripSummaryDistance => 'Distance';

  @override
  String get driverTripSummaryDuration => 'Duration';

  @override
  String get driverTripSummaryAvgSpeed => 'Avg speed';

  @override
  String get driverTripSummaryEarnings => 'Earnings';

  @override
  String get driverTripSummaryCustomerRating => 'Customer rating';

  @override
  String driverTripSummaryMinutes(int minutes) {
    return '$minutes min';
  }

  @override
  String get driverRouteReplayTooltip => 'Replay route';

  @override
  String get driverRouteReplayPlaying => 'Playing...';

  @override
  String get driverRouteReplayReady => 'Tap to replay';

  @override
  String get driverRouteReplayCompleted => 'Replay finished';

  @override
  String get driverKycTitle => 'KYC Verification';

  @override
  String get driverKycUploadTitle => 'Upload documents';

  @override
  String get driverKycUploadSubtitle => 'Please upload all required documents';

  @override
  String get driverKycCccdFront => 'ID card (front)';

  @override
  String get driverKycCccdBack => 'ID card (back)';

  @override
  String get driverKycDriverLicense => 'Driver license';

  @override
  String get driverKycVehicleReg => 'Vehicle registration';

  @override
  String get driverKycTakePhoto => 'Take photo';

  @override
  String get driverKycGallery => 'Choose from gallery';

  @override
  String get driverKycUploadHint => 'Take photo or upload';

  @override
  String get driverKycSubmit => 'SUBMIT APPLICATION';

  @override
  String get driverKycNote =>
      'Application reviewed in 24-48h. You will be notified when approved.';

  @override
  String get driverKycSubmitFailed =>
      'Could not submit application. Please try again.';

  @override
  String get driverHistoryTitle => 'Delivery history';

  @override
  String get driverHistoryFilterDate => 'Filter by date';

  @override
  String get driverHistoryEmpty => 'No delivery history';

  @override
  String get driverHistoryLoadError =>
      'Unable to load delivery history. Please try again.';

  @override
  String get driverHistoryRetry => 'Try again';

  @override
  String get driverHistoryDeliveryFee => 'Delivery fee';

  @override
  String get locationPermissionTitle => 'Allow location access';

  @override
  String get locationPermissionSubtitle =>
      'FoodFlow needs your location to find nearby restaurants and deliver accurately.';

  @override
  String get locationPermissionAllow => 'Allow';

  @override
  String get locationPermissionManual => 'Enter address manually';

  @override
  String get driverNavTitle => 'Delivery';

  @override
  String get driverNavNoOrder => 'No active order';

  @override
  String get driverNavRestaurant => 'Restaurant';

  @override
  String get driverNavCallRestaurant => 'Call restaurant';

  @override
  String get driverNavDeliveryAddress => 'Delivery address';

  @override
  String get driverNavArrivedAtRestaurant => 'ARRIVED AT RESTAURANT';

  @override
  String get driverNavPreparingFood => 'Preparing food';

  @override
  String get driverNavItemsToPickup => 'Items to pick up';

  @override
  String get driverNavConfirmPickup => 'CONFIRM PICKUP';

  @override
  String get driverNavEta => 'ETA - Estimated arrival';

  @override
  String driverNavEtaMinutes(int minutes) {
    return 'About $minutes min';
  }

  @override
  String get driverNavEtaUnavailable => 'Waiting for route ETA';

  @override
  String get driverNavCustomerAddress => 'Customer address';

  @override
  String get driverNavCallCustomer => 'Call customer';

  @override
  String get driverNavConfirmDelivery => 'CONFIRM DELIVERY';

  @override
  String get driverNavDeliverySuccess => 'Delivery successful!';

  @override
  String get driverNavOrderTotal => 'Order total';

  @override
  String get driverNavYouEarned => 'You earned';

  @override
  String get driverNavGoHome => 'GO TO HOME';

  @override
  String get driverPickupTitle => 'Confirm pickup';

  @override
  String get driverPickupRestaurantNoteTitle => 'Restaurant note';

  @override
  String get driverPickupHint => 'Check every item before confirming';

  @override
  String get driverPickupReportIssue => 'Report an issue';

  @override
  String get driverPickupReportSupportMessage =>
      'Support will be connected right away.';

  @override
  String get driverPickupMissingTitle =>
      'No order data is available to confirm.';

  @override
  String get driverPickupMissingDescription =>
      'Open this screen from an active order.';

  @override
  String get driverDeliveryCompleteSubtitle =>
      'Thanks for completing this delivery';

  @override
  String get driverDeliveryTripEarnings => 'Trip earnings';

  @override
  String get driverDeliveryBonus => 'Bonus';

  @override
  String get driverDeliveryContinue => 'CONTINUE ACCEPTING ORDERS';

  @override
  String get driverDeliveryMissingTitle =>
      'No trip earnings data is available.';

  @override
  String get driverDeliveryMissingDescription =>
      'Open this screen from a completed order.';

  @override
  String get driverNavPhoneError => 'Cannot open phone dialer';

  @override
  String get driverNavOpenDirections => 'Open directions';

  @override
  String get driverNavDirectionsUnavailable =>
      'Directions are unavailable for this stop';

  @override
  String get driverDispatchNewOrderTitle => 'New order!';

  @override
  String get driverDispatchNewOrderSubtitle => 'Accept to start the delivery';

  @override
  String get driverDispatchRestaurantLabel => 'Restaurant';

  @override
  String get driverDispatchDeliveryLabel => 'Deliver to';

  @override
  String driverDispatchCountdownDecision(int seconds) {
    return '$seconds seconds left to decide';
  }

  @override
  String get driverDispatchCountdownUrgent => 'Almost out of time!';

  @override
  String get driverDispatchReject => 'Reject';

  @override
  String get driverDispatchAccept => 'Accept order';

  @override
  String get cartPlaceOrder => 'Place order';

  @override
  String get checkoutConfirmOrder => 'Confirm order';

  @override
  String get onboardingSkip => 'Skip';

  @override
  String get onboardingNext => 'Next';

  @override
  String get onboardingGetStarted => 'Get Started';

  @override
  String get onboardingWelcomeTitle => 'Welcome to FoodFlow';

  @override
  String get onboardingWelcomeSubtitle =>
      'Order your favorite food, delivered fast to your door';

  @override
  String get onboardingLocationTitle => 'Find Restaurants Near You';

  @override
  String get onboardingLocationSubtitle =>
      'Allow location access to discover the best restaurants around you';

  @override
  String get onboardingNotificationTitle => 'Real-time Order Updates';

  @override
  String get onboardingNotificationSubtitle =>
      'Get notified when your order is confirmed and on its way';

  @override
  String get loyaltyTitle => 'Loyalty Points';

  @override
  String get loyaltyPointsBalance => 'Current Balance';

  @override
  String loyaltyPoints(int count) {
    return '$count pts';
  }

  @override
  String get loyaltyTierBronze => 'Bronze';

  @override
  String get loyaltyTierSilver => 'Silver';

  @override
  String get loyaltyTierGold => 'Gold';

  @override
  String get loyaltyTierPlatinum => 'Platinum';

  @override
  String get loyaltyNextTier => 'Next Tier';

  @override
  String loyaltyPointsToNextTier(int points) {
    return 'Need $points more points to level up';
  }

  @override
  String get loyaltyHistory => 'Points History';

  @override
  String get loyaltyHistoryEmpty => 'No points history yet';

  @override
  String get loyaltyRedeem => 'Redeem Points';

  @override
  String get loyaltyEarnPoints => 'How to Earn Points';

  @override
  String get loyaltyEarnOrderDesc => 'Each completed order = 10 points';

  @override
  String get loyaltyEarnReferralDesc => 'Each successful referral = 50 points';

  @override
  String get walletTitle => 'Wallet';

  @override
  String get walletBalance => 'Balance';

  @override
  String get walletTopUp => 'Top Up';

  @override
  String get walletWithdraw => 'Withdraw';

  @override
  String get walletTransactionHistory => 'Transaction History';

  @override
  String get walletTransactionEmpty => 'No transactions yet';

  @override
  String get walletTopUpTitle => 'Top Up Wallet';

  @override
  String get walletSelectAmount => 'Select Amount';

  @override
  String get walletConfirmTopUp => 'Confirm Top Up';

  @override
  String get walletDebit => 'Debit';

  @override
  String get walletCredit => 'Credit';

  @override
  String get walletReasonOrderPayment => 'Order payment';

  @override
  String get walletReasonOrderRefund => 'Order refund';

  @override
  String get walletReasonWithdrawal => 'Withdrawal';

  @override
  String get walletReasonAdjustment => 'Wallet adjustment';

  @override
  String get referralTitle => 'Refer a Friend';

  @override
  String get referralSubtitle => 'Share your referral code and earn rewards';

  @override
  String get referralCode => 'Your Referral Code';

  @override
  String get referralCopyCode => 'Copy Code';

  @override
  String get referralCodeCopied => 'Code copied!';

  @override
  String get referralShareCode => 'Share Code';

  @override
  String get referralShareSheetTitle => 'Share referral code';

  @override
  String referralShareMessage(String code) {
    return 'Use code $code to get a reward on your first FoodFlow order!';
  }

  @override
  String referralInviteCount(int count) {
    return 'Invited $count friends';
  }

  @override
  String get referralBonusEarned => 'Bonus Earned';

  @override
  String get referralHowItWorks => 'How It Works';

  @override
  String get referralStep1 => 'Share your referral code';

  @override
  String get referralStep2 => 'Friend signs up and places first order';

  @override
  String get referralStep3 => 'Both of you earn 50 points';

  @override
  String get helpTitle => 'Help Center';

  @override
  String get helpSearchHint => 'Search questions...';

  @override
  String get helpFaq => 'Frequently Asked Questions';

  @override
  String get helpFaqEmpty => 'No questions found';

  @override
  String get helpChatSupport => 'Chat Support';

  @override
  String get helpCallSupport => 'Call Support';

  @override
  String get helpEmailSupport => 'Email Support';

  @override
  String get helpCategories => 'Categories';

  @override
  String get helpCategoryOrders => 'Orders';

  @override
  String get helpCategoryPayment => 'Payment';

  @override
  String get helpCategoryDelivery => 'Delivery';

  @override
  String get helpCategoryAccount => 'Account';

  @override
  String get filterTitle => 'Filters';

  @override
  String get filterApply => 'Apply';

  @override
  String get filterReset => 'Reset';

  @override
  String get filterRating => 'Rating';

  @override
  String get filterDeliveryTime => 'Delivery Time';

  @override
  String get filterPriceRange => 'Price Range';

  @override
  String filterMinutes(int min) {
    return '$min min';
  }

  @override
  String get filterFreeDelivery => 'Free Delivery';

  @override
  String get filterOpenNow => 'Open Now';

  @override
  String get addressPickerTitle => 'Select Address';

  @override
  String get addressPickerSearchHint => 'Search address...';

  @override
  String get addressPickerUseCurrentLocation => 'Use current location';

  @override
  String get addressPickerSaved => 'Saved Addresses';

  @override
  String get addressPickerNoSaved => 'No saved addresses';

  @override
  String get addressPickerConfirm => 'Confirm this address';

  @override
  String get driver_onboarding_vehicle_title => 'Vehicle Info';

  @override
  String get driver_onboarding_vehicle_subtitle => 'Tell us about your vehicle';

  @override
  String get driver_onboarding_vehicle_type_label => 'Vehicle type';

  @override
  String get driver_onboarding_vehicle_type_bike => 'Bicycle';

  @override
  String get driver_onboarding_vehicle_type_motorbike => 'Motorbike';

  @override
  String get driver_onboarding_vehicle_type_car => 'Car';

  @override
  String get driver_onboarding_plate_label => 'License plate';

  @override
  String get driver_onboarding_plate_hint => 'Enter license plate';

  @override
  String get driver_onboarding_plate_required => 'Please enter license plate';

  @override
  String get driver_onboarding_next => 'Next';

  @override
  String get driver_onboarding_documents_title => 'Required Documents';

  @override
  String get driver_onboarding_documents_subtitle =>
      'Upload all required documents for review';

  @override
  String get driver_onboarding_agreement_title => 'Driver Terms';

  @override
  String get driver_onboarding_agreement_subtitle =>
      'Read and agree to the terms to get started';

  @override
  String get driver_onboarding_agreement_read =>
      'I have read and agree to the Terms of Service';

  @override
  String get driver_onboarding_agreement_accept => 'Agree and continue';

  @override
  String get driver_onboarding_agreement_submit => 'SUBMIT APPLICATION';

  @override
  String get driver_onboarding_agreement_note =>
      'Application reviewed in 24-48h. You will be notified when approved.';

  @override
  String get driver_onboarding_agreement_terms =>
      '1. FoodFlow driver service\n\nBy registering as a FoodFlow driver, you agree to provide delivery services in your approved operating area.\n\n2. Requirements\n\n• Keep a valid driver license and required vehicle documents.\n• Use a safe, insured vehicle that matches your registered profile.\n• Maintain a professional rating and follow traffic laws.\n• Keep customer, restaurant, and order data confidential.\n\n3. Earnings and settlement\n\nEarnings are calculated from completed orders, distance, incentives, and approved adjustments. Weekly settlement is paid to the bank account saved in FoodFlow.\n\n4. Conduct standards\n\nDrivers must behave professionally with customers, restaurants, and support agents. Fraud, abuse, unsafe delivery, or false reporting can suspend or terminate the account.\n\n5. Termination\n\nFoodFlow may suspend or terminate driver access when these terms, safety rules, or legal requirements are violated.';

  @override
  String get driver_onboarding_agreement_failed =>
      'Could not save agreement. Please try again.';

  @override
  String get driver_incentives_title => 'Incentives';

  @override
  String get driver_incentives_active => 'Active';

  @override
  String get driver_incentives_completed => 'Completed';

  @override
  String driver_incentives_progress(int current, int target) {
    return '$current/$target orders';
  }

  @override
  String driver_incentives_reward(String amount) {
    return 'Reward: $amount';
  }

  @override
  String get driver_incentives_empty => 'No incentives available';

  @override
  String get driver_incentives_error => 'Unable to load incentives';

  @override
  String get driver_incentives_retry => 'Retry';

  @override
  String driver_incentives_expires(String date) {
    return 'Expires: $date';
  }

  @override
  String get driver_heatmap_title => 'Demand Map';

  @override
  String get driver_heatmap_subtitle =>
      'Areas with high delivery demand right now';

  @override
  String get driver_heatmap_high => 'High demand';

  @override
  String get driver_heatmap_medium => 'Medium demand';

  @override
  String get driver_heatmap_low => 'Low demand';

  @override
  String get driver_heatmap_legend => 'Color legend';

  @override
  String get driver_heatmap_window_now => 'Now';

  @override
  String get driver_heatmap_window_next_hour => 'Next 1h';

  @override
  String get driver_heatmap_window_next_three_hours => 'Next 3h';

  @override
  String get driver_heatmap_window_today => 'Today';

  @override
  String get driver_heatmap_missing_location_title =>
      'Driver location unavailable';

  @override
  String get driver_heatmap_missing_location_description =>
      'Go online or wait for GPS to update before loading demand around your real location.';

  @override
  String get driver_heatmap_empty_title => 'No demand data yet';

  @override
  String get driver_heatmap_empty_description =>
      'Demand data appears when orders are available around your current area.';

  @override
  String driver_heatmap_order_count(int count) {
    return '$count orders';
  }

  @override
  String driver_heatmap_avg_payout(String amount) {
    return 'Average $amountđ/order';
  }

  @override
  String get driver_bank_title => 'Bank Account';

  @override
  String get driver_bank_subtitle => 'Add an account to receive weekly payouts';

  @override
  String get driver_bank_name_label => 'Bank name';

  @override
  String get driver_bank_name_hint => 'Select bank';

  @override
  String get driver_bank_account_label => 'Account number';

  @override
  String get driver_bank_account_hint => 'Enter account number';

  @override
  String get driver_bank_account_required => 'Please enter account number';

  @override
  String get driver_bank_save => 'Save account';

  @override
  String get driver_bank_saved => 'Bank account saved';

  @override
  String get driver_bank_verify => 'Verify account';

  @override
  String get driver_bank_add_title => 'Add bank account';

  @override
  String get driver_bank_name_required => 'Please select a bank';

  @override
  String get driver_bank_holder_label => 'Account holder';

  @override
  String get driver_bank_holder_hint => 'NGUYEN VAN A';

  @override
  String get driver_bank_holder_required => 'Please enter account holder name';

  @override
  String get driver_bank_linked_title => 'Linked accounts';

  @override
  String get driver_bank_default_badge => 'Default';

  @override
  String get driver_bank_add_button => 'Add bank account';

  @override
  String get driver_bank_save_failed =>
      'Could not update bank account. Please try again.';

  @override
  String get driver_bank_delete_tooltip => 'Delete bank account';

  @override
  String get driver_bank_delete_title => 'Delete bank account?';

  @override
  String get driver_bank_delete_message =>
      'This removes the payout account from your driver profile.';

  @override
  String get driver_bank_delete_confirm => 'Delete';

  @override
  String get driver_bank_cancel => 'Cancel';

  @override
  String get driver_bank_retry => 'Retry';

  @override
  String get driver_tip_title => 'Tip adjustment';

  @override
  String get driver_tip_header_title => 'Customer added a cash tip?';

  @override
  String get driver_tip_order_prefix => 'Order from';

  @override
  String get driver_tip_customer_prefix => 'Customer';

  @override
  String get driver_tip_picker_title => 'Choose tip amount';

  @override
  String get driver_tip_custom_title => 'Or enter another amount';

  @override
  String get driver_tip_custom_hint => 'Enter amount (VND)';

  @override
  String get driver_tip_skip => 'Skip';

  @override
  String get driver_tip_confirm => 'Confirm';

  @override
  String get driver_tip_success_snackbar => 'Tip report saved';

  @override
  String get driver_tip_success_message =>
      'Tip report saved for audit. Payout settlement is not changed automatically.';

  @override
  String get driver_notifications_read_all => 'Read all';

  @override
  String get driver_notifications_all => 'All';

  @override
  String get driver_notifications_orders => 'Orders';

  @override
  String get driver_notifications_rewards => 'Rewards';

  @override
  String get driver_notifications_system => 'System';

  @override
  String get driver_notifications_empty_title => 'No notifications';

  @override
  String get driver_notifications_empty_subtitle =>
      'You do not have driver notifications yet.';

  @override
  String get driver_notifications_load_failed => 'Could not load notifications';

  @override
  String get driver_notifications_now => 'now';

  @override
  String get driver_notifications_minute_suffix => 'm';

  @override
  String get driver_notifications_hour_suffix => 'h';

  @override
  String get driver_notifications_day_suffix => 'd';

  @override
  String get driver_support_title => 'Driver Support';

  @override
  String get driver_support_subtitle => 'We are always here to help you';

  @override
  String get driver_support_faq => 'Frequently Asked Questions';

  @override
  String get driver_support_contact => 'Contact Support';

  @override
  String get driver_support_chat => 'Live chat';

  @override
  String get driver_support_email => 'Send email';

  @override
  String get driver_support_phone => 'Hotline: 1800-xxxx';

  @override
  String get driver_support_faq_q1 => 'When do I get paid?';

  @override
  String get driver_support_faq_a1 =>
      'Earnings are transferred to your bank account every Monday.';

  @override
  String get driver_support_faq_q2 => 'How do I change my delivery zone?';

  @override
  String get driver_support_faq_a2 =>
      'Go to Settings > Active zones to change your delivery area.';

  @override
  String get driver_settings_title => 'Settings';

  @override
  String get driver_settings_notifications => 'Push notifications';

  @override
  String get driver_settings_notifications_subtitle =>
      'Receive alerts for new orders';

  @override
  String get driver_settings_language => 'Language';

  @override
  String get driver_settings_language_subtitle => 'English';

  @override
  String get driver_settings_privacy => 'Privacy policy';

  @override
  String get driver_settings_about => 'About the app';

  @override
  String get driver_settings_logout => 'Log out';

  @override
  String get driver_settings_logout_confirm =>
      'Are you sure you want to log out?';

  @override
  String get driver_settings_sound => 'Notification sound';

  @override
  String get driver_settings_sound_subtitle =>
      'Play sound when a new order arrives';

  @override
  String driver_settings_version(String version) {
    return 'Version $version';
  }

  @override
  String get favoritesTitle => 'Favorites';

  @override
  String get favoritesEmpty => 'No favorite restaurants yet';

  @override
  String get favoritesEmptySubtitle =>
      'Explore and add restaurants to your favorites';

  @override
  String get favoritesEmptyCta => 'Explore restaurants';

  @override
  String get searchInputHint => 'Search food, restaurants...';

  @override
  String get searchButtonLabel => 'Search';

  @override
  String get searchRecentLabel => 'Recent searches';

  @override
  String get searchClearAll => 'Clear all';

  @override
  String get searchEmptyTitle => 'Search food, restaurants';

  @override
  String get searchEmptySubtitle =>
      'Enter a dish name or restaurant you\'re looking for';

  @override
  String searchNoResults(String query) {
    return 'No results found for \"$query\"';
  }

  @override
  String get searchNoResultsSubtitle => 'Try other keywords or change filters';

  @override
  String get searchClosedBadge => 'Closed';

  @override
  String get searchFilterNearest => 'Nearest';

  @override
  String get searchFilterTopRated => 'Top rated';

  @override
  String get searchFilterPriceLowHigh => 'Price low → high';

  @override
  String get searchFilterOpenNow => 'Open now';

  @override
  String get vouchersTitle => 'Offers & Vouchers';

  @override
  String get vouchersTabMine => 'My vouchers';

  @override
  String get vouchersTabAvailable => 'Available';

  @override
  String get vouchersTabExpired => 'Expired';

  @override
  String get vouchersCodeCopied => 'Code copied';

  @override
  String get vouchersEmptyMine => 'No vouchers yet';

  @override
  String get vouchersEmptyAvailable => 'No vouchers available';

  @override
  String get vouchersEmptyAvailableSubtitle => 'Explore available vouchers';

  @override
  String get vouchersEmptyExpired => 'No expired vouchers';

  @override
  String get vouchersEmptyExpiredSubtitle =>
      'Expired vouchers will appear here';

  @override
  String get vouchersUseNow => 'Use now';

  @override
  String vouchersPercentOff(int percent) {
    return '$percent% off';
  }

  @override
  String vouchersMinOrder(String amount) {
    return 'Min order $amount';
  }

  @override
  String vouchersExpiresAt(String date) {
    return 'Expires: $date';
  }

  @override
  String get cancelOrderTitle => 'Cancel Order';

  @override
  String get cancelOrderSuccess => 'Order cancelled successfully';

  @override
  String get cancelOrderFailed => 'Unable to cancel order';

  @override
  String get cancelOrderInfoHeader => 'Order information';

  @override
  String get cancelOrderReasonHeader => 'Select cancellation reason';

  @override
  String get cancelOrderReasonSubtitle =>
      'We\'re sorry if something wasn\'t right';

  @override
  String get cancelOrderReasonSlow => 'Restaurant too slow';

  @override
  String get cancelOrderReasonChanged => 'Changed my mind';

  @override
  String get cancelOrderReasonWrong => 'Ordered by mistake';

  @override
  String get cancelOrderReasonOther => 'Other';

  @override
  String get cancelOrderNoteHint => 'Additional note (optional)';

  @override
  String get cancelOrderRefundNote => 'Refund within 3-5 business days';

  @override
  String get cancelOrderConfirmCta => 'Confirm cancellation';

  @override
  String get helpCenterSearchHint => 'Search questions...';

  @override
  String get helpCenterChatCta => 'Chat with support';

  @override
  String get helpCenterNoResults => 'No matching questions found';

  @override
  String get helpFaqCancelOrderQ => 'How do I cancel an order?';

  @override
  String get helpFaqCancelOrderA =>
      'You can cancel an order within 2 minutes of placing it. Go to \"Orders\" → select order → tap \"Cancel\".';

  @override
  String get helpFaqLateDeliveryQ => 'What should I do if my order is late?';

  @override
  String get helpFaqLateDeliveryA =>
      'Please contact chat support so we can check directly with the driver.';

  @override
  String get helpFaqPaymentMethodsQ => 'Which payment methods are accepted?';

  @override
  String get helpFaqPaymentMethodsA =>
      'We currently accept cash on delivery and FoodFlow e-wallet.';

  @override
  String get helpFaqTopUpWalletQ => 'How do I top up my wallet?';

  @override
  String get helpFaqTopUpWalletA =>
      'Go to \"Profile\" → \"Wallet\" → tap \"Top Up\" and select the desired amount.';

  @override
  String get helpFaqAddAddressQ => 'How do I add a delivery address?';

  @override
  String get helpFaqAddAddressA =>
      'Go to \"Profile\" → \"My Addresses\" → tap \"Add Address\" and enter the details.';

  @override
  String get helpFaqMissingOrderQ =>
      'I didn\'t receive my order, what should I do?';

  @override
  String get helpFaqMissingOrderA =>
      'If the driver marked the order as delivered but you haven\'t received it, contact support immediately.';

  @override
  String get helpFaqRewardPointsQ => 'How are reward points earned?';

  @override
  String get helpFaqRewardPointsA =>
      'You earn 10 points for every completed order. Successfully referring a friend gives you an extra 50 points.';

  @override
  String get helpFaqTrackOrderQ => 'How do I track my order in real-time?';

  @override
  String get helpFaqTrackOrderA =>
      'After placing an order, go to \"Orders\" → select the active order → tap \"Track\".';
}
