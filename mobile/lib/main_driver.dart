import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import 'driver/main_driver.dart' as app;
import 'shared/notifications/firebase_fcm_token_session.dart';

void main() {
  WidgetsFlutterBinding.ensureInitialized();
  app.configureDriverFcmNavigation();
  runApp(const ProviderScope(child: app.DriverApp()));
  unawaited(FcmTokenSession.initializeNotificationHandling());
}
