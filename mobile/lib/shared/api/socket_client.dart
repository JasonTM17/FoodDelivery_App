import 'dart:async';
import 'package:flutter/foundation.dart';
import 'package:socket_io_client/socket_io_client.dart' as io;
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import '../config/app_config.dart';
import 'realtime_transport.dart';

Map<String, dynamic> buildDriverLocationPingPayload(
  double lat,
  double lng, {
  double? bearing,
  double? speed,
  double? accuracy,
  required DateTime timestamp,
}) {
  return {
    'lat': lat,
    'lng': lng,
    if (bearing != null && bearing.isFinite) 'bearing': bearing,
    if (speed != null && speed.isFinite) 'speed': speed,
    if (accuracy != null && accuracy.isFinite) 'accuracy': accuracy,
    'timestamp': timestamp.toUtc().toIso8601String(),
  };
}

class _BufferedEvent {
  final String namespace;
  final String name;
  final dynamic data;
  const _BufferedEvent(this.namespace, this.name, this.data);
}

class SocketClient implements RealtimeTransport, LocationPingEmitter {
  static SocketClient? _instance;
  final _sockets = <String, io.Socket>{};
  final _connectedNamespaces = <String>{};
  final FlutterSecureStorage _storage = const FlutterSecureStorage();
  Future<void>? _connectInFlight;

  static const int _maxBuffer = 50;
  static const String _eventsNamespace = '/events';
  static const String _trackingNamespace = '/tracking';
  static const String _dispatchNamespace = '/dispatch';
  static const String _notificationsNamespace = '/notifications';
  static const _legacyServerReadyDelay = Duration(seconds: 3);

  final _buffer = <_BufferedEvent>[];
  final _readyFallbackTimers = <String, Timer>{};
  DateTime? _lastLocationEmit;

  final _driverLocationController =
      StreamController<Map<String, dynamic>>.broadcast();
  final _orderStatusController =
      StreamController<Map<String, dynamic>>.broadcast();
  final _etaController = StreamController<Map<String, dynamic>>.broadcast();
  final _authRefreshController = StreamController<void>.broadcast();
  final _notificationController =
      StreamController<Map<String, dynamic>>.broadcast();
  final _driverOfferController =
      StreamController<Map<String, dynamic>>.broadcast();
  final _driverOrderAssignedController =
      StreamController<Map<String, dynamic>>.broadcast();

  Stream<Map<String, dynamic>> get onDriverLocation =>
      _driverLocationController.stream;
  Stream<Map<String, dynamic>> get onOrderStatus =>
      _orderStatusController.stream;
  Stream<Map<String, dynamic>> get onEtaUpdate => _etaController.stream;
  Stream<Map<String, dynamic>> get onNotification =>
      _notificationController.stream;

  /// Fires when the server dispatches a new delivery offer to this driver.
  Stream<Map<String, dynamic>> get onDriverOffer =>
      _driverOfferController.stream;
  Stream<Map<String, dynamic>> get onDriverOrderAssigned =>
      _driverOrderAssignedController.stream;

  // Fires when server emits 'auth:refresh_required' — caller should refresh token
  // then call reconnectWithToken(newToken).
  Stream<void> get onAuthRefreshRequired => _authRefreshController.stream;

  bool get isConnected => _connectedNamespaces.isNotEmpty;

  SocketClient._();

  static SocketClient get instance {
    _instance ??= SocketClient._();
    return _instance!;
  }

  Future<void> connect() {
    if (_sockets.isNotEmpty) return Future.value();

    return _connectInFlight ??= _connectAllNamespaces();
  }

  Future<void> _connectAllNamespaces() async {
    try {
      await _initializeNamespaces();
    } catch (_) {
      _connectInFlight = null;
      rethrow;
    }
  }

