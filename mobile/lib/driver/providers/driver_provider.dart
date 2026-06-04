import 'dart:async';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:dio/dio.dart';
import '../../shared/api/api_client.dart';
import '../../shared/api/socket_client.dart';
import '../../shared/models/order.dart';

// ---------------------------------------------------------------------------
// Models
// ---------------------------------------------------------------------------

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
    final count = json['orderCount'] as int? ?? json['order_count'] as int? ?? entriesList.length;
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
      restaurantName: json['restaurantName'] as String? ?? json['restaurant_name'] as String? ?? '',
      amount: (json['amount'] as num?)?.toDouble() ?? 0.0,
      deliveryFee: (json['deliveryFee'] as num?)?.toDouble() ?? (json['delivery_fee'] as num?)?.toDouble() ?? 0.0,
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
      orderCount: json['orderCount'] as int? ?? json['order_count'] as int? ?? 0,
      onlineMinutes: json['onlineMinutes'] as int? ?? json['online_minutes'] as int? ?? 0,
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

// ---------------------------------------------------------------------------
// State
// ---------------------------------------------------------------------------

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
    );
  }
}

// ---------------------------------------------------------------------------
// Notifier
// ---------------------------------------------------------------------------

final driverProvider = StateNotifierProvider<DriverNotifier, DriverState>((ref) {
  return DriverNotifier();
});

class DriverNotifier extends StateNotifier<DriverState> {
  final ApiClient _api = ApiClient.instance;
  final SocketClient _socket = SocketClient.instance;
  Timer? _locationTimer;
  StreamSubscription<Map<String, dynamic>>? _orderStatusSub;

  DriverNotifier() : super(const DriverState());

  // -----------------------------------------------------------------------
  // Auth
  // -----------------------------------------------------------------------

  Future<void> login(String email, String password) async {
    state = state.copyWith(isLoading: true, error: null);
    try {
      final response = await _api.post('/auth/login', data: {
        'email': email,
        'password': password,
      });
      final data = response.data as Map<String, dynamic>;
      final accessToken = data['accessToken'] as String? ?? data['token'] as String? ?? '';

      if (accessToken.isEmpty) {
        state = state.copyWith(isLoading: false, error: 'Đăng nhập thất bại');
        return;
      }

      await _fetchDriverProfile();
      state = state.copyWith(isLoading: false, isAuthenticated: true);
    } on DioException catch (e) {
      final message = e.response?.data?['message'] as String? ??
          e.response?.data?['error'] as String? ??
          'Sai email hoặc mật khẩu';
      state = state.copyWith(isLoading: false, error: message);
    } catch (e) {
      state = state.copyWith(isLoading: false, error: 'Có lỗi xảy ra. Vui lòng thử lại.');
    }
  }

  Future<void> _fetchDriverProfile() async {
    try {
      final response = await _api.get('/driver/profile');
      final data = response.data as Map<String, dynamic>;
      state = state.copyWith(
        driverName: data['fullName'] as String? ?? data['full_name'] as String?,
        driverPhone: data['phone'] as String?,
        driverAvatarUrl: data['avatarUrl'] as String? ?? data['avatar_url'] as String?,
        rating: (data['rating'] as num?)?.toDouble() ?? 5.0,
        totalDeliveries: data['totalDeliveries'] as int? ?? data['total_deliveries'] as int? ?? 0,
        totalEarnings: (data['totalEarnings'] as num?)?.toDouble() ?? (data['total_earnings'] as num?)?.toDouble() ?? 0.0,
        vehicleType: data['vehicleType'] as String? ?? data['vehicle_type'] as String?,
        vehiclePlate: data['vehiclePlate'] as String? ?? data['vehicle_plate'] as String?,
        isOnline: data['isOnline'] as bool? ?? data['is_online'] as bool? ?? false,
      );
    } catch (_) {
      // Profile fetch failed, continue with partial state
    }
  }

