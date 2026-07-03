import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../shared/api/api_client.dart';

class DailyEarning {
  final DateTime date;
  final int amount;
  final int tripCount;

  const DailyEarning({
    required this.date,
    required this.amount,
    required this.tripCount,
  });

  factory DailyEarning.fromJson(Map<String, dynamic> json) {
    return DailyEarning(
      date: DateTime.tryParse(json['date'] as String? ?? '') ?? DateTime(1970),
      amount: _readInt(json['amount']),
      tripCount: _readInt(json['tripCount']),
    );
  }
}

class EarningsSummary {
  final String period;
  final int totalVnd;
  final int tripCount;
  final int avgPerTrip;
  final List<DailyEarning> byDay;

  const EarningsSummary({
    required this.period,
    required this.totalVnd,
    required this.tripCount,
    required this.avgPerTrip,
    required this.byDay,
  });

  factory EarningsSummary.fromJson(Map<String, dynamic> json) {
    final days = (json['byDay'] as List<dynamic>? ?? const [])
        .whereType<Map<String, dynamic>>()
        .map(DailyEarning.fromJson)
        .toList(growable: false);
    return EarningsSummary(
      period: json['period'] as String? ?? '7d',
      totalVnd: _readInt(json['totalVnd']),
      tripCount: _readInt(json['tripCount']),
      avgPerTrip: _readInt(json['avgPerTrip']),
      byDay: days,
    );
  }
}

enum EarningsPeriod { sevenDays, thirtyDays, ninetyDays }

class EarningsChartState {
  final EarningsSummary? summary;
  final bool isLoading;
  final String? error;
  final EarningsPeriod selectedPeriod;

  const EarningsChartState({
    this.summary,
    this.isLoading = false,
    this.error,
    this.selectedPeriod = EarningsPeriod.sevenDays,
  });

  EarningsChartState copyWith({
    EarningsSummary? summary,
    bool? isLoading,
    String? error,
    EarningsPeriod? selectedPeriod,
  }) {
    return EarningsChartState(
      summary: summary ?? this.summary,
      isLoading: isLoading ?? this.isLoading,
      error: error,
      selectedPeriod: selectedPeriod ?? this.selectedPeriod,
    );
  }
}

class EarningsChartNotifier extends StateNotifier<EarningsChartState> {
  final ApiClient _api;

  EarningsChartNotifier({ApiClient? api})
    : _api = api ?? ApiClient.instance,
      super(const EarningsChartState());

  Future<void> load(EarningsPeriod period) async {
    state = state.copyWith(
      isLoading: true,
      error: null,
      selectedPeriod: period,
    );
    try {
      final response = await _api.get<Map<String, dynamic>>(
        '/driver/earnings/summary',
        queryParameters: {'period': period.apiValue},
      );
      state = state.copyWith(
        isLoading: false,
        summary: EarningsSummary.fromJson(response.data ?? const {}),
        error: null,
      );
    } catch (_) {
      state = state.copyWith(
        isLoading: false,
        error: 'DRIVER_EARNINGS_SUMMARY_UNAVAILABLE',
      );
    }
  }
}

final earningsChartProvider =
    StateNotifierProvider<EarningsChartNotifier, EarningsChartState>((ref) {
      return EarningsChartNotifier();
    });

extension EarningsPeriodApiValue on EarningsPeriod {
  String get apiValue {
    return switch (this) {
      EarningsPeriod.sevenDays => '7d',
      EarningsPeriod.thirtyDays => '30d',
      EarningsPeriod.ninetyDays => '90d',
    };
  }
}

int _readInt(dynamic value) {
  if (value is num) return value.round();
  if (value is String) return int.tryParse(value) ?? 0;
  return 0;
}
