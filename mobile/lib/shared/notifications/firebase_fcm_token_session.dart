import 'dart:async';
import 'dart:convert';

import 'package:dio/dio.dart';
import 'package:firebase_core/firebase_core.dart';
import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter_local_notifications/flutter_local_notifications.dart';

import '../api/api_client.dart';
import '../services/secure_storage_service.dart';
import 'fcm_notification_presenter.dart';
import 'fcm_token_lifecycle.dart';

class FirebaseFcmBuildOptions {
  const FirebaseFcmBuildOptions._();

  static const _apiKey = String.fromEnvironment('FIREBASE_API_KEY');
  static const _appId = String.fromEnvironment('FIREBASE_APP_ID');
  static const _messagingSenderId = String.fromEnvironment(
    'FIREBASE_MESSAGING_SENDER_ID',
  );
  static const _projectId = String.fromEnvironment('FIREBASE_PROJECT_ID');

  static FirebaseOptions? get current {
    if (_apiKey.isEmpty ||
        _appId.isEmpty ||
        _messagingSenderId.isEmpty ||
        _projectId.isEmpty) {
      return null;
    }

    return const FirebaseOptions(
      apiKey: _apiKey,
      appId: _appId,
      messagingSenderId: _messagingSenderId,
      projectId: _projectId,
    );
  }
}

class FirebaseMessagingGateway implements FcmMessagingGateway {
  FirebaseMessagingGateway(this._messaging, this._platform);

  final FirebaseMessaging _messaging;
  final FcmPlatform _platform;

  @override
  Stream<String> get onTokenRefresh => _messaging.onTokenRefresh;

  @override
  Future<String?> getToken() async {
    if (_platform == FcmPlatform.ios &&
        await _messaging.getAPNSToken() == null) {
      return null;
    }
    return _messaging.getToken();
  }

  @override
  Future<bool> requestPermission() async {
    final settings = await _messaging.requestPermission(
      alert: true,
      badge: true,
      sound: true,
    );
    return settings.authorizationStatus == AuthorizationStatus.authorized ||
        settings.authorizationStatus == AuthorizationStatus.provisional;
  }
}

class ApiFcmTokenTransport implements FcmTokenTransport {
  ApiFcmTokenTransport(this._api);

  final ApiClient _api;

  @override
  Future<void> register({
    required FcmTokenRegistration registration,
    required FcmPlatform platform,
  }) async {
    await _runRegistrationRequest(
      (cancelToken) => _api.post<void>(
        '/notifications/fcm-token',
        data: {
          'token': registration.token,
          'platform': platform.name,
          'registrationId': registration.registrationId,
        },
        cancelToken: cancelToken,
      ),
    );
  }

  @override
  Future<void> unregister(FcmTokenRegistration registration) async {
    // Do not cancel cleanup when another session starts. The API deletes only
    // this registration ID, so a late delete protects against a late old POST
    // without deleting the newer session's registration.
    await _api.delete<void>(
      '/notifications/fcm-token',
      data: {
        'token': registration.token,
        'registrationId': registration.registrationId,
      },
      cancelToken: CancelToken(),
    );
  }

  Future<void> _runRegistrationRequest(
    Future<Response<void>> Function(CancelToken cancelToken) request,
  ) async {
    await request(CancelToken());
  }
}

class SecureFcmTokenStore implements FcmTokenStore {
  static const _key = 'registered_fcm_registration';

  SecureFcmTokenStore(this._storage);

  final SecureStorageService _storage;

  @override
  Future<void> clearRegistration() => _storage.delete(_key);

  @override
  Future<FcmTokenRegistration?> readRegistration() async {
    final value = await _storage.get(_key);
    if (value == null) return null;
    try {
      final decoded = jsonDecode(value);
      if (decoded is! Map ||
          decoded['token'] is! String ||
          decoded['registrationId'] is! String) {
        return null;
      }
      final token = decoded['token'] as String;
      final registrationId = decoded['registrationId'] as String;
      if (token.isEmpty || registrationId.isEmpty) return null;
      return FcmTokenRegistration(token: token, registrationId: registrationId);
    } on FormatException {
      return null;
    }
  }

  @override
  Future<void> writeRegistration(FcmTokenRegistration registration) =>
      _storage.set(
        _key,
        jsonEncode({
          'token': registration.token,
          'registrationId': registration.registrationId,
        }),
      );
}

