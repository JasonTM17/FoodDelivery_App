import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:foodflow_customer/driver/providers/driver_provider.dart';
import 'package:foodflow_customer/driver/providers/driver_status_provider.dart';

class _CanonicalDriverNotifier extends DriverNotifier {
  _CanonicalDriverNotifier({this.canGoOnline = true, this.canGoOffline = true});

  final bool canGoOnline;
  final bool canGoOffline;
  int goOnlineCalls = 0;
  int goOfflineCalls = 0;

  void seed(DriverState value) {
    state = value;
  }

  @override
  Future<void> goOnlineWithGps() async {
    goOnlineCalls += 1;
    if (canGoOnline) {
      state = state.copyWith(isOnline: true);
    }
  }

  @override
  Future<void> goOffline() async {
    goOfflineCalls += 1;
    if (canGoOffline) {
      state = state.copyWith(isOnline: false);
    }
  }
}

ProviderContainer _containerFor(_CanonicalDriverNotifier driver) {
  return ProviderContainer(
    overrides: [driverProvider.overrideWith((ref) => driver)],
  );
}

void main() {
  test('availability status mirrors the canonical driver state at startup', () {
    final driver = _CanonicalDriverNotifier()
      ..seed(const DriverState(isAuthenticated: true, isOnline: true));
    final container = _containerFor(driver);
    addTearDown(container.dispose);

    expect(
      container.read(driverStatusProvider).status,
      DriverOnlineStatus.online,
    );
  });

  test(
    'online and offline actions delegate to the canonical driver flow',
    () async {
      final driver = _CanonicalDriverNotifier()
        ..seed(const DriverState(isAuthenticated: true));
      final container = _containerFor(driver);
      addTearDown(container.dispose);
      final status = container.read(driverStatusProvider.notifier);

      status.setOnline();
      await Future<void>.delayed(Duration.zero);

      expect(driver.goOnlineCalls, 1);
      expect(
        container.read(driverStatusProvider).status,
        DriverOnlineStatus.online,
      );

      status.setOffline();
      await Future<void>.delayed(Duration.zero);

      expect(driver.goOfflineCalls, 1);
      expect(
        container.read(driverStatusProvider).status,
        DriverOnlineStatus.offline,
      );
    },
  );

  test('pausing takes the driver offline through the canonical flow', () async {
    final driver = _CanonicalDriverNotifier()
      ..seed(const DriverState(isAuthenticated: true, isOnline: true));
    final container = _containerFor(driver);
    addTearDown(container.dispose);

    await container
        .read(driverStatusProvider.notifier)
        .pauseFor(const Duration(hours: 1));

    expect(driver.goOfflineCalls, 1);
    expect(
      container.read(driverStatusProvider).status,
      DriverOnlineStatus.paused,
    );
    expect(container.read(driverStatusProvider).pausedUntil, isNotNull);
  });

  test(
    'resuming delegates back to the canonical GPS activation flow',
    () async {
      final driver = _CanonicalDriverNotifier()
        ..seed(const DriverState(isAuthenticated: true, isOnline: true));
      final container = _containerFor(driver);
      addTearDown(container.dispose);
      final status = container.read(driverStatusProvider.notifier);

      await status.pauseFor(const Duration(hours: 1));
      await status.resume();

      expect(driver.goOfflineCalls, 1);
      expect(driver.goOnlineCalls, 1);
      expect(
        container.read(driverStatusProvider).status,
        DriverOnlineStatus.online,
      );
      expect(container.read(driverStatusProvider).pausedUntil, isNull);
    },
  );

  test('failed GPS activation never presents an online status', () async {
    final driver = _CanonicalDriverNotifier(canGoOnline: false);
    final container = _containerFor(driver);
    addTearDown(container.dispose);

    container.read(driverStatusProvider.notifier).setOnline();
    await Future<void>.delayed(Duration.zero);

    expect(driver.goOnlineCalls, 1);
    expect(
      container.read(driverStatusProvider).status,
      DriverOnlineStatus.offline,
    );
  });

  test(
    'a failed canonical offline transition never enters paused state',
    () async {
      final driver = _CanonicalDriverNotifier(canGoOffline: false)
        ..seed(const DriverState(isAuthenticated: true, isOnline: true));
      final container = _containerFor(driver);
      addTearDown(container.dispose);

      await container
          .read(driverStatusProvider.notifier)
          .pauseFor(const Duration(hours: 1));

      expect(driver.goOfflineCalls, 1);
      expect(
        container.read(driverStatusProvider).status,
        DriverOnlineStatus.online,
      );
    },
  );
}
