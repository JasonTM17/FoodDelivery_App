import '../utils/backend_date_time.dart';

const _orderModelUnset = Object();

class OrderModel {
  final String id;
  final String userId;
  final String restaurantId;
  final String restaurantName;
  final String? restaurantLogoUrl;
  final String? restaurantPhone;
  final String? customerName;
  final String? customerPhone;
  final List<OrderItem> items;
  final double subtotal;
  final double deliveryFee;
  final double discount;
  final double total;
  final String status;
  final String? driverId;
  final String? driverName;
  final String? driverPhone;
  final String? driverAvatarUrl;
  final double? driverRating;
  final double? driverLatitude;
  final double? driverLongitude;
  final OrderAddress deliveryAddress;
  final String paymentMethod;
  final String? note;
  final String? promoCode;
  final DateTime createdAt;
  final DateTime updatedAt;
  final DateTime? deliveredAt;
  final List<StatusHistory> statusHistory;
  final double? restaurantLatitude;
  final double? restaurantLongitude;
  final int? estimatedDeliveryTimeMinutes;
  final String? routePolyline;

  OrderModel({
    required this.id,
    required this.userId,
    required this.restaurantId,
    required this.restaurantName,
    this.restaurantLogoUrl,
    this.restaurantPhone,
    this.customerName,
    this.customerPhone,
    this.items = const [],
    this.subtotal = 0.0,
    this.deliveryFee = 0.0,
    this.discount = 0.0,
    this.total = 0.0,
    this.status = 'pending',
    this.driverId,
    this.driverName,
    this.driverPhone,
    this.driverAvatarUrl,
    this.driverRating,
    this.driverLatitude,
    this.driverLongitude,
    required this.deliveryAddress,
    this.paymentMethod = 'cash',
    this.note,
    this.promoCode,
    required this.createdAt,
    required this.updatedAt,
    this.deliveredAt,
    this.statusHistory = const [],
    this.restaurantLatitude,
    this.restaurantLongitude,
    this.estimatedDeliveryTimeMinutes,
    this.routePolyline,
  });

  OrderModel copyWith({
    String? id,
    String? userId,
    String? restaurantId,
    String? restaurantName,
    String? restaurantLogoUrl,
    String? restaurantPhone,
    String? customerName,
    String? customerPhone,
    List<OrderItem>? items,
    double? subtotal,
    double? deliveryFee,
    double? discount,
    double? total,
    String? status,
    String? driverId,
    String? driverName,
    String? driverPhone,
    String? driverAvatarUrl,
    double? driverRating,
    double? driverLatitude,
    double? driverLongitude,
    OrderAddress? deliveryAddress,
    String? paymentMethod,
    String? note,
    String? promoCode,
    DateTime? createdAt,
    DateTime? updatedAt,
    DateTime? deliveredAt,
    List<StatusHistory>? statusHistory,
    double? restaurantLatitude,
    double? restaurantLongitude,
    Object? estimatedDeliveryTimeMinutes = _orderModelUnset,
    Object? routePolyline = _orderModelUnset,
  }) {
    return OrderModel(
      id: id ?? this.id,
      userId: userId ?? this.userId,
      restaurantId: restaurantId ?? this.restaurantId,
      restaurantName: restaurantName ?? this.restaurantName,
      restaurantLogoUrl: restaurantLogoUrl ?? this.restaurantLogoUrl,
      restaurantPhone: restaurantPhone ?? this.restaurantPhone,
      customerName: customerName ?? this.customerName,
      customerPhone: customerPhone ?? this.customerPhone,
      items: items ?? this.items,
      subtotal: subtotal ?? this.subtotal,
      deliveryFee: deliveryFee ?? this.deliveryFee,
      discount: discount ?? this.discount,
      total: total ?? this.total,
      status: status ?? this.status,
      driverId: driverId ?? this.driverId,
      driverName: driverName ?? this.driverName,
      driverPhone: driverPhone ?? this.driverPhone,
      driverAvatarUrl: driverAvatarUrl ?? this.driverAvatarUrl,
      driverRating: driverRating ?? this.driverRating,
      driverLatitude: driverLatitude ?? this.driverLatitude,
      driverLongitude: driverLongitude ?? this.driverLongitude,
      deliveryAddress: deliveryAddress ?? this.deliveryAddress,
      paymentMethod: paymentMethod ?? this.paymentMethod,
      note: note ?? this.note,
      promoCode: promoCode ?? this.promoCode,
      createdAt: createdAt ?? this.createdAt,
      updatedAt: updatedAt ?? this.updatedAt,
      deliveredAt: deliveredAt ?? this.deliveredAt,
      statusHistory: statusHistory ?? this.statusHistory,
      restaurantLatitude: restaurantLatitude ?? this.restaurantLatitude,
      restaurantLongitude: restaurantLongitude ?? this.restaurantLongitude,
      estimatedDeliveryTimeMinutes:
          identical(estimatedDeliveryTimeMinutes, _orderModelUnset)
          ? this.estimatedDeliveryTimeMinutes
          : estimatedDeliveryTimeMinutes as int?,
      routePolyline: identical(routePolyline, _orderModelUnset)
          ? this.routePolyline
          : routePolyline as String?,
    );
  }

