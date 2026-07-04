import '../../shared/models/order.dart';

class DriverPickupItem {
  final String name;
  final int quantity;

  const DriverPickupItem({required this.name, required this.quantity});

  String get label => '$name (x$quantity)';

  static DriverPickupItem? fromMap(Map<dynamic, dynamic> json) {
    final name = _asString(json['name']);
    final quantity = _asInt(json['quantity']);
    if (name == null || name.trim().isEmpty || quantity == null) return null;
    if (quantity <= 0) return null;
    return DriverPickupItem(name: name.trim(), quantity: quantity);
  }
}

class PickupConfirmationArgs {
  final String orderId;
  final List<DriverPickupItem> items;
  final String? restaurantNote;
  final double deliveryFee;
  final double bonus;

  const PickupConfirmationArgs({
    required this.orderId,
    required this.items,
    this.restaurantNote,
    required this.deliveryFee,
    this.bonus = 0,
  });

  bool get hasPickupData => orderId.trim().isNotEmpty && items.isNotEmpty;

  DeliveryCompleteArgs toDeliveryCompleteArgs() {
    return DeliveryCompleteArgs(
      orderId: orderId,
      deliveryFee: deliveryFee,
      bonus: bonus,
    );
  }

  static PickupConfirmationArgs fromOrder(OrderModel order) {
    return PickupConfirmationArgs(
      orderId: order.id,
      items: order.items
          .where((item) => item.name.trim().isNotEmpty && item.quantity > 0)
          .map(
            (item) => DriverPickupItem(
              name: item.name.trim(),
              quantity: item.quantity,
            ),
          )
          .toList(growable: false),
      restaurantNote: _blankToNull(order.note),
      deliveryFee: order.deliveryFee,
    );
  }

  static PickupConfirmationArgs? fromExtra(Object? extra) {
    if (extra is PickupConfirmationArgs) return extra;
    if (extra is OrderModel) return PickupConfirmationArgs.fromOrder(extra);
    if (extra is! Map) return null;

    return PickupConfirmationArgs(
      orderId: _asString(extra['orderId']) ?? _asString(extra['id']) ?? '',
      items: _pickupItemsFromExtra(extra['items']),
      restaurantNote:
          _blankToNull(_asString(extra['restaurantNote'])) ??
          _blankToNull(_asString(extra['note'])),
      deliveryFee: _asDouble(extra['deliveryFee']) ?? 0,
      bonus: _asDouble(extra['bonus']) ?? 0,
    );
  }
}

class DeliveryCompleteArgs {
  final String orderId;
  final double deliveryFee;
  final double bonus;

  const DeliveryCompleteArgs({
    required this.orderId,
    required this.deliveryFee,
    this.bonus = 0,
  });

  double get total => deliveryFee + bonus;

  bool get hasEarningsData {
    return orderId.trim().isNotEmpty && deliveryFee >= 0 && bonus >= 0;
  }

  static DeliveryCompleteArgs fromOrder(OrderModel order) {
    return DeliveryCompleteArgs(
      orderId: order.id,
      deliveryFee: order.deliveryFee,
    );
  }

  static DeliveryCompleteArgs? fromExtra(Object? extra) {
    if (extra is DeliveryCompleteArgs) return extra;
    if (extra is OrderModel) return DeliveryCompleteArgs.fromOrder(extra);
    if (extra is! Map) return null;

    return DeliveryCompleteArgs(
      orderId: _asString(extra['orderId']) ?? _asString(extra['id']) ?? '',
      deliveryFee: _asDouble(extra['deliveryFee']) ?? 0,
      bonus: _asDouble(extra['bonus']) ?? 0,
    );
  }
}

List<DriverPickupItem> _pickupItemsFromExtra(Object? value) {
  if (value is! Iterable) return const [];
  return value
      .whereType<Map>()
      .map(DriverPickupItem.fromMap)
      .whereType<DriverPickupItem>()
      .toList(growable: false);
}

String? _asString(Object? value) {
  if (value is! String) return null;
  return value;
}

int? _asInt(Object? value) {
  if (value is int) return value;
  if (value is num && value.isFinite) return value.toInt();
  return null;
}

double? _asDouble(Object? value) {
  if (value is num && value.isFinite) return value.toDouble();
  return null;
}

String? _blankToNull(String? value) {
  if (value == null) return null;
  final trimmed = value.trim();
  return trimmed.isEmpty ? null : trimmed;
}