  Future<void> _initializeNamespaces() async {
    final token = await _storage.read(key: 'auth_token');
    final stored = await _storage.read(key: AppConfig.apiBaseUrlStorageKey);
    final wsUrl = stored != null && stored.trim().isNotEmpty
        ? AppConfig.socketBaseUrlFromApiBaseUrl(stored)
        : AppConfig.socketBaseUrl;

    _connectNamespace(_eventsNamespace, wsUrl, token);
    _connectNamespace(_trackingNamespace, wsUrl, token);
    _connectNamespace(_dispatchNamespace, wsUrl, token);
    _connectNamespace(_notificationsNamespace, wsUrl, token);

    _pipe(
      _trackingNamespace,
      'driver:location_changed',
      _driverLocationController,
    );
    _pipe(_trackingNamespace, 'driver:location', _driverLocationController);
    _pipe(_trackingNamespace, 'delivery:eta_updated', _etaController);
    _pipe(_eventsNamespace, 'order:status:changed', _orderStatusController);
    _pipe(_eventsNamespace, 'order:status', _orderStatusController);
    _pipe(_notificationsNamespace, 'notification:new', _notificationController);
    _pipe(_dispatchNamespace, 'driver:new_order', _driverOfferController);
    _pipe(_dispatchNamespace, 'driver:offer', _driverOfferController);
    _pipe(
      _dispatchNamespace,
      'driver:order_assigned',
      _driverOrderAssignedController,
    );

    for (final socket in _sockets.values) {
      socket.connect();
    }
  }

  void _connectNamespace(String namespace, String wsUrl, String? token) {
    final socket = io.io(
      '$wsUrl$namespace',
      io.OptionBuilder()
          .setTransports(['websocket'])
          .setAuth({'token': token ?? ''})
          .enableReconnection()
          .setReconnectionDelay(1000)
          .setReconnectionDelayMax(30000)
          .disableForceNew()
          .disableAutoConnect()
          .build(),
    );

    socket.onConnect((_) {
      _debugSocket(namespace, 'transport connected; awaiting authentication');
      _scheduleLegacyReadyFallback(namespace);
    });

    // Gate buffered events on server-side authentication. The Socket.IO
    // transport can connect before the gateway finishes its async JWT/user
    // lookup, so flushing on `connect` can silently drop the first GPS ping.
    socket.on('auth:ready', (_) {
      _debugSocket(namespace, 'server authentication complete');
      _markNamespaceReady(namespace);
    });

    socket.onDisconnect((_) {
      _readyFallbackTimers.remove(namespace)?.cancel();
      _connectedNamespaces.remove(namespace);
      _debugSocket(namespace, 'disconnected');
    });

    socket.onConnectError((data) {
      // ignore: avoid_print
      print('[Socket][$namespace] Connect error: $data');
    });

    socket.onError((data) {
      // ignore: avoid_print
      print('[Socket][$namespace] Error: $data');
    });

    socket.onReconnect((_) => _scheduleLegacyReadyFallback(namespace));

    socket.on('auth:refresh_required', (_) => _authRefreshController.add(null));
    socket.on('driver:location_rejected', (data) {
      if (!kDebugMode) return;
      final payload = _asStringMap(data);
      debugPrint(
        '[GPS] backend rejected location: ${payload?['reason'] ?? 'unknown'}',
      );
    });

    _sockets[namespace] = socket;
  }

  void _scheduleLegacyReadyFallback(String namespace) {
    _readyFallbackTimers.remove(namespace)?.cancel();
    _readyFallbackTimers[namespace] = Timer(_legacyServerReadyDelay, () {
      // One release-cycle fallback for a rollback to a server which predates
      // the auth-ready event. A successful current server always emits it.
      _markNamespaceReady(namespace);
    });
  }

  void _markNamespaceReady(String namespace) {
    _readyFallbackTimers.remove(namespace)?.cancel();
    if (!_connectedNamespaces.add(namespace)) return;
    _debugSocket(namespace, 'ready for application events');
    _flushBuffer(namespace);
  }

  void _debugSocket(String namespace, String message) {
    if (kDebugMode) debugPrint('[Socket][$namespace] $message');
  }

