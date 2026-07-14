import 'dart:async';

import 'package:flutter_test/flutter_test.dart';
import 'package:foodflow_customer/shared/notifications/fcm_token_lifecycle.dart';

void main() {
  late _FakeMessaging messaging;
  late _FakeTransport transport;
  late _MemoryStore store;
  late FcmTokenLifecycle lifecycle;

  setUp(() {
    messaging = _FakeMessaging();
    transport = _FakeTransport();
    store = _MemoryStore();
    lifecycle = FcmTokenLifecycle(
      messaging: messaging,
      transport: transport,
      store: store,
      platform: FcmPlatform.android,
    );
  });

  tearDown(() async {
    await lifecycle.dispose();
    await messaging.dispose();
  });

  test(
    'registers the initial token only after permission is granted',
    () async {
      messaging.token = 'initial-fcm-token';

      await lifecycle.activate();

      expect(transport.registered, [
        (token: 'initial-fcm-token', platform: FcmPlatform.android),
      ]);
      expect((await store.readRegistration())?.token, 'initial-fcm-token');
    },
  );

  test(
    'does not send a token when notification permission is denied',
    () async {
      messaging.permissionGranted = false;
      messaging.token = 'not-sent-token';

      await lifecycle.activate();

      expect(transport.registered, isEmpty);
      expect(await store.readRegistration(), isNull);
    },
  );

  test(
    'ignores refresh events until notification permission is granted',
    () async {
      messaging.permissionGranted = false;
      messaging.token = 'not-sent-token';

      await lifecycle.activate();
      messaging.emitRefresh('also-not-sent-token');
      await _drainMicrotasks();

      expect(transport.registered, isEmpty);
    },
  );

  test(
    'replaces the server registration when FCM refreshes its token',
    () async {
      messaging.token = 'first-fcm-token';
      await lifecycle.activate();

      messaging.emitRefresh('second-fcm-token');
      await _drainMicrotasks();

      expect(transport.registered, [
        (token: 'first-fcm-token', platform: FcmPlatform.android),
        (token: 'second-fcm-token', platform: FcmPlatform.android),
      ]);
      expect(transport.unregistered, ['first-fcm-token']);
      expect((await store.readRegistration())?.token, 'second-fcm-token');
    },
  );

  test('unregisters the persisted token before ending the session', () async {
    messaging.token = 'logout-fcm-token';
    await lifecycle.activate();

    await lifecycle.deactivate();

    expect(transport.unregistered, ['logout-fcm-token']);
    expect(await store.readRegistration(), isNull);
  });

  test(
    'retries a failed logout cleanup when the next session activates',
    () async {
      messaging.token = 'logout-fcm-token';
      await lifecycle.activate();

      final failedUnregister = Completer<void>();
      transport.nextUnregister = failedUnregister;
      final logout = lifecycle.deactivate();
      await _drainMicrotasks();
      failedUnregister.completeError(StateError('network unavailable'));
      await logout;

      expect((await store.readPendingCleanups()).map((item) => item.token), [
        'logout-fcm-token',
      ]);

      messaging.token = 'next-session-token';
      await lifecycle.activate();

      expect(transport.unregistered, ['logout-fcm-token', 'logout-fcm-token']);
      expect(await store.readPendingCleanups(), isEmpty);
    },
  );

  test('records an in-flight registration for logout cleanup', () async {
    messaging.token = 'in-flight-fcm-token';
    final registration = Completer<void>();
    transport.nextRegister = registration;

    final activation = lifecycle.activate();
    await _drainMicrotasks();

    expect((await store.readRegistration())?.token, 'in-flight-fcm-token');

    await lifecycle.deactivate();
    expect(transport.unregistered, contains('in-flight-fcm-token'));

    registration.complete();
    await activation;
  });

  test(
    'compensates after logout when registration has an unknown outcome',
    () async {
      messaging.token = 'unknown-outcome-fcm-token';
      final registration = Completer<void>();
      transport.nextRegister = registration;

      final activation = lifecycle.activate();
      await _drainMicrotasks();
      await lifecycle.deactivate();

      registration.completeError(StateError('registration response lost'));
      await activation;

      expect(transport.registered, [
        (token: 'unknown-outcome-fcm-token', platform: FcmPlatform.android),
      ]);
      expect(transport.unregistered, [
        'unknown-outcome-fcm-token',
        'unknown-outcome-fcm-token',
      ]);
      expect(await store.readRegistration(), isNull);
    },
  );

  test(
    'serializes successive refreshes and retains only the latest token',
    () async {
      messaging.token = 'first-fcm-token';
      await lifecycle.activate();

      messaging.emitRefresh('second-fcm-token');
      messaging.emitRefresh('third-fcm-token');
      await _drainMicrotasks();

      expect((await store.readRegistration())?.token, 'third-fcm-token');
      expect(transport.unregistered, ['first-fcm-token']);
    },
  );

  test(
    'does not let earlier logout cleanup clear a reactivated session',
    () async {
      messaging.token = 'first-fcm-token';
      await lifecycle.activate();

      final pendingUnregister = Completer<void>();
      transport.nextUnregister = pendingUnregister;
      final logout = lifecycle.deactivate();
      await _drainMicrotasks();

      messaging.token = 'second-fcm-token';
      await lifecycle.activate();
      pendingUnregister.complete();
      await logout;

      expect((await store.readRegistration())?.token, 'second-fcm-token');
    },
  );

  test(
    'keeps a pending logout cleanup when a later session activates',
    () async {
      messaging.token = 'first-fcm-token';
      await lifecycle.activate();

      final pendingUnregister = Completer<void>();
      transport.nextUnregister = pendingUnregister;
      final logout = lifecycle.deactivate();
      await _drainMicrotasks();

      messaging.token = 'second-fcm-token';
      await lifecycle.activate();

      expect(transport.cleanupCancellationRequests, 0);
      pendingUnregister.complete();
      await logout;
      expect((await store.readRegistration())?.token, 'second-fcm-token');
    },
  );

  test('forced logout stages cleanup and stops later token activity', () async {
    messaging.token = 'first-fcm-token';
    await lifecycle.activate();
    final failedUnregister = Completer<void>();
    transport.nextUnregister = failedUnregister;

    final invalidation = lifecycle.invalidate();
    await _drainMicrotasks();
    failedUnregister.completeError(StateError('network unavailable'));
    await invalidation;
    messaging.emitRefresh('second-fcm-token');
    await _drainMicrotasks();

    expect(transport.registered, [
      (token: 'first-fcm-token', platform: FcmPlatform.android),
    ]);
    expect(await store.readRegistration(), isNull);
    expect((await store.readPendingCleanups()).single.token, 'first-fcm-token');
  });

  test('retries persisted cleanup without activating a session', () async {
    const registration = FcmTokenRegistration(
      token: 'persisted-cleanup-fcm-token',
      registrationId: '9165a90e-1e23-4f7a-8df6-5c7b1a5c4f10',
    );
    await store.writePendingCleanup(registration);

    await retryPendingFcmCleanups(transport: transport, store: store);

    expect(transport.unregistered, ['persisted-cleanup-fcm-token']);
    expect(await store.readPendingCleanups(), isEmpty);
  });

  test(
    'logout during initialization prevents the stale session activating',
    () async {
      final pendingLifecycle = Completer<FcmSessionLifecycle?>();
      FcmSessionLifecycle? currentLifecycle;
      final session = FcmTokenSessionCoordinator(
        resolveLifecycle: () async {
          final resolved = await pendingLifecycle.future;
          currentLifecycle = resolved;
          return resolved;
        },
        currentLifecycle: () => currentLifecycle,
        pendingLifecycle: () => pendingLifecycle.future,
      );
      final fakeLifecycle = _FakeSessionLifecycle();

      final staleActivation = session.activate();
      final logout = session.deactivate();
      pendingLifecycle.complete(fakeLifecycle);
      await Future.wait([staleActivation, logout]);

      expect(fakeLifecycle.activationCount, 0);
      expect(fakeLifecycle.deactivationCount, 1);
    },
  );

  test(
    'new login supersedes delayed cleanup from the previous session',
    () async {
      final pendingLifecycle = Completer<FcmSessionLifecycle?>();
      FcmSessionLifecycle? currentLifecycle;
      final session = FcmTokenSessionCoordinator(
        resolveLifecycle: () async {
          final resolved = await pendingLifecycle.future;
          currentLifecycle = resolved;
          return resolved;
        },
        currentLifecycle: () => currentLifecycle,
        pendingLifecycle: () => pendingLifecycle.future,
      );
      final fakeLifecycle = _FakeSessionLifecycle();

      final staleActivation = session.activate();
      final staleLogout = session.deactivate();
      final currentActivation = session.activate();
      pendingLifecycle.complete(fakeLifecycle);
      await Future.wait([staleActivation, staleLogout, currentActivation]);

      expect(fakeLifecycle.activationCount, 1);
      expect(fakeLifecycle.deactivationCount, 0);
    },
  );
}

