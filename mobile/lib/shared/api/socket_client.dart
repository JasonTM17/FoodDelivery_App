import 'dart:async';
import 'package:socket_io_client/socket_io_client.dart' as io;
import 'package:flutter_secure_storage/flutter_secure_storage.dart';

class _BufferedEvent {
  final String name;
  final dynamic data;
  const _BufferedEvent(this.name, this.data);
}

class SocketClient {
  static SocketClient? _instance;
  io.Socket? _socket;
  final FlutterSecureStorage _storage = const FlutterSecureStorage();
  bool _isConnected = false;

  static const int _maxBuffer = 50;
  final _buffer = <_BufferedEvent>[];
  DateTime? _lastLocationEmit;

  final _driverLocationController = StreamController<Map<String, dynamic>>.broadcast();
  final _orderStatusController = StreamController<Map<String, dynamic>>.broadcast();
  final _chatMessageController = StreamController<Map<String, dynamic>>.broadcast();
  final _authRefreshController = StreamController<void>.broadcast();
  final _notificationController =
      StreamController<Map<String, dynamic>>.broadcast();
  final _driverOfferController =
      StreamController<Map<String, dynamic>>.broadcast();

  Stream<Map<String, dynamic>> get onDriverLocation =>
      _driverLocationController.stream;
  Stream<Map<String, dynamic>> get onOrderStatus =>
      _orderStatusController.stream;
  Stream<Map<String, dynamic>> get onChatMessage =>
      _chatMessageController.stream;
  Stream<Map<String, dynamic>> get onNotification =>
      _notificationController.stream;

  /// Fires when the server dispatches a new delivery offer to this driver.
  Stream<Map<String, dynamic>> get onDriverOffer => _driverOfferController.stream;

  // Fires when server emits 'auth:refresh_required' — caller should refresh token
  // then call reconnectWithToken(newToken).
  Stream<void> get onAuthRefreshRequired => _authRefreshController.stream;

  bool get isConnected => _isConnected;

  SocketClient._();

  static SocketClient get instance {
    _instance ??= SocketClient._();
    return _instance!;
  }

  Future<void> connect() async {
    if (_isConnected) return;

    final token = await _storage.read(key: 'auth_token');
    final stored = await _storage.read(key: 'API_BASE_URL') ?? 'http://10.0.2.2:3001';
    // Socket.io connects to the root — strip /api suffix if present.
    final wsUrl = stored.endsWith('/api')
        ? stored.substring(0, stored.length - 4)
        : stored;

    _socket = io.io(
      wsUrl,
      io.OptionBuilder()
          .setTransports(['websocket'])
          .setAuth({'token': token ?? ''})
          .enableReconnection()
          .setReconnectionDelay(1000)
          .setReconnectionDelayMax(30000)
          .disableForceNew()
          .build(),
    );

    _socket!.onConnect((_) {
      _isConnected = true;
      _flushBuffer();
    });

    _socket!.onDisconnect((_) => _isConnected = false);

    _socket!.onConnectError((data) {
      // ignore: avoid_print
      print('[Socket] Connect error: $data');
    });

    _socket!.onError((data) {
      // ignore: avoid_print
      print('[Socket] Error: $data');
    });

    _socket!.onReconnect((_) {
      _isConnected = true;
      _flushBuffer();
    });

    _socket!.on('driver:location', (data) {
      if (data is Map<String, dynamic>) _driverLocationController.add(data);
    });

    _socket!.on('order:status', (data) {
      if (data is Map<String, dynamic>) _orderStatusController.add(data);
    });

    _socket!.on('chat:message', (data) {
      if (data is Map<String, dynamic>) _chatMessageController.add(data);
    });

    _socket!.on('notification:new', (data) {
      if (data is Map<String, dynamic>) _notificationController.add(data);
    });

    _socket!.on('driver:offer', (data) {
      if (data is Map<String, dynamic>) _driverOfferController.add(data);
    });

    _socket!.on('auth:refresh_required', (_) => _authRefreshController.add(null));

    _socket!.connect();
  }

  void _flushBuffer() {
    final pending = List.of(_buffer);
    _buffer.clear();
    for (final event in pending) {
      _socket?.emit(event.name, event.data);
    }
  }

  // Call after a successful token refresh triggered by onAuthRefreshRequired.
  Future<void> reconnectWithToken(String newToken) async {
    disconnect();
    await _storage.write(key: 'auth_token', value: newToken);
    await connect();
  }

  void disconnect() {
    _socket?.disconnect();
    _socket = null;
    _isConnected = false;
  }

  void subscribeOrder(String orderId) {
    emit('order:subscribe', {'orderId': orderId});
  }

  void unsubscribeOrder(String orderId) {
    emit('order:unsubscribe', {'orderId': orderId});
  }

  void sendChatMessage(String orderId, String message) {
    emit('chat:send', {'orderId': orderId, 'message': message});
  }

  // Throttled to one ping per 250 ms — for driver location updates.
  void emitLocationPing(double lat, double lng) {
    final now = DateTime.now();
    if (_lastLocationEmit != null &&
        now.difference(_lastLocationEmit!) < const Duration(milliseconds: 250)) {
      return;
    }
    _lastLocationEmit = now;
    emit('driver:location', {'latitude': lat, 'longitude': lng});
  }

  // General-purpose emit. Buffers up to 50 events while offline; flushed on reconnect.
  void emit(String event, dynamic data) {
    if (_isConnected && _socket != null) {
      _socket!.emit(event, data);
    } else {
      if (_buffer.length < _maxBuffer) {
        _buffer.add(_BufferedEvent(event, data));
      }
    }
  }

  void dispose() {
    _driverLocationController.close();
    _orderStatusController.close();
    _chatMessageController.close();
    _authRefreshController.close();
    _notificationController.close();
    _driverOfferController.close();
    disconnect();
    _instance = null;
  }
}
