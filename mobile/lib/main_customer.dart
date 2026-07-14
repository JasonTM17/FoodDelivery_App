import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'l10n/app_localizations.dart';
import 'shared/providers/locale_provider.dart';
import 'shared/theme/app_theme.dart';
import 'shared/notifications/firebase_fcm_token_session.dart';
import 'customer/router/app_router.dart';

void main() {
  WidgetsFlutterBinding.ensureInitialized();
  FcmTokenSession.configureNotificationNavigation(_handleCustomerPushTap);
  runApp(const ProviderScope(child: CustomerApp()));
  unawaited(FcmTokenSession.initializeNotificationHandling());
}

void _handleCustomerPushTap(String deepLink) {
  final path = Uri.parse(deepLink).path;
  final isSupported =
      path == '/notifications' ||
      path == '/orders' ||
      path.startsWith('/orders/');
  appRouter.go(isSupported ? deepLink : '/notifications');
}

class CustomerApp extends ConsumerWidget {
  const CustomerApp({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final locale = ref.watch(localeProvider);
    return MaterialApp.router(
      title: 'FoodFlow',
      debugShowCheckedModeBanner: false,
      theme: AppTheme.lightTheme,
      routerConfig: appRouter,
      locale: locale,
      localizationsDelegates: AppLocalizations.localizationsDelegates,
      supportedLocales: AppLocalizations.supportedLocales,
    );
  }
}