/// Missing public Firebase build configuration disables push registration; it
/// never prevents authentication or local notification features from working.
class FcmTokenSession {
  FcmTokenSession._();

  static FcmTokenLifecycle? _lifecycle;
  static Future<FcmTokenLifecycle?>? _initializing;
  static StreamSubscription<void>? _forcedLogoutSubscription;
  static Future<bool>? _notificationPreparation;
  static FcmNotificationPresenter? _notificationPresenter;
  static FcmDeepLinkHandler? _notificationNavigation;
  static final FcmTokenSessionCoordinator _coordinator =
      FcmTokenSessionCoordinator(
        resolveLifecycle: _resolveLifecycle,
        currentLifecycle: () => _lifecycle,
        pendingLifecycle: () => _initializing,
      );

  static void configureNotificationNavigation(FcmDeepLinkHandler onDeepLink) {
    _notificationNavigation = onDeepLink;
    _notificationPresenter?.setDeepLinkHandler(onDeepLink);
  }

  /// Starts tap handling before auth restoration so a terminated app launched
  /// from a notification can consume [FirebaseMessaging.getInitialMessage].
  static Future<void> initializeNotificationHandling() async {
    await _prepareNotifications();
  }

  static Future<void> activate() async {
    try {
      await _coordinator.activate();
    } catch (error) {
      debugPrint('FCM registration unavailable: ${error.runtimeType}');
    }
  }

  static Future<void> deactivate() => _coordinator.deactivate();

  static Future<void> invalidate() => _coordinator.invalidate();

  static Future<FcmTokenLifecycle?> _resolveLifecycle() async {
    final existing = _lifecycle;
    if (existing != null) return existing;

    final initializing = _initializing ??= _createLifecycle();
    try {
      final created = await initializing;
      if (created == null) return null;
      _lifecycle ??= created;
      _forcedLogoutSubscription ??= ApiClient.onLogout.listen((_) {
        unawaited(invalidate());
      });
      return _lifecycle;
    } finally {
      if (identical(_initializing, initializing)) {
        _initializing = null;
      }
    }
  }

  static Future<FcmTokenLifecycle?> _createLifecycle() async {
    if (kIsWeb) return null;

    final platform = switch (defaultTargetPlatform) {
      TargetPlatform.android => FcmPlatform.android,
      TargetPlatform.iOS => FcmPlatform.ios,
      _ => null,
    };
    if (platform == null || FirebaseFcmBuildOptions.current == null)
      return null;
    if (!await _prepareNotifications()) return null;

    return FcmTokenLifecycle(
      messaging: FirebaseMessagingGateway(FirebaseMessaging.instance, platform),
      transport: ApiFcmTokenTransport(ApiClient.instance),
      store: SecureFcmTokenStore(SecureStorageService.instance),
      platform: platform,
      reportRefreshFailure: (error, _) {
        debugPrint('FCM token refresh unavailable: ${error.runtimeType}');
      },
    );
  }

  static Future<bool> _prepareNotifications() {
    final pending = _notificationPreparation;
    if (pending != null) return pending;

    final preparation = _prepareNotificationsOnce();
    _notificationPreparation = preparation;
    preparation.whenComplete(() {
      if (identical(_notificationPreparation, preparation)) {
        _notificationPreparation = null;
      }
    });
    return preparation;
  }

  static Future<bool> _prepareNotificationsOnce() async {
    if (kIsWeb) return false;
    final platform = switch (defaultTargetPlatform) {
      TargetPlatform.android => FcmPlatform.android,
      TargetPlatform.iOS => FcmPlatform.ios,
      _ => null,
    };
    final options = FirebaseFcmBuildOptions.current;
    if (platform == null || options == null) return false;

    try {
      if (Firebase.apps.isEmpty) {
        await Firebase.initializeApp(options: options);
      }
    } on FirebaseException catch (error) {
      debugPrint('FCM initialization unavailable: ${error.code}');
      return false;
    } catch (error) {
      debugPrint('FCM initialization unavailable: ${error.runtimeType}');
      return false;
    }

    try {
      final presenter = _notificationPresenter ??= FcmNotificationPresenter(
        messaging: FirebaseMessaging.instance,
        localNotifications: FlutterLocalNotificationsPlugin(),
        platform: platform,
      );
      await presenter.start(onDeepLink: _notificationNavigation);
    } catch (error) {
      // Presentation is an enhancement; token registration must still work.
      debugPrint('FCM presentation unavailable: ${error.runtimeType}');
    }
    return true;
  }
}
