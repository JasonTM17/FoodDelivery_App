import 'package:flutter_test/flutter_test.dart';
import 'package:foodflow_customer/driver/services/background_location_service.dart';

void main() {
  // Reset singleton between tests so state doesn't bleed across cases.
  tearDown(() {
    BackgroundLocationService.instance.dispose();
  });

  group('BackgroundLocationService — singleton', () {
    test('returns the same instance on repeated calls', () {
      final a = BackgroundLocationService.instance;
      final b = BackgroundLocationService.instance;
      expect(identical(a, b), isTrue);
    });

    test('new instance created after dispose', () {
      final first = BackgroundLocationService.instance;
      first.dispose();
      final second = BackgroundLocationService.instance;
      expect(identical(first, second), isFalse);
    });
  });

  group('BackgroundLocationService — lifecycle', () {
    test('isRunning is false before start()', () {
      expect(BackgroundLocationService.instance.isRunning, isFalse);
    });

    test('stop() is safe to call when service is not running', () {
      // Should not throw even if stop is called before start.
      expect(() => BackgroundLocationService.instance.stop(), returnsNormally);
    });

    test('isRunning is false after stop()', () {
      BackgroundLocationService.instance.stop();
      expect(BackgroundLocationService.instance.isRunning, isFalse);
    });

    test('setActiveOrderMode() is safe to call when not running', () {
      expect(
        () => BackgroundLocationService.instance.setActiveOrderMode(true),
        returnsNormally,
      );
      expect(
        () => BackgroundLocationService.instance.setActiveOrderMode(false),
        returnsNormally,
      );
    });
  });

  group('BackgroundLocationService — positionStream', () {
    test('positionStream emits no events initially', () async {
      final events = <Object>[];
      final sub = BackgroundLocationService.instance.positionStream
          .listen(events.add);
      // Give a brief window to confirm nothing was emitted at rest.
      await Future<void>.delayed(const Duration(milliseconds: 50));
      expect(events, isEmpty);
      await sub.cancel();
    });

    test('positionStream does not throw after dispose', () async {
      BackgroundLocationService.instance.dispose();
      // Accessing instance after dispose creates a fresh one — no crash.
      expect(BackgroundLocationService.instance.positionStream, isNotNull);
    });
  });
}
