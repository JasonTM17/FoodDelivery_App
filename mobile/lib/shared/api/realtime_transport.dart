abstract interface class RealtimeTransport {
  bool get isConnected;

  Stream<Map<String, dynamic>> get onDriverLocation;
  Stream<Map<String, dynamic>> get onOrderStatus;
  Stream<Map<String, dynamic>> get onEtaUpdate;
  Stream<Map<String, dynamic>> get onNotification;
  Stream<Map<String, dynamic>> get onDriverOffer;
  Stream<Map<String, dynamic>> get onDriverOrderAssigned;
  Stream<void> get onAuthRefreshRequired;

  Future<void> connect();
  Future<void> subscribeOrder(String orderId);
  Future<void> unsubscribeOrder(String orderId);
  Future<void> reconnectWithToken(String newToken);
  Future<void> disconnect();
  void dispose();
}

abstract interface class LocationPingEmitter {
  bool get isConnected;

  Future<void> emitLocationPing(
    double lat,
    double lng, {
    double? bearing,
    double? speed,
    double? accuracy,
    required DateTime timestamp,
    bool bypassThrottle = false,
  });
}
