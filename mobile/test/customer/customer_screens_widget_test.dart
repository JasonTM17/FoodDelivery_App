import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:go_router/go_router.dart';

import 'package:foodflow_customer/customer/screens/login_screen.dart';
import 'package:foodflow_customer/customer/screens/notifications_screen.dart';
import 'package:foodflow_customer/customer/screens/cart_screen.dart';
import 'package:foodflow_customer/l10n/app_localizations.dart';
import 'package:foodflow_customer/shared/providers/auth_provider.dart';
import 'package:foodflow_customer/customer/providers/notification_provider.dart';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

Widget _wrap(Widget child, {List<Override>? overrides}) {
  return ProviderScope(
    overrides: overrides ?? const [],
    child: MaterialApp(
      locale: const Locale('vi'),
      localizationsDelegates: AppLocalizations.localizationsDelegates,
      supportedLocales: AppLocalizations.supportedLocales,
      home: child,
    ),
  );
}

// Fake AuthNotifier — no API calls, controlled state.
class _FakeAuthNotifier extends AuthNotifier {
  final AuthState preset;
  _FakeAuthNotifier(this.preset) {
    state =
        preset; // StateNotifier.state setter is protected, accessible to subclass
  }

  @override
  Future<void> checkAuthStatus() async {}

  @override
  Future<void> login({required String email, required String password}) async {}

  @override
  Future<void> logout() async {
    state = const AuthState(isInitialized: true);
  }

  @override
  Future<void> register({
    required String fullName,
    required String email,
    required String phone,
    required String password,
    String role = 'customer',
  }) async {}

  @override
  Future<void> updateProfile(Map<String, dynamic> data) async {}
}

// Fake NotificationNotifier — skips API + WS, returns preset state.
class _FakeNotifNotifier extends NotificationNotifier {
  final NotificationState preset;
  _FakeNotifNotifier(this.preset);

  @override
  Future<void> fetchNotifications() async {
    state = preset;
  }

  @override
  Future<void> markRead(String id) async {}
}

// ---------------------------------------------------------------------------
// LoginScreen tests
// ---------------------------------------------------------------------------

