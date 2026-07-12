import 'package:flutter/foundation.dart';
import '../config/app_config.dart';
import 'api_client.dart';
import 'realtime_transport.dart';
import 'socket_client.dart';
import 'supabase_realtime_client.dart';

export 'realtime_transport.dart' show LocationPingEmitter, RealtimeTransport;

typedef RealtimeCommandPost =
    Future<void> Function(String path, Map<String, dynamic> data);

class RealtimeClient implements LocationPingEmitter {
  static RealtimeClient? _instance;

  final RealtimeProvider _provider;
  final RealtimeTransport _transport;
  final RealtimeCommandPost _postCommand;
  DateTime? _lastLocationEmit;

  RealtimeClient._({
    required RealtimeProvider provider,
    required RealtimeTransport transport,
    required RealtimeCommandPost postCommand,
  }) : _provider = provider,
       _transport = transport,
       _postCommand = postCommand;

  @visibleForTesting
  RealtimeClient.forTesting({
    required RealtimeProvider provider,
    required RealtimeTransport transport,
    required RealtimeCommandPost postCommand,
  }) : this._(
         provider: provider,
         transport: transport,
         postCommand: postCommand,
       );

  static RealtimeClient get instance {
    final existing = _instance;
    if (existing != null) return existing;
    final provider = AppConfig.realtimeProvider;
    final transport = switch (provider) {
      RealtimeProvider.socketio => SocketClient.instance,
      RealtimeProvider.supabase => SupabaseRealtimeClient(),
    };
    return _instance = RealtimeClient._(
      provider: provider,
      transport: transport,
      postCommand: (path, data) async {
        await ApiClient.instance.post<dynamic>(path, data: data);
      },
    );
  }

  @override
  bool get isConnected => _transport.isConnected;

  Stream<Map<String, dynamic>> get onDriverLocation =>
      _transport.onDriverLocation;
  Stream<Map<String, dynamic>> get onOrderStatus => _transport.onOrderStatus;
  Stream<Map<String, dynamic>> get onEtaUpdate => _transport.onEtaUpdate;
  Stream<Map<String, dynamic>> get onNotification => _transport.onNotification;
  Stream<Map<String, dynamic>> get onDriverOffer => _transport.onDriverOffer;
  Stream<Map<String, dynamic>> get onDriverOrderAssigned =>
      _transport.onDriverOrderAssigned;
  Stream<void> get onAuthRefreshRequired => _transport.onAuthRefreshRequired;

  Future<void> connect() => _transport.connect();

  Future<void> subscribeOrder(String orderId) =>
      _transport.subscribeOrder(orderId);

  Future<void> unsubscribeOrder(String orderId) =>
      _transport.unsubscribeOrder(orderId);

  Future<void> reconnectWithToken(String newToken) =>
      _transport.reconnectWithToken(newToken);

  Future<void> disconnect() => _transport.disconnect();

  @override
  Future<void> emitLocationPing(
    double lat,
    double lng, {
    double? bearing,
    double? speed,
    double? accuracy,
    required DateTime timestamp,
    bool bypassThrottle = false,
  }) async {
    final now = DateTime.now();
    if (!bypassThrottle &&
        _lastLocationEmit != null &&
        now.difference(_lastLocationEmit!) <
            const Duration(milliseconds: 250)) {
      return;
    }
    if (!bypassThrottle) _lastLocationEmit = now;

    // GPS is a state-changing command, so it always uses the authenticated
    // HTTP endpoint. Socket.IO and Supabase Broadcast remain receive-side
    // transports for fan-out. This gives the mobile offline buffer a concrete
    // request result to retry instead of silently losing an outbound event.
    await _postCommand(
      '/driver/location',
      buildDriverLocationPingPayload(
        lat,
        lng,
        bearing: bearing,
        speed: speed,
        accuracy: accuracy,
        timestamp: timestamp,
      ),
    );
  }

  Future<void> respondToDispatchOffer({
    required String orderId,
    required String offerToken,
    required bool accepted,
  }) async {
    if (_provider == RealtimeProvider.socketio) {
      await (_transport as SocketClient).respondToDispatchOffer(
        orderId: orderId,
        offerToken: offerToken,
        accepted: accepted,
      );
      return;
    }

    await _postCommand('/driver/dispatch/offers/$orderId/respond', {
      'offerToken': offerToken,
      'decision': accepted ? 'accept' : 'reject',
    });
  }

  @visibleForTesting
  void resetLocationThrottleForTesting() {
    _lastLocationEmit = null;
  }

  void dispose() {
    _transport.dispose();
    _instance = null;
  }
}
