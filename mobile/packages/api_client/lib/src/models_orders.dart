// ── Orders ──

import 'models_user_restaurant.dart';

class PlaceOrderRequest {
  final String addressId;
  final String paymentMethod;
  final String? promotionCode;
  final String? notes;

  const PlaceOrderRequest({
    required this.addressId,
    required this.paymentMethod,
    this.promotionCode,
    this.notes,
  });

  Map<String, dynamic> toJson() => {
        'addressId': addressId,
        'paymentMethod': paymentMethod,
        if (promotionCode != null) 'promotionCode': promotionCode,
        if (notes != null) 'notes': notes,
      };
}

class OrderResponse {
  final String id;
  final String orderCode;
  final String customerId;
  final String restaurantId;
  final String restaurantName;
  final String? driverId;
  final String? driverName;
  final UserAddress deliveryAddress;
  final String status;
  final List<OrderItemSnapshot> items;
  final int subtotal;
  final int deliveryFee;
  final int promotionDiscount;
  final int total;
  final String paymentMethod;
  final String paymentStatus;
  final String? notes;
  final int? estimatedPrepTimeMinutes;
  final int? estimatedDeliveryTimeMinutes;
  final List<StatusHistoryEntry>? statusHistory;
  final String createdAt;
  final String updatedAt;

  const OrderResponse({
    required this.id,
    required this.orderCode,
    required this.customerId,
    required this.restaurantId,
    required this.restaurantName,
    this.driverId,
    this.driverName,
    required this.deliveryAddress,
    required this.status,
    required this.items,
    required this.subtotal,
    required this.deliveryFee,
    required this.promotionDiscount,
    required this.total,
    required this.paymentMethod,
    required this.paymentStatus,
    this.notes,
    this.estimatedPrepTimeMinutes,
    this.estimatedDeliveryTimeMinutes,
    this.statusHistory,
    required this.createdAt,
    required this.updatedAt,
  });

  factory OrderResponse.fromJson(Map<String, dynamic> json) => OrderResponse(
        id: json['id'] as String,
        orderCode: json['orderCode'] as String,
        customerId: json['customerId'] as String,
        restaurantId: json['restaurantId'] as String,
        restaurantName: json['restaurantName'] as String,
        driverId: json['driverId'] as String?,
        driverName: json['driverName'] as String?,
        deliveryAddress: UserAddress.fromJson(
            json['deliveryAddress'] as Map<String, dynamic>),
        status: json['status'] as String,
        items: (json['items'] as List<dynamic>)
            .map((e) => OrderItemSnapshot.fromJson(e as Map<String, dynamic>))
            .toList(),
        subtotal: json['subtotal'] as int,
        deliveryFee: json['deliveryFee'] as int,
        promotionDiscount: json['promotionDiscount'] as int,
        total: json['total'] as int,
        paymentMethod: json['paymentMethod'] as String,
        paymentStatus: json['paymentStatus'] as String,
        notes: json['notes'] as String?,
        estimatedPrepTimeMinutes: json['estimatedPrepTimeMinutes'] as int?,
        estimatedDeliveryTimeMinutes:
            json['estimatedDeliveryTimeMinutes'] as int?,
        statusHistory: (json['statusHistory'] as List<dynamic>?)
            ?.map((e) => StatusHistoryEntry.fromJson(e as Map<String, dynamic>))
            .toList(),
        createdAt: json['createdAt'] as String,
        updatedAt: json['updatedAt'] as String,
      );
}

class DriverOrderResponse {
  final String id;
  final String userId;
  final String restaurantId;
  final String restaurantName;
  final String? restaurantLogoUrl;
  final String? restaurantPhone;
  final String customerName;
  final String? customerPhone;
  final List<DriverOrderItem> items;
  final int subtotal;
  final int deliveryFee;
  final int discount;
  final int total;
  final String status;
  final String? driverId;
  final DriverOrderAddress deliveryAddress;
  final String paymentMethod;
  final String? note;
  final String createdAt;
  final String updatedAt;
  final List<DriverOrderStatusHistory> statusHistory;
  final double restaurantLatitude;
  final double restaurantLongitude;
  final int? estimatedDeliveryTimeMinutes;
  final String? routePolyline;