Future<void> _drainMicrotasks() async {
  await Future<void>.delayed(Duration.zero);
  await Future<void>.delayed(Duration.zero);
}

class _FakeMessaging implements FcmMessagingGateway {
  final _refreshController = StreamController<String>.broadcast();
  var permissionGranted = true;
  String? token;

  @override
  Stream<String> get onTokenRefresh => _refreshController.stream;

  @override
  Future<String?> getToken() async => token;

  @override
  Future<bool> requestPermission() async => permissionGranted;

  void emitRefresh(String refreshedToken) =>
      _refreshController.add(refreshedToken);

  Future<void> dispose() => _refreshController.close();
}

class _FakeTransport implements FcmTokenTransport {
  final registered = <({String token, FcmPlatform platform})>[];
  final unregistered = <String>[];
  Completer<void>? nextRegister;
  Completer<void>? nextUnregister;
  var cleanupCancellationRequests = 0;

  @override
  Future<void> register({
    required FcmTokenRegistration registration,
    required FcmPlatform platform,
  }) async {
    registered.add((token: registration.token, platform: platform));
    final pending = nextRegister;
    nextRegister = null;
    if (pending != null) await pending.future;
  }

  @override
  Future<void> unregister(FcmTokenRegistration registration) async {
    unregistered.add(registration.token);
    final pending = nextUnregister;
    nextUnregister = null;
    if (pending != null) await pending.future;
  }

