import 'package:flutter_test/flutter_test.dart';
import 'package:foodflow_customer/shared/api/supabase_realtime_client.dart';

void main() {
  group('RealtimeTokenGrant', () {
    test('parses a private scoped Supabase grant and removes duplicates', () {
      final grant = RealtimeTokenGrant.fromJson({
        'provider': 'supabase',
        'token': 'signed-realtime-token',
        'expiresAt': '2026-07-10T12:05:00.000Z',
        'channels': [
          'private:user:user-1:notifications',
          'private:order:order-1',
          'private:order:order-1',
        ],
      });

      expect(grant.token, 'signed-realtime-token');
      expect(grant.expiresAt, DateTime.utc(2026, 7, 10, 12, 5));
      expect(grant.channels, [
        'private:user:user-1:notifications',
        'private:order:order-1',
      ]);
    });

    test('rejects broad, public, malformed, and wrong-provider grants', () {
      for (final invalid in [
        {
          'provider': 'socketio',
          'token': 'token',
          'expiresAt': '2026-07-10T12:05:00.000Z',
          'channels': ['private:order:order-1'],
        },
        {
          'provider': 'supabase',
          'token': 'token',
          'expiresAt': '2026-07-10T12:05:00.000Z',
          'channels': ['public:*'],
        },
        {
          'provider': 'supabase',
          'token': '',
          'expiresAt': 'invalid',
          'channels': <String>[],
        },
      ]) {
        expect(
          () => RealtimeTokenGrant.fromJson(invalid),
          throwsFormatException,
        );
      }
    });
  });

  group('dispatchRealtimeOutboxRecord', () {
    test('routes an authorized event payload to its typed stream', () {
      final locations = <Map<String, dynamic>>[];
      final statuses = <Map<String, dynamic>>[];

      dispatchRealtimeOutboxRecord(
        {
          'channel': 'private:order:order-1',
          'event': 'driver:location_changed',
          'payload': {'orderId': 'order-1', 'lat': 10.8, 'lng': 106.7},
        },
        allowedChannel: 'private:order:order-1',
        onDriverLocation: locations.add,
        onOrderStatus: statuses.add,
        onEtaUpdate: (_) {},
        onNotification: (_) {},
        onDriverOffer: (_) {},
        onDriverOrderAssigned: (_) {},
      );

      expect(locations, [
        {'orderId': 'order-1', 'lat': 10.8, 'lng': 106.7},
      ]);
      expect(statuses, isEmpty);
    });

    test('ignores a row outside the channel allowlist', () {
      final events = <Map<String, dynamic>>[];

      dispatchRealtimeOutboxRecord(
        {
          'channel': 'private:order:other-order',
          'event': 'order:status:changed',
          'payload': {'orderId': 'other-order', 'status': 'delivering'},
        },
        allowedChannel: 'private:order:order-1',
        onDriverLocation: events.add,
        onOrderStatus: events.add,
        onEtaUpdate: events.add,
        onNotification: events.add,
        onDriverOffer: events.add,
        onDriverOrderAssigned: events.add,
      );

      expect(events, isEmpty);
    });

    test('ignores malformed business payloads instead of fabricating data', () {
      final events = <Map<String, dynamic>>[];

      dispatchRealtimeOutboxRecord(
        {
          'channel': 'private:driver:driver-1',
          'event': 'driver:new_order',
          'payload': 'not-an-object',
        },
        allowedChannel: 'private:driver:driver-1',
        onDriverLocation: events.add,
        onOrderStatus: events.add,
        onEtaUpdate: events.add,
        onNotification: events.add,
        onDriverOffer: events.add,
        onDriverOrderAssigned: events.add,
      );

      expect(events, isEmpty);
    });
  });
}