void main() {
  group('LoginScreen', () {
    testWidgets('renders email, password fields and submit button', (
      tester,
    ) async {
      await tester.pumpWidget(_wrap(const LoginScreen()));
      await tester.pump();

      expect(find.byType(TextFormField), findsNWidgets(2));
      expect(find.text('Đăng nhập'), findsWidgets);
      expect(find.bySemanticsLabel('FoodFlow'), findsOneWidget);
      expect(find.byTooltip('Hiện mật khẩu'), findsOneWidget);
    });

    testWidgets('shows validation error when fields are empty on submit', (
      tester,
    ) async {
      await tester.pumpWidget(_wrap(const LoginScreen()));
      await tester.pump();

      // Tap submit without filling fields
      final submitBtn = find.widgetWithText(ElevatedButton, 'Đăng nhập');
      expect(submitBtn, findsOneWidget);
      await tester.tap(submitBtn);
      await tester.pump();

      expect(find.text('Vui lòng nhập email'), findsOneWidget);
    });

    testWidgets('displays auth error banner from provider state', (
      tester,
    ) async {
      await tester.pumpWidget(
        _wrap(
          const LoginScreen(),
          overrides: [
            authProvider.overrideWith(
              (ref) =>
                  _FakeAuthNotifier(const AuthState(error: 'Sai mật khẩu')),
            ),
          ],
        ),
      );
      await tester.pump();

      expect(find.text('Sai mật khẩu'), findsOneWidget);
    });

    testWidgets('register link navigates away', (tester) async {
      final router = GoRouter(
        routes: [
          GoRoute(path: '/', builder: (context, state) => const LoginScreen()),
          GoRoute(
            path: '/register',
            builder: (context, state) =>
                const Scaffold(body: Text('RegisterPage')),
          ),
        ],
      );

      await tester.pumpWidget(
        ProviderScope(
          child: MaterialApp.router(
            locale: const Locale('vi'),
            localizationsDelegates: AppLocalizations.localizationsDelegates,
            supportedLocales: AppLocalizations.supportedLocales,
            routerConfig: router,
          ),
        ),
      );
      await tester.pump();

      await tester.tap(find.text('Đăng ký'));
      await tester.pumpAndSettle();

      expect(find.text('RegisterPage'), findsOneWidget);
    });
  });

  // -------------------------------------------------------------------------
  // NotificationsScreen tests
  // -------------------------------------------------------------------------

  group('NotificationsScreen', () {
    testWidgets('shows shimmer while loading', (tester) async {
      await tester.pumpWidget(
        _wrap(
          const NotificationsScreen(),
          overrides: [
            notificationProvider.overrideWith(
              (ref) =>
                  _FakeNotifNotifier(const NotificationState(isLoading: true)),
            ),
          ],
        ),
      );
      await tester.pump();

      // Loading shimmer is rendered as the body
      expect(find.byType(NotificationsScreen), findsOneWidget);
    });

    testWidgets('shows empty state when no notifications', (tester) async {
      await tester.pumpWidget(
        _wrap(
          const NotificationsScreen(),
          overrides: [
            notificationProvider.overrideWith(
              (ref) => _FakeNotifNotifier(const NotificationState()),
            ),
          ],
        ),
      );
      await tester.pump();
      // Trigger postFrameCallback (fetchNotifications → sets empty state)
      await tester.pump(const Duration(milliseconds: 50));

      expect(find.text('Không có thông báo'), findsWidgets);
    });

    testWidgets('shows notification title when data is loaded', (tester) async {
      final notif = NotificationModel(
        id: '1',
        type: 'order',
        title: 'Đơn hàng đã xác nhận',
        body: 'Nhà hàng đang chuẩn bị đơn của bạn',
        createdAt: DateTime(2026, 1, 1),
        isRead: false,
      );

      await tester.pumpWidget(
        _wrap(
          const NotificationsScreen(),
          overrides: [
            notificationProvider.overrideWith(
              (ref) =>
                  _FakeNotifNotifier(NotificationState(notifications: [notif])),
            ),
          ],
        ),
      );
      await tester.pump();
      await tester.pump(const Duration(milliseconds: 50));

      expect(find.text('Đơn hàng đã xác nhận'), findsOneWidget);
    });

    testWidgets('groups canonical order events into the orders tab', (
      tester,
    ) async {
      final notification = NotificationModel(
        id: 'order-1',
        type: 'order_update',
        title: 'Canonical order event',
        body: 'Order status changed',
        createdAt: DateTime(2026, 1, 1),
        isRead: false,
      );

      await tester.pumpWidget(
        _wrap(
          const NotificationsScreen(),
          overrides: [
            notificationProvider.overrideWith(
              (ref) => _FakeNotifNotifier(
                NotificationState(notifications: [notification]),
              ),
            ),
          ],
        ),
      );
      await tester.pumpAndSettle();

      await tester.tap(find.widgetWithText(Tab, 'Đơn hàng'));
      await tester.pumpAndSettle();
      expect(find.text('Canonical order event'), findsOneWidget);
      expect(find.text('Đơn hàng'), findsWidgets);
      expect(find.byIcon(Icons.receipt_long_outlined), findsOneWidget);
    });

    testWidgets('groups namespaced promotion events into the promotions tab', (
      tester,
    ) async {
      final notification = NotificationModel(
        id: 'promotion-1',
        type: 'promotion.broadcast',
        title: 'Canonical promotion event',
        body: 'A restaurant published a promotion',
        createdAt: DateTime(2026, 1, 1),
        isRead: false,
      );

      await tester.pumpWidget(
        _wrap(
          const NotificationsScreen(),
          overrides: [
            notificationProvider.overrideWith(
              (ref) => _FakeNotifNotifier(
                NotificationState(notifications: [notification]),
              ),
            ),
          ],
        ),
      );
      await tester.pumpAndSettle();

      await tester.tap(find.widgetWithText(Tab, 'Khuyến mãi'));
      await tester.pumpAndSettle();
      expect(find.text('Canonical promotion event'), findsOneWidget);
      expect(find.text('Khuyến mãi'), findsWidgets);
      expect(find.byIcon(Icons.local_offer_outlined), findsOneWidget);
    });
  });

  // -------------------------------------------------------------------------
  // CartScreen tests
  // -------------------------------------------------------------------------

  group('CartScreen', () {
    testWidgets('shows empty state when cart is empty', (tester) async {
      await tester.pumpWidget(_wrap(const CartScreen()));
      await tester.pump();

      expect(find.text('Giỏ hàng trống'), findsWidgets);
    });
  });
}