  // Kept intentionally outside FcmTokenTransport. The lifecycle must never
  // cancel a pending cleanup: it is keyed to one registration ID and may be
  // the only request that can tombstone a late registration POST.
  void cancelPendingCleanupRequests() => cleanupCancellationRequests += 1;
}

class _MemoryStore implements FcmTokenStore {
  FcmTokenRegistration? _registration;
  final _pendingCleanups = <String, FcmTokenRegistration>{};

  String _cleanupKey(FcmTokenRegistration registration) =>
      '${registration.token}:${registration.registrationId}';

  @override
  Future<void> clearRegistration() async => _registration = null;

  @override
  Future<void> clearPendingCleanup(FcmTokenRegistration registration) async {
    _pendingCleanups.remove(_cleanupKey(registration));
  }

  @override
  Future<List<FcmTokenRegistration>> readPendingCleanups() async =>
      _pendingCleanups.values.toList(growable: false);

  @override
  Future<FcmTokenRegistration?> readRegistration() async => _registration;

  @override
  Future<void> writeRegistration(FcmTokenRegistration registration) async {
    _registration = registration;
  }

  @override
  Future<void> writePendingCleanup(FcmTokenRegistration registration) async {
    _pendingCleanups[_cleanupKey(registration)] = registration;
  }
}

class _FakeSessionLifecycle implements FcmSessionLifecycle {
  var activationCount = 0;
  var deactivationCount = 0;

  @override
  Future<void> activate() async => activationCount += 1;

  @override
  Future<void> deactivate() async => deactivationCount += 1;

  @override
  Future<void> invalidate() async {}
}
