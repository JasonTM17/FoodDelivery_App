// ── Admin ──

class AdminDashboardResponse {
  final int totalOrders;
  final int totalRevenue;
  final int activeDrivers;
  final int activeCustomers;
  final int pendingTickets;
  final int todayOrders;
  final int todayRevenue;

  const AdminDashboardResponse({
    required this.totalOrders,
    required this.totalRevenue,
    required this.activeDrivers,
    required this.activeCustomers,
    required this.pendingTickets,
    required this.todayOrders,
    required this.todayRevenue,
  });

  factory AdminDashboardResponse.fromJson(Map<String, dynamic> json) =>
      AdminDashboardResponse(
        totalOrders: json['totalOrders'] as int,
        totalRevenue: json['totalRevenue'] as int,
        activeDrivers: json['activeDrivers'] as int,
        activeCustomers: json['activeCustomers'] as int,
        pendingTickets: json['pendingTickets'] as int,
        todayOrders: json['todayOrders'] as int,
        todayRevenue: json['todayRevenue'] as int,
      );
}

class AdminUserEntry {
  final String id;
  final String email;
  final String fullName;
  final String? phone;
  final String role;
  final bool isActive;
  final int failedLoginCount;
  final String? lockedUntil;
  final String createdAt;

  const AdminUserEntry({
    required this.id,
    required this.email,
    required this.fullName,
    this.phone,
    required this.role,
    required this.isActive,
    required this.failedLoginCount,
    this.lockedUntil,
    required this.createdAt,
  });

  factory AdminUserEntry.fromJson(Map<String, dynamic> json) =>
      AdminUserEntry(
        id: json['id'] as String,
        email: json['email'] as String,
        fullName: json['fullName'] as String,
        phone: json['phone'] as String?,
        role: json['role'] as String,
        isActive: json['isActive'] as bool,
        failedLoginCount: json['failedLoginCount'] as int,
        lockedUntil: json['lockedUntil'] as String?,
        createdAt: json['createdAt'] as String,
      );
}

class AdminRestaurantEntry {
  final String id;
  final String name;
  final String slug;
  final String city;
  final String? district;
  final List<String> cuisineTypes;
  final bool isActive;
  final bool isOpen;
  final double rating;
  final int totalOrders;
  final String createdAt;

  const AdminRestaurantEntry({
    required this.id,
    required this.name,
    required this.slug,
    required this.city,
    this.district,
    required this.cuisineTypes,
    required this.isActive,
    required this.isOpen,
    required this.rating,
    required this.totalOrders,
    required this.createdAt,
  });

  factory AdminRestaurantEntry.fromJson(Map<String, dynamic> json) =>
      AdminRestaurantEntry(
        id: json['id'] as String,
        name: json['name'] as String,
        slug: json['slug'] as String,
        city: json['city'] as String,
        district: json['district'] as String?,
        cuisineTypes: (json['cuisineTypes'] as List<dynamic>).cast<String>(),
        isActive: json['isActive'] as bool,
        isOpen: json['isOpen'] as bool,
        rating: (json['rating'] as num).toDouble(),
        totalOrders: json['totalOrders'] as int,
        createdAt: json['createdAt'] as String,
      );
}

class SupportTicketEntry {
  final String id;
  final String userId;
  final String userEmail;
  final String? orderId;
  final String issueType;
  final String summary;
  final String priority;
  final String status;
  final String? assignedAdminId;
  final String? resolutionNotes;
  final String createdAt;
  final String? resolvedAt;

  const SupportTicketEntry({
    required this.id,
    required this.userId,
    required this.userEmail,
    this.orderId,
    required this.issueType,
    required this.summary,
    required this.priority,
    required this.status,
    this.assignedAdminId,
    this.resolutionNotes,
    required this.createdAt,
    this.resolvedAt,
  });

  factory SupportTicketEntry.fromJson(Map<String, dynamic> json) =>
      SupportTicketEntry(
        id: json['id'] as String,
        userId: json['userId'] as String,
        userEmail: json['userEmail'] as String,
        orderId: json['orderId'] as String?,
        issueType: json['issueType'] as String,
        summary: json['summary'] as String,
        priority: json['priority'] as String,
        status: json['status'] as String,
        assignedAdminId: json['assignedAdminId'] as String?,
        resolutionNotes: json['resolutionNotes'] as String?,
        createdAt: json['createdAt'] as String,
        resolvedAt: json['resolvedAt'] as String?,
      );
}

class AuditLogEntry {
  final int id;
  final String adminId;
  final String adminEmail;
  final String action;
  final String targetType;
  final String? targetId;
  final Map<String, dynamic>? oldValue;
  final Map<String, dynamic>? newValue;
  final String ipAddress;
  final String createdAt;

  const AuditLogEntry({
    required this.id,
    required this.adminId,
    required this.adminEmail,
    required this.action,
    required this.targetType,
    this.targetId,
    this.oldValue,
    this.newValue,
    required this.ipAddress,
    required this.createdAt,
  });

  factory AuditLogEntry.fromJson(Map<String, dynamic> json) => AuditLogEntry(
    id: json['id'] as int,
    adminId: json['adminId'] as String,
    adminEmail: json['adminEmail'] as String,
    action: json['action'] as String,
    targetType: json['targetType'] as String,
    targetId: json['targetId'] as String?,
    oldValue: json['oldValue'] != null
        ? Map<String, dynamic>.from(json['oldValue'] as Map)
        : null,
    newValue: json['newValue'] != null
        ? Map<String, dynamic>.from(json['newValue'] as Map)
        : null,
    ipAddress: json['ipAddress'] as String,
    createdAt: json['createdAt'] as String,
  );
}
