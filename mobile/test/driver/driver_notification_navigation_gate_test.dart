import 'package:flutter_test/flutter_test.dart';
import 'package:foodflow_customer/driver/main_driver.dart';
import 'package:foodflow_customer/driver/providers/driver_provider.dart';

void main() {
  group('driverAuthRedirect', () {
    test('waits for session restoration before redirecting', () {
      expect(
        driverAuthRedirect(
          location: '/earnings',
          authState: const DriverState(isLoading: true),
        ),
        isNull,
      );
    });

    test('protects private routes and leaves authenticated routes', () {
      expect(
        driverAuthRedirect(
          location: '/earnings',
          authState: const DriverState(),
        ),
        '/login',
      );
      expect(
        driverAuthRedirect(
          location: '/login',
          authState: const DriverState(isAuthenticated: true),
        ),
        '/home',
      );
    });
  });

  group('DriverNotificationNavigationGate', () {
    test('replays one pending notification after authentication', () {
      final gate = DriverNotificationNavigationGate();

      expect(
        gate.handleTap(
          '/earnings?period=week',
          const DriverState(isLoading: true),
        ),
        isNull,
      );
      expect(
        gate.handleAuthState(const DriverState(isAuthenticated: true)),
        '/earnings?period=week',
      );
      expect(
        gate.handleAuthState(const DriverState(isAuthenticated: true)),
        isNull,
      );
    });

    test('clears pending navigation when restoration finds no session', () {
      final gate = DriverNotificationNavigationGate();
      gate.handleTap('/profile', const DriverState(isLoading: true));

      expect(gate.handleAuthState(const DriverState()), isNull);
      expect(
        gate.handleAuthState(const DriverState(isAuthenticated: true)),
        isNull,
      );
    });

    test('falls back to the notification inbox for unsupported paths', () {
      final gate = DriverNotificationNavigationGate();

      expect(
        gate.handleTap('/unknown', const DriverState(isAuthenticated: true)),
        '/notifications',
      );
    });
  });
}