  const DriverOrderResponse({
    required this.id,
    required this.userId,
    required this.restaurantId,
    required this.restaurantName,
    this.restaurantLogoUrl,
    this.restaurantPhone,
    required this.customerName,
    this.customerPhone,
    required this.items,
    required this.subtotal,
    required this.deliveryFee,
    required this.discount,
    required this.total,
    required this.status,
    this.driverId,
    required this.deliveryAddress,
    required this.paymentMethod,
    this.note,
    required this.createdAt,
    required this.updatedAt,
    required this.statusHistory,
    required this.restaurantLatitude,
    required this.restaurantLongitude,
    this.estimatedDeliveryTimeMinutes,
    this.routePolyline,
  });

  factory DriverOrderResponse.fromJson(Map<String, dynamic> json) =>
      DriverOrderResponse(
        id: json['id'] as String,
        userId: json['userId'] as String,
        restaurantId: json['restaurantId'] as String,
        restaurantName: json['restaurantName'] as String,
        restaurantLogoUrl: json['restaurantLogoUrl'] as String?,
        restaurantPhone: json['restaurantPhone'] as String?,
        customerName: json['customerName'] as String,
        customerPhone: json['customerPhone'] as String?,
        items: (json['items'] as List<dynamic>)
            .map((e) => DriverOrderItem.fromJson(e as Map<String, dynamic>))
            .toList(),
        subtotal: (json['subtotal'] as num).toInt(),
        deliveryFee: (json['deliveryFee'] as num).toInt(),
        discount: (json['discount'] as num).toInt(),
        total: (json['total'] as num).toInt(),
        status: json['status'] as String,
        driverId: json['driverId'] as String?,
        deliveryAddress: DriverOrderAddress.fromJson(
          json['deliveryAddress'] as Map<String, dynamic>,
        ),
        paymentMethod: json['paymentMethod'] as String,
        note: json['note'] as String?,
        createdAt: json['createdAt'] as String,
        updatedAt: json['updatedAt'] as String,
        statusHistory: (json['statusHistory'] as List<dynamic>)
            .map(
              (e) =>
                  DriverOrderStatusHistory.fromJson(e as Map<String, dynamic>),
            )
            .toList(),
        restaurantLatitude: (json['restaurantLatitude'] as num).toDouble(),
        restaurantLongitude: (json['restaurantLongitude'] as num).toDouble(),
        estimatedDeliveryTimeMinutes:
            (json['estimatedDeliveryTimeMinutes'] as num?)?.toInt(),
        routePolyline: json['routePolyline'] as String?,
      );
}

class DriverOrderItem {
  final String menuItemId;
  final String name;
  final int quantity;
  final int unitPrice;
  final int totalPrice;
  final Object? selectedOptions;

  const DriverOrderItem({
    required this.menuItemId,
    required this.name,
    required this.quantity,
    required this.unitPrice,
    required this.totalPrice,
    required this.selectedOptions,
  });

  factory DriverOrderItem.fromJson(Map<String, dynamic> json) =>
      DriverOrderItem(
        menuItemId: json['menuItemId'] as String,
        name: json['name'] as String,
        quantity: (json['quantity'] as num).toInt(),
        unitPrice: (json['unitPrice'] as num).toInt(),
        totalPrice: (json['totalPrice'] as num).toInt(),
        selectedOptions: json['selectedOptions'],
      );
}

class DriverOrderAddress {
  final String label;
  final String address;
  final double latitude;
  final double longitude;

  const DriverOrderAddress({
    required this.label,
    required this.address,
    required this.latitude,
    required this.longitude,
  });

  factory DriverOrderAddress.fromJson(Map<String, dynamic> json) =>
      DriverOrderAddress(
        label: json['label'] as String,
        address: json['address'] as String,
        latitude: (json['latitude'] as num).toDouble(),
        longitude: (json['longitude'] as num).toDouble(),
      );
}

class DriverOrderStatusHistory {
  final String status;
  final String timestamp;
  final String? note;

  const DriverOrderStatusHistory({
    required this.status,
    required this.timestamp,
    this.note,
  });