  void _pipe(
    String namespace,
    String event,
    StreamController<Map<String, dynamic>> controller,
  ) {
    _sockets[namespace]?.on(event, (data) {
      final payload = _asStringMap(data);
      if (payload != null) controller.add(payload);
    });
  }

  void _flushBuffer(String namespace) {
    final pending = List.of(_buffer);
    _buffer.clear();
    for (final event in pending) {
      if (event.namespace == namespace) {
        _emitToNamespace(event.namespace, event.name, event.data);
      } else {
        _buffer.add(event);
      }
    }
  }

  // Call after a successful token refresh triggered by onAuthRefreshRequired.
  Future<void> reconnectWithToken(String newToken) async {
    await disconnect();
    await _storage.write(key: 'auth_token', value: newToken);
    await connect();
  }

  Future<void> disconnect() async {
    _connectInFlight = null;
    for (final timer in _readyFallbackTimers.values) {
      timer.cancel();
    }
    _readyFallbackTimers.clear();
    for (final socket in _sockets.values) {
      socket.disconnect();
    }
    _sockets.clear();
    _connectedNamespaces.clear();
  }

  Future<void> subscribeOrder(String orderId) async {
    final payload = {'orderId': orderId};
    _emitToNamespace(_eventsNamespace, 'order:subscribe', payload);
    _emitToNamespace(_trackingNamespace, 'order:subscribe', payload);
  }

  Future<void> unsubscribeOrder(String orderId) async {
    final payload = {'orderId': orderId};
    _emitToNamespace(_eventsNamespace, 'order:unsubscribe', payload);
    _emitToNamespace(_trackingNamespace, 'order:unsubscribe', payload);
  }

  // Throttled to one ping per 250 ms — for driver location updates.
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
    if (!bypassThrottle) {
      _lastLocationEmit = now;
    }
    _emitToNamespace(
      _trackingNamespace,
      'driver:location',
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

  @visibleForTesting
  void resetLocationThrottleForTesting() {
    _lastLocationEmit = null;
  }

  Future<void> respondToDispatchOffer({
    required String orderId,
    required String offerToken,
    required bool accepted,
  }) async {
    _emitToNamespace(
      _dispatchNamespace,
      accepted ? 'dispatch:accept' : 'dispatch:reject',
      {'orderId': orderId, 'offerToken': offerToken},
    );
  }

  // General-purpose emit. Buffers up to 50 events while offline; flushed on reconnect.
  void emit(String event, dynamic data) {
    _emitToNamespace(_namespaceForEvent(event), event, data);
  }

  void _emitToNamespace(String namespace, String event, dynamic data) {
    final socket = _sockets[namespace];
    if (_connectedNamespaces.contains(namespace) && socket != null) {
      socket.emit(event, data);
    } else {
      if (_buffer.length < _maxBuffer) {
        _buffer.add(_BufferedEvent(namespace, event, data));
      }
    }
  }

  String _namespaceForEvent(String event) {
    if (event == 'driver:location' ||
        event.startsWith('tracking:') ||
        event.startsWith('delivery:')) {
      return _trackingNamespace;
    }
    if (event.startsWith('dispatch:') ||
        event == 'driver:new_order' ||
        event == 'driver:offer') {
      return _dispatchNamespace;
    }
    if (event.startsWith('notification:') ||
        event.startsWith('notifications:')) {
      return _notificationsNamespace;
    }
    return _eventsNamespace;
  }

  Map<String, dynamic>? _asStringMap(dynamic data) {
    if (data is Map<String, dynamic>) return data;
    if (data is Map) return Map<String, dynamic>.from(data);
    return null;
  }

  void dispose() {
    _driverLocationController.close();
    _orderStatusController.close();
    _etaController.close();
    _authRefreshController.close();
    _notificationController.close();
    _driverOfferController.close();
    _driverOrderAssignedController.close();
    unawaited(disconnect());
    _instance = null;
  }
}
