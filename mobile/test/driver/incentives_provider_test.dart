import 'package:flutter_test/flutter_test.dart';
import 'package:foodflow_customer/driver/providers/incentives_provider.dart';

void main() {
  group('DriverIncentives.fromJson', () {
    test('parses active and completed campaign lists', () {
      final response = DriverIncentives.fromJson({
        'active': [
          {
            'id': 'campaign-1',
            'title': 'Lunch rush',
            'rewardAmount': 100000,
            'progress': 4,
            'target': 10,
            'endsAt': '2026-07-04T12:00:00Z',
          },
        ],
        'completed': [
          {
            'id': 'campaign-2',
            'title': 'Breakfast streak',
            'rewardAmount': '50000',
            'progress': '5',
            'target': '5',
            'endsAt': '2026-07-01T12:00:00Z',
          },
        ],
      });

      expect(response.active, hasLength(1));
      expect(response.active.single.completed, isFalse);
      expect(response.active.single.rewardAmount, 100000);
      expect(response.completed, hasLength(1));
      expect(response.completed.single.completed, isTrue);
      expect(response.completed.single.progress, 5);
    });

    test(
      'defaults missing lists to empty instead of using local fallback data',
      () {
        final response = DriverIncentives.fromJson({});

        expect(response.active, isEmpty);
        expect(response.completed, isEmpty);
      },
    );
  });
}
