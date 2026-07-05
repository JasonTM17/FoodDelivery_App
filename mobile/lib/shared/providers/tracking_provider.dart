import 'dart:async';
import 'package:api_client/api_client.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../api/api_client.dart';
import '../api/socket_client.dart';
import '../maps/lat_lng_validation.dart';
import '../utils/backend_date_time.dart';
import 'order_provider.dart';

const _trackingUnset = Object();

final trackingProvider = StateNotifierProvider<TrackingNotifier, TrackingState>(
  (ref) {
    final orderNotifier = ref.read(orderProvider.notifier);
    return TrackingNotifier(orderNotifier);
  },
);

class TrackingState {
  final bool isConnected;
  final double? driverLatitude;
  final double? driverLongitude;
  final String? currentOrderId;
  final List<Map<String, dynamic>> driverLocations;
  final int? etaMinutes;
  final String? etaSource;
  final bool etaDegraded;
  final String? routePolyline;
  final String? routePhase;
  final bool routeUpdateReceived;

  const TrackingState({
    this.isConnected = false,
    this.driverLatitude,
    this.driverLongitude,
    this.currentOrderId,
    this.driverLocations = const [],
    this.etaMinutes,
    this.etaSource,
    this.etaDegraded = false,
    this.routePolyline,
    this.routePhase,
    this.routeUpdateReceived = false,
  });

  TrackingState copyWith({
    bool? isConnected,
    Object? driverLatitude = _trackingUnset,
    Object? driverLongitude = _trackingUnset,
    String? currentOrderId,
    List<Map<String, dynamic>>? driverLocations,
    Object? etaMinutes = _trackingUnset,
    Object? etaSource = _trackingUnset,
    bool? etaDegraded,
    Object? routePolyline = _trackingUnset,
    Object? routePhase = _trackingUnset,
    bool? routeUpdateReceived,
  }) {
    return TrackingState(
      isConnected: isConnected ?? this.isConnected,
      driverLatitude: identical(driverLatitude, _trackingUnset)
          ? this.driverLatitude
          : driverLatitude as double?,
      driverLongitude: identical(driverLongitude, _trackingUnset)
          ? this.driverLongitude
          : driverLongitude as double?,
      currentOrderId: currentOrderId ?? this.currentOrderId,
      driverLocations: driverLocations ?? this.driverLocations,
      etaMinutes: identical(etaMinutes, _trackingUnset)
          ? this.etaMinutes
          : etaMinutes as int?,
      etaSource: identical(etaSource, _trackingUnset)
          ? this.etaSource
          : etaSource as String?,
      etaDegraded: etaDegraded ?? this.etaDegraded,
      routePolyline: identical(routePolyline, _trackingUnset)
          ? this.routePolyline
          : routePolyline as String?,
      routePhase: identical(routePhase, _trackingUnset)
          ? this.routePhase
          : routePhase as String?,
      routeUpdateReceived: routeUpdateReceived ?? this.routeUpdateReceived,
    );
  }
}

String? resolveTrackingRoutePolyline(
  TrackingState tracking,
  String? persistedRoutePolyline,
) {
  return tracking.routeUpdateReceived
      ? tracking.routePolyline
      : persistedRoutePolyline;
}

TrackingState mergeTrackingSnapshot(
  TrackingState current,
  TrackingResponse snapshot,
) {
  final driverLocation = snapshot.driverLocation;
  final hasDriverLocation = isValidDeliveryLatLng(
    driverLocation?.lat,
    driverLocation?.lng,
  );
  final driverLocations = hasDriverLocation
      ? _appendDriverLocation(
          current.driverLocations,
          driverLocation!.lat,
          driverLocation.lng,
          driverLocation.lastUpdated,
        )
      : current.driverLocations;

  return current.copyWith(
    driverLatitude: hasDriverLocation ? driverLocation!.lat : null,
    driverLongitude: hasDriverLocation ? driverLocation!.lng : null,
    driverLocations: driverLocations,
    etaMinutes: snapshot.etaMinutes,
    etaSource: snapshot.etaMinutes == null ? null : 'snapshot',
    etaDegraded: snapshot.etaMinutes == null,
    routePolyline: snapshot.routePolyline,
    routePhase: snapshot.routePhase,
    routeUpdateReceived: true,
  );
}

class TrackingNotifier extends StateNotifier<TrackingState> {
  final OrderNotifier _orderNotifier;
  final ApiClient _api;
  final SocketClient _socketClient;
  StreamSubscription<Map<String, dynamic>>? _locationSub;
  StreamSubscription<Map<String, dynamic>>? _etaSub;
  StreamSubscription<Map<String, dynamic>>? _statusSub;

