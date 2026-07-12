import 'dart:async';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:dio/dio.dart';
import 'package:geolocator/geolocator.dart';
import '../../shared/api/api_client.dart';
import '../../shared/api/realtime_client.dart';
import '../../shared/models/order.dart';
import '../../shared/services/secure_storage_service.dart';
import '../services/background_location_service.dart';

const _kMaxOnlineSampleAge = Duration(seconds: 45);
const _kMaxOnlineSampleFutureSkew = Duration(seconds: 15);

// ---------------------------------------------------------------------------
// Models
// ---------------------------------------------------------------------------

class DriverEarnings {
  final double total;
  final int orderCount;
  final double averagePerOrder;
  final List<DriverEarningEntry> entries;

  const DriverEarnings({
    required this.total,
    required this.orderCount,
    required this.averagePerOrder,
    required this.entries,
  });

  factory DriverEarnings.fromJson(Map<String, dynamic> json) {
    final entries = json['entries'];
    if (entries is! List<dynamic>) {
      throw const FormatException('Invalid earnings field: entries');
    }
    return DriverEarnings(
      total: _requiredDouble(json, 'totalEarnings'),
      orderCount: _requiredNonNegativeInt(json, 'totalOrders'),
      averagePerOrder: _requiredDouble(json, 'averagePerOrder'),
      entries: entries
          .map(
            (entry) =>
                DriverEarningEntry.fromJson(entry as Map<String, dynamic>),
          )
          .toList(growable: false),
    );
  }
}

class DriverEarningEntry {
  final String orderId;
  final String orderCode;
  final String restaurantName;
  final double amount;
  final DateTime completedAt;

  DriverEarningEntry({
    required this.orderId,
    required this.orderCode,
    required this.restaurantName,
    required this.amount,
    required this.completedAt,
  });

  factory DriverEarningEntry.fromJson(Map<String, dynamic> json) {
    return DriverEarningEntry(
      orderId: _requiredString(json, 'orderId'),
      orderCode: _requiredString(json, 'orderCode'),
      restaurantName: _requiredString(json, 'restaurantName'),
      amount: _requiredDouble(json, 'amount'),
      completedAt: DateTime.parse(_requiredString(json, 'completedAt')),
    );
  }
}

class DriverTodayStats {
  final double earnings;
  final int orderCount;
  final int? onlineMinutes;
  final double? rating;

  const DriverTodayStats({
    this.earnings = 0.0,
    this.orderCount = 0,
    this.onlineMinutes,
    this.rating,
  });

  factory DriverTodayStats.fromJson(Map<String, dynamic> json) {
    return DriverTodayStats(
      earnings: _requiredDouble(json, 'totalEarnings'),
      orderCount: _requiredNonNegativeInt(json, 'totalOrders'),
      onlineMinutes:
          json['onlineMinutes'] as int? ?? json['online_minutes'] as int?,
      rating: (json['rating'] as num?)?.toDouble(),
    );
  }

  String? get onlineTimeText {
    final minutes = onlineMinutes;
    if (minutes == null) return null;
    final h = minutes ~/ 60;
    final m = minutes % 60;
    if (h > 0) return '${h}h ${m}p';
    return '${m}p';
  }
}

// ---------------------------------------------------------------------------
// Model — Dispatch offer received via WebSocket driver:offer event
// ---------------------------------------------------------------------------

class DispatchOffer {
  final String orderId;
  final String offerToken;
  final String restaurantName;
  final String restaurantAddress;
  final String deliveryAddress;
  final double orderTotal;
  final double deliveryFee;
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

  factory DispatchOffer.fromJson(Map<String, dynamic> json) {
    return DispatchOffer(
      orderId: _requiredString(json, 'orderId'),
      offerToken: _requiredString(json, 'offerToken'),
      restaurantName: _requiredString(json, 'restaurantName'),
      restaurantAddress: _requiredString(json, 'restaurantAddress'),
      deliveryAddress: _requiredString(json, 'deliveryAddress'),
      orderTotal: _requiredDouble(json, 'orderTotal'),
      deliveryFee: _requiredDouble(json, 'deliveryFee'),
      distanceKm: _requiredDouble(json, 'distanceKm'),
      timeoutSeconds: _requiredInt(json, 'timeoutSeconds'),
      surgeMultiplier: _requiredDouble(json, 'surgeMultiplier'),
    );
  }
}

