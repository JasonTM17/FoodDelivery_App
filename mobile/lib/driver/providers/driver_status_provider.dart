import 'dart:async';

import 'package:flutter_riverpod/flutter_riverpod.dart';

import 'driver_provider.dart';

enum DriverOnlineStatus { online, offline, paused }

const _driverStatusUnset = Object();

class DriverStatus {
  final DriverOnlineStatus status;
  final DateTime? pausedUntil;
  final Duration? pausedDuration;
  final Duration totalOnlineToday;

  const DriverStatus({
    this.status = DriverOnlineStatus.offline,
    this.pausedUntil,
    this.pausedDuration,
    this.totalOnlineToday = Duration.zero,
  });

  DriverStatus copyWith({
    DriverOnlineStatus? status,
    Object? pausedUntil = _driverStatusUnset,
    Object? pausedDuration = _driverStatusUnset,
    Duration? totalOnlineToday,
  }) {
    return DriverStatus(
      status: status ?? this.status,
      pausedUntil: identical(pausedUntil, _driverStatusUnset)
          ? this.pausedUntil
          : pausedUntil as DateTime?,
      pausedDuration: identical(pausedDuration, _driverStatusUnset)
          ? this.pausedDuration
          : pausedDuration as Duration?,
      totalOnlineToday: totalOnlineToday ?? this.totalOnlineToday,
    );
  }
}

class DriverStatusNotifier extends StateNotifier<DriverStatus> {
  DriverStatusNotifier(this.ref) : super(const DriverStatus());

  final Ref ref;
  Timer? _pauseTimer;
  bool _isDisposed = false;

  Future<void> setOnline() async {
    _pauseTimer?.cancel();
    _pauseTimer = null;

    // Resuming must relinquish the local paused presentation before the
    // canonical driver flow publishes its GPS-backed availability state.
    if (state.status == DriverOnlineStatus.paused) {
      state = state.copyWith(
        status: DriverOnlineStatus.offline,
        pausedUntil: null,
        pausedDuration: null,
      );
    }

    await ref.read(driverProvider.notifier).goOnlineWithGps();
    syncFromDriver(ref.read(driverProvider));
  }

  Future<void> setOffline() async {
    _pauseTimer?.cancel();
    _pauseTimer = null;
    await ref.read(driverProvider.notifier).goOffline();
    syncFromDriver(ref.read(driverProvider));
  }

  Future<void> pauseFor(Duration duration) async {
    _pauseTimer?.cancel();
    _pauseTimer = null;

    await ref.read(driverProvider.notifier).goOffline();
    if (_isDisposed) return;

    final driverState = ref.read(driverProvider);
    if (!driverState.isAuthenticated || driverState.isOnline) {
      syncFromDriver(driverState);
      return;
    }

    final until = DateTime.now().add(duration);
    state = state.copyWith(
      status: DriverOnlineStatus.paused,
      pausedUntil: until,
      pausedDuration: duration,
      totalOnlineToday: _onlineDuration(driverState),
    );
    _pauseTimer = Timer(duration, _expirePause);
  }

  Future<void> resume() => setOnline();

  void syncFromDriver(DriverState driverState) {
    if (_isDisposed) return;

    final totalOnlineToday = _onlineDuration(driverState);
    if (!driverState.isAuthenticated) {
      _pauseTimer?.cancel();
      _pauseTimer = null;
      state = DriverStatus(
        status: DriverOnlineStatus.offline,
        totalOnlineToday: totalOnlineToday,
      );
      return;
    }

    if (state.status == DriverOnlineStatus.paused && !driverState.isOnline) {
      state = state.copyWith(totalOnlineToday: totalOnlineToday);
      return;
    }

    state = state.copyWith(
      status: driverState.isOnline
          ? DriverOnlineStatus.online
          : DriverOnlineStatus.offline,
      pausedUntil: null,
      pausedDuration: null,
      totalOnlineToday: totalOnlineToday,
    );
  }

  void _expirePause() {
    if (_isDisposed) return;

    _pauseTimer = null;
    final driverState = ref.read(driverProvider);
    state = state.copyWith(
      status: driverState.isOnline
          ? DriverOnlineStatus.online
          : DriverOnlineStatus.offline,
      pausedUntil: null,
      pausedDuration: null,
      totalOnlineToday: _onlineDuration(driverState),
    );
  }

  Duration _onlineDuration(DriverState driverState) {
    return Duration(minutes: driverState.todayStats.onlineMinutes ?? 0);
  }

  @override
  void dispose() {
    _isDisposed = true;
    _pauseTimer?.cancel();
    super.dispose();
  }
}

final driverStatusProvider =
    StateNotifierProvider<DriverStatusNotifier, DriverStatus>((ref) {
      final notifier = DriverStatusNotifier(ref);
      ref.listen<DriverState>(driverProvider, (previous, next) {
        notifier.syncFromDriver(next);
      }, fireImmediately: true);
      return notifier;
    });
