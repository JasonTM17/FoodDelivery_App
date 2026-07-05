import 'package:flutter_test/flutter_test.dart';
import 'package:foodflow_customer/shared/utils/backend_date_time.dart';

void main() {
  group('backend date parsing', () {
    test('parses ISO timestamps from backend payloads', () {
      expect(
        parseBackendDateTimeOrUnknown('2026-07-04T00:00:00.000Z'),
        DateTime.utc(2026, 7, 4),
      );
    });

    test('rejects missing or invalid required timestamps', () {
      expect(
        () => parseBackendDateTimeOrUnknown(null),
        throwsA(isA<FormatException>()),
      );
      expect(
        () => parseBackendDateTimeOrUnknown('not-a-date'),
        throwsA(isA<FormatException>()),
      );
    });

    test('keeps optional timestamps nullable', () {
      expect(parseBackendDateTimeOrNull(null), isNull);
      expect(parseBackendDateTimeOrNull('not-a-date'), isNull);
    });
  });
}