String _requiredString(Map<String, dynamic> json, String key) {
  final value = json[key];
  if (value is String && value.trim().isNotEmpty) return value;
  throw FormatException('Missing required string field: $key');
}

double _requiredDouble(Map<String, dynamic> json, String key) {
  final value = json[key];
  if (value is num && value.isFinite) return value.toDouble();
  throw FormatException('Invalid numeric field: $key');
}

int _requiredInt(Map<String, dynamic> json, String key) {
  final value = json[key];
  if (value is num && value.isFinite && value >= 1) return value.toInt();
  throw FormatException('Invalid positive integer field: $key');
}

int _requiredNonNegativeInt(Map<String, dynamic> json, String key) {
  final value = json[key];
  if (value is num && value.isFinite && value >= 0) return value.toInt();
  throw FormatException('Invalid non-negative field: $key');
}

// ---------------------------------------------------------------------------
// State
// ---------------------------------------------------------------------------

const _driverStateUnset = Object();

enum DriverKycStatus { notSubmitted, pending, approved, rejected }

DriverKycStatus parseDriverKycStatus(Object? value) {
  return switch (value) {
    'not_submitted' => DriverKycStatus.notSubmitted,
    'pending' => DriverKycStatus.pending,
    'approved' => DriverKycStatus.approved,
    'rejected' => DriverKycStatus.rejected,
    _ => throw const FormatException('Invalid driver KYC status'),
  };
}

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
  final bool isVerified;
  final bool hasAcceptedTerms;
  final DriverKycStatus kycStatus;
  final DriverTodayStats todayStats;
  final List<OrderModel> recentOrders;
  final OrderModel? activeOrder;
  final DriverEarnings? earnings;
  final String? successMessage;
  final double? currentLat;
  final double? currentLng;
  final DispatchOffer? pendingOffer;

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
    this.isVerified = false,
    this.hasAcceptedTerms = false,
    this.kycStatus = DriverKycStatus.notSubmitted,
    this.todayStats = const DriverTodayStats(),
    this.recentOrders = const [],
    this.activeOrder,
    this.earnings,
    this.successMessage,
    this.currentLat,
    this.currentLng,
    this.pendingOffer,
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
    bool? isVerified,
    bool? hasAcceptedTerms,
    DriverKycStatus? kycStatus,
    DriverTodayStats? todayStats,
    List<OrderModel>? recentOrders,
    Object? activeOrder = _driverStateUnset,
    DriverEarnings? earnings,
    String? successMessage,
    double? currentLat,
    double? currentLng,
    DispatchOffer? pendingOffer,
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
      isVerified: isVerified ?? this.isVerified,
      hasAcceptedTerms: hasAcceptedTerms ?? this.hasAcceptedTerms,
      kycStatus: kycStatus ?? this.kycStatus,
      todayStats: todayStats ?? this.todayStats,
      recentOrders: recentOrders ?? this.recentOrders,
      activeOrder: identical(activeOrder, _driverStateUnset)
          ? this.activeOrder
          : activeOrder as OrderModel?,
      earnings: earnings ?? this.earnings,
      successMessage: successMessage,
      currentLat: currentLat ?? this.currentLat,
      currentLng: currentLng ?? this.currentLng,
      pendingOffer: pendingOffer ?? this.pendingOffer,
    );
  }

  /// Creates a copy with [pendingOffer] explicitly cleared to null.
  /// Use this instead of copyWith when dismissing an offer, because
  /// copyWith cannot distinguish "not passed" from "null" for nullable fields.
  DriverState withOfferCleared() => DriverState(
    isLoading: isLoading,
    isAuthenticated: isAuthenticated,
    error: error,
    isOnline: isOnline,
    driverName: driverName,
    driverPhone: driverPhone,
    driverAvatarUrl: driverAvatarUrl,
    rating: rating,
    totalDeliveries: totalDeliveries,
    totalEarnings: totalEarnings,
    vehicleType: vehicleType,
    vehiclePlate: vehiclePlate,
    isVerified: isVerified,
    hasAcceptedTerms: hasAcceptedTerms,
    kycStatus: kycStatus,
    todayStats: todayStats,
    recentOrders: recentOrders,
    activeOrder: activeOrder,
    earnings: earnings,
    successMessage: successMessage,
    currentLat: currentLat,
    currentLng: currentLng,
    pendingOffer: null,
  );
}

// ---------------------------------------------------------------------------
// Notifier
// ---------------------------------------------------------------------------

final driverProvider = StateNotifierProvider<DriverNotifier, DriverState>((
  ref,
) {
  return DriverNotifier();
});

