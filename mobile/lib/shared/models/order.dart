class OrderModel {
  final String id;
  final String userId;
  final String restaurantId;
  final String restaurantName;
  final String? restaurantLogoUrl;
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

  OrderModel({
    required this.id,
    required this.userId,
    required this.restaurantId,
    required this.restaurantName,
    this.restaurantLogoUrl,
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
  });

  factory OrderModel.fromJson(Map<String, dynamic> json) {
    return OrderModel(
      id: json['_id'] as String? ?? json['id'] as String? ?? '',
      userId: json['userId'] as String? ?? json['user_id'] as String? ?? '',
      restaurantId: json['restaurantId'] as String? ?? json['restaurant_id'] as String? ?? '',
      restaurantName: json['restaurantName'] as String? ?? json['restaurant_name'] as String? ?? '',
      restaurantLogoUrl: json['restaurantLogoUrl'] as String? ?? json['restaurant_logo_url'] as String?,
      items: json['items'] != null
          ? (json['items'] as List<dynamic>)
              .map((e) => OrderItem.fromJson(e as Map<String, dynamic>))
              .toList()
          : [],
      subtotal: (json['subtotal'] as num?)?.toDouble() ?? 0.0,
      deliveryFee: (json['deliveryFee'] as num?)?.toDouble() ?? (json['delivery_fee'] as num?)?.toDouble() ?? 0.0,
      discount: (json['discount'] as num?)?.toDouble() ?? 0.0,
      total: (json['total'] as num?)?.toDouble() ?? 0.0,
      status: json['status'] as String? ?? 'pending',
      driverId: json['driverId'] as String? ?? json['driver_id'] as String?,
      driverName: json['driverName'] as String? ?? json['driver_name'] as String?,
      driverPhone: json['driverPhone'] as String? ?? json['driver_phone'] as String?,
      driverAvatarUrl: json['driverAvatarUrl'] as String? ?? json['driver_avatar_url'] as String?,
      driverRating: (json['driverRating'] as num?)?.toDouble(),
      driverLatitude: (json['driverLatitude'] as num?)?.toDouble(),
      driverLongitude: (json['driverLongitude'] as num?)?.toDouble(),
      deliveryAddress: OrderAddress.fromJson(
        json['deliveryAddress'] as Map<String, dynamic>? ?? json['delivery_address'] as Map<String, dynamic>? ?? {},
      ),
      paymentMethod: json['paymentMethod'] as String? ?? json['payment_method'] as String? ?? 'cash',
      note: json['note'] as String?,
      promoCode: json['promoCode'] as String? ?? json['promo_code'] as String?,
      createdAt: json['createdAt'] != null
          ? DateTime.parse(json['createdAt'] as String)
          : json['created_at'] != null
              ? DateTime.parse(json['created_at'] as String)
              : DateTime.now(),
      updatedAt: json['updatedAt'] != null
          ? DateTime.parse(json['updatedAt'] as String)
          : json['updated_at'] != null
              ? DateTime.parse(json['updated_at'] as String)
              : DateTime.now(),
      deliveredAt: json['deliveredAt'] != null
          ? DateTime.parse(json['deliveredAt'] as String)
          : json['delivered_at'] != null
              ? DateTime.parse(json['delivered_at'] as String)
              : null,
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

  String get statusText {
    switch (status) {
      case 'pending':
        return 'Chờ xác nhận';
      case 'confirmed':
        return 'Đã xác nhận';
      case 'preparing':
        return 'Đang chuẩn bị';
      case 'delivering':
        return 'Đang giao';
      case 'delivered':
        return 'Đã giao';
      case 'cancelled':
        return 'Đã hủy';
      default:
        return status;
    }
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
    return OrderItem(
      menuItemId: json['menuItemId'] as String? ?? json['item_id'] as String? ?? '',
      name: json['name'] as String? ?? '',
      quantity: json['quantity'] as int? ?? 1,
      unitPrice: (json['unitPrice'] as num?)?.toDouble() ?? 0.0,
      totalPrice: (json['totalPrice'] as num?)?.toDouble() ?? (json['price'] as num?)?.toDouble() ?? 0.0,
      selectedOptions: json['selectedOptions'] != null
          ? (json['selectedOptions'] as List<dynamic>)
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
    return {
      'groupName': groupName,
      'optionName': optionName,
      'price': price,
    };
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
      return OrderAddress(address: '', latitude: 0.0, longitude: 0.0);
    }
    return OrderAddress(
      label: json['label'] as String? ?? 'Nhà',
      address: json['address'] as String? ?? '',
      latitude: (json['latitude'] as num?)?.toDouble() ?? 0.0,
      longitude: (json['longitude'] as num?)?.toDouble() ?? 0.0,
      apartmentNumber: json['apartmentNumber'] as String?,
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

  StatusHistory({
    required this.status,
    required this.timestamp,
    this.note,
  });

  factory StatusHistory.fromJson(Map<String, dynamic> json) {
    return StatusHistory(
      status: json['status'] as String? ?? '',
      timestamp: json['timestamp'] != null
          ? DateTime.parse(json['timestamp'] as String)
          : DateTime.now(),
      note: json['note'] as String?,
    );
  }
}