  Future<void> logout() async {
    _stopLocationUpdates();
    try {
      await _api.post('/auth/logout');
    } catch (_) {}
    state = const DriverState();
  }

  // -----------------------------------------------------------------------
  // Online / Offline
  // -----------------------------------------------------------------------

  Future<void> goOnline(double lat, double lng) async {
    state = state.copyWith(isLoading: true, error: null);
    try {
      await _api.patch('/driver/status', data: {
        'isOnline': true,
        'latitude': lat,
        'longitude': lng,
      });
      state = state.copyWith(isLoading: false, isOnline: true);
      _startLocationUpdates(lat, lng);
    } on DioException catch (e) {
      final msg = e.response?.data?['message'] as String? ?? 'Không thể chuyển sang trực tuyến';
      state = state.copyWith(isLoading: false, error: msg);
    } catch (e) {
      state = state.copyWith(isLoading: false, error: 'Có lỗi xảy ra');
    }
  }

  Future<void> goOffline() async {
    _stopLocationUpdates();
    try {
      await _api.patch('/driver/status', data: {'isOnline': false});
    } catch (_) {}
    state = state.copyWith(isOnline: false);
  }

  // -----------------------------------------------------------------------
  // Location
  // -----------------------------------------------------------------------

  void _startLocationUpdates(double lat, double lng) {
    _locationTimer?.cancel();
    _locationTimer = Timer.periodic(const Duration(seconds: 3), (_) {
      _socket.emit('driver:location', {
        'latitude': lat,
        'longitude': lng,
      });
    });
  }

  void _stopLocationUpdates() {
    _locationTimer?.cancel();
    _locationTimer = null;
  }

  void updateLocation(double lat, double lng) {
    if (state.isOnline) {
      _socket.emit('driver:location', {'latitude': lat, 'longitude': lng});
    }
  }

  // -----------------------------------------------------------------------
  // Orders
  // -----------------------------------------------------------------------

  Future<void> acceptOrder(String orderId) async {
    state = state.copyWith(isLoading: true, error: null);
    try {
      final response = await _api.post('/driver/orders/$orderId/accept');
      final order = OrderModel.fromJson(response.data as Map<String, dynamic>);
      state = state.copyWith(
        isLoading: false,
        activeOrder: order,
        pendingOrders: state.pendingOrders.where((o) => o.id != orderId).toList(),
      );
      _listenOrderStatus(orderId);
    } on DioException catch (e) {
      final msg = e.response?.data?['message'] as String? ?? 'Không thể nhận đơn';
      state = state.copyWith(isLoading: false, error: msg);
    } catch (e) {
      state = state.copyWith(isLoading: false, error: 'Có lỗi xảy ra');
    }
  }

  Future<void> declineOrder(String orderId) async {
    try {
      await _api.post('/driver/orders/$orderId/decline');
    } catch (_) {}
    state = state.copyWith(
      pendingOrders: state.pendingOrders.where((o) => o.id != orderId).toList(),
    );
  }

  Future<void> updateOrderStatus(String orderId, String status) async {
    state = state.copyWith(isLoading: true, error: null);
    try {
      final response = await _api.patch('/driver/orders/$orderId/status', data: {
        'status': status,
      });
      final updated = OrderModel.fromJson(response.data as Map<String, dynamic>);
      state = state.copyWith(isLoading: false, activeOrder: updated);

      if (status == 'delivered') {
        // Refresh stats & clear active order after a moment
        await fetchTodayStats();
        state = state.copyWith(activeOrder: null, successMessage: 'Giao hàng thành công!');
      }
    } on DioException catch (e) {
      final msg = e.response?.data?['message'] as String? ?? 'Cập nhật trạng thái thất bại';
      state = state.copyWith(isLoading: false, error: msg);
    } catch (e) {
      state = state.copyWith(isLoading: false, error: 'Có lỗi xảy ra');
    }
  }

  // -----------------------------------------------------------------------
  // Dashboard / Stats / Earnings
  // -----------------------------------------------------------------------