class DriverNotifier extends StateNotifier<DriverState> {
  final ApiClient _api = ApiClient.instance;
  final RealtimeClient _realtime = RealtimeClient.instance;
  final SecureStorageService _storage = SecureStorageService.instance;
  StreamSubscription<Map<String, dynamic>>? _orderStatusSub;
  StreamSubscription<Map<String, dynamic>>? _etaSub;
  StreamSubscription<Map<String, dynamic>>? _offerSub;
  StreamSubscription<Map<String, dynamic>>? _assignedOrderSub;

  DriverNotifier() : super(const DriverState());

  void markTermsAccepted() {
    state = state.copyWith(hasAcceptedTerms: true);
  }

  void markKycPending() {
    state = state.copyWith(
      isVerified: false,
      isOnline: false,
      hasAcceptedTerms: true,
      kycStatus: DriverKycStatus.pending,
    );
  }

  // -----------------------------------------------------------------------
  // Auth
  // -----------------------------------------------------------------------

  Future<void> login(String email, String password) async {
    state = state.copyWith(isLoading: true, error: null);
    try {
      final response = await _api.post(
        '/auth/login',
        data: {'email': email, 'password': password},
      );
      final data = response.data as Map<String, dynamic>;
      final accessToken =
          data['accessToken'] as String? ?? data['token'] as String? ?? '';
      final refreshToken =
          data['refreshToken'] as String? ?? data['refresh_token'] as String?;

      if (accessToken.isEmpty) {
        await _clearAuthTokens();
        state = state.copyWith(
          isLoading: false,
          isAuthenticated: false,
          error: 'Đăng nhập thất bại',
        );
        return;
      }

      await _persistAuthTokens(accessToken, refreshToken);
      final profileLoaded = await _fetchDriverProfile();
      if (!profileLoaded) {
        final profileError = state.error;
        await _clearAuthTokens();
        state = state.copyWith(
          isLoading: false,
          isAuthenticated: false,
          error: profileError,
        );
        return;
      }
      final kycLoaded = await _fetchKycStatus();
      if (!kycLoaded) {
        final kycError = state.error;
        await _clearAuthTokens();
        state = state.copyWith(
          isLoading: false,
          isAuthenticated: false,
          error: kycError,
        );
        return;
      }
      state = state.copyWith(isLoading: false, isAuthenticated: true);
    } on DioException catch (e) {
      await _clearAuthTokens();
      final message =
          e.response?.data?['message'] as String? ??
          e.response?.data?['error'] as String? ??
          'Sai email hoặc mật khẩu';
      state = state.copyWith(
        isLoading: false,
        isAuthenticated: false,
        error: message,
      );
    } catch (e) {
      await _clearAuthTokens();
      state = state.copyWith(
        isLoading: false,
        isAuthenticated: false,
        error: 'Có lỗi xảy ra. Vui lòng thử lại.',
      );
    }
  }

  Future<void> _persistAuthTokens(
    String accessToken,
    String? refreshToken,
  ) async {
    await _storage.setAccessToken(accessToken);
    if (refreshToken != null && refreshToken.isNotEmpty) {
      await _storage.setRefreshToken(refreshToken);
    } else {
      await _storage.deleteRefreshToken();
    }
  }

  Future<void> _clearAuthTokens() => _storage.clear();

  Future<bool> _fetchDriverProfile() async {
    try {
      final response = await _api.get('/users/me');
      final data = response.data as Map<String, dynamic>;
      final profile = data['driverProfile'] as Map<String, dynamic>?;
      if (data['role'] != 'driver' || profile == null) {
        state = state.copyWith(error: 'DRIVER_PROFILE_UNAVAILABLE');
        return false;
      }
      final isVerified = profile['isVerified'];
      if (isVerified is! bool) {
        state = state.copyWith(error: 'DRIVER_PROFILE_UNAVAILABLE');
        return false;
      }
      state = state.copyWith(
        driverName: data['fullName'] as String?,
        driverPhone: data['phone'] as String?,
        driverAvatarUrl: data['avatarUrl'] as String?,
        rating: (profile['rating'] as num?)?.toDouble() ?? state.rating,
        totalDeliveries:
            profile['totalDeliveries'] as int? ?? state.totalDeliveries,
        totalEarnings:
            (profile['totalEarnings'] as num?)?.toDouble() ??
            state.totalEarnings,
        vehicleType: profile['vehicleType'] as String?,
        vehiclePlate: profile['vehiclePlate'] as String?,
        isOnline: profile['isOnline'] as bool? ?? false,
        isVerified: isVerified,
        hasAcceptedTerms: profile['termsAcceptedAt'] != null,
      );
      return true;
    } catch (_) {
      state = state.copyWith(error: 'DRIVER_PROFILE_UNAVAILABLE');
      return false;
    }
  }

