import 'package:flutter_riverpod/flutter_riverpod.dart';

class DailyEarning {
  final DateTime date;
  final int amount;
  final int tripCount;

  const DailyEarning({
    required this.date,
    required this.amount,
    required this.tripCount,
  });
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
  EarningsChartNotifier() : super(const EarningsChartState());

  Future<void> load(EarningsPeriod period) async {
    state = state.copyWith(isLoading: true, error: null, selectedPeriod: period);
    // TODO: Replace with real API GET /driver/earnings/summary?period=...
    await Future.delayed(const Duration(milliseconds: 500));
    final now = DateTime.now();
    final days = period == EarningsPeriod.sevenDays ? 7 : period == EarningsPeriod.thirtyDays ? 30 : 90;
    final rng = DateTime(now.year, now.month, now.day).hashCode;
    final byDay = List.generate(days, (i) {
      final date = now.subtract(Duration(days: days - 1 - i));
      final amount = 200000 + ((rng + i) % 5) * 80000;
      return DailyEarning(date: date, amount: amount, tripCount: 3 + ((rng + i) % 8));
    });
    final totalVnd = byDay.fold<int>(0, (sum, d) => sum + d.amount);
    state = state.copyWith(
      isLoading: false,
      summary: EarningsSummary(
        period: period.name,
        totalVnd: totalVnd,
        tripCount: byDay.fold<int>(0, (s, d) => s + d.tripCount),
        avgPerTrip: totalVnd ~/ byDay.fold<int>(0, (s, d) => s + d.tripCount).clamp(1, 9999),
        byDay: byDay,
      ),
    );
  }
}

final earningsChartProvider = StateNotifierProvider<EarningsChartNotifier, EarningsChartState>((ref) {
  return EarningsChartNotifier();
});