  factory DriverOrderStatusHistory.fromJson(Map<String, dynamic> json) =>
      DriverOrderStatusHistory(
        status: json['status'] as String,
        timestamp: json['timestamp'] as String,
        note: json['note'] as String?,
      );
}

class OrderItemSnapshot {
  final String id;
  final String nameSnapshot;
  final int quantity;
  final int unitPrice;
  final List<Map<String, dynamic>>? selectedOptions;

  const OrderItemSnapshot({
    required this.id,
    required this.nameSnapshot,
    required this.quantity,
    required this.unitPrice,
    this.selectedOptions,
  });

  factory OrderItemSnapshot.fromJson(Map<String, dynamic> json) =>
      OrderItemSnapshot(
        id: json['id'] as String,
        nameSnapshot: json['nameSnapshot'] as String,
        quantity: json['quantity'] as int,
        unitPrice: json['unitPrice'] as int,
        selectedOptions: (json['selectedOptions'] as List<dynamic>?)
            ?.map((e) => Map<String, dynamic>.from(e as Map))
            .toList(),
      );
}

class StatusHistoryEntry {
  final String status;
  final String changedBy;
  final String? note;
  final String createdAt;

  const StatusHistoryEntry({
    required this.status,
    required this.changedBy,
    this.note,
    required this.createdAt,
  });

  factory StatusHistoryEntry.fromJson(Map<String, dynamic> json) =>
      StatusHistoryEntry(
        status: json['status'] as String,
        changedBy: json['changedBy'] as String,
        note: json['note'] as String?,
        createdAt: json['createdAt'] as String,
      );
}

// ── Dispatch ──

class DispatchOffer {
  final String orderId;
  final String offerToken;
  final String restaurantName;
  final String restaurantAddress;
  final String deliveryAddress;
  final int orderTotal;
  final int deliveryFee;
  final double distanceKm;
  final int timeoutSeconds;
  final double surgeMultiplier;

  const DispatchOffer({
    required this.orderId,
    required this.offerToken,
    required this.restaurantName,
    required this.restaurantAddress,
    required this.deliveryAddress,
    required this.orderTotal,
    required this.deliveryFee,
    required this.distanceKm,
    required this.timeoutSeconds,
    required this.surgeMultiplier,
  });

  factory DispatchOffer.fromJson(Map<String, dynamic> json) => DispatchOffer(
        orderId: json['orderId'] as String,
        offerToken: json['offerToken'] as String,
        restaurantName: json['restaurantName'] as String,
        restaurantAddress: json['restaurantAddress'] as String,
        deliveryAddress: json['deliveryAddress'] as String,
        orderTotal: (json['orderTotal'] as num).toInt(),
        deliveryFee: (json['deliveryFee'] as num).toInt(),
        distanceKm: (json['distanceKm'] as num).toDouble(),
        timeoutSeconds: (json['timeoutSeconds'] as num).toInt(),
        surgeMultiplier: (json['surgeMultiplier'] as num).toDouble(),
      );
}

// ── Reviews ──

class ReviewResponse {
  final String id;
  final String orderId;
  final String customerId;
  final String customerName;
  final int foodRating;
  final int? deliveryRating;
  final String? comment;
  final List<String> photos;
  final String? reply;
  final String? replyAt;
  final String createdAt;

  const ReviewResponse({
    required this.id,
    required this.orderId,
    required this.customerId,
    required this.customerName,
    required this.foodRating,
    this.deliveryRating,
    this.comment,
    required this.photos,
    this.reply,
    this.replyAt,
    required this.createdAt,
  });

  factory ReviewResponse.fromJson(Map<String, dynamic> json) => ReviewResponse(
        id: json['id'] as String,
        orderId: json['orderId'] as String,
        customerId: json['customerId'] as String,
        customerName: json['customerName'] as String,
        foodRating: json['foodRating'] as int,
        deliveryRating: json['deliveryRating'] as int?,
        comment: json['comment'] as String?,
        photos: (json['photos'] as List<dynamic>).cast<String>(),
        reply: json['reply'] as String?,
        replyAt: json['replyAt'] as String?,
        createdAt: json['createdAt'] as String,
      );
}
