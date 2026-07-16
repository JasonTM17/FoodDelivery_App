import 'dart:async';
import 'package:flutter/foundation.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:dio/dio.dart';
import 'package:geolocator/geolocator.dart';
import '../../shared/api/api_client.dart';
import '../../shared/api/realtime_client.dart';
import '../../shared/models/order.dart';
import '../../shared/notifications/firebase_fcm_token_session.dart';
import '../../shared/services/secure_storage_service.dart';
import '../../shared/utils/app_error_messages.dart';
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

Map<String, dynamic>? _asJsonObject(Object? value) {
  if (value is Map<String, dynamic>) return value;
  if (value is Map) return Map<String, dynamic>.from(value);
  return null;
}

double? _asFiniteDouble(Object? value) {
  final parsed = switch (value) {
    num number => number.toDouble(),
    String text => double.tryParse(text),
    _ => null,
  };
  return parsed != null && parsed.isFinite ? parsed : null;
}

int? _asNonNegativeInt(Object? value) {
  final parsed = switch (value) {
    int number => number,
    num number when number.isFinite && number == number.truncateToDouble() =>
      number.toInt(),
    String text => int.tryParse(text),
    _ => null,
  };
  return parsed != null && parsed >= 0 ? parsed : null;
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
  return DriverNotifier(restoringSession: true);
});

class DriverNotifier extends StateNotifier<DriverState> {
  DriverNotifier({
    ApiClient? api,
    RealtimeClient? realtime,
    SecureStorageService? storage,
    bool restoringSession = false,
  }) : _api = api ?? ApiClient.instance,
       _realtime = realtime ?? RealtimeClient.instance,
       _storage = storage ?? SecureStorageService.instance,
       super(DriverState(isLoading: restoringSession));

  final ApiClient _api;
  final RealtimeClient _realtime;
  final SecureStorageService _storage;
  StreamSubscription<Map<String, dynamic>>? _orderStatusSub;
  StreamSubscription<Map<String, dynamic>>? _etaSub;
  StreamSubscription<Map<String, dynamic>>? _offerSub;
  StreamSubscription<Map<String, dynamic>>? _assignedOrderSub;
  int _sessionEpoch = 0;
  int _availabilityEpoch = 0;
  Future<void>? _pendingOnlineRequest;
  bool _isDisposed = false;

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

  Future<void> restoreSession() async {
    final activeOrderId = state.activeOrder?.id;
    final sessionEpoch = _invalidateSession();
    state = const DriverState(isLoading: true);
    await _teardownSessionResources(activeOrderId: activeOrderId);
    if (!_isCurrentSession(sessionEpoch)) return;

    try {
      final accessToken = await _storage.getAccessToken();
      if (!_isCurrentSession(sessionEpoch)) return;
      if (accessToken == null || accessToken.isEmpty) {
        state = const DriverState();
        return;
      }

      final profileLoaded = await _fetchDriverProfile();
      if (!_isCurrentSession(sessionEpoch)) return;
      if (!profileLoaded) {
        final profileError = state.error;
        await _clearAuthTokens();
        if (!_isCurrentSession(sessionEpoch)) return;
        state = DriverState(error: profileError);
        return;
      }

      final kycLoaded = await _fetchKycStatus();
      if (!_isCurrentSession(sessionEpoch)) return;
      if (!kycLoaded) {
        final kycError = state.error;
        await _clearAuthTokens();
        if (!_isCurrentSession(sessionEpoch)) return;
        state = DriverState(error: kycError);
        return;
      }

      state = state.copyWith(isLoading: false, isAuthenticated: true);
      if (state.isOnline) {
        await goOnlineWithGps();
        if (!_isCurrentSession(sessionEpoch)) return;
      }
      unawaited(FcmTokenSession.activate());
    } catch (_) {
      if (!_isCurrentSession(sessionEpoch)) return;
      await _clearAuthTokens();
      if (!_isCurrentSession(sessionEpoch)) return;
      state = const DriverState(error: AppErrorCodes.driverAuthUnavailable);
    }
  }