  Future<bool> _fetchKycStatus() async {
    try {
      final response = await _api.get('/driver/kyc/status');
      final data = response.data;
      if (data is! Map<String, dynamic>) {
        throw const FormatException('Invalid KYC status response');
      }
      final status = parseDriverKycStatus(data['status']);
      final isVerified = data['isVerified'];
      if (isVerified is! bool ||
          (isVerified && status != DriverKycStatus.approved)) {
        throw const FormatException('Inconsistent KYC status response');
      }
      state = state.copyWith(isVerified: isVerified, kycStatus: status);
      return true;
    } catch (_) {
      state = state.copyWith(error: 'DRIVER_KYC_STATUS_UNAVAILABLE');
      return false;
    }
  }

  Future<void> logout() async {
    _stopLocationUpdates();
    try {
      await _api.post('/auth/logout');
    } catch (_) {}
    await _clearAuthTokens();
    state = const DriverState();
  }

  // -----------------------------------------------------------------------
  // Online / Offline
  // -----------------------------------------------------------------------

  Future<void> goOnline(double lat, double lng, {DateTime? sampledAt}) async {
    state = state.copyWith(isLoading: true, error: null);
    final sample = sampledAt;
    if (sample == null || !isFreshDriverOnlineSample(sample, DateTime.now())) {
      state = state.copyWith(
        isLoading: false,
        error: 'Không lấy được vị trí GPS mới',
      );
      return;
    }
    try {
      await _api.post(
        '/driver/online',
        data: {
          'lat': lat,
          'lng': lng,
          'sampledAt': sample.toUtc().toIso8601String(),
        },
      );
      await startDispatchOfferListener();
      state = state.copyWith(isLoading: false, isOnline: true);
      _startLocationUpdates(lat, lng, sampledAt: sample);
    } on DioException catch (e) {
      try {
        await _api.post('/driver/offline');
      } catch (_) {}
      final msg =
          e.response?.data?['message'] as String? ??
          'Không thể chuyển sang trực tuyến';
      state = state.copyWith(isLoading: false, error: msg);
    } catch (e) {
      try {
        await _api.post('/driver/offline');
      } catch (_) {}
      state = state.copyWith(isLoading: false, error: 'Có lỗi xảy ra');
    }
  }

  Future<void> goOffline() async {
    _stopLocationUpdates();
    _etaSub?.cancel();
    _offerSub?.cancel();
    _assignedOrderSub?.cancel();
    try {
      await _api.post('/driver/offline');
    } catch (_) {}
    state = state.copyWith(isOnline: false);
  }

  /// Goes online after acquiring real device GPS.
  /// Requires a fresh GPS sample before publishing the driver as live.
  Future<void> goOnlineWithGps() async {
    state = state.copyWith(isLoading: true, error: null);
    try {
      double? lat;
      double? lng;
      DateTime? sampledAt;
      final permitted = await BackgroundLocationService.instance
          .requestPermissions();
      if (permitted) {
        try {
          final pos = await Geolocator.getCurrentPosition(
            locationSettings: const LocationSettings(
              accuracy: LocationAccuracy.high,
            ),
          ).timeout(const Duration(seconds: 8));
          lat = pos.latitude;
          lng = pos.longitude;
          sampledAt = pos.timestamp;
        } catch (_) {
          // GPS timed out; do not reuse in-memory coordinates as live.
        }
      }
      if (lat == null ||
          lng == null ||
          sampledAt == null ||
          !isFreshDriverOnlineSample(sampledAt, DateTime.now())) {
        state = state.copyWith(
          isLoading: false,
          error: 'Không lấy được vị trí GPS',
        );
        return;
      }
      state = state.copyWith(
        isLoading: false,
        currentLat: lat,
        currentLng: lng,
      );
      await goOnline(lat, lng, sampledAt: sampledAt);
    } catch (e) {
      state = state.copyWith(
        isLoading: false,
        error: 'Không lấy được vị trí GPS',
      );
    }
  }

  // -----------------------------------------------------------------------
  // Location
  // -----------------------------------------------------------------------

