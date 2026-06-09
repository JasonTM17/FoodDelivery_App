// ── Promotions ──

class PromotionResponse {
  final String id;
  final String code;
  final String type;
  final int value;
  final int minOrderAmount;
  final int? maxDiscount;
  final int usageLimit;
  final int usageCount;
  final int? maxPerUser;
  final bool firstOrderOnly;
  final bool isActive;
  final String startsAt;
  final String expiresAt;
  final int? discountAmount;

  const PromotionResponse({
    required this.id,
    required this.code,
    required this.type,
    required this.value,
    required this.minOrderAmount,
    this.maxDiscount,
    required this.usageLimit,
    required this.usageCount,
    this.maxPerUser,
    required this.firstOrderOnly,
    required this.isActive,
    required this.startsAt,
    required this.expiresAt,
    this.discountAmount,
  });

  factory PromotionResponse.fromJson(Map<String, dynamic> json) =>
      PromotionResponse(
        id: json['id'] as String,
        code: json['code'] as String,
        type: json['type'] as String,
        value: json['value'] as int,
        minOrderAmount: json['minOrderAmount'] as int,
        maxDiscount: json['maxDiscount'] as int?,
        usageLimit: json['usageLimit'] as int,
        usageCount: json['usageCount'] as int,
        maxPerUser: json['maxPerUser'] as int?,
        firstOrderOnly: json['firstOrderOnly'] as bool,
        isActive: json['isActive'] as bool,
        startsAt: json['startsAt'] as String,
        expiresAt: json['expiresAt'] as String,
        discountAmount: json['discountAmount'] as int?,
      );
}

// ── Notifications ──

class NotificationItem {
  final String id;
  final String title;
  final String body;
  final String type;
  final Map<String, dynamic>? data;
  final bool isRead;
  final String createdAt;

  const NotificationItem({
    required this.id,
    required this.title,
    required this.body,
    required this.type,
    this.data,
    required this.isRead,
    required this.createdAt,
  });

  factory NotificationItem.fromJson(Map<String, dynamic> json) =>
      NotificationItem(
        id: json['id'] as String,
        title: json['title'] as String,
        body: json['body'] as String,
        type: json['type'] as String,
        data: json['data'] != null
            ? Map<String, dynamic>.from(json['data'] as Map)
            : null,
        isRead: json['isRead'] as bool,
        createdAt: json['createdAt'] as String,
      );
}

// ── Tracking ──

class DriverLocation {
  final double lat;
  final double lng;
  final double? heading;
  final String lastUpdated;

  const DriverLocation({
    required this.lat,
    required this.lng,
    this.heading,
    required this.lastUpdated,
  });

  factory DriverLocation.fromJson(Map<String, dynamic> json) => DriverLocation(
    lat: (json['lat'] as num).toDouble(),
    lng: (json['lng'] as num).toDouble(),
    heading: (json['heading'] as num?)?.toDouble(),
    lastUpdated: json['lastUpdated'] as String,
  );
}

class TrackingResponse {
  final String orderId;
  final DriverLocation? driverLocation;
  final int? etaMinutes;
  final String status;
  final String? routePolyline;

  const TrackingResponse({
    required this.orderId,
    this.driverLocation,
    this.etaMinutes,
    required this.status,
    this.routePolyline,
  });

  factory TrackingResponse.fromJson(Map<String, dynamic> json) =>
      TrackingResponse(
        orderId: json['orderId'] as String,
        driverLocation: json['driverLocation'] != null
            ? DriverLocation.fromJson(
                json['driverLocation'] as Map<String, dynamic>)
            : null,
        etaMinutes: json['etaMinutes'] as int?,
        status: json['status'] as String,
        routePolyline: json['routePolyline'] as String?,
      );
}

// ── Health ──

class ComponentStatus {
  final String status;
  final int latencyMs;

  const ComponentStatus({required this.status, required this.latencyMs});

  factory ComponentStatus.fromJson(Map<String, dynamic> json) =>
      ComponentStatus(
        status: json['status'] as String,
        latencyMs: json['latencyMs'] as int,
      );
}

class HealthResponse {
  final String status;
  final int uptime;
  final String timestamp;
  final Map<String, ComponentStatus> components;

  const HealthResponse({
    required this.status,
    required this.uptime,
    required this.timestamp,
    required this.components,
  });

  factory HealthResponse.fromJson(Map<String, dynamic> json) => HealthResponse(
    status: json['status'] as String,
    uptime: json['uptime'] as int,
    timestamp: json['timestamp'] as String,
    components: (json['components'] as Map<String, dynamic>).map(
      (k, v) => MapEntry(k, ComponentStatus.fromJson(v as Map<String, dynamic>)),
    ),
  );
}

// ── Analytics ──

class AnalyticsSummary {
  final String periodStart;
  final String periodEnd;
  final int totalOrders;
  final int totalRevenue;
  final int totalCustomers;
  final int totalDrivers;
  final double cancellationRate;
  final int avgOrderValue;

  const AnalyticsSummary({
    required this.periodStart,
    required this.periodEnd,
    required this.totalOrders,
    required this.totalRevenue,
    required this.totalCustomers,
    required this.totalDrivers,
    required this.cancellationRate,
    required this.avgOrderValue,
  });

  factory AnalyticsSummary.fromJson(Map<String, dynamic> json) =>
      AnalyticsSummary(
        periodStart: json['periodStart'] as String,
        periodEnd: json['periodEnd'] as String,
        totalOrders: json['totalOrders'] as int,
        totalRevenue: json['totalRevenue'] as int,
        totalCustomers: json['totalCustomers'] as int,
        totalDrivers: json['totalDrivers'] as int,
        cancellationRate: (json['cancellationRate'] as num).toDouble(),
        avgOrderValue: json['avgOrderValue'] as int,
      );
}
