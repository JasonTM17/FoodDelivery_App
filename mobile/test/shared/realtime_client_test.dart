import 'package:flutter_test/flutter_test.dart';
import 'package:foodflow_customer/shared/api/realtime_client.dart';
import 'package:foodflow_customer/shared/config/app_config.dart';

void main() {
  for (final provider in RealtimeProvider.values) {
    test('${provider.name} mode sends GPS mutations through authenticated REST', () async {
      final transport = _FakeRealtimeTransport()..connected = true;
      final calls = <({String path, Map<String, dynamic> data})>[];
      final client = RealtimeClient.forTesting(
        provider: provider,
        transport: transport,
        postCommand: (path, data) async => calls.add((path: path, data: data)),
      );
      final sampledAt = DateTime.utc(2026, 7, 10, 12);

      await client.emitLocationPing(
        10.8,
        106.7,
        bearing: 90,
        speed: 36,
        accuracy: 5,
        timestamp: sampledAt,
      );

      expect(calls.single.path, '/driver/location');
      expect(calls.single.data, {
        'lat': 10.8,
        'lng': 106.7,
        'bearing': 90,
        'speed': 36,
        'accuracy': 5,
        'timestamp': sampledAt.toIso8601String(),
      });
    });
  }

  test(
    'Supabase mode resolves dispatch offers through the one-time REST contract',
    () async {
      final calls = <({String path, Map<String, dynamic> data})>[];
      final client = RealtimeClient.forTesting(
        provider: RealtimeProvider.supabase,
        transport: _FakeRealtimeTransport(),
        postCommand: (path, data) async => calls.add((path: path, data: data)),
      );

      await client.respondToDispatchOffer(
        orderId: 'order-1',
        offerToken: 'offer-token',
        accepted: false,
      );

      expect(calls.single.path, '/driver/dispatch/offers/order-1/respond');
      expect(calls.single.data, {
        'offerToken': 'offer-token',
        'decision': 'reject',
      });
    },
  );

  test(
    'proxies order subscription lifecycle to the selected transport',
    () async {
      final transport = _FakeRealtimeTransport();
      final client = RealtimeClient.forTesting(
        provider: RealtimeProvider.supabase,
        transport: transport,
        postCommand: (_, _) async {},
      );

      await client.connect();
      await client.subscribeOrder('order-1');
      await client.unsubscribeOrder('order-1');

      expect(transport.connectCount, 1);
      expect(transport.subscribedOrders, ['order-1']);
      expect(transport.unsubscribedOrders, ['order-1']);
    },
  );
}

class _FakeRealtimeTransport implements RealtimeTransport {
  bool connected = false;
  int connectCount = 0;
  final subscribedOrders = <String>[];
  final unsubscribedOrders = <String>[];

  @override
  bool get isConnected => connected;

  @override
  Stream<Map<String, dynamic>> get onDriverLocation => const Stream.empty();
  @override
  Stream<Map<String, dynamic>> get onOrderStatus => const Stream.empty();
  @override
  Stream<Map<String, dynamic>> get onEtaUpdate => const Stream.empty();
  @override
  Stream<Map<String, dynamic>> get onNotification => const Stream.empty();
  @override
  Stream<Map<String, dynamic>> get onDriverOffer => const Stream.empty();
  @override
  Stream<Map<String, dynamic>> get onDriverOrderAssigned =>
      const Stream.empty();
  @override
  Stream<void> get onAuthRefreshRequired => const Stream.empty();

  @override
  Future<void> connect() async {
    connectCount += 1;
    connected = true;
  }

  @override
  Future<void> subscribeOrder(String orderId) async {
    subscribedOrders.add(orderId);
  }

  @override
  Future<void> unsubscribeOrder(String orderId) async {
    unsubscribedOrders.add(orderId);
  }

  @override
  Future<void> reconnectWithToken(String newToken) async {}

  @override
  Future<void> disconnect() async {
    connected = false;
  }

  @override
  void dispose() {}
}
