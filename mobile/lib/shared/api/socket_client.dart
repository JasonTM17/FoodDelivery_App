import 'dart:async';
import 'package:socket_io_client/socket_io_client.dart' as io;
import 'package:flutter_secure_storage/flutter_secure_storage.dart';

class SocketClient {
  static SocketClient? _instance;
  late final io.Socket _socket;
  final FlutterSecureStorage _storage = const FlutterSecureStorage();
  bool _isConnected = false;

  // Stream controllers
  final _driverLocationController = StreamController<Map<String, dynamic>>.broadcast();
  final _orderStatusController = StreamController<Map<String, dynamic>>.broadcast();
  final _chatMessageController = StreamController<Map<String, dynamic>>.broadcast();

  Stream<Map<String, dynamic>> get onDriverLocation => _driverLocationController.stream;
  Stream<Map<String, dynamic>> get onOrderStatus => _orderStatusController.stream;
  Stream<Map<String, dynamic>> get onChatMessage => _chatMessageController.stream;
  bool get isConnected => _isConnected;

  SocketClient._();

  static SocketClient get instance {
    _instance ??= SocketClient._();
    return _instance!;
  }

  Future<void> connect() async {
    if (_isConnected) return;

    final token = await _storage.read(key: 'auth_token');
    final serverUrl = await _storage.read(key: 'API_BASE_URL') ?? 'http://10.0.2.2:3001';

    _socket = io.io(
      serverUrl,
      io.OptionBuilder()
          .setTransports(['websocket'])
          .setExtraHeaders({
            'Authorization': 'Bearer ${token ?? ''}',
          })
          .enableAutoConnect()
          .disableForceNew()
          .build(),
    );

    _socket.onConnect((_) {
      _isConnected = true;
      // ignore: avoid_print
      print('[Socket] Connected');
    });

    _socket.onDisconnect((_) {
      _isConnected = false;
      // ignore: avoid_print
      print('[Socket] Disconnected');
    });

    _socket.onConnectError((data) {
      // ignore: avoid_print
      print('[Socket] Connect error: $data');
    });

    _socket.onError((data) {
      // ignore: avoid_print
      print('[Socket] Error: $data');
    });

    _socket.on('driver:location', (data) {
      if (data is Map<String, dynamic>) {
        _driverLocationController.add(data);
      }
    });

    _socket.on('order:status', (data) {
      if (data is Map<String, dynamic>) {
        _orderStatusController.add(data);
      }
    });

    _socket.on('chat:message', (data) {
      if (data is Map<String, dynamic>) {
        _chatMessageController.add(data);
      }
    });

    _socket.onReconnect((_) {
      _isConnected = true;
    });

    _socket.connect();
  }

  void disconnect() {
    _socket.disconnect();
    _isConnected = false;
  }

  void subscribeOrder(String orderId) {
    if (_isConnected) {
      _socket.emit('order:subscribe', {'orderId': orderId});
    }
  }

  void unsubscribeOrder(String orderId) {
    if (_isConnected) {
      _socket.emit('order:unsubscribe', {'orderId': orderId});
    }
  }

  void sendChatMessage(String orderId, String message) {
    if (_isConnected) {
      _socket.emit('chat:send', {
        'orderId': orderId,
        'message': message,
      });
    }
  }

  void emit(String event, dynamic data) {
    if (_isConnected) {
      _socket.emit(event, data);
    }
  }

  void dispose() {
    _driverLocationController.close();
    _orderStatusController.close();
    _chatMessageController.close();
    disconnect();
    _instance = null;
  }
}