  TrackingNotifier(
    this._orderNotifier, {
    ApiClient? apiClient,
    SocketClient? socketClient,
  }) : _api = apiClient ?? ApiClient.instance,
       _socketClient = socketClient ?? SocketClient.instance,
       super(const TrackingState());

  Future<void> startTracking(String orderId) async {
    _locationSub?.cancel();
    _etaSub?.cancel();
    _statusSub?.cancel();
    state = TrackingState(currentOrderId: orderId);

    await _loadTrackingSnapshot(orderId);
    await _socketClient.connect();

    _socketClient.subscribeOrder(orderId);
    state = state.copyWith(isConnected: _socketClient.isConnected);

    _locationSub = _socketClient.onDriverLocation.listen((data) {
      final lat =
          (data['lat'] as num?)?.toDouble() ??
          (data['latitude'] as num?)?.toDouble();
      final lng =
          (data['lng'] as num?)?.toDouble() ??
          (data['longitude'] as num?)?.toDouble();
      if (isValidDeliveryLatLng(lat, lng)) {
        final driverLat = lat!;
        final driverLng = lng!;
        final updatedLocations = [
          ...state.driverLocations,
          {'lat': driverLat, 'lng': driverLng, 'timestamp': data['timestamp']},
        ];
        // Keep last 50 locations
        if (updatedLocations.length > 50) {
          updatedLocations.removeAt(0);
        }
        state = state.copyWith(
          driverLatitude: driverLat,
          driverLongitude: driverLng,
          driverLocations: updatedLocations,
        );
        _orderNotifier.updateDriverLocation(orderId, driverLat, driverLng);
      }
    });

    _etaSub = _socketClient.onEtaUpdate.listen((data) {
      if (data['orderId'] != orderId) return;
      final eta = (data['etaMinutes'] as num?)?.toInt();
      state = state.copyWith(
        etaMinutes: eta,
        etaSource: data['source'] as String?,
        etaDegraded: data['degraded'] == true,
        routePolyline: data['routePolyline'] as String?,
        routePhase: data['routePhase'] as String?,
        routeUpdateReceived: true,
      );
    });

    _statusSub = _socketClient.onOrderStatus.listen((data) {
      if (data['orderId'] != null && data['orderId'] != orderId) return;
      final status = data['status'] as String?;
      if (status != null) {
        _orderNotifier.updateOrderStatus(
          orderId,
          status,
          updatedAt: parseBackendDateTimeOrNull(data['timestamp']),
        );
      }
    });
  }

  void stopTracking() {
    final orderId = state.currentOrderId;
    if (orderId != null) {
      _socketClient.unsubscribeOrder(orderId);
    }
    _locationSub?.cancel();
    _etaSub?.cancel();
    _statusSub?.cancel();
    state = const TrackingState();
  }

  @override
  void dispose() {
    _locationSub?.cancel();
    _etaSub?.cancel();
    _statusSub?.cancel();
    if (state.currentOrderId != null) {
      _socketClient.unsubscribeOrder(state.currentOrderId!);
    }
    super.dispose();
  }

  Future<void> _loadTrackingSnapshot(String orderId) async {
    try {
      final response = await _api.get('/orders/$orderId/tracking');
      final data = response.data;
      if (data is! Map<String, dynamic>) return;

      final snapshot = TrackingResponse.fromJson(data);
      if (snapshot.orderId != orderId) return;

      state = mergeTrackingSnapshot(state, snapshot);
      _orderNotifier.updateOrderStatus(orderId, snapshot.status);

      final driverLocation = snapshot.driverLocation;
      if (isValidDeliveryLatLng(driverLocation?.lat, driverLocation?.lng)) {
        _orderNotifier.updateDriverLocation(
          orderId,
          driverLocation!.lat,
          driverLocation.lng,
        );
      }
    } catch (_) {
      // Tracking remains realtime-first when the snapshot endpoint is temporarily unavailable.
    }
  }
}

List<Map<String, dynamic>> _appendDriverLocation(
  List<Map<String, dynamic>> current,
  double lat,
  double lng,
  String? timestamp,
) {
  final updated = [
    ...current,
    {'lat': lat, 'lng': lng, 'timestamp': timestamp},
  ];
  if (updated.length > 50) {
    return updated.sublist(updated.length - 50);
  }
  return updated;
}
