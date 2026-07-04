import 'package:flutter_test/flutter_test.dart';
import 'package:foodflow_customer/driver/providers/rating_history_provider.dart';
import 'package:foodflow_customer/shared/utils/backend_date_time.dart';

void main() {
  group('DriverReview.fromJson', () {
    test('parses backend driver rating rows', () {
      final review = DriverReview.fromJson({
        'id': 'review-1',
        'customerName': 'Customer One',
        'customerAvatarUrl': null,
        'rating': '5',
        'comment': 'Fast delivery',
        'date': '2026-07-03T08:00:00.000Z',
        'orderId': 'order-1',
        'orderCode': 'FD0000000001',
      });

      expect(review.id, 'review-1');
      expect(review.customerName, 'Customer One');
      expect(review.rating, 5);
      expect(review.comment, 'Fast delivery');
      expect(review.orderId, 'FD0000000001');
      expect(review.date.toUtc().toIso8601String(), '2026-07-03T08:00:00.000Z');
    });

    test('clamps invalid ratings and falls back to order id', () {
      final review = DriverReview.fromJson({
        'id': 'review-2',
        'customerName': 'Customer Two',
        'rating': 99,
        'date': 'invalid-date',
        'orderId': 'order-2',
      });

      expect(review.rating, 5);
      expect(review.orderId, 'order-2');
      expect(review.date, unknownBackendDateTime);
    });
  });

  group('RatingStats.fromJson', () {
    test('parses string keyed distribution from JSON', () {
      final stats = RatingStats.fromJson({
        'average': '4.7',
        'totalReviews': '3',
        'distribution': {'1': 0, '2': 0, '3': 0, '4': 1, '5': 2},
      });

      expect(stats.average, 4.7);
      expect(stats.totalReviews, 3);
      expect(stats.distribution, {1: 0, 2: 0, 3: 0, 4: 1, 5: 2});
    });

    test('defaults missing stats to zero without generated local data', () {
      final stats = RatingStats.fromJson({});

      expect(stats.average, 0);
      expect(stats.totalReviews, 0);
      expect(stats.distribution, {1: 0, 2: 0, 3: 0, 4: 0, 5: 0});
    });
  });
}
