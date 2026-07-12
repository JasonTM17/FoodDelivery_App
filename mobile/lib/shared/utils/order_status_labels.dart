import '../../l10n/app_localizations.dart';

String localizedOrderStatus(AppLocalizations l10n, String status) {
  switch (status) {
    case 'pending':
      return l10n.orderStatusPending;
    case 'confirmed':
      return l10n.orderStatusConfirmed;
    case 'preparing':
      return l10n.orderStatusPreparing;
    case 'picked_up':
    case 'delivering':
      return l10n.orderStatusPickedUp;
    case 'delivered':
      return l10n.orderStatusDelivered;
    case 'cancelled':
    case 'canceled':
      return l10n.orderStatusCancelled;
    default:
      return status;
  }
}
