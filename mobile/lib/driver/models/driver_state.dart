import '../../shared/models/order.dart';
import 'driver_models.dart';

class DriverState {
  final bool isLoading;
  final bool isAuthenticated;
  final String? error;
  final bool isOnline;
  final String? driverName;
  final String? driverPhone;
  final String? driverAvatarUrl;
  final double rating;
  final int totalDeliveries;
  final double totalEarnings;
  final String? vehicleType;
  final String? vehiclePlate;
  final DriverTodayStats todayStats;
  final List<OrderModel> pendingOrders;
  final OrderModel? activeOrder;
  final DriverEarnings? earnings;
  final String? successMessage;
  final double? currentLat;
  final double? currentLng;

  const DriverState({
    this.isLoading = false,
    this.isAuthenticated = false,
    this.error,
    this.isOnline = false,
    this.driverName,
    this.driverPhone,
    this.driverAvatarUrl,
    this.rating = 5.0,
    this.totalDeliveries = 0,
    this.totalEarnings = 0.0,
    this.vehicleType,
    this.vehiclePlate,
    this.todayStats = const DriverTodayStats(),
    this.pendingOrders = const [],
    this.activeOrder,
    this.earnings,
    this.successMessage,
    this.currentLat,
    this.currentLng,
  });

  DriverState copyWith({
    bool? isLoading,
    bool? isAuthenticated,
    String? error,
    bool? isOnline,
    String? driverName,
    String? driverPhone,
    String? driverAvatarUrl,
    double? rating,
    int? totalDeliveries,
    double? totalEarnings,
    String? vehicleType,
    String? vehiclePlate,
    DriverTodayStats? todayStats,
    List<OrderModel>? pendingOrders,
    OrderModel? activeOrder,
    DriverEarnings? earnings,
    String? successMessage,
    double? currentLat,
    double? currentLng,
  }) {
    return DriverState(
      isLoading: isLoading ?? this.isLoading,
      isAuthenticated: isAuthenticated ?? this.isAuthenticated,
      error: error,
      isOnline: isOnline ?? this.isOnline,
      driverName: driverName ?? this.driverName,
      driverPhone: driverPhone ?? this.driverPhone,
      driverAvatarUrl: driverAvatarUrl ?? this.driverAvatarUrl,
      rating: rating ?? this.rating,
      totalDeliveries: totalDeliveries ?? this.totalDeliveries,
      totalEarnings: totalEarnings ?? this.totalEarnings,
      vehicleType: vehicleType ?? this.vehicleType,
      vehiclePlate: vehiclePlate ?? this.vehiclePlate,
      todayStats: todayStats ?? this.todayStats,
      pendingOrders: pendingOrders ?? this.pendingOrders,
      activeOrder: activeOrder ?? this.activeOrder,
      earnings: earnings ?? this.earnings,
      successMessage: successMessage,
      currentLat: currentLat ?? this.currentLat,
      currentLng: currentLng ?? this.currentLng,
    );
  }
}
