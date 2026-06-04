import 'dart:async';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../api/socket_client.dart';
import 'order_provider.dart';

final trackingProvider = StateNotifierProvider<TrackingNotifier, TrackingState>((ref) {
  final orderNotifier = ref.read(orderProvider.notifier);
  return TrackingNotifier(orderNotifier);
});

class TrackingState {
  final bool isConnected;
  final double? driverLatitude;
  final double? driverLongitude;
  final String? currentOrderId;
  final List<Map<String, dynamic>> driverLocations;
  final List<Map<String, dynamic>> chatMessages;

  const TrackingState({
    this.isConnected = false,
    this.driverLatitude,
    this.driverLongitude,
    this.currentOrderId,
    this.driverLocations = const [],
    this.chatMessages = const [],
  });

  TrackingState copyWith({
    bool? isConnected,
    double? driverLatitude,
    double? driverLongitude,
    String? currentOrderId,
    List<Map<String, dynamic>>? driverLocations,
    List<Map<String, dynamic>>? chatMessages,
  }) {
    return TrackingState(
      isConnected: isConnected ?? this.isConnected,
      driverLatitude: driverLatitude ?? this.driverLatitude,
      driverLongitude: driverLongitude ?? this.driverLongitude,
      currentOrderId: currentOrderId ?? this.currentOrderId,
      driverLocations: driverLocations ?? this.driverLocations,
      chatMessages: chatMessages ?? this.chatMessages,
    );
  }
}

class TrackingNotifier extends StateNotifier<TrackingState> {
  final OrderNotifier _orderNotifier;
  final SocketClient _socketClient = SocketClient.instance;
  StreamSubscription<Map<String, dynamic>>? _locationSub;
  StreamSubscription<Map<String, dynamic>>? _statusSub;
  StreamSubscription<Map<String, dynamic>>? _chatSub;

  TrackingNotifier(this._orderNotifier) : super(const TrackingState());

  Future<void> startTracking(String orderId) async {
    state = state.copyWith(currentOrderId: orderId);

    await _socketClient.connect();

    _socketClient.subscribeOrder(orderId);
    state = state.copyWith(isConnected: _socketClient.isConnected);

    _locationSub = _socketClient.onDriverLocation.listen((data) {
      final lat = (data['latitude'] as num?)?.toDouble();
      final lng = (data['longitude'] as num?)?.toDouble();
      if (lat != null && lng != null) {
        final updatedLocations = [
          ...state.driverLocations,
          {'latitude': lat, 'longitude': lng, 'timestamp': DateTime.now().toIso8601String()},
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

    _statusSub = _socketClient.onOrderStatus.listen((data) {
      final status = data['status'] as String?;
      if (status != null) {
        _orderNotifier.updateOrderStatus(orderId, status);
      }
    });

    _chatSub = _socketClient.onChatMessage.listen((data) {
      final updatedMessages = [...state.chatMessages, data];
      state = state.copyWith(chatMessages: updatedMessages);
    });
  }

  void stopTracking() {
    final orderId = state.currentOrderId;
    if (orderId != null) {
      _socketClient.unsubscribeOrder(orderId);
    }
    _locationSub?.cancel();
    _statusSub?.cancel();
    _chatSub?.cancel();
    state = const TrackingState();
  }

  void sendChatMessage(String message) {
    final orderId = state.currentOrderId;
    if (orderId != null) {
      _socketClient.sendChatMessage(orderId, message);
      final updatedMessages = [
        ...state.chatMessages,
        {
          'from': 'customer',
          'message': message,
          'timestamp': DateTime.now().toIso8601String(),
        },
      ];
      state = state.copyWith(chatMessages: updatedMessages);
    }
  }

  @override
  void dispose() {
    _locationSub?.cancel();
    _statusSub?.cancel();
    _chatSub?.cancel();
    if (state.currentOrderId != null) {
      _socketClient.unsubscribeOrder(state.currentOrderId!);
    }
    super.dispose();
  }
}
