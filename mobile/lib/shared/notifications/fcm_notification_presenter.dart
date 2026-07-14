import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:flutter_local_notifications/flutter_local_notifications.dart';

import 'fcm_token_lifecycle.dart';

typedef FcmDeepLinkHandler = void Function(String deepLink);

const _androidChannel = AndroidNotificationChannel(
  'foodflow_notifications',
  'FoodFlow notifications',
  description: 'Order, delivery, and account notifications',
  importance: Importance.high,
);

const _androidNotificationDetails = AndroidNotificationDetails(
  'foodflow_notifications',
  'FoodFlow notifications',
  channelDescription: 'Order, delivery, and account notifications',
  importance: Importance.high,
  priority: Priority.high,
);

/// Routes foreground FCM messages to an Android system notification and handles
/// FCM/local-notification taps with a validated in-app deep link.
class FcmNotificationPresenter {
  FcmNotificationPresenter({
    required FirebaseMessaging messaging,
    required FlutterLocalNotificationsPlugin localNotifications,
    required FcmPlatform platform,
  }) : _messaging = messaging,
       _localNotifications = localNotifications,
       _platform = platform;

  final FirebaseMessaging _messaging;
  final FlutterLocalNotificationsPlugin _localNotifications;
  final FcmPlatform _platform;
  FcmDeepLinkHandler? _onDeepLink;
  var _started = false;

  Future<void> start({FcmDeepLinkHandler? onDeepLink}) async {
    _onDeepLink = onDeepLink;
    if (_started) return;

    await _localNotifications.initialize(
      const InitializationSettings(
        android: AndroidInitializationSettings('@mipmap/ic_launcher'),
        iOS: DarwinInitializationSettings(),
      ),
      onDidReceiveNotificationResponse: (response) {
        _navigate(response.payload);
      },
    );

    if (_platform == FcmPlatform.android) {
      final android = _localNotifications
          .resolvePlatformSpecificImplementation<
            AndroidFlutterLocalNotificationsPlugin
          >();
      await android?.createNotificationChannel(_androidChannel);
    } else {
      await _messaging.setForegroundNotificationPresentationOptions(
        alert: true,
        badge: true,
        sound: true,
      );
    }

    _handleTap(await _messaging.getInitialMessage());
    FirebaseMessaging.onMessage.listen(_showForegroundNotification);
    FirebaseMessaging.onMessageOpenedApp.listen(_handleTap);
    _started = true;
  }

  void setDeepLinkHandler(FcmDeepLinkHandler? onDeepLink) {
    _onDeepLink = onDeepLink;
  }

  Future<void> _showForegroundNotification(RemoteMessage message) async {
    if (_platform != FcmPlatform.android) return;
    final notification = message.notification;
    if (notification == null) return;

    await _localNotifications.show(
      message.messageId?.hashCode ?? DateTime.now().microsecondsSinceEpoch,
      notification.title ?? 'FoodFlow',
      notification.body ?? '',
      const NotificationDetails(android: _androidNotificationDetails),
      payload: fcmDeepLinkFromData(message.data),
    );
  }

  void _handleTap(RemoteMessage? message) {
    if (message == null) return;
    _navigate(fcmDeepLinkFromData(message.data));
  }

  void _navigate(String? deepLink) {
    if (deepLink != null) _onDeepLink?.call(deepLink);
  }
}

/// Rejects external URLs so a server payload can only navigate within the app.
String? fcmDeepLinkFromData(Map<String, dynamic> data) {
  final candidate = data['deepLink'];
  if (candidate is! String || candidate.isEmpty) return null;

  final uri = Uri.tryParse(candidate);
  if (uri == null ||
      uri.hasScheme ||
      uri.hasAuthority ||
      !uri.path.startsWith('/')) {
    return null;
  }
  return candidate;
}
