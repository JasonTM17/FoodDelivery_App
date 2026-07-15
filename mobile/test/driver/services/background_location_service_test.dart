import 'package:flutter_test/flutter_test.dart';
import 'package:foodflow_customer/driver/services/background_location_service.dart';
import 'package:foodflow_customer/shared/api/realtime_client.dart';
import 'package:foodflow_customer/shared/api/socket_client.dart';

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
      final sub = BackgroundLocationService.instance.positionStream.listen(
        events.add,
      );
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

  group('GPS metadata normalization', () {
    test('converts Geolocator speed from meters per second to km/h', () {
      expect(normalizeGpsSpeedKmh(0), 0);
      expect(normalizeGpsSpeedKmh(10), 36);
      expect(normalizeGpsSpeedKmh(41.6666667), closeTo(150, 0.0001));
    });

    test('drops invalid GPS metadata instead of sending misleading values', () {
      expect(normalizeGpsSpeedKmh(-1), isNull);
      expect(normalizeGpsSpeedKmh(double.nan), isNull);
      expect(normalizeGpsBearingDegrees(-1), isNull);
      expect(normalizeGpsBearingDegrees(360), isNull);
      expect(normalizeGpsBearingDegrees(90), 90);
      expect(normalizeGpsAccuracyMeters(-1), isNull);
      expect(normalizeGpsAccuracyMeters(8.5), 8.5);
      expect(normalizeGpsAccuracyMeters(50), 50);
      expect(normalizeGpsAccuracyMeters(50.1), isNull);
    });
  });

  group('BackgroundLocationService — offline buffer', () {
    test(
      'flush preserves the original GPS timestamp in command payload',
      () async {
        final socket = _RecordingLocationPingEmitter();
        final service = BackgroundLocationService.forTesting(socket: socket);
        addTearDown(service.dispose);

        final capturedAt = DateTime.now().toUtc();
        socket.shouldThrow = true;
        await service.bufferLocationPingForTesting(
          10.7769,
          106.7009,
          timestamp: capturedAt,
          bearing: 90,
          speed: 36,
          accuracy: 5,
        );

        expect(socket.sentPayloads, isEmpty);

        socket.shouldThrow = false;
        await service.flushBufferForTesting();

        expect(socket.sentPayloads, hasLength(1));
        expect(socket.sentPayloads.single, {
          'lat': 10.7769,
          'lng': 106.7009,
          'bearing': 90,
          'speed': 36,
          'accuracy': 5,
          'timestamp': capturedAt.toIso8601String(),
        });
      },
    );

    test('flush bypasses realtime throttle for buffered GPS pings', () async {
      final socket = _RecordingLocationPingEmitter();
      final service = BackgroundLocationService.forTesting(socket: socket);
      addTearDown(service.dispose);

      final firstCapturedAt = DateTime.now().toUtc();
      final secondCapturedAt = firstCapturedAt.add(const Duration(seconds: 4));
      socket.shouldThrow = true;
      await service.bufferLocationPingForTesting(
        10.7769,
        106.7009,
        timestamp: firstCapturedAt,
      );
      await service.bufferLocationPingForTesting(
        10.7770,
        106.7010,
        timestamp: secondCapturedAt,
      );

      socket.shouldThrow = false;
      await service.flushBufferForTesting();

      expect(socket.sentPayloads, hasLength(2));
      expect(socket.bypassThrottleValues, [true, true]);
      expect(socket.sentPayloads.map((payload) => payload['timestamp']), [
        firstCapturedAt.toIso8601String(),
        secondCapturedAt.toIso8601String(),
      ]);
    });

    test(
      'drops stale buffered pings instead of replaying them as live state',
      () async {
        final socket = _RecordingLocationPingEmitter();
        final service = BackgroundLocationService.forTesting(socket: socket);
        addTearDown(service.dispose);

        await service.bufferLocationPingForTesting(
          10.7769,
          106.7009,
          timestamp: DateTime.now().toUtc().subtract(
            const Duration(minutes: 2),
          ),
        );

        socket.connected = true;
        await service.flushBufferForTesting();

        expect(socket.sentPayloads, isEmpty);
      },
    );

    test('drops poor-accuracy pings before sending or buffering', () async {
      final socket = _RecordingLocationPingEmitter()..shouldThrow = true;
      final service = BackgroundLocationService.forTesting(socket: socket);
      addTearDown(service.dispose);

      await service.bufferLocationPingForTesting(
        10.7769,
        106.7009,
        timestamp: DateTime.now().toUtc(),
        accuracy: 50.1,
      );

      socket.shouldThrow = false;
      await service.flushBufferForTesting();

      expect(socket.sentPayloads, isEmpty);
    });

    test('stop discards buffered samples from the previous Online session', () async {
      final socket = _RecordingLocationPingEmitter()..shouldThrow = true;
      final service = BackgroundLocationService.forTesting(socket: socket);
      addTearDown(service.dispose);

      await service.bufferLocationPingForTesting(
        10.7769,
        106.7009,
        timestamp: DateTime.now().toUtc(),
        accuracy: 5,
      );
      service.stop();

      socket.shouldThrow = false;
      await service.flushBufferForTesting();

      expect(socket.sentPayloads, isEmpty);
    });
  });
}

class _RecordingLocationPingEmitter implements LocationPingEmitter {
  bool connected = false;
  bool shouldThrow = false;
  final sentPayloads = <Map<String, dynamic>>[];
  final bypassThrottleValues = <bool>[];

  @override
  bool get isConnected => connected;

  @override
  Future<void> emitLocationPing(
    double lat,
    double lng, {
    double? bearing,
    double? speed,
    double? accuracy,
    required DateTime timestamp,
    bool bypassThrottle = false,
  }) async {
    if (shouldThrow) throw StateError('transport unavailable');
    bypassThrottleValues.add(bypassThrottle);
    sentPayloads.add(
      buildDriverLocationPingPayload(
        lat,
        lng,
        bearing: bearing,
        speed: speed,
        accuracy: accuracy,
        timestamp: timestamp,
      ),
    );
  }
}