  factory OrderModel.fromJson(Map<String, dynamic> json) {
    final restaurant = json['restaurant'] as Map<String, dynamic>?;
    final itemPayload =
        json['items'] as List<dynamic>? ??
        json['orderItems'] as List<dynamic>? ??
        const [];

    return OrderModel(
      id: _requiredStringFrom([json['_id'], json['id']], 'id'),
      userId: _requiredStringFrom([
        json['userId'],
        json['user_id'],
        json['customerId'],
        json['customer_id'],
      ], 'customerId'),
      restaurantId: _requiredStringFrom([
        json['restaurantId'],
        json['restaurant_id'],
        restaurant?['id'],
      ], 'restaurantId'),
      restaurantName:
          json['restaurantName'] as String? ??
          json['restaurant_name'] as String? ??
          restaurant?['name'] as String? ??
          '',
      restaurantLogoUrl:
          json['restaurantLogoUrl'] as String? ??
          json['restaurant_logo_url'] as String? ??
          restaurant?['logoUrl'] as String? ??
          restaurant?['logo_url'] as String?,
      restaurantPhone:
          json['restaurantPhone'] as String? ?? restaurant?['phone'] as String?,
      customerName: json['customerName'] as String?,
      customerPhone: json['customerPhone'] as String?,
      items: itemPayload
          .map((e) => OrderItem.fromJson(e as Map<String, dynamic>))
          .toList(),
      subtotal: _requiredDoubleFrom([json['subtotal']], 'subtotal'),
      deliveryFee: _requiredDoubleFrom([
        json['deliveryFee'],
        json['delivery_fee'],
      ], 'deliveryFee'),
      discount: (json['discount'] as num?)?.toDouble() ?? 0.0,
      total: _requiredDoubleFrom([json['total']], 'total'),
      status: _requiredStringFrom([json['status']], 'status'),
      driverId: json['driverId'] as String? ?? json['driver_id'] as String?,
      driverName:
          json['driverName'] as String? ?? json['driver_name'] as String?,
      driverPhone:
          json['driverPhone'] as String? ?? json['driver_phone'] as String?,
      driverAvatarUrl:
          json['driverAvatarUrl'] as String? ??
          json['driver_avatar_url'] as String?,
      driverRating: (json['driverRating'] as num?)?.toDouble(),
      driverLatitude: (json['driverLatitude'] as num?)?.toDouble(),
      driverLongitude: (json['driverLongitude'] as num?)?.toDouble(),
      deliveryAddress: OrderAddress.fromJson(
        json['deliveryAddress'] as Map<String, dynamic>? ??
            json['delivery_address'] as Map<String, dynamic>? ??
            {},
      ),
      paymentMethod: _requiredStringFrom([
        json['paymentMethod'],
        json['payment_method'],
      ], 'paymentMethod'),
      note: json['note'] as String? ?? json['notes'] as String?,
      promoCode:
          json['promoCode'] as String? ??
          json['promo_code'] as String? ??
          json['promotionCode'] as String?,
      createdAt: parseBackendDateTimeOrUnknown(
        json['createdAt'] ?? json['created_at'],
      ),
      updatedAt: parseBackendDateTimeOrUnknown(
        json['updatedAt'] ?? json['updated_at'],
      ),
      deliveredAt: parseBackendDateTimeOrNull(
        json['deliveredAt'] ?? json['delivered_at'],
      ),
      statusHistory: json['statusHistory'] != null
          ? (json['statusHistory'] as List<dynamic>)
                .map((e) => StatusHistory.fromJson(e as Map<String, dynamic>))
                .toList()
          : json['status_history'] != null
          ? (json['status_history'] as List<dynamic>)
                .map((e) => StatusHistory.fromJson(e as Map<String, dynamic>))
                .toList()
          : [],
      restaurantLatitude: (json['restaurantLatitude'] as num?)?.toDouble(),
      restaurantLongitude: (json['restaurantLongitude'] as num?)?.toDouble(),
      estimatedDeliveryTimeMinutes:
          (json['estimatedDeliveryTimeMinutes'] as num?)?.toInt(),
      routePolyline: json['routePolyline'] as String?,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'restaurantId': restaurantId,
      'items': items.map((e) => e.toJson()).toList(),
      'deliveryAddress': deliveryAddress.toJson(),
      'paymentMethod': paymentMethod,
      'note': note,
      'promoCode': promoCode,
    };
  }