  void _startLocationUpdates(double lat, double lng, {DateTime? sampledAt}) {
    // Emit the initial known position only when it came from a real GPS sample.
    if (sampledAt != null) {
      unawaited(_realtime.emitLocationPing(lat, lng, timestamp: sampledAt));
    }
    BackgroundLocationService.instance.start(
      hasActiveOrder: state.activeOrder != null,
    );
  }

  void _stopLocationUpdates() {
    BackgroundLocationService.instance.stop();
  }

  void updateLocation(double lat, double lng, {DateTime? sampledAt}) {
    state = state.copyWith(currentLat: lat, currentLng: lng);
    if (state.isOnline && sampledAt != null) {
      unawaited(_realtime.emitLocationPing(lat, lng, timestamp: sampledAt));
    }
  }

  // -----------------------------------------------------------------------
  // Orders
  // -----------------------------------------------------------------------

  Future<void> acceptOrder(DispatchOffer offer) async {
    state = state.copyWith(isLoading: true, error: null).withOfferCleared();
    try {
      await _realtime.respondToDispatchOffer(
        orderId: offer.orderId,
        offerToken: offer.offerToken,
        accepted: true,
      );
      await fetchActiveOrder();
      state = state.copyWith(isLoading: false);
    } on DioException {
      state = state.copyWith(
        isLoading: false,
        error: 'DISPATCH_OFFER_RESPONSE_FAILED',
        pendingOffer: offer,
      );
    }
  }

  Future<void> declineOrder(DispatchOffer offer) async {
    state = state.withOfferCleared();
    try {
      await _realtime.respondToDispatchOffer(
        orderId: offer.orderId,
        offerToken: offer.offerToken,
        accepted: false,
      );
    } on DioException {
      state = state.copyWith(
        error: 'DISPATCH_OFFER_RESPONSE_FAILED',
        pendingOffer: offer,
      );
    }
  }

  Future<void> updateOrderStatus(String orderId, String status) async {
    state = state.copyWith(isLoading: true, error: null);
    try {
      await _api.patch(
        '/driver/orders/$orderId/status',
        data: {'status': status},
      );

      if (status == 'delivered') {
        // Refresh stats & clear active order after a moment
        await fetchTodayStats();
        state = state.copyWith(
          activeOrder: null,
          successMessage: 'Giao hàng thành công!',
        );
        BackgroundLocationService.instance.setActiveOrderMode(false);
      } else {
        await fetchActiveOrder();
        state = state.copyWith(isLoading: false);
      }
    } on DioException catch (e) {
      final msg =
          e.response?.data?['message'] as String? ??
          'Cập nhật trạng thái thất bại';
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
      final response = await _api.get(
        '/driver/earnings',
        queryParameters: {'period': 'today'},
      );
      final data = Map<String, dynamic>.from(
        response.data as Map<String, dynamic>,
      )..['rating'] = state.rating;
      state = state.copyWith(todayStats: DriverTodayStats.fromJson(data));
    } catch (_) {
      state = state.copyWith(error: 'DRIVER_TODAY_STATS_UNAVAILABLE');
    }
  }

  Future<void> fetchRecentOrders() async {
    try {
      final response = await _api.get(
        '/driver/orders/history',
        queryParameters: {'limit': 5},
      );
      final list = (response.data as List<dynamic>)
          .map((item) => OrderModel.fromJson(item as Map<String, dynamic>))
          .toList(growable: false);
      state = state.copyWith(recentOrders: list);
    } catch (_) {
      state = state.copyWith(error: 'DRIVER_ORDER_HISTORY_UNAVAILABLE');
    }
  }

  Future<void> fetchActiveOrder() async {
    try {
      final response = await _api.get('/driver/orders/active');
      if (response.data != null &&
          (response.data as Map<String, dynamic>).isNotEmpty) {
        final order = OrderModel.fromJson(
          response.data as Map<String, dynamic>,
        );
        state = state.copyWith(activeOrder: order);
        await _listenOrderStatus(order.id);
        BackgroundLocationService.instance.setActiveOrderMode(true);
      } else {
        _orderStatusSub?.cancel();
        state = state.copyWith(activeOrder: null);
        BackgroundLocationService.instance.setActiveOrderMode(false);
      }
    } catch (_) {
      state = state.copyWith(error: 'DRIVER_ACTIVE_ORDER_UNAVAILABLE');
    }
  }

