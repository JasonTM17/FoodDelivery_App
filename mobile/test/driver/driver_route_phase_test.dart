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
}
