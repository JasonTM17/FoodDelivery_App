import 'dart:async';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'driver_provider.dart';

enum DriverOnlineStatus { online, offline, paused }

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
    DateTime? pausedUntil,
    Duration? pausedDuration,
    Duration? totalOnlineToday,
  }) {
    return DriverStatus(
      status: status ?? this.status,
      pausedUntil: pausedUntil ?? this.pausedUntil,
      pausedDuration: pausedDuration ?? this.pausedDuration,
      totalOnlineToday: totalOnlineToday ?? this.totalOnlineToday,
    );
  }
}

class DriverStatusNotifier extends StateNotifier<DriverStatus> {
  final Ref ref;
  Timer? _pauseTimer;

  DriverStatusNotifier(this.ref) : super(const DriverStatus());

  void setOnline() {
    _pauseTimer?.cancel();
    state = state.copyWith(
      status: DriverOnlineStatus.online,
      pausedUntil: null,
      pausedDuration: null,
    );
  }

  void setOffline() {
    _pauseTimer?.cancel();
    state = state.copyWith(
      status: DriverOnlineStatus.offline,
      pausedUntil: null,
      pausedDuration: null,
    );
  }

  void pauseFor(Duration duration) {
    _pauseTimer?.cancel();
    final until = DateTime.now().add(duration);
    state = state.copyWith(
      status: DriverOnlineStatus.paused,
      pausedUntil: until,
      pausedDuration: duration,
    );
    _pauseTimer = Timer(duration, () {
      state = state.copyWith(
        status: DriverOnlineStatus.offline,
        pausedUntil: null,
        pausedDuration: null,
      );
    });
  }

  void resume() {
    _pauseTimer?.cancel();
    state = state.copyWith(
      status: DriverOnlineStatus.online,
      pausedUntil: null,
      pausedDuration: null,
    );
    ref.read(driverProvider.notifier).goOnlineWithGps();
  }

  @override
  void dispose() {
    _pauseTimer?.cancel();
    super.dispose();
  }
}

final driverStatusProvider =
    StateNotifierProvider<DriverStatusNotifier, DriverStatus>((ref) {
      return DriverStatusNotifier(ref);
    });
