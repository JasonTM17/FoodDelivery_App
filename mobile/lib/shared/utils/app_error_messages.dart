import '../../l10n/app_localizations.dart';

class AppErrorCodes {
  AppErrorCodes._();

  static const driverAuthInvalidCredentials = 'DRIVER_AUTH_INVALID_CREDENTIALS';
  static const driverAuthUnavailable = 'DRIVER_AUTH_UNAVAILABLE';
  static const driverProfileUnavailable = 'DRIVER_PROFILE_UNAVAILABLE';
  static const driverKycStatusUnavailable = 'DRIVER_KYC_STATUS_UNAVAILABLE';
  static const driverAvailabilityUnavailable =
      'DRIVER_AVAILABILITY_UNAVAILABLE';
}

String localizeAppError(AppLocalizations l10n, String messageOrCode) {
  switch (messageOrCode) {
    case AppErrorCodes.driverAuthInvalidCredentials:
      return l10n.driverLoginInvalidCredentials;
    case AppErrorCodes.driverAuthUnavailable:
      return l10n.driverLoginUnavailable;
    case AppErrorCodes.driverProfileUnavailable:
      return l10n.driverProfileUnavailable;
    case AppErrorCodes.driverKycStatusUnavailable:
      return l10n.driverKycStatusUnavailable;
    case AppErrorCodes.driverAvailabilityUnavailable:
      return l10n.driverAvailabilityUnavailable;
    case 'RESTAURANTS_LOCATION_REQUIRED':
      return l10n.restaurantLocationRequired;
    case 'RESTAURANTS_LOAD_FAILED':
      return l10n.restaurantLoadFailed;
    case 'RESTAURANT_DETAIL_LOAD_FAILED':
      return l10n.restaurantDetailLoadFailed;
    case 'RESTAURANT_MENU_LOAD_FAILED':
    case 'MENU_CONTRACT_INVALID_RESPONSE':
      return l10n.restaurantMenuLoadFailed;
    case 'SEARCH_LOAD_FAILED':
      return l10n.searchLoadFailed;
    default:
      return messageOrCode;
  }
}
