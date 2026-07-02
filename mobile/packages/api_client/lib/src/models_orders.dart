// ── Orders ──

import 'models_user_restaurant.dart';

class PlaceOrderRequest {
  final String restaurantId;
  final String deliveryAddressId;
  final String paymentMethod;
  final String? promotionCode;
  final String? notes;
  final List<OrderItemInput> items;

  const PlaceOrderRequest({
    required this.restaurantId,
    required this.deliveryAddressId,
    required this.paymentMethod,
    this.promotionCode,
    this.notes,
    required this.items,
  });

  Map<String, dynamic> toJson() => {
        'restaurantId': restaurantId,
        'deliveryAddressId': deliveryAddressId,
        'paymentMethod': paymentMethod,
        if (promotionCode != null) 'promotionCode': promotionCode,
        if (notes != null) 'notes': notes,
        'items': items.map((e) => e.toJson()).toList(),
      };
}

class OrderItemInput {
  final String menuItemId;
  final int quantity;
  final int unitPrice;
  final List<Map<String, dynamic>>? selectedOptions;
  final String? notes;

  const OrderItemInput({
    required this.menuItemId,
    required this.quantity,
    required this.unitPrice,
    this.selectedOptions,
    this.notes,
  });

  Map<String, dynamic> toJson() => {
        'menuItemId': menuItemId,
        'quantity': quantity,
        'unitPrice': unitPrice,
        if (selectedOptions != null) 'selectedOptions': selectedOptions,
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
  final String orderCode;
  final String restaurantName;
  final String pickupAddress;
  final String dropoffAddress;
  final int deliveryFee;
  final double distanceKm;
  final int expiresInSeconds;

  const DispatchOffer({
    required this.orderId,
    required this.orderCode,
    required this.restaurantName,
    required this.pickupAddress,
    required this.dropoffAddress,
    required this.deliveryFee,
    required this.distanceKm,
    required this.expiresInSeconds,
  });

  factory DispatchOffer.fromJson(Map<String, dynamic> json) => DispatchOffer(
        orderId: json['orderId'] as String,
        orderCode: json['orderCode'] as String,
        restaurantName: json['restaurantName'] as String,
        pickupAddress: json['pickupAddress'] as String,
        dropoffAddress: json['dropoffAddress'] as String,
        deliveryFee: json['deliveryFee'] as int,
        distanceKm: (json['distanceKm'] as num).toDouble(),
        expiresInSeconds: json['expiresInSeconds'] as int,
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