  Future<void> login(String email, String password) async {
    final activeOrderId = state.activeOrder?.id;
    final sessionEpoch = _invalidateSession();
    await _teardownSessionResources(activeOrderId: activeOrderId);
    if (!_isCurrentSession(sessionEpoch)) return;
    state = const DriverState(isLoading: true);
    try {
      final response = await _api.post(
        '/auth/login',
        data: {'email': email, 'password': password},
      );
      if (!_isCurrentSession(sessionEpoch)) return;
      final data = response.data as Map<String, dynamic>;
      final accessToken =
          data['accessToken'] as String? ?? data['token'] as String? ?? '';
      final refreshToken =
          data['refreshToken'] as String? ?? data['refresh_token'] as String?;

      if (accessToken.isEmpty) {
        if (!_isCurrentSession(sessionEpoch)) return;
        await _clearAuthTokens();
        if (!_isCurrentSession(sessionEpoch)) return;
        state = state.copyWith(
          isLoading: false,
          isAuthenticated: false,
          error: AppErrorCodes.driverAuthUnavailable,
        );
        return;
      }

      await _persistAuthTokens(accessToken, refreshToken);
      if (!_isCurrentSession(sessionEpoch)) return;
      final profileLoaded = await _fetchDriverProfile();
      if (!_isCurrentSession(sessionEpoch)) return;
      if (!profileLoaded) {
        final profileError = state.error;
        await _clearAuthTokens();
        if (!_isCurrentSession(sessionEpoch)) return;
        state = state.copyWith(
          isLoading: false,
          isAuthenticated: false,
          error: profileError,
        );
        return;
      }
      final kycLoaded = await _fetchKycStatus();
      if (!_isCurrentSession(sessionEpoch)) return;
      if (!kycLoaded) {
        final kycError = state.error;
        await _clearAuthTokens();
        if (!_isCurrentSession(sessionEpoch)) return;
        state = state.copyWith(
          isLoading: false,
          isAuthenticated: false,
          error: kycError,
        );
        return;
      }
      if (!_isCurrentSession(sessionEpoch)) return;
      state = state.copyWith(isLoading: false, isAuthenticated: true);
      unawaited(FcmTokenSession.activate());
    } on DioException catch (e) {
      if (!_isCurrentSession(sessionEpoch)) return;
      await _clearAuthTokens();
      if (!_isCurrentSession(sessionEpoch)) return;
      final response = _asJsonObject(e.response?.data);
      final apiCode = response?['code'];
      final errorCode =
          e.response?.statusCode == 401 ||
              e.response?.statusCode == 403 ||
              apiCode == 'AUTH_INVALID_CREDENTIALS' ||
              apiCode == AppErrorCodes.driverAuthInvalidCredentials
          ? AppErrorCodes.driverAuthInvalidCredentials
          : AppErrorCodes.driverAuthUnavailable;
      state = state.copyWith(
        isLoading: false,
        isAuthenticated: false,
        error: errorCode,
      );
    } catch (e) {
      if (!_isCurrentSession(sessionEpoch)) return;
      await _clearAuthTokens();
      if (!_isCurrentSession(sessionEpoch)) return;
      state = state.copyWith(
        isLoading: false,
        isAuthenticated: false,
        error: AppErrorCodes.driverAuthUnavailable,
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
    final sessionEpoch = _sessionEpoch;
    try {
      final response = await _api.get('/users/me');
      if (!_isCurrentSession(sessionEpoch)) return false;
      final data = _asJsonObject(response.data);
      final profile = _asJsonObject(data?['driverProfile']);
      if (data == null || data['role'] != 'driver' || profile == null) {
        state = state.copyWith(error: AppErrorCodes.driverProfileUnavailable);
        return false;
      }
      final isVerified = profile['isVerified'];
      if (isVerified is! bool) {
        state = state.copyWith(error: AppErrorCodes.driverProfileUnavailable);
        return false;
      }
      final rating = _asFiniteDouble(profile['rating']);
      final totalDeliveries = _asNonNegativeInt(profile['totalDeliveries']);
      final totalEarnings = _asFiniteDouble(profile['totalEarnings']);
      if (rating == null || totalDeliveries == null || totalEarnings == null) {
        state = state.copyWith(error: AppErrorCodes.driverProfileUnavailable);
        return false;
      }
      state = state.copyWith(
        driverName: data['fullName'] as String?,
        driverPhone: data['phone'] as String?,
        driverAvatarUrl: data['avatarUrl'] as String?,
        rating: rating,
        totalDeliveries: totalDeliveries,
        totalEarnings: totalEarnings,
        vehicleType: profile['vehicleType'] as String?,
        vehiclePlate: profile['vehiclePlate'] as String?,
        isOnline: profile['isOnline'] as bool? ?? false,
        isVerified: isVerified,
        hasAcceptedTerms: profile['termsAcceptedAt'] != null,
      );
      return true;
    } catch (error, stackTrace) {
      if (!_isCurrentSession(sessionEpoch)) return false;
      if (kDebugMode) {
        debugPrint('Driver profile bootstrap failed: $error');
        debugPrintStack(stackTrace: stackTrace);
      }
      state = state.copyWith(error: AppErrorCodes.driverProfileUnavailable);
      return false;
    }
  }

  Future<bool> _fetchKycStatus() async {
    final sessionEpoch = _sessionEpoch;
    try {
      final response = await _api.get('/driver/kyc/status');
      if (!_isCurrentSession(sessionEpoch)) return false;
      final data = _asJsonObject(response.data);
      if (data == null) {
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
      if (!_isCurrentSession(sessionEpoch)) return false;
      state = state.copyWith(error: AppErrorCodes.driverKycStatusUnavailable);
      return false;
    }
  }

  Future<void> logout() async {
    final activeOrderId = state.activeOrder?.id;
    final sessionEpoch = _invalidateSession();
    _invalidateAvailability();
    state = const DriverState();

    await _teardownSessionResources(activeOrderId: activeOrderId);
    if (!_isCurrentSession(sessionEpoch)) return;
    await _waitForPendingOnlineRequest();
    if (!_isCurrentSession(sessionEpoch)) return;
    try {
      await FcmTokenSession.deactivate().timeout(const Duration(seconds: 2));
    } catch (_) {
      // A failed push cleanup must not leave the driver online or authenticated.
    }
    if (!_isCurrentSession(sessionEpoch)) return;
    try {
      // Always reconcile the server before invalidating auth. This also closes
      // the race where an earlier /driver/online request finishes during logout.
      await _api.post('/driver/offline');
    } catch (_) {}
    if (!_isCurrentSession(sessionEpoch)) return;
    try {
      await _api.post('/auth/logout');
    } catch (_) {}
    if (!_isCurrentSession(sessionEpoch)) return;
    await _clearAuthTokens();
  }

  int _invalidateSession() => ++_sessionEpoch;

  int _invalidateAvailability() => ++_availabilityEpoch;

  bool _isCurrentSession(int sessionEpoch) {
    return !_isDisposed && sessionEpoch == _sessionEpoch;
  }

  bool _isCurrentAvailability(int sessionEpoch, int availabilityEpoch) {
    return _isCurrentSession(sessionEpoch) &&
        availabilityEpoch == _availabilityEpoch;
  }

  Future<void> _waitForPendingOnlineRequest() async {
    final request = _pendingOnlineRequest;
    if (request == null) return;
    try {
      await request;
    } catch (_) {
      // The caller still performs the authoritative offline reconciliation.
    }
  }

  Future<void> _teardownSessionResources({String? activeOrderId}) async {
    _stopLocationUpdates();
    await _cancelAllRealtimeSubscriptions();
    if (activeOrderId != null) {
      try {
        await _realtime.unsubscribeOrder(activeOrderId);
      } catch (_) {}
    }
    try {
      await _realtime.disconnect();
    } catch (_) {}
  }

  Future<void> _cancelAllRealtimeSubscriptions() async {
    final subscriptions = [
      _orderStatusSub,
      _etaSub,
      _offerSub,
      _assignedOrderSub,
    ];
    _orderStatusSub = null;
    _etaSub = null;
    _offerSub = null;
    _assignedOrderSub = null;
    await Future.wait(subscriptions.map(_cancelSubscription));
  }

  Future<void> _cancelAvailabilitySubscriptions() async {
    final subscriptions = [_etaSub, _offerSub, _assignedOrderSub];
    _etaSub = null;
    _offerSub = null;
    _assignedOrderSub = null;
    await Future.wait(subscriptions.map(_cancelSubscription));
  }

  Future<void> _cancelDispatchOfferSubscriptions() async {
    final subscriptions = [_offerSub, _assignedOrderSub];
    _offerSub = null;
    _assignedOrderSub = null;
    await Future.wait(subscriptions.map(_cancelSubscription));
  }

  Future<void> _cancelOrderStatusSubscriptions() async {
    final subscriptions = [_orderStatusSub, _etaSub];
    _orderStatusSub = null;
    _etaSub = null;
    await Future.wait(subscriptions.map(_cancelSubscription));
  }

  Future<void> _cancelSubscription(
    StreamSubscription<Map<String, dynamic>>? subscription,
  ) async {
    if (subscription == null) return;
    try {
      await subscription.cancel();
    } catch (_) {}
  }

  // -----------------------------------------------------------------------
  // Online / Offline
  // -----------------------------------------------------------------------

  Future<void> goOnline(
    double lat,
    double lng, {
    DateTime? sampledAt,
    double? accuracy,
  }) async {
    final sessionEpoch = _sessionEpoch;
    final availabilityEpoch = _invalidateAvailability();
    await _goOnline(
      lat,
      lng,
      sampledAt: sampledAt,
      accuracy: accuracy,
      sessionEpoch: sessionEpoch,
      availabilityEpoch: availabilityEpoch,
    );
  }

  Future<void> _goOnline(
    double lat,
    double lng, {
    required DateTime? sampledAt,
    double? accuracy,
    required int sessionEpoch,
    required int availabilityEpoch,
  }) async {
    state = state.copyWith(isLoading: true, error: null);
    final sample = sampledAt;
    if (sample == null || !isFreshDriverOnlineSample(sample, DateTime.now())) {
      await _failGpsAvailability(
        reconcilePersistedOnlineState: state.isOnline,
        sessionEpoch: sessionEpoch,
        availabilityEpoch: availabilityEpoch,
      );
      return;
    }
    try {
      final request = _api
          .post(
            '/driver/online',
            data: {
              'lat': lat,
              'lng': lng,
              'sampledAt': sample.toUtc().toIso8601String(),
              if (accuracy != null) 'accuracy': accuracy,
            },
          )
          .then<void>((_) {});
      _pendingOnlineRequest = request;
      try {
        await request;
      } finally {
        if (identical(_pendingOnlineRequest, request)) {
          _pendingOnlineRequest = null;
        }
      }
      if (!_isCurrentAvailability(sessionEpoch, availabilityEpoch)) {
        return;
      }
      await startDispatchOfferListener();
      if (!_isCurrentAvailability(sessionEpoch, availabilityEpoch)) {
        return;
      }
      state = state.copyWith(isLoading: false, isOnline: true);
      _startLocationUpdates(
        lat,
        lng,
        sampledAt: sample,
        accuracy: accuracy,
      );
    } on DioException catch (e) {
      if (!_isCurrentAvailability(sessionEpoch, availabilityEpoch)) return;
      try {
        await _api.post('/driver/offline');
      } catch (_) {}
      final msg =
          e.response?.data?['message'] as String? ??
          'Không thể chuyển sang trực tuyến';
      state = state.copyWith(isLoading: false, isOnline: false, error: msg);
    } catch (e) {
      if (!_isCurrentAvailability(sessionEpoch, availabilityEpoch)) return;
      try {
        await _api.post('/driver/offline');
      } catch (_) {}
      state = state.copyWith(
        isLoading: false,
        isOnline: false,
        error: 'Có lỗi xảy ra',
      );
    }
  }

  Future<void> goOffline() async {
    final sessionEpoch = _sessionEpoch;
    final availabilityEpoch = _invalidateAvailability();
    state = state.copyWith(isLoading: true, error: null);
    try {
      await _waitForPendingOnlineRequest();
      if (!_isCurrentAvailability(sessionEpoch, availabilityEpoch)) return;
      await _api.post('/driver/offline');
      if (!_isCurrentAvailability(sessionEpoch, availabilityEpoch)) return;
      _stopLocationUpdates();
      await _cancelAvailabilitySubscriptions();
      if (!_isCurrentAvailability(sessionEpoch, availabilityEpoch)) return;
      state = state.copyWith(isLoading: false, isOnline: false);
    } catch (_) {
      if (!_isCurrentAvailability(sessionEpoch, availabilityEpoch)) return;
      state = state.copyWith(
        isLoading: false,
        error: AppErrorCodes.driverAvailabilityUnavailable,
      );
    }
  }

  /// Goes online after acquiring real device GPS.
  /// Requires a fresh GPS sample before publishing the driver as live.
  Future<void> goOnlineWithGps() async {
    final sessionEpoch = _sessionEpoch;
    final availabilityEpoch = _invalidateAvailability();
    final wasAlreadyOnline = state.isOnline;
    state = state.copyWith(isLoading: true, error: null);
    try {
      double? lat;
      double? lng;
      double? accuracy;
      DateTime? sampledAt;
      final permitted = await BackgroundLocationService.instance
          .requestPermissions();
      if (!_isCurrentAvailability(sessionEpoch, availabilityEpoch)) return;
      if (permitted) {
        try {
          final pos = await Geolocator.getCurrentPosition(
            locationSettings: const LocationSettings(
              accuracy: LocationAccuracy.high,
            ),
          ).timeout(const Duration(seconds: 8));
          lat = pos.latitude;
          lng = pos.longitude;
          accuracy = normalizeGpsAccuracyMeters(pos.accuracy);
          sampledAt = pos.timestamp;
        } catch (_) {
          // GPS timed out; do not reuse in-memory coordinates as live.
        }
      }
      if (!_isCurrentAvailability(sessionEpoch, availabilityEpoch)) return;
      if (lat == null ||
          lng == null ||
          accuracy == null ||
          sampledAt == null ||
          !isFreshDriverOnlineSample(sampledAt, DateTime.now())) {
        await _failGpsAvailability(
          reconcilePersistedOnlineState: wasAlreadyOnline,
          sessionEpoch: sessionEpoch,
          availabilityEpoch: availabilityEpoch,
        );
        return;
      }
      state = state.copyWith(
        isLoading: false,
        currentLat: lat,
        currentLng: lng,
      );
      await _goOnline(
        lat,
        lng,
        sampledAt: sampledAt,
        accuracy: accuracy,
        sessionEpoch: sessionEpoch,
        availabilityEpoch: availabilityEpoch,
      );
    } catch (e) {
      await _failGpsAvailability(
        reconcilePersistedOnlineState: wasAlreadyOnline,
        sessionEpoch: sessionEpoch,
        availabilityEpoch: availabilityEpoch,
      );
    }
  }

  Future<void> _failGpsAvailability({
    required bool reconcilePersistedOnlineState,
    required int sessionEpoch,
    required int availabilityEpoch,
  }) async {
    if (!_isCurrentAvailability(sessionEpoch, availabilityEpoch)) return;
    if (reconcilePersistedOnlineState) {
      try {
        await _api.post('/driver/offline');
      } catch (_) {}
    }
    if (!_isCurrentAvailability(sessionEpoch, availabilityEpoch)) return;
    _stopLocationUpdates();
    await _cancelAvailabilitySubscriptions();
    if (!_isCurrentAvailability(sessionEpoch, availabilityEpoch)) return;
    state = state.copyWith(
      isLoading: false,
      isOnline: false,
      error: 'Không lấy được vị trí GPS',
    );
  }

  // -----------------------------------------------------------------------
  // Location
  // -----------------------------------------------------------------------

  void _startLocationUpdates(
    double lat,
    double lng, {
    DateTime? sampledAt,
    double? accuracy,
  }) {
    // Emit the initial known position only when it came from a real GPS sample.
    if (sampledAt != null) {
      unawaited(
        _realtime.emitLocationPing(
          lat,
          lng,
          accuracy: accuracy,
          timestamp: sampledAt,
        ),
      );
    }
    BackgroundLocationService.instance.start(
      hasActiveOrder: state.activeOrder != null,
    );
  }

  void _stopLocationUpdates() {
    BackgroundLocationService.instance.stop();
  }

  void updateLocation(double lat, double lng, {DateTime? sampledAt}) {
    if (_isDisposed || !state.isAuthenticated) return;
    state = state.copyWith(currentLat: lat, currentLng: lng);
    if (state.isOnline && sampledAt != null) {
      unawaited(_realtime.emitLocationPing(lat, lng, timestamp: sampledAt));
    }
  }

  // -----------------------------------------------------------------------
  // Orders
  // -----------------------------------------------------------------------

  Future<void> acceptOrder(DispatchOffer offer) async {
    final sessionEpoch = _sessionEpoch;
    state = state.copyWith(isLoading: true, error: null).withOfferCleared();
    try {
      await _realtime.respondToDispatchOffer(
        orderId: offer.orderId,
        offerToken: offer.offerToken,
        accepted: true,
      );
      if (!_isCurrentSession(sessionEpoch)) return;
      await fetchActiveOrder();
      if (!_isCurrentSession(sessionEpoch)) return;
      state = state.copyWith(isLoading: false);
    } catch (_) {
      if (!_isCurrentSession(sessionEpoch)) return;
      state = state.copyWith(
        isLoading: false,
        error: 'DISPATCH_OFFER_RESPONSE_FAILED',
        pendingOffer: offer,
      );
    }
  }

  Future<void> declineOrder(DispatchOffer offer) async {
    final sessionEpoch = _sessionEpoch;
    state = state.withOfferCleared();
    try {
      await _realtime.respondToDispatchOffer(
        orderId: offer.orderId,
        offerToken: offer.offerToken,
        accepted: false,
      );
    } catch (_) {
      if (!_isCurrentSession(sessionEpoch)) return;
      state = state.copyWith(
        error: 'DISPATCH_OFFER_RESPONSE_FAILED',
        pendingOffer: offer,
      );
    }
  }

  Future<void> updateOrderStatus(String orderId, String status) async {
    final sessionEpoch = _sessionEpoch;
    state = state.copyWith(isLoading: true, error: null);
    try {
      await _api.patch(
        '/driver/orders/$orderId/status',
        data: {'status': status},
      );
      if (!_isCurrentSession(sessionEpoch)) return;

      if (status == 'delivered') {
        // Refresh stats & clear active order after a moment
        await fetchTodayStats();
        if (!_isCurrentSession(sessionEpoch)) return;
        state = state.copyWith(
          isLoading: false,
          activeOrder: null,
          successMessage: 'Giao hàng thành công!',
        );
        BackgroundLocationService.instance.setActiveOrderMode(false);
      } else {
        await fetchActiveOrder();
        if (!_isCurrentSession(sessionEpoch)) return;
        state = state.copyWith(isLoading: false);
      }
    } on DioException catch (e) {
      if (!_isCurrentSession(sessionEpoch)) return;
      final msg =
          e.response?.data?['message'] as String? ??
          'Cập nhật trạng thái thất bại';
      state = state.copyWith(isLoading: false, error: msg);
    } catch (e) {
      if (!_isCurrentSession(sessionEpoch)) return;
      state = state.copyWith(isLoading: false, error: 'Có lỗi xảy ra');
    }
  }

  // -----------------------------------------------------------------------
  // Dashboard / Stats / Earnings
  // -----------------------------------------------------------------------

  Future<void> fetchTodayStats() async {
    final sessionEpoch = _sessionEpoch;
    try {
      final response = await _api.get(
        '/driver/earnings',
        queryParameters: {'period': 'today'},
      );
      final data = Map<String, dynamic>.from(
        response.data as Map<String, dynamic>,
      )..['rating'] = state.rating;
      if (!_isCurrentSession(sessionEpoch)) return;
      state = state.copyWith(todayStats: DriverTodayStats.fromJson(data));
    } catch (_) {
      if (!_isCurrentSession(sessionEpoch)) return;
      state = state.copyWith(error: 'DRIVER_TODAY_STATS_UNAVAILABLE');
    }
  }

  Future<void> fetchRecentOrders() async {
    final sessionEpoch = _sessionEpoch;
    try {
      final response = await _api.get(
        '/driver/orders/history',
        queryParameters: {'limit': 5},
      );
      final list = (response.data as List<dynamic>)
          .map((item) => OrderModel.fromJson(item as Map<String, dynamic>))
          .toList(growable: false);
      if (!_isCurrentSession(sessionEpoch)) return;
      state = state.copyWith(recentOrders: list);
    } catch (_) {
      if (!_isCurrentSession(sessionEpoch)) return;
      state = state.copyWith(error: 'DRIVER_ORDER_HISTORY_UNAVAILABLE');
    }
  }

  Future<void> fetchActiveOrder() async {
    final sessionEpoch = _sessionEpoch;
    try {
      final response = await _api.get('/driver/orders/active');
      if (!_isCurrentSession(sessionEpoch)) return;
      if (response.data != null &&
          (response.data as Map<String, dynamic>).isNotEmpty) {
        final order = OrderModel.fromJson(
          response.data as Map<String, dynamic>,
        );
        state = state.copyWith(activeOrder: order);
        await _listenOrderStatus(order.id);
        if (!_isCurrentSession(sessionEpoch)) return;
        BackgroundLocationService.instance.setActiveOrderMode(true);
      } else {
        await _cancelOrderStatusSubscriptions();
        if (!_isCurrentSession(sessionEpoch)) return;
        state = state.copyWith(activeOrder: null);
        BackgroundLocationService.instance.setActiveOrderMode(false);
      }
    } catch (_) {
      if (!_isCurrentSession(sessionEpoch)) return;
      state = state.copyWith(error: 'DRIVER_ACTIVE_ORDER_UNAVAILABLE');
    }
  }

  Future<void> fetchEarnings(String period) async {
    final sessionEpoch = _sessionEpoch;
    try {
      final response = await _api.get(
        '/driver/earnings',
        queryParameters: {'period': period},
      );
      final earnings = DriverEarnings.fromJson(
        response.data as Map<String, dynamic>,
      );
      if (!_isCurrentSession(sessionEpoch)) return;
      state = state.copyWith(earnings: earnings);
    } catch (_) {
      if (!_isCurrentSession(sessionEpoch)) return;
      state = state.copyWith(error: 'DRIVER_EARNINGS_UNAVAILABLE');
    }
  }

  Future<List<OrderModel>> fetchDeliveryHistory({
    String? fromDate,
    String? toDate,
  }) async {
    final sessionEpoch = _sessionEpoch;
    try {
      final params = <String, dynamic>{};
      if (fromDate != null) params['fromDate'] = fromDate;
      if (toDate != null) params['toDate'] = toDate;
      final response = await _api.get(
        '/driver/orders/history',
        queryParameters: params,
      );
      final orders = (response.data as List<dynamic>)
          .map((e) => OrderModel.fromJson(e as Map<String, dynamic>))
          .toList();
      return _isCurrentSession(sessionEpoch) ? orders : const [];
    } catch (e) {
      if (!_isCurrentSession(sessionEpoch)) return const [];
      state = state.copyWith(error: 'DRIVER_ORDER_HISTORY_UNAVAILABLE');
      rethrow;
    }
  }

  // -----------------------------------------------------------------------
  // WebSocket
  // -----------------------------------------------------------------------

  Future<void> _listenOrderStatus(String orderId) async {
    final sessionEpoch = _sessionEpoch;
    await _cancelOrderStatusSubscriptions();
    if (!_isCurrentSession(sessionEpoch)) return;
    await _realtime.connect();
    if (!_isCurrentSession(sessionEpoch)) return;
    await _realtime.subscribeOrder(orderId);
    if (!_isCurrentSession(sessionEpoch)) return;

    _orderStatusSub = _realtime.onOrderStatus.listen((data) async {
      if (!_isCurrentSession(sessionEpoch)) return;
      final id = data['orderId'] as String? ?? data['order_id'] as String?;
      final status = data['status'] as String?;
      if (id == orderId && status != null && state.activeOrder?.id == id) {
        if (status == 'delivered') {
          await fetchTodayStats();
          if (!_isCurrentSession(sessionEpoch)) return;
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
      if (!_isCurrentSession(sessionEpoch)) return;
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
    final sessionEpoch = _sessionEpoch;
    await _cancelDispatchOfferSubscriptions();
    if (!_isCurrentSession(sessionEpoch)) return;
    await _realtime.connect();
    if (!_isCurrentSession(sessionEpoch)) return;
    _offerSub = _realtime.onDriverOffer.listen((data) {
      if (!_isCurrentSession(sessionEpoch)) return;
      try {
        final offer = DispatchOffer.fromJson(data);
        state = state.copyWith(pendingOffer: offer);
      } catch (_) {
        state = state.copyWith(error: 'DISPATCH_OFFER_INVALID');
      }
    });
    _assignedOrderSub = _realtime.onDriverOrderAssigned.listen((data) async {
      if (!_isCurrentSession(sessionEpoch) || data['orderId'] is! String) {
        return;
      }
      await fetchActiveOrder();
      if (!_isCurrentSession(sessionEpoch)) return;
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
    if (_isDisposed) {
      return;
    }
    final activeOrderId = state.activeOrder?.id;
    _isDisposed = true;
    _invalidateSession();
    _invalidateAvailability();
    unawaited(_teardownSessionResources(activeOrderId: activeOrderId));
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
