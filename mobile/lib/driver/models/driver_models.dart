class DriverEarnings {
  final double total;
  final int orderCount;
  final double averagePerOrder;
  final List<DriverEarningEntry> entries;

  const DriverEarnings({
    this.total = 0.0,
    this.orderCount = 0,
    this.averagePerOrder = 0.0,
    this.entries = const [],
  });

  factory DriverEarnings.fromJson(Map<String, dynamic> json) {
    final entriesList = (json['entries'] as List<dynamic>?)
            ?.map((e) => DriverEarningEntry.fromJson(e as Map<String, dynamic>))
            .toList() ??
        [];
    final total = (json['total'] as num?)?.toDouble() ?? 0.0;
    final count =
        json['orderCount'] as int? ?? json['order_count'] as int? ?? entriesList.length;
    return DriverEarnings(
      total: total,
      orderCount: count,
      averagePerOrder: count > 0 ? total / count : 0.0,
      entries: entriesList,
    );
  }
}

class DriverEarningEntry {
  final String orderId;
  final String orderCode;
  final String restaurantName;
  final double amount;
  final double deliveryFee;
  final double tip;
  final DateTime completedAt;

  DriverEarningEntry({
    required this.orderId,
    required this.orderCode,
    required this.restaurantName,
    this.amount = 0.0,
    this.deliveryFee = 0.0,
    this.tip = 0.0,
    required this.completedAt,
  });

  factory DriverEarningEntry.fromJson(Map<String, dynamic> json) {
    return DriverEarningEntry(
      orderId: json['orderId'] as String? ?? json['order_id'] as String? ?? '',
      orderCode: json['orderCode'] as String? ?? json['order_code'] as String? ?? '',
      restaurantName:
          json['restaurantName'] as String? ?? json['restaurant_name'] as String? ?? '',
      amount: (json['amount'] as num?)?.toDouble() ?? 0.0,
      deliveryFee: (json['deliveryFee'] as num?)?.toDouble() ??
          (json['delivery_fee'] as num?)?.toDouble() ??
          0.0,
      tip: (json['tip'] as num?)?.toDouble() ?? 0.0,
      completedAt: json['completedAt'] != null
          ? DateTime.parse(json['completedAt'] as String)
          : json['completed_at'] != null
              ? DateTime.parse(json['completed_at'] as String)
              : DateTime.now(),
    );
  }
}

class DriverTodayStats {
  final double earnings;
  final int orderCount;
  final int onlineMinutes;
  final double rating;

  const DriverTodayStats({
    this.earnings = 0.0,
    this.orderCount = 0,
    this.onlineMinutes = 0,
    this.rating = 5.0,
  });

  factory DriverTodayStats.fromJson(Map<String, dynamic> json) {
    return DriverTodayStats(
      earnings: (json['earnings'] as num?)?.toDouble() ?? 0.0,
      orderCount:
          json['orderCount'] as int? ?? json['order_count'] as int? ?? 0,
      onlineMinutes:
          json['onlineMinutes'] as int? ?? json['online_minutes'] as int? ?? 0,
      rating: (json['rating'] as num?)?.toDouble() ?? 5.0,
    );
  }

  String get onlineTimeText {
    final h = onlineMinutes ~/ 60;
    final m = onlineMinutes % 60;
    if (h > 0) return '${h}h ${m}p';
    return '${m}p';
  }
}
