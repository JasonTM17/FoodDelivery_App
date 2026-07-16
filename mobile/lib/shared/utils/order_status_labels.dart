import '../../l10n/app_localizations.dart';

String localizedOrderStatus(AppLocalizations l10n, String status) {
  switch (status) {
    case 'created':
      return l10n.orderStatusCreated;
    case 'pending_payment':
      return l10n.orderStatusPendingPayment;
    case 'paid':
      return l10n.orderStatusPaid;
    case 'restaurant_pending':
      return l10n.orderStatusRestaurantPending;
    case 'restaurant_accepted':
      return l10n.orderStatusRestaurantAccepted;
    case 'pending':
      return l10n.orderStatusPending;
    case 'confirmed':
      return l10n.orderStatusConfirmed;
    case 'preparing':
      return l10n.orderStatusPreparing;
    case 'ready_for_pickup':
      return l10n.orderStatusReadyForPickup;
    case 'driver_assigned':
      return l10n.orderStatusDriverAssigned;
    case 'driver_arriving_restaurant':
      return l10n.orderStatusDriverArrivingRestaurant;
    case 'picked_up':
      return l10n.orderStatusPickedUp;
    case 'delivering':
      return l10n.orderStatusDelivering;
    case 'delivered':
      return l10n.orderStatusDelivered;
    case 'completed':
      return l10n.orderStatusCompleted;
    case 'cancelled':
    case 'canceled':
      return l10n.orderStatusCancelled;
    case 'refunded':
      return l10n.orderStatusRefunded;
    default:
      return l10n.orderStatusUnknown;
  }
}
