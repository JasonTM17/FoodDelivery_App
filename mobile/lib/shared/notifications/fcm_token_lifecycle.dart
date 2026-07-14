import 'dart:async';

export 'fcm_token_registration.dart';

import 'fcm_token_registration.dart';

enum FcmPlatform { android, ios }

abstract interface class FcmMessagingGateway {
  Future<bool> requestPermission();
  Future<String?> getToken();
  Stream<String> get onTokenRefresh;
}

abstract interface class FcmTokenTransport {
  Future<void> register({
    required FcmTokenRegistration registration,
    required FcmPlatform platform,
  });
  Future<void> unregister(FcmTokenRegistration registration);
}

abstract interface class FcmTokenStore {
  Future<FcmTokenRegistration?> readRegistration();
  Future<void> writeRegistration(FcmTokenRegistration registration);
  Future<void> clearRegistration();
  Future<List<FcmTokenRegistration>> readPendingCleanups();
  Future<void> writePendingCleanup(FcmTokenRegistration registration);
  Future<void> clearPendingCleanup(FcmTokenRegistration registration);
}

Future<void> retryPendingFcmCleanups({
  required FcmTokenTransport transport,
  required FcmTokenStore store,
  void Function(Object error, StackTrace stackTrace)? reportFailure,
}) async {
  late final List<FcmTokenRegistration> pendingCleanups;
  try {
    pendingCleanups = await store.readPendingCleanups();
  } catch (error, stackTrace) {
    reportFailure?.call(error, stackTrace);
    return;
  }

  for (final registration in pendingCleanups) {
    try {
      await transport.unregister(registration);
      await store.clearPendingCleanup(registration);
    } catch (error, stackTrace) {
      reportFailure?.call(error, stackTrace);
    }
  }
}

abstract interface class FcmSessionLifecycle {
  Future<void> activate();
  Future<void> deactivate();
  Future<void> invalidate();
}

/// Orders auth-session transitions while Firebase initialization is pending.
/// Logout waits only for initialization that an earlier login already began;
/// it never starts Firebase by itself.
class FcmTokenSessionCoordinator {
  FcmTokenSessionCoordinator({
    required Future<FcmSessionLifecycle?> Function() resolveLifecycle,
    required FcmSessionLifecycle? Function() currentLifecycle,
    required Future<FcmSessionLifecycle?>? Function() pendingLifecycle,
  }) : _resolveLifecycle = resolveLifecycle,
       _currentLifecycle = currentLifecycle,
       _pendingLifecycle = pendingLifecycle;

  final Future<FcmSessionLifecycle?> Function() _resolveLifecycle;
  final FcmSessionLifecycle? Function() _currentLifecycle;
  final Future<FcmSessionLifecycle?>? Function() _pendingLifecycle;
  var _sessionEpoch = 0;

  Future<void> activate() async {
    final epoch = ++_sessionEpoch;
    final lifecycle = await _resolveLifecycle();
    if (lifecycle == null || epoch != _sessionEpoch) return;
    await lifecycle.activate();
  }

  Future<void> deactivate() async {
    final epoch = ++_sessionEpoch;
    final pending = _pendingLifecycle();
    final lifecycle =
        _currentLifecycle() ?? (pending == null ? null : await pending);
    if (lifecycle == null || epoch != _sessionEpoch) return;
    await lifecycle.deactivate();
  }

  Future<void> invalidate() async {
    _sessionEpoch += 1;
    await _currentLifecycle()?.invalidate();
  }
}

/// Keeps the server-side FCM registration bound to the currently authenticated
/// mobile session. The service serializes refreshes, does not acquire or send
/// a token until permission is granted, and invalidates in-flight work when a
/// session ends.
class FcmTokenLifecycle implements FcmSessionLifecycle {
  FcmTokenLifecycle({
    required FcmMessagingGateway messaging,
    required FcmTokenTransport transport,
    required FcmTokenStore store,
    required FcmPlatform platform,
    this.reportRefreshFailure,
  }) : _messaging = messaging,
       _transport = transport,
       _store = store,
       _platform = platform;

  final FcmMessagingGateway _messaging;
  final FcmTokenTransport _transport;
  final FcmTokenStore _store;
  final FcmPlatform _platform;
  final void Function(Object error, StackTrace stackTrace)?
  reportRefreshFailure;

  StreamSubscription<String>? _tokenRefreshSubscription;
  Future<void> _synchronizationQueue = Future<void>.value();
  var _sessionEpoch = 0;
  var _tokenEpoch = 0;
  var _active = false;
  var _permissionGranted = false;