  bool get isActive {
    return !['delivered', 'cancelled'].contains(status);
  }
}

class OrderItem {
  final String menuItemId;
  final String name;
  final int quantity;
  final double unitPrice;
  final double totalPrice;
  final List<SelectedOption> selectedOptions;
  final String? imageUrl;

  OrderItem({
    required this.menuItemId,
    required this.name,
    this.quantity = 1,
    this.unitPrice = 0.0,
    this.totalPrice = 0.0,
    this.selectedOptions = const [],
    this.imageUrl,
  });

  factory OrderItem.fromJson(Map<String, dynamic> json) {
    final quantity = (json['quantity'] as num?)?.toInt() ?? 1;
    final unitPrice = _requiredDoubleFrom([
      json['unitPrice'],
      json['unit_price'],
      json['price'],
    ], 'orderItem.unitPrice');
    final totalPrice =
        (json['totalPrice'] as num?)?.toDouble() ??
        (json['total_price'] as num?)?.toDouble() ??
        unitPrice * quantity;

    return OrderItem(
      menuItemId: _requiredStringFrom([
        json['menuItemId'],
        json['menu_item_id'],
        json['item_id'],
        json['id'],
      ], 'orderItem.menuItemId'),
      name: _requiredStringFrom([
        json['name'],
        json['nameSnapshot'],
        json['name_snapshot'],
      ], 'orderItem.name'),
      quantity: quantity,
      unitPrice: unitPrice,
      totalPrice: totalPrice,
      selectedOptions:
          (json['selectedOptions'] ?? json['selected_options']) != null
          ? ((json['selectedOptions'] ?? json['selected_options'])
                    as List<dynamic>)
                .map((e) => SelectedOption.fromJson(e as Map<String, dynamic>))
                .toList()
          : [],
      imageUrl: json['imageUrl'] as String?,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'menuItemId': menuItemId,
      'name': name,
      'quantity': quantity,
      'unitPrice': unitPrice,
      'selectedOptions': selectedOptions.map((e) => e.toJson()).toList(),
    };
  }
}

class SelectedOption {
  final String groupName;
  final String optionName;
  final double price;

  SelectedOption({
    required this.groupName,
    required this.optionName,
    this.price = 0.0,
  });

  factory SelectedOption.fromJson(Map<String, dynamic> json) {
    return SelectedOption(
      groupName: json['groupName'] as String? ?? '',
      optionName: json['optionName'] as String? ?? '',
      price: (json['price'] as num?)?.toDouble() ?? 0.0,
    );
  }

  Map<String, dynamic> toJson() {
    return {'groupName': groupName, 'optionName': optionName, 'price': price};
  }
}

class OrderAddress {
  final String label;
  final String address;
  final double latitude;
  final double longitude;
  final String? apartmentNumber;

  OrderAddress({
    this.label = 'Nhà',
    required this.address,
    required this.latitude,
    required this.longitude,
    this.apartmentNumber,
  });

  factory OrderAddress.fromJson(Map<String, dynamic> json) {
    if (json.isEmpty) {
      return OrderAddress(
        address: '',
        latitude: double.nan,
        longitude: double.nan,
      );
    }
    return OrderAddress(
      label: json['label'] as String? ?? 'Nhà',
      address:
          json['address'] as String? ??
          json['addressLine'] as String? ??
          json['address_line'] as String? ??
          '',
      latitude: (json['latitude'] as num?)?.toDouble() ?? double.nan,
      longitude: (json['longitude'] as num?)?.toDouble() ?? double.nan,
      apartmentNumber:
          json['apartmentNumber'] as String? ??
          json['apartment_number'] as String?,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'label': label,
      'address': address,
      'latitude': latitude,
      'longitude': longitude,
      'apartmentNumber': apartmentNumber,
    };
  }
}

class StatusHistory {
  final String status;
  final DateTime timestamp;
  final String? note;

  StatusHistory({required this.status, required this.timestamp, this.note});

  factory StatusHistory.fromJson(Map<String, dynamic> json) {
    return StatusHistory(
      status: _requiredStringFrom([json['status']], 'statusHistory.status'),
      timestamp: parseBackendDateTimeOrUnknown(json['timestamp']),
      note: json['note'] as String?,
    );
  }
}

String _requiredStringFrom(Iterable<dynamic> values, String field) {
  for (final value in values) {
    if (value is String && value.trim().isNotEmpty) {
      return value;
    }
  }
  throw FormatException('Missing required string field: $field');
}

double _requiredDoubleFrom(Iterable<dynamic> values, String field) {
  for (final value in values) {
    if (value is num) {
      return value.toDouble();
    }
  }
  throw FormatException('Invalid numeric field: $field');
}
