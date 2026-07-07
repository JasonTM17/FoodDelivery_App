import '../../l10n/app_localizations.dart';

String localizeAppError(AppLocalizations l10n, String messageOrCode) {
  switch (messageOrCode) {
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