  Future<void> fetchEarnings(String period) async {
    try {
      final response = await _api.get(
        '/driver/earnings',
        queryParameters: {'period': period},
      );
      final earnings = DriverEarnings.fromJson(
        response.data as Map<String, dynamic>,
      );
      state = state.copyWith(earnings: earnings);
    } catch (_) {
      state = state.copyWith(error: 'DRIVER_EARNINGS_UNAVAILABLE');
    }
  }

  Future<List<OrderModel>> fetchDeliveryHistory({
    String? fromDate,
    String? toDate,
  }) async {
    try {
      final params = <String, dynamic>{};
      if (fromDate != null) params['fromDate'] = fromDate;
      if (toDate != null) params['toDate'] = toDate;
      final response = await _api.get(
        '/driver/orders/history',
        queryParameters: params,
      );
      return (response.data as List<dynamic>)
          .map((e) => OrderModel.fromJson(e as Map<String, dynamic>))
          .toList();
    } catch (e) {
      state = state.copyWith(error: 'DRIVER_ORDER_HISTORY_UNAVAILABLE');
      rethrow;
    }
  }

  // -----------------------------------------------------------------------
  // WebSocket
  // -----------------------------------------------------------------------

  Future<void> _listenOrderStatus(String orderId) async {
    _orderStatusSub?.cancel();
    _etaSub?.cancel();
    await _realtime.connect();
    await _realtime.subscribeOrder(orderId);

    _orderStatusSub = _realtime.onOrderStatus.listen((data) async {
      final id = data['orderId'] as String? ?? data['order_id'] as String?;
      final status = data['status'] as String?;
      if (id == orderId && status != null && state.activeOrder?.id == id) {
        if (status == 'delivered') {
          await fetchTodayStats();
          state = state.copyWith(
            activeOrder: null,
            successMessage: 'Giao hàng thành công!',
          );
          BackgroundLocationService.instance.setActiveOrderMode(false);
        } else {
          await fetchActiveOrder();
        }
      }
    });

    _etaSub = _realtime.onEtaUpdate.listen((data) {
      if (data['orderId'] != orderId || state.activeOrder?.id != orderId) {
        return;
      }
      final activeOrder = state.activeOrder!;
      final routePhase = data['routePhase'] as String?;
      final activeRoutePhase =
          activeOrder.routePhase ??
          driverRoutePhaseForStatus(activeOrder.status);
      if (routePhase == null || routePhase != activeRoutePhase) {
        return;
      }
      final eta = (data['etaMinutes'] as num?)?.toInt();
      final routePolyline = data['routePolyline'] as String?;
      state = state.copyWith(
        activeOrder: activeOrder.copyWith(
          estimatedDeliveryTimeMinutes: eta,
          routePhase: routePhase,
          routePolyline: routePolyline,
        ),
      );
    });
  }

  // -----------------------------------------------------------------------
  // Dispatch Offers
  // -----------------------------------------------------------------------

  /// Subscribe to incoming delivery offers through the configured realtime provider.
  /// Call after going online so the driver receives real-time offer events.
  Future<void> startDispatchOfferListener() async {
    _offerSub?.cancel();
    _assignedOrderSub?.cancel();
    await _realtime.connect();
    _offerSub = _realtime.onDriverOffer.listen((data) {
      try {
        final offer = DispatchOffer.fromJson(data);
        state = state.copyWith(pendingOffer: offer);
      } catch (_) {
        state = state.copyWith(error: 'DISPATCH_OFFER_INVALID');
      }
    });
    _assignedOrderSub = _realtime.onDriverOrderAssigned.listen((data) async {
      if (data['orderId'] is! String) return;
      await fetchActiveOrder();
      state = state.copyWith(isLoading: false);
    });
  }

  /// Clear the pending offer (dialog dismissed or countdown expired).
  void dismissOffer() {
    state = state.withOfferCleared();
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
    _orderStatusSub?.cancel();
    _etaSub?.cancel();
    _offerSub?.cancel();
    _assignedOrderSub?.cancel();
    BackgroundLocationService.instance.stop();
    super.dispose();
  }
}

String driverRoutePhaseForStatus(String status) {
  return status == 'driver_assigned' || status == 'driver_arriving_restaurant'
      ? 'pickup'
      : 'dropoff';
}

bool isFreshDriverOnlineSample(DateTime sampledAt, DateTime now) {
  final age = now.difference(sampledAt);
  if (age > _kMaxOnlineSampleAge) return false;
  if (age < -_kMaxOnlineSampleFutureSkew) return false;
  return true;
}
