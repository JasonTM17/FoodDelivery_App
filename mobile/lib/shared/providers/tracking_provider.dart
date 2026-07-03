import 'dart:async';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../api/socket_client.dart';
import 'order_provider.dart';

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

  const TrackingState({
    this.isConnected = false,
    this.driverLatitude,
    this.driverLongitude,
    this.currentOrderId,
    this.driverLocations = const [],
    this.etaMinutes,
    this.etaSource,
    this.etaDegraded = false,
  });

  TrackingState copyWith({
    bool? isConnected,
    double? driverLatitude,
    double? driverLongitude,
    String? currentOrderId,
    List<Map<String, dynamic>>? driverLocations,
    int? etaMinutes,
    String? etaSource,
    bool? etaDegraded,
  }) {
    return TrackingState(
      isConnected: isConnected ?? this.isConnected,
      driverLatitude: driverLatitude ?? this.driverLatitude,
      driverLongitude: driverLongitude ?? this.driverLongitude,
      currentOrderId: currentOrderId ?? this.currentOrderId,
      driverLocations: driverLocations ?? this.driverLocations,
      etaMinutes: etaMinutes ?? this.etaMinutes,
      etaSource: etaSource ?? this.etaSource,
      etaDegraded: etaDegraded ?? this.etaDegraded,
    );
  }
}

class TrackingNotifier extends StateNotifier<TrackingState> {
  final OrderNotifier _orderNotifier;
  final SocketClient _socketClient = SocketClient.instance;
  StreamSubscription<Map<String, dynamic>>? _locationSub;
  StreamSubscription<Map<String, dynamic>>? _etaSub;
  StreamSubscription<Map<String, dynamic>>? _statusSub;

  TrackingNotifier(this._orderNotifier) : super(const TrackingState());

  Future<void> startTracking(String orderId) async {
    _locationSub?.cancel();
    _etaSub?.cancel();
    _statusSub?.cancel();
    state = TrackingState(currentOrderId: orderId);

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
      if (lat != null && lng != null) {
        final updatedLocations = [
          ...state.driverLocations,
          {'lat': lat, 'lng': lng, 'timestamp': data['timestamp']},
        ];
        // Keep last 50 locations
        if (updatedLocations.length > 50) {
          updatedLocations.removeAt(0);
        }
        state = state.copyWith(
          driverLatitude: lat,
          driverLongitude: lng,
          driverLocations: updatedLocations,
        );
        _orderNotifier.updateDriverLocation(orderId, lat, lng);
      }
    });

    _etaSub = _socketClient.onEtaUpdate.listen((data) {
      if (data['orderId'] != orderId) return;
      final eta = (data['etaMinutes'] as num?)?.toInt();
      if (eta == null) return;
      state = state.copyWith(
        etaMinutes: eta,
        etaSource: data['source'] as String?,
        etaDegraded: data['degraded'] == true,
      );
    });

    _statusSub = _socketClient.onOrderStatus.listen((data) {
      if (data['orderId'] != null && data['orderId'] != orderId) return;
      final status = data['status'] as String?;
      if (status != null) {
        _orderNotifier.updateOrderStatus(orderId, status);
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
}