  Future<void> fetchTodayStats() async {
    try {
      final response = await _api.get('/driver/stats/today');
      state = state.copyWith(
        todayStats: DriverTodayStats.fromJson(response.data as Map<String, dynamic>),
      );
    } catch (_) {}
  }

  Future<void> fetchPendingOrders() async {
    try {
      final response = await _api.get('/driver/orders/pending');
      final list = (response.data as List<dynamic>)
          .map((e) => OrderModel.fromJson(e as Map<String, dynamic>))
          .toList();
      state = state.copyWith(pendingOrders: list);
    } catch (_) {}
  }

  Future<void> fetchActiveOrder() async {
    try {
      final response = await _api.get('/driver/orders/active');
      if (response.data != null && (response.data as Map<String, dynamic>).isNotEmpty) {
        final order = OrderModel.fromJson(response.data as Map<String, dynamic>);
        state = state.copyWith(activeOrder: order);
        _listenOrderStatus(order.id);
      }
    } catch (_) {}
  }

  Future<DriverEarnings> fetchEarnings(String period) async {
    try {
      final response = await _api.get('/driver/earnings', queryParameters: {'period': period});
      final earnings = DriverEarnings.fromJson(response.data as Map<String, dynamic>);
      state = state.copyWith(earnings: earnings);
      return earnings;
    } catch (e) {
      return const DriverEarnings();
    }
  }

  Future<List<OrderModel>> fetchDeliveryHistory({String? fromDate, String? toDate}) async {
    try {
      final params = <String, dynamic>{};
      if (fromDate != null) params['fromDate'] = fromDate;
      if (toDate != null) params['toDate'] = toDate;
      final response = await _api.get('/driver/orders/history', queryParameters: params);
      return (response.data as List<dynamic>)
          .map((e) => OrderModel.fromJson(e as Map<String, dynamic>))
          .toList();
    } catch (e) {
      return [];
    }
  }

  // -----------------------------------------------------------------------
  // WebSocket
  // -----------------------------------------------------------------------

  void _listenOrderStatus(String orderId) {
    _orderStatusSub?.cancel();
    _socket.connect();
    _socket.subscribeOrder(orderId);

    _orderStatusSub = _socket.onOrderStatus.listen((data) {
      final id = data['orderId'] as String? ?? data['order_id'] as String?;
      final status = data['status'] as String?;
      if (id == orderId && status != null && state.activeOrder?.id == id) {
        final updated = OrderModel(
          id: state.activeOrder!.id,
          userId: state.activeOrder!.userId,
          restaurantId: state.activeOrder!.restaurantId,
          restaurantName: state.activeOrder!.restaurantName,
          items: state.activeOrder!.items,
          subtotal: state.activeOrder!.subtotal,
          deliveryFee: state.activeOrder!.deliveryFee,
          discount: state.activeOrder!.discount,
          total: state.activeOrder!.total,
          status: status,
          deliveryAddress: state.activeOrder!.deliveryAddress,
          paymentMethod: state.activeOrder!.paymentMethod,
          createdAt: state.activeOrder!.createdAt,
          updatedAt: DateTime.now(),
          restaurantLatitude: state.activeOrder!.restaurantLatitude,
          restaurantLongitude: state.activeOrder!.restaurantLongitude,
        );
        state = state.copyWith(activeOrder: updated);

        if (status == 'delivered') {
          fetchTodayStats();
          state = state.copyWith(activeOrder: null, successMessage: 'Giao hàng thành công!');
        }
      }
    });
  }

  // -----------------------------------------------------------------------
  // Misc
  // -----------------------------------------------------------------------

  void clearError() {
    state = state.copyWith(error: null);
  }

  void clearSuccess() {
    state = state.copyWith(successMessage: null);
  }

  @override
  void dispose() {
    _locationTimer?.cancel();
    _orderStatusSub?.cancel();
    super.dispose();
  }
}
