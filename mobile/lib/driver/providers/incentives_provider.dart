import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../shared/api/api_client.dart';

class DriverIncentive {
  final String id;
  final String title;
  final int rewardAmount;
  final int progress;
  final int target;
  final String endsAt;
  final bool completed;

  const DriverIncentive({
    required this.id,
    required this.title,
    required this.rewardAmount,
    required this.progress,
    required this.target,
    required this.endsAt,
    required this.completed,
  });

  factory DriverIncentive.fromJson(
    Map<String, dynamic> json, {
    required bool completed,
  }) {
    return DriverIncentive(
      id: json['id'] as String? ?? '',
      title: json['title'] as String? ?? '',
      rewardAmount: _readInt(json['rewardAmount']),
      progress: _readInt(json['progress']),
      target: _readInt(json['target']),
      endsAt: json['endsAt'] as String? ?? '',
      completed: completed,
    );
  }
}

class DriverIncentives {
  final List<DriverIncentive> active;
  final List<DriverIncentive> completed;

  const DriverIncentives({this.active = const [], this.completed = const []});

  factory DriverIncentives.fromJson(Map<String, dynamic> json) {
    return DriverIncentives(
      active: _readItems(json['active'], completed: false),
      completed: _readItems(json['completed'], completed: true),
    );
  }
}

final driverIncentivesProvider = FutureProvider<DriverIncentives>((ref) async {
  final response = await ApiClient.instance.get<Map<String, dynamic>>(
    '/driver/incentives',
  );
  return DriverIncentives.fromJson(response.data ?? const {});
});

List<DriverIncentive> _readItems(dynamic value, {required bool completed}) {
  if (value is! List) return const [];
  return value
      .whereType<Map<String, dynamic>>()
      .map((item) => DriverIncentive.fromJson(item, completed: completed))
      .toList(growable: false);
}

int _readInt(dynamic value) {
  if (value is num) return value.round();
  if (value is String) return int.tryParse(value) ?? 0;
  return 0;
}
