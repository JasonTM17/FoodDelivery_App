import 'package:flutter/foundation.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:foodflow_customer/driver/services/driver-foreground-notification-permission.dart';
import 'package:permission_handler/permission_handler.dart';

void main() {
  group('foreground location notification permission', () {
    test('requests only for a denied Android notification permission', () {
      expect(
        shouldRequestDriverForegroundNotificationPermission(
          TargetPlatform.android,
          PermissionStatus.denied,
        ),
        isTrue,
      );
      expect(
        shouldRequestDriverForegroundNotificationPermission(
          TargetPlatform.android,
          PermissionStatus.granted,
        ),
        isFalse,
      );
      expect(
        shouldRequestDriverForegroundNotificationPermission(
          TargetPlatform.iOS,
          PermissionStatus.denied,
        ),
        isFalse,
      );
    });
  });
}
