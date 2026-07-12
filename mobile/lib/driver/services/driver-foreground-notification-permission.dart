import 'package:flutter/foundation.dart';
import 'package:permission_handler/permission_handler.dart';

/// Notification permission is only a runtime permission on modern Android.
/// Tracking remains available when a driver declines it; Android still exposes
/// the foreground service in Task Manager, while the app can ask again from a
/// future, explicit Online action.
bool shouldRequestDriverForegroundNotificationPermission(
  TargetPlatform platform,
  PermissionStatus status,
) {
  return platform == TargetPlatform.android && status.isDenied;
}

/// Requests Android notification permission when the driver explicitly starts
/// foreground GPS tracking. It intentionally does not run during app launch.
Future<void> requestDriverForegroundNotificationPermission() async {
  if (defaultTargetPlatform != TargetPlatform.android) return;

  try {
    final status = await Permission.notification.status;
    if (!shouldRequestDriverForegroundNotificationPermission(
      defaultTargetPlatform,
      status,
    )) {
      return;
    }

    await Permission.notification.request();
  } catch (error) {
    // A notification prompt is useful but must never block an explicit GPS
    // tracking request when a platform plugin is temporarily unavailable.
    if (kDebugMode) {
      debugPrint(
        'Foreground notification permission check failed: ${error.runtimeType}',
      );
    }
  }
}
