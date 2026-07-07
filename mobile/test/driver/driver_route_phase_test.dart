import 'package:flutter_test/flutter_test.dart';
import 'package:foodflow_customer/driver/providers/driver_provider.dart';

void main() {
  group('driverRoutePhaseForStatus', () {
    test('maps pre-pickup statuses to pickup route phase', () {
      expect(driverRoutePhaseForStatus('driver_assigned'), 'pickup');
      expect(driverRoutePhaseForStatus('driver_arriving_restaurant'), 'pickup');
    });

    test('maps handoff and delivery statuses to dropoff route phase', () {
      expect(driverRoutePhaseForStatus('picked_up'), 'dropoff');
      expect(driverRoutePhaseForStatus('delivering'), 'dropoff');
      expect(driverRoutePhaseForStatus('ready_for_pickup'), 'dropoff');
    });
  });

  group('isFreshDriverOnlineSample', () {
    test('accepts current GPS samples', () {
      final now = DateTime.parse('2026-07-07T10:00:00Z');

      expect(isFreshDriverOnlineSample(now, now), isTrue);
      expect(
        isFreshDriverOnlineSample(
          now.subtract(const Duration(seconds: 30)),
          now,
        ),
        isTrue,
      );
    });

    test('rejects stale or impossible future samples', () {
      final now = DateTime.parse('2026-07-07T10:00:00Z');

      expect(
        isFreshDriverOnlineSample(
          now.subtract(const Duration(seconds: 46)),
          now,
        ),
        isFalse,
      );
      expect(
        isFreshDriverOnlineSample(now.add(const Duration(seconds: 16)), now),
        isFalse,
      );
    });
  });
}