  Future<void> activate() async {
    final epoch = ++_sessionEpoch;
    _active = true;
    _permissionGranted = false;
    _tokenEpoch = 0;
    await retryPendingFcmCleanups(
      transport: _transport,
      store: _store,
      reportFailure: reportRefreshFailure,
    );
    if (!_isCurrentSession(epoch)) return;

    if (!await _messaging.requestPermission() || !_isCurrentSession(epoch)) {
      return;
    }
    _permissionGranted = true;
    _tokenRefreshSubscription ??= _messaging.onTokenRefresh.listen(
      _handleTokenRefresh,
    );

    final tokenEpoch = _tokenEpoch;
    final token = await _messaging.getToken();
    if (token == null || token.isEmpty || !_isCurrentSession(epoch)) return;
    await _enqueueSynchronization(token, epoch, tokenEpoch);
  }

  Future<void> deactivate() async {
    final epoch = ++_sessionEpoch;
    _active = false;
    _permissionGranted = false;

    final registration = await _store.readRegistration();
    if (registration == null || epoch != _sessionEpoch) {
      return;
    }

    await _store.writePendingCleanup(registration);
    await _store.clearRegistration();
    await retryPendingFcmCleanups(
      transport: _transport,
      store: _store,
      reportFailure: reportRefreshFailure,
    );
  }

  Future<void> invalidate() async {
    _active = false;
    _permissionGranted = false;
    _sessionEpoch += 1;
    final registration = await _store.readRegistration();
    if (registration == null) return;
    await _store.writePendingCleanup(registration);
    await _store.clearRegistration();
    await retryPendingFcmCleanups(
      transport: _transport,
      store: _store,
      reportFailure: reportRefreshFailure,
    );
  }

  Future<void> dispose() async {
    await invalidate();
    await _tokenRefreshSubscription?.cancel();
    _tokenRefreshSubscription = null;
  }

  void _handleTokenRefresh(String token) {
    if (!_active || !_permissionGranted || token.isEmpty) return;
    final epoch = _sessionEpoch;
    final tokenEpoch = ++_tokenEpoch;
    unawaited(_enqueueSynchronization(token, epoch, tokenEpoch));
  }

  Future<void> _enqueueSynchronization(
    String token,
    int sessionEpoch,
    int tokenEpoch,
  ) {
    _synchronizationQueue = _synchronizationQueue.then((_) async {
      try {
        await _synchronize(token, sessionEpoch, tokenEpoch);
      } catch (error, stackTrace) {
        reportRefreshFailure?.call(error, stackTrace);
      }
    });
    return _synchronizationQueue;
  }

  Future<void> _synchronize(
    String token,
    int sessionEpoch,
    int tokenEpoch,
  ) async {
    if (!_isCurrentToken(sessionEpoch, tokenEpoch)) return;

    final previousRegistration = await _store.readRegistration();
    if (!_isCurrentToken(sessionEpoch, tokenEpoch)) return;

    final registration = FcmTokenRegistration(
      token: token,
      registrationId: createFcmRegistrationId(),
    );
    // Persist cleanup intent before sending the request. The server locks a
    // token and records revocations by registration ID, so cleanup wins even
    // when a timed-out registration POST reaches the server late.
    await _store.writeRegistration(registration);
    try {
      await _transport.register(
        registration: registration,
        platform: _platform,
      );
    } catch (_) {
      await _store.writePendingCleanup(registration);
      await retryPendingFcmCleanups(
        transport: _transport,
        store: _store,
        reportFailure: reportRefreshFailure,
      );
      if (_isCurrentToken(sessionEpoch, tokenEpoch)) {
        if (previousRegistration == null) {
          await _store.clearRegistration();
        } else {
          await _store.writeRegistration(previousRegistration);
        }
      }
      rethrow;
    }
    if (!_isCurrentToken(sessionEpoch, tokenEpoch)) {
      await _store.writePendingCleanup(registration);
      await retryPendingFcmCleanups(
        transport: _transport,
        store: _store,
        reportFailure: reportRefreshFailure,
      );
      return;
    }

    if (previousRegistration == null) return;

    await _store.writePendingCleanup(previousRegistration);
    await retryPendingFcmCleanups(
      transport: _transport,
      store: _store,
      reportFailure: reportRefreshFailure,
    );
  }

  bool _isCurrentSession(int epoch) => _active && epoch == _sessionEpoch;

  bool _isCurrentToken(int sessionEpoch, int tokenEpoch) =>
      _permissionGranted &&
      _isCurrentSession(sessionEpoch) &&
      tokenEpoch == _tokenEpoch;
}
